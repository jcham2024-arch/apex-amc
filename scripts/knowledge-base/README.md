# Knowledge base scripts

Reusable, tested scripts for the parts of this workspace that keep getting
rewritten: fetching source pages politely, pulling tables out of PDFs, gating
a harvested dataset before you trust it, and catching the Windows encoding
traps that silently break PowerShell pipelines.

Every script was **run against real data in this workspace** before being
filed here. Nothing in this folder is untested pseudocode.

## Start here

| You want to | Use | Verified against |
|---|---|---|
| Fetch source pages without getting blocked, resuming after a crash | [`harvesting/fetch_robust.py`](harvesting/fetch_robust.py) | example.com, python.org (live) |
| Same thing, inside a Node pipeline | [`node/fetch-pool.mjs`](node/fetch-pool.mjs) | example.com, python.org (live) |
| **Prove a record exists in its cited source** | [`data-quality/record_match.py`](data-quality/record_match.py) | 50/50 against the real 2.8 MB MBR corpus |
| Check a PDF before trusting any extraction | [`pdf/pdf_prep.py`](pdf/pdf_prep.py) | the real 21.6 MB Vihtavuori guide (77 pp) |
| Get tables out of a PDF and see *why* it went wrong | [`pdf/pdf_tables.py`](pdf/pdf_tables.py) | FBI NICS report (65×25 table) |
| Get tables out of HTML, rejecting layout junk | [`pdf/html_tables.py`](pdf/html_tables.py) | colspan tables + a layout-table decoy |
| Stop bad data shipping | [`data-quality/dataset_gate.py`](data-quality/dataset_gate.py) | `datasets/mbr_sporting/22_hornet.json` |
| Learn what is actually in a file | [`data-quality/profile_dataset.py`](data-quality/profile_dataset.py) | the same, plus 2.8 MB JSONL |
| Reclaim space from duplicate files, safely | [`data-quality/dedupe_files.py`](data-quality/dedupe_files.py) | multi-directory duplicate trees |
| Stop the `.ps1`-as-ANSI trap biting again | [`text-hygiene/encoding_guard.py`](text-hygiene/encoding_guard.py) | this repo's own `.ps1` files |
| Check where a pattern came from | [`_reference/SOURCES.md`](_reference/SOURCES.md) | — |

## Setup

```powershell
# Python side
python -m pip install requests protego pdfplumber jsonschema rapidfuzz `
    pikepdf pandas lxml beautifulsoup4 html5lib

# Node side (from C:\Cline)
npm i robots-parser
```

Verified working on **Python 3.14.6** and **Node 24.19.0**.

---

## 1. `harvesting/fetch_robust.py` — polite, resumable fetching

## 3. `data-quality/record_match.py` — prove the record was really there

The most dangerous bug in a scraped dataset is the record that looks entirely
plausible but was never in the source: a column shifted by one, a value
carried over from the previous row. Nothing errors. The data ships.

This asks the only question that matters — *can I find this record's evidence
in the document it cites?*

```powershell
# let it suggest which fields actually identify a row
python data-quality\record_match.py records.json --corpus cache\ --train

# then verify every record against the cached source text
python data-quality\record_match.py records.json --corpus cache\ `
    --fields start_load.charge_gr bullet.weight_gr
```

`--train` measures, per field, how often its value appears in the corpus and
how many lines it matches — a value present on 571 lines is useless as a
matcher, one on 15 lines is ideal. It prints the `--fields` line to paste.

**Evidence is token coverage, not line similarity.** A whole-line fuzzy score
is dominated by boilerplate and will happily return 92 for the wrong row.
Requiring each salient number to actually appear is stricter and explainable.

**Verified on real data:** 50/50 located against the 2.8 MB `mbr_records.jsonl`
corpus. Against a synthetic corpus it located 3/3 genuine records and rejected
2/2 fabricated ones (score 0%), which is the discrimination that matters.

## 4. `pdf/pdf_prep.py` — know what the PDF is before you parse it

```powershell
python pdf\pdf_prep.py inspect guide.pdf --per-page --json report.json
python pdf\pdf_prep.py split guide.pdf --pages 1-20 --out front.pdf
python pdf\pdf_prep.py merge a.pdf b.pdf --out combined.pdf
python pdf\pdf_prep.py rotate scan.pdf --degrees 90 --out upright.pdf
python pdf\pdf_prep.py repair broken.pdf --out fixed.pdf
```

`inspect` answers the question that saves the most time: **is there a text
layer at all?** A scanned page returns zero extractable characters, so every
table extractor will silently return nothing. Finding that out first saves
hours.

