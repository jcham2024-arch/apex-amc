# Bullet source survey

What each manufacturer's site actually exposes, verified by fetching. This
exists so nobody re-guesses URLs, and so a future session knows which columns it
is allowed to trust. Everything here was confirmed against the live page on
2026-10-01; anything marked UNVERIFIED was not fetched.

The rule that governs this file: **a column is either confirmed by the source's
own headers, or it stays NULL.** Never infer a column from its position in a
flattened blob.

## Confirmed usable

### Hornady — `hornady.com/bc`
Self-describing table. Headers name the Mach reference and the form explicitly,
so parsing is safe. G1 and G7 at Mach 2.25 / 2.0 / 1.75. This is the only
source so far that publishes three Mach references.
Caveat: product pages read "Ballistic data coming soon"; SKUs and true ODs come
from the four product pages instead.

### Lehigh Defense — `lehighdefense.com/ld-load-data`
Full SKU + caliber + weight list, ~hundreds of rows, clean delimited text.
**No ballistic coefficients on this page** — it is a load-data library. BCs must
come from per-product pages. Note the SKU repeats across cartridges (one SKU,
many calibers), so SKU alone is not a unique key here; the cartridge is part
of the identity.

## Partially usable

### Berger — `bergerbullets.com/information/lines-and-designs/bullet-reference-charts/`
Richest single source: SKU, caliber, true diameter, weight, OAL, boat-tail, SD,
G1, G7, form factor, minimum twist. 111 data rows.

**RESOLVED 2026-10-01. The earlier "do not parse this chart" blocker was a
tooling bug, not a data problem, and is retracted.**

Two faults caused the false "unparseable" conclusion:

1. The fetch was **truncated to 43 KB** because curl was called without
   `--compressed` and the saved file was raw gzip. Re-fetching with
   `--compressed` yields 295 KB, `<table>` count 1, `<tr>` count 112. The
   table was never missing.
2. Columns were then read as *positional indices into a flattened blob*,
   which is what produced the impossible "G1 = 1.122" for row 37379.

Read the header row properly and the mapping is stated by the publisher, so no
inference is needed at all:

```
Part # | Bullet Description | Cal (Dia) | OAL | Boat Tail | Nose Length
      | Base to Ogive | Bearing Surface | Sectional Density | G1 BC | G7 BC
      | G7 Form Factor | Minimum Twist
```

Worked rows confirming the map (Part # is 1, `Cal (Dia)` carries the true
diameter in inches, `Boat Tail` holds `FB` for flat-base):

| Part # | Description | Dia | OAL | SD | G1 | G7 | FF | Twist |
|---|---|---|---|---|---|---|---|---|
| 17308 | 17 Cal 25 gr FB Varmint | 0.172 | 0.565 | 0.121 | 0.152 | NA | NA | 1:10" |
| 20303 | 20 Cal 35 gr FB Varmint | 0.204 | 0.596 | 0.120 | 0.179 | NA | NA | 1:14" |
| 20304 | 20 Cal 40 gr BT Varmint | 0.204 | 0.680 | 0.137 | 0.227 | 0.116 | 1.184 | 1:12" |

Note `G7 BC` is genuinely `NA` for flat-base bullets — that is a published
value, not a parse failure, and must import as NULL.


## Not usable as-is

### Nosler — `nosler.com/media/binaryanvil/media_library/2025-Catalog-Layout_web_2_.pdf`
33-page catalog, text-extractable, 359 BC mentions in the first 40 pages.

Per-bullet block format is explicit and labelled:
`SD. 0.171  BC. 0.228  OAL. 0.790"  PART#`

**G1 only — no G7 anywhere.** Verified: the 27 apparent `G7` hits in the
extracted text are all substrings of ordinary words ("high-grade", "together"),
not the form factor. Populate `bc_g1`, leave `bc_g7` NULL.

Also: caliber labels are abbreviated inconsistently ("6mm", "30", "270", "338"),
and 30-caliber spans .30-06 and .308 with nothing in the row to distinguish
them.

---

### Cutting Edge — CORRECTION: not the easy PDF, it is the hardest

An earlier note in this file called this "the easiest PDF target". **That was
wrong** and is retracted. It was written from the header row alone, before
reading the data rows under it.

The 13 pages contain **at least six mutually incompatible grammars**, one per
product family, and none of them can share a parser:

