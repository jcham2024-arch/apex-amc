---
proposal: retailer-affiliate-coverage-audit
title: "Measure how many of our 16 retailers are actually reachable through an affiliate network — the gate on the price feature"
derived_from: tasking/completed/retailer-price-data-options/KNOWLEDGE.md
evidence: "I do not know how many of our 16 retailers are actually in a network we can join. That is not a gap I could close without breaking prohibits[], and closing it by scraping would be exactly the mistake this task exists to evaluate."
shape: change
priority: high
write_set:
  - data/seeds/sourcing_retailers.csv
  - tasking/completed/retailer-affiliate-coverage-audit/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-coverage-matrix.md
---

## The finding

`retailer-price-data-options` recommended an affiliate-network feed as the only sanctioned
route to retailer pricing — and then found that **the precondition is unmeasured.**

> "**If coverage is thin, the right answer is not to build the feature.** I would rather
> say that plainly now than have someone build a price display over two retailers."
> — `tasking/completed/retailer-price-data-options/REPORT.md` §5

Measured state of `data/seeds/sourcing_retailers.csv`, **16 rows**:

| Column | Value across all 16 rows |
|---|---|
| `affiliate_network` | **EMPTY on every row** |
| `network_store_id` | **EMPTY on every row** |
| `feed_format` | **`unknown` on every row** |
| `scraping_status` | **`unknown` on every row** |

**So the price feature is gated on a number nobody has.** Four columns, sixteen rows, all
empty. **This is not a data-cleanup chore — it is the go/no-go input for a `highest`
priority feature.**

## Why it is `shape: change`

Answering it requires **an affiliate account**, and possibly per-merchant approval.
That is a human action with commercial terms attached — commission rates accepted,
network agreements signed. **No agent can do this, and an agent that guessed would be
inventing retailer affiliations, which is the exact failure
`apps/website/src/data/retailers.js` exists to prevent.**

## What it should produce

A 16-row matrix, one row per retailer, each with:

| Field | How it gets filled |
|---|---|
| `affiliate_network` | From the network's own merchant directory, or the account |
| `network_store_id` | The ID the network assigns us |
| `feed_format` | The feed format that network publishes for that merchant |
| `commission` | The rate **we actually agreed to**, not a published range |
| `coverage verdict` | usable / not-usable / unknown — **and `unknown` is a valid answer** |

## Why this is the right next task

**It is the cheapest possible way to kill or confirm a feature the owner wants.** One
account application produces the answer, and it may well be "only 3 of 16." **That is
worth knowing before anyone designs the display, the schema, or the staleness UI.**

It also unblocks a second thing: **`ui-research` concluded the price display needs the
provenance/unknown-state vocabulary, and that work is already done and staged.** If
coverage is thin, both pieces of work correctly stop.

## What I did NOT do

- **Did not fill any of the four columns.** They stay empty. Filling them from research
  would be inventing affiliations.
- **Did not apply to any affiliate network** — that is a commercial action for the owner.
- **Did not build a price display.** `prohibits[]` withheld it, and coverage is the
  precondition that is still open.

## What would break

**Nothing.** It writes to seed columns that are already empty, and to its own completed
folder. The risk is the opposite of breakage: **if this task is skipped, someone builds a
price feature over an unknown number of retailers.**

**And the `unknown` outcome is a success, not a failure.** A task that returns "3 of 16"
has saved more work than one that returns a working scraper.