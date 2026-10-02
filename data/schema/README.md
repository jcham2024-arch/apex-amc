# data/schema/

SQL migrations, applied in filename order against an empty SQLite database.
This is the shape the app and the Cloudflare D1 instance both run on.

There is no committed `.sqlite` file. The database is built by replaying these
files every time, so the migrations are the only definition of the schema - and
consequently a mistake here cannot be patched over later, only corrected at the
source. `npm run seed:check` does exactly that replay and reports the row count
it reaches.

## Ordering

| File | Defines |
|---|---|
| `001_ammo_catalog.sql` | Core cartridge catalog. |
| `002_sources.sql` | Source-document registry. |
| `003_seed_reference_data.sql` | Lookup tables. |
| `004_reload_recipes.sql` | Manufacturers and **bullets**. |
| `005_firearm_profiles.sql` | Firearm profiles. |
| `006_manufacturer_directory.sql` | Manufacturer directory and kinds. |
| `007_projectile_specs.sql` | Projectile specification detail. |
| `008_powder_specs.sql` | Powder detail. |
| `009_cartridge_specs.sql` | Cartridge dimensions and capacity. |
| `010_case_reuse.sql` | Case reuse / reloading relationships. |
| `011_community_layer.sql` | User and community tables. |
| `012_value_provenance.sql` | Which source backs which value. |
| `013_sourcing.sql` | Retailer sourcing tables. |
| `014_bc_basis.sql` | BC reference-basis columns and their validation. |
| `015_bullet_identity.sql` | `(manufacturer_id, part_number)` bullet identity. |
| `100_seed_full_snapshot.sql` | **Generated.** Published-document snapshot. |

Migrations are numbered by topic, not by date, and are append-only. A new
constraint goes in a new numbered file; it does not get folded into the one that
created the table.

## Two things that are not obvious

**`004_reload_recipes.sql` deliberately declares no UNIQUE constraint on
`bullets`.** The table originally carried `UNIQUE(manufacturer_id, name,
weight_grains)`, which cannot identify a bullet - eight of Berger's published
bullets share a name and weight and differ only by calibre. SQLite cannot drop a
constraint-backed index (only rebuild the table), and no `.sqlite` file is
committed, so the constraint is removed at its source rather than patched
afterwards. `015_bullet_identity.sql` records that reasoning.

**`100_seed_full_snapshot.sql` is generated** by `npm run data:snapshot` from
`data/published/manifest.json`. It is by far the largest file in this directory
(~3.1 MB) and is committed only so the schema is complete in one checkout; it
should never be hand-edited.