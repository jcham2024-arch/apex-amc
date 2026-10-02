# The Apex AMC data repository

**Start here.** This is the entry point for the reference-data side of the
project: what exists, why each file type exists, what each one is for, and what
to do next.

Other documents:

| Document | For |
|---|---|
| [`SEED-DATA-GUIDE.md`](SEED-DATA-GUIDE.md) | Deep detail on every seed file, column by column |
| [`DATA-MODEL.md`](DATA-MODEL.md) | The relational model and its two invariants |
| [`ROADMAP.md`](ROADMAP.md) | Product direction: UI, offline, LLM, load design |
| [`SOURCES.md`](SOURCES.md) | Where the archived primary documents came from |
| [`data/schemas/README.md`](../data/schemas/README.md) | The column-manifest format |
| [`data/generated/README.md`](../data/generated/README.md) | Which file format to use, and when |

---

## 1. What this repository is for

A reloading reference database. A shooter should be able to look up a
cartridge, a bullet, a powder or a primer and get **an answer they can trust,
with a link to where the answer came from.**

That second half is the whole design constraint. Every decision here follows
from one question: *can a user find out where this number came from?* If a value
cannot be traced it does not go in — or it goes in labelled as an estimate, with
the reasoning attached and visible.

---

## 2. The five file types, and why each exists

There are five kinds of file. Two are edited by hand; three are produced.

| File type | Hand-edited | What it is | Why this type |
|---|---|---|---|
| **CSV** | yes | The data | Diffable per field, pastes from a manufacturer site, reviewable |
| **YAML** | yes | Column contracts | Comments, enums and prose live next to the data they describe |
| **SQL** | yes | Schema + migrations | The database is the target; migrations are the history |
| **JSON** | no, generated | Typed data for code | Numbers are numbers, blanks are `null`, no coercion guessing |
| **Markdown** | no, generated | The same data, readable | Review, PR descriptions, docs, "what does this column mean" |

### Why CSV is the primary database

Measured, not assumed — the data is **100% flat**, with no nesting anywhere, so
JSON's main advantage does not apply.

The deciding factor is diff granularity. A JSON edit rewrites the whole line, so
a reviewer's diff stops showing *which field* changed. For a project whose entire
premise is traceability of every value, that loss is not worth taking everywhere.

CSV's real costs, both of which are handled:

- **90 values genuinely need quoting** — cartridge names contain commas and
  escaped quotes (`.500 NE 3"`, `12 gauge 3 1/2" mag`). Handled by an RFC-4180
  reader in `scripts/shared/data.mjs`; `split(',')` would be wrong here.
- **A blank is ambiguous.** A blank might be "unknown" or "zero". Handled by
  declaring every column in a manifest, which says which.

### Why JSON is generated rather than authored

Generated from the CSV, so the two cannot disagree. It adds what CSV cannot
express: real types, `null` for blank, and the column contract inlined so a
consumer never has to find the YAML.

```json
{ "part_number": "6516",   // string - a leading zero survives
  "weight_gr": 140,        // number, not "140"
  "bc_g7": null,           // "not known yet", distinct from ""
  "_source": "data/seeds/bullets/berger.csv", "_line": 2 }
```

Identifiers stay strings deliberately: `part_number` is joined against retailer
SKUs in the component finder, and coercing `065147` to `65147` breaks that join.

### Why Markdown is generated rather than authored

It is not a data format. It is a *reading* of the data: a summary, the column
contract in prose, coverage per manufacturer, and a readable sample. A markdown
table of 169 rows is unreadable, so only a sample is rendered — for the long
tail, the JSON and the CSV are the right artefacts.

### Why YAML sits beside the data

This is the one that fixed a real bug, and it is worth understanding.

On 2026-10-01, **7 of 11 bullet rows were being silently dropped.** Three
faults: a `manufacturer_slug` with the wrong case, a one-column shift, and a
design name (`very_low_drift`) sitting in `tip_type`.

