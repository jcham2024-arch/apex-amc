---
proposal: competitor-gap-analysis
title: Competitor teardown - features we lack
derived_from: tasking/completed/ammoseek-coverage/KNOWLEDGE.md
evidence: "Only naive string matching produces the brief's answer. Always alias-normalise before claiming a caliber gap. This took a ten-line script."
shape: research
priority: high
write_set:
  - tasking/completed/competitor-gap-analysis/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-competitor-inventory.md
  - 02-feature-gap-matrix.csv
  - 03-effort-and-write-sets.md
---

## Why

The owner asked what competitors are doing that we are not. We have partial coverage: ammoseek-coverage compared cartridge NAME coverage and found 36.30 percent of their search share is already held by us. That compared names. Nobody has compared features, calculators or the shopping experience.

## Scope

- Enumerate the competitors. AmmoSeek is already studied for coverage; find the others - gun.deals, gunammo.deals, FIREARMSDATA, reloadus, AmmoReady and whatever else carries real traffic. Record each URL and the date observed.
- For each, list what they offer that we do not, ranked by how much a user would care. Distinguish a genuine capability from a presentation difference - a prettier page is not a feature, and a feature we have but present worse is a different fix.
- State what THEY lack that we have, and say so plainly. A teardown that only finds gaps is marketing, not research, and it would mislead the owner into thinking we are behind.
- For the top five gaps, give a rough effort estimate and the write-set each would touch, so the owner can approve a batch the way the low-risk fixes were approved.

## Do not

- Do not copy a competitor's design, copy, code or layout. Record what capability exists and what problem it solves. We build our own expression of it.
- Do not scrape a competitor to measure anything. Read what they publish.
- Do not rank by what is easiest for us to build. Rank by what a user would actually notice missing.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
