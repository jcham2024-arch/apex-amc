---
proposal: ballistics-surface-spec
title: Make the ballistics module reachable from the main page
derived_from: tasking/completed/exterior-ballistics/REPORT.md
evidence: "A numbers product's most important design decision is how it renders we do not know."
shape: research
priority: medium
write_set:
  - tasking/completed/ballistics-surface-spec/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-module-surface.md
  - 02-reachable-inputs.md
  - 03-limits-and-refusals.md
---

## Why

The owner asked for the ballistics module to be accessible from the main page. Today packages/ballistics-core is a library with 7 test files and no user-facing entry: the site has a cost calculator but no trajectory or zeroing surface at all. This specifies the entry point rather than building it.

## Scope

- Inventory what packages/ballistics-core actually exposes and what each function needs as input. Several require a full BallisticProfile, which a visitor will never have - state which surfaces are genuinely reachable by a first-time visitor and which are not.
- Specify the entry point on the page: what the user sees, what they input, and what comes out. Identify the smallest useful slice - the exterior-ballistics verdict is that these are the measurements dispersion.ts already makes correctly: group size, sigma, cep50, extremeSpread, and which axis a group is elongated on.
- State honestly what this module CANNOT do. shot-group-taxonomy established that naming a shooter fault from a target photo is unsafe and unsourced, that no confidence percentage exists anywhere, and that centreOfImpact is the mean of the shots taken so any threshold rule fires on sampling noise without a standard error. The surface must not imply it can diagnose anything.
- Address the same unknown-state rule: a trajectory result computed from a 0/229 dimensional record is meaningless, and the surface must refuse or label it rather than render a confident number.
- Specify how it links to the cost calculator, since the owner's stated intent is a user arriving to decide what to build, how, and where to buy the parts.

## Do not

- Do not build the surface. Produce the specification.
- Do not design any shooter-fault diagnosis, confidence percentage, or threshold rule. shot-group-taxonomy records that a named instructor calls target-photo fault diagnosis the most misused tool in the training industry, and that no diagnostic accuracy figure exists in any source retrieved.
- Do not compute a charge weight, powder constant, or pressure figure.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