The rules *did* exist, as CHECK constraints on the `bullets` table. But they
lived in `data/schema/004_reload_recipes.sql` — three directories from the data —

---

## 3. The pipeline

```
  data/published/            archived primary sources (gitignored)
  SAAMI Z299.x, CIP TDCC, burn-rate charts, reloading guides
        |  cited, never copied wholesale
        v
  data/seeds/**/*.csv   <-- EDIT: the database
  data/schemas/*.yaml  <-- EDIT: the column contract
        |
        |  npm run data:build
        |    - validate every row against its manifest
        |    - check cross-dataset references
        v
  data/generated/json/ + data/generated/md/     (read-only)
        |
        |  npm run seed:check
        v
  in-memory SQLite built from data/schema/*.sql   -> D1
        |
        v
  website / app
```

Two directories, and the difference matters:

| Directory | Stage | Git |
|---|---|---|
| `data/published/` | Archived third-party documents | **gitignored** — other people's copyright |
| `data/incoming/` | Raw research drop awaiting curation. Never read by the loader. | **gitignored** |
| `data/research/` | Curated analysis that is not seed data | Yes |
| `data/seeds/` | Curated, validated, loadable | tracked |
| `data/schemas/` | Column contracts | tracked |
| `data/generated/` | Machine output | tracked, never edited |

---

## 4. What is built, and what is missing

Measured on 2026-10-01 by `npm run data:health`:

```
dataset       files   rows  populated  empty  dupes  state
-------------------------------------------------------
bullets           3     11        78%      2      0  thin
manufacturers     1     42       100%      0      0  good
powders           7    169        72%      1      0  thin
-------------------------------------------------------
TOTAL            11    222
```

**Honest summary of scale:** this is a well-built *shell* around a small
amount of data. 989 governed rows across 13 datasets, every CSV file governed,
and most

---

## 5. Commands

```bash
npm run data:health     # one-glance quality report — run this first
npm run coverage        # per-manufacturer coverage table
npm run data:build      # validate CSVs, regenerate JSON + Markdown
npm run data:validate   # fail if a generated file is stale (in `npm run verify`)
npm run seed:check      # load everything into SQLite and check it
npm run schema:check    # apply migrations, assert CSV→table row parity
npm run db:local        # write data/generated/apex.sqlite from migrations + seeds
npm run verify          # everything, in order. The gate before committing.
```

---

## 6. The rules

Not style preferences. They come from the schema's own comments and
`../AGENTS.md`.

1. **Never invent a value.** A value that does not exist stays NULL. A value
   that exists but has no source may be recorded at `derived`/`estimated` tier
   in `value_provenance.csv` **with its reasoning attached** — the build rejects
   the row otherwise. A blank cell is a visible gap; a wrong value is a silent
   lie.
2. **Never commit a source document.** `data/published/` is gitignored.
   Republish derived single facts with attribution.
3. **Provenance is mandatory.** Every row carries a `source_url`. This is a
   safety mechanism, not metadata.
4. **Community data never enters an official table** without being labelled and
   reviewed. See migration `011`.
5. **Disagreement is data.** Where sources conflict, every claimant is stored
   and the conflict is surfaced — not quietly resolved.
6. **Watch the unit.** psi, CUP and bar are mixed across files, sometimes
   within one column.
7. **Generated files are never edited.** Edit the CSV and rebuild.
8. **Run `npm run verify`** before you finish.

---

## 7. Where to add what

| You want to… | Do this |
|---|---|
| Add a manufacturer's bullets | Create `data/seeds/bullets/<slug>.csv`, copy the header from a sibling. Nothing else. |
| Add a manufacturer's powders | Create `data/seeds/powders/<slug>.csv`. Harvest into `data/incoming/powders/`, then promote with `scripts/data/promote-powders.mjs`. |
| Add a component type | Create `data/seeds/<type>/`, then `data/schemas/<type>.yaml`, then `npm run data:build` |
| Change what a column means | Edit `data/schemas/<type>.yaml` — the only place column rules live — then rebuild |
| Add a database table | New numbered migration in `data/schema/`, then update `data/schemas/` if it has a CSV |
| Record a sourced estimate | Add a row to `value_provenance.csv` with a `tier` and its `method` or `reasoning` |
| Add a retailer | Add to `manufacturers.csv`, then a row in `sourcing_retailers.csv` |
| Find where a number came from | Follow the `source_url` column. There is nowhere else to look. |