| Pages | Family | Row shape after caliber/twist |
|---|---|---|
| 2 | MTH | `G1 G7 OAL proj` - clean, 4 numeric fields |
| 3 | MTAC | same, plus `*` twist prefixes and `MAX`/`Gen2`/`Bulk` variant tokens |
| 4 | LZR (Laser) | same, but every BC carries a drag-model tag: `.520 (Oehler 89)` |
| 5 | MAXIMUS | prefixed by diameter token (`.243 77 1-10"`) and `EST`/`FCG` markers |
| 6-7 | Raptor (ESP/FB/ER) | no twist column in some rows; `TBD` values; OAL **varies by cartridge** |
| 8-11 | DGSC / DG / handgun | different column order entirely, `Part Number` present, trailing `(Est.)` G1 |
| 12 | 22lr CuRx / muzzleloader | `OAL w/o tip` **and** `OAL w/ tip` as separate columns |

Three specific traps:

1. **Rows reflow across lines.** A single bullet becomes four text lines when its
   BC values exceed the column width, e.g.
   ```
   130 1-10" MTH 277 130 MAX .444 (A.B.)
   .456 (O89)
   .227 (A.B.)
   .228 (O89) 1.266" .735"
   ```
   Any parser that reads one line per row silently truncates or drops these.

2. **OAL is not one value.** Page 6 gives three depending on cartridge:
   ```
   100 1-12" FB 308 100 Raptor .238 (O89) 1.161"
   Blackout: .860"
   Win: .765"
   Wilson Tac: .675"
   ```

3. **BC values are tagged with the drag model they were computed against** -
   `(O89)`, `(A.B.)`, `(Oehler 89)`, or `EST` when estimated. That is drag-curve
   provenance, and it is **not** the Mach reference that `bc_reference` records.
   Conflating the two would be a silent and serious error.

Also note pages 9-11 list `G1 BC (Est.)` **after** OAL and projection, while
pages 2-7 list it before. Same document, opposite column order.

Conclusion: Cutting Edge is a multi-grammar project, not a first target. Do it
last among the PDFs, one page-family at a time, each with its own declared
column map.

---

## Survey of all manufacturers

Method: fetch the live site, look for its own data endpoint, then confirm the
structure by reading it. Guessed URLs were tried first and mostly 404'd — that
is normal and is why each row below records the URL that actually worked.

Legend for **BC type**: `G1+G7` = both published; `G1` = G1 only, G7 must stay
NULL; `none` = no BC published at all.

| Manufacturer | Published data | Structure | BC type | What we need |
|---|---|---|---|---|
| **Hornady** | `hornady.com/bc` | server-rendered HTML, self-labelled Mach groups | G1+G7 | done — parser exists |
| **Berger** | `bergerbullets.com/…/bullet-reference-charts/` | server-rendered HTML table, 111 rows, 13 named columns | G1+G7 | HTML table parser; header-driven |
| **Lehigh** | `lehighdefense.com/ld-load-data` | HTML table, SKU+caliber+weight+tech | none | identity only; BCs NULL |
| **Swift** | per-product pages, e.g. `/products/a-frame-rifle-bullets-cal-7mm-2` | Shopify; one product per page | BC, unlabelled | crawl product pages for the `Ballistic:` field; single BC, no G1/G7 distinction |
| **Sierra** | `sierrabullets.com/content/2025-sierra-bullets-catalog-poster.pdf` | PDF, text-extractable, inline `B.C.` + item # | G1, unlabelled | PDF regex; note poster lists #8005-style part numbers |
| **Nosler** | 2025 catalog PDF (above) | PDF, text-extractable, labelled blocks | G1 | PDF block regex; G7 NULL |
| **Barnes** | `barnesbullets.com/content/Barnes-Ballistics-Charts/CF-P&R-Metric.pdf` | PDF, text-extractable, wide flat table | single unlabelled "BALLISTIC COEFFICIENT" | hardest: 1 page, columns run together, **no G1/G7 label** — must not be guessed |
| **Cutting Edge** | `cdn.shopify.com/s/files/1/0838/7185/8986/files/Tech_Data_Sheets_2026.pdf` (linked from `cuttingedgebullets.com/products/ceb-bullet-poster`) | PDF, 13 pages, text-extractable | G1+G7 | **HARDER than expected - see below** |
| **Federal** | `federalpremium.com/catalog.html` | catalog landing page only | none | no BC chart found; needs deeper discovery |
| **Speer** | `speer.com/catalog.html` | catalog landing page only | none | no BC chart found |
| **Lapua** | `lapua.com/support/lapua-ballistics-app-2/` | app-driven | none | data is behind an app |
| **GECO** | not located | — | unknown | URL discovery needed |
| **RWS** | not located | — | unknown | URL discovery needed |
| **Norma** | not located | — | unknown | URL discovery needed |
| **Peregrine** | `peregrinemonolithics.com/category/load-data/` | per-cartridge load-data posts | none found | product identity + SKU |
| **Hammer** | `hammerbullets.com/load-data/` | load data, no BC columns | none | identity only |
| **Maker** | not located | — | unknown | URL discovery needed |
| **Bear Creek** | `bearcreeksupplybullets.com/bulletselection` | **image-based "bullet board"** | none | interactive page; bullets are image tiles, not text. Needs OCR or manual transcription |
| **Acme** | `acmebullet.com/resources/` | YouTube links only | none | distributor; resells other makers' bullets |
| **Bayou** | site returns 114 bytes | — | none | effectively no data site |
| **Montana Gold** | connection failed (0 bytes) | — | unknown | retest; may be TLS/network |
| **Rainier** | WordPress; no data links | — | none | no technical data found |
| **Precision Delta** | no data links | — | none | no technical data found |
| **RMR** | no data links | — | unknown | no chart found |
| **Woodleigh** | no data links | — | unknown | AU site, may need deeper crawl |
| **Warner** | `warner-website-media-library.s3.us-east-2.amazonaws.com/ProductCatalog.pdf` | PDF, **28 MB** | unknown | large scanned/large-format; extraction untested |
| **X-Treme** | `cdn.shopify.com/…/RELOADING_MANUAL2023.pdf` | PDF reloading manual | unknown | manual, may list bullets |
| **Missouri Bullet** | `missouribullet.com/technical.php` | prose page about BHN, **no data table** | none | no BC table exists |
| **Prvi Partizan** | not located | — | unknown | URL discovery needed |

