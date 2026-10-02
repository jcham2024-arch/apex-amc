---
proposal: cartridge-family-audit
title: Cartridges whose family disagrees with their name
derived_from: tasking/completed/ammoseek-coverage/KNOWLEDGE.md
evidence: "9 Luger sits in data/seeds/cartridge_specs/rifle.csv with family=rifle. So does .22 LR. A real defect, not yet fixed - it was outside this task's write-set. Family drives presentation and filtering, so the most-searched cartridge on the index is currently in the wrong bucket."
shape: research
priority: high
write_set:
  - tasking/completed/cartridge-family-audit/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-family-defects.csv
  - 02-blast-radius.md
  - 03-proposed-fix.diff
---

## Why

A completed task found 9 Luger and .22 LR filed under rifle.csv with family=rifle, and called it a real defect it could not fix because it was outside its write-set. Family drives presentation and filtering, so the most-searched cartridge on the index is in the wrong bucket.

## Scope

- Enumerate EVERY cartridge in data/seeds/cartridge_specs/*.csv whose family disagrees with its name. Not just the two known cases - find them all.
- For each: file, name, declared family, what the name implies, and the evidence for the correct family.
- Flag any case where the correct family is genuinely ambiguous, and say so rather than picking one.
- State the blast radius: which parts of the app read family, and what visibly breaks for a user who filters by it.
- Produce the exact rows to change as a diff an owner can apply. Do not apply it.

## Do not

- Do not edit data/seeds/. Produce the diff; a human applies it.
- Do not rename cartridges to match their file while you are there. Name normalisation is a separate task with its own over-merge risk.

Seeded by `scripts/tasking/seed-wave1.mjs` from `wave1.spec.json`, which holds the
same record as the task manifest. Neither was hand-typed, so they cannot drift apart.
