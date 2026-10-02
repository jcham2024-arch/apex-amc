-- Apex AMC :: 016 - Affiliate program outreach tracker
--
-- WHAT THIS IS FOR
-- ----------------
-- `sourcing_retailers.affiliate_status` records WHETHER a program exists. This
-- records what we did about it: who was contacted, when, who replied, what they
-- said.
--
-- That column has been 'unknown' for every retailer since 2026-10-01, and it
-- cannot move without a human opening a browser. Nothing in this repository can
-- apply to an affiliate program on the owner's behalf - it needs a person, an
-- email address and an application form. Encoding that as a table makes the work
-- trackable rather than remembered, and lets the next agent see exactly where
-- the process stands.
--
-- WHY A TABLE AND NOT A SPREADSHEET
-- --------------------------------
--  1. It joins to `sourcing_retailers`, so the tracker cannot drift away from
--     the retailer list. A spreadsheet has no foreign key, and one whose
--     retailer slugs no longer match is silently worthless.
--  2. `commission_rate_pct` is a snapshot, not a live value. Networks change
--     rates and cookie windows without notice. `terms_verified_on` exists so a
--     stale number is visible as stale rather than presented as current.
--
-- WHAT IS DELIBERATELY NOT HERE
-- -----------------------------
-- No rates are invented. `commission_rate_pct` is nullable and stays NULL until
-- someone reads it off the network's own site. Every retailer in the seed data
-- explicitly refuses to guess its affiliate network, because the README notes
-- several programs have migrated. A guessed rate is worse than a blank one: a
-- blank one gets looked up, a wrong one gets used.
--
-- Contact addresses start NULL too. They are personal or role-based addresses
-- that change, and inventing `affiliates@<domain>` is a guess that will bounce.
-- See docs/AFFILIATE.md for the outreach procedure.

CREATE TABLE IF NOT EXISTS affiliate_outreach (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  retailer_id       INTEGER NOT NULL REFERENCES sourcing_retailers(id) ON DELETE CASCADE,

  -- Where the program actually is. A retailer can run several, and can run the
  -- same one through a different network than it used to. One network per
  -- retailer is a deliberate simplification; network_notes carries the rest
  -- rather than losing it.
  network           TEXT,

  -- Commission snapshot. NULL means "not yet looked up", which is honest and
  -- actionable. Never a default like 0 or 5.
  commission_rate_pct     REAL CHECK (commission_rate_pct IS NULL OR commission_rate_pct >= 0),
  cookie_window_days      INTEGER CHECK (cookie_window_days IS NULL OR cookie_window_days >= 0),
  -- The date a human last confirmed the above against the network's own site.
  terms_verified_on       TEXT,

  -- Outreach state machine. 'not_contacted' is the honest starting point for all
  -- eight retailers today.
  outreach_status   TEXT NOT NULL DEFAULT 'not_contacted'
    CHECK (outreach_status IN (
      'not_contacted',    -- nobody has done anything yet
      'researched',       -- program found and documented, not yet applied
      'applied',          -- application submitted
      'approved',         -- accepted, links work
      'rejected',         -- declined; network_notes says why
      'contacted',        -- emailed directly, awaiting reply
      'declined_contact'  -- no reply / no route to contact
    )),

  applied_on        TEXT,
  approved_on       TEXT,
  -- Where the application was submitted. Many run through a network portal
  -- rather than the retailer directly, and knowing which makes a rejection
  -- diagnosable.
  application_url   TEXT,
  contact_email     TEXT,
  contact_method    TEXT,   -- 'network_portal' | 'email' | 'affiliate_page' | 'phone'
  last_contacted_on TEXT,

  -- Why this retailer matters and what we would say to them. Written before the
  -- email: retailers approve outreach that argued a specific case, not one that
  -- asked to join a list.
  pitch_notes      TEXT,

  -- Anything that would change the answer: a migration, a closed programme, a
  -- requirement we cannot meet.
  network_notes    TEXT,

  source_url       TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per retailer. A retailer tracked in two networks is a notes problem,
-- not a second row: duplicate rows would make "how many programs are we in"
-- answerable two different ways at once.
CREATE UNIQUE INDEX IF NOT EXISTS ux_affiliate_outreach_retailer
  ON affiliate_outreach(retailer_id);

-- The reporting question is "what do I do next", which is almost never
-- "everything with outreach_status = 'not_contacted'".
CREATE INDEX IF NOT EXISTS ix_affiliate_outreach_status
  ON affiliate_outreach(outreach_status);
-- Shows the join that makes this worth having: a retailer that is APPROVED but
-- has no store ID cannot tag a link, so commission silently never happens. That
-- mismatch is invisible in either table alone.
--
-- `next_step` is the single column worth putting on a dashboard.
CREATE VIEW IF NOT EXISTS affiliate_outreach_status AS
SELECT
  m.slug                              AS retailer_slug,
  m.name                              AS retailer_name,
  o.outreach_status,
  o.network,
  o.commission_rate_pct,
  o.cookie_window_days,
  o.terms_verified_on,
  o.application_url,
  o.last_contacted_on,
  r.affiliate_status                  AS recorded_program_status,
  r.network_store_id,
  -- An approved program is not a working link. Both halves are needed.
  CASE
    WHEN o.outreach_status = 'approved' AND r.network_store_id IS NULL
      THEN 'approved but no store id - links are UNTAGGED, no commission'
    WHEN o.outreach_status = 'approved' AND r.network_store_id IS NOT NULL
      THEN 'approved and tagging'
    WHEN o.outreach_status = 'applied'
      THEN 'awaiting decision'
    WHEN o.outreach_status = 'rejected'
      THEN 'rejected - see network_notes'
    WHEN o.outreach_status = 'researched'
      THEN 'documented, not yet applied'
    WHEN o.outreach_status = 'contacted'
      THEN 'emailed, awaiting reply'
    WHEN o.outreach_status = 'declined_contact'
      THEN 'no route to contact - try the network instead'
    ELSE 'no outreach yet'
  END                                 AS next_step
FROM affiliate_outreach o
JOIN sourcing_retailers r ON r.id = o.retailer_id
JOIN manufacturers m       ON m.id = r.manufacturer_id;