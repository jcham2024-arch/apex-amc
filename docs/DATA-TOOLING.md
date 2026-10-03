# Database tooling — what is already here, measured

Written 3 Oct 2026, before choosing anything. The answer is mostly "you already have it".

## Verified available on this machine

| Tool | Version | How | Verified |
|---|---|---|---|
| **node:sqlite** | built in | `require('node:sqlite')` — no install | ✅ inserted and read a row |
| **sqlite3 CLI** | 3.53.2 | `C:\Users\Justin\miniconda3\Library\bin\sqlite3.exe` | ✅ built all 37 tables |
| **Python sqlite3** | 3.53.2 | `python -c "import sqlite3"` | ✅ |
| Python | 3.14.6 | `python` | ✅ |
| Node | 24.19.0 | `node` | ✅ |

Not present: `duckdb`, `pandas`, `psql`, `mysql`.

**`node:sqlite` is the important one.** Node 24 ships SQLite in core, so there is nothing
to install, no native build step, and no lockfile churn. A script that reads the seeds and
answers a question needs zero dependencies.

## The schema already builds, and it is ahead of the data

```bash
# build a throwaway database from every migration, in order
cat data/schema/*.sql | sqlite3 /tmp/probe.db
sqlite3 /tmp/probe.db ".tables"
```

All **37 tables** build cleanly. Among them, three that matter for the planned work:

- **`reviews`** — product, author, rating, body, and a `pending/approved/rejected` gate.
- **`video_links`** — "Outbound YouTube / review links. We never host media." Already has
  `product_id`, `title`, `url`, `channel`, `duration_sec`.
- **`value_provenance`** — annotates a single `(entity_type, entity_slug, field_name)`
  cell. This is the "explain your reasoning" table the owner asked for, and it exists.

**So the YouTube and review-derived-value ideas are already modelled.** The gap is not the
schema, it is that there are no rows.

## The blocker for range bags and accessories: `products` is ammo-only

```sql
CREATE TABLE products (
    ...
    cartridge_id      INTEGER NOT NULL REFERENCES cartridges(id) ON DELETE RESTRICT,
    manufacturer_id   INTEGER NOT NULL REFERENCES manufacturers(id) ON DELETE RESTRICT,
```

Both columns are `NOT NULL`. A range bag, a scope, or a brass mat is **neither a
cartridge nor ammunition**, so there is no legal row for one. There is no generic
product/accessory/gear table anywhere in `data/schema/`.

Everything hangs off this: `reviews.product_id` and `video_links.product_id` both
`REFERENCES products(id)`, so **no review or video can be recorded about a range bag
either.** The owner's requested dataset categories — scopes, accessories, range bags,
range-bag contents, and where to get them — cannot be stored today.

This needs an owner decision before it is implemented, because the options differ:

| Option | Consequence |
|---|---|
| **Add `gear_products`** beside `products` | reviews/videos need a second nullable FK, or a `subject` table both point at |
| **Make `products` generic** (`subject_type` + nullable FKs) | one table, but weakens the ammo constraints that make `products` safe |
| **Keep `products` ammo-only, add `gear` + `gear_reviews`** | clearest, least risk, most duplication |

My reading: the third. `products` carries `charge_grains`, `bullet_weight_gr`,
`bc_g1` — reloading columns that mean nothing for a range bag, and `cartridge_id
ON DELETE RESTRICT` exists to protect that relationship. Bolting gear onto it invites
a NULL cartridge_id, and a NULL cartridge_id is how an ammo row starts looking like a
gear row.

## Free resources, honestly ranked for THIS project

**Free tier is not the constraint here.** 29 seed files is 0.23 MB and the largest table
is 232 rows. SQLite handles this on a Raspberry Pi. Optimising for a free tier would be
solving a problem that does not exist yet.

| Resource | Cost | Verdict for here |
|---|---|---|
| **SQLite (already have it, 3 ways)** | free, embedded | ✅ correct now |
| **Cloudflare D1** | free to ~5 GB, 100k rows/day read | Already the deployment target — see `scripts/data/export-d1.mjs` |
| **Turso / libSQL** | free tier, real Postgres wire protocol | Worth it *if* Postgres is ever wanted |
| **Neon** | free tier, real Postgres | Same |
| **Supabase** | free tier | Overkill; adds auth you do not need |
| **BigQuery** | free tier, but the MCP tool here bills to *your* project | ❌ do not use for this |

**D1 is the answer for production** and it is already wired up. Everything else is a
migration you do not currently need.

## What this platform gives me directly

Beyond local tools, these are callable from an agent session and are genuinely free-tier
or already-provisioned:

- **node:sqlite / sqlite3 CLI / Python sqlite3** — everything below runs locally first.
- **exa** (`web_search_exa`, `web_fetch_exa`) — semantic web search and page reading, for
  sourcing product reviews and manufacturer pages.
- **firecrawl** (`firecrawl_scrape`, `firecrawl_search`, `firecrawl_crawl`) — scrape and
  crawl a retailer's or reviewer's site into markdown, respecting their robots.
- **context7** — library docs, for anything added to the toolchain.
- **chrome-devtools** — drive a real browser, which is how you would read a YouTube
  transcript without storing it.

**Note on YouTube:** there is no transcript API in this toolset. Reading one means
fetching the page with firecrawl or chrome-devtools, and the transcript must stay local —
`archive/**/*.txt` is already gitignored for exactly this reason. Store the URL, the
video id, and your conclusion; never the transcript.

## Recommendation

1. **Load the seeds into SQLite now** — a script, no dependencies, using `node:sqlite`.
   Every dataset question becomes a SQL query instead of a `grep`.
2. **Get the `products` decision made** before seeding any gear dataset. It is the
   blocker, and it is the owner's call because it changes the shape of the data.
3. **Keep D1 as the deployment target.** Do not add Postgres until there is a reason
   that SQLite cannot serve.