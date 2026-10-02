# DATA TODO — the master list for the data layer

**Last measured 2 Oct 2026. Every number below came from a command, not from
memory.** Re-run the three commands under "How to use this" before trusting any
figure, and re-measure anything you intend to quote.


> **Splitting the data work across multiple agents? Use
> [`PARALLEL-WORK-PLAN.md`](PARALLEL-WORK-PLAN.md) §B**, which partitions the tasks by
> exclusive write-set and names the two shared surfaces (`data/generated/**` and
> `data/schema/*.sql`) that cause collisions.
This is the single consolidated list for `data/**`. It supersedes the competing
task lists that used to live in `DATA-PLAN.md`, `SEED-DATA-GUIDE.md` and the gaps
section of `DATA-REPOSITORY.md`. If a task is not here, it is either done
(`docs/TODO.md` §5) or parked (`docs/FUTURE-INTEGRATIONS.md`).

---

## How to use this

Work top to bottom. Each task states **why it matters** and what **done** means.
That is not padding: for load-adjacent data a silently wrong value is worse than
a missing one, because a missing one is visible.

```bash
npm run verify          # every stage. Must exit 0 before and after.
npm run data:health     # the baseline for any row-count claim
npm run coverage        # per-manufacturer status
```

The governing rule, from `data/research/POWDER-ACCURACY-DOCTRINE.md`:

> No invented values. Leave the cell EMPTY. A blank means "not known yet", never
> zero, and never a plausible guess.

---

## 0. The three things that actually block the project

### 0.1 `recipes` is empty — zero published load data

**Why this outranks everything else.** Every feature that justifies the project
depends on it. It is a content problem, not an engineering one, and no amount of
code fixes it.

`ROADMAP.md` §1 argues the correct approach is to store **citations to published
loads**, not reproductions: the manuals are copyrighted and commercially
licensed, and a reloader needs the book on the shelf anyway.

| # | Task | Done when |
|---|---|---|
| 0.1a | Decide the load-data shape: a citation row (recipe id, source, page, cartridge, bullet, powder, charge, velocity) plus a free-text reproduction block | Written decision in `docs/DATA-MODEL.md`, with the licensing reasoning |
| 0.1b | Add `data/seeds/load_recipes.csv` + manifest | Manifest exists, loader reads it, `data:health` lists the dataset |
| 0.1c | Transcribe from `data/published/`, one source at a time | Every row carries `source_id` **and** a page number |
| 0.1d | Record transcription provenance per the doctrine | Every non-blank number has a `value_provenance` row |

**Do not invent a load.** If a manual page is illegible or a charge is
ambiguous, leave the field blank and note it. A made-up load can injure someone.

**Best first sources**, because they are already archived and already
SHA-256'd: the SAAMI Z299.x set, Hodgdon 2024, and the Vihtavuori guide. See
`data/published/manifest.json` for what is on disk and verified.

### 0.2 Seed-to-database loader — **CLOSED 2026-10-01**

**Found 2 Oct 2026.** Resolved the same day; the original finding is preserved
below so the reasoning is not lost.

**What was found.** Replaying every migration against a fresh in-memory SQLite
produced **24 tables and 69 rows total**, none of them from the seeds:

| Table | Rows after replay | CSV rows that should be there |
|---|---|---|
| `bullets` | **0** | 120 |
| `powders` | **0** | 169 |
| `cartridge_specs` | **table does not exist** | 229 |
| `recipes` | 0 | — (no seed yet) |
| `cartridges` | 8 | 229 |
| `manufacturers` | 16 | 50 |
| `published_documents` | 23 | 25 |

**19 of 24 tables held zero rows.** `seed:check` was not broken — it loaded the
CSVs through its own in-memory instance correctly. The gap was that **no script
wrote the seeds into a database file**, so there was no path from
`data/seeds/*.csv` to a `.sqlite` or to D1.

#### What was done

| # | Task | Status |
|---|---|---|
| 0.2a | Loader applies migrations, then inserts every seed CSV in FK-safe order | **DONE** — `npm run db:local` writes `data/generated/apex.sqlite` |
| 0.2b | A check that fails when a populated CSV does not reach its table | **DONE** — parity block in `npm run schema:check` |
| 0.2c | Provision D1, set the real `database_id` | **OPEN** — needs owner credentials |
| 0.2d | Reconcile `cartridge_specs` with the `cartridges` table | **DONE** — `cartridge_specs/*.csv` now loads into `cartridges` (318 rows) |

