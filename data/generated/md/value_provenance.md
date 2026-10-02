<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  value_provenance
  Source:   data/seeds/value_provenance.csv
  Manifest: data/schemas/value_provenance.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->
# value_provenance

> **Generated file - do not edit.** Built from
> `data/seeds/value_provenance.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 4
- **Source files:** data/seeds/value_provenance.csv
- **Column contract:** `data/schemas/value_provenance.yaml`
- **Populated:** ~58% of cells (a blank means "not known yet", not "zero")

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `entity_type` | string (4 values) | yes | Which kind of record this row is about. |
| `entity_slug` | string | yes | The record's slug, e.g. "308-win". |
| `field_name` | string | yes | The single column this row explains. One row per field: provenance for a whole record is not provenance for a number. |
| `tier` | string (4 values) | yes | How the value was arrived at. Required, because a value with no stated tier has no provenance and this row is then worse than useless - it looks like an audit trail while providing none. |
| `value` | number | no | The numeric value being explained, when it is a number. |
| `text_value` | string | no | The value being explained, when it is text. |
| `unit` | string | no | Unit of `value`. Required whenever value is present. |
| `source_id` | integer | no | The `sources` row for the document read. Optional and often empty: the sources table currently holds only load-data manuals, so a pressure figure read from SAAMI Z299.4 has no row to point at yet. That is a known gap, not a reason to leave the tier unstated. |
| `method` | string | no | How the number was computed, spelled out. On the .308 row this records that 62 ksi x 1000 = 62,000 psi exactly and that the source's `ksi_rounded_up_to_1000psi` note makes the rounding direction known rather than assumed. |
| `reasoning` | string | no | Why this tier and not a stronger one. May contain commas; keep quoted. A `derived` value with no reasoning is indistinguishable from a `published` one at read time. |
| `source_url` | string | no | Direct link to the cited material. |
| `safety_risk` | string | no | What could go wrong if this value is wrong, e.g. an over-pressure figure producing an overloaded case. Free text today; a controlled vocabulary would help once there are enough rows to justify one. |
| `corroboration` | string | no | Independent source that agrees. Agreement between compilations is evidence, not a standard - see tier. |
| `reviewed_by` | string | no | Who reviewed it. Empty means unreviewed. |
| `reviewed_on` | date | no | When it was reviewed. Empty means unreviewed. |
| `notes` | string | no | Free prose. May contain commas; keep quoted. Where the explicit open task sits - on the .308 row, the note names the PDF to open and the page to cite before the tier may be promoted. |

## Sample rows

| `entity_type` | `entity_slug` | `field_name` | `tier` | `value` |
|---|---|---|---|---|
| cartridge | 308-win | saami_max_psi | derived | 62000 |
| cartridge | 270 | saami_max_psi | derived | 65000 |
| cartridge | 7mm-08 | saami_max_psi | estimated | 61000 |
| cartridge | 308-win | bullet_dia_in | estimated | 0.308 |
