---
proposal: retailer-price-data-options
title: How to get retailer pricing - feeds, APIs, and why not scraping
derived_from: apps/website/src/data/retailers.js
evidence: "That combination is the single highest-risk thing on the site, for reasons that have nothing to do with taste: FTC Endorsement Guides (16 CFR 255.5) require a material connection to be disclosed, but disclosure only cures an endorsement; it does not make an unsupported endorsement true."
shape: research
priority: highest
write_set:
  - tasking/completed/retailer-price-data-options/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-feed-and-api-options.md
  - 02-scraping-legality.md
  - 03-staleness-and-display.md
  - 04-recommendation.md
---

## Why

The owner asked for scripts that search vendor websites so the site can display what they have and at what price. That goal is legitimate but the obvious implementation - scrape the storefronts - is the wrong one and probably unlawful. This task finds the lawful routes and prices them. It matters that our own retailers.js already reasons carefully about FTC endorsement rules, so a pricing feature must not undo that work.

## Scope

- Research the lawful routes and say what each costs and requires. Known to exist: AmmoSeek publishes a public XML feed specification for retailers and runs an affiliate network; Gunfinder and DOPE both publish feed specifications; Impact, Awin and AvantLink are affiliate networks carrying firearms-adjacent merchants. For each state: what data it gives, whether price and stock are included, the cost to join, and whether it needs the merchant's participation.
- State the terms-of-service position on scraping retailer storefronts, concretely and with sources. ToS is not scraping etiquette - a site that prohibits automated access in its ToS is prohibiting it in law in most jurisdictions. Include the CFAA and hiQ v LinkedIn, and state plainly whether a retailer can revoke permission for content we link to commercially.
- Quantify staleness, because it is the strongest technical argument against scraping and the owner should see a number not an opinion. A scraped price is a snapshot. How long is it true? What does a price look like to a user an hour, a day and a week after capture? What must the UI say for a price of unknown age not to mislead?
- Assess the affiliate-network route as the recommended path and state what we give up: commissions, and dependency on one intermediary. Say whether a zero-cost route exists.
- Recommend ONE approach with reasoning, and state what would change the recommendation. A recommendation without a falsifier is an opinion.

## Do not

- Do not write a scraper. Do not fetch a retailer storefront to test whether scraping works - that is the action this task exists to evaluate, and doing it to find out would repeat the mistake.
- Do not give legal advice. Cite what the terms say and what the case law holds; say plainly when it is unsettled.
- Do not recommend a price display until the staleness and ToS questions are answered. A price shown without provenance and age is a claim we cannot substantiate.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
