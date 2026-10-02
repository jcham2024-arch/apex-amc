---
proposal: group-standard-error
title: Standard error for centre-of-impact rules
derived_from: tasking/completed/shot-group-taxonomy/KNOWLEDGE.md
evidence: "Before any threshold rule fires, the threshold must be expressed in units of the group's own standard error - otherwise the rule fires on sampling noise. dispersion.ts does not compute that standard error today, and no source states a threshold. This is the gap most likely to produce confident nonsense."
shape: research
priority: medium
write_set:
  - tasking/completed/group-standard-error/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-derivation.md
  - 02-small-n-behaviour.md
---

## Why

A completed task named this the gap most likely to produce confident nonsense. centreOfImpact returns the mean of the shots taken, so any threshold rule fires on sampling noise unless the threshold is expressed in the group's own standard error.

## Scope

- Derive the standard error of the mean for each axis given n shots, and state the small-n caveats. Verify numerically against synthetic groups with a known sigma.
- State what happens at low n, where the standard error itself is unreliable. A threshold based on an unstable standard error is worse than no threshold.
- Specify how many shots are needed before a threshold rule is defensible. No source states this, so derive it and label it derived, not published.
- Confirm whether dispersion.ts computes standard error today. If not, specify the function signature only. Do not implement it.

## Do not

- Do not implement anything in packages/. Produce the specification.
- Do not propose a threshold value as if it were sourced. If it is derived, label it derived.
- Do not name shooter faults. A named instructor calls target-photo fault diagnosis the most misused tool in the training industry; see the source KNOWLEDGE.md.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
