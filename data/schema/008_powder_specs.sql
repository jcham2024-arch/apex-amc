-- Apex AMC :: 008 - Smokeless powder published data
--
-- Extends `powders` from 004. That table has (manufacturer, name,
-- burn_rate_class). The burn class is the physics input - it selects the
-- barrel-scaling exponent in packages/ballistics-core/src/reloading.ts - so it
-- must stay a small closed set and must not be overloaded with marketing.
--
-- `relative_burn_rate_position` is separate on purpose. Burn rate is only
-- meaningfully ordered *within* a manufacturer's own line; every cross-brand
-- chart is somebody's compilation and they disagree at the edges. So the
-- number is stored with the chart it came from, in a dedicated table, rather
-- than as a bare fact on the powder row.

ALTER TABLE powders ADD COLUMN product_line TEXT;
ALTER TABLE powders ADD COLUMN geometry TEXT
    CHECK (geometry IN ('ball', 'flattened_ball', 'extruded_short', 'extruded_long',
                        'flake', 'disc', 'cylindrical', 'unknown'));
ALTER TABLE powders ADD COLUMN is_double_base INTEGER CHECK (is_double_base IN (0, 1));
ALTER TABLE powders ADD COLUMN nitroglycerin_pct REAL;
ALTER TABLE powders ADD COLUMN bulk_density_gcc REAL;      -- published VMD / density
ALTER TABLE powders ADD COLUMN temperature_sensitivity TEXT
    CHECK (temperature_sensitivity IN ('low', 'moderate', 'high', 'unknown'));
ALTER TABLE powders ADD COLUMN commonly_used_for TEXT;      -- 'pistol_light' | 'service_pistol' | ...
ALTER TABLE powders ADD COLUMN copper_fouling_reducer INTEGER CHECK (copper_fouling_reducer IN (0, 1));
ALTER TABLE powders ADD COLUMN status TEXT
    CHECK (status IN ('current', 'discontinued', 'limited', 'unknown'));
ALTER TABLE powders ADD COLUMN notes TEXT;
ALTER TABLE powders ADD COLUMN source_url TEXT;
ALTER TABLE powders ADD COLUMN source_kind TEXT
    CHECK (source_kind IN ('manufacturer', 'distributor', 'compilation', 'community'));

CREATE INDEX IF NOT EXISTS idx_powders_line ON powders(product_line);
CREATE INDEX IF NOT EXISTS idx_powders_burn ON powders(burn_rate_class);

-- ------------------------------------------------- relative burn-rate charts
-- One row per (powder, chart). Keeping the chart as part of the key is the
-- whole point: two charts can legitimately place the same powder differently
-- and the site should be able to show that disagreement instead of hiding it.
--
-- Powers have no meaningful absolute burn rate - only an ordering - so the
-- observed property is position-on-a-chart, and the chart is the provenance.

CREATE TABLE IF NOT EXISTS powder_burn_rate_charts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    slug          TEXT NOT NULL UNIQUE,       -- 'hodgdon-2024'
    name          TEXT NOT NULL,
    publisher     TEXT NOT NULL,
    url           TEXT,
    published_year INTEGER,
    scope         TEXT,                        -- 'single_manufacturer' | 'cross_brand'
    source_kind   TEXT NOT NULL
                    CHECK (source_kind IN ('manufacturer', 'compilation', 'community')),
    note          TEXT
);

CREATE TABLE IF NOT EXISTS powder_burn_rate_positions (
    powder_id     INTEGER NOT NULL REFERENCES powders(id) ON DELETE CASCADE,
    chart_id      INTEGER NOT NULL REFERENCES powder_burn_rate_charts(id) ON DELETE RESTRICT,
    position      INTEGER NOT NULL CHECK (position > 0),   -- 1 = fastest on this chart
    chart_total   INTEGER,
    PRIMARY KEY (powder_id, chart_id)
);

CREATE INDEX IF NOT EXISTS idx_burnrate_chart ON powder_burn_rate_positions(chart_id, position);

-- Cross-chart disagreement, the powder-side equivalent of the cartridge
-- pressure cross-check. A powder whose relative position swings more than
-- ~15% of a chart's length between charts is not confidently placeable, and
-- the UI should say so rather than average two incompatible orderings.
CREATE VIEW IF NOT EXISTS powder_burn_rate_spread AS
SELECT
    p.id             AS powder_id,
    m.name           AS manufacturer,
    p.name           AS powder_name,
    COUNT(*)         AS chart_count,
    MIN(b.position)  AS fastest_position,
    MAX(b.position)  AS slowest_position,
    MAX(b.position) - MIN(b.position) AS position_spread
FROM powders p
JOIN manufacturers m ON m.id = p.manufacturer_id
JOIN powder_burn_rate_positions b ON b.powder_id = p.id
GROUP BY p.id
HAVING COUNT(*) > 1;
