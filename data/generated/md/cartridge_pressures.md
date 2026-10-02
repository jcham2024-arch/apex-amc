<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  cartridge_pressures
  Source:   data/seeds/cartridge_pressures.csv
  Manifest: data/schemas/cartridge_pressures.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# cartridge_pressures

> **Generated file - do not edit.** Built from
> `data/seeds/cartridge_pressures.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 231
- **Source files:** data/seeds/cartridge_pressures.csv
- **Column contract:** `data/schemas/cartridge_pressures.yaml`
- **Populated:** ~55% of cells (a blank means "not known yet", not "zero")

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `cartridge_name` | string | yes | Cartridge designation exactly as the compiler prints it. Joined to cartridge_specs.slug via the loader's name index, so a spelling change orphans the row rather than silently creating a new cartridge. |
| `saami_piezo_ksi` | number | no | SAAMI maximum piezo pressure, ksi. Blank where the cartridge is not SAAMI-listed. |
| `cip_piezo_ksi` | number | no | CIP maximum piezo pressure, ksi. Blank where not CIP-listed. |
| `saami_cup` | number | no | SAAMI maximum pressure in cup of copper (c.u.p.). Blank where not SAAMI-listed. |
| `cip_cup` | number | no | CIP maximum pressure in cup. Blank where not CIP-listed. |
| `other` | string | no | Free-text non-tabletted value for a handful of cartridges, e.g. a European proof figure in bar. Kept as text rather than parsed, because the units and standards are not consistent enough to coerce. |
| `footnote` | string | no | Marker for a note in the publisher's own table. May contain commas; keep quoted. |
| `unit_note` | string | no | Where the source's unit differs from the column's stated unit. The ksi columns in particular were rounded up by the compiler, so a row carrying a unit_note must not be read as a precise figure. |

## Sample rows (first 25 of 231)

| `cartridge_name` | `saami_piezo_ksi` | `cip_piezo_ksi` | `saami_cup` | `cip_cup` |
|---|---|---|---|---|
| .17 Mach 2 | 24 | 26 | _(blank)_ | _(blank)_ |
| .17 HMR | 26 | 26 | _(blank)_ | _(blank)_ |
| .17 WSM | 33 | 32 | _(blank)_ | _(blank)_ |
| .17 Hornet | 50 | _(blank)_ | _(blank)_ | _(blank)_ |
| .17 Mach 4 | _(blank)_ | 60 | _(blank)_ | 52 |
| .17 Fireball | 55 | _(blank)_ | _(blank)_ | _(blank)_ |
| .17 Rem | 63 | 62 | 52 | 53 |
| .204 Ruger | 58 | 59 | _(blank)_ | _(blank)_ |
| .22 Short | 21 | 15 | _(blank)_ | _(blank)_ |
| .22 Long | 24 | _(blank)_ | _(blank)_ | _(blank)_ |
| .22 LR | 24 | 25 | _(blank)_ | _(blank)_ |
| .22 WR | 20 | _(blank)_ | _(blank)_ | _(blank)_ |
| .22 WMRF | 24 | 23 | _(blank)_ | _(blank)_ |
| 5.6x35R | _(blank)_ | 39 | _(blank)_ | 35 |
| .22 Hornet | 49 | 44 | 43 | 41 |
| .218 Bee | _(blank)_ | 46 | 40 | 41 |
| .22 Rem Jet | _(blank)_ | 37 | 40 | _(blank)_ |
| .221 Rem | _(blank)_ | 46 | 52 | _(blank)_ |
| 5.6x50R | _(blank)_ | 49 | _(blank)_ | 44 |
| .222 | 50 | 54 | 46 | 46 |
| .222 Mag. | _(blank)_ | 59 | 50 | 51 |
| .223 | 55 | 62 | 52 | 54 |
| .219 Zip. | _(blank)_ | 41 | _(blank)_ | 37 |
| .225 Win. | _(blank)_ | 57 | 50 | 49 |
| .22-250 | 65 | 59 | 53 | 51 |

_Showing 25 of 231 rows. For the complete set use the CSV or the JSON._
