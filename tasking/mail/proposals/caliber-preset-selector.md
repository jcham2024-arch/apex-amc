---
proposal: caliber-preset-selector
title: A searchable caliber dropdown covering every cartridge we hold
derived_from: tasking/completed/ammoseek-coverage/KNOWLEDGE.md
evidence: "Always alias-normalise before claiming a caliber gap. This took a ten-line script. A normaliser that only tests one direction will quietly merge distinct cartridges, and that is the failure that hides real differences."
shape: research
priority: highest
write_set:
  - tasking/completed/caliber-preset-selector/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-selector-spec.md
  - 02-search-and-alias-rules.md
  - 03-unknown-state.md
  - 04-a11y-options.md
---

## Why

The owner asked for all caliber presets and said a dropdown beats a set of buttons. A dropdown over 229 cartridges is unusable without search, and search is where the alias problem lives: our names are abbreviated (9 Luger, .22 LR, .223) while users type what they know.

## Scope

- Specify the selector precisely: type-ahead matching, keyboard navigation, ARIA combobox semantics, and what happens on a cartridge with no data. That last one matters most - 6 dimensional columns are 0/229, so almost any selection lands on a mostly-empty record and the selector must not pretend otherwise.
- Define the UNKNOWN state before the known one, per ui-research: a blank reads as zero. Specify what shows when a cartridge has no dimensions, no powder data and no load data. This is the most important part of the task.
- Specify search across aliases WITHOUT merging distinct cartridges. Define what must not be merged and give real near-collisions from our own dataset, not invented ones.
- Say how the list stays current. It comes from data/seeds/cartridge_specs/*.csv and the family-defect audit is still in flight - state how the selector behaves while that is unresolved.
- Note the a11y trade-off: this replaces buttons, and a native <select> over 229 options has no search. Compare native select, custom combobox and datalist, and recommend one with reasons.

## Do not

- Do not edit apps/website/. Produce the specification.
- Do not normalise any stored cartridge name. That is a data migration and a human decision.
- Do not design the selector without specifying the empty state. A selector over mostly-empty records that looks fine with full data is the defect ui-research already found once.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
