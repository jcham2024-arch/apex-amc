---
proposal: ffl-file-retrieval
title: "One human downloads the ATF FFL file, so the schema stops being a guess"
derived_from: tasking/completed/local-shop-directory/KNOWLEDGE.md
evidence: "Every atf.gov endpoint returns HTTP 403 to this environment, including the site root... So: column list, row count, and lat/long presence are UNVERIFIED. They stay blank."
shape: change
priority: high
write_set:
  - data/seeds/ffl_licensees.csv
  - data/schemas/ffl_licensees.yaml
  - tasking/completed/ffl-file-retrieval/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
---

## The blocker

`local-shop-directory` was asked to *"download the file and read it"* and could not:

```
403  https://www.atf.gov/
403  https://www.atf.gov/firearms/listing-federal-firearms-licensees/
403  https://www.atf.gov/files/downloads/ffl-atf-latest-ffl.zip
```

**The catalogue's own download link is also dead** — the ArcGIS dataset ID
`e7a13c9919314e51b240031e697ae095` is not a valid item; the API returned **HTTP 200 with a
458-byte HTML error page.**

**So an unattended agent cannot close this, and no amount of further research will.** It
requires a browser session.

## Why this is `shape: change`

The download is a human action with two unknown outcomes attached: **what the real content
date is**, and **whether the file carries lat/long**. Both decide whether the feature is
buildable, and **neither can be guessed** — a plausible schema assembled from secondary
sources would be built into a pipeline and discovered wrong later.

## What it should produce

1. **The file, downloaded by a human**, with its real content date recorded.
2. **The exact schema** — every column name, in order, with types and a sample row.
3. **Whether `lat`/`long` exist.** This is the gate on distance-sort: with them, it is a
   client-side haversine; without them, the UI degrades to state-filter and the owner
   should know that before designing anything.
4. **Whether a licence-status or expiry field exists.** If it does, the "shop closed two
   years ago" failure mode is partly removable — **the single most valuable unknown here.**
5. **The licence-type codes as they actually appear** (they may carry suffixes, and the
   codes in circulation are not guaranteed to match the typology).
6. A schema YAML and a seed, following the repo's existing pattern.

## Why it is high priority

**Three separate `highest` and `high` decisions are downstream of this one file**, and
each is currently blocked on it:

| Downstream | Blocked on |
|---|---|
| Whether to build the local-shop feature at all | The real content date |
| Distance-sort vs state-filter | lat/long presence |
| Whether closures can be detected | A status/expiry field |

**And the honest headline: the content date may settle the whole question.** `R/P1M`
monthly against content described as **December 2021**, today **3 Oct 2026**. **If the file
really is 2021, the honest feature is a historical archive, not a live directory** — and
that is a product decision the owner should make deliberately rather than discover.

## What I did NOT do

- **Did not scrape or geocode.** Only the publisher's own download URLs.
- **Did not reconstruct the schema from secondary sources.** **This is the important
  one.** A confident-looking schema is the failure mode this repo exists to prevent, and
  it would be more dangerous than no schema because it looks done.
- **Did not assert public domain.** The catalogue states `accessLevel: public`, not a
  licence grant.

## What would break

**Nothing.** New seed and schema files, plus a completed folder. **The risk is the inverse
of breakage: if this is skipped, someone builds a directory on guessed column names.**