---
proposal: review-evidence-sources
title: Which video and forum sources are worth citing for gear
derived_from: tasking/review/DERIVED-VALUES.md
evidence: "The owner approved using videos as evidence for review-derived values. That only works if we know which sources are worth citing, because the whole value rests on the citation. **This task produces the source-quality rules the other research tasks depend on.**"
shape: research
priority: medium
write_set:
  - tasking/completed/review-evidence-sources/
required_outputs:
  - 01-source-taxonomy.md
  - 02-channel-assessment.csv
  - 03-what-reviewers-notice-that-marketing-does-not.md
  - REPORT.md
---

# Proposal: Which video and forum sources are worth citing for gear

## Why this is here

The owner approved using videos as evidence for review-derived values. That
only works if we know which sources are worth citing, because the whole value rests on the
citation. **This task produces the source-quality rules the other research tasks depend
on.**

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
