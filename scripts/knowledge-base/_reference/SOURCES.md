# Source index — where every pattern in this folder came from

Every script here is **synthesised from published, permissively-licensed
sources**. Nothing is copied wholesale from a proprietary tool, and each file
names its inspirations in its own header comment. This file is the single
place to check provenance and licensing.

Research date: **2026-10-02**. Links verified live at that time.

---

## Libraries and tools researched

| Project | Licence | What was taken | Used by |
|---|---|---|---|
| [Protego](https://github.com/scrapy/protego) (scrapy) | BSD-3 | RFC 9309 robots.txt parsing: `parse()`, `can_fetch()`, `crawl_delay()`, `sitemaps`, `preferred_host` | `fetch_robust.py` |
| [robots-parser](https://github.com/samclarke/robots-parser) | MIT | The JS equivalent of the above: `isAllowed()`, `getCrawlDelay()`, `getSitemaps()` | `fetch-pool.mjs` |
| [pdfplumber](https://github.com/jsvine/pdfplumber) | MIT | `extract_table(s)`, `table_settings` keys, `debug_tablefinder`, visual debugging | `pdf_tables.py` |
| [Camelot](https://github.com/camelot-dev/camelot) | MIT | The accuracy-metric idea — score candidate extractions instead of eyeballing them | `pdf_tables.py` |
| [rapidfuzz](https://github.com/rapidfuzz/rapidfuzz) | MIT | `fuzz.ratio` for cheap near-duplicate detection | `dataset_gate.py` |
| [jsonschema](https://github.com/python-jsonschema/jsonschema) | MIT | Declarative per-record validation when flags are not enough | `dataset_gate.py` |
| [dataset-audit-kit](https://github.com/Muhtasim-Munif-Fahim/dataset-audit-kit) | MIT | The check taxonomy: schema drift, missingness, duplicates, drift, CI exit code | `dataset_gate.py` |
| [Scrapling](https://github.com/D4Vinci/Scrapling) | BSD-3 | Disk response caching so parsers can be iterated without refetching | both fetchers |
| [TransferX](https://github.com/zed-syn/TransferX) | MIT | Retry with **full-jitter** exponential backoff, `Retry-After` handling, 429 awareness | both fetchers |
| [Reppy](https://github.com/seomoz/reppy) | MIT | robots.txt `Crawl-delay` / `Sitemaps` handling as a first-class concern | `fetch_robust.py` |
| [protego vs urllib.robotparser](https://puneetindersingh/robots-txt-tester) | — | **Why** not to use `urllib.robotparser`: it lacks `*`/`$` wildcard support, so `Disallow: /*?sessionid=` silently becomes a no-op | design rationale |
| [Microsoft: about_Character_Encoding](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_character_encoding) | MS docs | The `.ps1`-as-ANSI / BOM conflict and PowerShell's per-cmdlet encoding defaults | `encoding_guard.py` |

### Second sweep — record linkage, dedup, profiling, HTML

| Project | Licence | What was taken | Used by |
|---|---|---|---|
| [recordlinkage](https://github.com/j535d165/recordlinkage) | BSD-3 | **Blocking before comparing** — cut candidate pairs before any expensive similarity work | `record_match.py` |
| [dedupeio/dedupe](https://github.com/dedupeio/dedupe) | MIT | Learning match rules from evidence rather than hand-writing them — the `--train` mode | `record_match.py` |
| [RLTK](https://github.com/anhaidgroup/RLTK) | MIT | Pluggable similarity + blocking components, separation of concerns | `record_match.py` |
| [pikepdf](https://github.com/pikepdf/pikepdf) | MPL-2.0 | The manipulation engine; a Python binding to **qpdf**, so it repairs rather than merely re-writes | `pdf_prep.py` |
| [pdftl](https://github.com/pdftl/pdftl) | — | The pdftk-compatible command surface, and chaining operations without intermediate files | `pdf_prep.py` |
| [dupedog](https://github.com/ivoronin/dupedog) | — | **Staged hashing** (head then full) and **hardlink rather than delete** | `dedupe_files.py` |
| [rdfind](https://github.com/pauldreik/rdfind) | GPL-2 | Content-based, not name-based, duplicate matching | `dedupe_files.py` |
| [fdupes](https://manpages.debian.org/unstable/fdupes/fdupes.1.en.html) / [jdupes](https://www.jdupesproject.org/) | GPL | The size → signature → byte-compare escalation ladder | `dedupe_files.py` |
| [csv-profile](https://github.com/sen-ltd/csv-profile) | MIT | The **all-or-nothing** typing ladder and the human/json/markdown output split | `profile_dataset.py` |
| [csvpeek-cli](https://pypi.org/project/csvpeek-cli/) | MIT | The one-glance column summary table | `profile_dataset.py` |
| [dataprof](https://github.com/andreabozzo/dataprof) | — | ISO 25012 quality dimensions (completeness, consistency, uniqueness) folded in | `profile_dataset.py` |
| [pandas.read_html](https://github.com/pandas-dev/pandas) | BSD-3 | Multi-frame HTML table parsing and header inference | `html_tables.py` |
| [lxml](https://lxml.de/) / [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/) | BSD-3 / MIT | The recovery parser; sees broken markup the way a browser does | `html_tables.py` |
| [jsonl-diff](https://pypi.org/project/jsonl-diff/) / [uniqdiff](https://pypi.org/project/uniqdiff/) | MIT | Diffing datasets by record identity rather than line position — **evaluated, not adopted** (see below) | — |
| [gitleaks](https://github.com/gitleaks/gitleaks) / [trufflehog](https://github.com/trufflesecurity/trufflehog) | MIT | Secret-scanning patterns and allowlist philosophy — **not built**, see below | — |

### Deliberately not built

Two areas were researched and consciously skipped rather than half-done:

- **Secret scanning** (`gitleaks`, `trufflehog`, `detect-secrets`). Mature
  tools already do this far better than a small script, and
  `ApexProject/scripts/security/` **already has a scanner and a finding
  baseline**. Writing a second one would have violated this repo's own
  "one implementation of a rule" convention.
- **Dataset diffing** (`jsonl-diff`, `uniqdiff`). Both are strong, both are
  pip-installable, and both do this better than a reimplementation. Use them
  directly rather than maintaining a worse copy here.

## Primary documentation consulted

- **RFC 9309** — Robots Exclusion Protocol: <https://www.rfc-editor.org/rfc/rfc9309.html>
  Section 2.3.1.3 (4xx → allow, 5xx → disallow) is implemented in both fetchers.
- **AWS Architecture Blog, "Exponential Backoff And Jitter"**
  <https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/>
  The basis for full-jitter backoff.
- **Anssi Nurminen's master's thesis** — the lines/text table-detection approach
  that pdfplumber's `TableFinder` implements.
- **Node.js docs** — `AbortSignal.timeout`, `fs.rename` atomicity semantics.

---

## Three corrections found during this work

Recorded because all three would have silently produced wrong behaviour:

1. **`pdfplumber`'s README is wrong about `debug_tablefinder()`.** It describes
   the return value as a "PageImage" you can `.save()`. It actually returns a
   `TableFinder` with `.edges`, `.cells`, `.intersections`, `.tables`.
   Verified against pdfplumber 0.11.10. `pdf_tables.py` renders the page and
   draws the cells itself using PIL.

2. **Protego is not on npm.** `npm i protego` installs an unrelated
   antibot/cryptography package (`@protegoprotect/*`, DPoP helpers). The npm
   robots.txt parser is `robots-parser` (MIT). Verified by inspecting the
   installed package's exports.

3. **`pikepdf` 10 removed `Pdf.copy()`.** Only `copy_foreign` remains, so the
   obvious `out = pdf.copy(); out.pages[:] = keep` idiom raises
   `AttributeError`. `pdf_prep.py split` builds a fresh document and appends
   the wanted pages instead. Verified against pikepdf 10.16.0.

## Licensing of this folder

These scripts are original work written for this workspace. They *depend on*
the libraries above and follow their patterns; they do not vendor their code.
The third-party licences that matter operationally:

| Licence | Obligation |
|---|---|
| MIT / BSD-3 | Retain the copyright notice if you redistribute substantial portions. |
| MPL-2.0 (pikepdf) | File-level copyleft. Using it is fine; modifying *pikepdf itself* would require publishing those changes. We do not. |
| AGPL (pymupdf, **not used**) | Network use counts as distribution — avoided deliberately. |

`pdfplumber` (MIT) was chosen over `pymupdf` (AGPL) partly for licensing, and
`pikepdf` (MPL-2.0) over both because it can *repair* damaged PDFs rather than
merely re-writing them.