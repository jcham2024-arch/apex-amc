-- Apex AMC :: 006 - Manufacturer directory
--
-- The catalog's `manufacturers` table (001) has a single `kind` column, but
-- docs/DATA-MODEL.md states the intent: "Federal is an ammo maker *and* a
-- brass maker; that is one row with two associations, not two companies."
-- A single-valued column cannot express that, and this database is explicitly
-- about components - Hornady sells ammo, bullets *and* brass; Nosler sells
-- bullets, ammo and brass; Sierra sells bullets only.
--
-- So the many-to-many becomes authoritative in `manufacturer_kinds`, and
-- `manufacturers.kind` is retained as the *primary* kind so nothing that
-- already reads it breaks. `check-seeds.mjs` asserts the two never disagree
-- about the primary kind.

ALTER TABLE manufacturers ADD COLUMN country TEXT;
ALTER TABLE manufacturers ADD COLUMN region TEXT;             -- 'north_america' | 'europe' | ...
ALTER TABLE manufacturers ADD COLUMN founded_year INTEGER;
ALTER TABLE manufacturers ADD COLUMN status TEXT
    CHECK (status IN ('active', 'acquired', 'defunct', 'unknown'));
ALTER TABLE manufacturers ADD COLUMN parent_company TEXT;      -- 'Vista Outdoor', 'Beretta Holding'
ALTER TABLE manufacturers ADD COLUMN notes TEXT;
ALTER TABLE manufacturers ADD COLUMN source_url TEXT;

CREATE INDEX IF NOT EXISTS idx_manufacturers_country ON manufacturers(country);

-- ------------------------------------------------------------- kinds (M:N)
-- One row per (manufacturer, component class). This is what lets the site
-- answer "who makes 6.5mm match bullets" and "who makes brass" without
-- duplicating a company.

CREATE TABLE IF NOT EXISTS manufacturer_kinds (
    manufacturer_id INTEGER NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
    kind            TEXT NOT NULL
                      CHECK (kind IN ('ammo', 'bullet', 'powder', 'primer',
                                      'brass', 'shotshell', 'retailer',
                                      'reloading_equipment', 'wads')),
    is_primary      INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
    source_url      TEXT,
    PRIMARY KEY (manufacturer_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_manufacturer_kinds_kind ON manufacturer_kinds(kind);

-- Backfill from the single-valued column that 001/003 already seeded.
INSERT OR IGNORE INTO manufacturer_kinds (manufacturer_id, kind, is_primary)
SELECT id, kind, 1 FROM manufacturers WHERE kind IS NOT NULL;

-- ------------------------------------------------------- redirects / aliases
-- Component names change hands constantly (Alliant owned Hercules' line,
-- Western Powders became Hodgdon, Bofors/Nexplo is Rheinmetall Defence).
-- Recording the alias keeps a search for the old name working and documents
-- why two rows are not two companies.

CREATE TABLE IF NOT EXISTS manufacturer_aliases (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer_id INTEGER NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
    alias           TEXT NOT NULL,
    reason          TEXT,     -- 'renamed' | 'acquired' | 'regional' | 'former_parent'
    UNIQUE (manufacturer_id, alias)
);
