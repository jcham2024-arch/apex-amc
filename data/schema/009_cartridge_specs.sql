-- Apex AMC :: 009 - Cartridge dimensions and pressure standards
--
-- Extends `cartridges` from 001. That table already carries the reloading-
-- critical fields (bullet diameter, SAAMI psi, grains-per-inch). This adds the
-- full interchangeability dimension set plus the CIP side of the world, since
-- a European reamer or a milsurp rifle is governed by CIP bar, not SAAMI psi,
-- and "my load is fine in a .223" stops being true in a 5.56 NATO chamber.

ALTER TABLE cartridges ADD COLUMN case_length_max_in REAL;
ALTER TABLE cartridges ADD COLUMN case_length_min_in REAL;
ALTER TABLE cartridges ADD COLUMN max_col_in REAL;          -- SAAMI max cartridge OAL
ALTER TABLE cartridges ADD COLUMN head_dia_in REAL;
ALTER TABLE cartridges ADD COLUMN rim_dia_in REAL;
ALTER TABLE cartridges ADD COLUMN rim_thickness_in REAL;
ALTER TABLE cartridges ADD COLUMN neck_dia_in REAL;
ALTER TABLE cartridges ADD COLUMN shoulder_dia_in REAL;
ALTER TABLE cartridges ADD COLUMN base_dia_in REAL;
ALTER TABLE cartridges ADD COLUMN lands_dia_in REAL;
ALTER TABLE cartridges ADD COLUMN cip_max_bar REAL;
ALTER TABLE cartridges ADD COLUMN capacity_gr_h2o REAL;     -- usable case volume
ALTER TABLE cartridges ADD COLUMN primer_type TEXT;
ALTER TABLE cartridges ADD COLUMN typical_twist_in REAL;
ALTER TABLE cartridges ADD COLUMN chamber_designation TEXT; -- '5.56x45 NATO' vs '.223 Rem'
ALTER TABLE cartridges ADD COLUMN is_reloadable INTEGER CHECK (is_reloadable IN (0, 1));
ALTER TABLE cartridges ADD COLUMN notes TEXT;
ALTER TABLE cartridges ADD COLUMN source_id INTEGER REFERENCES sources(id);

-- ------------------------------------------------- pressure cross-reference
--
-- `cartridges.saami_max_psi` is one curated number: the best value we have.
-- This table is the audit trail behind it, one row per standard body per
-- method. It exists because the two publicly available compilations of these
-- tables DO NOT AGREE - kwk.us lists 6.5 Creedmoor SAAMI at 52 ksi where the
-- standard says 62,000 psi - and a pressure limit that is quietly wrong by
-- 10,000 psi is the single most dangerous field in this database.
--
-- Storing every claimant means the disagreement is data, not something a
-- maintainer has to remember.

CREATE TABLE IF NOT EXISTS cartridge_pressure_references (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    cartridge_id   INTEGER NOT NULL REFERENCES cartridges(id) ON DELETE CASCADE,
    standard_body  TEXT NOT NULL CHECK (standard_body IN ('SAAMI', 'CIP', 'NATO', 'other')),
    method         TEXT NOT NULL
                     CHECK (method IN ('piezo', 'copper_crusher', 'piezo_ksi_rounded')),
    value          REAL NOT NULL,
    unit           TEXT NOT NULL CHECK (unit IN ('psi', 'cup', 'bar')),
    source_id      INTEGER REFERENCES sources(id),
    source_url     TEXT,
    source_kind    TEXT NOT NULL
                     CHECK (source_kind IN ('standard', 'compilation')),
    confidence     TEXT NOT NULL DEFAULT 'unverified'
                     CHECK (confidence IN ('verified_primary', 'compiled_agree',
                                           'compiled_disputed', 'compiled_single')),
    note           TEXT,
    UNIQUE (cartridge_id, standard_body, method, source_id)
);

CREATE INDEX IF NOT EXISTS idx_cpr_cartridge ON cartridge_pressure_references(cartridge_id);
CREATE INDEX IF NOT EXISTS idx_cpr_confidence ON cartridge_pressure_references(confidence);

-- Where two sources disagree about the same (cartridge, body, method), surface
-- it. This view is what check-seeds.mjs fails the build on: a disputed pressure
-- must be resolved by a human before it reaches the UI.
CREATE VIEW IF NOT EXISTS cartridge_pressure_disputes AS
SELECT
    c.slug                     AS cartridge_slug,
    c.name                     AS cartridge_name,
    r.standard_body,
    r.method,
    COUNT(DISTINCT r.value)    AS distinct_values,
    MIN(r.value)               AS min_value,
    MAX(r.value)               AS max_value,
    GROUP_CONCAT(DISTINCT r.value) AS values_seen,
    GROUP_CONCAT(DISTINCT COALESCE(r.source_url, r.source_id)) AS sources
FROM cartridge_pressure_references r
JOIN cartridges c ON c.id = r.cartridge_id
GROUP BY r.cartridge_id, r.standard_body, r.method
HAVING COUNT(DISTINCT r.value) > 1;
