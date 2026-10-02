# BRIEF — Cost model - tax, shipping, provenance, and user override

**Task id:** `component-cost-model` · **Priority:** highest
**Grounded in:** `tasking/completed/ui-research/KNOWLEDGE.md`

## Why this task exists

The owner wants cost-per-round from real components - primer type and price, powder type and price, projectile - plus tax and shipping. None of that model exists. We hold powders with NO price and no load data: the columns are manufacturer, product_name, product_line, burn_rate_class, relative_burn_rate_position, geometry, source_url. A price is a NEW field with a NEW provenance requirement, not a value to fill in.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ui-research/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/component-cost-model tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Design the cost model as a SCHEMA, not as numbers. Every price needs: value, currency, unit (per round, per 100, per pound, per 1000), retailer, capture timestamp, and whether it is observed or user-entered. A price without a timestamp is a claim that decays silently - that is the argument against scraping, made structural.
- Specify PRIMER data, which we hold none of. Required distinctions include manufacturer (CCI, Federal, Winchester), type (standard, match, magnum, non-magnum), and magnum status specifically, because it changes the calculation and getting it wrong changes the result. Name the fields and sources. DO NOT populate it with plausible values.
- Specify tax handling. Sales tax is jurisdiction-dependent and a national average is a fiction. Say whether tax is entered by the user, looked up, or shown as a range, and be honest about which is feasible without a tax API.
- Specify shipping as an ESTIMATOR with visible assumptions, because actual shipping needs retailer data we do not have. Cover flat-rate, free-shipping threshold, weight-based and per-item. Every assumption must be visible, because a silently assumed shipping cost is an invented datum wearing a UI.
- Specify the USER OVERRIDE path. The owner wants users able to enter their own prices. Make override structurally distinct from sourced data so nobody later mistakes a typed number for an observed one. That distinction is the difference between a useful tool and a confident wrong answer.
- Define provenance end to end: how a price travels from source to screen, and what renders when the chain is incomplete.

## Do not

- Do not populate any price, primer or component value. Design the schema. A fabricated price in a cost calculator is worse than no calculator.
- Do not build the feature. Produce the specification.
- Do not scrape a retailer. Real price acquisition is owned by retailer-price-data-options; coordinate rather than duplicate.
- Do not state a national average sales tax as if it were the user's tax.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-cost-schema.md`
- `02-primer-data-spec.md`
- `03-tax-and-shipping.md`
- `04-override-and-provenance.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/component-cost-model tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.
