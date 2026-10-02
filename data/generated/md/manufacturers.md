<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  manufacturers
  Source:   data/seeds/manufacturers.csv
  Manifest: data/schemas/manufacturers.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# manufacturers

> **Generated file - do not edit.** Built from
> `data/seeds/manufacturers.csv` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 58
- **Source files:** data/seeds/manufacturers.csv
- **Column contract:** `data/schemas/manufacturers.yaml`
- **Populated:** ~100% of cells (a blank means "not known yet", not "zero")

## Coverage by manufacturer

| Manufacturer | Rows |
|---|---|
| `sierra` | 1 |
| `hornady` | 1 |
| `berger` | 1 |
| `nosler` | 1 |
| `barnes` | 1 |
| `lapua` | 1 |
| `norma` | 1 |
| `speer` | 1 |
| `winchester` | 1 |
| `remington` | 1 |
| `federal` | 1 |
| `swift` | 1 |
| `cutting-edge` | 1 |
| `hammer` | 1 |
| `lehigh-defense` | 1 |
| `maker` | 1 |
| `peregrine` | 1 |
| `warner` | 1 |
| `missouri-bullet` | 1 |
| `bayou` | 1 |
| `blue-bullets` | 1 |
| `acme` | 1 |
| `bear-creek` | 1 |
| `berries` | 1 |
| `xtreme` | 1 |
| `rainier` | 1 |
| `rmr` | 1 |
| `precision-delta` | 1 |
| `montana-gold` | 1 |
| `geco` | 1 |
| `rws` | 1 |
| `fiocchi` | 1 |
| `sellier-bellot` | 1 |
| `prvi-partizan` | 1 |
| `starline` | 1 |
| `woodleigh` | 1 |
| `hodgdon` | 1 |
| `imr` | 1 |
| `accurate` | 1 |
| `ramshot` | 1 |
| `alliant` | 1 |
| `vihtavuori` | 1 |
| `midwayusa` | 1 |
| `brownells` | 1 |
| `natchez` | 1 |
| `psa` | 1 |
| `targetsports` | 1 |
| `powdervalley` | 1 |
| `opticsplanet` | 1 |
| `ammoseek` | 1 |
| `basspro` | 1 |
| `cabelas` | 1 |
| `bulkcheapammo` | 1 |
| `brittersweet` | 1 |
| `tiktak` | 1 |
| `gunpoint` | 1 |
| `ammounlimited` | 1 |
| `primaryarms` | 1 |

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `slug` | string | yes | The key everything else joins on. MUST be lowercase: SQLite string comparison is case-sensitive. Also the filename used by the per-manufacturer component files in data/seeds/<type>/. |
| `name` | string | yes | Display name, e.g. "Hodgdon Powder Company". |
| `kinds` | string | yes | SEMICOLON-DELIMITED LIST - this is a many-to-many relationship flattened into one cell, and the loader splits it into the manufacturer_kinds table. Permitted: ammo, bullet, powder, primer, brass, shotshell, retailer, reloading_equipment, wads. A maker that is both an ammo maker and a brass maker is ONE row with several kinds, not two companies. RESOLVED 2026-10-01: six powder brands (accurate, alliant, hodgdon, imr, ramshot, vihtavuori) were referenced by the powder CSVs but missing here, orphaning 98 of 169 powder rows. All six now exist and cross-dataset references resolve. |
| `website` | string | yes | Maker's site. Required - a company with no site is not useful to a user looking for a source. |
| `country` | string | no | Country of manufacture, not of the brand owner. |
| `region` | string (6 values) | no | Coarse region, used to group the directory in the UI. |
| `status` | string (4 values) | no | All 36 rows are currently `active`. Several brands are owned by larger groups (Hodgdon owns IMR, Winchester, Accurate and Ramshot; Vista Outdoor owns Hornady, Federal and Remington), but that is recorded in `notes` - `acquired` is for a brand that no longer trades under its own name. |
| `notes` | string | no | Free prose, deliberately well-researched: brand ownership, product lines, and the reason a brand is or is not in scope. This is real editorial value, not filler, and it is the part most likely to go stale. |
| `source_url` | string | no | Where the company details were confirmed. |

## Sample rows (first 25 of 58)

| `slug` | `name` | `kinds` | `website` | `region` | `status` |
|---|---|---|---|---|---|
| sierra | Sierra Bullets | bullet | https://www.sierrabullets.com | north_america | active |
| hornady | Hornady | ammo;bullet;brass | https://www.hornady.com | north_america | active |
| berger | Berger Bullets | bullet | https://bergerbullets.com | north_america | active |
| nosler | Nosler | ammo;bullet;brass | https://www.nosler.com | north_america | active |
| barnes | Barnes Bullets | ammo;bullet | https://www.barnesbullets.com | north_america | active |
| lapua | Lapua | ammo;brass;bullet | https://www.lapua.com | europe | active |
| norma | Norma | ammo;brass;bullet;powder | https://www.norma-ammunition.com | europe | active |
| speer | Speer | ammo;bullet | https://www.speer.com | north_america | active |
| winchester | Winchester | ammo;brass;primer;powder | https://www.winchester.com | north_america | active |
| remington | Remington | ammo;brass;primer | https://www.remingtonammunition.com | north_america | active |
| federal | Federal | ammo;brass;primer;bullet | https://www.federalpremium.com | north_america | active |
| swift | Swift Bullets | bullet | https://www.swiftbullets.com | north_america | active |
| cutting-edge | Cutting Edge Bullets | bullet | https://cuttingedgebullets.com | north_america | active |
| hammer | Hammer Bullets | bullet | https://hammerbullets.com | north_america | active |
| lehigh-defense | Lehigh Defense | bullet | https://www.lehighdefense.com | north_america | active |
| maker | Maker Bullets | bullet | https://makerbullets.com | north_america | active |
| peregrine | Peregrine Monolithics | bullet | https://peregrinemonolithics.com | north_america | active |
| warner | Warner Tool Company | bullet | https://www.warnertool.com | north_america | active |
| missouri-bullet | Missouri Bullet Company | bullet | https://missouribullet.com | north_america | active |
| bayou | Bayou Bullets | bullet | https://bayoubullets.com | north_america | active |
| blue-bullets | Blue Bullets | bullet | https://bluebulletsusa.com | north_america | active |
| acme | Acme Bullet Company | bullet | https://acmebullet.com | north_america | active |
| bear-creek | Bear Creek Supply | bullet | https://www.bearcreeksupply.com | north_america | active |
| berries | Berry's Bullets | bullet | https://www.berrysbullets.com | north_america | active |
| xtreme | X-Treme Bullets | bullet | https://xtremebullets.com | north_america | active |

_Showing 25 of 58 rows. For the complete set use the CSV or the JSON._
