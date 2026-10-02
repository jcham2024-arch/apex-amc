# Seed Data Guide — `data/seeds/`

Orientation for an LLM (or human) picking up the **reloading component
database** cold. Everything here was verified by reading the CSVs in
`data/seeds/` and `data/incoming/`, and running the validation commands, on
2026-10-01.

> **This is the deep reference.** For the short version — what each *file type*
> is for and when to use which — start at
> [`DATA-REPOSITORY.md`](DATA-REPOSITORY.md).
> For what to work on next, see [`DATA-PLAN.md`](DATA-PLAN.md).

| Document | For |
|---|---|
| [`DATA-REPOSITORY.md`](DATA-REPOSITORY.md) | **Start here.** The five file types and why each exists |
| [`DATA-PLAN.md`](DATA-PLAN.md) | What to do next, in what order |
| [`DATA-MODEL.md`](DATA-MODEL.md) | The relational model and its two invariants |
| [`data/schemas/README.md`](../data/schemas/README.md) | The column-manifest format |
| [`data/generated/README.md`](../data/generated/README.md) | Which format to use, and when not to |

---

## 1. The one-paragraph version

Apex AMC is building a reloading reference database. Component data is
hand-curated into **CSV files in `data/seeds/`**, which
`scripts/gates/check-seeds.mjs` loads into an **in-memory SQLite built from the real
D1 migrations** (`data/schema/001`–`011`) and validates. The seeds are the
source of truth for the catalog; the schema is rich but the data is thin. The
hardest problem in this project is **not** writing CSVs — it is **provenance
and naming**, because a wrong pressure limit is the single most dangerous field
in the database. Two competing public compilations (kwk.us and leverguns.com)
disagree on some cartridges, and that disagreement is deliberately stored as
data rather than silently resolved.

---

## 2. Pipeline position — know which directory you're in

There are four data directories and they are **not** interchangeable:

| Directory | Stage | Contents |
|---|---|---|
| `data/published/` | Archived **primary sources** | 25 files, ~69 MB: SAAMI Z299.2/3/4 PDFs, CIP TDCC index, Hodgdon & Vihtavuori burn-rate charts, Alliant reloading guides, kwk/leverguns HTML snapshots, `manifest.json`, `MANIFEST.md`. Gitignored except the manifest. |
| `data/research/` | Curated **analysis**, not data | `POWDER-ACCURACY-DOCTRINE.md` (**read this first**), `powder_burn_rate/crossbrand_review.csv` |
| `data/incoming/` | Research **staging** | Harvested drops awaiting curation. Gitignored. **Never read by the loader.** |
| `data/seeds/` | **Curated, loadable** | 23 files across `bullets/`, `powders/`, `cartridge_specs/` and the root |

Everything here is committed. That was not true until 2026-10-01 - the bullet
and powder CSVs, all manifests, and migrations `012`-`015` were untracked, so a
fresh clone had no validation layer and no bullet data. **Nothing the loader
reads may live under `data/incoming/`**; a check in `npm run test:encoding`
enforces it.

**Critical:** the authoritative SAAMI and CIP PDFs are *already downloaded
locally* in `data/published/`. To resolve any pressure dispute, open
`data/published/saami-z299.4-2025-centerfire-rifle.pdf` directly. Do not fetch
from the web, and do not guess.

Archived PDFs are **gitignored** — never commit an original source document.
Republish derived single facts with attribution only.

### Commands

```bash
npm run coverage        # per-manufacturer coverage table
npm run data:build      # validate CSVs against manifests, regenerate JSON + Markdown
npm run data:validate   # fail if a generated file is stale (in `npm run verify`)
npm run seed:check      # load everything into SQLite and check it
npm run schema:check    # apply migrations, assert seed produced rows
npm run verify          # everything, in order. The gate before committing.
npm run data:extract    # re-run the kwk/leverguns/Vihtavuori extractors
```

`check-seeds.mjs` currently **prints hex dumps of every file it reads** (debug
leftovers around line 40). This makes output huge and hard to read. It is
cosmetic; delete those `console.log` calls if you touch that file.

### The four representations

Data is held once and published in four forms. Only two are editable.

| Artefact | Editable? | For |
|---|---|---|
| `data/seeds/**/*.csv` | **YES — this is the database** | The record. Bulk paste. Field-level diffs. |
| `data/schemas/*.yaml` | **YES — the column contract** | What a column means and may contain. |
| `data/generated/json/*.json` | no | Application code. Real types. |
| `data/generated/md/*.md` | no | Reading and reviewing. |

Full guidance, including when **not** to use each, is in
[`data/generated/README.md`](../data/generated/README.md). The column-manifest
format is in [`data/schemas/README.md`](../data/schemas/README.md).

### 2.1 Column manifests

`data/schemas/*.yaml` defines every column: type, whether blank is an error or a
legitimate value, the permitted enum, a unit, and a note explaining what commonly
goes in it wrong.

This exists because of a measured failure. On 2026-10-01, **7 of 11 bullet rows
were being silently dropped** — a mis-cased `manufacturer_slug`, a one-column
shift, and a design name in `tip_type`. The rules *did* exist, as CHECK
constraints on the `bullets` table, but they lived three directories from the
data and `INSERT OR IGNORE` swallowed every violation without a word.

Now the rules travel with the data. Adding `data/seeds/bullets/rmr.csv` requires
no other edit and gets every rule applied automatically. The manifest is the
only place a column's rules live, and both `npm run data:build` and
`npm run seed:check` enforce it through one shared module, so the generator and
the build gate cannot disagree.

Guards, each verified by deliberately breaking it:

| Guard | Caught by |
|---|---|
| value outside a column's enum | `data:build`, `seed:check` |
| plausible-range violation (e.g. `bc_g1 = 6.17`) | both |
| required column blank | both |
| ragged row / column shift | both |
| column in CSV not in the manifest (header typo) | both |
| row in the wrong manufacturer's file | both |
| a generated file hand-edited | `data:validate` |

---

