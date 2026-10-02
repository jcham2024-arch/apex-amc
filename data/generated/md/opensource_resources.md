<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  opensource_resources
  Source:   data/seeds/opensource_resources.csv
  Manifest: data/schemas/opensource_resources.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# opensource_resources

> **Generated file - do not edit.** Built from
> `data/seeds/opensource_resources.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 7
- **Source files:** data/seeds/opensource_resources.csv
- **Column contract:** `data/schemas/opensource_resources.yaml`
- **Populated:** ~97% of cells (a blank means "not known yet", not "zero")

## Coverage by manufacturer

| Manufacturer | Rows |
|---|---|
| `py-ballisticcalc` | 1 |
| `js-ballistics` | 1 |
| `ammolytics-projectiles` | 1 |
| `ammolytics-cartridges` | 1 |
| `grt-databases` | 1 |
| `saami-standards` | 1 |
| `saami-drawings` | 1 |

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `slug` | string | yes | Lowercase key, matching the slug convention used across the project. |
| `name` | string | yes | The project's own display name. |
| `category` | string (8 values) | yes | What KIND of thing it is, which determines what it could replace. |
| `description` | string | yes | What it is, in a sentence or two. |
| `licence` | string | yes | Exact licence identifier as stated by the project, e.g. MIT, ISC, LGPL-3.0, CC0-1.0. Never normalised - the exact string is the evidence. |
| `licence_verified` | boolean | yes | True only if the licence was read from the project's own page. When false, adopt must be no. |
| `url` | string | yes | Canonical project URL. Must resolve. |
| `data_sources` | string | no | Where the project's own data came from, when it says. This is the column that decides whether it is evidence or just another rumour. |
| `maintenance` | string (4 values) | yes | How alive it is. An abandoned dataset is still usable if it is static physical data; an abandoned load table is a safety problem. |
| `usefulness` | string | yes | What we would actually use it for, and what it does NOT give us. Both halves, because a resource that looks useful for the wrong reason wastes more time than one that looks useless. |
| `adopt` | boolean | yes | Whether we may depend on it. False when the licence is unverified, the licence forbids it, or maintenance makes it a risk. |
| `adopt_reason` | string | yes | Why adopt is yes or no. The part a reviewer argues with. |
| `covers_gap` | string | no | Which of our documented gaps this would close, if any. |
| `warnings` | string | no | The maintainer's own caveat, where one exists. A permissive licence with a published warning is not the same as a permissive licence without one. |

## Sample rows

| `slug` | `name` | `category` | `description` | `licence` | `licence_verified` | `url` |
|---|---|---|---|---|---|---|
| py-ballisticcalc | py-ballisticcalc | ballistics_engine | Ballistic solver library for small arms: point-mass 3-DoF pl | LGPL-3.0 | true | https://github.com/o-murphy/py-ballisticcalc |
| js-ballistics | js-ballistics | ballistics_engine | JavaScript/TypeScript ballistics library powered by a C++ co | ISC | true | https://github.com/o-murphy/js-ballistics |
| ammolytics-projectiles | ammolytics/projectiles | projectile_data | Open dataset of ammunition projectile (bullet) information,  | MIT | true | https://github.com/ammolytics/projectiles |
| ammolytics-cartridges | ammolytics/cartridges | cartridge_data | Open dataset of cartridge information drawn from SAAMI, CIP  | MIT | true | https://github.com/ammolytics/cartridges |
| grt-databases | zen/grt_databases | reload_data | Calibers, projectiles, powder models and user-contributed lo | CC0-1.0 | true | https://github.com/zen/grt_databases |
| saami-standards | SAAMI Z299 series | standards_body | ANSI American National Standards for cartridge and chamber d | proprietary | true | https://saami.org/technical-information/ansi-saami-standards |
| saami-drawings | SAAMI new and revised cartridge and chamber drawings | standards_body | Free PDF drawings for newly accepted SAAMI cartridge and cha | proprietary | true | https://saami.org/technical-information/cartridge-chamber-dr |
