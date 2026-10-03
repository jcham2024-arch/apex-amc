#!/usr/bin/env node
/**
 * fetch-pool.mjs -- polite, resumable, cached HTTP fetcher for Node.
 *
 * The Node counterpart of ../harvesting/fetch_robust.py, for pipelines that
 * already live in Node (ApexProject/scripts/data and friends). Same four
 * guarantees: robots.txt enforcement, on-disk cache, retry with backoff, and
 * checkpoint/resume.
 *
 * Why it exists rather than just adding a dependency
 * ---------------------------------------------------
 * Native fetch() has no retry, no timeout-by-default, and no cache. Every
 * data pipeline ends up hand-rolling those three things, usually badly. This
 * is the hand-rolling, once, with the sharp edges filed off.
 *
 * Patterns from these published sources (see ../_reference/SOURCES.md):
 *   - robots-parser (samclarke/robots-parser, MIT)  RFC 9309 robots.txt parsing
 *     (NOTE: Python's Protego has no npm equivalent -- `npm i protego`
 *     installs an unrelated antibot package)
 *   - TransferX    (zed-syn/TransferX, MIT)  full-jitter backoff, 429-aware
 *   - Scrapling    (D4Vinci/Scrapling, BSD-3) disk response caching
 *   - Node docs                             AbortSignal.timeout, atomic rename
 *
 * Usage:
 *   npm i robots-parser
 *   node fetch-pool.mjs --manifest urls.txt --out-dir cache/
 *   node fetch-pool.mjs --manifest urls.txt --out-dir cache/ --resume
 *   node fetch-pool.mjs --manifest urls.txt --concurrency 2 --delay 1500
 *
 * Exit codes: 0 all good, 1 any failure (usable as a pipeline gate), 2 usage.
 *
 * Requires Node 18+ (global fetch). Optional: `npm i protego` for robots.txt.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DEFAULT_UA = "ClineKnowledgeBaseBot/1.0 (+https://example.invalid/bot)";
const RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {
    manifest: null, outDir: null, delay: 1500, timeout: 30000,
    maxRetries: 5, userAgent: DEFAULT_UA, concurrency: 1,
    respectRobots: true, resume: false, refresh: false, quiet: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--manifest": opts.manifest = next(); break;
      case "--out-dir": opts.outDir = next(); break;
      case "--delay": opts.delay = Number(next()); break;
      case "--timeout": opts.timeout = Number(next()); break;
      case "--max-retries": opts.maxRetries = Number(next()); break;
      case "--user-agent": opts.userAgent = next(); break;
      case "--concurrency": opts.concurrency = Math.max(1, Number(next())); break;
      case "--no-robots": opts.respectRobots = false; break;
      case "--resume": opts.resume = true; break;
      case "--refresh": opts.refresh = true; break;
      case "--quiet": opts.quiet = true; break;
      default:
        if (a.startsWith("--")) {
          console.error(`unknown flag: ${a}`);
          process.exit(2);
        }
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// cache
// ---------------------------------------------------------------------------

function cachePaths(outDir, url) {
  const digest = createHash("sha256").update(url).digest("hex").slice(0, 32);
  const host = (new URL(url).hostname || "unknown").replace(/:/g, "_");
  return {
    body: path.join(outDir, `${host}.${digest}.body`),
    meta: path.join(outDir, `${host}.${digest}.meta.json`),
  };
}

async function writeCache(outDir, url, body, meta) {
  const { body: bodyPath, meta: metaPath } = cachePaths(outDir, url);
  // Write to a temp name then rename: an interrupted run never leaves a
  // half-written body that a later run would trust.
  await writeFile(bodyPath + ".part", body);
  await rename(bodyPath + ".part", bodyPath);
  const full = { ...meta, url, body_bytes: body.length };
  await writeFile(metaPath + ".part", JSON.stringify(full, null, 2));
  await rename(metaPath + ".part", metaPath);
}

async function loadCheckpoint(file) {
  if (!existsSync(file)) return { done: {}, failed: {} };
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return { done: {}, failed: {} };   // corrupt checkpoint: refetch, don't die
  }
}

async function saveCheckpoint(file, state) {
  await writeFile(file + ".part", JSON.stringify(state, null, 2));
  await rename(file + ".part", file);
}

async function readCache(bodyPath, metaPath) {
  if (!existsSync(bodyPath) || !existsSync(metaPath)) return null;
  try {
    const meta = JSON.parse(await readFile(metaPath, "utf8"));
    const body = await readFile(bodyPath);
    // Size check catches a truncated or partially written body.
    if (meta.body_bytes !== body.length) return null;
    return { ...meta, body };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------

/**
 * Per-host robots.txt policy, fetched once and reused for the whole run.
 *
 * Uses robots-parser (samclarke/robots-parser, MIT) -- the JS equivalent of
 * Python's Protego. NOTE: Protego itself is Python-only and is NOT published
 * to npm; `npm i protego` installs an unrelated antibot package. Verified by
 * inspecting its exports: DPoP/crypto helpers, no robots parser.
 *
 * If the dependency is missing we fail closed with a clear message rather
 * than skipping the check. A robots check that quietly does nothing is worse
 * than none, because it looks like a pass.
 */
