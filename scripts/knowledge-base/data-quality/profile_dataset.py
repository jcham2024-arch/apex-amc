#!/usr/bin/env python3
"""
profile_dataset.py -- answer "what is actually in this file?" in one command.

The problem
----------
The first question about any newly acquired dataset is always the same, and
the default answer -- opening it in a spreadsheet -- does not scale. This
prints per-column type, null rate, cardinality, and distribution, so you learn
the shape of the data before writing a parser against it.

The type ladder is the strictest one that fits every non-null value:

    int -> float -> bool -> date -> datetime -> string

Strictness matters. A column that is 95% integers and 5% the word "n/a" is
reported as **string**, because a parser that assumes int will fail on the 5%
and you want to know that now, not in production.

Patterns from these published sources (see ../_reference/SOURCES.md):
  - csv-profile (sen-ltd/csv-profile)   the all-or-nothing typing ladder and
                                        the human/json/markdown output split
  - csvpeek-cli                         the one-glance column summary table
  - dataprof                            ISO 25012 quality dimensions folded in
  - Miller (jq's author)                pandas' describe() covers only numeric
                                        columns, which is why a profiler is
                                        needed at all

Usage
-----
    python profile_dataset.py records.json
    python profile_dataset.py records.jsonl --format markdown
    python profile_dataset.py big.csv --sample 100000 --json report.json

Exit codes
    0  profiled successfully
    1  the file could not be read / parsed
    2  usage error

Requires:  standard library only (CSV and JSON handled directly)
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import statistics
import sys
from collections import Counter
from datetime import date, datetime
from pathlib import Path

NULLISH = {"", "na", "n/a", "null", "none", "nan", "-", "--", "?"}
INT_RE = re.compile(r"^[+-]?\d+$")
FLOAT_RE = re.compile(r"^[+-]?(\d+\.\d*|\.\d+|\d+)([eE][+-]?\d+)?$")
BOOL_VALUES = {"true", "false", "yes", "no", "t", "f", "y", "n", "1", "0"}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DATETIME_RE = re.compile(r"^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?")


def is_null(value) -> bool:
    return value is None or (isinstance(value, str)
                             and value.strip().lower() in NULLISH)


def infer_type(values: list[str]) -> str:
    """Strictest type that every non-null value satisfies."""
    seen = False
    for v in values:
        if is_null(v):
            continue
        seen = True
        s = v.strip()
        low = s.lower()
        if INT_RE.match(s):
            continue
        if low in BOOL_VALUES:
            continue
        if FLOAT_RE.match(s):
            continue
        if DATE_RE.match(s):
            continue
        if DATETIME_RE.match(s):
            continue
        return "string"
    if not seen:
        return "empty"
    # Distinguish the narrowest type that fits every non-null value.
    non_null = [v.strip() for v in values if not is_null(v)]
    if all(INT_RE.match(v) for v in non_null):
        return "int"
    if all(v.lower() in BOOL_VALUES for v in non_null):
        return "bool"
    if all(DATETIME_RE.match(v) for v in non_null):
        return "datetime"
    if all(DATE_RE.match(v) for v in non_null):
        return "date"
    if all(FLOAT_RE.match(v) for v in non_null):
        return "float"
    return "string"
def load_csv(path: Path, sample: int | None) -> tuple[list[str], list[list]]:
    """Read a CSV, sniffing the dialect. Missing values become None."""
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        try:
            dialect = csv.Sniffer().sniff(fh.read(8192))
        except csv.Error:
            fh.seek(0)
            dialect = csv.excel
        fh.seek(0)
        reader = csv.reader(fh, dialect)
        rows: list[list] = []
        for i, row in enumerate(reader):
            if sample is not None and i >= sample:
                break
            rows.append(row)
    if not rows:
        return [], []
    header = rows[0]
    return header, rows[1:]


def load_json_records(path: Path, sample: int | None,
                      field: str | None) -> tuple[list[str], list[list]]:
    """Read a JSON array/wrapper or JSONL; return (columns, rows-as-lists).

    Columns are the union of keys seen, so a ragged file still profiles.
    Values keep their native types, because type inference on real JSON types
    is more honest than re-parsing strings.
    """
    text = path.read_text(encoding="utf-8-sig")
    if path.suffix.lower() in (".jsonl", ".ndjson"):
        records = [json.loads(l) for l in text.splitlines() if l.strip()]
    else:
        data = json.loads(text)
        if field and isinstance(data, dict) and isinstance(data.get(field), list):
            # --field names the array to profile. Works whether the array is
            # nested inside the wrapper or is one of several top-level keys.
            records = data[field]
        elif isinstance(data, dict):
            for key in ("records", "data", "items", "rows"):
                if isinstance(data.get(key), list):
                    records = data[key]
                    break
            else:
                records = [data]
        else:
            records = data

    records = [r for r in records if isinstance(r, dict)]
    if sample is not None:
        records = records[:sample]
    if not records:
        return [], []

    columns: list[str] = []
    seen = set()
    for rec in records:
        for key in rec:
            if key not in seen:
                seen.add(key)
                columns.append(str(key))
    rows = [[rec.get(c) for c in columns] for rec in records]
    return columns, rows


def profile_column(name: str, values: list) -> dict:
    """Per-column stats: nulls, distinct, type, and type-appropriate detail."""
    total = len(values)
    non_null = [v for v in values if not is_null(v)]
    nulls = total - len(non_null)

    stringified = []
    nested = False
    for v in non_null:
        if isinstance(v, (dict, list)):
            # Nested objects are not scalars. Render them compactly rather
            # than letting str() produce something meaningless, and flag the
            # column so the report says "use --field or inspect keys".
            nested = True
            stringified.append(json.dumps(v, sort_keys=True, default=str))
        else:
            stringified.append(v if isinstance(v, str) else str(v))
    kind = infer_type(stringified)

    info = {
        "column": name,
        "rows": total,
        "nulls": nulls,
        "null_pct": round(nulls / total * 100, 1) if total else 0.0,
        "distinct": len(set(stringified)),
        "type": kind,
    }
    if nested:
        info["nested"] = True

    if not non_null:
        return info

    if kind in ("int", "float"):
        numbers = []
        for v in stringified:
            try:
                numbers.append(float(v))
            except ValueError:
                pass
        if numbers:
            info["min"] = min(numbers)
            info["max"] = max(numbers)
            info["mean"] = round(statistics.fmean(numbers), 4)
            info["median"] = round(statistics.median(numbers), 4)
    elif kind == "bool":
        counts = Counter(v.strip().lower() in ("true", "yes", "t", "y", "1")
                         for v in stringified)
        info["true"] = counts.get(True, 0)
        info["false"] = counts.get(False, 0)
    elif kind in ("date", "datetime"):
        info["min"] = min(stringified)
        info["max"] = max(stringified)
    else:
        lengths = [len(v) for v in stringified]
        info["min_length"] = min(lengths)
        info["max_length"] = max(lengths)
        common = Counter(stringified).most_common(3)
        info["most_common"] = [{"value": v[:40], "count": c} for v, c in common]

    if info["distinct"] and info["distinct"] <= 12:
        info["values"] = sorted(set(stringified))[:12]
    return info
    if all(DATETIME_RE.match(v) for v in non_null):
        return "datetime"
    return "float"
# --------------------------------------------------------------------------
# output
# --------------------------------------------------------------------------

def fmt_human(path: Path, columns: list[str], stats: list[dict],
              n_rows: int) -> str:
    out = [f"file   : {path}",
           f"rows   : {n_rows:,}",
           f"columns: {len(columns)}",
           ""]
    width = max((len(s["column"]) for s in stats), default=4)
    out.append(f"  {'column'.ljust(width)}  {'type':<9} {'nulls':>10} "
               f"{'distinct':>9}")
    out.append("  " + "-" * (width + 42))
    for s in stats:
        nulls_txt = f"{s['nulls']} ({s['null_pct']}%)"
        distinct = s["distinct"] or 0
        # A column can be entirely null, in which case there is no type at
        # all -- report "null" rather than dereferencing None.
        base_type = s["type"] or "null"
        label = base_type + ("*" if s.get("nested") else "")
        out.append(f"  {s['column'][:width].ljust(width)}  "
                   f"{label:<9} {nulls_txt:>10} {distinct:>9}")
        if s["type"] in ("int", "float") and "min" in s:
            out.append(f"  {'':{width}}    min={s['min']:g} "
                       f"max={s['max']:g} mean={s.get('mean', 0):g} "
                       f"median={s.get('median', 0):g}")
        elif s["type"] == "bool":
            out.append(f"  {'':{width}}    true={s['true']} "
                       f"false={s['false']}")
        elif s["type"] == "string" and "most_common" in s:
            top = ", ".join(f"{c['value']!r}x{c['count']}"
                            for c in s["most_common"][:3])
            out.append(f"  {'':{width}}    len={s['min_length']}.."
                       f"{s['max_length']}  common: {top}")
    return "\n".join(out)


def fmt_markdown(path: Path, columns: list[str], stats: list[dict],
                 n_rows: int) -> str:
    out = [f"# Profile: `{path.name}`", "",
           f"- **rows:** {n_rows:,}", f"- **columns:** {len(columns)}", "",
           "| column | type | nulls | null % | distinct |",
           "|---|---|---:|---:|---:|"]
    for s in stats:
        out.append(f"| {s['column']} | {s['type']} | {s['nulls']} | "
                   f"{s['null_pct']}% | {s['distinct']} |")
    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Profile a CSV/JSON/JSONL dataset: types, nulls, ranges.")
    ap.add_argument("dataset", type=Path)
    ap.add_argument("--sample", type=int,
                    help="only read the first N rows (for very large files)")
    ap.add_argument("--field",
                    help="for a wrapper object, profile this inner array")
    ap.add_argument("--format", choices=("human", "json", "markdown"),
                    default="human")
    ap.add_argument("--json", type=Path, help="also write the JSON report here")
    ap.add_argument("--max-cols", type=int, default=60)
    args = ap.parse_args()

    if not args.dataset.exists():
        print(f"ERROR: no such file: {args.dataset}", file=sys.stderr)
        return 2

    try:
        if args.dataset.suffix.lower() == ".csv":
            columns, rows = load_csv(args.dataset, args.sample)
        else:
            columns, rows = load_json_records(args.dataset, args.sample,
                                              args.field)
    except (json.JSONDecodeError, csv.Error, OSError) as exc:
        print(f"ERROR: could not read {args.dataset}: "
              f"{exc.__class__.__name__}: {exc}", file=sys.stderr)
        return 1

    if not columns or not rows:
        print(f"ERROR: no rows found in {args.dataset}", file=sys.stderr)
        return 1

    stats = []
    for i, name in enumerate(columns):
        values = [row[i] if i < len(row) else None for row in rows]
        stats.append(profile_column(name, values))

    if args.format == "json":
        print(json.dumps({"file": str(args.dataset), "rows": len(rows),
                          "columns": columns, "profiles": stats},
                         indent=2, default=str))
    elif args.format == "markdown":
        print(fmt_markdown(args.dataset, columns, stats, len(rows)))
    else:
        print(fmt_human(args.dataset, columns, stats, len(rows)))
        if len(stats) > args.max_cols:
            print(f"\n... and {len(stats) - args.max_cols} more column(s)")

    if args.json:
        args.json.write_text(json.dumps(
            {"file": str(args.dataset), "rows": len(rows),
             "columns": columns, "profiles": stats}, indent=2,
            default=str), encoding="utf-8")
        print(f"\nreport -> {args.json}")

    return 0


if __name__ == "__main__":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(errors="replace")
        except (AttributeError, OSError):
            pass
    sys.exit(main())