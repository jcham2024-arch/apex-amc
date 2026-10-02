# To-do list

> **SUPERSEDED 2 Oct 2026 by [`DATA-TODO.md`](DATA-TODO.md).**
>
> This file was the consolidated data task list until 2 Oct 2026, when a full
> audit of every seed CSV, manifest, migration and generated artefact was
> performed. That audit found a blocker no task here had recorded — **no
> script wrote the seeds into the schema, so 19 of 24 tables loaded zero rows**
> and the 989 curated rows never reached SQLite or D1. **That blocker is now
> fixed**: `npm run db:local` builds a populated database and `schema:check`
> asserts CSV→table parity. See [`DATA-TODO.md`](DATA-TODO.md) §0.2.
>
> **Go to [`DATA-TODO.md`](DATA-TODO.md).** The material below is kept for
> provenance only: the reasoning behind the accepted decisions is still worth
> reading, but the row counts, priorities and "done" markers are from 1 Oct 2026
> and were re-verified, not re-derived, on 2 Oct.
>
> `AGENTS.md` and `docs/README.md` have also been repointed at `DATA-TODO.md`.

---

## Archived content, last measured 1 Oct 2026

Every number below came out of `npm run data:health`, `npm run coverage` and
`npm run seed:check`, not from memory.

**This was the single consolidated task list for the data work.** It replaces the
competing task lists that used to live in `DATA-PLAN.md`, `SEED-DATA-GUIDE.md`
and the gaps section of `DATA-REPOSITORY.md`. If a task is not here, it is either
done (§5) or parked in `FUTURE-INTEGRATIONS.md`.

## How to use this

Work top to bottom. Each task states **why it matters** and what **done** means.
That is not padding - for load-adjacent data a silently wrong value is worse than
a missing one, because a missing one is visible.

Before starting anything:

```bash
npm run verify          # must exit 0 before and after
npm run data:health     # the baseline for any row-count claim
npm run coverage        # per-manufacturer status
```

The governing rule, from `data/research/POWDER-ACCURACY-DOCTRINE.md`:

> No invented values. Leave the cell EMPTY. A blank means "not known yet", never
> zero, and never a plausible guess.

---

## 0. Blocking: the load-data gap

Nothing else here matters as much. `recipes` is **empty** - zero published loads -
and every feature that justifies the project depends on it.

`ROADMAP.md` §1 argues the correct approach is to store **citations to published
loads**, not reproductions: the manuals are copyrighted and commercially
licensed, and a reloader needs the book on the shelf anyway.

| # | Task | Done when |
|---|---|---|
| 0.1 | Decide the load-data shape: a citation row (recipe id, source, page, cartridge, bullet, powder, charge, velocity) plus a free-text reproduction block | Written decision in `DATA-MODEL.md`, with the licensing reasoning |
| 0.2 | Add `data/seeds/load_recipes.csv` + manifest | Manifest exists, loader reads it, `data:health` lists the dataset |
| 0.3 | Transcribe from `data/published/` manuals, one source at a time | Every row carries `source_id` **and** a page number |
| 0.4 | Record transcription provenance per the doctrine | Every non-blank number has a `value_provenance` row |

**Do not invent a load.** If a manual page is illegible or a charge is ambiguous,
leave the field blank and note it. A made-up load can injure someone.

---

## 1. Data integrity defects, already diagnosed

Each is small, and each has a specific failure mode.

### 1.1 `.300 WSM` collides on the declared primary key

`cartridge_pressures.yaml` declares `primary_key: [cartridge_name]`, but the CSV
has two `.300 WSM` rows with **different** figures: SAAMI 64 ksi and CIP 65 ksi.
`data:health` reports `dupes 3`.

This is a **manifest error, not a data error**. One cartridge legitimately has
separate SAAMI and CIP maxima, so the key must include the standard body.

- **Fix:** widen the key to `[cartridge_name, standard_body]`, or add a
  `standard_body` column and key on that.
- **Also fix:** `6.5x70R` and `9.3x72R` are true duplicate rows - identical
  figures, twice. Those *are* data errors; deduplicate them.
- **Fails if wrong:** the health report keeps showing `dupes 3`, or a reload
  suggestion silently drops the CIP figure.

### 1.2 `.38 S&W` appears twice in the secondary pressure file

One row at `14500 psi` (SAAMI piezo), one at `13000 cup` (copper crusher). Not
interchangeable - see `BRASS-AND-PRESSURE-CLASS.md`. The secondary file has a
single `pressure_value` column, so it cannot express "one figure per method".

- **Fix:** add a `method` column (`piezo` / `copper_crusher`) to the file and
  widen the key. The manifest needs it too.
- **Fails if wrong:** a user reads 13,000 cup as if it were the piezo maximum.

### 1.3 `sourcing_searches.entity_slug` / `entity_type` empty on all 12 rows

No search row joins to the thing it searches for. `entity_type` is derivable from
`category` and should be backfilled now; `entity_slug` depends on the bullets
table gaining a slug column (§2.4).

- **Fails if wrong:** a bad slug is caught by the reference check I added, but a
  *missing* slug is currently silent.

### 1.4 `sourcing_retailers`: 6 of 15 columns empty on all 8 rows

`affiliate_network`, `network_store_id`, `feed_format`, `directions`, `city`,
`region_code`. These are **honest blanks, not defects** - `scraping_status` is
`unknown` precisely because nobody has checked whether each retailer's terms
permit automated lookup.