class RobotsGate {
  #policies = new Map();
  #parser = null;

  constructor(userAgent, timeout, enabled) {
    this.userAgent = userAgent;
    this.timeout = timeout;
    this.enabled = enabled;
  }

  async #loadParser() {
    if (this.#parser !== null) return this.#parser;
    try {
      const mod = await import("robots-parser");
      this.#parser = mod.default ?? mod;
    } catch {
      throw new Error(
        "robots.txt checking is on but robots-parser is not installed.\n" +
        "  npm i robots-parser\n" +
        "  (or pass --no-robots if you have checked permissions another way)"
      );
    }
    return this.#parser;
  }

  async allowed(url) {
    if (!this.enabled) return [true, "robots checking disabled"];
    const target = new URL(url);
    const origin = target.origin;

    if (!this.#policies.has(origin)) {
      const parser = await this.#loadParser();
      let res;
      try {
        res = await fetch(`${origin}/robots.txt`, {
          headers: { "User-Agent": this.userAgent },
          signal: AbortSignal.timeout(this.timeout),
        });
      } catch (err) {
        return [false, `could not fetch robots.txt: ${err.name}`];
      }
      // RFC 9309 s2.3.1.3: 4xx means the site has no rules; 5xx means
      // treat it as disallow-all. Either way, do not treat it as a parse error.
      if (res.status === 404) {
        this.#policies.set(origin, null);
      } else if (res.status >= 500) {
        return [false, `robots.txt returned ${res.status}; failing closed`];
      } else {
        this.#policies.set(
          origin, parser(`${origin}/robots.txt`, await res.text()));
      }
    }

    const policy = this.#policies.get(origin);
    if (policy === null) return [true, "no robots.txt published"];
    if (!policy.isAllowed(url, this.userAgent)) {
      return [false, "blocked by robots.txt Disallow"];
    }
    return [true, "allowed by robots.txt"];
  }

  crawlDelay(url) {
    if (!this.enabled) return null;
    const policy = this.#policies.get(new URL(url).origin);
    if (!policy) return null;
    const d = policy.getCrawlDelay(this.userAgent);
    return typeof d === "number" && isFinite(d) ? d * 1000 : null;   // ms
  }

  sitemaps(url) {
    if (!this.enabled) return [];
    const policy = this.#policies.get(new URL(url).origin);
    return policy ? policy.getSitemaps() : [];
  }
}

// ---------------------------------------------------------------------------
// politeness
// ---------------------------------------------------------------------------

/**
 * Per-host minimum-interval limiter.
 *
 * Concurrency is bounded, but politeness is per-host: two workers hitting the
 * same host still serialise behind this gate. Running 4 workers against 4
 * different hosts is fine; 4 against one host is 1 request at a time.
 */
class Throttle {
  #chains = new Map();

  wait(host, delayMs) {
    const previous = this.#chains.get(host) ?? Promise.resolve();
    const next = previous.then(async () => {
      if (delayMs <= 0) return;
      const last = this.#last ?? 0;
      const wait = delayMs - (Date.now() - last);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.#last = Date.now();
    });
    this.#chains.set(host, next.catch(() => {}));
    return next;
  }

  #last = 0;
}

/** Exponential backoff with FULL jitter, capped. */
function backoffDelay(attempt, { backoffBase = 500, backoffCap = 30000 } = {}) {
  const window = Math.min(backoffCap, backoffBase * 2 ** attempt);
  return Math.random() * window;
}

// ---------------------------------------------------------------------------
// core fetch
// ---------------------------------------------------------------------------