**Measured result.** `npm run db:local` produces a 2.3 MB database:
`PRAGMA integrity_check` = `ok`, `PRAGMA foreign_key_check` = 0 violations,
**1,666 rows across 24 tables**. `bullets` 120 and `powders` 169, exactly as
0.2a required.

#### The two design decisions worth knowing

**One loader, not two.** `check-seeds.mjs` already contained the correct,
FK-safe load. `scripts/shared/load-database.mjs` reuses it by importing the
module rather than copying 1,300 lines of seed logic. Two copies would drift,
and the drift would be silent.

That required one change to the gate: its reporting and `process.exit(1)` are
now behind an `isMain` check, while the load itself stays unconditional.
**Consequence, stated plainly: the loader is only as correct as the gate.** If
`seed:check` passes, the database is populated correctly — which is why
`seed:check` runs before anything that consumes the database.

**Parity is asserted, not inferred.** `schema:check` previously passed while 19
tables were empty, because it only checked that migrations applied and that
three tables were non-empty. It now declares a CSV→table→expected-count table
and fails on any mismatch. This is the check that would have caught the
`INSERT OR IGNORE` episode that silently dropped 7 of 11 bullet rows.

It was verified by negative test: splicing 7 rows out of the load produces
`FAIL bullets -> 0 (expected 120)` and **exit 1**; the clean run exits 0.

**Ten tables remain legitimately empty** (`recipes`, `products`, `reviews`,
`video_links`, and others) — they describe data this project has not gathered.
`db:local` lists them by name so an empty table is a recorded decision rather
than an oversight.

### 0.3 `bullets.diameter_in` holds calibre designations, not measurements

**Why it blocks.** `diameter_in` reads `0.264` for a 6.5mm bullet. A real 6.5mm
bullet is **0.256 in**. Any drag, sectional-density or form-factor calculation
using that column is silently wrong. The name promises a measurement and does
not deliver one.

| # | Task | Done when |
|---|---|---|
| 0.3a | Rename the column to `caliber_designation`, consolidating with the existing `caliber` column | No code path reads `diameter_in` |
| 0.3b | Add `bullet_dia_in` as a real measurement, nullable, populated only where CIP/CIPM or a manufacturer states it | `bullets.yaml` documents both; major calibres populated; rest NULL |
| 0.3c | Re-label the `estimated` 0.308 diameter in `value_provenance.csv` once real measurements exist | No `estimated` diameter remains |

A blank is a visible gap; a wrong value is a silent lie. That rule is already in
`data/schemas/bullets.yaml`.

---

## 1. Data integrity defects, already diagnosed

Each is small and has a specific failure mode.

### 1.1 `.300 WSM` collides on the declared primary key

`cartridge_pressures.yaml` declares `primary_key: [cartridge_name]`, but the CSV
has two `.300 WSM` rows with **different** figures: SAAMI 64 ksi and CIP 65 ksi.
`data:health` reports `dupes 3`.

This is a **manifest error, not a data error**. One cartridge legitimately has
separate SAAMI and CIP maxima, so the key must include the standard body.

- **Fix:** widen the key to `[cartridge_name, standard_body]`.
- **Also fix:** `6.5x70R` and `9.3x72R` are true duplicate rows — identical
  figures twice. Those *are* data errors; deduplicate them.
- **Fails if wrong:** `data:health` keeps showing `dupes 3`, or a reload
  suggestion silently drops the CIP figure.

### 1.2 `.38 S&W` appears twice in the secondary pressure file

One row at `14500 psi` (SAAMI piezo), one at `13000 cup` (copper crusher). Not
interchangeable — see `docs/BRASS-AND-PRESSURE-CLASS.md`. The secondary file has
a single `pressure_value` column, so it cannot express "one figure per method".

- **Fix:** add a `method` column, or split by method.
- **Fails if wrong:** `data:health` keeps showing `dupes 1` on that dataset.

### 1.3 Two unresolved pressure disputes — do not publish either

Reported by both `data:health` and `coverage`. They live in
`cartridge_pressure_conflicts.csv` with `resolution=unresolved`, and the
matching rows in `cartridge_pressure_overrides.csv` say the same.

| Cartridge | kwk.us | leverguns.com | Delta |
|---|---|---|---|
| 6.5mm Rem Mag | 53,000 cup | 56,200 cup | −3,200 |
| .350 Rem Mag | 53,000 cup | 56,200 cup | −3,200 |

Both are third-party compilations. **Agreement between compilations is
`derived`, not `published`.** Do not average them.

