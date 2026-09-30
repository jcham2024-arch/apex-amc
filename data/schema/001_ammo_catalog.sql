-- Apex AMC :: 001 - Ammunition catalog
-- Target: Cloudflare D1 (SQLite). Free tier: 5 GB storage, 5M rows read/day.
--
-- Design rules for this schema:
--   1. Provenance is mandatory. Every load/reference row keeps `source_name`
--      and an optional `source_url`. For an ammunition reference site this is
--      the difference between "useful" and "dangerous".
--   2. Prices are append-only observations with an `observed_on` date, never a
--      single mutable column. Ammo pricing moves constantly and the history is
--      worth more than the current number.
--   3. Outbound links (retailers, YouTube) are stored as data, never rendered
--      as raw HTML, so there is no path for injected markup.

-- ---------------------------------------------------------------- cartridges

CREATE TABLE IF NOT EXISTS cartridges (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    slug              TEXT NOT NULL UNIQUE,
    name              TEXT NOT NULL,            -- '.308 Winchester'
    short_name        TEXT,                     -- '308 Win'
    family            TEXT NOT NULL             -- 'rifle' | 'pistol' | 'shotgun'
                      CHECK (family IN ('rifle', 'pistol', 'shotgun')),
    parent_case       TEXT,                     -- '.30-06'
    saami_max_psi     INTEGER,
    federal_max_psi   INTEGER,
    bullet_dia_in     REAL,                     -- nominal diameter, inches
    grain_per_inch    REAL,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cartridges_family ON cartridges(family);

-- ------------------------------------------------------------- manufacturers

CREATE TABLE IF NOT EXISTS manufacturers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    slug       TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    kind       TEXT NOT NULL
                CHECK (kind IN ('ammo', 'bullet', 'powder', 'primer', 'brass', 'retailer')),
    website    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_manufacturers_kind ON manufacturers(kind);

-- ------------------------------------------------------------------ products
-- One row per purchasable SKU. This is the row the catalog grid browses.

CREATE TABLE IF NOT EXISTS products (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    slug              TEXT NOT NULL UNIQUE,
    cartridge_id      INTEGER NOT NULL REFERENCES cartridges(id) ON DELETE RESTRICT,
    manufacturer_id   INTEGER NOT NULL REFERENCES manufacturers(id) ON DELETE RESTRICT,

    product_name      TEXT NOT NULL,     -- 'Federal AE Match 168gr Varget'
    sku               TEXT,
    bullet_style      TEXT,              -- 'HPBT' | 'FMJ' | 'BT' | 'SP' | 'VLD'
    bullet_weight_gr  REAL,              -- grains
    charge_grains     REAL,              -- powder charge per round
    case_type         TEXT,              -- 'Federal Cartridge' | 'Remington' | 'PBr'
    primer_type       TEXT,              -- 'CCMU' | 'Federal 210' | 'CCI #41'
    rounds_per_box    INTEGER,
    bc_g1             REAL,

    -- Provenance for the load data itself.
    source_name       TEXT,              -- 'Hodgdon 2024' | 'Hornady 10th Ed'
    source_edition    TEXT,
    source_url        TEXT,
    is_max_load       INTEGER NOT NULL DEFAULT 0 CHECK (is_max_load IN (0, 1)),

    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_cartridge   ON products(cartridge_id);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_products_name        ON products(product_name);

-- ------------------------------------------------------ price_observations
-- Append-only. Never UPDATE a price - insert a new observation.

CREATE TABLE IF NOT EXISTS price_observations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    retailer_id   INTEGER NOT NULL REFERENCES manufacturers(id) ON DELETE RESTRICT,
    price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),
    url           TEXT NOT NULL,        -- deep link to the listing
    in_stock      INTEGER CHECK (in_stock IN (0, 1)),
    observed_on   TEXT NOT NULL DEFAULT (date('now')),

    UNIQUE (product_id, retailer_id, observed_on)
);

CREATE INDEX IF NOT EXISTS idx_price_latest ON price_observations(product_id, observed_on DESC);

-- ------------------------------------------------------------------- reviews
-- Community/editorial reviews behind a moderation gate.

CREATE TABLE IF NOT EXISTS reviews (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    author        TEXT NOT NULL,
    rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body          TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, status);

-- --------------------------------------------------------------- video_links
-- Outbound YouTube / review links. We never host media.

CREATE TABLE IF NOT EXISTS video_links (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id    INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    url           TEXT NOT NULL,
    channel       TEXT,
    duration_sec  INTEGER,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_video_product ON video_links(product_id);
