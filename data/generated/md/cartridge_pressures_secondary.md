<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  cartridge_pressures_secondary
  Source:   data/seeds/cartridge_pressures_secondary.csv
  Manifest: data/schemas/cartridge_pressures_secondary.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# cartridge_pressures_secondary

> **Generated file - do not edit.** Built from
> `data/seeds/cartridge_pressures_secondary.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 114
- **Source files:** data/seeds/cartridge_pressures_secondary.csv
- **Column contract:** `data/schemas/cartridge_pressures_secondary.yaml`
- **Populated:** ~100% of cells (a blank means "not known yet", not "zero")

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `cartridge_name` | string | yes | Cartridge designation as THIS source spells it. Uses more aggressive abbreviation than cartridge_pressures.csv - e.g. ".45-06 Rem" here against ".45-06 Remington" in the primary file - so the loader's name index is what reconciles them, and the residual mismatches are the conflicts table. |
| `pressure_value` | number | yes | The pressure figure. Always read together with pressure_unit. |
| `pressure_unit` | string (5 values) | yes | Unit of pressure_value. Constrained rather than free text, because a number without a trustworthy unit is worse than no number for a load-adjacent table. |
| `family` | string (3 values) | no | Family as this source classifies it. Present here but not in the primary compilation; it is NOT used to create a cartridge, because a wrong family files a pistol cartridge on a rifle page. |
| `source_url` | string | no | Where the figure was read. Provenance is mandatory in spirit for pressure data. |
| `source_kind` | string (4 values) | yes | Whether this is a standards body's own figure or someone's compilation of them. 'compilation' ranks below 'standard' when both claim a cartridge. |
| `source_note` | string | no | How the value was derived. May contain commas; keep quoted. |

## Sample rows (first 25 of 114)

| `cartridge_name` | `pressure_value` | `pressure_unit` | `family` | `source_kind` |
|---|---|---|---|---|
| 5 mm RFM | 37000 | psi | rifle | compilation |
| .30-30 Winchester | 42000 | psi | rifle | compilation |
| .17 Rem | 52000 | cup | rifle | compilation |
| .30-06 Springfield | 60000 | psi | rifle | compilation |
| .22RF Short | 21000 | psi | rifle | compilation |
| .30-30 Winchester (Saboted) | 38000 | psi | rifle | compilation |
| .22RF Long & LR | 24000 | psi | rifle | compilation |
| .300 Savage | 47000 | psi | rifle | compilation |
| .22WRF | 19000 | psi | rifle | compilation |
| .300 Weatherby Magnum | 65000 | psi | rifle | compilation |
| .22WRM | 24000 | psi | rifle | compilation |
| .300 H&H Mag | 54000 | cup | rifle | compilation |
| .22 Hornet | 43000 | cup | rifle | compilation |
| .300 Win Mag | 64000 | psi | rifle | compilation |
| .218 Bee | 40000 | cup | rifle | compilation |
| .303 British | 49000 | psi | rifle | compilation |
| .22-250 Remington | 65000 | psi | rifle | compilation |
| .307 Win | 52000 | cup | rifle | compilation |
| 220 Swift | 54000 | cup | rifle | compilation |
| .308 Winchester | 62000 | psi | rifle | compilation |
| .222 Remington | 50000 | psi | rifle | compilation |
| .308 Winchester (Saboted) | 52000 | psi | rifle | compilation |
| .222 Rem Mag | 50000 | cup | rifle | compilation |
| .32 Win Special | 42000 | psi | rifle | compilation |
| .223 Remington | 55000 | psi | rifle | compilation |

_Showing 25 of 114 rows. For the complete set use the CSV or the JSON._
