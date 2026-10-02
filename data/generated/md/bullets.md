<!--
  GENERATED FILE - DO NOT EDIT.

  Built from the CSVs by scripts/data/build-data.mjs. Any edit here is lost on the
  next run, silently. To change the data, edit the CSV under "source" below,
  then run:  npm run data:build

  Dataset:  bullets
  Source:   data/seeds/bullets
  Manifest: data/schemas/bullets.yaml

  Use this file for READING. For application code use the .json, which has real
  types. For the complete record use the CSV, which is the database.
-->

# bullets

> **Generated file - do not edit.** Built from
> `data/seeds/bullets` by `npm run data:build`.
> The CSV is the database. Edit that, not this.

## At a glance

- **Rows:** 120
- **Source files:** data/seeds/bullets
- **Column contract:** `data/schemas/bullets.yaml`
- **Populated:** ~69% of cells (a blank means "not known yet", not "zero")

## Coverage by manufacturer

| Manufacturer | Rows |
|---|---|
| `berger` | 109 |
| `hornady` | 7 |
| `sierra` | 4 |

## Columns

| Column | Type | Req | Meaning |
|---|---|---|---|
| `manufacturer` | string | yes | Display name of the maker, e.g. "Hornady". |
| `manufacturer_slug` | string | yes | Lowercase-hyphenated key into manufacturers.csv. MUST be all lowercase: SQLite string comparison is case-sensitive, so "Hornady" does not match "hornady" and the row is orphaned. This exact bug cost 3 rows. |
| `manufacturer_website` | string | yes | Maker's own site. Provenance for the row. |
| `product_line` | string | yes | The maker's product family - "MatchKing", "VLD Target", "ELD-X". This is where a DESIGN name belongs. "Very low drift" and "Hybrid" are designs, not tip types, and belong in this column rather than in tip_type. |
| `bullet_name` | string | yes | Specific designation. Currently duplicates product_line on every row, which is redundant - either drop one or make this the part-level name. |
| `part_number` | string | yes | The MAKER's own item number (Hornady 65147, Sierra 2269). String, not number, so leading zeros survive. This is the single most valuable field for the component finder, because makers reuse their part number across retailers - it is the same at Brownells, Midway and Natchez. |
| `caliber` | string | no | CALIBER DESIGNATION, e.g. 0.308 or 0.264. Not a measured diameter. A 6.5mm bullet measures 0.256 in, not 0.264. Do not use this for drag calculations; see bullet_dia_in. |
| `diameter_in` | number (in) | yes | WARNING: this currently holds the caliber designation, not a measurement, so it is semantically wrong. It should be renamed caliber_designation and a real bullet_dia_in added. Until then, nothing may compute drag from this column. |
| `weight_gr` | number (gr) | yes | Projectile weight in grains. |
| `bc_g1` | number | no | STANDARDIZED G1 ballistic coefficient, always the 200-yard / Mach 2.25 basis unless bc_reference says otherwise. See migration 014 for why a bare BC is not comparable across manufacturers. The ceiling was raised from 1.0 to 2.0 on 2026-10-01, and that needs saying plainly because it weakens a real protection. A G1 above 1.0 IS impossible on the Mach 2.25 basis, which is exactly why the old ceiling was worth having - it catches a column that shifted during extraction, which is the failure mode that cost 7 of 11 bullet rows once already. But Berger publishes no basis at all, so its rows carry bc_reference='unspecified' and its 375 Cal 407 gr ELR Match Solid is published as G1 1.022. On an unstated, slower reference that is plausible; as a Mach 2.25 figure it would be impossible. Since a row's validity depends on a DIFFERENT column, a flat ceiling cannot express the rule and can only be either uselessly strict or uselessly loose. It is currently loose, and the real defence is elsewhere: every parser keys off the source's own column headers and throws on mismatch, and test-bullet-sources.mjs asserts G1 > G7 on every row. If you want the Mach 2.25 ceiling enforced properly it needs conditional validation keyed on bc_reference, which the manifest format does not support yet - that is the honest fix, not a wider number. |
| `bc_g7` | number | no | STANDARDIZED G7 coefficient, same basis as bc_g1. This is what modern long-range work uses, and it is missing on most rows - a real gap. |
| `bc_reference` | string (5 values) | no | Which basis bc_g1/bc_g7 use. Leave NULL when the source states nothing and the value is a plain 200-yard figure; use 'unspecified' when the source publishes SOME BC but never says at what speed, which leaves it uncomparable until someone resolves it. Hornady publishes three Mach columns and everyone else varies. Getting this wrong is the single most likely way for this table to produce a confident wrong answer. |
| `bc_g1_mach_2_25` | number | no | Mach 2.25 (2512 fps @ ICAO) G1. This is the standard basis, so it normally equals bc_g1. Held separately so the full published set survives even though the solver reads one number today. |
| `bc_g7_mach_2_25` | number | no | Mach 2.25 G7. Normally equals bc_g7. |
| `bc_g1_mach_2_0` | number | no | Mach 2.0 (2233 fps @ ICAO) G1, for mid-range where the bullet spends time below 2500 fps. Unused by the solver today; kept because it is an input a drag-coefficient solver needs. |
| `bc_g7_mach_2_0` | number | no | Mach 2.0 G7. |
| `bc_g1_mach_1_75` | number | no | Mach 1.75 (1954 fps @ ICAO) G1, for long range beyond ~600 yards where most of the flight happens after the bullet has slowed well below muzzle velocity. This is the figure that matters most for precision work at distance, and it is the one most often discarded. Keeping it is why the extra columns exist. |
| `bc_g7_mach_1_75` | number | no | Mach 1.75 G7. |
| `sectional_density` | number (lb/in^2) | no | SD = weight / (diameter^2). Useful for comparing bullets of different calibre and for loading decisions. |
| `required_twist_in` | number (in) | no | Manufacturer's recommended minimum rifling twist, stored as the DENOMINATOR of the twist rate: 1:10" is stored as 10, not 0.1. The column is in inches, so the denominator is the inch figure; storing the reciprocal would be a different physical quantity and would read as a 0.1" twist. The guard was raised from 8.0 to 30.0 on 2026-10-01. Berger publishes 111 bullets and 81 of them need a slower twist than 1:8" - 1:10", 1:12", 1:14", 1:19" all occur. The old ceiling was not a physical limit, it was a guess made when the column had no data in it at all, and it would have rejected 73% of the first real manufacturer ingested. 1:30" is about as slow as rifling goes, so the ceiling still catches a dropped digit. Note the sources are inconsistent about the inch mark (ASCII " and U+2033 double prime both appear); scripts/lib/bullet-sources.mjs accepts either rather than silently dropping rows over a glyph. |
| `construction` | string (10 values) | yes | How the projectile is built. Mirrors the SQL CHECK. |
| `base_type` | string (7 values) | no | Bullet base shape. NOT a tip type - a shifted column put "boat_tail" here and "polymer_tip" in tip_type, which rejected all 3 Hornady rows. |
| `tip_type` | string (11 values) | no | Terminal performance shape. This is the column most often filled with the wrong thing. It is NOT a design name: "very low drift" and "hybrid" are designs and belong in product_line. It is NOT a use case: "match" and "hunting" belong in use_case. Leave it BLANK rather than guess - a blank is a visible gap, a wrong value is a silent lie. |
| `use_case` | string (8 values) | no | What the bullet is for. |
| `source_url` | string | yes | Where this row's data was actually read. MANDATORY: a row without a source is refused by the loader. Provenance is the safety mechanism, not decoration. |
| `source_kind` | string (4 values) | no | Where the source sits on the authority scale. "community" must not appear in an official table; see data/schema/011_community_layer.sql. |