### Cross-cutting findings

**Four manufacturers in `manufacturers.csv` are dead or wrong.**
`blue-bullets` points at `bluebulletsusa.com`, which does not resolve
(`curl: (6) Could not resolve host`). `bayou` and `montana-gold` are effectively
unreachable. These need correcting or removing before the coverage report can
be trusted.

**Every PDF tested is text-extractable — no OCR needed.**
Sierra, Nosler, Berger, Cutting Edge and Barnes all yield clean text from
`pypdf`. Tooling only needs `pypdf` (already importable) plus a per-manufacturer
column map. The exception to watch is Bear Creek, which is images by design.

**"BC" is not a self-describing label.**
Only Hornady states its Mach reference, and only Berger labels G1/G7 in the
table body. Sierra, Barnes and Swift publish a bare `B.C.` / `Ballistic:` /
`BALLISTIC COEFFICIENT` with no form factor named. Under the governing rule
these must import with `bc_reference` NULL or be held back — a bare number with
an unknown reference cannot be placed in the standardized pair.

**BC is published at wildly different granularity.**
Hornady gives three Mach bases; Berger gives one pair plus form factor; most
others give one number. The `bc_reference` column has to tolerate all of this.

## Why this is not a bulk job

Each manufacturer needs its own parser, and the shapes genuinely differ:

- Hornady: 3 Mach references, G1+G7
- Berger: 1 reference, G1+G7, rich dimensions
- Nosler: 1 reference, G1 only, abbreviated calibers
- Lehigh: no BC on the index page at all

There is no shared format. The reusable part is the harness (extract file ->
declared column map -> CSV merge -> schema validate), which is already built.
Adding a manufacturer means writing a parser and a committed extract, not
editing a config.

## Safe way to add a manufacturer

1. Fetch the page. Confirm the header row survives.
2. If it does not, find a source that keeps headers (PDF catalog) or fetch a
   product line at a time rather than the whole chart.
3. Write the extract file with `#` comments naming the source and retrieval
   date. The parser ignores `#` lines.
4. Declare the column map in `scripts/lib/bullet-sources.mjs`. Do not let the
   parser infer positions.
5. Add every value the source publishes, including ones the app cannot use.
6. `npm run test:bullets` then `npm run verify`.

## Known data hazards

- **Lehigh SKUs are not unique per bullet** — one SKU covers many calibers.
- **Nosler caliber abbreviations are ambiguous** ("30" = .30-06 or .308).
- **`diameter_in` is a caliber designation on older rows**, not a true
  diameter. It drives drag calculations, so those rows must be corrected
  before they are trusted. Hornady rows and Berger's chart are correct.
- **BC reference basis still varies by manufacturer** and is recorded per row
  in `bc_reference`. Never compare two BCs without checking it.