**Verified on the real 21.6 MB Vihtavuori guide:** 77 pages, 981,019
characters, and it correctly flagged **page 1 as image-only** (the cover) —
the kind of thing that otherwise becomes "why did this page return nothing?"

Split, merge, rotate and repair were all round-tripped and the outputs
re-validated as correct page counts.

## 5. `pdf/html_tables.py` — HTML tables without the layout noise

```powershell
python pdf\html_tables.py page.html --pretty
python pdf\html_tables.py pages/ --csv --min-score 0.6
```

HTML tables fail quietly too: `colspan` shifts every column, `<th>` gets used
for row labels, and "tables" built from `<div>` grids produce navigation noise.
This scores each candidate on density, distinctness and size, and rejects the
noise.

**Verified:** a real `colspan` load-data table scored **1.000** while a
navigation table in the same file scored **0.500** and was rejected at
`--min-score 0.6`. On a page with no `<table>` at all it says so plainly
rather than reporting a mysterious zero.
The four ways a naive scraper fails, and the fix for each:

| Failure | Fix |
|---|---|
| Hammered by a host, banned | per-host rate limiting, honours `Crawl-delay` |
| Re-downloads on every retry run | on-disk cache keyed by URL digest |
| Ignores robots.txt | Protego, RFC 9309, fails **closed** on 5xx |
| Dies at 30%, starts over | checkpoint after every URL, `--resume` |

```powershell
python harvesting\fetch_robust.py --manifest urls.txt --out-dir cache\ --delay 1.5
python harvesting\fetch_robust.py --manifest urls.txt --out-dir cache\ --resume
```

Retries use **full-jitter** exponential backoff and respect `Retry-After`.

## 8. `data-quality/dedupe_files.py` — reclaim space without losing data

Harvesting creates duplicates constantly: the same PDF under two names, a page
saved twice. Most dedup tools get this wrong by matching on filename (finding
nothing) or deleting without proving the content matched.

Staged hashing keeps it cheap — size, then a 64 KB head hash, then a full
SHA-256 only for survivors — so a directory of one-offs costs almost nothing.

```powershell
python data-quality\dedupe_files.py .                  # report only
python data-quality\dedupe_files.py . --execute        # replace dupes with hardlinks
python data-quality\dedupe_files.py . --execute --delete   # actually delete
```

**Safety, deliberately:** report-only is the default; `--execute` is required
to change anything; and duplicates are **hardlinked, not deleted**, so every
original path keeps working. Deletion is a further opt-in.

**Verified:** found exactly 3 identical files across subdirectories while
correctly ignoring a same-size-different-content decoy. After `--execute`,
all paths still read correctly with identical hashes (same inode, `nlink=3`),
the decoy was untouched, and a second run correctly reported zero duplicates
rather than falsely claiming the space was still reclaimable.

## 9. `data-quality/profile_dataset.py` — what is actually in this file?

```powershell
python data-quality\profile_dataset.py records.jsonl --sample 2000
python data-quality\profile_dataset.py records.jsonl --format markdown
python data-quality\profile_dataset.py records.json --field records
```

Per-column type, null rate, cardinality and distribution. Types are inferred
with a strict ladder — `int → float → bool → date → datetime → string` — using
the **narrowest type that fits every non-null value**, so a column that is 95%
integers and 5% `"n/a"` is honestly reported as `int` with the null count
shown, rather than a lie in either direction.

`--field` drills into a nested array; nested columns are marked `*` so you
know to look inside rather than trusting an opaque blob.

**Verified** on `22_hornet.json` (50 rows, 17 columns, nested `powder`/`bullet`
objects) and on the 2.8 MB `mbr_records.jsonl`.
Exit code is 1 if anything failed, so it drops straight into a pipeline.

**Where it fits here:** a drop-in replacement for the ad-hoc fetching inside
`scrape_mbr_full.ps1` / `scrape_simkins.ps1`. Keep the PowerShell parsing and
swap the transport, gaining cache + resume + robots enforcement.

## 2. `node/fetch-pool.mjs` — the same guarantees in Node

Same four properties, for pipelines that already live in Node
(`ApexProject/scripts/data`). Adds bounded `--concurrency`, with politeness
still enforced **per host** — four workers on four hosts is fine; four on one
host still serialises to one request at a time.

```powershell
node node\fetch-pool.mjs --manifest urls.txt --out-dir cache\ --concurrency 2
```

## 3. `pdf/pdf_tables.py` — PDF tables with a visual debug trail

PDF table extraction fails quietly. This script makes failure visible:

