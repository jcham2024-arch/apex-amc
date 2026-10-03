#!/usr/bin/env python3
"""
pdf_tables.py -- extract tables from PDFs, with a visual debug trail.

Why this exists
---------------
Extracting a table from a PDF is the single most common place a data project
quietly goes wrong. pdfplumber's own docs call visual debugging the answer,
and this script builds that loop in:

  1. run with --auto           -> tries several strategies, keeps the best
  2. run with --debug          -> writes a PNG per page with detected cells
                                  drawn on it, so you can SEE what went wrong
  3. tune, then pin the winning settings with --settings

Strategy ladder (--auto tries them in order)
  lines        drawn rules on the page; the reliable default for real tables
  lines_strict same, but ignores faint/whitespace-derived lines
  text         derives columns from gaps in word positions; for tables that
               have no drawn borders at all

Patterns from these published sources (see ../_reference/SOURCES.md):
  - pdfplumber (jsvine/pdfplumber, MIT)  extraction + TableFinder API
  - Camelot    (camelot-dev/camelot, MIT) the idea of an accuracy metric, so
                you can compare candidate extractions numerically
  - Anssi Nurminen's master's thesis     the lines/text derivation approach
                                         pdfplumber's table finder implements

Usage
-----
    python pdf_tables.py guide.pdf --pages 1-20 --auto --out tables/
    python pdf_tables.py guide.pdf --pages 5 --debug --debug-dir debug/
    python pdf_tables.py guide.pdf --pages 5 --settings '{"vertical_strategy":"text"}'

Requires:  pip install pdfplumber
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit("Missing dependency. Run:  pip install pdfplumber")

try:
    from PIL import ImageDraw          # ships with pdfplumber's deps
except ImportError:
    sys.exit("Missing dependency. Run:  pip install pillow")


# Strategy ladder. Each entry is a table_settings dict.
STRATEGIES: list[tuple[str, dict]] = [
    ("lines", {}),
    ("lines_strict", {"vertical_strategy": "lines_strict",
                      "horizontal_strategy": "lines_strict"}),
    ("text", {"vertical_strategy": "text", "horizontal_strategy": "text",
              "text_x_tolerance": 2, "text_y_tolerance": 2}),
]

# Rectangularity / raggedness: a real table is mostly filled cells.
# Camelot calls the first an "accuracy"; the second is our own raggedness
# measure. Together they let --auto pick a winner without a human looking.
MIN_FILL_RATIO = 0.60


def parse_pages(spec: str | None, n_pages: int) -> list[int]:
    """Turn '1,5,11-15' into a sorted list of 1-based page numbers."""
    if not spec:
        return list(range(1, n_pages + 1))
    wanted: set[int] = set()
    for part in spec.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            lo_s, _, hi_s = part.partition("-")
            lo, hi = int(lo_s), int(hi_s)
            if lo > hi:
                lo, hi = hi, lo
            wanted.update(range(lo, hi + 1))
        else:
            wanted.add(int(part))
    return sorted(p for p in wanted if 1 <= p <= n_pages)


def score_table(rows: list[list]) -> float:
    """Higher is better. Combines fill ratio and cell-count consistency.

    A ragged extraction -- rows of wildly different lengths -- is the usual
    symptom of wrong tolerances, so penalise it explicitly.
    """
    if not rows:
        return 0.0
    widths = [len(r) for r in rows if r]
    if not widths:
        return 0.0
    cells = sum(widths)
    filled = sum(1 for r in rows for c in r if c is not None and str(c).strip())
    fill = filled / cells if cells else 0.0
    mean_w = cells / len(widths)
    spread = sum(abs(w - mean_w) for w in widths) / len(widths)
    raggedness = spread / mean_w if mean_w else 1.0
    # Reward tables with more than one row: a single row is usually a
    # false positive from the text strategy catching a paragraph.
    size_factor = min(1.0, len(rows) / 3.0)
    return fill * (1.0 - min(1.0, raggedness)) * size_factor


def normalise(rows: list[list]) -> list[list]:
    """Trim fully-empty rows/cols and pad rows to a uniform width.

    Downstream code should not have to deal with None-padding.
    """
    rows = [r for r in rows if any(c is not None and str(c).strip() for c in r)]
    if not rows:
        return []
    width = max(len(r) for r in rows)
    out = []
    for r in rows:
        r = list(r) + [None] * (width - len(r))
        out.append([("" if c is None else str(c).strip()) for c in r])
    # drop columns that are empty in every row
    keep = [i for i in range(width) if any(row[i] for row in out)]
    return [[row[i] for i in keep] for row in out]


def best_table_on_page(page, settings: dict) -> tuple[list[list], float]:
    """Extract every table on the page with the given settings; keep the best."""
    tables = page.extract_tables(table_settings=settings)
    best, best_score = [], -1.0
    for t in tables:
        s = score_table(t)
        if s > best_score:
            best, best_score = t, s
    return best, best_score


def write_debug(page, page_no: int, settings: dict, out_dir: Path,
                label: str = "tablefind") -> str | None:
    """Render the page with detected table cells outlined.

    NOTE: pdfplumber's README describes debug_tablefinder() as returning a
    "PageImage". It does not -- it returns a TableFinder holding .edges,
    .cells, .intersections and .tables. So we render the page ourselves and
    draw the cells on top. (Verified against pdfplumber 0.11.10.)

    This is the step that turns 'the extraction is wrong' into 'the vertical
    lines are 3pt too far left, so column 4 is being split'.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        finder = page.debug_tablefinder(table_settings=settings)
        rendered = page.to_image(resolution=150)
        image = rendered.original          # PIL Image
        draw = ImageDraw.Draw(image)
        scale = image.width / page.width    # points -> pixels
        for cell in finder.cells:
            x0, top, x1, bottom = cell
            draw.rectangle(
                [x0 * scale, top * scale, x1 * scale, bottom * scale],
                outline=(255, 0, 0), width=1,
            )
        path = out_dir / f"page-{page_no:04d}-{label}.png"
        image.save(path)
        return f"{path} ({len(finder.cells)} cells)"
    except Exception as exc:                      # noqa: BLE001
        (out_dir / f"page-{page_no:04d}-{label}-ERROR.txt").write_text(
            f"{exc.__class__.__name__}: {exc}\n", encoding="utf-8")
        return None
