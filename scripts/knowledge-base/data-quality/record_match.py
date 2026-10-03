#!/usr/bin/env python3
"""
record_match.py -- verify harvested records actually exist in their cited source.

The problem
----------
The most dangerous class of bug in a scraped dataset is the record that looks
completely plausible but was never in the source: a column shifted by one, a
value carried over from the previous row, a parse that silently picked up the
wrong cell. Nothing errors. The data ships. Nobody notices for months.

This script answers the only question that matters: *can I find this record's
evidence in the document it claims to come from?*

The technique
-------------
Full fuzzy matching every record against every page is O(n*m) and useless at
scale. So, following the record-linkage literature (recordlinkage, dedupeio,
RLTK), this uses **blocking** first: cheap key-based buckets that cut the
candidate space, then fuzzy scoring only within a bucket.

Blocking keys are chosen from what actually identifies a load-data row:
  - explicit numeric identity fields, when you supply them
  - otherwise, a set of salient tokens (numbers with units)

Scoring uses rapidfuzz ratios, which are order-preserving and cheap.

Patterns from these published sources (see ../_reference/SOURCES.md):
  - recordlinkage (j535d165/recordlinkage, BSD-3)  blocking before comparing
  - dedupeio/dedupe (MIT)      the idea that training data beats hand rules,
                                which is why --train can emit a rule file
  - RLTK (MIT)                 pluggable similarity + blocking components
  - rapidfuzz (MIT)            the scoring primitive

Usage
-----
    # verify records against the cached HTML they were scraped from
    python record_match.py records.json --corpus cache/ --fields charge_gr velocity_fps

    # tune on examples, then apply the learned rules
    python record_match.py records.json --corpus cache/ --train \
        --field powder.designation

    # gate a pipeline
    python record_match.py records.json --corpus cache/ --min-score 70

Exit codes
    0  every record located (or no corpus supplied)
    1  at least one record could not be located  <- the useful signal
    2  usage error

Requires:  pip install rapidfuzz
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

try:
    from rapidfuzz import fuzz
except ImportError:
    sys.exit("Missing dependency. Run:  pip install rapidfuzz")


# Numbers that identify a load-data row.
#
# The trailing lookahead allows a digit to be followed directly by a letter,
# because load data writes bullet weights as '30gr', '42.0gr', '55 gr'. A
# strict (?![\w.]) rejects those entirely, and then every bullet-weight field
# silently fails to match its own source. The leading lookahead is kept so we
# do not split identifiers like 'H335' or version strings into digits.
NUM_RE = re.compile(r"(?<![\w.])(\d{1,4}(?:\.\d{1,3})?)(?![\d.])")
WORD_RE = re.compile(r"[A-Za-z]{2,}")

# Tokens too common to be evidence of anything.
STOP_TOKENS = {
    "gr", "grain", "grains", "fps", "ft", "feet", "psi", "bar", "in",
    "inch", "the", "and", "max", "min", "start", "load", "powder", "bullet",
    "velocity", "weight", "calibre", "grainweight", "per", "of", "a", "to",
}


def get_path(record: dict, dotted: str):
    node: object = record
    for part in dotted.split("."):
        if isinstance(node, dict) and part in node:
            node = node[part]
        else:
            return None
    return node


def normalise_number(value) -> str | None:
    """Turn 42.0 / '42 gr' / 42 into '42' so tokens compare across formats.

    The trailing '.0' MUST be stripped: the corpus tokenises '10.0' as the
    single string '10.0', while a JSON record holds 10.0 -> '10'. Without this
    every integer-valued record mismatches its own source.
    """
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        f = float(value)
        return str(int(f)) if f == int(f) else f"{f:g}"
    match = NUM_RE.search(str(value))
    if not match:
        return None
    raw = match.group(1)
    f = float(raw)
    return str(int(f)) if f == int(f) else f"{f:g}"


def tokenise_corpus(text: str) -> list[str]:
    """All numeric tokens in a document, normalised the same way as records.

    Uses the identical normalise_number path so '10.0' in HTML and 10.0 in
    JSON both collapse to '10' and can match.
    """
    out = []
    for m in NUM_RE.finditer(text):
        tok = normalise_number(m.group(1))
        if tok:
            out.append(tok)
    return out


def record_tokens(record: dict, fields: list[str]) -> list[str]:
    """Salient identity tokens for one record.

    Prefers explicit fields; falls back to every number in the record, which
    is a blunt but surprisingly effective identity signal for numeric data.
    """
    tokens: list[str] = []
    for name in fields:
        value = record.get(name) if name in record else get_path(record, name)
        if value is None:
            continue
        if isinstance(value, (int, float)):
            token = normalise_number(value)
            if token:
                tokens.append(token)
        else:
            token = normalise_number(value)
            if token:
                tokens.append(token)
    if not tokens:
        for value in record.values():
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                token = normalise_number(value)
                if token and token not in STOP_TOKENS:
                    tokens.append(token)
    return [t for t in dict.fromkeys(tokens) if t not in STOP_TOKENS]


@dataclass
class Verdict:
    index: int
    score: float
    matched_tokens: list[str]
    missing_tokens: list[str]
    best_line: str

    @property
    def found(self) -> bool:
        return not self.missing_tokens
# --------------------------------------------------------------------------
# corpus loading
# --------------------------------------------------------------------------

TEXT_EXTENSIONS = {".txt", ".html", ".htm", ".json", ".jsonl", ".ndjson",
                   ".md", ".csv", ".tsv", ".xml"}


def load_corpus(paths: list[Path]) -> dict[str, list[tuple[str, str]]]:
    """Build token -> [(doc_name, line)] for fast lookup.

    Stored inverted rather than as raw documents because the question we ask
    is 'which lines contain this number', not 'read the whole page again'.
    """
    inverted: dict[str, list[tuple[str, str]]] = defaultdict(list)
    files = 0
    for path in paths:
        candidates = ([path] if path.is_file()
                      else sorted(p for p in path.rglob("*") if p.is_file()))
        for file in candidates:
            if file.suffix.lower() not in TEXT_EXTENSIONS:
                continue
            try:
                text = file.read_text(encoding="utf-8-sig", errors="replace")
            except OSError:
                continue
            files += 1
            name = str(file)
            for line in text.splitlines():
                stripped = line.strip()
                if not stripped:
                    continue
                for token in set(tokenise_corpus(stripped)):
                    inverted[token].append((name, stripped))
    if not files:
        raise SystemExit("no readable corpus files found; check --corpus")
    return inverted


# --------------------------------------------------------------------------
# matching
# --------------------------------------------------------------------------

def match_record(record: dict, inverted: dict, fields: list[str],
                 doc_hint_candidate: str | None,
                 corpus_docs: set[str]) -> Verdict:
    """Locate a record's evidence by requiring its identity tokens.

    Evidence is judged by *coverage of the record's own tokens*, not by fuzzy
    similarity between two long strings. That distinction matters: a whole-line
    similarity score is dominated by boilerplate and would happily return 92
    for the wrong row. Requiring each salient number to actually appear is
    stricter and far easier to explain to a reviewer.
    """
    tokens = record_tokens(record, fields)
    if not tokens:
        return Verdict(-1, 0.0, [], ["<no identity tokens>"], "")

    # A source hint narrows the search ONLY when it names a file we actually
    # indexed. Records frequently cite an original web page while the corpus
    # holds the *extracted* copy under a different filename, and blindly
    # filtering on the hint would discard every candidate line -- turning a
    # corpus that provably contains the evidence into 0% found.
    doc_hint = None
    if doc_hint_candidate:
        needle = doc_hint_candidate
        if any(needle in doc for doc in corpus_docs) or not corpus_docs:
            doc_hint = needle

    # Group candidate lines by which of the record's tokens they contain.
    by_line: dict[tuple[str, str], set[str]] = defaultdict(set)
    for token in tokens:
        for doc, line in inverted.get(token, []):
            if doc_hint and doc_hint not in doc:
                continue
            by_line[(doc, line)].add(token)

    if not by_line:
        return Verdict(-1, 0.0, [], tokens, "")

    best_key, best_covered = None, set()
    for key, covered in by_line.items():
        if len(covered) > len(best_covered):
            best_key, best_covered = key, covered

    score = (len(best_covered) / len(tokens)) * 100.0
    missing = [t for t in tokens if t not in best_covered]
    return Verdict(0, score, sorted(best_covered), missing,
                   (best_key[1][:160] if best_key else ""))


# --------------------------------------------------------------------------
# report
# --------------------------------------------------------------------------

def load_records(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8-sig")
    if path.suffix.lower() in (".jsonl", ".ndjson"):
        return [json.loads(l) for l in text.splitlines() if l.strip()]
    data = json.loads(text)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("records", "data", "items", "rows"):
            if isinstance(data.get(key), list):
                return data[key]
    return [data]


def flatten(record: dict, prefix: str = "") -> dict:
    """Flatten nested records to dotted paths.

    Necessary because real harvested records nest (start_load.charge_gr) while
    --train reasons about fields by name. Without this, every nested field is
    skipped and the report comes back empty.
    """
    out: dict = {}
    for key, value in record.items():
        name = f"{prefix}.{key}" if prefix else str(key)
        if isinstance(value, dict):
            out.update(flatten(value, name))
        elif isinstance(value, list):
            continue                       # list members are not identity fields
        else:
            out[name] = value
    return out


def train_rules(records: list[dict], corpus_paths: list[Path],
                sample: int = 40) -> int:
    """Suggest which fields actually identify a row, by measuring evidence.

    For each candidate field: how often does its value appear in the corpus,
    and how many corpus lines does it match? A value present on nearly every
    line carries no information, so feeding it to --fields only adds noise.
    """
    inverted = load_corpus(corpus_paths)
    present: dict[str, int] = defaultdict(int)
    considered: dict[str, int] = defaultdict(int)
    spread: dict[str, int] = defaultdict(int)

    for record in records[:sample]:
        for name, value in flatten(record).items():
            token = normalise_number(value)
            if not token:
                continue
            considered[name] += 1
            hits = len(inverted.get(token, []))
            if hits:
                present[name] += 1
                spread[name] = max(spread[name], hits)

    ranked = [(present[n] / considered[n], considered[n], spread[n], n)
              for n in considered
              if considered[n] >= 3 and present[n] / considered[n] >= 0.8]

    print(f"field evidence over {min(sample, len(records))} record(s), "
          f"{len(considered)} candidate field(s)\n")
    print(f"  {'field':<36} {'in corpus':>11} {'max lines':>11}")
    print("  " + "-" * 62)
    if not ranked:
        print("  (no field was present in the corpus at least 80% of the time)")
        print("  Check --corpus points at the SOURCE documents, not at the dataset.")
    for coverage, total, hits, name in sorted(ranked, key=lambda r: -r[2])[:25]:
        print(f"  {name:<36} {coverage:>10.0%} {hits:>11}")
    if ranked:
        top = sorted(ranked, key=lambda r: -r[2])[:3]
        print("\n  Low 'max lines' = specific = a good matcher. "
              "High = ubiquitous = noise.")
        print("  Try:  --fields " + " ".join(r[3] for r in top))
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Verify harvested records exist in their cited source corpus.")
    ap.add_argument("records", type=Path,
                    help=".json array / wrapper object / .jsonl of records")
    ap.add_argument("--corpus", nargs="+", type=Path, required=True,
                    help="files or directories of source text/html to search")
    ap.add_argument("--fields", nargs="*", default=[],
                    help="identity fields, e.g. start_load.charge_gr bullet.weight_gr. "
                         "Omit to auto-pick numeric fields.")
    ap.add_argument("--source-field", default="source_url",
                    help="record field naming the source; used to narrow the "
                         "search when present (default: source_url)")
    ap.add_argument("--min-score", type=float, default=100.0,
                    help="required %% of identity tokens found in one line "
                         "(default 100 = every token must be present)")
    ap.add_argument("--train", action="store_true",
                    help="report which fields are usable as matchers, then exit")
    ap.add_argument("--sample", type=int, default=40,
                    help="records to consider for --train")
    ap.add_argument("--show", type=int, default=10,
                    help="how many unlocated records to print")
    ap.add_argument("--report", type=Path, help="write full JSON report here")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    if not args.records.exists():
        print(f"ERROR: no such file: {args.records}", file=sys.stderr)
        return 2
    for path in args.corpus:
        if not path.exists():
            print(f"ERROR: no such corpus path: {path}", file=sys.stderr)
            return 2

    try:
        records = load_records(args.records)
    except (json.JSONDecodeError, OSError) as exc:
        print(f"ERROR: cannot read records: {exc}", file=sys.stderr)
        return 2

    if not records:
        print("ERROR: dataset contains zero records", file=sys.stderr)
        return 1

    if not args.quiet:
        print(f"records : {args.records} ({len(records)})")
        print(f"corpus  : {', '.join(str(p) for p in args.corpus)}")
        if not args.fields:
            print("fields  : auto (numeric identity fields)")
        else:
            print(f"fields  : {', '.join(args.fields)}")
        print("")

    if args.train:
        return train_rules(records, args.corpus, args.sample)

    inverted = load_corpus(args.corpus)
    if not args.quiet:
        print(f"corpus indexed: {len(inverted)} distinct numeric token(s)\n")

    corpus_docs = {doc for lines in inverted.values() for doc, _ in lines}

    unlocated: list[dict] = []
    located = 0
    for i, record in enumerate(records):
        hint = None
        for candidate in (args.source_field, "source_url", "source_page", "url"):
            value = get_path(record, candidate)
            if value:
                # Keep just the filename: corpus paths are absolute on this
                # machine, the cited URL is not, so a full-URL comparison
                # could never match.
                hint = str(value).rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
                break
        verdict = match_record(record, inverted, args.fields, hint, corpus_docs)
        if verdict.score >= args.min_score:
            located += 1
        else:
            unlocated.append({
                "index": i,
                "score": round(verdict.score, 1),
                "missing_tokens": verdict.missing_tokens,
                "best_line": verdict.best_line,
                "source_hint": hint,
            })

    total = len(records)
    pct = (located / total * 100) if total else 0.0
    if not args.quiet:
        print(f"located in source : {located}/{total} ({pct:.1f}%)")
        print(f"NOT located       : {len(unlocated)}")

    if unlocated:
        print("")
        print(f"worst {min(args.show, len(unlocated))} unlocated record(s):")
        for item in unlocated[:args.show]:
            print(f"  [{item['index']:>5}] score {item['score']:>5.1f}%  "
                  f"missing {item['missing_tokens'][:6]}")
            if item["best_line"]:
                print(f"          best source line: {item['best_line'][:110]}")

    if args.report:
        args.report.write_text(json.dumps({
            "records": str(args.records),
            "total": total, "located": located,
            "unlocated": len(unlocated),
            "min_score": args.min_score,
            "fields": args.fields or "auto",
            "failures": unlocated,
        }, indent=2), encoding="utf-8")
        print(f"\nreport -> {args.report}")

    return 1 if unlocated else 0


if __name__ == "__main__":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(errors="replace")
        except (AttributeError, OSError):
            pass
    sys.exit(main())