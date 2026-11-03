---
proposal: component-cost-model
title: Cost model - tax, shipping, provenance, and user override
derived_from: tasking/completed/ui-research/KNOWLEDGE.md
evidence: "This project's dominant data state is absent: six dimensional columns are 0/229 populated. A design that has no vocabulary for absence renders a blank cell, and a blank cell is read as 0. That is a silent data error, invisible to every test that checks for rendering failures."
shape: research
priority: highest
write_set:
  - tasking/completed/component-cost-model/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-cost-schema.md
  - 02-primer-data-spec.md
  - 03-tax-and-shipping.md
  - 04-override-and-provenance.md
---

## Why

The owner wants cost-per-round from real components - primer type and price, powder type and price, projectile - plus tax and shipping. None of that model exists. We hold powders with NO price and no load data: the columns are manufacturer, product_name, product_line, burn_rate_class, relative_burn_rate_position, geometry, source_url. A price is a NEW field with a NEW provenance requirement, not a value to fill in.

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

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
