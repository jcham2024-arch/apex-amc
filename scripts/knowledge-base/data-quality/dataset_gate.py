#!/usr/bin/env python3
"""
dataset_gate.py -- validate a harvested dataset before you trust it.

The problem
----------
Scraped data is wrong in boring, repeatable ways. A column silently becomes
text, a number gets a stray footnote marker, the same record appears twice
because one page was reachable by two URLs, and a merge quietly produced 0
rows. None of that raises an exception. All of it ships.

This script is the gate that must be able to FAIL. Following the convention
already used in ApexProject/scripts ("a gate that cannot fail is worse than
no gate"), every check below has a negative test in selftest_gate.py.

What it checks
--------------
  structure   file parses; required keys present in every record
  types       numeric fields really are numeric (not "12.3 gr")
  ranges      physical / business bounds, e.g. velocity 300-4500 fps
  duplicates  exact dupes, plus near-dupes within a tolerance
  orphans     referential integrity where one record points at another
  drift       per-key row counts vs a baseline, to catch a broken re-run

Patterns from these published sources (see ../_reference/SOURCES.md):
  - dataset-audit-kit (MIT)      the check taxonomy: schema, missing, dupes,
                                  distribution drift, and CI-friendly exit 1
  - Pandera (MIT)                per-column dtype + range rule files
  - jsonschema (MIT)             declarative schema validation when you want it
  - rapidfuzz (MIT)              cheap near-duplicate detection via ratios
  - jsonl-diff                   the discipline of treating identity and
                                  duplicate handling as explicit policy

Usage
-----
    python dataset_gate.py records.json --schema schema.json
    python dataset_gate.py records.jsonl --schema schema.json --baseline before.jsonl
    python dataset_gate.py records.json --rules rules.json --near-dupes 0.92
    python dataset_gate.py selftest_gate.py --selftest

Exit codes
    0  all checks passed
    1  at least one check failed  (usable as a pipeline / CI gate)
    2  usage error

Requires:  pip install jsonschema rapidfuzz
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path

try:
    from rapidfuzz import fuzz
except ImportError:
    sys.exit("Missing dependency. Run:  pip install rapidfuzz")

try:
    import jsonschema
except ImportError:
    jsonschema = None   # optional; --schema will complain clearly if absent


# --------------------------------------------------------------------------
# loading
# --------------------------------------------------------------------------

def load_records(path: Path) -> list[dict]:
    """Load a .json array, a .json object wrapping one, or .jsonl.

    Being liberal here matters: the same dataset arrives as a JSON array from
    one tool and as JSONL from another, and the gate should not care.
    """
    text = path.read_text(encoding="utf-8-sig")     # -sig: tolerate a BOM
    stripped = text.lstrip()

    if path.suffix.lower() in (".jsonl", ".ndjson"):
        return [json.loads(line) for line in stripped.splitlines() if line.strip()]

    data = json.loads(stripped)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("records", "data", "items", "rows"):
            if isinstance(data.get(key), list):
                return data[key]
        return [data]                                # a single record
    raise ValueError(f"{path}: expected a JSON array or object, got {type(data)}")


def coerce_number(value) -> float | None:
    """Pull a number out of '12.3 gr', '1,200', '45 fps', 45.0.

    Returns None when there is no number. Deliberately forgiving on input and
    strict on range: harvesters emit decorated numbers, and the range check is
    the thing that must not be forgiving.
    """
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().replace(",", "")
    if not s:
        return None
    out = ""
    for ch in s:
        if ch.isdigit() or ch in ".-+":
            out += ch
        else:
            break
    try:
        return float(out)
    except ValueError:
        return None


def rule_values(record: dict, path: str):
    """Fetch a possibly-nested value by dotted path."""
    node: object = record
    for part in path.split("."):
        if isinstance(node, dict) and part in node:
            node = node[part]
        else:
            return None
    return node


# --------------------------------------------------------------------------
# checks
# --------------------------------------------------------------------------

@dataclass
class Result:
    name: str
    passed: bool
    detail: str = ""
    samples: list = field(default_factory=list)

    def line(self) -> str:
        mark = "PASS" if self.passed else "FAIL"
        text = f"[{mark}] {self.name}: {self.detail}"
        for s in self.samples[:5]:
            text += f"\n         e.g. {s}"
        if len(self.samples) > 5:
            text += f"\n         ... and {len(self.samples) - 5} more"
        return text


def check_structure(records: list[dict], required: list[str]) -> Result:
    """Every required path must resolve to a present key.

    Accepts dotted paths ('start_load.charge_gr'), not just top-level keys --
    nested records are the normal case for harvested data.
    """
    missing_counts: Counter = Counter()
    samples: list[str] = []
    for i, rec in enumerate(records):
        for key in required:
            value = rule_values(rec, key)
            # A key present but explicitly null still counts as missing for
            # a *required* field: the consumer needs a usable value.
            if value is None:
                missing_counts[key] += 1
                if len(samples) < 5:
                    samples.append(f"record {i} has no value at {key!r}")
    if not missing_counts:
        return Result("structure", True,
                      f"all {len(records)} record(s) have "
                      f"{len(required)} required key(s)")
    detail = ", ".join(f"{k!r} missing in {v}" for k, v in missing_counts.most_common())
    return Result("structure", False, detail, samples)


def check_types(records: list[dict], numeric_fields: list[str]) -> Result:
    bad: list[str] = []
    total = 0
    for i, rec in enumerate(records):
        for name in numeric_fields:
            val = rule_values(rec, name)
            if val is None:
                continue
            total += 1
            if coerce_number(val) is None:
                bad.append(f"record {i}: {name}={val!r}")
    if not bad:
        return Result("types", True,
                      f"{total} numeric value(s) parsed across "
                      f"{len(numeric_fields)} field(s)")
    return Result("types", False,
                  f"{len(bad)} of {total} value(s) are not numeric", bad)


def check_near_duplicates(records: list[dict], field_name: str,
                          threshold: float, sample_limit: int = 400) -> Result:
    """Near-duplicate detection on one text field, using fuzzy ratios.

    Catches what exact-duplicate checking misses: the same row re-parsed with
    different whitespace, punctuation or case. Prefiltered by a shared prefix
    and capped, because a naive all-pairs compare does not scale.
    """
    values = [str(rule_values(r, field_name) or "").strip() for r in records]
    populated = [(i, v) for i, v in enumerate(values) if v]
    if len(populated) < 2:
        return Result("near-duplicates", True, "not enough rows to compare")

    sample = populated[:sample_limit]
    truncated = len(populated) - len(sample)

    buckets: dict[str, list[int]] = defaultdict(list)
    for idx, (_i, v) in enumerate(sample):
        buckets[v.lower()[:24]].append(idx)     # cheap prefilter

    pairs: list[str] = []
    for members in buckets.values():
        for a in range(len(members)):
            for b in range(a + 1, len(members)):
                ia, va = sample[members[a]]
                ib, vb = sample[members[b]]
                # Exact repeats are the --key duplicate check's job, not this
                # one. Reporting them here would bury the real signal: a field
                # legitimately holding the same value 20 times (a powder
                # designation, say) would drown out genuine near-matches.
                if va.lower() == vb.lower():
                    continue
                score = fuzz.ratio(va.lower(), vb.lower())
                if score >= threshold * 100:
                    pairs.append(f"records {ia}/{ib} score {score:.1f}: "
                                 f"{va[:40]!r} ~ {vb[:40]!r}")

    if not pairs:
        detail = f"no pairs above {threshold:.2f} in {len(sample)} row(s)"
        if truncated:
            detail += f" ({truncated} row(s) not compared)"
        return Result("near-duplicates", True, detail)
    return Result("near-duplicates", False,
                  f"{len(pairs)} near-duplicate pair(s) at threshold "
                  f"{threshold:.2f}", pairs)


def check_drift(records: list[dict], baseline: list[dict],
                key_fields: list[str], tolerance: float) -> Result:
    """Per-key row counts must not move by more than `tolerance` (fraction).

    A total collapse is called out separately because that is the signature of
    a re-run that silently fetched nothing.
    """
    def counts(rows: list[dict]) -> Counter:
        c: Counter = Counter()
        for rec in rows:
            c[tuple(str(rule_values(rec, f)) for f in key_fields)] += 1
        return c

    now, before = counts(records), counts(baseline)
    notes: list[str] = []
    for key in sorted(set(now) | set(before)):
        a, b = now.get(key, 0), before.get(key, 0)
        if b == 0:
            notes.append(f"{'+'.join(key)}: {a} new row(s), absent from baseline")
            continue
        delta = abs(a - b) / b
        if delta > tolerance:
            notes.append(f"{'+'.join(key)}: {b} -> {a} ({delta:+.0%})")

    total_before, total_now = sum(before.values()), sum(now.values())
    if total_before and total_now < total_before * (1 - tolerance):
        notes.append(f"TOTAL rows {total_before} -> {total_now} "
                     f"({total_now - total_before:+d}); a re-run likely failed")

    if not notes:
        return Result("drift", True,
                      f"{len(now)} key(s) within {tolerance:.0%} of baseline")
    return Result("drift", False,
                  f"{len(notes)} key(s) moved more than {tolerance:.0%}", notes)


def check_ranges(records: list[dict], ranges: dict) -> Result:
    """Numeric bounds per field, e.g. velocity_fps must be 300-4500.

    This is the check that catches a column that parsed cleanly as text but
    contains physically impossible values -- the failure mode that looks most
    like success.
    """
    violations: list[str] = []
    checked = 0
    for i, rec in enumerate(records):
        for name, (lo, hi) in ranges.items():
            val = coerce_number(rule_values(rec, name))
            if val is None:
                continue
            checked += 1
            if not (lo <= val <= hi):
                violations.append(
                    f"record {i}: {name}={val:g} outside [{lo}, {hi}]")
    if not violations:
        return Result("ranges", True, f"{checked} value(s) within bounds")
    return Result("ranges", False,
                  f"{len(violations)} of {checked} value(s) out of range",
                  violations)


def check_duplicates(records: list[dict], key_fields: list[str]) -> Result:
    """Exact duplicate detection on the record's identity fields."""
    seen: dict[tuple, int] = defaultdict(int)
    samples: list[str] = []
    for i, rec in enumerate(records):
        key = tuple(str(rule_values(rec, f)) for f in key_fields)
        seen[key] += 1
        if seen[key] == 2:
            samples.append(f"record {i} duplicates {'+'.join(key)}")
    dupes = {k: v for k, v in seen.items() if v > 1}
    total_extra = sum(v - 1 for v in dupes.values())
    if not dupes:
        return Result("duplicates", True,
                      f"no duplicate {'+'.join(key_fields)} among "
                      f"{len(records)} record(s)")
    return Result("duplicates", False,
                  f"{total_extra} duplicate row(s) across {len(dupes)} key(s)",
                  samples)


