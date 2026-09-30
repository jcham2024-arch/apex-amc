-- Apex AMC :: 007 - Projectile (bullet) published specifications
--
-- Extends `bullets` from 004_reload_recipes.sql. That table already holds the
-- minimum viable identity (manufacturer, name, weight, diameter, BC). This
-- migration adds the published specification fields a reloader actually
-- selects on, so the site can answer "what will stabilise in my 1:8 twist"
-- and "what is this bullet made of" from data rather than from prose.
--
-- Everything here is a *manufacturer-published specification*. Charge weights
-- are not here and must not be: they belong to the manual, in `recipes`.

ALTER TABLE bullets ADD COLUMN product_line TEXT;        -- 'MatchKing' | 'ELD-X' | 'TSX'
ALTER TABLE bullets ADD COLUMN part_number TEXT;         -- manufacturer SKU
ALTER TABLE bullets ADD COLUMN caliber TEXT;             -- '.308' | '6.5mm'
ALTER TABLE bullets ADD COLUMN bullet_length_in REAL;
ALTER TABLE bullets ADD COLUMN sectional_density REAL;
-- Minimum barrel twist the maker states is needed to stabilise this bullet.
ALTER TABLE bullets ADD COLUMN twist_min_in REAL;        -- 8.0 for 1:8"
ALTER TABLE bullets ADD COLUMN construction TEXT
    CHECK (construction IN ('cup_and_core', 'bonded', 'partition', 'monolithic',
                            'cast_lead', 'plated', 'frangible', 'jacketed',
                            'turned_solid', 'unknown'));
ALTER TABLE bullets ADD COLUMN jacket_material TEXT;      -- 'gilding_metal' | 'copper' | 'copper_nickel' | 'brass'
ALTER TABLE bullets ADD COLUMN core_material TEXT;        -- 'lead' | 'copper' | 'tungsten' | 'steel' | 'none'
ALTER TABLE bullets ADD COLUMN base_type TEXT
    CHECK (base_type IN ('flat', 'boat_tail', 'rebated_boat_tail', 'bevel',
                         'gas_check', 'hollow_base', 'unknown'));
ALTER TABLE bullets ADD COLUMN tip_type TEXT
    CHECK (tip_type IN ('round_nose', 'spitzer', 'soft_point', 'hollow_point',
                        'hpbt', 'polymer_tip', 'fmj', 'open_tip', 'wadcutter',
                        'semi_wadcutter', 'unknown'));
ALTER TABLE bullets ADD COLUMN use_case TEXT;             -- 'match' | 'hunting' | 'varmint' | 'defense' | 'plinking'
ALTER TABLE bullets ADD COLUMN cannelure INTEGER CHECK (cannelure IN (0, 1));
ALTER TABLE bullets ADD COLUMN notes TEXT;
ALTER TABLE bullets ADD COLUMN source_url TEXT;
ALTER TABLE bullets ADD COLUMN source_kind TEXT
    CHECK (source_kind IN ('manufacturer', 'distributor', 'compilation', 'community'));

CREATE INDEX IF NOT EXISTS idx_bullets_line  ON bullets(product_line);
CREATE INDEX IF NOT EXISTS idx_bullets_dia   ON bullets(diameter_inches, weight_grains);
CREATE INDEX IF NOT EXISTS idx_bullets_use   ON bullets(use_case);

-- --------------------------------------------------------- twist adequacy
-- A view, not a table: the stabilisation question is "is this bullet's
-- required twist at least as fast as the barrel I have". Faster twist = the
-- smaller number, so a bullet needing 1:8 is fine in a 1:7 barrel and not in
-- a 1:10. Getting that inequality backwards is the classic silent error, so
-- it is encoded once, here, and named so the direction is obvious.

CREATE VIEW IF NOT EXISTS bullet_twist_fit AS
SELECT
    b.id                AS bullet_id,
    m.name              AS manufacturer,
    b.name              AS bullet_name,
    b.weight_grains,
    b.diameter_inches,
    b.twist_min_in      AS needs_twist_1_in,
    fb.twist_rate_inches AS barrel_twist_1_in,
    CASE
        WHEN b.twist_min_in IS NULL OR fb.twist_rate_inches IS NULL THEN NULL
        WHEN fb.twist_rate_inches <= b.twist_min_in THEN 1
        ELSE 0
    END                 AS stabilised
FROM bullets b
JOIN manufacturers m ON m.id = b.manufacturer_id
JOIN firearm_profiles fb ON fb.caliber IS NOT NULL;
