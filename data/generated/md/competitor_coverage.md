<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  competitor_coverage
  Source:   data/seeds/competitor_coverage.csv
  Manifest: data/schemas/competitor_coverage.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# competitor_coverage

> **Generated file - do not edit.** Built from
> `data/seeds/competitor_coverage.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 6
- **Source files:** data/seeds/competitor_coverage.csv
- **Column contract:** `data/schemas/competitor_coverage.yaml`
- **Populated:** ~100% of cells (a blank means "not known yet", not "zero")

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `observed_on` | string | yes | ISO date the comparison was made. Part of the evidence, not metadata. |
| `competitor` | string | yes | Which site the figure came from, so a number is never unattributed. |
| `category` | string (6 values) | yes | What is being counted. |
| `competitor_count` | integer | yes | Their published or observed figure for this category. |
| `our_count` | integer | yes | Ours at the same date. Recorded honestly including zero: "we have no store-bought catalogue yet" is the most useful row in this table, and it is exactly the row that would be missing if we only recorded gaps we had begun to close. |
| `source_url` | string | yes | Where the competitor figure was read. |
| `assessment` | string | yes | What it means for us, in one line. The part that stops this table becoming a scoreboard we stare at instead of work we do. |
| `next_step` | string | yes | The specific action this gap implies. A gap with no named next step is a complaint. |

## Sample rows

| `observed_on` | `competitor` | `category` | `competitor_count` | `our_count` | `source_url` | `assessment` |
|---|---|---|---|---|---|---|
| 2026-10-02 | AmmoSeek | retailers | 273 | 8 | https://ammoseek.com/ | We index roughly 3% of the retailers a price-comparison site |
| 2026-10-02 | AmmoSeek | products | 1239890 | 0 | https://ammoseek.com/ | This is the honest headline: we have NO store-bought ammunit |
| 2026-10-02 | AmmoSeek | reviews | 0 | 0 | https://ammoseek.com/ | They do not aggregate third-party product reviews, which is  |
| 2026-10-02 | AmmoSeek | price_history | 0 | 0 | https://ammoseek.com/ | Neither side exposes a public historical price series, so th |
| 2026-10-02 | AmmoSeek | components | 20 | 8 | https://ammoseek.com/ | Their component comparison covers 20+ retailers; we cover 8. |
| 2026-10-02 | AmmoSeek | cartridges | 50 | 318 | https://ammoseek.com/ | The one place we are ahead. We hold 318 cartridges against r |
