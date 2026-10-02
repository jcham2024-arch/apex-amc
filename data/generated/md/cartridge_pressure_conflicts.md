<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  cartridge_pressure_conflicts
  Source:   data/seeds/cartridge_pressure_conflicts.csv
  Manifest: data/schemas/cartridge_pressure_conflicts.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# cartridge_pressure_conflicts

> **Generated file - do not edit.** Built from
> `data/seeds/cartridge_pressure_conflicts.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 2
- **Source files:** data/seeds/cartridge_pressure_conflicts.csv
- **Column contract:** `data/schemas/cartridge_pressure_conflicts.yaml`
- **Populated:** ~100% of cells (a blank means "not known yet", not "zero")

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `kwk_name` | string | yes | Cartridge designation as the primary compilation (kwk) spells it. |
| `secondary_name` | string | yes | The same cartridge as the secondary compilation spells it. Recorded separately rather than assumed identical, because a naming difference is itself the reason several rows cannot be matched automatically. |
| `unit` | string (5 values) | yes | Unit both figures are expressed in, so delta is meaningful. |
| `kwk_value` | number | yes | The primary compilation's figure. |
| `secondary_value` | number | yes | The secondary compilation's figure for the same cartridge. |
| `delta` | number | no | secondary_value minus kwk_value. Left blank rather than computed in the CSV when it is not yet established which way round the subtraction goes. |
| `resolution` | string (5 values) | yes | How the disagreement was settled. - unresolved: nobody has checked the standard body yet. - both_valid: not actually a conflict; the two publish different methods (piezo vs cup) or different vintages, and both may be right. - typo_in_name: the figures agree; the cartridges were matched by mistake. |
| `resolution_note` | string | no | What the resolution rests on. May contain commas; keep quoted. An unresolved row with no note is a task, not an oversight. |

## Sample rows

| `kwk_name` | `secondary_name` | `unit` | `kwk_value` | `secondary_value` | `delta` | `resolution` |
|---|---|---|---|---|---|---|
| 6.5 Rem Mag | 6.5 Rem Mag | cup | 53000 | 56200 | -3200 | unresolved |
| .350 Rem Mag | .350 Rem Mag | cup | 53000 | 56200 | -3200 | unresolved |