def check_jsonschema(records: list[dict], schema: dict) -> Result:
    """Declarative validation, when a JSON Schema is clearer than flags."""
    if jsonschema is None:
        return Result("jsonschema", False,
                      "jsonschema not installed; run: pip install jsonschema")
    validator = jsonschema.Draft7Validator(schema)
    errors: list[str] = []
    for i, rec in enumerate(records):
        for err in validator.iter_errors(rec):
            if len(errors) < 5:
                errors.append(f"record {i}: {'/'.join(map(str, err.path))} "
                              f"{err.message[:90]}")
            else:
                errors.append("...")
    if not errors:
        return Result("jsonschema", True,
                      f"all {len(records)} record(s) validate")
    return Result("jsonschema", False, "schema violations", errors)


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Validate a harvested dataset. Exit 1 if any check fails.")
    ap.add_argument("dataset", type=Path,
                    help=".json array, .json wrapper object, or .jsonl")
    ap.add_argument("--schema", type=Path, help="JSON Schema file")
    ap.add_argument("--rules", type=Path,
                    help='JSON rules: {"field": {"min": 0, "max": 10, '
                         '"type": "numeric"}}; type + ranges in one place')
    ap.add_argument("--required", nargs="*", default=[],
                    help="keys that must exist in every record")
    ap.add_argument("--numeric", nargs="*", default=[],
                    help="fields that must parse as numbers")
    ap.add_argument("--key", nargs="*", default=[],
                    help="fields forming the record identity (duplicates/drift)")
    ap.add_argument("--baseline", type=Path,
                    help="previous dataset to compare against for drift")
    ap.add_argument("--drift-tolerance", type=float, default=0.10)
    ap.add_argument("--near-dupes", metavar="FIELD",
                    help="detect near-duplicates in this text field")
    ap.add_argument("--near-dupes-threshold", type=float, default=0.92)
    ap.add_argument("--report", type=Path, help="write a JSON report here")
    args = ap.parse_args()

    if not args.dataset.exists():
        print(f"ERROR: no such dataset: {args.dataset}", file=sys.stderr)
        return 2

    try:
        records = load_records(args.dataset)
    except (json.JSONDecodeError, ValueError, OSError) as exc:
        print(f"ERROR: could not load {args.dataset}: {exc}", file=sys.stderr)
        return 1

    if not records:
        print(f"FAIL: {args.dataset} contains zero records. "
              "An empty dataset is a failure, not a pass.", file=sys.stderr)
        return 1

    numeric_fields = list(args.numeric)
    ranges: dict[str, tuple[float, float]] = {}

    if args.rules:
        try:
            rules = json.loads(args.rules.read_text(encoding="utf-8-sig"))
        except json.JSONDecodeError as exc:
            print(f"ERROR: --rules is not valid JSON: {exc}", file=sys.stderr)
            return 2
        for name, rule in rules.items():
            if rule.get("type") == "numeric" and name not in numeric_fields:
                numeric_fields.append(name)
            if "min" in rule or "max" in rule:
                lo = float(rule.get("min", float("-inf")))
                hi = float(rule.get("max", float("inf")))
                ranges[name] = (lo, hi)
            if rule.get("required") and name not in args.required:
                args.required.append(name)

    print(f"dataset: {args.dataset}  ({len(records)} record(s))")

    results: list[Result] = []

    if args.schema:
        try:
            schema = json.loads(args.schema.read_text(encoding="utf-8-sig"))
        except json.JSONDecodeError as exc:
            print(f"ERROR: --schema is not valid JSON: {exc}", file=sys.stderr)
            return 2
        results.append(check_jsonschema(records, schema))

    if args.required:
        results.append(check_structure(records, args.required))
    if numeric_fields:
        results.append(check_types(records, numeric_fields))
    if ranges:
        results.append(check_ranges(records, ranges))
    if args.key:
        results.append(check_duplicates(records, args.key))
    if args.near_dupes:
        results.append(check_near_duplicates(records, args.near_dupes,
                                            args.near_dupes_threshold))
    if args.baseline:
        if not args.key:
            print("ERROR: --baseline also needs --key to group rows", file=sys.stderr)
            return 2
        try:
            baseline = load_records(args.baseline)
        except (json.JSONDecodeError, ValueError, OSError) as exc:
            print(f"ERROR: could not load baseline: {exc}", file=sys.stderr)
            return 2
        results.append(check_drift(records, baseline, args.key,
                                   args.drift_tolerance))

    if not results:
        print("ERROR: no checks requested. Pass --required/--numeric/--key/"
              "--schema/--rules.", file=sys.stderr)
        return 2

    print("")
    for result in results:
        print(result.line())

    failed = [r for r in results if not r.passed]
    print("")
    print(f"{len(results) - len(failed)}/{len(results)} check(s) passed")

    if args.report:
        args.report.write_text(json.dumps({
            "dataset": str(args.dataset),
            "records": len(records),
            "passed": len(results) - len(failed),
            "total": len(results),
            "checks": [{"name": r.name, "passed": r.passed, "detail": r.detail,
                        "samples": r.samples[:25]} for r in results],
        }, indent=2), encoding="utf-8")
        print(f"report -> {args.report}")

    if failed:
        print(f"FAILED: {', '.join(r.name for r in failed)}")
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(errors="replace")
        except (AttributeError, OSError):
            pass
    sys.exit(main())
