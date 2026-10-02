-- Apex AMC :: 013 - Sourcing / where to buy (component finder backend)
--
-- WHAT THIS IS FOR
-- ----------------
-- The product has a "component finder": the user picks what they need
-- (a .308 Win 168gr VLD bullet, a can of H335, Federal 210 primers, a
-- reloading brass case) and gets back places they can actually obtain it,
-- with a link or directions.
--
-- The schema already had `manufacturers` rows with kind='retailer', a
-- `products` table and append-only `price_observations`. None of it can
-- answer that question yet, for four concrete structural reasons:
--
--   1. `products.cartridge_id` is NOT NULL. Every product row must belong to a
--      cartridge, so a can of Hodgdon H335 or a box of CCI #41 primers has
--      nowhere to live. Components that are not cartridge-specific - which is
--      most of what a reloader buys - cannot be listed at all.
--   2. `bullets` and `powders` have no `slug`. Only `products` and
--      `cartridges` do. A finder result needs a stable, shareable key for the
--      thing being searched for, and there is not one for the two tables that
--      matter most.
--   3. A retailer is currently just a `manufacturers` row with a website.
--      There is nowhere to record WHICH affiliate network it belongs to, the
--      site's own product-ID scheme, whether it ships to the user, or whether
--      it has a data feed. Those are exactly the fields that make link
--      generation automatic instead of hand-typed per product.
--   4. "Available at" is not the same as "priced at". `price_observations` is
--      append-only and requires a price, which is right for tracking but wrong
--      for a curated list of known sources. Many sources have no scrapeable
--      price at all - a gun shop down the road, a mail-order house that
--      blocks bots, a manufacturer that only sells direct.
--
-- So this file adds the missing vocabulary WITHOUT changing the existing
-- tables' semantics, and without deciding anything about affiliate programs.
--
-- ---------------------------------------------------------------------
-- DESIGN DECISION: the finder is keyed on a *search target*, not a product.
-- ---------------------------------------------------------------------
-- `sourcing_searches` is "a thing a user wants to find", which may be:
--   - a specific SKU we know the part number for (best case: deep link),
--   - a component family where we only know maker + line (common: "H335"),
--   - a local shop where the answer is directions, not a URL.
--
-- A retailer listing is then how confidently we know that source carries it.
-- This is deliberately more honest than a single availability boolean, and it
-- lets the UI be honest too: "confirmed in stock Tuesday" and "they usually
-- stock this, check the site" are different claims, and a finder that flattens
-- them into one green tick is lying to a shooter.
--
-- ---------------------------------------------------------------------
-- AFFILIATE-READINESS, DELIBERATELY NOT AFFILIATE LOGIC
-- ---------------------------------------------------------------------
-- The brief was explicit: set the database up so affiliate tagging is easy
-- later, but do not build the affiliate programs yet. So this file stores the
-- three facts any tagging scheme needs - network, account identifier, and a
-- URL template - and stops there.
--
-- `sourcing_retailers.link_template` holds a DEEP LINK TEMPLATE with
-- placeholders, e.g.
--     https://www.brownells.com/catalog/ProductFeed/PDFR.cfm?item={sku}
-- and `affiliate_network` + `network_store_id` record where the tag goes.
-- Nothing here appends a tag, resolves a placeholder, or knows any network's
-- query-string format. A `buildOutboundUrl()` helper in the application layer
-- does that later, driven entirely by these columns. The consequence is that
-- turning affiliate tagging on is a code change in ONE place, not a data
-- migration across every product row.
--
-- `affiliate_*` columns are all nullable and unvalidated on purpose. Several
-- retailers on the target list have migrated programs (AvantLink to Impact or
-- Partnerize) and the brief says not to worry about it yet, so the schema
-- must not encode a network we have not confirmed. An unconfirmed network is
-- NULL, not a guess.