def write_debug_image(page, page_no: int, out_dir: Path) -> str | None:
    """Plain page render, no table overlay -- the 'what does this page even
    look like' baseline image to compare the tablefinder debug against."""
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        image = page.to_image(resolution=150)
        path = out_dir / f"page-{page_no:04d}.png"
        image.save(path)
        return str(path)
    except Exception as exc:                      # noqa: BLE001
        return f"(page render failed: {exc.__class__.__name__}: {exc})"


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Extract tables from a PDF, optionally auto-selecting the "
                    "best strategy and emitting visual debug images.")
    ap.add_argument("pdf", type=Path)
    ap.add_argument("--pages", help="1-based page spec, e.g. '1,5,11-15'")
    ap.add_argument("--out", type=Path, default=Path("tables"),
                    help="output directory (default: tables/)")
    ap.add_argument("--auto", action="store_true",
                    help="try each strategy and keep the highest-scoring result")
    ap.add_argument("--settings", help="explicit table_settings JSON; overrides --auto")
    ap.add_argument("--debug", action="store_true",
                    help="write per-page PNGs showing detected table cells")
    ap.add_argument("--debug-dir", type=Path, default=Path("pdf-debug"))
    ap.add_argument("--csv", action="store_true", help="also write one CSV per table")
    ap.add_argument("--min-fill", type=float, default=MIN_FILL_RATIO,
                    help="minimum non-empty cell ratio to accept a table (default 0.60)")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    if not args.pdf.exists():
        print(f"ERROR: no such PDF: {args.pdf}", file=sys.stderr)
        return 2

    if args.settings:
        try:
            pinned = json.loads(args.settings)
        except json.JSONDecodeError as exc:
            print(f"ERROR: --settings is not valid JSON: {exc}", file=sys.stderr)
            return 2
        plan: list[tuple[str, dict]] = [("pinned", pinned)]
    elif args.auto:
        plan = STRATEGIES
    else:
        plan = STRATEGIES[:1]                    # default: plain "lines"

    args.out.mkdir(parents=True, exist_ok=True)
    report: list[dict] = []
    written = 0
    rejected: list[dict] = []

    def say(msg: str) -> None:
        if not args.quiet:
            print(msg, flush=True)

    say(f"opening {args.pdf}")
    with pdfplumber.open(args.pdf) as pdf:
        n_pages = len(pdf.pages)
        pages = parse_pages(args.pages, n_pages)
        say(f"{n_pages} page(s); extracting {len(pages)} "
            f"(strategies: {', '.join(n for n, _ in plan)})")

        for page_no in pages:
            page = pdf.pages[page_no - 1]

            if args.debug:
                base = write_debug_image(page, page_no, args.debug_dir)
                if base:
                    say(f"  debug page {page_no}: {base}")

            chosen_rows: list[list] = []
            chosen_name = ""
            chosen_score = -1.0
            for name, settings in plan:
                try:
                    rows, score = best_table_on_page(page, settings)
                except Exception as exc:          # noqa: BLE001
                    say(f"  page {page_no}: strategy {name} failed "
                        f"({exc.__class__.__name__})")
                    continue
                if score > chosen_score:
                    chosen_rows, chosen_name, chosen_score = rows, name, score
                if args.debug:
                    png = write_debug(page, page_no, settings, args.debug_dir, label=name)
                    if png:
                        say(f"  debug page {page_no} [{name}]: {png}")

            rows = normalise(chosen_rows)
            if not rows:
                say(f"  page {page_no}: no table found")
                continue

            fill = (sum(1 for r in rows for c in r if c) /
                    max(1, sum(len(r) for r in rows)))
            entry = {"page": page_no, "strategy": chosen_name,
                     "score": round(chosen_score, 4), "rows": len(rows),
                     "cols": len(rows[0]), "fill": round(fill, 4)}
            report.append(entry)

            if fill < args.min_fill:
                rejected.append(entry)
                say(f"  page {page_no}: REJECTED fill={fill:.2f} "
                    f"< {args.min_fill:.2f} (saved debug image, tune settings)")
                continue

            base_name = f"page-{page_no:04d}"
            (args.out / f"{base_name}.json").write_text(
                json.dumps(rows, indent=2), encoding="utf-8")
            if args.csv:
                import csv
                with (args.out / f"{base_name}.csv").open("w", newline="",
                                                           encoding="utf-8") as fh:
                    csv.writer(fh).writerows(rows)
            written += 1
            say(f"  page {page_no}: {len(rows)}x{len(rows[0])} via {chosen_name} "
                f"(score {chosen_score:.3f}, fill {fill:.2f})")

    (args.out / "_report.json").write_text(
        json.dumps({"pdf": str(args.pdf), "written": written,
                    "rejected": rejected, "pages": report}, indent=2),
        encoding="utf-8")

    say("")
    say(f"wrote {written} table(s) to {args.out}")
    if rejected:
        say(f"{len(rejected)} page(s) below --min-fill; see _report.json "
            f"and the debug images")
    if written == 0:
        say("nothing extracted. Run with --debug and look at the PNGs.")
        return 1
    return 0


if __name__ == "__main__":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(errors="replace")
        except (AttributeError, OSError):
            pass
    sys.exit(main())