#!/usr/bin/env python3
"""
pdf_prep.py -- inspect, split, merge and repair PDFs before extracting data.

Why this exists
---------------
Before you can trust any table extraction, you need to know what you are
looking at. Is this PDF text-based or a scan? Which pages hold the table? Is
it rotated? Is it even valid? Guessing produces confidently wrong data.

This answers those questions and does the mechanical page work, so the
extraction script downstream only ever sees a sane input.

Subcommands
-----------
    inspect <pdf>              page count, text/scanned verdict, metadata,
                               per-page text volume, encryption, damage check
    split  <pdf> --pages 1-20  write selected pages to a new PDF
    merge  a.pdf b.pdf ...     concatenate (optionally with page ranges)
    rotate <pdf> --degrees 90  rotate every page
    repair <pdf>               rewrite, fixing recoverable structural damage

Patterns from these published sources (see ../_reference/SOURCES.md):
  - pikepdf (pikepdf/pikepdf, MPL-2.0)  the manipulation engine; a Python
    binding to the mature qpdf C++ library, so it repairs rather than merely
    re-writes. Chosen over pymupdf (AGPL) deliberately -- see SOURCES.md.
  - qpdf                         --check for structural validation
  - pdftl (pdftl/pdftl)          the pdftk-compatible CLI surface, and the
                                 chaining-without-intermediate-files idea
  - Camelot / pdfplumber docs    the "is this text-based or scanned" question,
                                 answered by measuring extractable characters

Usage
-----
    python pdf_prep.py inspect guide.pdf
    python pdf_prep.py split guide.pdf --pages 1-20 --out front.pdf
    python pdf_prep.py merge a.pdf b.pdf --out combined.pdf
    python pdf_prep.py rotate scan.pdf --degrees 90 --out upright.pdf
    python pdf_prep.py repair broken.pdf --out fixed.pdf

Exit codes
    0  success
    1  the operation failed / the PDF is unusable
    2  usage error

Requires:  pip install pikepdf
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    import pikepdf
except ImportError:
    sys.exit("Missing dependency. Run:  pip install pikepdf")


# Characters per page below which we call a page 'image-like' rather than text.
# Tuned against real manuals: a genuine data page carries hundreds of
# characters; a scanned photograph of a page carries zero extractable text.
TEXT_CHARS_PER_PAGE = 40


def parse_pages(spec: str, total: int) -> list[int]:
    """'1,5,11-15' -> [1, 5, 11, 12, 13, 14, 15], clipped to the document."""
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
    out = sorted(p for p in wanted if 1 <= p <= total)
    if not out:
        raise SystemExit(f"no pages in {spec!r} fall inside 1..{total}")
    return out


def page_char_counts(pdf) -> list[int]:
    """Extractable character count per page.

    This is the scan/text discriminator: a scanned page has an image and no
    text layer, so it returns 0. If a PDF is all zeros, it needs OCR before
    any extraction tool will help -- finding that out now saves a lot of time.
    """
    counts: list[int] = []
    for page in pdf.pages:
        try:
            counts.append(len(page.obj.get("/Contents") and
                              _extract_text(page) or ""))
        except Exception:                        # noqa: BLE001 - damaged page
            counts.append(0)
    return counts


def _extract_text(page) -> str:
    """Best-effort text from one page, via whatever pdfminer is installed."""
    try:
        import pdfminer.high_level
        return pdfminer.high_level.extract_text(page) or ""
    except Exception:                            # noqa: BLE001
        # pdfminer wants a file path, not a pikepdf page. Fall back to a crude
        # scan for text-showing operators, which is enough to tell scan from
        # text without pulling in another dependency.
        import re
        try:
            raw = bytes(page.Contents.read_bytes())
        except Exception:                        # noqa: BLE001
            return ""
        return "".join(m.decode("latin-1", "replace")
                       for m in re.findall(rb"\((?:[^()\\]|\\.)*\)", raw))
# --------------------------------------------------------------------------
# subcommands
# --------------------------------------------------------------------------

def cmd_inspect(args) -> int:
    path: Path = args.pdf
    if not path.exists():
        print(f"ERROR: no such PDF: {path}", file=sys.stderr)
        return 2

    size_mb = path.stat().st_size / (1024 * 1024)
    print(f"file       : {path}")
    print(f"size       : {size_mb:.2f} MB")

    try:
        with pikepdf.open(path) as pdf:
            n = len(pdf.pages)
            print(f"pages      : {n}")
            print(f"pdf version: {pdf.pdf_version}")
            print(f"encrypted  : {pdf.is_encrypted}")
            if pdf.docinfo:
                for key in ("/Title", "/Author", "/Producer", "/Creator"):
                    val = pdf.docinfo.get(key)
                    if val:
                        print(f"{key[1:].lower():<10} : {str(val)[:60]}")

            counts = page_char_counts(pdf)
            if counts:
                total_chars = sum(counts)
                texty = sum(1 for c in counts if c >= TEXT_CHARS_PER_PAGE)
                blank = sum(1 for c in counts if c == 0)
                print("")
                print(f"text chars : {total_chars:,} total, "
                      f"{total_chars // max(1, n):,} avg/page")
                print(f"pages w/ text : {texty}/{n}")
                print(f"pages w/ none : {blank}/{n}")

                if texty == 0:
                    print("")
                    print("VERDICT: NO TEXT LAYER -- this looks like a scan.")
                    print("         Text extraction will return nothing.")
                    print("         Run OCR (e.g. ocrmypdf) before extracting.")
                    return 1
                if blank:
                    print("")
                    print(f"VERDICT: mixed. {blank} page(s) have no text layer.")
                    print("         Tables on those pages need OCR.")
                else:
                    print("")
                    print("VERDICT: text-based. Table extraction should work.")

            if args.per_page:
                print("")
                print(f"{'page':>6} {'chars':>9}  note")
                for i, c in enumerate(counts, 1):
                    note = ("no text layer" if c == 0
                            else "sparse" if c < TEXT_CHARS_PER_PAGE else "")
                    print(f"{i:>6} {c:>9}  {note}")

            if args.json:
                report = {
                    "file": str(path), "size_mb": round(size_mb, 2),
                    "pages": n, "encrypted": bool(pdf.is_encrypted),
                    "total_text_chars": sum(counts),
                    "pages_with_text": sum(1 for c in counts
                                           if c >= TEXT_CHARS_PER_PAGE),
                    "pages_without_text": sum(1 for c in counts if c == 0),
                    "per_page_chars": counts,
                }
                out = Path(args.json)
                out.write_text(json.dumps(report, indent=2), encoding="utf-8")
                print(f"\nreport -> {out}")
    except pikepdf.PdfError as exc:
        print(f"ERROR: cannot read {path}: {exc}", file=sys.stderr)
        print("       try:  pdf_prep.py repair", file=sys.stderr)
        return 1
    return 0


def cmd_split(args) -> int:
    if not args.pdf.exists():
        print(f"ERROR: no such PDF: {args.pdf}", file=sys.stderr)
        return 2
    with pikepdf.open(args.pdf) as pdf:
        pages = parse_pages(args.pages, len(pdf.pages))
        # pikepdf.Pdf has no .copy() in v10 (only copy_foreign), so build a
        # fresh document and append the wanted pages into it.
        with pikepdf.new() as out:
            for p in pages:
                out.pages.append(pdf.pages[p - 1])
            out.save(args.out)
    print(f"wrote {len(pages)} page(s) -> {args.out}")
    return 0


def cmd_merge(args) -> int:
    for p in args.pdfs:
        if not p.exists():
            print(f"ERROR: no such PDF: {p}", file=sys.stderr)
            return 2
    with pikepdf.new() as out:
        for src in args.pdfs:
            with pikepdf.open(src) as pdf:
                out.pages.extend(pdf.pages)
        out.save(args.out)
    with pikepdf.open(args.out) as check:
        total = len(check.pages)
    print(f"merged {len(args.pdfs)} file(s), {total} page(s) -> {args.out}")
    return 0


def cmd_rotate(args) -> int:
    if not args.pdf.exists():
        print(f"ERROR: no such PDF: {args.pdf}", file=sys.stderr)
        return 2
    with pikepdf.open(args.pdf) as pdf:
        for page in pdf.pages:
            page.rotate(args.degrees, relative=True)
        pdf.save(args.out)
    print(f"rotated {len(pdf.pages)} page(s) by {args.degrees}deg -> {args.out}")
    return 0


def cmd_repair(args) -> int:
    if not args.pdf.exists():
        print(f"ERROR: no such PDF: {args.pdf}", file=sys.stderr)
        return 2
    try:
        with pikepdf.open(args.pdf) as pdf:
            pdf.save(args.out, linearize=True)
            n = len(pdf.pages)
    except pikepdf.PdfError as exc:
        print(f"ERROR: repair failed: {exc}", file=sys.stderr)
        return 1
    print(f"rewrote {n} page(s), linearised -> {args.out}")
    return 0
# --------------------------------------------------------------------------
# cli
# --------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(
        description="Inspect, split, merge, rotate and repair PDFs.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_ins = sub.add_parser("inspect", help="report pages, text layer, metadata")
    p_ins.add_argument("pdf", type=Path)
    p_ins.add_argument("--per-page", action="store_true",
                       help="show character count for every page")
    p_ins.add_argument("--json", help="write a JSON report here")
    p_ins.set_defaults(func=cmd_inspect)

    p_split = sub.add_parser("split", help="write selected pages to a new PDF")
    p_split.add_argument("pdf", type=Path)
    p_split.add_argument("--pages", required=True, help="e.g. 1-20 or 1,5,11-15")
    p_split.add_argument("--out", required=True, type=Path)
    p_split.set_defaults(func=cmd_split)

    p_merge = sub.add_parser("merge", help="concatenate PDFs")
    p_merge.add_argument("pdfs", nargs="+", type=Path)
    p_merge.add_argument("--out", required=True, type=Path)
    p_merge.set_defaults(func=cmd_merge)

    p_rot = sub.add_parser("rotate", help="rotate every page")
    p_rot.add_argument("pdf", type=Path)
    p_rot.add_argument("--degrees", type=int, default=90,
                       help="90, 180 or 270 (default 90)")
    p_rot.add_argument("--out", required=True, type=Path)
    p_rot.set_defaults(func=cmd_rotate)

    p_rep = sub.add_parser("repair", help="rewrite, fixing recoverable damage")
    p_rep.add_argument("pdf", type=Path)
    p_rep.add_argument("--out", required=True, type=Path)
    p_rep.set_defaults(func=cmd_repair)

    args = ap.parse_args()
    try:
        return args.func(args)
    except SystemExit:
        raise
    except Exception as exc:                      # noqa: BLE001
        print(f"ERROR: {exc.__class__.__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(errors="replace")
        except (AttributeError, OSError):
            pass
    sys.exit(main())