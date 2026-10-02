# Column manifests

**This is hand-written and authoritative.** The CSVs in `data/seeds/` hold the
data; these files define what the columns *mean*.

Each `<dataset>.yaml` is read by:

- `npm run data:build` — validates every row, then generates JSON and Markdown
- `npm run seed:check` — the build gate, using the same rules

Both import the same module (`scripts/shared/data.mjs`), so the gate and the
generator can never disagree about what a valid row is.

## Why this exists

On 2026-10-01, **7 of 11 bullet rows were being silently dropped.** Three
separate faults:

| Fault | Effect |
|---|---|
| `manufacturer_slug` was `Hornady`, not `hornady` | 3 rows orphaned — SQLite string comparison is case-sensitive |
| Hornady rows shifted one column left | all 3 rejected by a CHECK constraint |
| Berger rows had `very_low_drift` in `tip_type` | all 4 rejected — a design name, not a tip type |

The rules *did* exist, as CHECK constraints on the `bullets` table. But they
lived in `data/schema/004_reload_recipes.sql`, three directories from the data,
and the loader used `INSERT OR IGNORE` — which skips a constraint-violating row
**without a word**. Nobody was told. A shooter searching for a Hornady ELD-X got
an empty result set, not an error.

Moving the rules next to the data is what makes them effective. Adding
`data/seeds/bullets/rmr.csv` now requires no other edit and gets every rule
below applied automatically.

## Anatomy

```yaml
dataset: bullets
csv_dir: data/seeds/bullets      # or csv_path for a single file,
filename_is: manufacturer_slug  # or csv_dirs for several merged
primary_key: [manufacturer_slug, bullet_name, weight_gr]

columns:
  weight_gr:
    type: number          # string | number | integer | boolean | date
    required: true        # build fails if blank
    nullable: false       # true = blank is a meaningful value
    unit: gr              # shown by the generators
    enum: [...]           # the complete permitted set
    pattern: '...'        # regex, e.g. the slug rule
    minimum: 0.005        # plausibility guards
    maximum: 1.0
    note: >
      Why this column is what it is, and what commonly goes in it
      wrong. This is the part that prevents the next person repeating
      the same mistake, so write it for them, not for the machine.
```

## Conventions

- **`required: true`** means blank is an error. Reserve it for columns that make
  a row meaningless without them — usually an identity or a `source_url`.
- **`nullable: true`** means blank is a *legitimate, meaningful* value, and is
  different from "we forgot". `tip_type` is nullable: a VLD bullet's tip is an
  aerodynamic ogive, and the honest answer is blank rather than a guess.
- **A blank is `null` everywhere.** In JSON it is `null`, not `""` — "we do not
  know" and "the empty string" are different facts, and the provenance layer in
  `data/schema/012_value_provenance.sql` depends on telling them apart.
- **Identifiers stay strings.** `part_number` is a string so a leading zero
  survives; it is joined against retailer SKUs in the component finder.
- **Enums mirror the SQL CHECK.** Keep them in step. If a CHECK rejects a value
  the manifest allows, that is a bug in one of the two.

## Adding a dataset

1. Write the CSV(s) under `data/seeds/<type>/`.
2. Write `data/schemas/<type>.yaml`.
3. `npm run data:build`.

The generator and the gate pick it up automatically. There is no registry.