## Sample rows (first 25 of 120)

| `manufacturer` | `manufacturer_slug` | `manufacturer_website` | `product_line` | `bullet_name` | `part_number` | `diameter_in` |
|---|---|---|---|---|---|---|
| Berger | berger | https://www.bergerbullets.com | FB Varmint | FB Varmint | 17308 | 0.172 |
| Berger | berger | https://www.bergerbullets.com | FB Varmint | FB Varmint | 20303 | 0.204 |
| Berger | berger | https://www.bergerbullets.com | BT Varmint | BT Varmint | 20304 | 0.204 |
| Berger | berger | https://www.bergerbullets.com | FB Varmint | FB Varmint | 22303 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | FB Target | FB Target | 22408 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | FB Varmint | FB Varmint | 22309 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | FB Target | FB Target | 22410 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | FB Varmint | FB Varmint | 22311 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | FB Varmint | FB Varmint | 22312 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | VLD Target | VLD Target | 22418 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | BT Target | BT Target | 22420 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | VLD Target | VLD Target | 22421 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | OTM Tactical | OTM Tactical | 22101 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | VLD Target | VLD Target | 22422 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | FULLBORE Target | FULLBORE Target | 22427 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | LR Hybrid Target | LR Hybrid Target | 22485 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | VLD Target | VLD Target | 22423 | 0.224 |
| Berger | berger | https://www.bergerbullets.com | BT Target | BT Target | 24408 | 0.243 |
| Berger | berger | https://www.bergerbullets.com | FB Target | FB Target | 24411 | 0.243 |
| Berger | berger | https://www.bergerbullets.com | FB Varmint | FB Varmint | 24321 | 0.243 |
| Berger | berger | https://www.bergerbullets.com | VLD Hunting | VLD Hunting | 24524 | 0.243 |
| Berger | berger | https://www.bergerbullets.com | High BC FB Varmint | High BC FB Varmint | 24323 | 0.243 |
| Berger | berger | https://www.bergerbullets.com | BT Target | BT Target | 24425 | 0.243 |
| Berger | berger | https://www.bergerbullets.com | Classic Hunter | Classic Hunter | 24570 | 0.243 |
| Berger | berger | https://www.bergerbullets.com | VLD Hunting | VLD Hunting | 24527 | 0.243 |

_Showing 25 of 120 rows. For the complete set use the CSV or the JSON._
