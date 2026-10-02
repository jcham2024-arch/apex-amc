-- Apex AMC :: 003 - Reloading recipe data
--
-- Extends the catalog in 001. `cartridges` and `manufacturers` are owned by
-- 001_ammo_catalog.sql and are intentionally NOT redefined here; D1 runs
-- migrations in filename order, so redefining them would silently no-op via
-- IF NOT EXISTS and leave these tables pointing at the wrong columns.
--
-- This is Gemini's original schema, preserved as-is. It still needs:
--   * `bullets.manufacturer_id` -> `manufacturers(id)` which now carries a
--     `kind` discriminator ('bullet' vs 'ammo' vs 'powder').
--   * Foreign keys declared without an explicit ON DELETE action.
-- See docs/DATA-MODEL.md for the migration plan.

-- Bullets / Projectiles
--
-- The primary key is deliberately NOT declared here.
--
-- This table originally carried UNIQUE(manufacturer_id, name, weight_grains),
-- which cannot identify a bullet: Berger sells a 6.5 mm 140 gr VLD Target (part
-- 26401) AND a 7 mm 140 gr VLD Target (part 26504). Same name, same weight,
-- different projectiles, and 8 of Berger's 111 published bullets collide that
-- way. Under that constraint the second of each pair could never be inserted and
-- `INSERT OR IGNORE` dropped it without a word.
--
-- Identity is (manufacturer_id, part_number), established in 015. It cannot be a
-- UNIQUE constraint here for the same reason it cannot replace one there:
-- SQLite cannot drop a constraint-backed index, only rebuild the table. Since
-- this repository replays migrations in order against a fresh database and
-- ships no .sqlite file, the fix belongs in the CREATE TABLE itself and 015
-- records the reasoning.
CREATE TABLE IF NOT EXISTS bullets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer_id INTEGER NOT NULL REFERENCES manufacturers(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    weight_grains DECIMAL(6,2) NOT NULL,
    diameter_inches DECIMAL(5,3) NOT NULL,
    bc_g1 DECIMAL(5,3),
    bc_g7 DECIMAL(5,3)
);

-- Powders
CREATE TABLE IF NOT EXISTS powders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer_id INTEGER NOT NULL REFERENCES manufacturers(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    -- Drives the Homann/Fraser barrel-scaling exponent `n`.
    burn_rate_class VARCHAR(50) CHECK(burn_rate_class IN ('pistol', 'rifle_medium', 'rifle_slow', 'shotgun')),
    UNIQUE(manufacturer_id, name)
);

-- Data Sources / Manuals (Attribution & Compliance)
CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    edition VARCHAR(50),
    publication_year INTEGER,
    url TEXT,
    UNIQUE(name, edition)
);

-- Core Reloading Recipes Table.
-- Every row is transcribed from a published manual. `source_id` is mandatory
-- so no load data can ever exist without attribution.
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cartridge_id INTEGER NOT NULL REFERENCES cartridges(id) ON DELETE RESTRICT,
    bullet_id INTEGER NOT NULL REFERENCES bullets(id) ON DELETE RESTRICT,
    powder_id INTEGER NOT NULL REFERENCES powders(id) ON DELETE RESTRICT,
    source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,
    primer_description VARCHAR(100),
    case_brand VARCHAR(100),
    test_barrel_length_in DECIMAL(4,2) NOT NULL,
    test_twist_rate VARCHAR(20),
    published_coal_in DECIMAL(5,3) NOT NULL,
    min_charge_grains DECIMAL(5,2) NOT NULL,
    min_velocity_fps INTEGER NOT NULL,
    max_charge_grains DECIMAL(5,2) NOT NULL,
    max_velocity_fps INTEGER NOT NULL,
    max_pressure INTEGER,
    pressure_unit VARCHAR(10) DEFAULT 'PSI' CHECK(pressure_unit IN ('PSI', 'CUP')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for instant recipe filtering in UI searches
CREATE INDEX IF NOT EXISTS idx_recipes_lookup ON recipes(cartridge_id, bullet_id, powder_id);
CREATE INDEX IF NOT EXISTS idx_bullets_search ON bullets(manufacturer_id, weight_grains);