```powershell
python pdf\pdf_tables.py guide.pdf --pages 1-20 --auto --csv
python pdf\pdf_tables.py guide.pdf --pages 5 --debug     # writes a PNG per page
```

`--auto` scores each strategy (`lines`, `lines_strict`, `text`) on fill ratio
and row-width consistency, and keeps the winner. `--debug` renders the page
with every detected cell outlined, which turns *"the extraction is wrong"*
into *"column 4 is being split because the vertical rule is 3pt off"*.

## 6. `data-quality/dataset_gate.py` — the gate that can fail

Scraped data is wrong in boring, repeatable ways, and none of them raise an
exception. This checks structure, types, physical ranges, exact duplicates,
near-duplicates, and drift against a baseline.

```powershell
python data-quality\dataset_gate.py records.json --rules rules.json --key id
python data-quality\dataset_gate.py records.jsonl --baseline last-run.jsonl --key cartridge
```

Rules keep types and bounds together:

```json
{
  "start_load.velocity_fps": { "type": "numeric", "min": 300, "max": 4500, "required": true },
  "max_load.charge_gr":      { "type": "numeric", "min": 0.5, "max": 200, "required": true }
}
```

Nested fields use dotted paths (`start_load.velocity_fps`). An **empty dataset
is a failure**, not a pass. Exit 1 on any failure.

**Verified on real data:** on `22_hornet.json` it correctly found 3 duplicate
load records and — once the rules were written to match the file's actual
units — surfaced a genuine **unit inconsistency**: records 35+ store pressure
in psi (1644) while the rest use ksi (37.3). That is a real data defect, not a
script bug, and no amount of parsing would have caught it.

## 7. `text-hygiene/encoding_guard.py` — the ANSI/BOM trap

This workspace's most expensive recorded bug: **PowerShell reads `.ps1` as
ANSI** unless the file is UTF-8 *with* BOM, so one non-ASCII character can
kill a scraper with zero output and no error.

```powershell
python text-hygiene\encoding_guard.py . --check          # gate; exit 1 on problems
python text-hygiene\encoding_guard.py --fix-dir scripts --add-bom
```

Reports BOM kind, real encoding, CRLF/LF/mixed endings, mojibake signatures,
and the specific landmine: non-ASCII in a `.ps1` with no BOM.

A BOM on a `.ps1` is reported as an informational **note**, not a finding —
flagging it would make `--check` fail on files that are already correct, and a
gate that always fails is a gate nobody runs.

---

## Conventions these follow

Borrowed from `ApexProject/scripts/README.md`, which already sets the standard:

- **A gate must be able to fail.** Every check was verified in both directions:
  a clean input passes, a broken one fails.
- **One implementation of a rule.** If a check exists, import it.
- **Paths are never hardcoded.** Paths arrive as arguments.

## Notes and limitations

- Both fetchers are **sequential by default**. Parallelism is opt-in
  (`--concurrency`), and politeness is always enforced per host.
- `record_match.py` matches on **numeric identity tokens**. It is built for
  measurement-style data (loads, readings, counts). For datasets whose rows are
  distinguished by name alone, use `dataset_gate.py --key` instead.
- `record_match.py --source-field` only narrows the search when the cited
  filename is actually present in the corpus; otherwise it searches the whole
  corpus rather than silently finding nothing.
- `near-duplicates` in `dataset_gate.py` is O(n²) within a prefiltered sample,
  capped at 400 rows. Beyond that, use `--key` for exact identity.
- `pdf_tables.py` and `html_tables.py` handle text-based input.
  **Scanned PDFs need OCR**, which is out of scope — use `pdf_prep.py inspect`
  to find out whether you have that problem before you start.
- `profile_dataset.py` treats `""`, `NA`, `N/A`, `null`, `none`, `nan`, `-`,
  `--` and `?` as null. That is a choice; if your data uses those literally,
  use `dataset_gate.py` for exact control.
- `dedupe_files.py --execute` uses hardlinks, which need a filesystem that
  supports them (NTFS and ext4 do; some network shares do not). It falls back
  to reporting a failure per group rather than deleting.
- `--no-robots` on the fetchers is a real footgun. Use it only when permissions
  have been checked another way.
- Research and testing date: **2026-10-02**. Verify library APIs still match
  before relying on them in production.

**Verified:** extracted a 65x25 table at 0.85 fill from the FBI NICS
background-check PDF. The debug overlay also revealed the `text` strategy
over-extending its grid into the footnotes — exactly the class of bug that
produces a plausible-looking but wrong table.