<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  sourcing_listings
  Source:   data/seeds/sourcing_listings.csv
  Manifest: data/schemas/sourcing_listings.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# sourcing_listings

> **Generated file - do not edit.** Built from
> `data/seeds/sourcing_listings.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 22
- **Source files:** data/seeds/sourcing_listings.csv
- **Column contract:** `data/schemas/sourcing_listings.yaml`
- **Populated:** ~29% of cells (a blank means "not known yet", not "zero")

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `search_slug` | string | yes | The search this listing answers. Resolves in sourcing_searches.slug. |
| `retailer_slug` | string | yes | The retailer, resolving on sourcing_retailers.manufacturer_slug - the same key, named for its role here because the subject of a listing is the retailer rather than the manufacturer of the item. 013_sourcing.sql exposes it to listings as m.slug AS retailer_slug. |
| `confidence` | string (3 values) | yes | How sure we are the retailer stocks it. - possible: the brand is carried; this specific item is unconfirmed. - likely: this product line is carried, but this variant is unconfirmed. - verified: a product page was retrieved and is cited. Every row is currently 'likely'. Nothing may be promoted to 'verified' without retailer_url and source_url. |
| `in_stock` | boolean | no | Whether it was in stock when last checked. BLANK on every row, which means "not observed" rather than "no". A blank must never be rendered as out of stock. |
| `stock_checked_on` | date | no | When stock was last observed. Blank while in_stock is blank. |
| `retailer_sku` | string | no | The retailer's own product code. Kept as a string, never a number - retailer SKUs carry leading zeros, and coercing 065147 to 65147 breaks the join. |
| `retailer_url` | string | no | The actual product page. This is what distinguishes 'verified' from 'likely', and it is blank on every row today. |
| `price_cents` | integer | no | Observed price in whole cents. Integer, not a float, because binary floats cannot represent a price exactly and a 0.01 drift in a displayed price is a support ticket. |
| `price_observed_on` | date | no | When the price was seen. A stale price is worse than no price. |
| `note` | string | no | Why this listing is at this confidence. May contain commas; keep quoted. This is where "core match-bullet line, variant unconfirmed" lives. |
| `source_kind` | string (4 values) | no | How the listing was obtained. Blank until a page is actually retrieved. |
| `source_url` | string | no | The page or feed that backs this listing. |
| `verified_by` | string | no | Who checked it. Empty on unverified rows by definition. |
| `verified_on` | date | no | When it was checked. Empty on unverified rows by definition. |

## Sample rows

| `search_slug` | `retailer_slug` | `confidence` | `source_kind` |
|---|---|---|---|
| sierra-mk-169gr-hpbt | midwayusa | likely | _(blank)_ |
| sierra-mk-169gr-hpbt | natchez | likely | _(blank)_ |
| sierra-mk-169gr-hpbt | targetsports | likely | _(blank)_ |
| sierra-mk-177gr-hpbt | midwayusa | likely | _(blank)_ |
| sierra-mk-177gr-hpbt | brownells | likely | _(blank)_ |
| sierra-mk-177gr-hpbt | natchez | likely | _(blank)_ |
| sierra-mk-177gr-hpbt | targetsports | likely | _(blank)_ |
| sierra-mk-230gr-hpbt | midwayusa | likely | _(blank)_ |
| sierra-mk-230gr-hpbt | natchez | likely | _(blank)_ |
| hornady-eld-x-143 | midwayusa | likely | _(blank)_ |
| hornady-eld-x-143 | brownells | likely | _(blank)_ |
| hornady-eld-x-143 | natchez | likely | _(blank)_ |
| hornady-eld-x-143 | targetsports | likely | _(blank)_ |
| hornady-atip-175 | midwayusa | likely | _(blank)_ |
| hornady-atip-175 | brownells | likely | _(blank)_ |
| hornady-interlock-180 | midwayusa | likely | _(blank)_ |
| hornady-interlock-180 | natchez | likely | _(blank)_ |
| berger-vld-140-264 | brownells | likely | _(blank)_ |
| berger-vld-140-264 | powdervalley | likely | _(blank)_ |
| hodgdon-h335 | midwayusa | likely | _(blank)_ |
| hodgdon-h335 | natchez | likely | _(blank)_ |
| hodgdon-h335 | powdervalley | likely | _(blank)_ |
