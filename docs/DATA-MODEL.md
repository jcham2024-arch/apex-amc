# Data Model

D1 (SQLite). Migrations apply in filename order. `npm run db:local` applies them
plus every seed CSV and writes `data/generated/apex.sqlite`; `npm run
schema:check` applies them to an in-memory SQLite and asserts CSV→table row
parity (1,666 rows across 24 tables).

Remote D1 is not yet provisioned — `wrangler.toml` still carries a placeholder
`database_id`. See `docs/DATA-TODO.md` §0.2c.

## Entity map

```
manufacturers ──┬──< products >──┬──< price_observations
                │                 ├──< reviews
                │                 └──< video_links
cartridges ─────┴──< products

sources ────────< recipes >──┬── bullets >──┐
                            └── powders ───┴──> manufacturers

firearm_profiles   (user-owned, standalone)
```

`manufacturers` is a single table with a `kind` discriminator rather than
one table per entity type. Federal is an ammo maker *and* a brass maker;
that is one row with two associations, not two companies.

## The two invariants

**1. Provenance is mandatory.** `recipes.source_id` is `NOT NULL` and
`ON DELETE RESTRICT`. Load data cannot exist without a published manual to
attribute it to, and a manual cannot be deleted while recipes reference it.
A wrong charge weight can injure someone, so "where did this number come
from" is not optional metadata — it is the safety mechanism.

**2. Prices are append-only.** `price_observations` is keyed
`(product_id, retailer_id, observed_on)` with a `UNIQUE` constraint. A new
price is a new row; existing rows are never updated. This gives price history
for free and means a bad scrape can be deleted without destroying the record.

## Carbonite vs D1

Both were considered for the "free database backend".

| | Cloudflare D1 | Supabase free |
|---|---|---|
| Storage | 5 GB | 500 MB |
| Reads | 5 M / day | generous |
| Idle behaviour | **never pauses** | **pauses after 1 week idle** |
| Hosting | Pages + Workers, one vendor | separate service |

D1 wins because it never pauses: ammo price history and review data would
otherwise need a warm-up request after any quiet week. 500 MB in Supabase is
also roughly a quarter of what an ammunition catalog with full load data
would want. D1 free is 5 GB.

## Migration order dependency

`002_sources.sql` exists as its own file purely so `003_seed_reference_data.sql`
can populate `sources`. D1 runs files in filename order, so a table must be
created in an earlier migration than the one that inserts into it. This bit us
once already — the validator caught it.

Likewise `004_reload_recipes.sql` deliberately does **not** redefine
`cartridges` or `manufacturers`. It inherits the richer definitions from
`001_ammo_catalog.sql` (which has `slug`, `family`, `parent_case`). Because
`CREATE TABLE IF NOT EXISTS` silently no-ops, redefining them would have left
`recipes` pointing at columns that do not exist.
