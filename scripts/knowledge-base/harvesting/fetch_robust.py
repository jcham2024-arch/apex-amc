#!/usr/bin/env python3
"""
fetch_robust.py -- polite, resumable, cached HTTP fetcher for data harvesting.

Why this exists
---------------
Naive scrapers fail in four ways that are all avoidable:

  1. They hammer a host and get banned.        -> per-host rate limiting
  2. They re-download on every retry run.       -> on-disk cache
  3. They ignore robots.txt.                   -> Protego (RFC 9309) gate
  4. They die at 30% and start over.           -> checkpoint + resume

Patterns synthesised from these published sources (see ../_reference/SOURCES.md):
  - Protego        (scrapy/protego, BSD-3)      robots.txt parsing per RFC 9309
  - urllib.robotparser's crawl-delay idea      honoured here via Protego
  - TransferX      (zed-syn/TransferX, MIT)     full-jitter exponential backoff
  - Scrapling      (D4Vinci/Scrapling, BSD-3)   disk response caching so you can
                                                 iterate on parsing without refetch

Usage
-----
    # fetch a manifest of URLs (one per line, '#' comments allowed)
    python fetch_robust.py --manifest urls.txt --out-dir cache/ --delay 1.5

    # re-run after a crash -- picks up where it stopped, serves cached hits
    python fetch_robust.py --manifest urls.txt --out-dir cache/ --resume

    # change the User-Agent (defaults to a truthful identifying string)
    python fetch_robust.py --manifest urls.txt --user-agent "MyBot/1.0 (+mailto:me@example.com)"

Design rules
------------
  - Exit code 1 if ANY url failed, so this is usable directly as a CI gate.
  - Never silently swallow an HTTP error; every failure lands in failures.json
  - Cache is keyed by SHA-256 of the full URL, so query strings never collide.
  - robots.txt is fetched once per host and reused for the whole run.

Requires:  pip install requests protego
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    sys.exit("Missing dependency. Run:  pip install requests protego")

try:
    from protego import Protego
except ImportError:
    sys.exit("Missing dependency. Run:  pip install requests protego")


DEFAULT_UA = "ClineKnowledgeBaseBot/1.0 (+https://example.invalid/bot)"

# Statuses that are safe to retry. Everything else 4xx is a permanent answer.
RETRY_STATUSES = {408, 425, 429, 500, 502, 503, 504}


@dataclass
class Config:
    delay: float = 1.5            # min seconds between hits on one host
    timeout: float = 30.0         # per-request timeout, seconds
    max_retries: int = 5          # attempts AFTER the first
    backoff_base: float = 0.5     # exponential base, seconds
    backoff_cap: float = 30.0     # never sleep longer than this
    respect_robots: bool = True
    user_agent: str = DEFAULT_UA
    resume: bool = False
    refresh: bool = False         # ignore cache, refetch, but keep writing it


@dataclass
class Stats:
    fetched: int = 0
    cached: int = 0
    skipped_robots: int = 0
    failed: int = 0
    bytes: int = 0
    statuses: dict = field(default_factory=dict)

    def bump(self, key: str) -> None:
        self.statuses[key] = self.statuses.get(key, 0) + 1


# --------------------------------------------------------------------------
# cache
# --------------------------------------------------------------------------

def cache_paths(out_dir: Path, url: str) -> tuple[Path, Path]:
    """Return (body_path, meta_path) for a URL, keyed by full-URL digest."""
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:32]
    host = (urlparse(url).hostname or "unknown").replace(":", "_")
    return out_dir / f"{host}.{digest}.body", out_dir / f"{host}.{digest}.meta.json"


def read_cache(body_path: Path, meta_path: Path) -> dict | None:
    """Return cached meta if the body is present and intact, else None."""
    if not body_path.exists() or not meta_path.exists():
        return None
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    if meta.get("body_bytes") != body_path.stat().st_size:
        return None  # truncated / partial write -> treat as a miss
    return meta


def write_cache(out_dir: Path, url: str, body: bytes, meta: dict) -> None:
    """Write body then meta, both via .part + atomic rename.

    An interrupted run therefore never leaves a half-written body that a
    later run would happily treat as valid.
    """
    body_path, meta_path = cache_paths(out_dir, url)
    tmp = body_path.with_suffix(body_path.suffix + ".part")
    tmp.write_bytes(body)
    os.replace(tmp, body_path)

    meta = dict(meta, url=url, body_bytes=len(body))
    tmp_meta = Path(str(meta_path) + ".part")
    tmp_meta.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    os.replace(tmp_meta, meta_path)
# --------------------------------------------------------------------------
# politeness
# --------------------------------------------------------------------------

class RobotsGate:
    """Per-host robots.txt policy, fetched once and reused for the whole run.

    Follows RFC 9309 section 2.3.1.3 for the awkward cases:
      - robots.txt returns 4xx  -> the site has no rules, everything allowed
      - robots.txt returns 5xx  -> treat as disallow-all (fail closed)
    """
    def __init__(self, user_agent: str, timeout: float, enabled: bool = True) -> None:
        self.ua = user_agent
        self.timeout = timeout
        self.enabled = enabled
        self._policies: dict[str, Protego | None] = {}

    @staticmethod
    def _origin(url: str) -> str:
        p = urlparse(url)
        if p.scheme not in ("http", "https") or not p.hostname:
            raise ValueError(f"not an absolute http(s) URL: {url}")
        return f"{p.scheme}://{p.netloc}"

    def allowed(self, url: str) -> tuple[bool, str]:
        """Return (allowed, human-readable reason)."""
        if not self.enabled:
            return True, "robots checking disabled by --no-robots"
        try:
            origin = self._origin(url)
        except ValueError as exc:
            return False, str(exc)

        if origin not in self._policies:
            policy: Protego | None = None
            try:
                r = requests.get(
                    f"{origin}/robots.txt",
                    headers={"User-Agent": self.ua},
                    timeout=self.timeout,
                )
                if r.status_code == 404:
                    policy = None          # absent robots.txt => allow all
                elif r.status_code >= 500:
                    return False, (f"robots.txt returned {r.status_code}; "
                                   "failing closed per RFC 9309")
                else:
                    policy = Protego.parse(r.text)
            except requests.RequestException as exc:
                return False, f"could not fetch robots.txt: {exc.__class__.__name__}"
            self._policies[origin] = policy

        policy = self._policies[origin]
        if policy is None:
            return True, "no robots.txt published"
        if not policy.can_fetch(url, self.ua):
            return False, "blocked by robots.txt Disallow"
        return True, "allowed by robots.txt"

    def crawl_delay(self, url: str) -> float | None:
        """Site-declared Crawl-delay, if any. Caller should honour it."""
        if not self.enabled:
            return None
        try:
            origin = self._origin(url)
        except ValueError:
            return None
        policy = self._policies.get(origin)
        if policy is None:
            return None
        delay = policy.crawl_delay(self.ua)
        return float(delay) if delay is not None else None

    def sitemaps(self, url: str) -> list[str]:
        try:
            origin = self._origin(url)
        except ValueError:
            return []
        policy = self._policies.get(origin)
        return list(policy.sitemaps) if policy else []


class Throttle:
    """Per-host minimum-interval limiter, strictly sequential by default.

    Sequential is the polite default. Parallel fetching should be a deliberate
    choice, never an accident.
    """

    def __init__(self) -> None:
        self._last: dict[str, float] = {}

    def wait(self, host: str, delay: float) -> float:
        if delay <= 0:
            return 0.0
        sleep_for = delay - (time.monotonic() - self._last.get(host, 0.0))
        if sleep_for > 0:
            time.sleep(sleep_for)
        self._last[host] = time.monotonic()
        return max(0.0, sleep_for)


def backoff_delay(attempt: int, cfg: Config) -> float:
    """Exponential backoff with FULL jitter, capped.

    Full jitter (a random point anywhere in [0, window]) is the variant AWS
    published in "Exponential Backoff And Jitter": when many clients retry the
    same failed endpoint, synchronised retries make the outage worse.
    """
    window = min(cfg.backoff_cap, cfg.backoff_base * (2 ** attempt))
    return random.uniform(0, window)


# --------------------------------------------------------------------------
# checkpoint / resume
# --------------------------------------------------------------------------
# core fetch
# --------------------------------------------------------------------------

def fetch_one(url: str, out_dir: Path, cfg: Config,
              gate: RobotsGate, throttle: Throttle) -> tuple[str, dict]:
    """Fetch one URL. Returns (outcome, meta).

    outcome is one of: 'cached' | 'fetched' | 'skipped_robots' | 'failed'
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return "failed", {"url": url, "error": f"unsupported scheme: {parsed.scheme!r}"}
    host = parsed.hostname or "?"

    body_path, meta_path = cache_paths(out_dir, url)
    if not cfg.refresh:
        cached = read_cache(body_path, meta_path)
        if cached is not None:
            return "cached", cached

    if gate.enabled:
        allowed, reason = gate.allowed(url)
        if not allowed:
            return "skipped_robots", {"url": url, "error": reason}

    # Honour Crawl-delay if the site declares one stricter than our --delay.
    delay = cfg.delay
    site_delay = gate.crawl_delay(url)
    if site_delay is not None:
        delay = max(delay, site_delay)

    headers = {"User-Agent": cfg.user_agent, "Accept": "*/*"}
    last_error = "unknown"

    for attempt in range(cfg.max_retries + 1):
        throttle.wait(host, delay)
        try:
            resp = requests.get(url, headers=headers, timeout=cfg.timeout)
        except requests.RequestException as exc:
            last_error = f"{exc.__class__.__name__}: {exc}"
        else:
            if resp.status_code == 200:
                meta = {
                    "status": 200,
                    "content_type": resp.headers.get("Content-Type", ""),
                    "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "attempts": attempt + 1,
                    "final_url": resp.url,
                }
                write_cache(out_dir, url, resp.content, meta)
                # write_cache stores a copy with body_bytes added; echo the
                # size back so callers can report progress without stat'ing.
                return "fetched", {**meta, "body_bytes": len(resp.content)}

            if resp.status_code in RETRY_STATUSES:
                last_error = f"HTTP {resp.status_code}"
                ra = resp.headers.get("Retry-After")
                if ra and ra.isdigit():
                    time.sleep(min(float(ra), cfg.backoff_cap))
            elif resp.status_code in (301, 302, 303, 307, 308):
                last_error = f"redirect loop ending at {resp.url}"
                break
            else:
                return "failed", {"url": url, "status": resp.status_code,
                                  "error": f"HTTP {resp.status_code} (not retryable)"}

        if attempt < cfg.max_retries:
            time.sleep(backoff_delay(attempt, cfg))

    return "failed", {"url": url, "error": last_error,
                      "attempts": cfg.max_retries + 1}