-- ---------------------------------------------------------------------------
-- 1. Retailer profile
-- ---------------------------------------------------------------------------
-- The 8 retailer rows already seeded in 003 (kind='retailer') are referenced
-- from here. A separate table rather than more columns on `manufacturers`,
-- because commerce metadata is only meaningful for sellers, and because the
-- component directory and the retailer directory have genuinely different
-- lifecycles.

CREATE TABLE IF NOT EXISTS sourcing_retailers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer_id INTEGER NOT NULL UNIQUE REFERENCES manufacturers(id) ON DELETE CASCADE,

    -- How the finder should present this source. Drives the CTA wording and
    -- whether we show a link, a phone number, or a map.
    source_type     TEXT NOT NULL DEFAULT 'online'
                    CHECK (source_type IN ('online', 'local_shop', 'manufacturer_direct',
                                           'marketplace', 'dealer_locator', 'out_of_stock_house')),

    -- ---- fulfilment, so the finder can filter before the user clicks ----
    ships_domestically  INTEGER CHECK (ships_domestically IN (0, 1)),
    -- ISO region codes, comma separated. Empty = not yet researched, which is
    -- meaningfully different from 'ships nowhere'.
    ships_to_regions TEXT,
    -- Some houses will not ship certain goods at all, or only to a locker.
    hazmat_shipping  INTEGER CHECK (hazmat_shipping IN (0, 1)),

    -- ---- discovery: how the user finds this source ----
    -- Free-text instructions, NOT a structured address table. A finder result
    -- is "Kays Outfitters, 3 miles from you, open Tue-Sat" - a sentence
    -- assembled from several facts, and over-modelling a shop's address would
    -- not make it any more accurate.
    directions       TEXT,
    address_summary  TEXT,
    city             TEXT,
    region_code      TEXT,          -- 'US-TX'
    postal_code      TEXT,
    phone            TEXT,
    latitude         REAL,
    longitude        REAL,

    -- ---- commerce / affiliate readiness (see header) ----
    affiliate_network  TEXT,        -- 'avantlink' | 'impact' | 'partnerize' | NULL
    network_store_id   TEXT,        -- the publisher's store ID within that network
    -- Deep-link template with {sku} / {search} placeholders. NULL means "we
    -- only have the homepage", which the finder must handle by linking the
    -- site root rather than pretending to have a product URL.
    link_template      TEXT,
    -- Does the retailer expose a product feed we could poll? Recorded now so
    -- the answer is known even before anything is built.
    feed_url           TEXT,
    feed_format        TEXT CHECK (feed_format IS NULL OR feed_format IN ('csv', 'xml', 'json')),

    -- Program status. Deliberately coarse: the brief says do not work on
    -- affiliate programs yet, but the finder still needs to know whether a
    -- link is safe to feature, and 'unknown' must be distinguishable from
    -- 'none'.
    affiliate_status  TEXT NOT NULL DEFAULT 'unknown'
                      CHECK (affiliate_status IN ('unknown', 'none', 'applied',
                                                  'approved', 'rejected', 'not_applicable')),

    -- Does the site permit automated retrieval? Recorded per retailer because
    -- it varies, and a blocked site must be an explicit recorded decision
    -- rather than an accident. See docs/AGENT-HANDOFF.md Lane 4: a retailer
    -- that blocks bots is `unsupported`, and that is a supported outcome.
    scraping_status   TEXT NOT NULL DEFAULT 'unknown'
                      CHECK (scraping_status IN ('unknown', 'allowed', 'robots_permits',
                                                  'blocked', 'unsupported', 'no_feed')),
    robots_url        TEXT,

    -- Editorial
    notes            TEXT,
    source_url       TEXT,
    -- Deliberately NOT a price and NOT a trust score. A hand-assigned 'good
    -- store' rating is opinion presented as data; see the 011 precedent where
    -- confidence and agreement_level are explicit and constrained instead.
    is_featured      INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sr_type     ON sourcing_retailers(source_type);
CREATE INDEX IF NOT EXISTS idx_sr_region   ON sourcing_retailers(region_code);

