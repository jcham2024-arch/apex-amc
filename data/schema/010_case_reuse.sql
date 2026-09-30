-- Apex AMC :: 010 - Case reuse and reload life
--
-- The user-facing question this answers: "I have a bucket of once-fired
-- factory brass and a press - what can I actually reuse, and how many times?"
--
-- Note the hard split enforced here. This table holds ONLY curated figures
-- from manufacturers, standards bodies and named gunsmithing authorities.
-- `source_kind` deliberately has no 'community' option. Forum experience
-- about how long brass really lasts lives in 011_community_layer.sql and
-- never mixes into this table. That separation is the point: a number a
-- manufacturer published and a number a stranger on a forum reported are
-- different classes of evidence and the UI must not present them alike.

CREATE TABLE IF NOT EXISTS case_reuse_profiles (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    cartridge_id        INTEGER NOT NULL REFERENCES cartridges(id) ON DELETE RESTRICT,

    -- Which brass this figure is about. NULL brand = generic for the cartridge.
    brass_brand         TEXT,
    case_material       TEXT NOT NULL DEFAULT 'brass'
                          CHECK (case_material IN ('brass', 'nickel_plated_brass',
                                                   'steel', 'aluminum', 'polymer')),
    -- Whether the case can be reloaded at all, and why not if not.
    is_reloadable       INTEGER NOT NULL CHECK (is_reloadable IN (0, 1)),
    not_reloadable_reason TEXT,

    -- Priming. This is the single biggest gotcha when scavenging factory ammo:
    -- Berdan-primed cases need a tool most people do not own, and Boxer with a
    -- crimped/staked primer pocket needs the crimp swaged or reamed out first.
    primer_type         TEXT CHECK (primer_type IN ('boxer', 'berdan', 'mixed')),
    primer_pocket       TEXT CHECK (primer_pocket IN ('uncrimped', 'crimped',
                                                      'staked', 'mixed', 'unknown')),

    -- Pressure class the figures assume. A case fired at 62,000 psi does not
    -- last like the same case fired at 45,000.
    pressure_class      TEXT CHECK (pressure_class IN ('standard', 'plus_p',
                                                       'magnum', 'nato', 'unknown')),

    reloads_min          INTEGER,
    reloads_max          INTEGER,
    reloads_typical      INTEGER,
    anneal_interval      INTEGER,   -- reloads between annealing the neck/shoulder
    -- Some cartridges/actions need a body die or shoulder bump to chamber again.
    needs_shoulder_bump  INTEGER CHECK (needs_shoulder_bump IN (0, 1)),
    head_separation_risk TEXT CHECK (head_separation_risk IN ('low', 'moderate', 'high')),

    notes               TEXT,
    source_id           INTEGER REFERENCES sources(id),
    source_url          TEXT,
    source_kind         TEXT NOT NULL
                          CHECK (source_kind IN ('manufacturer', 'standard', 'authority')),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),

    UNIQUE (cartridge_id, brass_brand, case_material, pressure_class)
);

CREATE INDEX IF NOT EXISTS idx_case_reuse_cartridge ON case_reuse_profiles(cartridge_id);

-- ------------------------------- what is worth scavenging off the shelf
-- A directly filterable answer to "what do I keep out of the range bucket".
-- Separate from case_reuse_profiles because the question is about a *factory
-- load*, not a cartridge in the abstract, and the answer depends on the case
-- material and primer the factory used.

CREATE TABLE IF NOT EXISTS factory_brass_scavenging (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    cartridge_id     INTEGER NOT NULL REFERENCES cartridges(id) ON DELETE RESTRICT,
    loaded_by        TEXT NOT NULL,          -- 'Lake City (M193)', 'Sellier & Bellot', ...
    case_material    TEXT CHECK (case_material IN ('brass', 'nickel_plated_brass',
                                                   'steel', 'aluminum')),
    primer_type      TEXT CHECK (primer_type IN ('boxer', 'berdan')),
    primer_pocket    TEXT CHECK (primer_pocket IN ('uncrimped', 'crimped', 'staked')),
    scavengeable     INTEGER NOT NULL CHECK (scavengeable IN (0, 1)),
    extra_steps      TEXT,   -- 'swage or ream primer crimp', 'must be annealed first'
    reason           TEXT,   -- why not, when scavengeable = 0
    source_url       TEXT,
    source_kind      TEXT NOT NULL
                       CHECK (source_kind IN ('manufacturer', 'standard', 'authority', 'distributor')),
    UNIQUE (cartridge_id, loaded_by, case_material)
);

CREATE INDEX IF NOT EXISTS idx_scavenge_ok ON factory_brass_scavenging(scavengeable);
