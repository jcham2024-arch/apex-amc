# AGENTS.md — baseline for any agent working in this repo

Written 1 Oct 2026. **This is the first file to read.** It exists because every
fact below was learned the expensive way, and the repo had no agent-facing
instructions at all before now.

Everything here is verified against the repo as of the date above. Where a number
could go stale, the command that produces the live value is named.

---

## The one rule

> **Never invent a value. Leave the cell EMPTY.**

A blank means "not known yet". It never means zero, and it is never filled with a
plausible guess. Full doctrine: `data/research/POWDER-ACCURACY-DOCTRINE.md`.

This is not caution for its own sake. For load-adjacent data a wrong number can
injure someone, and a missing one is visible while a wrong one is not. Two
third-party compilations agreeing is `derived`, **not** `published` — agreement
between compilations is evidence, not a standard.

---

## Before you do anything

```bash
npm run verify     # must exit 0. 8 stages, ~215 tests.
npm run data:health  # live row counts, manifest coverage, reference integrity
npm run coverage     # per-manufacturer status
```

`verify` = lint → typecheck → test → test:encoding → test:bullets → schema:check
→ seed:check → data:validate. Run it **before and after**. A task is not done
until it passes.

## Current state (verify with the commands above)

| | |
|---|---|
| Governed data | **989 rows across 13 datasets; all 23 CSVs have manifests** |
| Manufacturers | **50** in `manufacturers.csv`; 51 rows in the DB (42 makers + 8 retailers, plus one inserted during load) |
| Bullets | **120** — Berger 109, Hornady 7, Sierra 4 |
| Powders | **169** across 7 brands |
| Cartridges | 318 (229 curated specs) + 782 pressure references |
| **Load recipes** | **ZERO. `recipes` is empty.** |
| Tests | 215 passing |

Coverage: **done=7, partial=3, not started=32, n/a=8** of 50 manufacturers.

**`recipes` being empty is the headline.** Everything else is engineering; that
is a content problem, and it gates the feature the project is for.

---

## Repo shape

npm workspaces monorepo.

| Path | What |
|---|---|
| `packages/ballistics-core/` | Pure domain logic (solver, drag, dispersion, reloading, atmosphere). **All physics belongs here.** |
| `apps/website/` | Cloudflare Pages, single-file React + Babel |
| `apps/ballistics/` | Expo 57 field app |
| `data/seeds/` | Curated loadable CSVs — **the source of truth for row content** |
| `data/schemas/` | YAML column manifests: types, required, enums, references. **The rules the loader enforces.** |
| `data/schema/` | Numbered D1 migrations, applied in filename order |
| `data/generated/` | JSON + Markdown built from the seeds. **Never hand-edit.** |
| `data/published/` | Archived source PDFs. Gitignored except `manifest.json` |
| `data/research/` | Curated analysis, not data. Not loaded by anything |
| `data/incoming/` | Research staging. Gitignored. **Never read by the loader** |
| `data/extracts/` | Verbatim text pulled from source docs, kept for re-verification |

### Data layout: one file per key, not one table per type

