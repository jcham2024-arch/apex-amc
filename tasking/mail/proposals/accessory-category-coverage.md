---
proposal: accessory-category-coverage
title: Which accessory categories we have no data for at all
derived_from: tasking/pending/range-bag-inventory-spec
evidence: "The owner named the domains: guns, gun parts, scopes, gun accessories, range bags, range-bag contents, and where to get each. This task asks the question none of the others will: **which of those do we have nothing on, and which gap matters most?** A coverage matrix is worth more than another catego"
shape: research
priority: medium
write_set:
  - tasking/completed/accessory-category-coverage/
required_outputs:
  - 01-coverage-matrix.csv
  - 02-priority-gaps.md
  - REPORT.md
---

# Proposal: Which accessory categories we have no data for at all

## Why this is here

The owner named the domains: guns, gun parts, scopes, gun accessories, range
bags, range-bag contents, and where to get each. This task asks the question none of the
others will: **which of those do we have nothing on, and which gap matters most?**

A coverage matrix is worth more than another category, because it tells the task author
where to point the next hour.

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
