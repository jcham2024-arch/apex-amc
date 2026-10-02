---
proposal: name-normaliser-spec
title: Two-way cartridge name normaliser
derived_from: tasking/completed/ammoseek-coverage/KNOWLEDGE.md
evidence: "A normaliser that only tests the first direction will quietly merge distinct cartridges, and that is the failure that hides real differences."
shape: research
priority: medium
write_set:
  - tasking/completed/name-normaliser-spec/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-rules.md
  - 02-test-corpus.csv
---

## Why

A coverage comparison run on raw strings manufactures gaps out of abbreviations. The normaliser must be tested in both directions: does it find cartridges naive matching called absent, and does it keep genuinely different cartridges apart.

## Scope

- Specify the normalisation rules, and for each state whether it can over-merge or under-match. Both are defects and they are not symmetrical.
- Build a test corpus with expected outcomes in BOTH directions: under-match cases that abbreviations caused naive matching to miss, and over-merge cases that must stay separate.
- The over-merge corpus must include real near-collisions in this dataset. Find them rather than inventing them.
- State where normalisation is safe to apply and where it is not. Never silently normalise a stored name.

## Do not

- Do not implement the normaliser. Produce the rules and the test corpus.
- Do not rename or rewrite any stored cartridge name. That is a data migration and a human decision.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