- **Fix:** none required. Fill only from the retailer's own site.
- **Do not** invent an affiliate network. Several programmes have migrated, and a
  wrong one produces dead links.
---

## 2. Content gaps, ranked by value

Coverage measured by `npm run coverage`: **done=7, partial=3, not started=32,
n/a=8** of 50 manufacturers. Bullets exist for 3, powders for 7.

### 2.1 Cartridge dimensions: 10 of 21 columns entirely empty

`cartridge_specs` is 47% populated. Empty on **all 229 rows**: `parent_case`,
`bullet_dia_in`, `case_length_max_in`, `max_col_in`, `cip_max_bar`, `rim_dia_in`,
`head_dia_in`, `capacity_gr_h2o`, `primer_type`, `typical_twist_in`.

Only `saami_max_psi` is populated throughout, and that is one third-party
compilation rather than SAAMI itself. CIP data is absent entirely.

- **Source:** CIP and SAAMI are both in `data/published/`. Start with CIP - the
  tables are machine-readable and cover more cartridges.
- **Rule:** case capacity and COL come from the standard body's own table. A
  capacity guess produces a case that is over- or under-loaded. That is a safety
  issue, not a data-quality one.

### 2.2 Resolve the 2 unresolved pressure conflicts

`cartridge_pressure_conflicts.csv` has 2 rows, both `resolution: unresolved`:
`.350 Rem Mag` and `6.5 Rem Mag`, 53,000 c.u.p. in each compilation.

- **Fails if wrong:** an unresolved conflict means one compilation transcribed the
  standard wrong, and we do not know which.

### 2.3 Bulk bullet coverage - 32 manufacturers with nothing

`nosler`, `lapua`, `speer`, `federal`, `norma`, `remington` and 27 others have
zero rows. The pipeline exists and is proven:

```bash
npm run bullets:import -- <slug>   # one manufacturer
npm run test:bullets               # parser invariants
```

**Check `SOURCE-SURVEY.md` first.** It records which manufacturers publish HTML
tables, PDFs, identity-only data, G1-only data, or nothing usable - and several
publish nothing. A manufacturer with no usable source is a legitimate
"not started". Do not invent rows to fill a coverage cell.

### 2.4 Add a slug column to bullets (blocks §1.3)

Makes bullet rows referenceable from the UI the way cartridges already are.
Migration `015` established `(manufacturer_slug, part_number)` as bullet identity
- a slug would be a third column, not a replacement.

### 2.5 Powder geometry: empty on all 169 rows

`geometry` (single/double/triple base). Drives load-density work and
`is_double_base` inference. Fillable from manufacturer datasheets.

---

## 3. Structural work

| # | Task | Note |
|---|---|---|
| 3.1 | Audit `data/published/manifest.json` | 25 files, ~69 MB. The manifest is committed and drives the D1 snapshot. Confirm every entry resolves and no orphan is listed. |
| 3.2 | Decide on the duplicate Alliant PDFs | `alliant-reloaders-guide-2020.pdf` (13.4 MB) and `-2021.pdf` (11.6 MB) are the same guide, two editions. Do **not** delete the older one until you have checked no `source_url` cites it - that is the real constraint, not disk space. |
| 3.3 | Second burn-rate chart | Only Vihtavuori has one. Positions are **not comparable across brands** and must never be merged into one scale - encoded in the manifest and health output. Read `data/research/powder_burn_rate/crossbrand_review.csv` first. |

---

## 4. Housekeeping

| # | Task | Note |
|---|---|---|
| 4.1 | Commit the staged changes | Everything is staged and `npm run verify` exits 0. Nothing is committed yet. |
| 4.2 | Delete `split-cartridge-specs.mjs` / `split-seeds-by-manufacturer.mjs` | One-shot transforms, already applied and idempotent. Keeping them is defensible; deleting reduces clutter. |
| 4.3 | Remove the pre-split-file warning | `check-seeds.mjs` still warns about a flat `powders.csv` that no longer exists. |
| 4.4 | Reconcile the README test count | Says 157; `npm test` reports **215 passing**. |

---

## 5. Already done, so nobody redoes it

Recorded because each was a non-obvious failure that is easy to reintroduce.

- **Bullet identity** is `(manufacturer_slug, part_number)`. The old
  `(name, weight)` key dropped 7 legitimate Berger bullets: a 6.5 mm and a 7 mm
  140 gr VLD Target share a name and weight but are different projectiles.
- **Every CSV is governed by a manifest** - 23 of 23, up from 11 of 22. Nothing
  loads that is not type-, enum- and reference-checked.
- **Powders reproduce from a fresh clone.** 169 rows, 7 files, all tracked. The
  manifest previously merged a gitignored directory for 142 of those rows, so a
  clone loaded 27.
- **`cartridge_specs` is split by family** - rifle/pistol/shotgun, 229 rows
  verified. Calibre grouping was rejected: ~90 files of 1-3 rows each.
- **Encoding is enforced.** `npm run test:encoding` fails on UTF-16, BOMs, stray
  CRs, blank lines and ragged rows. `cartridge_specs.csv` had been UTF-16LE and
  parsed fine in every tool that auto-detects, which is why it went unnoticed.
- **Nothing the loader reads may live under `data/incoming/`.** Enforced by a
  check that queries git directly rather than trusting `.gitignore`.
- **Do not use `INSERT OR IGNORE` as a substitute for validation.** It hid those 7
  dropped bullets as silent successes.