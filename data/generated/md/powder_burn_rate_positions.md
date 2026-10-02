<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  powder_burn_rate_positions
  Source:   data/seeds/powder_burn_rate_positions.csv
  Manifest: data/schemas/powder_burn_rate_positions.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->
# powder_burn_rate_positions

> **Generated file - do not edit.** Built from
> `data/seeds/powder_burn_rate_positions.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 22
- **Source files:** data/seeds/powder_burn_rate_positions.csv
- **Column contract:** `data/schemas/powder_burn_rate_positions.yaml`
- **Populated:** ~100% of cells (a blank means "not known yet", not "zero")

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `chart_slug` | string | yes | Which published chart this position comes from. One chart per manufacturer currently, but the column is a slug rather than a brand name so a second chart for the same brand (different product line, or a reissued edition) can be added without merging two scales into one. |
| `brand` | string | yes | The manufacturer who published the chart. Redundant with chart_slug on purpose - the chart table is authoritative for this and the loader checks the two agree. |
| `position` | integer | yes | Rank on that chart, 1 = fastest burning. MEANINGLESS ACROSS BRANDS. This is an ordinal rank within one manufacturer's ordering, not a measurement. |
| `column_total` | integer | yes | How many powders are on the chart, so a position can be read as a percentile within this chart. Never render "position 7 of 40" next to another brand's "position 7 of 22" without saying they are different scales. |
| `powder_name_as_published` | string | yes | The designation exactly as the chart spells it. Matched to powders.product_name by the loader; a row whose name has no matching powder is reported and skipped rather than creating a phantom product. |

## Sample rows

| `chart_slug` | `brand` | `position` | `column_total` | `powder_name_as_published` |
|---|---|---|---|---|
| vihtavuori-burning-rate-chart | Vihtavuori | 1 | 22 | N310 |
| vihtavuori-burning-rate-chart | Vihtavuori | 2 | 22 | N320 |
| vihtavuori-burning-rate-chart | Vihtavuori | 3 | 22 | N330 |
| vihtavuori-burning-rate-chart | Vihtavuori | 4 | 22 | N340 |
| vihtavuori-burning-rate-chart | Vihtavuori | 5 | 22 | N350 |
| vihtavuori-burning-rate-chart | Vihtavuori | 6 | 22 | 3N38 |
| vihtavuori-burning-rate-chart | Vihtavuori | 7 | 22 | N110 |
| vihtavuori-burning-rate-chart | Vihtavuori | 8 | 22 | N120 |
| vihtavuori-burning-rate-chart | Vihtavuori | 9 | 22 | N130 |
| vihtavuori-burning-rate-chart | Vihtavuori | 10 | 22 | N133 |
| vihtavuori-burning-rate-chart | Vihtavuori | 11 | 22 | N135 |
| vihtavuori-burning-rate-chart | Vihtavuori | 12 | 22 | N140 |
| vihtavuori-burning-rate-chart | Vihtavuori | 13 | 22 | N540 |
| vihtavuori-burning-rate-chart | Vihtavuori | 14 | 22 | N150 |
| vihtavuori-burning-rate-chart | Vihtavuori | 15 | 22 | N550 |
| vihtavuori-burning-rate-chart | Vihtavuori | 16 | 22 | N555 |
| vihtavuori-burning-rate-chart | Vihtavuori | 17 | 22 | N160 |
| vihtavuori-burning-rate-chart | Vihtavuori | 18 | 22 | N560 |
| vihtavuori-burning-rate-chart | Vihtavuori | 19 | 22 | N165 |
| vihtavuori-burning-rate-chart | Vihtavuori | 20 | 22 | N565 |
| vihtavuori-burning-rate-chart | Vihtavuori | 21 | 22 | N568 |
| vihtavuori-burning-rate-chart | Vihtavuori | 22 | 22 | 20N29 |
