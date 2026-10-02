<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  sourcing_searches
  Source:   data/seeds/sourcing_searches.csv
  Manifest: data/schemas/sourcing_searches.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# sourcing_searches

> **Generated file - do not edit.** Built from
> `data/seeds/sourcing_searches.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 12
- **Source files:** data/seeds/sourcing_searches.csv
- **Column contract:** `data/schemas/sourcing_searches.yaml`
- **Populated:** ~79% of cells (a blank means "not known yet", not "zero")

## Coverage by manufacturer

| Manufacturer | Rows |
|---|---|
| `sierra-mk-169gr-hpbt` | 1 |
| `sierra-mk-177gr-hpbt` | 1 |
| `sierra-mk-230gr-hpbt` | 1 |
| `hornady-eld-x-143` | 1 |
| `hornady-atip-175` | 1 |
| `hornady-interlock-180` | 1 |
| `berger-vld-140-264` | 1 |
| `hodgdon-h335` | 1 |
| `hornady-eldvt-22-62` | 1 |
| `hornady-eldvt-6mm-80` | 1 |
| `hornady-eldvt-65-100` | 1 |
| `hornady-eldvt-30-174` | 1 |

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `slug` | string | yes | Stable id for this search, e.g. "sierra-mk-169gr-hpbt". |
| `entity_type` | string (5 values) | no | What kind of thing is being searched for. Blank today for the same reason entity_slug is - it is derivable from category and the pair should be filled in together. |
| `entity_slug` | string | no | Our own id for the thing, once one exists. Optional because it is blank across the file today; when filled, it must resolve in the dataset named by entity_type. |
| `display_name` | string | yes | How we show it to a user. |
| `search_terms` | string | yes | The query string to hand a retailer. Deliberately shorter than display_name: retailer search boxes do better with fewer, better tokens than with our full internal designation. |
| `match_quality` | string (3 values) | yes | How well the search is expected to land. - exact_sku: the part number is reused verbatim by retailers, so an exact search should hit. - model: a product line with several variants, so results need filtering. Never silently upgraded to a better value - a user shown a fuzzy match as an exact one will buy the wrong thing. |
| `manufacturer_part_number` | string | no | The manufacturer's own part number. A STRING, never an integer: these carry leading zeros ("065147") and coercing them destroys the exact-match key. |
| `category` | string (2 values) | yes | Component class, used to pick which retailer set to search. |
| `notes` | string | no | Free prose. May contain commas; keep quoted. Where the reasoning for a blank or a match_quality choice is recorded. |
| `source_url` | string | no | The manufacturer's page this designation was read from. |

## Sample rows

| `slug` | `entity_type` | `display_name` | `search_terms` | `match_quality` | `category` |
|---|---|---|---|---|---|
| sierra-mk-169gr-hpbt | _(blank)_ | Sierra MatchKing 169gr HPBT | MatchKing 169 HPBT | model | bullet |
| sierra-mk-177gr-hpbt | _(blank)_ | Sierra MatchKing 177gr HPBT | MatchKing 177 HPBT | model | bullet |
| sierra-mk-230gr-hpbt | _(blank)_ | Sierra MatchKing 230gr HPBT | MatchKing 230 HPBT | model | bullet |
| hornady-eld-x-143 | _(blank)_ | Hornady ELD-X 143gr | ELD-X 143 | model | bullet |
| hornady-atip-175 | _(blank)_ | Hornady A-Tip Match 175gr | A-Tip 175 | model | bullet |
| hornady-interlock-180 | _(blank)_ | Hornady InterLock 180gr | InterLock 180 | model | bullet |
| berger-vld-140-264 | _(blank)_ | Berger VLD Target 140gr | VLD Target 140 | model | bullet |
| hodgdon-h335 | _(blank)_ | Hodgdon H335 rifle powder | H335 | model | powder |
| hornady-eldvt-22-62 | _(blank)_ | Hornady ELD-VT 62gr | .22 62gr ELD-VT | exact_sku | bullet |
| hornady-eldvt-6mm-80 | _(blank)_ | Hornady ELD-VT 6mm 80gr | 6mm 80gr ELD-VT | exact_sku | bullet |
| hornady-eldvt-65-100 | _(blank)_ | Hornady ELD-VT 6.5mm 100gr | 6.5mm 100gr ELD-VT | exact_sku | bullet |
| hornady-eldvt-30-174 | _(blank)_ | Hornady ELD-VT 30 cal 174gr | .30 174gr ELD-VT | exact_sku | bullet |
