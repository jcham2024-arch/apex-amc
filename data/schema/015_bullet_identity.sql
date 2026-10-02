-- ---------------------------------------------------------------------------
-- 015: a bullet's identity is its part number, not its name and weight
-- ---------------------------------------------------------------------------
-- WHY
-- Migration 004 declared UNIQUE(manufacturer_id, name, weight_grains) as the
-- bullets primary key. That cannot tell two products apart, and the first full
-- manufacturer ingest proved it rather than merely suggesting it.
--
-- Berger publishes, among others:
--     part 26401   6.5 mm 140 gr VLD Target
--     part 26504   7 mm   140 gr VLD Target
-- Same family, same grain weight, different bullets. Under the old constraint
-- the second could never be inserted, and `INSERT OR IGNORE` would drop it
-- without a word - the same silent-data-loss failure this repository has
-- already been bitten by twice.
--
-- 8 of Berger's 111 published bullets collide on (name, weight). Any
-- manufacturer that publishes a family in more than one calibre hits this, so
-- it is not a Berger quirk.
--
-- THE FIX
-- part_number is the manufacturer's own SKU. It is `required: true` in
-- data/schemas/bullets.yaml and populated on every current row, it is what the
-- component finder matches against retailers, and across all 122 rows
-- (manufacturer_id, part_number) is unique with no collisions.
--
-- The old constraint protected nothing: two rows with the same name and weight
-- but different part numbers are different bullets, not duplicate records.

-- Migration 004 no longer declares the old UNIQUE constraint (see the comment on
-- that CREATE TABLE), so on a fresh database there is nothing here to drop.
--
-- These two statements remain for anyone whose database was built before that
-- correction. SQLite refuses to drop an index that backs a UNIQUE or PRIMARY KEY
-- constraint - "index associated with UNIQUE or PRIMARY KEY constraint cannot be
-- dropped" - so this works only for the unnamed-index case; a database still
-- carrying the 004 constraint needs the table-rebuild procedure from
-- https://sqlite.org/lang_altertable.html#otheralter. This repository replays
-- migrations in order against an in-memory database and commits no .sqlite file,
-- so that path is not exercised here.
DROP INDEX IF EXISTS sqlite_autoindex_bullets_1;
DROP INDEX IF EXISTS idx_bullets_identity;

-- A PARTIAL unique index (WHERE part_number IS NOT NULL) rather than a table
-- constraint: it cannot be added to an existing table as a constraint at all,
-- and it keeps any pre-part_number row storable instead of forcing a NOT NULL
-- that migration 004 never declared.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bullets_manufacturer_part
    ON bullets(manufacturer_id, part_number)
    WHERE part_number IS NOT NULL;

-- The component finder looks bullets up BY part number, so this is the index
-- that query wants. The one in 004 is keyed on weight instead, which is not how
-- anybody searches for a specific projectile.
CREATE INDEX IF NOT EXISTS idx_bullets_part_lookup
    ON bullets(part_number);
