# BRIEF — How to get retailer pricing - feeds, APIs, and why not scraping

**Task id:** `retailer-price-data-options` · **Priority:** highest
**Grounded in:** `apps/website/src/data/retailers.js`

## Why this task exists

The owner asked for scripts that search vendor websites so the site can display what they have and at what price. That goal is legitimate but the obvious implementation - scrape the storefronts - is the wrong one and probably unlawful. This task finds the lawful routes and prices them. It matters that our own retailers.js already reasons carefully about FTC endorsement rules, so a pricing feature must not undo that work.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `apps/website/src/data/retailers.js`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/retailer-price-data-options tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

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

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-feed-and-api-options.md`
- `02-scraping-legality.md`
- `03-staleness-and-display.md`
- `04-recommendation.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/retailer-price-data-options tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.