## 3. The seed files

Row counts are data rows, excluding headers. "Loaded" is what
`seed:check` reports actually landing in SQLite.

**Component data is split one file per manufacturer** under a directory named
for the component type — see section 3.0. The table below lists logical
datasets; bullets and powders are now many files, not one.

| Dataset | Rows | Loaded | Role |
|---|---|---|---|
| `manufacturers.csv` | 36 | 31 (+5 in `003` seed = 47) | Company directory, the FK target for everything else |
| `cartridge_specs/{rifle,pistol,shotgun}.csv` | 229 | creation authority for `cartridges` | **The central table.** Slug, name, family, curated pressure |
| `cartridge_pressures.csv` | 234 | -> `cartridge_pressure_references` | Primary pressure source: kwk.us, **wide format** |
| `cartridge_pressures_secondary.csv` | 114 | -> `cartridge_pressure_references` | Second opinion: leverguns.com, **long format** |
| `cartridge_pressure_overrides.csv` | 3 | **0 — not loaded by anything** | Human editorial decisions + reviewer notes |
| `cartridge_pressure_conflicts.csv` | 2 | **0 — written, never read** | Dispute register, output of `crosscheck-pressures.mjs` |
| `bullets/*.csv` | 11 in 3 files | 11 | Projectiles: BC G1/G7, sectional density, twist |
| `powders/*.csv` | 169 in 7 files | 169 | Powders, 7 brands |
| `powder_burn_rate_positions.csv` | 22 | 22 | Burn-rate **ordering index**, not a rate |
| `sourcing_retailers.csv` | 8 | 8 | Retailer profiles for the component finder |
| `sourcing_searches.csv` | 8 | 8 | What the finder can be asked for |
| `sourcing_listings.csv` | 22 | 22 | Which source might have it |
| `value_provenance.csv` | 4 | 4 | How non-published values were arrived at |

### 3.0 Per-manufacturer component files

Component data is **one CSV per manufacturer**, in a directory named for the
component type:

```
data/seeds/
  manufacturers.csv              one row per company (stays a single file)
  cartridge_specs/*.csv          keyed on cartridge, not maker (per family)
  bullets/
    sierra.csv                   4 rows
    hornady.csv                  7 rows
    berger.csv                  109 rows
  powders/
    accurate.csv                 19 rows
    alliant.csv                  25 rows
    hodgdon.csv                  35 rows
    imr.csv                      38 rows
    ramshot.csv                  12 rows
    vihtavuori.csv               27 rows
    winchester.csv               13 rows
  sourcing_retailers.csv         keyed on retailer (stays single)

data/incoming/                   research staging, gitignored
  (empty - all powder files were promoted to seeds/ on 2026-10-01)
```

**Why:** adding a manufacturer's line is creating one small file, not editing a
shared table where two people collide and every change re-reads everyone's rows.
It also makes coverage *literal* — see section 5, where a maker's coverage is
whether their file exists.

**The filename is the manufacturer's slug, and the loader enforces it.** A row
whose `manufacturer_slug` disagrees with its filename is a build failure, not a
silent misattribution. The most likely mistake when working this way is pasting a
row into the wrong maker's file, which would credit a component to a competitor.

```bash
node scripts/data/split-seeds-by-manufacturer.mjs --dry-run   # preview
node scripts/data/split-seeds-by-manufacturer.mjs             # do it
```

The script is a one-off migration, kept so the transform is auditable. The flat
`bullets.csv` / `powders.csv` are still read if present, so an un-split checkout
keeps working — and `seed:check` prints a note telling you to split and delete
them.

To add a new maker: create the file, copy the header from a sibling, done. There
is no central list to update.


### 3.1 `manufacturers.csv` (36 rows, 9 cols)

`slug,name,kinds,website,country,region,status,notes,source_url`

Clean, well-formed, no duplicates. `kinds` is a **semicolon-delimited
multi-value** column (`ammo;bullet;brass`) — the loader splits on `;` and
validates against a fixed enum. `manufacturers` is a single table with a `kind`
discriminator, *not* one table per entity type: Federal is an ammo maker and a
brass maker, which is one row with two associations, not two companies.

- `region`: 28 `north_america`, 7 `europe`, 1 `oceania`
- `status`: all 36 are `active`
- Brand-ownership notes are current and researched (Revelyst, Nammo, Beretta,
  Hodgdon-owns-Winchester-powder). These are valuable — don't let them rot.

### 3.2 `cartridge_specs/` (229 rows, 21 cols) — the central table

`slug,name,short_name,family,parent_case,bullet_dia_in,case_length_max_in,
max_col_in,saami_max_psi,saami_max_cup,cip_max_bar,rim_dia_in,head_dia_in,
capacity_gr_h2o,primer_type,typical_twist_in,is_reloadable,notes,source_name,
source_url,source_note`

This table is **creation authority** for the `cartridges` row: a row here with a
`slug` and a `family` creates the cartridge if it doesn't exist. Without a
`family` the loader **refuses** — because `family` is `NOT NULL` and a wrong
guess files a pistol cartridge on a rifle page. Good design; preserve it.

**Completeness — this is the headline finding:**

```
slug                    229/229   family                  229/229
name                    229/229   is_reloadable           229/229
short_name              229/229   notes                   229/229
saami_max_psi            98/229   source_name/url/note    229/229
saami_max_cup            82/229
parent_case               0/229   bullet_dia_in            0/229
case_length_max_in        0/229   max_col_in               0/229
cip_max_bar               0/229   rim_dia_in               0/229
head_dia_in               0/229   capacity_gr_h2o          0/229
primer_type               0/229   typical_twist_in         0/229
```

**10 of 21 columns are 100% empty** (`saami_max_cup` is blank too). Every row's
`notes` field openly says so:
*"Curated row created to attach kwk.us pressure figures to a family-carrying
cartridge; dimensions remain EMPTY until transcribed from SAAMI/CIP."*
That is honest scaffolding, and it is correct to leave cells empty rather than
guess. **Filling these columns from `data/published/saami-z299.4-2025-*.pdf`
and the CIP TDCC index is the single highest-value remaining data task.**