- **Fix:** read SAAMI Z299.4 directly. The archived
  `saami-z299.4-2025-centerfire-rifle.pdf` is on disk and unread.
- **Fails if wrong:** the conflict rows still say `unresolved`, or a pressure
  figure with >5% uncertainty is shown to a user.

### 1.4 `6.5 Creedmoor` carries an unconfirmed transposition override

`cartridge_pressure_overrides.csv` says kwk.us lists 52 ksi where SAAMI
Z299.4-2025 gives 62,000 psi — a digit transposition. The note is explicit that
the archived PDF **must be opened to confirm** before relying on the row.

- **Fix:** open `data/published/saami-z299.4-2025-centerfire-rifle.pdf` and either
  confirm the override or remove it.
- **Fails if wrong:** the override ships unverified. It is the only row in the
  file whose basis is a suspected error in a source.

---

## 2. Structural gaps in the data

### 2.1 `cartridge_specs` — 10 of 21 columns are entirely empty

```
parent_case, bullet_dia_in, case_length_max_in, max_col_in, cip_max_bar,
rim_dia_in, head_dia_in, capacity_gr_h2o, primer_type, typical_twist_in
```

Only `saami_max_psi` is populated throughout (43%), and that comes from one
compilation rather than from SAAMI or CIP directly. **This is the largest content
gap in the project.**

Finer split keys were evaluated and rejected: all ten columns are empty on all
229 rows, so none could be a filename or directory level. Splitting by calibre
would produce ~90 files of 1–3 rows each, trading one unmanageable file for
ninety trivial ones.

- **Fix:** transcribe from the archived SAAMI Z299.2/.3/.4 PDFs (rifle, pistol,
  shotgun) plus the CIP TDCC index. Mechanical transcription, and the bulk of
  the remaining catalog work.
- **Note:** `bullet_dia_in` is the same column as blocker 0.3, and should be
  filled in the same pass.

### 2.2 `powders.relative_burn_rate_position` is empty on all 169 rows

Drives the barrel-scaling exponent, which is `estimated`. `burn_rate_class` is
only 35% populated and `geometry` (single/double/triple base) is 2%.

- **Fix:** fill from manufacturer datasheets. `npm run data:extract` already
  produces `powder_burn_rate_positions.csv` (22 rows, Vihtavuori only).
- **Constraint:** positions are **not comparable across brands** and must never
  be merged into one scale. Encoded in the manifest and the health output. Read
  `data/research/powder_burn_rate/crossbrand_review.csv` first.

### 2.3 `sourcing_*` — three datasets that are almost entirely scaffolding

| Dataset | Rows | Empty columns |
|---|---|---|
| `sourcing_listings` | 22 | **10 of 21**, including `price_cents`, `retailer_sku`, `retailer_url`, `verified_by` |
| `sourcing_retailers` | 8 | 6, including `affiliate_network`, `network_store_id` |
| `sourcing_searches` | 12 | 2 |

**Zero listings are `verified`.** `affiliate_network` is blank for all 8
retailers, so the `sourcing_affiliate_readiness` view reports
`needs affiliate network` for every one of them. Since affiliate commission is
the entire revenue model, this is more load-bearing than its row count suggests.

- **Fix:** either populate the network from the vendor programmes, or delete the
  three datasets. Shipping tables whose every meaningful column is blank is
  worse than not shipping them.
- **Fails if wrong:** a retailer appears in the UI with no affiliate link and no
  way to earn from it.

### 2.4 `value_provenance` — 4 rows for 989

The provenance layer the project's entire "never invent a value" rule depends on
covers 0.4% of the data. `source_id`, `reviewed_by`, `reviewed_on` and
`text_value` are empty on all four rows.

- **Fix:** populate per value as data is added, starting with anything
  load-adjacent. This is a per-row discipline, not a bulk backfill.

---

## 3. Coverage — the long tail

`npm run coverage`: **done=7, partial=3, not started=32, n/a=8** of 50
manufacturers.

| Priority | Makers | Note |
|---|---|---|
| High | Nosler, Hornady, Sierra, Lapua, Speer, Federal, Remington | Publish usable charts; the bullet importer is built and proven |
| Medium | RWS, Sellier-Bellot, Norma, Prvi Partizan, PMC, Speer brass | Often publish G1-only or identity-only data |
| Low | Bear Creek, Blue Bullets, Cutting Edge, Lehigh, Montana Gold, Rainier, Warner, Woodleigh | Small or secondary makers |

