-- Apex AMC :: 002 - Published data sources (manuals)
--
-- Split out ahead of the seed (003) so that seed can populate it. D1 runs
-- migrations in filename order, so a table must be created in an earlier file
-- than the one that inserts into it.

-- Data Sources / Manuals (Attribution & Compliance).
-- `recipes.source_id` is NOT NULL, so no load data can exist without provenance.
CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    edition VARCHAR(50),
    publication_year INTEGER,
    url TEXT,
    UNIQUE(name, edition)
);
