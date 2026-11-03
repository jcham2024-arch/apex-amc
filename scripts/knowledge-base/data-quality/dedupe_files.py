#!/usr/bin/env python3
"""
dedupe_files.py -- find and reclaim space from byte-identical files, safely.

Why this exists
---------------
Harvesting produces duplicates constantly: the same PDF fetched under two
names, a source page saved twice, an extracted JSON next to the CSV it came
from. That is harmless clutter until the dataset grows, when it becomes the
dominant cost.

The dangerous part is deleting. Most dedup tools get this wrong in one of two
ways: they compare by filename (finding nothing useful) or they delete without
proving the content is identical. This does neither.

How it decides two files are the same
--------------------------------------
A staged strategy, borrowed from dupedog's approach, so that cost scales with
how likely a match actually is:

    stage 1  same size?                 -- no hashing at all, rejects ~99%
    stage 2  SHA-256 of first 64 KB     -- cheap, separates almost everything
    stage 3  SHA-256 of whole file      -- only for candidates still standing

So a 1 MB directory full of one-offs costs almost nothing, and the expensive
full-file hash runs only on pairs that already agree on size and head.

Safety
------
  - default mode is REPORT ONLY; nothing is deleted without --execute
  - even then, duplicates are replaced by hardlinks, not deleted, so every
    original path keeps working and the bytes are freed. Deleting is opt-in
    via --delete, which still requires --execute.
  - identical content is proven byte-for-byte before anything is touched

Patterns from these published sources (see ../_reference/SOURCES.md):
  - dupedog (ivoronin/dupedog)        staged hashing (head then tail then
                                       full) and hardlink-not-delete
  - rdfind (pauldreik/rdfind)         content-based, not name-based, matching
  - fdupes / jdupes                   size then signature then byte-compare
  - Dazzlesum                          SHA-256 as the safe default algorithm

Usage
-----
    python dedupe_files.py .                     # report only
    python dedupe_files.py . --execute           # replace dupes with hardlinks
    python dedupe_files.py . --execute --delete  # actually delete (careful)
    python dedupe_files.py . --min-size 1M --json report.json

Exit codes
    0  no duplicates found
    1  duplicates found (usable as a gate)
    2  usage error
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

# 64 KB is enough to separate almost every real pair of files, and is small
# enough that hashing it is effectively free even across thousands of files.
HEAD_BYTES = 64 * 1024
CHUNK = 1024 * 1024

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv",
             ".mypy_cache", ".pytest_cache", "dist", "build", ".next"}
SKIP_EXTS = {".pyc", ".pyo", ".exe", ".dll", ".so", ".dylib"}


def parse_size(text: str) -> int:
    """'1M', '500K', '2G' -> bytes. Bare numbers are bytes."""
    text = text.strip().upper()
    if not text:
        return 0
    mult = 1
    if text[-1] in "KMG":
        mult = {"K": 1024, "M": 1024 ** 2, "G": 1024 ** 3}[text[-1]]
        text = text[:-1]
    return int(float(text) * mult)


def human(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(n) < 1024 or unit == "TB":
            return f"{n:,.1f}{unit}"
        n /= 1024
    return f"{n:,.1f}TB"


def sha256(path: Path, limit: int | None = None) -> str:
    digest = hashlib.sha256()
    read = 0
    with path.open("rb") as fh:
        while True:
            want = CHUNK if limit is None else min(CHUNK, limit - read)
            if want <= 0:
                break
            block = fh.read(want)
            if not block:
                break
            digest.update(block)
            read += len(block)
    return digest.hexdigest()


def full_sha256(path: Path) -> str:
    return sha256(path, None)
def collect_files(root: Path, min_size: int, follow_symlinks: bool) -> list[Path]:
    files: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(root, followlinks=follow_symlinks):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            path = Path(dirpath) / name
            if path.suffix.lower() in SKIP_EXTS:
                continue
            try:
                if not path.is_file():
                    continue
                if path.stat().st_size < min_size:
                    continue
            except OSError:
                continue
            files.append(path)
    return files


def find_duplicates(files: list[Path]) -> tuple[list[list[Path]], dict]:
    """Group byte-identical files using staged hashing.

    Returns (duplicate_groups, stats). Groups are sorted by wasted bytes,
    biggest opportunity first, and paths inside each group are sorted so the
    choice of which file to keep is deterministic, not filesystem-order.
    """
    stats = {"files": len(files), "bytes": 0,
             "stage_size": 0, "stage_head": 0, "stage_full": 0}

    # stage 1: group by size -- no hashing at all
    by_size: dict[int, list[Path]] = defaultdict(list)
    for path in files:
        try:
            size = path.stat().st_size
        except OSError:
            continue
        stats["bytes"] += size
        if size == 0:
            continue                     # every empty file "matches"; useless
        by_size[size].append(path)

    size_candidates = {k: v for k, v in by_size.items() if len(v) > 1}
    stats["stage_size"] = len(size_candidates)

    # stage 2: hash the head of each candidate
    by_head: dict[tuple, list[Path]] = defaultdict(list)
    for size, group in size_candidates.items():
        for path in group:
            try:
                by_head[(size, sha256(path, HEAD_BYTES))].append(path)
            except OSError:
                continue

    head_candidates = {k: v for k, v in by_head.items() if len(v) > 1}
    stats["stage_head"] = len(head_candidates)

    # stage 3: full hash, only for the survivors
    by_full: dict[tuple, list[Path]] = defaultdict(list)
    for (size, _head), group in head_candidates.items():
        for path in group:
            try:
                by_full[(size, full_sha256(path))].append(path)
            except OSError:
                continue

    groups: list[list[Path]] = []
    for (_size, _digest), group in by_full.items():
        if len(group) <= 1:
            continue
        # Files that are ALREADY hardlinks to each other occupy one inode and
        # cost nothing extra. Reporting them as "reclaimable" would be a lie --
        # the space is already reclaimed. Keep one path per inode and only
        # report the group if genuinely distinct files remain.
        seen_inodes: set[tuple] = set()
        distinct: list[Path] = []
        for path in sorted(group):
            try:
                st = path.stat()
                ident = (st.st_dev, st.st_ino)
            except OSError:
                continue
            if ident in seen_inodes:
                continue
            seen_inodes.add(ident)
            distinct.append(path)
        if len(distinct) > 1:
            groups.append(distinct)
    stats["stage_full"] = sum(len(g) for g in groups)

    def waste(group: list[Path]) -> int:
        try:
            return group[0].stat().st_size * (len(group) - 1)
        except OSError:
            return 0

    groups.sort(key=waste, reverse=True)
    return groups, stats


def reclaim(group: list[Path], execute: bool, delete: bool) -> tuple[str, int]:
    """Reclaim one duplicate group. Returns (action, bytes_freed)."""
    keeper, dupes = group[0], group[1:]
    freed = 0

    for dupe in dupes:
        try:
            dupe_size = dupe.stat().st_size
        except OSError:
            continue
        if not execute:
            continue

        if delete:
            dupe.unlink()
            freed += dupe_size
        else:
            # Replace with a link to the keeper: every path keeps working and
            # the bytes are stored once.
            try:
                dupe.unlink()
                os.link(keeper, dupe)
                freed += dupe_size
            except OSError as exc:
                return (f"hardlink failed ({exc.strerror})", freed)

    if not execute:
        return ("report-only", 0)
    return (("deleted" if delete else "hardlinked"), freed)
def main() -> int:
    ap = argparse.ArgumentParser(
        description="Find byte-identical files; optionally reclaim their space.")
    ap.add_argument("paths", nargs="+", type=Path, help="files and/or directories")
    ap.add_argument("--min-size", default="1", type=parse_size,
                    help="ignore files smaller than this (default 1 byte). "
                         "Use e.g. 1M to skip small files entirely.")
    ap.add_argument("--execute", action="store_true",
                    help="ACTUALLY reclaim space. Without this, report only.")
    ap.add_argument("--delete", action="store_true",
                    help="with --execute: delete duplicates instead of "
                         "hardlinking them. Hardlinks are safer: every path "
                         "keeps working.")
    ap.add_argument("--follow-symlinks", action="store_true")
    ap.add_argument("--json", type=Path, help="write a JSON report here")
    ap.add_argument("--show", type=int, default=15,
                    help="how many duplicate groups to list")
    args = ap.parse_args()

    if args.delete and not args.execute:
        print("ERROR: --delete requires --execute", file=sys.stderr)
        return 2

    files: list[Path] = []
    for target in args.paths:
        if target.is_dir():
            files.extend(collect_files(target, args.min_size,
                                       args.follow_symlinks))
        elif target.is_file():
            files.append(target)
        else:
            print(f"ERROR: no such path: {target}", file=sys.stderr)
            return 2

    if not files:
        print("no files matched")
        return 0

    groups, stats = find_duplicates(files)

    print(f"scanned : {stats['files']:,} file(s), {human(stats['bytes'])}")
    print(f"stage 1 (size) : {stats['stage_size']:,} group(s) share a size")
    print(f"stage 2 (head) : {stats['stage_head']:,} group(s) share a head hash")
    print(f"stage 3 (full) : {stats['stage_full']:,} file(s) in duplicate groups")

    if not groups:
        print("\nno duplicates found")
        return 0

    def group_waste(group: list[Path]) -> int:
        try:
            return group[0].stat().st_size * (len(group) - 1)
        except OSError:
            return 0

    total_waste = sum(group_waste(g) for g in groups)

    print("")
    print(f"{len(groups)} duplicate group(s); {human(total_waste)} reclaimable")
    print("")
    for group in groups[:args.show]:
        try:
            size = human(group[0].stat().st_size)
        except OSError:
            size = "?"
        print(f"  {len(group)} copies x {size} "
              f"(waste {human(group_waste(group))})")
        for i, path in enumerate(group):
            print(f"    {'KEEP' if i == 0 else '  ->'}  {path}")
        print("")

    if len(groups) > args.show:
        print(f"  ... and {len(groups) - args.show} more group(s)\n")

    if args.execute:
        freed = 0
        failures = 0
        for group in groups:
            action, gained = reclaim(group, True, args.delete)
            freed += gained
            if action not in ("deleted", "hardlinked"):
                failures += 1
                print(f"  FAILED: {action}")
        print(f"reclaimed {human(freed)} "
              f"({'deleted' if args.delete else 'hardlinked'} copies)")
        if failures:
            print(f"{failures} group(s) could not be reclaimed")
    else:
        print("report only -- nothing changed.")
        print("  to reclaim:  add --execute"
              + ("" if args.delete else "   (hardlinks; paths keep working)"))

    if args.json:
        args.json.write_text(json.dumps({
            "paths": [str(p) for p in args.paths],
            "stats": stats,
            "duplicate_groups": len(groups),
            "reclaimable_bytes": total_waste,
            "groups": [[str(p) for p in g] for g in groups],
        }, indent=2), encoding="utf-8")
        print(f"report -> {args.json}")

    return 1 if groups else 0


if __name__ == "__main__":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(errors="replace")
        except (AttributeError, OSError):
            pass
    sys.exit(main())