-- ---------------------------------------------------------------------------
-- 2. Search target
-- ---------------------------------------------------------------------------
-- "A thing a user wants to find." This is the row the finder's search box
-- resolves to, and the row a shareable URL points at.
--
-- WHY THIS IS NOT `products`
-- --------------------------
-- `products` requires a cartridge and describes a specific loaded round. A
-- powder, a primer, a can of bullets, and a box of brass are all findable and
-- none of them is cartridge-bound. Rather than force them into a table whose
-- every column assumes a loaded cartridge - or nullable the FK and break the
-- existing catalogue grid - this is a separate, deliberately loose table. It
-- answers "what is the user looking for", which `products` does not.
--
-- The (entity_type, entity_slug) pair points at the real component when we
-- have one, and `search_terms` carries the human-facing query when we do not
-- (a shop-only item, or a product we know by name but have no row for).
--
-- `entity_type` mirrors the vocabulary used by `value_provenance` (012) so one
-- lookup helper can resolve a slug across the whole project.

CREATE TABLE IF NOT EXISTS sourcing_searches (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    slug          TEXT NOT NULL UNIQUE,      -- 'h335', 'sierra-168-vld'

    -- What the user asked for. Nullable because a shop-only item may have no
    -- component row to point at.
    entity_type   TEXT CHECK (entity_type IS NULL OR entity_type IN
                       ('cartridge', 'bullet', 'powder', 'primer', 'brass',
                        'ammo', 'product', 'shotshell')),
    entity_slug   TEXT,

    -- Free-text fallback and the literal query handed to a retailer's search
    -- box. A retailer deep link needs a real search string far more often than
    -- it needs a SKU, so this is a first-class column, not an afterthought.
    display_name  TEXT NOT NULL,             -- 'Hodgdon H335 rifle powder'
    search_terms  TEXT NOT NULL,             -- 'H335'

    -- How precisely we know what to look for. This determines whether the
    -- finder can promise a deep link or only a site search.
    match_quality TEXT NOT NULL DEFAULT 'family'
                  CHECK (match_quality IN ('exact_sku', 'model', 'family', 'category')),

    -- The manufacturer's own product code where we know it. This is the single
    -- most valuable field for deep-linking, because it is usually stable across
    -- every retailer - Hornady item 65147 is 65147 at Brownells, Midway and
    -- Natchez. One column here saves a per-retailer mapping table later.
    manufacturer_part_number TEXT,

    -- What kind of thing this is, for filtering the finder UI without a join
    -- to five different component tables.
    category      TEXT NOT NULL
                  CHECK (category IN ('bullet', 'powder', 'primer', 'brass',
                                      'ammo', 'cartridge', 'accessory', 'other')),

    notes         TEXT,
    source_url    TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ss_category ON sourcing_searches(category);
CREATE INDEX IF NOT EXISTS idx_ss_entity   ON sourcing_searches(entity_type, entity_slug);
CREATE INDEX IF NOT EXISTS idx_ss_active   ON sourcing_searches(is_active);
CREATE INDEX IF NOT EXISTS idx_ss_terms    ON sourcing_searches(search_terms);

-- ---------------------------------------------------------------------------
-- 3. A known source for a search target
-- ---------------------------------------------------------------------------
-- The M:N edge. "H335 is available from Powder Valley" or "the Blue Bullets
-- 10-pack is at this gun shop".
--
-- `confidence` is the important column. A finder that shows one green tick for
-- "confirmed in stock", "listed but price unknown" and "we think they carry
-- these" is making three different claims with one piece of UI. The tier makes
-- the claim explicit, and mirrors the discipline of 012's `tier`.

CREATE TABLE IF NOT EXISTS sourcing_listings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    search_id     INTEGER NOT NULL REFERENCES sourcing_searches(id) ON DELETE CASCADE,
    retailer_id   INTEGER NOT NULL REFERENCES sourcing_retailers(id) ON DELETE CASCADE,

    -- How well-attested this listing is. Ordered strongest first.
    --   verified      seen on the retailer's own site or confirmed by phone
    --   listed        on their site or catalogue, stock not confirmed
    --   likely        they carry the line, not confirmed for this exact item
    --   unknown       placeholder awaiting research
    confidence    TEXT NOT NULL DEFAULT 'unknown'
                  CHECK (confidence IN ('verified', 'listed', 'likely', 'unknown')),

    -- Stock, when known. NULL and 0 are different facts: 0 means "confirmed
    -- out of stock", NULL means "we did not check".
    in_stock      INTEGER CHECK (in_stock IN (0, 1)),
    stock_checked_on TEXT,

    -- The retailer's own identifier for this item, when it differs from the
    -- manufacturer's part number. Most of the time these are the same, which
    -- is why this is nullable rather than required.
    retailer_sku  TEXT,
    retailer_url  TEXT,      -- a full deep link, when we have captured one

    price_cents   INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
    -- Snapshot, not a live value. `price_observations` is the append-only
    -- system of record for price history; this column exists so a curated
    -- listing can show "last seen at" without pretending to be a live feed.
    price_observed_on TEXT,

    -- Why we believe this. A `likely` row with no explanation is not evidence.
    note          TEXT,
    -- Where the knowledge came from: the retailer's site, a phone call, a
    -- published catalogue, a user's report. Free text because this is a
    -- human-scale annotation, not an enum the app queries.
    source_kind   TEXT CHECK (source_kind IS NULL OR source_kind IN
                       ('retailer_site', 'phone', 'catalogue', 'community',
                        'in_person', 'feed', 'manufacturer')),
    source_url    TEXT,
    -- Manual verification is an editorial act and should be attributable.
    verified_by   TEXT,
    verified_on   TEXT,

    is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),

    -- One listing per retailer per target. Re-researching updates the row
    -- rather than accumulating history; price history lives in
    -- price_observations where it is genuinely append-only.
    UNIQUE (search_id, retailer_id)
);

