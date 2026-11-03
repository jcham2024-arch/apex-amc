---
proposal: website-design-iteration
title: Apply the accumulated UI findings to the live site
derived_from: tasking/completed/ui-research/KNOWLEDGE.md
evidence: "The affiliate disclosure currently lives in a permanent top bar and in the footer. Neither is where the decision happens. A reader choosing a retailer should see that retailer is an affiliate on the card, next to the button. A disclosure the reader must scroll back to find is not a disclosure."
shape: research
priority: high
write_set:
  - tasking/completed/website-design-iteration/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-defect-diffs.md
  - 02-csp-verification.md
---

## Why

ui-research produced a specific, verified list of defects and none are fixed, because agents cannot edit the application. Four are concrete enough to act on and none need a design decision to settle.

## Scope

- Produce a concrete diff for each of the four verified defects: move affiliate disclosure onto the retailer card adjacent to the link; add font-variant-numeric tabular-nums to live numeric fields, noting docs/mockups/_tokens.css line 17 already has it and was never ported; split the accent so action and positive-status are never the same token; and replace any em-dash unknown marker with a word.
- State precisely where each change goes, by file and line, so it can be applied without re-deriving the analysis.
- Re-run the CSP grep against your own proposed diff before submitting it. The original task's grep found 19 violations in the author's OWN first draft - inline style= attributes written while styling quickly. A check that passed on someone else's artefact failed on the one just made, and it will fail on yours.

## Do not

- Do not edit apps/website/. Produce diffs. Same rule as every other research task.
- Do not introduce an inline style attribute, a new remote origin or an icon font. The site is one self-contained HTML file under a strict CSP, and the CSP constraint is why the design is coherent.
- Do not redesign anything not on the list. This is a defect sweep, not a redesign.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