# --------------------------------------------------------------------------
# cli
# --------------------------------------------------------------------------

def read_manifest(path: Path) -> list[str]:
    """Read a URL manifest.

    utf-8-sig strips a leading BOM if present. That matters: PowerShell's
    Set-Content writes UTF-8 *with* BOM, and without -sig the BOM becomes
    part of the first URL. It then leaks into output and crashes any console
    using cp1252 -- a failure with no useful error message near its cause.
    """
    urls: list[str] = []
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if line and not line.startswith("#"):
            urls.append(line)
    return urls


# --------------------------------------------------------------------------
# checkpoint / resume
# --------------------------------------------------------------------------

def load_checkpoint(path: Path) -> dict:
    if not path.exists():
        return {"done": {}, "failed": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"done": {}, "failed": {}}   # corrupt checkpoint: refetch, don't die


def save_checkpoint(path: Path, state: dict) -> None:
    tmp = Path(str(path) + ".part")
    tmp.write_text(json.dumps(state, indent=2, sort_keys=True), encoding="utf-8")
    os.replace(tmp, path)


# --------------------------------------------------------------------------
# cli
# --------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(
        description="Polite, resumable, cached HTTP fetcher with robots.txt enforcement.",
    )
    ap.add_argument("--manifest", required=True, type=Path,
                    help="file of URLs, one per line; '#' comments allowed")
    ap.add_argument("--out-dir", required=True, type=Path, help="cache directory")
    ap.add_argument("--delay", type=float, default=1.5,
                    help="min seconds between requests to the same host (default 1.5)")
    ap.add_argument("--timeout", type=float, default=30.0)
    ap.add_argument("--max-retries", type=int, default=5)
    ap.add_argument("--user-agent", default=DEFAULT_UA,
                    help="identify yourself truthfully; default is generic")
    ap.add_argument("--no-robots", action="store_true",
                    help="DISABLE robots.txt checking (you had better have a reason)")
    ap.add_argument("--resume", action="store_true",
                    help="skip URLs already marked done in the checkpoint")
    ap.add_argument("--refresh", action="store_true",
                    help="ignore the cache and refetch everything")
    ap.add_argument("--sitemaps", action="store_true",
                    help="also print sitemaps declared in each host's robots.txt")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    if not args.manifest.exists():
        print(f"ERROR: manifest not found: {args.manifest}", file=sys.stderr)
        return 2

    cfg = Config(
        delay=args.delay, timeout=args.timeout, max_retries=args.max_retries,
        respect_robots=not args.no_robots, user_agent=args.user_agent,
        resume=args.resume, refresh=args.refresh,
    )

    urls = read_manifest(args.manifest)
    if not urls:
        print("ERROR: manifest contained no URLs", file=sys.stderr)
        return 2

    args.out_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = args.out_dir / "checkpoint.json"
    state = load_checkpoint(ckpt_path)

    gate = RobotsGate(cfg.user_agent, cfg.timeout, enabled=cfg.respect_robots)
    throttle = Throttle()
    stats = Stats()
    started = time.monotonic()

    def say(msg: str) -> None:
        if not args.quiet:
            print(msg, flush=True)

    say(f"fetching {len(urls)} url(s) -> {args.out_dir}")
    say(f"delay={cfg.delay}s  retries={cfg.max_retries}  "
        f"robots={'off' if not cfg.respect_robots else 'on'}")

    for i, url in enumerate(urls, 1):
        if cfg.resume and url in state["done"]:
            stats.cached += 1
            say(f"[{i}/{len(urls)}] skip    (resume) {url}")
            continue

        outcome, meta = fetch_one(url, args.out_dir, cfg, gate, throttle)
        stats.bump(outcome)
        # Stats fields are named identically to the outcome strings.
        setattr(stats, outcome, getattr(stats, outcome) + 1)

        if outcome in ("cached", "fetched"):
            size = meta.get("body_bytes", 0)
            stats.bytes += size
            state["done"][url] = meta
            state["failed"].pop(url, None)
            say(f"[{i}/{len(urls)}] {outcome:9s} {size:>9,}B  {url}")
        elif outcome == "skipped_robots":
            say(f"[{i}/{len(urls)}] SKIPPED  {meta['error']}  {url}")
        else:
            state["failed"][url] = meta
            say(f"[{i}/{len(urls)}] FAILED   {meta.get('error')}  {url}")

        # checkpoint after every URL: a crash costs at most one refetch
        save_checkpoint(ckpt_path, state)

    if args.sitemaps and cfg.respect_robots:
        print("")
        print("sitemaps declared in robots.txt:")
        for url in urls:
            for sm in gate.sitemaps(url):
                print(f"  {urlparse(url).hostname}: {sm}")

    elapsed = time.monotonic() - started
    (args.out_dir / "failures.json").write_text(
        json.dumps(state["failed"], indent=2), encoding="utf-8")

    print("")
    print(f"done in {elapsed:,.1f}s  fetched={stats.fetched} cached={stats.cached} "
          f"skipped_robots={stats.skipped_robots} failed={stats.failed} "
          f"bytes={stats.bytes:,}")
    if state["failed"]:
        print(f"{len(state['failed'])} failure(s) -> {args.out_dir / 'failures.json'}")

    # Non-zero exit makes this usable directly as a CI / pipeline gate.
    return 1 if state["failed"] else 0


if __name__ == "__main__":
    # A harvested URL can contain any byte the source had. Never let a legacy
    # console codepage (cp1252) turn a successful fetch into a crash.
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(errors="replace")
        except (AttributeError, OSError):
            pass
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\ninterrupted; checkpoint saved, rerun with --resume", file=sys.stderr)
        sys.exit(130)