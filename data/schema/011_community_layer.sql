-- Apex AMC :: 011 - Community layer (kept structurally separate)
--
-- This migration exists because of an editorial rule, not a technical one:
-- published manufacturer data and forum experience must never be presented
-- as the same kind of thing.
--
-- The user asked for exactly this split. It is enforced here by the schema
-- rather than by discipline, because discipline does not survive a refactor:
--
--   * Every table in this file is named `community_*`.
--   * `source_url` is NOT NULL. A claim with no link is not a claim.
--   * There is no foreign key from the official tables (`bullets`, `powders`,
--     `recipes`, `case_reuse_profiles`) into these. Provenance flows one way.
--   * `confidence` and `agreement_level` are NOT NULL and constrained, so an
--     isolated forum post cannot be stored as though it were consensus.
--
-- Anything that gets promoted out of here into official data has to be
-- re-sourced from a manufacturer or standard. That is the whole point: the
-- community layer is a lead, never a citation.

CREATE TABLE IF NOT EXISTS community_observations (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    topic          TEXT NOT NULL
                     CHECK (topic IN ('case_life', 'brass_quality', 'annealing',
                                      'primer_pockets', 'powder_temperature',
                                      'lot_variation', 'seating_depth', 'pressure_signs',
                                      'primer_substitution', 'scavenging',
                                      'powder_availability', 'bullet_performance',
                                      'load_development', 'equipment', 'other')),
    subtopic       TEXT,

    -- Free-text component references, deliberately NOT foreign keys: a forum
    -- poster writes "Varget" or "the 175 SMK", not our slugs, and forcing a
    -- join here would either fail the insert or invite a wrong match.
    cartridge      TEXT,
    bullet         TEXT,
    powder         TEXT,

    claim_summary  TEXT NOT NULL,
    numeric_value  REAL,
    unit           TEXT,

    source_forum   TEXT NOT NULL,
    source_url     TEXT NOT NULL,
    source_date    TEXT,
    source_author  TEXT,

    agreement_level TEXT NOT NULL
                      CHECK (agreement_level IN ('widely_reported', 'commonly_reported',
                                                 'disputed', 'isolated')),
    confidence     INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    safety_risk    TEXT NOT NULL CHECK (safety_risk IN ('low', 'medium', 'high')),

    -- Curation state, so the site can show only what an editor has read.
    status         TEXT NOT NULL DEFAULT 'unreviewed'
                     CHECK (status IN ('unreviewed', 'accepted', 'promoted', 'rejected')),
    reviewer_note  TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_community_topic      ON community_observations(topic, agreement_level);
CREATE INDEX IF NOT EXISTS idx_community_cartridge  ON community_observations(cartridge);
CREATE INDEX IF NOT EXISTS idx_community_risk       ON community_observations(safety_risk);
CREATE INDEX IF NOT EXISTS idx_community_status     ON community_observations(status);

-- Anything a community post claims that touches pressure or a charge weight
-- is high-risk by definition. `check-seeds.mjs` fails the build if a row like
-- that is not flagged, so the warning cannot be forgotten.
CREATE VIEW IF NOT EXISTS community_high_risk_unflagged AS
SELECT id, topic, claim_summary, source_url
FROM community_observations
WHERE safety_risk <> 'high'
  AND (topic IN ('pressure_signs', 'seating_depth', 'primer_substitution')
       OR claim_summary LIKE '%charge%'
       OR claim_summary LIKE '%pressure%'
       OR claim_summary LIKE '%grains%');

-- Promotion candidates: things where the community broadly agrees, so they are
-- worth an editor's time to go and find a manufacturer source for.
--
-- This view is a to-do list. It must never be rendered as fact.
CREATE VIEW IF NOT EXISTS community_promotion_candidates AS
SELECT topic, cartridge, powder, bullet, claim_summary, source_url, confidence
FROM community_observations
WHERE agreement_level IN ('widely_reported', 'commonly_reported')
  AND confidence >= 4
  AND status = 'accepted'
ORDER BY confidence DESC, topic;
