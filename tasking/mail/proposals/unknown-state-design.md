---
proposal: unknown-state-design
title: Design the unknown state before the known state
derived_from: tasking/completed/ui-research/KNOWLEDGE.md
evidence: "an em-dash is not an adequate unknown marker. The em-dash reads as zero to anyone scanning a column. The slot must carry a word."
shape: research
priority: high
write_set:
  - tasking/completed/unknown-state-design/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-unknown-state-spec.md
  - 02-surface-inventory.md
---

## Why

Six dimensional columns are 0/229 populated. A design with no vocabulary for absence renders a blank cell, and a blank cell reads as zero. That is a silent data error, and it is invisible to every test that checks for rendering failures.

## Scope

- Specify the unknown state for every data surface in the product: which components render data, and what each shows when the value is absent.
- State the vocabulary. An em-dash is explicitly ruled out; propose and justify what replaces it.
- Distinguish not-recorded from not-applicable from unknown-to-us from restricted-by-licence. Four different absences; one marker collapses them wrongly.
- Check docs/mockups/_tokens.css and the mockups before designing anything - they may already have solved part of it.
- Note the related defect: one accent colour currently marks both interactive elements and positive results, so this-is-good-news and click-me cannot be told apart.

## Do not

- Do not edit apps/website/. Produce the specification; a human implements it.
- Do not design the populated-data presentation until the empty case is specified. That ordering is the finding.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
