# data/seeds/

Curated reference data. This is the source of truth for row content - every
other artefact in `data/` is derived from these CSVs.

Each dataset has a column manifest in `data/schemas/` and is rebuilt into
`data/generated/` by `npm run data:build`.

## Layout

| File | Rows | Notes |
|---|---|---|
| `manufacturers.csv` | 43 | Maker directory. Several rows carry several kinds (ammo + brass). |
| `cartridge_specs.csv` | 229 | Largest hand-maintained file. All from one source (KwK). |
| `cartridge_pressures.csv` | 234 | Primary max-pressure figures. |
| `cartridge_pressures_secondary.csv` | 114 | Secondary/comparative figures, not the primary value. |
| `cartridge_pressure_conflicts.csv` | - | Rows where sources disagree. |
| `cartridge_pressure_overrides.csv` | - | Deliberate departures from source data, each justified. |
| `powder_burn_rate_positions.csv` | - | Where a powder sits on a burn-rate chart. |
| `sourcing_retailers.csv` | - | Retailer directory. |
| `sourcing_searches.csv` | - | Searches run, with what they found. |
| `sourcing_listings.csv` | - | Retailer listings. **Zero rows are `verified` yet.** |
| `value_provenance.csv` | - | Which source backs which computed value. |
| `bullets/*.csv` | 120 | One file per manufacturer. See below. |
| `powders/*.csv` | 27 | Currently one file; see the warning below. |

## Conventions

- **UTF-8, no BOM, LF line endings, RFC 4180 quoting.** Enforced by
  `npm run test:encoding`, which checks every committed seed CSV for BOMs, UTF-16,
  stray CRs, blank lines, trailing whitespace and rows whose field count
  disagrees with the header. `npm run text:scan` reports drift without failing.

  These are not stylistic preferences. `cartridge_specs.csv` - the largest
  hand-maintained file here - was silently stored as UTF-16LE, and
  `value_provenance.csv` carried a BOM. Both parsed correctly, because
  PowerShell's `Import-Csv` and the loader's reader auto-detect encoding, so
  nothing failed until something read the file as plain UTF-8. The checks exist
  because the failure is invisible from the tools that were being used.
- **One file per manufacturer** for the multi-row datasets (`bullets/`,
  `powders/`), so a correction to one maker's data does not churn the whole
  file. Filename is the manufacturer's slug.
- **A blank cell means "not known yet", never "zero".** `data:health` treats a
  blank as a gap to report, so filling a cell with `0` to silence a warning is
  worse than leaving it blank.
- **Every row carries `source_url`.** No source, no row.

## bullets/

| File | Rows | Identity |
|---|---|---|
| `berger.csv` | 109 | Berger part number (265xx, 264xx, ...) |
| `hornady.csv` | 7 | Hornady item number (6515, 6516, ...) |
| `sierra.csv` | 4 | Sierra slug + name; these lines publish no per-weight SKU |

Bullets are keyed on `(manufacturer_slug, part_number)`. The older
`(name, weight)` key was wrong: Berger sells a 6.5 mm 140 gr VLD Target (26401)
and a 7 mm 140 gr VLD Target (26504) - same name, same weight, different
projectile. Eight of Berger's 109 published bullets collide that way, and the
old key silently dropped the second of each pair.

`bc_reference` records what a manufacturer states their BC is referenced to.
`unspecified` means they publish a number without saying what it is relative to.
Berger does exactly that, so all 109 Berger rows are `unspecified`. Hornady
publishes against Mach 2.0 and 1.75, so those rows carry real values in
`bc_g1_mach_2_0` / `bc_g7_mach_2_0` / `bc_g1_mach_1_75` / `bc_g7_mach_1_75`
alongside a G7 computed from them.

Mixing the two is what makes BC comparison unsafe, and `data:health` reports it:
`bc_g1_mach_2_0` and friends are only ~3% populated, so nearly every row is
`unspecified` and G7 across manufacturers is not on a common basis. See
migration `014_bc_basis.sql` for the validation rule that follows from this.

To re-parse a manufacturer's charts:

```bash
npm run bullets:import                 # all manufacturers
npm run bullets:import -- berger      # just one
npm run test:bullets                  # parser invariants
```

## Maintenance scripts

| Script | What it does |
|---|---|
| `promote-powders.mjs` | Promotes harvested powder files from `data/incoming/powders/` into `seeds/powders/`. Verifies headers, primary-key uniqueness, filename/slug agreement and manufacturer resolution **before** copying, then re-reads from disk to confirm no row was lost. Has `--dry-run`. |
| `split-cartridge-specs.mjs` | Splits a monolithic `cartridge_specs.csv` into one file per family. Idempotent — refuses to overwrite an existing split. |
| `split-seeds-by-manufacturer.mjs` | Splits a flat `bullets.csv` / `powders.csv` into one file per manufacturer. |
| `repair-encoding.mjs` | Repairs mojibake (cp1252 misread as UTF-8) in place, writing `.bak` copies first. |

All four are run-once transforms with `--dry-run` where it matters. They are
idempotent and documented, so keeping them is defensible; `TODO.md` §4.2 notes
them as optional cleanup.

## Powders: seven committed brands

All seven powder brands are committed here, one file each:

| File | Rows |
|---|---|
| `accurate.csv` | 19 |
| `alliant.csv` | 25 |
| `hodgdon.csv` | 35 |
| `imr.csv` | 38 |
| `ramshot.csv` | 12 |
| `vihtavuori.csv` | 27 |
| `winchester.csv` | 13 |

Until 2026-10-01 the last six of those lived in `data/incoming/powders/`, which
`.gitignore` excludes, while the manifest still merged that directory with this
one. The loader therefore read 169 rows on a working machine and 27 on a fresh
clone - so the powder row count, the health report and everything generated from
powders all depended on the checkout rather than on the repository.

`scripts/promote-powders.mjs` performed the promotion. It verifies before
copying that the headers are identical, that `(manufacturer_slug, product_name)`
is unique, that each file's name matches the slug on all of its rows, and that
every brand resolves in `manufacturers.csv`; it then re-reads the result from
disk and compares the totals, so a lost row fails loudly rather than quietly
shrinking the dataset.

The rule now enforced: **nothing the loader reads may live under
`data/incoming/`.** It is staging only.

## Cartridge specs: one file per family

`data/seeds/cartridge_specs/` holds `rifle.csv` (212), `pistol.csv` (16) and
`shotgun.csv` (1) - 229 rows, previously one monolithic `cartridge_specs.csv`.
The filename is the family, and the manifest checks that each file contains only
rows for the family it is named after, so a rifle row cannot end up filed under
`pistol.csv`.

Family is the split key because every finer candidate is empty on all 229 rows:
`parent_case`, `bullet_dia_in`, `case_length_max_in`, `max_col_in`,
`cip_max_bar`, `rim_dia_in`, `head_dia_in`, `capacity_gr_h2o`, `primer_type` and
`typical_twist_in` all have zero non-blank values. Splitting by calibre instead
would have produced about 90 files of one to three rows each, which trades one
unmanageable file for ninety trivial ones without reducing conflicts.