```bash
npm run bullets:import -- <slug>   # one manufacturer
npm run test:bullets               # parser invariants
```

**Check `docs/SOURCE-SURVEY.md` first.** It records which manufacturers publish
HTML tables, PDFs, identity-only data, G1-only data, or **nothing usable** — and
several publish nothing. A manufacturer with no usable source is a legitimate
"not started". **Do not invent rows to fill a coverage cell.**

**A misleading status worth fixing first.** `sierra.csv` has 4 bullet rows and 0
powder rows; `vihtavuori.csv` has 27 powder rows and 0 bullets. Both report
`done`, because one category is complete and the others are not counted. The
status needs to be per-category, or `done` overstates 7 of the 50.

---

## 4. Housekeeping

| # | Task | Note |
|---|---|---|
| 4.1 | Provision D1 (§0.2c) | `wrangler.toml` still has the placeholder id. Nothing has ever been deployed to a database. |
| 4.2 | Two manifest entries have no file on disk | `shooters-world-reloading-manual.pdf` and `vectan-reloading-catalogue-2025.pdf` are listed in `manifest.json` but absent from `data/published/`. **No seed row cites either URL**, so nothing is currently broken — but the manifest overstates what is archived. Either fetch them or mark them `not_downloaded`. |
| 4.3 | Decide on the duplicate Alliant PDFs | `alliant-reloaders-guide-2020.pdf` (13.4 MB) and `-2021.pdf` (11.6 MB) are the same guide, two editions. Do **not** delete the older one until you have checked no `source_url` cites it. |
| 4.4 | Commit the staged work | 130+ files are staged and `verify` exits 0. Nothing is committed. `AGENTS.md` rule 14: only when asked. |
| 4.5 | Delete or keep the 7 `*.pre-encoding-fix.bak` snapshots | From an earlier `repair-encoding.mjs` run. Not gitignored. Rule 16: do not delete without saying so. |
| 4.6 | Reconcile the test- and stage-count references | `docs/TASK-LIST.md` said 157 tests in places; `npm test` reports **215**. `verify` now has **10** stages, not 7 or 8. |
| 4.7 | `sourcing_searches` `entity_type`/`entity_slug` empty | 2 columns, 12 rows. Low value individually, but they are the join keys to the other two sourcing tables. |
| 4.8 | Make `data:health` report a `recipes` line | It currently omits the dataset entirely, so the project's headline gap is invisible in the health output. A dataset with a schema table and no CSV should read `absent`, not be missing. |

---

## 5. Already done, so nobody redoes it

Recorded because each was a non-obvious failure that is easy to reintroduce.

- **Bullet identity** is `(manufacturer_slug, part_number)`. The old
  `(name, weight)` key dropped 7 legitimate Berger bullets: a 6.5 mm and a 7 mm
  140 gr VLD Target share a name and weight but are different projectiles.
- **Every CSV is governed by a manifest** — 23 of 23, up from 11 of 22. Nothing
  loads that is not type-, enum- and reference-checked.
- **Powders reproduce from a fresh clone.** 169 rows, 7 files, all tracked. The
  manifest previously merged a gitignored directory for 142 of those rows, so a
  clone loaded 27.
- **`cartridge_specs` is split by family** — rifle/pistol/shotgun, 229 rows
  verified. Calibre grouping was rejected: ~90 files of 1-3 rows each.
- **Encoding is enforced.** `npm run test:encoding` fails on UTF-16, BOMs, stray
  CRs, CRLF, blank lines and ragged rows. `cartridge_specs.csv` had been
  UTF-16LE and parsed fine in every tool that auto-detects, which is why it went
  unnoticed.
- **Nothing the loader reads may live under `data/incoming/`.** Enforced by a
  check that queries git directly rather than trusting `.gitignore`.
- **Do not use `INSERT OR IGNORE` as a substitute for validation.** It hid those 7
  dropped bullets as silent successes.
- **The generated Markdown banner bug is fixed at source.** The 13 files in
  `data/generated/md/` had lost their `# <dataset>` heading into the `-->` HTML
  comment, because `MD_BANNER` and `renderMd` did not leave a blank line between
  them. Fixed in `scripts/data/build-data.mjs`, not in the output, so it survives
  every rebuild.
- **The app is isolated from this layer.** `scripts/handoff/check-handoff.mjs` (stage 11
  of `verify`) fails if anything here reaches `apps/website/dist/index.html`, and if
  the page stops being self-contained. See `HANDOFF.md`.
