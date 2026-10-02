# data/

Everything the reloading database is built from, and the rules for changing it.

Nothing in here is application code. `packages/` holds the ballistics maths that
consumes this data; `data/` holds the facts it consumes and the evidence for
them.

## Layout

| Directory | What lives there | Committed? |
|---|---|---|
| `seeds/` | Curated CSV reference data. The source of truth for row content. | Yes |
| `schemas/` | One YAML column manifest per dataset. Types, required flags, cross-dataset references. | Yes |
| `schema/` | SQL migrations, applied in filename order to build the SQLite/D1 schema. | Yes |
| `published/` | Archived third-party source documents + `manifest.json` provenance. | manifest only; PDFs are local |
| `extracts/` | Verbatim raw text/HTML pulled out of those documents, kept for re-verification. | Yes |
| `reference/` | Engineering constants: drag tables, measured coefficients. | Yes |
| `incoming/` | Research staging. Harvested drops awaiting curation. **Never read by the loader.** | No - gitignored |
| `research/` | Curated analysis that is not seed data: the powder accuracy doctrine, burn-rate cross-brand review. | Yes |
| `generated/` | JSON + Markdown built from the above. Do not hand-edit. | Yes |

`docs/DATA-REPOSITORY.md` is the long-form guide to the whole pipeline.
`docs/SEED-DATA-GUIDE.md` covers how to add a row.

## The one rule

**A row without a source is not data, it is a guess.** Every CSV row carries
`source_url`. If you cannot cite where a number came from, do not add the row -
see `docs/SOURCE-SURVEY.md`, which records what each manufacturer does and does
not publish.

## Datasets

| Dataset | Rows | Source of truth |
|---|---|---|
| manufacturers | 50 | `seeds/manufacturers.csv` |
| bullets | 120 | `seeds/bullets/{sierra,hornady,berger}.csv` |
| powders | 169 | `seeds/powders/{accurate,alliant,hodgdon,imr,ramshot,vihtavuori,winchester}.csv` |
| cartridge_specs | 229 | `seeds/cartridge_specs/{rifle,pistol,shotgun}.csv` |
| cartridge_pressures | 348 | `seeds/cartridge_pressures{,_secondary}.csv` |
| published_documents | 25 | `published/manifest.json` |
| research | 1 doc + 1 CSV | `research/POWDER-ACCURACY-DOCTRINE.md`, `research/powder_burn_rate/` |

Row counts are as of 2026-10-01. Confirm with `npm run data:health`, which
prints them live rather than trusting this table.

Every row above is now in git and reachable from a fresh clone. That was not
true of most of this repository until 2026-10-01 - the bullet and powder CSVs,
all three column manifests, the cartridge spec table and migrations `012`-`015`
were all untracked, so a clone had no validation layer and no bullet data.

### Known gaps

**Every CSV file is now governed.** All 23 have a column manifest, so nothing
loads that is not type-checked, enum-checked and reference-checked.
`npm run data:health` reports `NO MANIFEST YET: none`.

**Cartridge dimensions are almost entirely empty.** 11 of the 21 columns in
`cartridge_specs` have no non-blank value on any of the 229 rows -
`parent_case`, `bullet_dia_in`, `case_length_max_in`, `max_col_in`,
`cip_max_bar`, `rim_dia_in`, `head_dia_in`, `capacity_gr_h2o`, `primer_type`,
`typical_twist_in` and `saami_max_cup`. Only `saami_max_psi` is populated
throughout, and that comes from one compilation rather than from SAAMI or CIP
directly. This is the largest content gap, not a structural one.

## Commands

```bash
npm run data:build      # regenerate data/generated/ from the seeds
npm run data:validate   # fail if data/generated/ is stale (drift check)
npm run data:health     # row counts, manifest coverage, reference integrity
npm run coverage        # population report per dataset
npm run bullets:import  # re-parse manufacturer bullet charts into seeds
npm run data:snapshot   # regenerate data/schema/100_seed_full_snapshot.sql
npm run verify          # everything above plus lint, types, unit tests
```

## Adding or changing data

1. Add or edit the CSV under `seeds/`. Keep the header; the manifest enforces it.
2. `npm run schema:check` - types, required fields, cross-dataset references.
3. `npm run data:build` then `npm run data:validate` - regenerate and confirm no drift.
4. `npm run seed:check` - the SQLite loader must read the same rows the CSV has.
   This step is not optional: the loader is written separately from the
   validator, and has silently dropped columns before. The manifest/loader
   agreement guard now fails the build if a declared column is not read.