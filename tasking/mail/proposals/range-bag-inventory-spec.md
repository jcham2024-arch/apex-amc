---
proposal: range-bag-inventory-spec
title: What goes in a range bag, and what it weighs
derived_from: tasking/review/PRODUCT.md
evidence: "The site's third job is *where to buy the parts*. A range bag is where a shooter discovers they need a third of what they thought, so the bag is both a purchase and a checklist. Nobody has written down what a complete one contains, or what it weighs empty."
shape: research
priority: high
write_set:
  - tasking/completed/range-bag-inventory-spec/
required_outputs:
  - 01-category-taxonomy.md
  - 02-item-list.csv
  - 03-typical-loadout-weight.csv
  - 04-sources.md
  - REPORT.md
---

# Proposal: What goes in a range bag, and what it weighs

## Why this is here

The site's third job is *where to buy the parts*. A range bag is where a
shooter discovers they need a third of what they thought, so the bag is both a purchase
and a checklist. Nobody has written down what a complete one contains, or what it weighs
empty.

## The owner asked for it directly

> Research datasets across guns, gun parts, scopes, gun accessories, range bags and
> range-bag contents, including where to get them. YouTube videos may be cited as
> evidence, and a value derived from reviews is acceptable **provided the sources
> are cited and the reasoning is written down**.

Seeded by `scripts/tasking/seed-research.mjs` from
`scripts/tasking/research-categories.spec.json`.

## What this does NOT do

- It stores no transcript. Transcripts are the creator's content; we cite the link.
- It produces no load data. Propellant and pressure figures are barred from unattended
  research entirely - see `interior-ballistics/05-feasibility-verdict.md`.
- It scrapes no retailer prices.

Every derived value carries `source_url`, `source_date` and `derivation`. See
[tasking/review/DERIVED-VALUES.md](../../../review/DERIVED-VALUES.md). A number with
no derivation attached is a fabrication and the cell stays EMPTY instead.