manufacturers with no component data at all. The machinery is the asset right
now; the content is the work.

### Layers in place

| Layer | Migration | State |
|---|---|---|
| Core catalog, recipes, profiles | 001–005 | schema complete, **zero load recipes** |
| Manufacturer directory | 006 | 50 rows (42 makers + 8 retailers), M:N kinds, aliases |
| Bullets / powders | 007–008 | 11 bullets, 169 powders |
| Cartridge specs + pressure provenance | 009 | 318 cartridges, 782 pressure references |
| Case reuse | 010 | schema only |
| Community layer (held separate) | 011 | schema only, by design |
| **Value provenance** | 012 | 4 annotated non-published values |
| **Sourcing / component finder** | 013 | 8 retailers, 8 targets, 22 listings |
| Column manifests | `data/schemas/` | 13 datasets, all CSV governed |

### Known data problems, in priority order

**The full list, with what "done" means for each item, is in
[`DATA-TODO.md`](DATA-TODO.md).** This is the summary:

1. **Zero load recipes.** `recipes` is empty. `ROADMAP.md` §1 argues the right
   approach is to store *citations* to published loads, not reproductions,
   because the manuals are copyrighted and commercially licensed. **This is the
   single largest gap** and it gates the feature that matters most.
2. **10 of 21 columns in `cartridge_specs/` are entirely empty** — all real,
   published SAAMI/CIP dimensions, simply not transcribed. CIP data is absent
   entirely; only `saami_max_psi` is populated, and that from one compilation.
3. **Two unresolved pressure disputes** (6.5 Rem Mag, .350 Rem Mag) — marked
   *do not publish* pending SAAMI Z299.4.
4. **`.300 WSM` and two other rows collide on the declared primary key.**
   A manifest error, not a data error — see `TODO.md` §1.1.
5. **Bullet `diameter_in` holds a caliber designation, not a measurement** — a
   6.5mm bullet is 0.256", not 0.264". Nothing may compute drag from it.
6. **All 22 sourcing listings are `likely`, none `verified`** — no product page
   has been retrieved, and the finder will not claim otherwise.
7. **32 of 50 manufacturers have no product rows at all.**

Recently closed, recorded so they are not reopened:

- All 23 CSV files now have manifests (was 11 of 22 ungoverned, including
  `cartridge_specs.csv` — the largest hand-maintained file, which had been stored
  as UTF-16LE with nothing checking it).
- Powders reproduce from a fresh clone: 169 rows, 7 brands, all tracked.
- Bullet identity is `(manufacturer_slug, part_number)`; the old `(name, weight)`
  key was dropping 7 legitimate Berger bullets.

### Why the rules live beside the data

7 of 11 bullet rows were being silently dropped on 2026-10-01. The rules lived in
a SQL CHECK constraint three files from the data, and `INSERT OR IGNORE` — which
skips a constraint-violating row **without a word** — swallowed the violations.
A shooter searching for a Hornady ELD-X got an empty result set, not an error.

Moving the rules next to the data is what made them effective. Adding
`data/seeds/bullets/rmr.csv` now requires no other edit and gets every rule
applied automatically.

### Where the SQL fits

`data/schema/*.sql` is the target shape — the tables, the constraints, and the
migrations that build them. The CSVs are the *input*; the SQL is the *output*.
`npm run schema:check` applies every migration to an in-memory SQLite and asserts
CSV→table row parity, so a migration that breaks the data fails immediately.
`npm run db:local` writes the result to `data/generated/apex.sqlite`
(1,666 rows across 24 tables).
