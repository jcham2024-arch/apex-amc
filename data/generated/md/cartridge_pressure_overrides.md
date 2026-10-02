<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  cartridge_pressure_overrides
  Source:   data/seeds/cartridge_pressure_overrides.csv
  Manifest: data/schemas/cartridge_pressure_overrides.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# cartridge_pressure_overrides

> **Generated file - do not edit.** Built from
> `data/seeds/cartridge_pressure_overrides.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 3
- **Source files:** data/seeds/cartridge_pressure_overrides.csv
- **Column contract:** `data/schemas/cartridge_pressure_overrides.yaml`
- **Populated:** ~100% of cells (a blank means "not known yet", not "zero")

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `cartridge_name` | string | yes | Cartridge designation as the compilation tables spell it. |
| `standard_body` | string (4 values) | yes | Which body published the figure being overridden. Upper case, because these are the body's own name as they write it. Mirrors the CHECK constraint on cartridge_pressure_references.standard_body in data/schema/009. |
| `method` | string (3 values) | yes | Which measurement method the figure refers to. SAAMI and CIP both publish piezo and copper-crusher maxima, and they are not interchangeable - an override that ignored this would silently replace a piezo figure with a copper-crusher one. Mirrors the CHECK constraint in data/schema/009; the loader derives this from pressure_unit ('cup' -> copper_crusher) for the compilation files. |
| `corrected_value` | number | yes | The value that should be used instead. Always read with unit. |
| `unit` | string (5 values) | yes | Unit of corrected_value. |
| `basis` | string (3 values) | yes | Why this override exists. Required, not optional: an override with no stated basis is indistinguishable from a guess, and a guess that outranks the compilations is the worst possible failure mode for pressure data. - primary: read from the standards body's own current table. - compilation: taken from a published compilation, not the body itself. - known_error: the compilation figure is believed wrong. |
| `source_url` | string | no | Where the corrected figure was read. |
| `reviewer_note` | string | no | Why the correction was made. May contain commas; keep quoted. |

## Sample rows

| `cartridge_name` | `standard_body` | `method` | `corrected_value` | `unit` | `basis` |
|---|---|---|---|---|---|
| 6.5 Creedmoor | SAAMI | piezo | 62000 | psi | primary |
| 6.5mm Remington Magnum | SAAMI | copper_crusher | 53000 | cup | compilation |
| .350 Remington Magnum | SAAMI | copper_crusher | 53000 | cup | compilation |
