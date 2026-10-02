---
proposal: local-shop-directory
title: Local shop directory from the ATF FFL licensee list
derived_from: tasking/completed/ui-research/KNOWLEDGE.md
evidence: "A numbers product's most important design decision is how it renders we do not know. This project's dominant data state is absent: six dimensional columns are 0/229 populated. A design that has no vocabulary for absence renders a blank cell, and a blank cell is read as 0."
shape: research
priority: highest
write_set:
  - tasking/completed/local-shop-directory/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-schema-and-licence.md
  - 02-license-type-meaning.md
  - 03-data-model.md
---

## Why

The owner asked for a location function so users can find nearby gun shops for ammo and reloading supplies. This is the cheapest and most authoritative source available, and it is free: the ATF publishes a complete, PUBLIC DOMAIN listing of every federal firearms licensee in the US, updated MONTHLY, with name, street address, city, state, zip, and a licence type that separates a dealer (01), a pawnbroker (02) and a RELOADER (06). That last one is the key: type 06 is legally a reloading business, a far better filter for this site than any hand-assembled directory. Verified at catalog.data.gov dataset 4092, publisher ATF Open Data, accessLevel public, accrualPeriodicity R/P1M, contact atfopendata@atf.gov.

## Scope

- Fetch and profile the ATF FFL dataset. Report the EXACT schema: every column name, the licence type codes and their meanings, and the row count. Do not summarise from the catalogue page - download the file and read it.
- Determine which licence types are relevant. Type 06 (reloader) is the strongest signal for reloading supplies; 01 (dealer) covers retail; 02 (pawnbroker) implies some gunsmithing. Say what each implies and what it does NOT - a 01 does not necessarily sell ammunition, and an 06 does not necessarily have a storefront.
- State the staleness honestly. The catalogue entry lists December 2021 data with a September 2025 update timestamp. Determine the real currency of the file before anything depends on it, because a shop that closed two years ago is worse than no shop.
- Establish the licence position explicitly. It is a US federal government work in the public domain, but record the attribution requirement and any restriction ATF states, because we still cite the source.
- Specify the geographic index. The owner asked for a location lookup, so state whether the data carries latitude/longitude or is street address only. That decides whether distance-sort is possible at all, and it must be answered before any design is proposed.
- Design the data model for a local shop record, including what we do NOT know and how absence is marked. A shop with no recorded hours must not render as open 24 hours.

## Do not

- Do not build the feature. Produce the specification, the schema report and the licence position. A human implements.
- Do not scrape or geocode anything. Reading the file the publisher provides is not scraping.
- Do not add a storefront, phone or hours field from any source other than this dataset. If hours are found elsewhere, record them as a separate clearly-labelled source - never merge unverified attributes into an authoritative record.
- Do not claim a listed business currently sells ammunition. The FFL list says a licence exists, not what is on the shelf.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