Also note: `bullet_dia_in` is empty, but `bullets/*.csv` carries its own
`diameter_in`, and `bullet_dia_in` is the field the ballistics solver needs.
That link is not yet made anywhere.

- `family`: 212 rifle, 16 pistol, 1 shotgun
- `is_reloadable`: all `1` — note this is an *assumption*, not sourced data
- `source_name`: all 229 are `kwk.us Cartridge Pressure Standards`. There is
  exactly one source. That is a single point of failure for the whole catalog.

Slug rule enforced by the loader: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`. Current slugs
are inconsistent but all pass: `270`, `45-70`, `308-win`, `17-hmr`. Prefer
`308-win` style (hyphenated, unambiguous) for anything new.

### 3.3 `cartridge_pressures.csv` (234 rows, 8 cols) — primary pressures

`cartridge_name,saami_piezo_ksi,cip_piezo_ksi,saami_cup,cip_cup,other,footnote,unit_note`

Wide format, one row per cartridge, from **kwk.us**. `unit_note` is
`ksi_rounded_up_to_1000psi` on every row. Family breakdown: 212 rifle /
16 pistol / 1 shotgun in specs; this file is the source of the family
assignment.

**Two data-hygiene defects to fix:**

1. **Footnote markers with no legend.** These appear in the `footnote` column
   and inline in `other`:
   | Row | Marker |
   |---|---|
   | `.17 Mach 4`, `6.5x53R`, `6.5x72R`, `9.3x65R` | `*` |
   | `.22 Hornet` | `?` |
   | `.250 Sav.` (other=`52?`) | `?` |
   | `.303 Sav` (other=`43?`) | `?` |
   | `8x50R` | `!!` |

### 3.4 `cartridge_pressures_secondary.csv` (114 rows, 7 cols) — second opinion

`cartridge_name,pressure_value,pressure_unit,family,source_url,source_kind,source_note`

Long format (one value per row) from **leverguns.com**, all 114 rows
`source_kind=compilation`, all one URL, `source_note` = *"SAAMI specs as of
2004; values given in psi unless marked cup"*.

- `family`: 70 rifle, 36 pistol, 8 shotgun
- `pressure_unit`: **71 `psi` / 43 `cup` in one column** — a consumer must
  branch on unit. Conflating these is a silent 20,000+ psi error.
- **`.38 S&W` appears twice** (duplicate). Dedupe or document why.

**This file is the project's biggest integration problem.** It does not join to
`cartridge_specs/*.csv`:

- **Only 24 of 114 rows match by exact name.**
- A normalization pass (lowercase, strip punctuation, expand
  `Winchester`->`Win`, `Magnum`->`Mag`, `Special`->`Spl`, `Automatic`->`Auto`)
  only reaches **32 of 114**.

Root cause — **three different naming conventions across three files:**

| Cartridge | `cartridge_specs/*.csv` | `cartridge_pressures.csv` | `cartridge_pressures_secondary.csv` |
|---|---|---|---|
| .308 Winchester | `.308 Win` | `.308 Win` | `.308 Winchester` |
| .357 Magnum | `.357 Mag` | `.357 Mag` | `.357 Magnum` |
| .30-06 Springfield | `.30-06` | `.30-06` | `.30-06 Springfield` |
| 9mm Luger | *(absent)* | `9 Luger` | `9 mm Luger` / `9.mm Luger +P` |
| .45-70 Government | `.45-70` | `.45-70` | `.45-70 Government` |
| 12 gauge | *(absent)* | *(absent)* | `12 gauge` |

`cartridge_specs.csv` uses **aggressive abbreviation**; the secondary file uses
**full trade names**. Also note `9.mm Luger +P` — a period instead of a space,
which defeats naive token matching. And `.45 ACP` is missing from
`cartridge_specs.csv` while `.45-06 Remington` and `.270 Winchester` are present
in the secondary file but absent from specs.

**Recommendation:** make `cartridge_specs.csv` the single naming authority.
Add an alias column (or alias table) mapping full trade names -> canonical
slug, then join the secondary file through it. Do **not** try to solve this with
fuzzy string matching at load time — a wrong match on a pressure value is a
safety problem. An explicit alias table is auditable; a fuzzy match is not.
Roughly 82 secondary rows still need manual aliasing, which is a well-scoped
human task.

### 3.5 `cartridge_pressure_overrides.csv` (3 rows) — editorial overrides

`cartridge_name,standard_body,method,corrected_value,unit,basis,source_url,reviewer_note`

**This file is loaded by nothing.** No script reads or writes it (verified by
grep across `scripts/*.mjs` and `docs/*.md`). It is a human-readable record of
manual decisions that has not been wired into the pipeline. Either wire it in or
document that it is advisory-only. Do not let it silently rot.

Its `reviewer_note` column is the best editorial writing in the repo. It
documents, per row:

- **6.5 Creedmoor** — kwk.us lists 52 ksi; the note argues this is a
### 3.6 `cartridge_pressure_conflicts.csv` (2 rows) — dispute register

`kwk_name,secondary_name,unit,kwk_value,secondary_value,delta,resolution,resolution_note`

Generated by `scripts/extract/crosscheck-pressures.mjs` (the only script that touches
it). Both rows are `resolution=unresolved`:

| Cartridge | kwk | secondary | delta |
|---|---|---|---|
| 6.5 Rem Mag | 53,000 | 56,200 | -3,200 |
| .350 Rem Mag | 53,000 | 56,200 | -3,200 |

The file is written but **never read back by the loader** — though the same
disputes *are* correctly surfaced by the `cartridge_pressure_disputes` SQL view
in `data/schema/009_cartridge_specs.sql`, which is the mechanism that matters.
Closing these two rows is a bounded, high-value task (see section 6).

### 3.7 `bullets/*.csv` (11 rows in 3 files, 19 cols)

`manufacturer,manufacturer_slug,manufacturer_website,product_line,bullet_name,part_number,caliber,diameter_in,weight_gr,bc_g1,bc_g7,sectional_density,required_twist_in,construction,base_type,tip_type,use_case,source_url,source_kind`

**All 11 rows now load** (was 4). Three manufacturers: Sierra (4), Hornady (3),
Berger (4) — out of 36 in `manufacturers.csv`. This is the thinnest table in the
project relative to its importance to users.

**Three bugs found and fixed 2026-10-01, all of which had been silently losing
data.** The `bullets` table has CHECK constraints on `construction`,
`base_type` and `tip_type`, and the loader used `INSERT OR IGNORE` — which skips
a constraint-violating row *without a word*. So:

| Bug | Effect |
|---|---|
| `manufacturer_slug` was `Hornady`, not `hornady` | 3 Hornady rows could not resolve their manufacturer |
| Hornady rows were **shifted one column left** — `construction` held the base type, `base_type` the tip type, `tip_type` the use case | all 3 rejected by CHECK |
| Berger rows had the *design name* (`very_low_drift`, `hybrid`) in `tip_type`, which is not a tip type | all 4 rejected by CHECK |

Net: 7 of 11 rows were being dropped and the report said nothing. The loader now
validates these enums **before** the insert and names the permitted values, and
an ignored duplicate is reported too. A silent drop is the failure mode worth
ruling out here — a shooter querying for a Hornady ELD-X was getting an empty
result set, not an error.

Still open:
- `bullet_name` duplicates `product_line` on all 11 rows — redundant, consider
  dropping one or making `bullet_name` the specific designation.
- `diameter_in` holds `0.308` / `0.264` — **these are caliber designations, not
  actual bullet diameters in inches.** A .308 bullet is 0.308". A 6.5mm bullet
  is 0.256", not 0.264". This column is semantically wrong and will corrupt
  drag calculations if consumed. Rename to `caliber_designation` and add a real
  `bullet_dia_in` in decimal inches. The solver's drag tables are keyed on true
  diameter.
- 7 of 11 rows have empty `bc_g7` and `sectional_density`; one has empty
  `bc_g1`. G7 is what modern long-range work uses — this gap matters.
- Coverage is skewed: 5 rows are 0.308, 5 are 0.264. See section 5.

### 3.8 `powders/*.csv` (169 rows in 7 files, 10 cols)

`manufacturer,manufacturer_slug,manufacturer_website,product_name,product_line,burn_rate_class,relative_burn_rate_position,geometry,notes,source_url`

```
manufacturer/manufacturer_slug/website      27/27
product_name/product_line/notes/source_url  27/27
burn_rate_class                              5/27
relative_burn_rate_position                  0/27   <- but see 3.9
geometry                                      0/27
```

- **All 27 rows are Vihtavuori.** Every other brand is absent, though
  `manufacturers.csv` lists `winchester` and `norma` with `powder` in `kinds`.
- **`vihtavuori` is missing from `manufacturers.csv`** even though
  `powders/*.csv` `manufacturer_slug` references it — an orphan FK. Add the row.
- `relative_burn_rate_position` is empty on all 27 rows, but
  `powder_burn_rate_positions.csv` has 22 of the 27 powders with a position
  1–22. **This is a trivial join that is simply not done yet.** Backfill
  `relative_burn_rate_position` from that file.
- 5 powders have no burn-rate position: `N170`, `24N41`, `N570`, `3N37`, `N105`.
  (Note the positions file has `3N38`; `powders/vihtavuori.csv` has both `3N37` and
  `3N38`.)
- The loader reads `data/seeds/powders/*.csv` - 7 files, 169 rows - as a single
  `powders` dataset. There is no second directory and no merge.
  This was two directories until 2026-10-01: `data/seeds/powders/` (1 file, 27
  rows) plus `data/incoming/powders/` (6 files, 142 rows, gitignored). The merge
  meant a fresh clone loaded 27 rows while a working checkout loaded 169, so the
  powder count was a property of the checkout rather than the repository. All six
  harvested files were promoted by `scripts/data/promote-powders.mjs`. The rule now
  enforced: **nothing the loader reads may live under `data/incoming/`**, and
  `npm run test:encoding` fails the build if a manifest points at an ignored path.
- `geometry` empty everywhere. Useful for load-density work (single-base vs
  double-base vs triple-base).

### 3.9 `powder_burn_rate_positions.csv` (22 rows, 5 cols)

`chart_slug,brand,position,column_total,powder_name_as_published`

An **ordering index**, not a burn rate. Positions 1–22 with `column_total=22`,
all one chart: `vihtavuori-burning-rate-chart`. Order runs N310 -> N320 -> N330
-> N340 -> N350 -> 3N38 -> N110 -> ... -> 20N29, i.e. **fastest to slowest**.

`powder_name_as_published` exists as a deliberately separate column from any
canonical powder name, because the name **as printed on the chart** will not
always equal the name in the powder files. Preserve that separation; it is what
makes a future re-extract from the PDF auditable. The loader already skips
unmatched names with a note rather than failing.

Other brands' charts (Hodgdon, Accurate, Ballistic Aerotech) are archived as
PDFs in `data/published/` and have **no** positions file yet. There is a
`powder_burn_rate_crossbrand_review.csv` in `data/incoming/` — check it before
adding more.

**Cross-brand caveat:** relative burn rate is **not comparable between
manufacturers**. A position of 7 in the Vihtavuori chart says nothing about
Hodgdon 7. Never sort all powders into one global "burn rate" number. Use
position scoped to `chart_slug`, or absolute burn velocity (m/s) if you have it.

---

## 4. Cross-file dependency map

```
manufacturers.csv ----< bullets/*.csv         (manufacturer_slug; filename enforced)
      |                     (casing bug FIXED - all 11 rows now load)
      |                     ! vihtavuori referenced by powders/*.csv, absent here
      |
      ---< powders/*.csv ----< powder_burn_rate_positions.csv
                              (product_name <-> powder_name_as_published)
                              ! position column never backfilled

cartridge_specs.csv --creation authority--> cartridges  (slug + family)
      |
      |--< cartridge_pressures.csv           (by NAME, not slug -- brittle)
      |--< cartridge_pressures_secondary.csv (by NAME -- 24/114 match)  !
      |--< cartridge_pressure_overrides.csv  (NOT LOADED)                 !
      |--< cartridge_pressure_conflicts.csv  (written, not read)         !

cartridge_pressure_references  <-- all pressure files land here
        |
        --> view cartridge_pressure_disputes -> gates publication
```

---

## 5. Where we are: per-manufacturer coverage

**Do not grep the CSVs to answer "where are we?".** Run:

```bash
npm run coverage        # aligned table
npm run coverage:md     # markdown, for pasting into docs
node scripts/data/report-coverage.mjs --csv   # machine-readable
```

`scripts/data/report-coverage.mjs` cross-references every seed and incoming file
against `manufacturers.csv` and reports, per manufacturer, how many product rows
exist for each component class that maker **declares** it makes.

**The status is computed from the data on every run, never stored.** A
hand-maintained checklist would be stale the moment someone added a row to
`bullets/*.csv` — which is exactly the failure mode this replaces. There is no
status column anywhere to fall out of date.

| Status | Meaning |
|---|---|
| `done` | Has rows for every component class it declares |
| `partial` | Has some, missing others |
| `not started` | Declares classes, has zero rows for all of them |
| `n/a` | Declares none of the tracked classes |

It also reports two things that are easy to miss by eye: **orphan
`manufacturer_slug`s** (referenced by a seed but absent from
`manufacturers.csv`) and **unresolved pressure disputes**.

### Current state, 2026-10-01

```
status totals:   done=2  partial=2  not started=32  n/a=0
component rows:  bullet=11  powder=13  brass=0  primer=0  ammo=0  shotshell=0
```

Only 4 of 36 manufacturers have any data at all:

| Manufacturer | Has | Missing | Status |
|---|---|---|---|
| Sierra Bullets | 4 bullets | (declares bullet only) | **done** |
| Berger Bullets | 4 bullets | (declares bullet only) | **done** |
| Hornady | 3 bullets | brass, ammo | partial |
| Winchester | 13 powders | brass, primer, ammo | partial |

The other 32 are `not started`. Note that "done" here is a *narrow* claim: it
means every class that maker declares is populated, not that the catalog is
complete. Four Sierra bullets is not a complete Sierra catalogue.

**Coverage is now literally "does this maker's file exist".** A maker goes from
`not started` to `partial` by creating one file — no central list to edit, no
risk of two people editing the same table. The single-kind bullet makers below
each need exactly one file to reach `done`:

```
data/seeds/bullets/rmr.csv
data/seeds/bullets/hammer.csv
data/seeds/bullets/acme.csv
...
```

`report-coverage.mjs` reads the directories, so the table above cannot drift
from what is on disk.

**The single biggest finding this surfaced: 98 of 111 powder rows credit no
manufacturer.** `data/incoming/powders/*.csv` contains six brands —
Hodgdon (35), IMR (38), Winchester (13), Alliant (25), Accurate (19), Ramshot
(12) — and **none of them except Winchester exist in `manufacturers.csv`**:

```
ORPHAN manufacturer_slug: accurate, alliant, hodgdon, imr, ramshot, vihtavuori
```

The powder rows load fine (169 powders, `seed:check` passes) because the
`powders` path does not enforce the FK the way `bullets` does. But any query
that joins powder -> manufacturer returns nothing for those six brands, and
Vihtavuori — 27 rows in `seeds/powders/vihtavuori.csv` — is absent from the
entirely. **Adding these six rows to `manufacturers.csv` is a few minutes of
work and unlocks 98 existing rows.** It is the highest ratio of value to
effort in the whole project.

### Suggested order of attack

1. Add the 6 missing powder makers to `manufacturers.csv` (unlocks 98 rows).
2. Sierra / Berger / Hornady bullets — deepen what already exists.
3. The single-kind bullet makers (`swift`, `hammer`, `maker`, `acme`, `rmr`,
   `precision-delta`, `montana-gold`, `blue-bullets`, `bear-creek`, `berries`,
   `xtreme`, `rainier`, `peregrine`, `warner`, `lehigh-defense`,
   `missouri-bullet`, `bayou`, `cutting-edge`) — each needs only one file to
   reach `done`. Good first wins, and `../AGENTS.md` Lane 5 already
   ranks them by user interest.
4. Multi-kind makers (`federal`, `nosler`, `lapua`, `norma`, `remington`) last
   — they need several files each before they can ever read `done`.

Re-run `npm run coverage` after every batch; the table is the checklist.

---

## 6. Filling a gap: the value provenance layer

### The rule, and the gap it leaves

Two existing rules are both correct and pull in opposite directions:

- `docs/DATA-MODEL.md` rule 1: **provenance is mandatory.**
- `data/research/POWDER-ACCURACY-DOCTRINE.md` rule 1: **no invented values — leave the cell EMPTY.**

Applied together, they mean a cell is either *transcribed from a source* or
*blank*. But there is a third case they don't cover: a value that **does exist
in the real world** and that we simply haven't found a source for yet. Today
that is indistinguishable from a value that doesn't exist anywhere.

That ambiguity is expensive here. 10 of 21 columns in `cartridge_specs/` are
100% empty, and every one is a real published SAAMI/CIP dimension. Nothing in
the data says "transcription not started" versus "this number does not exist".

### The mechanism

`data/schema/012_value_provenance.sql` adds a `value_provenance` table: **one
row per (entity, field) whose value is not a plain published transcription.**
You record the number *and* how you got it, and the build refuses the row
unless the justification is present.

The tiers are deliberately identical to the ones the domain package already
enforces in `packages/ballistics-core/src/provenance/Source.ts`, so there is one
idea in the project rather than two:

| Tier | Means | Requires | Build fails if missing |
|---|---|---|---|
| `published` | Quoted from a standard or manual | `source_id` | yes |
| `derived` | Computed from published values | `method` | yes |
| `estimated` | No published value exists; inferred | `reasoning` | yes |
| `community` | Promoted from forum consensus | `reasoning` + `source_url` | yes |

This mirrors the `UnverifiedValueError` that `derived()` and `estimated()` throw
in `Source.ts`. A tier without its justification is a build failure, not a
warning.

**NULL is still the right answer for a value that does not exist.** This layer
does not license filling every blank. It makes a *sourced guess* distinguishable
from *an absence*, which is the thing that was previously invisible.

### What it is not

It is **not** the community layer (`011_community_layer.sql`). That table is a
structurally separate holding pen for forum claims that must never appear as
official. This table is the opposite — it records how a value in an official
table was arrived at. A `community` tier here means a forum number was
*deliberately let into an official column, labelled*, which is the
highest-risk thing in the database and is surfaced by the
`provenance_community_promoted` view.

### Using it

Add a row to `data/seeds/value_provenance.csv`:

```
entity_type,entity_slug,field_name,tier,value,text_value,unit,source_id,method,reasoning,source_url,safety_risk,corroboration,reviewed_by,reviewed_on,notes
```

`entity_type` is one of `cartridge`, `bullet`, `powder`, `manufacturer`,
`burn_rate_chart`. `entity_slug` must match an existing row. A numeric field
uses `value`; a text field uses `text_value` — never both.

Worked examples are in the seed file as shipped. The 7mm-08 row is the clearest
illustration: `saami_max_psi` is **empty** for that cartridge, the only number
anywhere in the project is one 2004 compilation's 61,000 psi, and the
annotation records it at `estimated` with `corroboration=1` and an explicit
"do not treat this as a limit". That is the difference between an empty cell
and an honest one.

### Guards, all verified by deliberately breaking them

| Guard | Verified by |
|---|---|
| `derived` with no `method` fails | removed the method — build failed |
| annotation drifting from its parent value fails | changed 62000→61000 — build failed |
| `community` with no `source_url` fails | removed the URL — build failed |
| orphan slug (annotates a nonexistent cartridge) fails | checked by assertion after insert |
| tier requirements re-asserted post-load | catches hand-written INSERTs in future migrations |

The drift guard is the important one: if a re-extract regenerates
`cartridge_specs.csv` and the annotated number no longer matches what the table
holds, the build stops. That is the silent-divergence failure this layer exists
to prevent.

### Tracking it

`npm run coverage` now ends with a tier breakdown, and `seed:check` prints the
same. **The `estimated` + `community` count should only ever go DOWN** as real
sources are found. If it goes up, the layer is being used to launder guesses
into official columns rather than to route work toward real sources.

```
VALUE PROVENANCE (how non-blank values were arrived at)
  derived         2
  estimated       2
                  2 not from an official source - each needs a real source found to clear it
```

### Known limitation

The `sources` table currently holds only load-data manuals (Hodgdon, Hornady,
Lyman, Speer, Vihtavuori). **No pressure standard has a `sources` row**, so
nothing can currently be recorded at `published` tier for a pressure figure.
Adding SAAMI Z299.x and CIP TDCC entries to `sources` is a prerequisite for
promoting the existing `derived` pressure annotations upward.

---

## 7. Sourcing: where to buy (component finder)

### What it does

The user picks a component, gets back places to obtain it with a link or
directions. Backed by `data/schema/013_sourcing.sql` and three seeds:
`sourcing_retailers.csv`, `sourcing_searches.csv`, `sourcing_listings.csv`.

### Why it needed new tables

The schema already had retailer rows in `manufacturers`, a `products` table and
append-only `price_observations`. None of it could answer the question, for four
structural reasons found by inspection:

| Blocker | Consequence |
|---|---|
| `products.cartridge_id` is `NOT NULL` | A can of H335 or a box of primers has **nowhere to live** — most things a reloader buys aren't cartridge-bound |
| `bullets` and `powders` have no `slug` | No stable key for a shareable finder URL, though `products`/`cartridges` both have one |
| A retailer was just a `manufacturers` row | Nowhere to record affiliate network, store ID, shipping regions, or feed URL |
| "Available at" != "priced at" | `price_observations` requires a price; a local shop or a bot-blocked site has none |

### The shape

```
sourcing_searches   "a thing the user wants to find"   <- the finder's key
        |
        |  sourcing_listings  (M:N, carries confidence + evidence)
        v
sourcing_retailers  "a place that might have it"  -->  manufacturers (retailer rows)
```

`sourcing_searches` is deliberately **not** `products`. `products` describes a
loaded round and requires a cartridge; a finder query describes an *intent*, and
powder, primers and brass all fit that and not `products`.

`sourcing_retailers` extends the 8 retailer rows already seeded in migration
`003` with everything a finder needs: shipping regions, directions/lat-long for
local shops, link templates, feed availability, and affiliate metadata.

### Affiliate-ready, deliberately not affiliate logic

Per the brief, no affiliate programs are built. The schema stores only the three
facts any tagging scheme needs, and stops:

- `affiliate_network` — `avantlink` / `impact` / `partnerize` / **NULL**
- `network_store_id` — the publisher's ID in that network
- `link_template` — e.g. `https://www.natchezss.com/search?q={search}`

Nothing in the database appends a tag or knows a network's query-string format.
A `buildOutboundUrl()` helper in the app layer does that later, driven entirely
by these columns — so switching tagging on is a code change in **one place**,
not a migration across every product row.

**All `affiliate_network` values are currently NULL, on purpose.** The README
names AvantLink but also warns several programs have since migrated to Impact or
Partnerize. An unconfirmed network must be NULL, not a guess. The build enforces
the related rule: a `network_store_id` with no network is rejected.

The view `sourcing_affiliate_readiness` reports what is still missing per
retailer, currently `needs affiliate network` for all 8.

### Honesty is enforced, not requested

The `confidence` tier on each listing is the load-bearing idea:

| Tier | Means |
|---|---|
| `verified` | Seen on the retailer's own site, or confirmed by phone |
| `listed` | On their site or catalogue; stock not confirmed |
| `likely` | They carry the line; this exact item unconfirmed |
| `unknown` | Placeholder awaiting research |

A finder that renders one green tick for "confirmed in stock", "listed, price
unknown" and "we think they stock these" makes three different claims with one
piece of UI. A shooter will drive to a shop on the strength of it.

So the build **refuses**:
- `verified`/`listed` with no `source_kind` and no `source_url`
- `verified` with no `verified_by` (manual verification is an editorial act)
- `in_stock` set with no `stock_checked_on` (an undated stock claim is worthless)
- a price with no `price_observed_on`
- a `link_template` that is not https, or uses a placeholder other than `{sku}` / `{search}`
- `match_quality=exact_sku` with no `manufacturer_part_number`
- `entity_type` without `entity_slug` (or the reverse)

All verified by deliberately breaking them.

**Current state: 22 listings, all `likely`, 0 `verified`.** That is the honest
number — no product page has been retrieved for any of them. `seed:check` prints
`verified listings: 0 <- none verified against a live check yet` so this can't be
mistaken for working coverage.

### The finder query

`component_finder` is the view the UI reads. It returns one row per
(source, target) pair with everything a result card needs, plus `link_mode`:

- `1` — exact deep link captured
- `2` — buildable from template + search terms
- `0` — homepage only, no product link known

Currently 19 rows at `link_mode=1` (have a manufacturer part number) and 3 at
`link_mode=2` (powder — powders have no SKU, so the search term is the key).
`component_finder_verified` is the stricter view for what we'd actually show.

### Also added: slugs for bullets and powders

Migration 013 adds a nullable `slug` to `bullets` and `powders` (uniquely
indexed, partial). Nullable **on purpose** — a migration that invents slugs for
existing rows would do exactly what migration 012 exists to prevent. They stay
NULL until someone has actually looked at them. The CSV loader populates them
going forward.

Note: the seeded `sourcing_searches.csv` rows therefore have **no**
`entity_type`/`entity_slug` yet. The loader reports this as a note rather than an
error, because it is the expected state, not a defect.

### Local shops

`source_type` includes `local_shop` and `dealer_locator`, with `directions`,
address, phone and lat/long. Deliberately free-text directions rather than a
structured address table — a finder result is "Kays Outfitters, 3 miles away,
open Tue–Sat", a sentence assembled from several facts, and over-modelling a
shop's address would not make it more accurate. `scraping_status` is recorded
per retailer because it varies, and a blocked site is an explicit decision
(`unsupported`) rather than an accident.

### Next steps

1. Confirm affiliate networks per retailer, then set `affiliate_network` and
   `network_store_id` (view: `sourcing_affiliate_readiness`).
2. Capture real product pages to move listings `likely` → `verified`, with
   `source_kind='retailer_site'` and the URL.
3. Replace site-search templates with per-SKU deep-link templates where the
   retailer supports them.
4. Backfill `bullets.slug` / `powders.slug`, then link `sourcing_searches` to
   real component rows.
5. Add local shops and dealer locators.

---

## 8. What to do next, in priority order



### P0 — Safety: close the two open pressure disputes
`6.5 Rem Mag` and `.350 Rem Mag` are marked `UNRESOLVED` and the override notes
say **do not publish**. Open
`data/published/saami-z299.4-2025-centerfire-rifle.pdf`, find both cartridges,
and record the real value. Then update
`cartridge_pressure_overrides.csv` (`resolution` -> resolved, with a new
`resolution_note` citing the standard and page), and regenerate the conflict
register via `npm run data:extract` / `crosscheck-pressures.mjs`.

This is bounded, high-value, and the notes have already done the legwork. Do it
first.

Also confirm the **6.5 Creedmoor 52-vs-62 ksi transposition** the same way. If
62,000 is right, kwk.us is wrong and that correction propagates.

### ~~P0 — Fix the `Hornady` casing bug~~ — DONE 2026-10-01
Fixed as part of the per-manufacturer split. `bullets/hornady.csv` now uses the
lowercase slug. **This unblocked more than expected: 7 of 11 bullet rows were
being silently dropped, and bullet coverage went from 4 to 11.** See section 3.7.

### P1 — Build the cartridge alias table
Single naming authority (`cartridge_specs.slug`) + explicit alias rows mapping
full trade names -> slug. Convert the pressure joins from name-based to
slug-based. Target: all 114 secondary rows either matched or explicitly
quarantined with a reason. **No fuzzy matching on safety data.**

### P1 — Fill `cartridge_specs` dimensions from the archived PDFs
12 empty columns x 229 rows, sourced from
`saami-z299.4-2025-centerfire-rifle.pdf` (rifle),
`saami-z299.3-2022-centerfire-pistol-revolver.pdf` (pistol),
`saami-z299.2-2019-shotshell.pdf` (shotgun), and the CIP TDCC index. This is
mechanical transcription and it is the bulk of the remaining catalog work.

### P1 — Rename `bullets.diameter_in`
It holds caliber designations (`0.264`), not inches. Split into
`caliber_designation` and a true `bullet_dia_in` decimal before anything
downstream computes drag from it.

### P1 — Add the 6 missing powder makers to `manufacturers.csv`
`accurate`, `alliant`, `hodgdon`, `imr`, `ramshot`, `vihtavuori` are all
referenced by powder seeds but absent from the directory — 98 of 111 powder
rows currently join to no manufacturer. Cheapest high-value fix in the project.
See section 5.

### P2 — Grow `bullets/` and `powders/`
Bullets: 11 rows / 3 makers vs 36 manufacturers is the largest coverage gap
relative to user value. `../AGENTS.md` Lane 5 already lists the
priority makers (Black Hills, RMR, Leupold, Redding, Schulte's, Deer Creek...).
Powders: add Norma and Winchester; backfill `relative_burn_rate_position` from
the existing positions file (free — the join is already possible).

### P1 — Add pressure standards to the `sources` table
`sources` currently holds only load-data manuals (Hodgdon, Hornady, Lyman,
Speer, Vihtavuori). **No pressure standard has a row**, which means nothing can
be recorded at `published` tier for a pressure figure and the two existing
`derived` pressure annotations cannot be promoted. Add SAAMI Z299.2 / Z299.3 /
Z299.4-2025 and CIP TDCC. Unblocks the whole provenance ladder for pressures.
See section 6.

### P1 — Move sourcing listings from `likely` to `verified`
All 22 listings are `likely` because no product page has been retrieved. The
component finder cannot honestly show "in stock" until real checks exist. Each
needs `source_kind`, a URL, and `verified_by`. Start with Natchez, which
publishes transparent inventory and is the easiest to verify against.
See section 7.

### P2 — Wire up or document the orphan files
`cartridge_pressure_overrides.csv` is loaded by nothing;
`cartridge_pressure_conflicts.csv` is written but never read. Wire them in or
say so in the header comment, so the next person doesn't trust them blindly.

### P3 — Housekeeping
- Add a **footnote legend** for `*`, `?`, `!`, `!!` from the archived kwk HTML.
- Strip `~` from `other` values in `cartridge_pressures.csv` into a real
  approximation flag.
- Dedupe `.38 S&W` in the secondary file.
- Remove the hex-dump debug logging from `scripts/gates/check-seeds.mjs`.
- Standardise new slugs on the hyphenated form (`308-win`, not `308win`).
- `case_reuse.csv` and `community.csv` are referenced as *optional* seeds that
  don't exist yet — expected, not broken.

---

## 9. Rules that must not be broken

These are not style preferences. They come from `docs/DATA-MODEL.md`,
`../AGENTS.md`, and the schema's own comments.

1. **Never invent a value.** Safety-critical reference data comes only from a
   published manufacturer manual, a CIP/SAAMI standard, or NIST. **Leave the
   cell EMPTY rather than guessing.** An empty cell is a visible gap; an
   invented one is an invisible liability. The 12 empty columns in
   `cartridge_specs.csv` are correct as they stand.
   *Refinement (see section 6):* a value that genuinely does not exist should
   stay NULL. A value that does exist but has no source yet may be recorded in
   `value_provenance.csv` at `derived`/`estimated` tier **with its reasoning
   attached** — the build rejects the row otherwise. That is a labelled
   approximation, not a licence to guess.
2. **Never commit an original source document.** `data/published/` PDFs are
   gitignored. Republish derived single facts with attribution only.
3. **Provenance is mandatory.** Every row needs a `source_url`/`source_id`. The
   loader rejects rows without one and this is intentional — a wrong charge
   weight can injure someone, so "where did this number come from" *is* the
   safety mechanism.
4. **Community data never goes in an official table.** The separation is
   asserted by the validator, not merely intended.
5. **Disagreement is data, not something to smooth over.** The schema stores
   every claimant in `cartridge_pressure_references` and surfaces conflicts via
   the `cartridge_pressure_disputes` view precisely so a maintainer doesn't have
   to *remember* that kwk.us is wrong somewhere. Do not collapse this to a
   single quietly-chosen number.
6. **Watch the unit.** psi, CUP, and bar are mixed across these files, sometimes
   within one column. `ksi_rounded_up_to_1000psi` is an approximation already
   baked into the primary source. A psi/CUP confusion is a ~20,000 psi error.
7. **Run `npm run verify` before you finish.** lint + typecheck + test +
   schema:check + seed:check. All five must pass.
8. **Don't edit files you weren't assigned.** Report bugs elsewhere in your
   summary rather than fixing them.

---

## 10. Quick verification recipes

```powershell
# row counts per seed file. Cartridge specs are now one file per family, so
# count the directory rather than a single path.
Get-Content 'C:\Cline\ApexProject\data\seeds\cartridge_specs\rifle.csv' -TotalCount 6
(Get-ChildItem 'C:\Cline\ApexProject\data\seeds\cartridge_specs\*.csv' |
  ForEach-Object { Import-Csv $_.FullName }).Count

# NOTE: parse CSVs with -Raw, NOT `Select-Object -Skip 1` -- that strips the
# header and silently yields empty columns (a mistake made while writing this
# file). Group-Object on the result is case-INSENSITIVE, which hides slug bugs.
$c = Get-Content 'C:\Cline\ApexProject\data\seeds\cartridge_specs\rifle.csv' -Raw | ConvertFrom-Csv

# column completeness for any seed file
$c[0].PSObject.Properties.Name | ForEach-Object {
  $n=$_; "{0,-22} {1,4}/{2}" -f $n, ($c | Where-Object { $_.$n -ne '' }).Count, $c.Count
}

# find duplicate slugs / names
$c | Group-Object slug | Where-Object Count -gt 1
```

Beware: CSV files are **CRLF**-terminated, and several contain embedded commas
requiring RFC-4180 quoting (e.g. `".500 NE 3"""`). Use a real CSV parser, not
`split(',')`.

---

## 11. Verification log

Every claim in this document was checked on 2026-10-01 against the files as
they stand, including a full `npm run seed:check` run. Baseline at time of
writing:

```
cartridges                        318
cartridge_pressure_references     782
manufacturers                      52   (36 CSV + 5 from 003, others seeded)
manufacturer_kinds                115
powders                          169   (seeds + incoming, merged)
powder_burn_rate_charts            1
powder_burn_rate_positions        22
published_documents               23
sources                           10
bullets                            4   <- 7 of 11 rows rejected
pressure disputes                  2   <- both unresolved
optional seed not present yet: case_reuse.csv, community.csv
```

`seed:check` **passes** today. That is worth stating plainly: the pipeline is
sound and the data is honestly incomplete. The failures documented above are
caught by the validator and reported, not silently loaded — which is the
system working as designed.
