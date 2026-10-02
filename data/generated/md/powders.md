<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  powders
  Source:   data/seeds/powders
  Manifest: data/schemas/powders.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# powders

> **Generated file - do not edit.** Built from
> `data/seeds/powders` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 169
- **Source files:** data/seeds/powders
- **Column contract:** `data/schemas/powders.yaml`
- **Populated:** ~72% of cells (a blank means "not known yet", not "zero")

## Coverage by manufacturer

| Manufacturer | Rows |
|---|---|
| `imr` | 38 |
| `hodgdon` | 35 |
| `vihtavuori` | 27 |
| `alliant` | 25 |
| `accurate` | 19 |
| `winchester` | 13 |
| `ramshot` | 12 |

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `manufacturer` | string | yes | Brand name as the maker markets it, e.g. "Hodgdon", "IMR". |
| `manufacturer_slug` | string | yes | Lowercase slug. Also the filename. All six powder brands referenced by these CSVs (accurate, alliant, hodgdon, imr, ramshot, vihtavuori) are present in manufacturers.csv, so all 169 rows resolve to a maker. That was not true until 2026-10-01 - see the references block below. |
| `manufacturer_website` | string | no | Maker's site. Present on most rows. |
| `product_name` | string | yes | The powder designation, e.g. "H335", "N140", "VLR". This is the key a user searches for and the key the component finder hands to a retailer's search box. Powders have no SKU, so this field IS the lookup key. |
| `product_line` | string | no | Series the powder belongs to, e.g. "N100 series", "Hodgdon rifle". Used for grouping in the UI. Note several brands are the same company: Hodgdon owns IMR, Winchester, Accurate and Ramshot. |
| `burn_rate_class` | string (4 values) | no | Drives the barrel-scaling exponent in the trajectory model. Filled ONLY where the manufacturer's own wording maps cleanly onto these four values. Splitting "medium" from "slow" rifle powder without a published chart would be a guess, so it is left blank rather than invented. See the accuracy doctrine in data/incoming/powders.md. |
| `relative_burn_rate_position` | integer | no | Position on a manufacturer's burn-rate chart, 1 = fastest. Present for 22 of 27 rows in the curated set; the values live in data/seeds/powder_burn_rate_positions.csv. NOT COMPARABLE ACROSS BRANDS - position 7 in the Vihtavuori chart says nothing about Hodgdon 7. Never sort all powders into one global burn-rate number. |
| `geometry` | string | no | Single-base / double-base / triple-base. Empty on every row today. Useful for load-density and pressure-modder work, and the loader already infers is_double_base from this text when present. |
| `notes` | string | no | Free prose. This is where the maker's own wording is preserved, because it is often the only evidence for a classification decision. May contain commas, so it must stay quoted in the CSV. |
| `source_url` | string | yes | Where this row was read. MANDATORY - the loader refuses a powder row without one. Provenance is the safety mechanism for load-adjacent data, not decoration. |

## Sample rows (first 25 of 169)

| `manufacturer` | `manufacturer_slug` | `product_name` | `burn_rate_class` | `source_url` |
|---|---|---|---|---|
| Accurate | accurate | Accurate No.2 | pistol | https://shop.hodgdon.com/accurate-no-2/ |
| Accurate | accurate | Accurate No.5 | pistol | https://shop.hodgdon.com/accurate-no-5/ |
| Accurate | accurate | Accurate No.7 | pistol | https://shop.hodgdon.com/accurate-no-7/ |
| Accurate | accurate | Accurate No.9 | pistol | https://shop.hodgdon.com/accurate-no-9/ |
| Accurate | accurate | Accurate 11FS | pistol | https://shop.hodgdon.com/accurate-11fs/ |
| Accurate | accurate | Accurate Nitro 100 New Formulation | pistol | https://shop.hodgdon.com/nitro-100-new-formulation/ |
| Accurate | accurate | Accurate TCM | pistol | https://shop.hodgdon.com/accurate-tcm/ |
| Accurate | accurate | Accurate 1680 | _(blank)_ | https://shop.hodgdon.com/accurate-1680/ |
| Accurate | accurate | Accurate 2200 | _(blank)_ | https://shop.hodgdon.com/accurate-2200/ |
| Accurate | accurate | Accurate 2230 | _(blank)_ | https://shop.hodgdon.com/accurate-2230/ |
| Accurate | accurate | Accurate 2460 | _(blank)_ | https://shop.hodgdon.com/accurate-2460/ |
| Accurate | accurate | Accurate 2495 | _(blank)_ | https://shop.hodgdon.com/accurate-2495/ |
| Accurate | accurate | Accurate 2520 | _(blank)_ | https://shop.hodgdon.com/accurate-2520/ |
| Accurate | accurate | Accurate 4064 | _(blank)_ | https://shop.hodgdon.com/accurate-4064/ |
| Accurate | accurate | Accurate 4350 | _(blank)_ | https://shop.hodgdon.com/accurate-4350/ |
| Accurate | accurate | Accurate 5744 | _(blank)_ | https://shop.hodgdon.com/accurate-5744/ |
| Accurate | accurate | Accurate MAGPRO | _(blank)_ | https://shop.hodgdon.com/accurate-magpro/ |
| Accurate | accurate | Accurate LT-32 | _(blank)_ | https://shop.hodgdon.com/accurate-lt-32/ |
| Accurate | accurate | Accurate High Country | _(blank)_ | https://shop.hodgdon.com/accurate-high-country/ |
| Alliant | alliant | AR-Comp | _(blank)_ | https://www.alliantpowder.com/products/powder/ar_comp.aspx |
| Alliant | alliant | Power Pro 1200-R | _(blank)_ | https://www.alliantpowder.com/products/powder/power_pro_1200 |
| Alliant | alliant | Power Pro 2000-MR | rifle_medium | https://www.alliantpowder.com/products/powder/power_pro_2000 |
| Alliant | alliant | Power Pro 4000-MR | rifle_slow | https://www.alliantpowder.com/products/powder/power_pro_4000 |
| Alliant | alliant | Power Pro Varmint | _(blank)_ | https://www.alliantpowder.com/products/powder/power_pro_varm |
| Alliant | alliant | Reloder 7 | _(blank)_ | https://www.alliantpowder.com/products/powder/reloder7.aspx |

_Showing 25 of 169 rows. For the complete set use the CSV or the JSON._