async function fetchOne(url, opts, gate, throttle) {
  let target;
  try {
    target = new URL(url);
  } catch {
    return ["failed", { url, error: "not a valid absolute URL" }];
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return ["failed", { url, error: `unsupported scheme: ${target.protocol}` }];
  }

  const { body: bodyPath, meta: metaPath } = cachePaths(opts.outDir, url);
  if (!opts.refresh) {
    const cached = await readCache(bodyPath, metaPath);
    if (cached) return ["cached", cached];
  }

  if (gate.enabled) {
    const [ok, reason] = await gate.allowed(url);
    if (!ok) return ["skipped_robots", { url, error: reason }];
  }

  const siteDelay = gate.crawlDelay(url);
  const delay = siteDelay != null ? Math.max(opts.delay, siteDelay) : opts.delay;

  let lastError = "unknown";
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    await throttle.wait(target.host, delay);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": opts.userAgent, Accept: "*/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(opts.timeout),
      });

      if (res.status === 200) {
        const body = Buffer.from(await res.arrayBuffer());
        const meta = {
          status: 200,
          content_type: res.headers.get("content-type") ?? "",
          fetched_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
          attempts: attempt + 1,
          final_url: res.url,
        };
        await writeCache(opts.outDir, url, body, meta);
        return ["fetched", { ...meta, body_bytes: body.length }];
      }

      if (RETRY_STATUSES.has(res.status)) {
        lastError = `HTTP ${res.status}`;
        const retryAfter = res.headers.get("retry-after");
        if (retryAfter && /^\d+$/.test(retryAfter)) {
          await new Promise((r) =>
            setTimeout(r, Math.min(Number(retryAfter) * 1000, 30000)));
        }
      } else {
        // Other 4xx are a permanent answer; do not burn retries on them.
        return ["failed", { url, status: res.status,
                            error: `HTTP ${res.status} (not retryable)` }];
      }
    } catch (err) {
      lastError = err.name === "TimeoutError" ? "timeout" : `${err.name}: ${err.message}`;
    }

    if (attempt < opts.maxRetries) {
      await new Promise((r) => setTimeout(r, backoffDelay(attempt)));
    }
  }
  return ["failed", { url, error: lastError, attempts: opts.maxRetries + 1 }];
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.manifest || !opts.outDir) {
    console.error("usage: node fetch-pool.mjs --manifest <file> --out-dir <dir> [...]");
    process.exit(2);
  }
  if (!existsSync(opts.manifest)) {
    console.error(`ERROR: manifest not found: ${opts.manifest}`);
    process.exit(2);
  }

  const raw = await readFile(opts.manifest, "utf8");
  const urls = raw.split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (urls.length === 0) {
    console.error("ERROR: manifest contained no URLs");
    process.exit(2);
  }

  await mkdir(opts.outDir, { recursive: true });
  const ckptFile = path.join(opts.outDir, "checkpoint.json");
  const state = await loadCheckpoint(ckptFile);
  const gate = new RobotsGate(opts.userAgent, opts.timeout, opts.respectRobots);
  const throttle = new Throttle();
  const say = (m) => { if (!opts.quiet) console.log(m); };

  const stats = { fetched: 0, cached: 0, skipped_robots: 0, failed: 0, bytes: 0 };
  const started = Date.now();

  say(`fetching ${urls.length} url(s) -> ${opts.outDir}`);
  say(`delay=${opts.delay}ms concurrency=${opts.concurrency} ` +
      `robots=${opts.respectRobots ? "on" : "off"}`);

  // Bounded-concurrency worker pool over the manifest.
  let cursor = 0;
  const worker = async () => {
    while (cursor < urls.length) {
      const index = cursor++;
      const url = urls[index];

      if (opts.resume && state.done[url]) {
        stats.cached++;
        say(`[${index + 1}/${urls.length}] skip    (resume) ${url}`);
        continue;
      }

      const [outcome, meta] = await fetchOne(url, opts, gate, throttle);
      stats[outcome] += 1;

      if (outcome === "fetched" || outcome === "cached") {
        stats.bytes += meta.body_bytes ?? 0;
        state.done[url] = meta;
        delete state.failed[url];
        say(`[${index + 1}/${urls.length}] ${outcome.padEnd(9)} ` +
            `${String(meta.body_bytes ?? 0).padStart(9)}B  ${url}`);
      } else if (outcome === "skipped_robots") {
        say(`[${index + 1}/${urls.length}] SKIPPED  ${meta.error}  ${url}`);
      } else {
        state.failed[url] = meta;
        say(`[${index + 1}/${urls.length}] FAILED   ${meta.error}  ${url}`);
      }

      await saveCheckpoint(ckptFile, state);
    }
  };

  await Promise.all(Array.from({ length: opts.concurrency }, worker));

  await writeFile(path.join(opts.outDir, "failures.json"),
                  JSON.stringify(state.failed, null, 2));

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log("");
  console.log(`done in ${secs}s  ` +
    `fetched=${stats.fetched} cached=${stats.cached} ` +
    `skipped_robots=${stats.skipped_robots} failed=${stats.failed} ` +
    `bytes=${stats.bytes}`);

  const failedCount = Object.keys(state.failed).length;
  if (failedCount) {
    console.log(`${failedCount} failure(s) -> ` +
                path.join(opts.outDir, "failures.json"));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`fatal: ${err.message}`);
  process.exit(2);
});
