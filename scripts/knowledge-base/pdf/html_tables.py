#!/usr/bin/env python3
"""
html_tables.py -- extract tables from HTML with the same discipline as
pdf_tables.py, because HTML tables fail in the same quiet ways.

Why this exists
---------------
HTML is *supposed* to be easy. It usually is, until you hit a table with:
  - a header row split across two <tr> elements
  - colspan/rowspan that shift every subsequent column
  - a "table" that is really layout markup, producing 2 columns of noise
  - a <th> used for row labels, not column headers
  - numbers with thousands separators that stop being numbers

None of these raise. They produce a DataFrame that looks fine and is wrong.

This script therefore does what pdf_tables.py does: score candidates,
reject the empty ones, and let you look at what it actually found.

Patterns from these published sources (see ../_reference/SOURCES.md):
  - pandas.read_html   the multi-frame parsing and header inference
  - lxml               the recovery parser; sees broken markup as browsers do
  - BeautifulSoup      the recover-from-failure approach for malformed HTML
  - Camelot            the accuracy-metric idea reused from the PDF script
  - Anssi Nurminen     the notion of deriving structure from what's actually
                       drawn/present rather than trusting declared markup

Usage
-----
    python html_tables.py page.html --min-rows 2 --csv
    python html_tables.py page.html --index 0 --pretty          # one table
    python html_tables.py urls.txt --out tables/                # many files

Exit codes
    0  at least one usable table found
    1  no table passed the quality bar
    2  usage error

Requires:  pip install pandas lxml beautifulsoup4
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from io import StringIO
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    sys.exit("Missing dependency. Run:  pip install pandas lxml")

try:
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Missing dependency. Run:  pip install beautifulsoup4")
# --------------------------------------------------------------------------
# quality scoring
# --------------------------------------------------------------------------

def score_frame(df) -> float:
    """0..1 estimate of whether this frame looks like real tabular data.

    Rewards: rectangularity, multiple rows, populated cells, distinct values
    per column. Penalises the classic failure -- a 2-column layout table full
    of navigation text.
    """
    rows, cols = df.shape
    if rows == 0 or cols == 0:
        return 0.0

    filled = df.notna().sum().sum()
    density = filled / (rows * cols) if rows * cols else 0.0

    size_factor = min(1.0, rows / 3.0)

    # Distinctness: real columns vary. A layout table's columns are often one
    # repeated string, which carries no information.
    distinct = df.nunique(dropna=True).mean() if cols else 0
    distinct_factor = min(1.0, float(distinct) / max(2, cols * 0.5))

    # Very wide frames are usually one logical row exploded sideways.
    width_penalty = 1.0 if cols <= 40 else max(0.4, 40 / cols)

    return density * size_factor * distinct_factor * width_penalty


def clean(df):
    """Normalise a parsed frame: strip strings, drop all-empty rows/cols."""
    df = df.copy()
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].map(
                lambda v: v.strip() if isinstance(v, str) else v)
    df = df.replace({"": None, "nan": None, "None": None})
    df = df.dropna(axis=0, how="all").dropna(axis=1, how="all")
    return df


def humanise_columns(df):
    """Turn MultiIndex or numeric headers into flat, unique, readable names."""
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [
            "_".join(str(p) for p in col if str(p) not in ("", "Unnamed: 0"))
            for col in df.columns
        ]
    df.columns = [
        str(c).strip() if not str(c).startswith("Unnamed:") else f"col_{i}"
        for i, c in enumerate(df.columns)
    ]
    # De-duplicate repeated header names: without this every downstream
    # column lookup is ambiguous.
    seen: dict[str, int] = {}
    out = []
    for name in df.columns:
        if name in seen:
            seen[name] += 1
            out.append(f"{name}_{seen[name]}")
        else:
            seen[name] = 0
            out.append(name)
    df.columns = out
    return df


def extract(path: Path, min_rows: int, min_cols: int):
    """Return (frames, notes) for every table that passes the quality bar."""
    try:
        html = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        return [], [f"unreadable: {exc}"], []

    soup = BeautifulSoup(html, "lxml")
    declared = len(soup.find_all("table"))
    if declared == 0:
        # Say so plainly: a page built from <div> grids will never yield a
        # table no matter how the thresholds are tuned.
        return [], ["no <table> elements in this page -- it is laid out with "
                    "<div>/CSS, so table extraction cannot work on it"], []

    frames: list = []
    skipped: list = []
    try:
        raw = pd.read_html(StringIO(html))
    except ValueError as exc:
        return [], [f"no parsable tables ({exc})"], []
    except ImportError as exc:
        # pandas falls back to html5lib on badly broken markup, then raises a
        # bare ImportError if that optional dep is absent. Report it as an
        # actionable message instead of a traceback.
        return [], [f"parser fallback unavailable: {exc}. "
                    f"Install it with:  pip install html5lib"], []

    for i, df in enumerate(raw):
        df = humanise_columns(clean(df))
        if df.shape[0] < min_rows or df.shape[1] < min_cols:
            # Keep a record of what was skipped and why: "0 tables found" on
            # a page that plainly has <table> tags is the confusing case, and
            # the shapes below explain it immediately.
            skipped.append({"index": i, "shape": list(df.shape),
                            "reason": f"smaller than {min_rows} rows x "
                                      f"{min_cols} cols"})
            continue
        frames.append((i, df, score_frame(df)))

    notes = [f"{declared} <table> element(s) declared, {len(raw)} parsed, "
             f"{len(frames)} passed the quality bar"]
    if declared and not frames:
        shapes = ", ".join(f"table[{s['index']}]={s['shape'][0]}x{s['shape'][1]}"
                          for s in skipped)
        notes.append(f"  all rejected as too small: {shapes}")
        notes.append("  lower --min-rows / --min-cols if these are real data")
    return frames, notes, skipped


# --------------------------------------------------------------------------
# output
# --------------------------------------------------------------------------

def write_frame(df, out_dir: Path, stem: str, index: int,
                as_csv: bool, as_json: bool) -> list[str]:
    written = []
    base = out_dir / f"{stem}-table{index}"
    if as_json or not as_csv:
        base.with_suffix(".json").write_text(
            json.dumps(df.where(pd.notna(df), None).to_dict(orient="records"),
                       indent=2, default=str), encoding="utf-8")
        written.append(str(base.with_suffix(".json")))
    if as_csv:
        with base.with_suffix(".csv").open("w", newline="", encoding="utf-8") as fh:
            df.to_csv(fh, index=False)
        written.append(str(base.with_suffix(".csv")))
    return written


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Extract tables from HTML with quality scoring.")
    ap.add_argument("inputs", nargs="+", type=Path,
                    help="HTML files, or a .txt manifest of HTML paths")
    ap.add_argument("--out", type=Path, default=Path("tables"),
                    help="output directory (default: tables/)")
    ap.add_argument("--min-rows", type=int, default=2)
    ap.add_argument("--min-cols", type=int, default=2)
    ap.add_argument("--index", type=int,
                    help="print only this table index and exit")
    ap.add_argument("--pretty", action="store_true",
                    help="print the selected table to the terminal")
    ap.add_argument("--csv", action="store_true")
    ap.add_argument("--quiet", action="store_true",
                    help="suppress per-table progress lines")
    ap.add_argument("--min-score", type=float, default=0.0,
                    help="reject tables scoring below this (0 = keep all that fit)")
    args = ap.parse_args()

    # Accept either files or a manifest of paths.
    targets: list[Path] = []
    for item in args.inputs:
        if item.is_dir():
            targets.extend(sorted(item.rglob("*.htm*")))
        elif item.suffix.lower() in (".txt", ".lst", ".list"):
            targets.extend(Path(l.strip()) for l in
                           item.read_text(encoding="utf-8").splitlines()
                           if l.strip() and not l.startswith("#"))
        else:
            targets.append(item)

    if not targets:
        print("ERROR: no input files found", file=sys.stderr)
        return 2

    args.out.mkdir(parents=True, exist_ok=True)
    total_found = 0
    total_written = 0
    report: list[dict] = []

    for path in targets:
        if not path.exists():
            print(f"  skip (missing): {path}")
            continue

        frames, notes, skipped = extract(path, args.min_rows, args.min_cols)
        entry = {"file": str(path), "notes": notes, "tables": [],
                 "skipped": skipped}

        if args.pretty or args.index is not None:
            print(f"\n=== {path} ===")
            for note in notes:
                print(f"  {note}")
            for i, df, score in frames:
                if args.index is not None and i != args.index:
                    continue
                print(f"\n  table[{i}]  shape={df.shape}  score={score:.3f}")
                print(f"  columns: {list(df.columns)[:12]}")
                if args.pretty:
                    with pd.option_context("display.max_columns", 12,
                                           "display.width", 160,
                                           "display.max_colwidth", 24):
                        print(df.head(8).to_string(index=False))
            if args.index is not None:
                return 0

        for i, df, score in frames:
            total_found += 1
            entry["tables"].append({"index": i, "rows": int(df.shape[0]),
                                    "cols": int(df.shape[1]),
                                    "score": round(score, 4),
                                    "columns": [str(c) for c in df.columns]})
            if score < args.min_score:
                print(f"  {path.name}: table[{i}] rejected "
                      f"(score {score:.3f} < {args.min_score:.3f})")
                continue
            stem = path.stem
            written = write_frame(df, args.out, stem, i,
                                  args.csv or not args.quiet, False)
            total_written += len(written)
            print(f"  {path.name}: table[{i}] {df.shape[0]}x{df.shape[1]} "
                  f"score={score:.3f} -> {written[0]}")

    (args.out / "_report.json").write_text(
        json.dumps({"found": total_found, "written": total_written,
                    "files": report}, indent=2), encoding="utf-8")

    print(f"\n{total_found} table(s) found across {len(targets)} file(s); "
          f"wrote {total_written} file(s) to {args.out}")
    if total_found == 0:
        print("No tables found. Check --min-rows/--min-cols, or whether the "
              "page uses <div> layout instead of <table>.")
        return 1
    return 0


if __name__ == "__main__":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(errors="replace")
        except (AttributeError, OSError):
            pass
    sys.exit(main())