CREATE INDEX IF NOT EXISTS idx_sl_search   ON sourcing_listings(search_id, confidence);
CREATE INDEX IF NOT EXISTS idx_sl_retailer ON sourcing_listings(retailer_id);
CREATE INDEX IF NOT EXISTS idx_sl_active   ON sourcing_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_sl_conf     ON sourcing_listings(confidence);

-- ---------------------------------------------------------------------------
-- 4. Stable keys for bullets and powders
-- ---------------------------------------------------------------------------
-- `bullets` and `powders` are the two tables a finder searches most, and
-- neither has a `slug`. `products` and `cartridges` both do, and every
-- shareable URL and every `entity_slug` reference in 012/013 assumes one.
--
-- Added as a nullable, uniquely-indexed column rather than a backfilled NOT
-- NULL one, on purpose: a migration that invents slugs for existing rows
-- would be doing the exact thing 012 exists to prevent. The loader in
-- check-seeds.mjs populates this from the CSV going forward, and existing rows
-- stay NULL until someone has actually looked at them. `backfilled_by_script`
-- would be a lie today, so it is omitted rather than defaulted.

ALTER TABLE bullets ADD COLUMN slug TEXT;
ALTER TABLE powders ADD COLUMN slug TEXT;

-- Partial unique indexes: many rows are legitimately NULL until backfilled,
-- and a plain UNIQUE would treat all the NULLs as colliding.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bullets_slug ON bullets(slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_powders_slug ON powders(slug) WHERE slug IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Finder views
-- ---------------------------------------------------------------------------

-- THE COMPONENT FINDER QUERY.
--
-- One row per (source, target) pair, carrying everything the UI needs to render
-- a result card: what to call the source, where it is, whether it ships, how
-- sure we are, and enough to build a link.
--
-- `url_ready` tells the application layer whether it can build a deep link or
-- must fall back to the homepage / a site search. It is deliberately a flag
-- rather than a finished URL: resolving templates and applying affiliate tags
-- is application-layer work (see the header), and doing it in SQL would bake a
-- network's query-string format into the database.
CREATE VIEW IF NOT EXISTS component_finder AS
SELECT
    s.slug                AS search_slug,
    s.display_name,
    s.category,
    s.search_terms,
    s.match_quality,
    s.manufacturer_part_number,

    m.slug                AS retailer_slug,
    m.name                AS retailer_name,
    m.website             AS retailer_website,

    r.source_type,
    r.ships_domestically,
    r.ships_to_regions,
    r.directions,
    r.city, r.region_code, r.postal_code, r.phone,
    r.latitude, r.longitude,
    r.affiliate_network,
    r.affiliate_status,
    r.scraping_status,
    r.is_featured,

    l.confidence,
    l.in_stock,
    l.retailer_sku,
    l.retailer_url,
    l.price_cents,
    l.price_observed_on,
    l.source_kind,
    l.verified_on,

    -- Can the app build a real link for this pair?
    CASE
        WHEN l.retailer_url IS NOT NULL AND l.retailer_url <> '' THEN 1
        WHEN r.link_template IS NOT NULL
             AND s.manufacturer_part_number IS NOT NULL THEN 1
        WHEN r.link_template IS NOT NULL THEN 2   -- template, needs a search
        ELSE 0                                    -- homepage only
    END AS link_mode
        -- 1 = exact deep link captured
        -- 2 = buildable from template + search terms
        -- 0 = homepage only, no product link known

FROM sourcing_searches s
JOIN sourcing_listings  l ON l.search_id   = s.id  AND l.is_active = 1
JOIN sourcing_retailers r ON r.id          = l.retailer_id
JOIN manufacturers       m ON m.id          = r.manufacturer_id
WHERE s.is_active = 1;

-- The "where can I get this right now" view: only claims we would actually
-- stand behind, strongest first, de-duplicated by retailer so a target with
-- three weak rows does not bury a single verified one.
CREATE VIEW IF NOT EXISTS component_finder_verified AS
SELECT *
FROM component_finder
WHERE confidence IN ('verified', 'listed')
ORDER BY
    CASE confidence WHEN 'verified' THEN 0 ELSE 1 END,
    CASE WHEN in_stock = 1 THEN 0 ELSE 1 END,
    is_featured DESC;

-- Retailers with no sourcing profile yet. Every seeded retailer needs a row in
-- sourcing_retailers before the finder can return it, and this view is the
-- checklist for that backlog.
CREATE VIEW IF NOT EXISTS sourcing_retailer_backlog AS
SELECT m.slug, m.name, m.website
FROM manufacturers m
WHERE m.kind = 'retailer'
  AND NOT EXISTS (
      SELECT 1 FROM sourcing_retailers r WHERE r.manufacturer_id = m.id
  )
ORDER BY m.slug;

-- The affiliate-readiness summary. Deliberately a report on what we know, not
-- a claim that any program is active: `affiliate_status` defaults to 'unknown'
-- precisely because the brief says not to work on this yet.
CREATE VIEW IF NOT EXISTS sourcing_affiliate_readiness AS
SELECT
    m.slug AS retailer_slug,
    m.name AS retailer_name,
    r.affiliate_status,
    r.affiliate_network,
    r.network_store_id,
    CASE WHEN r.link_template IS NOT NULL THEN 1 ELSE 0 END AS has_link_template,
    r.feed_format,
    r.scraping_status,
    -- What is still missing before a link could be auto-tagged.
    CASE
        WHEN r.link_template IS NULL THEN 'needs link template'
        WHEN r.affiliate_network IS NULL THEN 'needs affiliate network'
        WHEN r.network_store_id IS NULL THEN 'needs store id'
        ELSE 'ready'
    END AS next_step
FROM sourcing_retailers r
JOIN manufacturers m ON m.id = r.manufacturer_id
ORDER BY next_step, m.slug;