```
data/seeds/
  manufacturers.csv              one row per company (stays single)
  bullets/       sierra, hornady, berger       - one file per manufacturer
  powders/       accurate, alliant, hodgdon, imr,
                 ramshot, vihtavuori, winchester
  cartridge_specs/  rifle, pistol, shotgun      - one file per family
---

## Rules

### Data

1. **A row without a `source_url` is not data.** If you cannot cite where a
   number came from, do not add the row.
2. **Nothing the loader reads may live under `data/incoming/`.** It is staging.
   A manifest pointing at a gitignored path means row counts depend on the
   checkout, not the repo — this happened for 142 of 169 powder rows.
3. **Never `INSERT OR IGNORE` as a substitute for validation.** It skipped a
   constraint-violating row without a word. Seven legitimate Berger bullets were
   dropped that way on 2026-10-01.
4. **Blank is null, not `""`.** The 012 provenance layer depends on the
   difference.
5. **Part numbers and SKUs are strings, never numbers.** `065147` → `65147`
   destroys a leading zero and breaks the join.
6. **UTF-8, no BOM, LF line endings, RFC 4180 quoting.** Enforced by
   `npm run test:encoding`. LF because `.gitattributes` says `* text=auto eol=lf`.

### Code

7. **No bare numeric literals in computation code.** Every physical constant goes
   in `packages/ballistics-core/src/provenance/constants.ts`, wrapped in
   `published()`, `derived()` or `estimated()` — imported from `./Source.ts`:
   ```ts
   export const GRAINS_PER_POUND = published(7000, SOURCES.cip, { units: 'gr/lb' });
   ```
8. **Never commit an original source document.** Archived PDFs are gitignored.
   Republish derived single facts with attribution only.
9. **Do not edit files you were not assigned.** Report the bug in your summary
   instead.
10. **If a script grows past what `scripts/` is for,** move the logic into
    `packages/ballistics-core/` and test it there.

### Git

11. **Do not commit or push unless asked.** Changes stay staged.
12. **Never force-push `main`.** The branch is `main`; work on a branch.
13. **Never delete a file you did not create** without saying so explicitly in
    your summary.

---

## Traps that cost real time

Each of these silently produced wrong behaviour. They are all now guarded, but
know them.

| Trap | What actually happened |
|---|---|
| **Unique key `(name, weight)` on bullets** | Berger sells a 6.5 mm and a 7 mm 140 gr VLD Target — same name, same weight, different projectile. 8 rows collided and the second of each was dropped. Identity is now `(manufacturer_slug, part_number)`. |
| **`DROP INDEX` on a constraint-backed index** | SQLite refuses. `015_bullet_identity.sql` was failing to apply, so the old constraint survived. Migrations now define the correct schema from the start. |
| **Files auto-detecting their encoding** | `cartridge_specs.csv` — the largest hand-maintained file — was **UTF-16LE** and parsed fine in every tool used to inspect it. A plain UTF-8 read returned NUL-interleaved garbage. |
| **A gitignored directory in a manifest** | 142 of 169 powder rows. A fresh clone loaded 27 while the working tree loaded 169. |
| **`relative()` returning backslashes on Windows** | A path comparison silently matched nothing and reported "0 curated rows". Normalise before comparing. |
| **A manifest `enum` guessed rather than read** | Values came from the data, not the schema. The SQL `CHECK` constraints — e.g. on `standard_body` and `method` in `data/schema/009_cartridge_specs.sql` — are authoritative for those columns. |
| **Trusting row-count arithmetic after a copy** | Re-read from disk. The count you expect is the count you assert, until proven otherwise. |
| **PowerShell mangling inline `node -e`** | Nested quoting silently corrupts the script. Write a file instead. |

---

## Common tasks

| Task | Command |
|---|---|
| Add a manufacturer | Row in `manufacturers.csv` + a file under `seeds/<type>/` |
| Import a manufacturer's bullets | `npm run bullets:import -- <slug>`, then `npm run test:bullets` |
| Add a cartridge | Row in `seeds/cartridge_specs/<family>.csv` |
| Add a powder | `data/incoming/powders/<slug>.csv`, then `node scripts/promote-powders.mjs --dry-run` |
| Check the data | `npm run data:health` |
| Check generated files are current | `npm run data:validate` |
| Rebuild the D1 snapshot | `npm run data:snapshot` |

Before harvesting any product line, read `docs/SOURCE-SURVEY.md`. It records what
each manufacturer publishes — and **several publish nothing usable**, which is a
legitimate "not started", not a failure.

---

## Where things are written down

| Doc | What |
|---|---|
| `docs/TODO.md` | **The task list.** Measured, prioritised, with what "done" means |
| `docs/TASK-LIST.md` | Code, safety and verification work |
| `docs/AGENT-HANDOFF.md` | Lane briefs for parallel agents |
| `docs/SEED-DATA-GUIDE.md` | How to populate the data layer correctly |
| `docs/SOURCE-SURVEY.md` | What each manufacturer does and does not publish |
| `docs/BRASS-AND-PRESSURE-CLASS.md` | SAAMI vs CIP. **Read before touching pressure data** |
| `docs/BALLISTICS-AUDIT.md` | Solver correctness. **Read before trusting any trajectory number** |
| `data/README.md` | Data pipeline layout and conventions |
| `data/schemas/*.yaml` | Column contracts. Start here when adding a column |

## What not to build

These already exist. Do not re-create them.

| Asked for | Already at |
|---|---|
| CSV loader / validator | `scripts/check-seeds.mjs` |
| Data generator / drift check | `scripts/build-data.mjs`, `npm run data:validate` |
| Column contracts | `data/schemas/*.yaml` (13 datasets) |
| Coverage report | `scripts/report-coverage.mjs` |
| Encoding guard | `scripts/test-encoding.mjs` |
| Powder promotion | `scripts/promote-powders.mjs` |
| Bulk data importer | **Does not exist and probably should not** — data is curated, not bulk-imported |

The original brief asked for `scripts/import-csv.ts`, `validate-row.ts` and
`report-coverage.ts`. All three exist as `.mjs` files with different names.

---

## Scope boundary

**Do not expand the scope of a task you were given.** If you find a bug outside
your assignment, report it; do not fix it silently. If a task's premise turns out
to be wrong — a file that no longer exists, a number that is already correct —
say so instead of working around it.

The repo contains several planning documents that predate the current state and
contradict each other. **Verify any claim against the code or a command before
building on it.** Where two documents disagree, the one that names a command to
check is usually right; when in doubt, run the command.

## Keeping this file honest

**If you change something this file states, update this file in the same commit.**
It is a baseline, and a wrong baseline is worse than none — it is trusted.

Two things will make it wrong:

1. **Row counts.** Do not retype them. Run the command named above the table and
   paste the number.
2. **A rule that turns out to be wrong.** Say so plainly in your summary rather
   than quietly working around it.

When you add a trap that cost you an hour, add it to the table above. That table
is the reason this file exists.
### Two processes that actively hide bugs

- **Ragged CSV rows.** The reader pads short rows, so a row with a missing field
  loads with the right *number* of keys and the wrong *values*. Never trust a key
  count as evidence a row is well formed.
- **`SELECT *` or a `.Count` on a padded object.** Same root cause.
```

The filename **is** the key, and the loader verifies every row agrees with it. A
row pasted into a competitor's file is a build failure, not a silent
misattribution. Adding a manufacturer's line is creating one small file.

If you need a single combined file, generate it — do not create one by hand and
do not let two copies be authoritative.