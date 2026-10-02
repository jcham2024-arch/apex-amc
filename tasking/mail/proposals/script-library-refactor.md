---
proposal: script-library-refactor
title: Assess script consolidation, and whether OOP factories are warranted
derived_from: tasking/completed/code-audit/KNOWLEDGE.md
evidence: "Measured across 50 .mjs files: 14 sites re-deriving root, 9 using process.cwd(), 9 createHash call sites, 1 reimplementing RFC 4180 CSV parsing. Only 7 scripts import root. The one that actually bites is process.cwd() rooting in 9 scripts, including check-docs.mjs."
shape: research
priority: high
write_set:
  - tasking/completed/script-library-refactor/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-duplication-counts.md
  - 02-oop-assessment.md
  - 03-change-sets.md
---

## Why

The owner asked for OOP factories where possible. That deserves a real answer rather than compliance. packages/ballistics-core is deliberately FUNCTIONAL - pure exported functions with no hidden state, and its 10 classes are reserved for things that genuinely have state (profiles, sources, devices). Blanket OOP there would be a regression dressed as progress. scripts/ is plain ESM Node, where a class wrapping a function is strictly worse than the function. So this produces the refactor that IS warranted and says plainly where a factory is not.

## Scope

- Count the duplication yourself rather than quoting the audit. Establish current numbers - the audit was a snapshot and four sites have since been fixed. A count that has drifted is worse than no count.
- For each duplication class decide: consolidate into shared, or leave alone. Give the reason. The 15 re-derived roots are pure consolidation with no judgement involved; the 9 sha256 sites differ in encoding (7 hex, 2 base64) so a single helper must take the encoding as a parameter or it will be wrong for one caller.
- Answer the factory question with evidence, per module. State plainly that ballistics-core's functional style is deliberate and correct for pure computation, and identify the ONE place a factory would pay: if repeated construction of a drag table or a profile object needs options validation, that is a real factory. Do not propose a factory for anything that is a pure function.
- State the actual risk of consolidation. Shared helpers are load-bearing: a bug in readCsv corrupts every seed file, and code-audit already found import-bullets.mjs writing through a naive CSV split. Argue for or against centralising; do not assume it.
- Produce ordered, independent change sets with exact file lists and a verification command for each, so they can be approved in batches the way the low-risk fixes were.

## Do not

- Do not apply any refactor. Produce the plan and the diffs.
- Do not introduce classes into pure-computation modules to satisfy a general preference for OOP. That is a regression with extra indirection, and saying so is part of the deliverable.
- Do not consolidate a helper whose callers differ in a way the signature does not capture. Encoding differences show up as wrong output, not as an error.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
