<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  sourcing_retailers
  Source:   data/seeds/sourcing_retailers.csv
  Manifest: data/schemas/sourcing_retailers.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# sourcing_retailers

> **Generated file - do not edit.** Built from
> `data/seeds/sourcing_retailers.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 8
- **Source files:** data/seeds/sourcing_retailers.csv
- **Column contract:** `data/schemas/sourcing_retailers.yaml`
- **Populated:** ~60% of cells (a blank means "not known yet", not "zero")

## Coverage by manufacturer

| Manufacturer | Rows |
|---|---|
| `midwayusa` | 1 |
| `brownells` | 1 |
| `natchez` | 1 |
| `psa` | 1 |
| `targetsports` | 1 |
| `powdervalley` | 1 |
| `opticsplanet` | 1 |
| `primaryarms` | 1 |

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `manufacturer_slug` | string | yes | The stocking retailer's own slug in manufacturers.csv. Named manufacturer_slug rather than slug because this file describes a retailer viewed as a supplier, and 013_sourcing.sql exposes it to listings as retailer_slug via m.slug. A column alias in SQL does not make it a different key, so this is the one a cross-dataset reference must target. |
| `source_type` | string (3 values) | yes | How the retailer sells. 'online' is a website; 'dealer' is a distributor or wholesaler rather than a shop a consumer visits. |
| `ships_domestically` | boolean | no | Whether it ships within its own country. |
| `ships_to_regions` | string | no | Comma-separated region codes it ships to, e.g. "US, CA, UK, EU". Free text rather than an enum because region boundaries differ between retailers and a retailer may ship to a country with no region code. |
| `hazmat_shipping` | boolean | no | Whether it ships flammable reloading components. Practically all do, but it is recorded because it is a real constraint on where a user can buy powder, and it is the kind of fact that should come from the retailer rather than be assumed. |
| `directions` | string | no | Street address, for a physical store. |
| `city` | string | no | City, for a physical store. |
| `region_code` | string | no | State or province code, for a physical store. |
| `affiliate_network` | string | no | Which affiliate programme the retailer belongs to. NULL for every retailer today - the project README names AvantLink but also warns that several programmes have since migrated, and an unconfirmed network that is filled in anyway produces dead links. |
| `network_store_id` | string | no | The retailer's id within the affiliate network. Blank while affiliate_network is. |
| `link_template` | string | no | Search URL with a {search} placeholder, e.g. https://www.midwayusa.com/search/?q={search}. Almost always the site's own search form, because per-SKU deep links have not been captured. A URL with no {search} is a defect: it would send every query to one page. |
| `feed_format` | string | no | Machine-readable product feed the retailer publishes, if any. NULL for all retailers today; recorded so that "no feed" is a known answer rather than an unchecked one. |
| `affiliate_status` | string (5 values) | no | State of the affiliate relationship. 'unknown' is an honest starting point, not a failure - it says nobody has checked, which is different from claiming there is no programme. |
| `scraping_status` | string (4 values) | no | Whether this retailer's terms permit automated product lookup. Always 'unknown' today and deliberately so: 'allowed' must never be assumed, and the answer decides whether the component finder may query it at all. |
| `notes` | string | no | Free prose, and the place where the reasoning behind a blank lives. May contain commas; keep quoted. |

## Sample rows

| `manufacturer_slug` | `source_type` | `affiliate_status` | `scraping_status` |
|---|---|---|---|
| midwayusa | online | unknown | unknown |
| brownells | online | unknown | unknown |
| natchez | online | unknown | unknown |
| psa | online | unknown | unknown |
| targetsports | online | unknown | unknown |
| powdervalley | online | unknown | unknown |
| opticsplanet | online | unknown | unknown |
| primaryarms | online | unknown | unknown |
