---
proposal: shared-library-consolidation
title: Make the shared script library real, not aspirational
derived_from: tasking/completed/code-audit/KNOWLEDGE.md
evidence: "Measured across 50 .mjs files: 14 sites re-deriving root, 9 using process.cwd(), 9 createHash call sites, 1 reimplementing RFC 4180 CSV parsing. Only 7 scripts import root. The convention is documented in check-seeds.mjs and followed by 7; the other 23 each solved a problem that was already solved."
shape: research
priority: high
write_set:
  - tasking/completed/shared-library-consolidation/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-current-counts.md
  - 02-consolidation-decisions.md
  - 03-change-sets.md
  - 04-enforcement-options.md
---

## Why

The owner's architectural principle is that all functional scripting comes from a library. scripts/shared/ has 45 exports across 5 modules and it is the right shape - but only 7 of roughly 50 scripts import it, while 15 re-derive root and 13 use process.cwd(). The library exists; the discipline does not. Until it is real, a factory would only be papering over copies.

## Scope

- Re-measure the duplication now rather than quoting the audit, which was a snapshot and has drifted - four cwd sites were fixed after it ran. A count that has drifted is worse than no count.
- For each duplication class decide consolidate-or-leave, with the reason. The 15 re-derived roots are pure consolidation. The 9 sha256 sites differ in encoding - 7 hex, 2 base64 - so a single helper must take encoding as a parameter or it will be wrong for one caller. The naive CSV splits are a WRITE path and readCsv already exists.
- Specify which helpers are MISSING rather than duplicating, and state what is deliberately NOT in the library and why, so a future agent does not 'fix' an intentional choice.
- Argue the risk in BOTH directions. A shared helper is load-bearing: a bug in readCsv corrupts every seed file, and code-audit already found import-bullets.mjs writing through a naive split. Centralising concentrates risk as well as removing duplication - say which scripts should keep their own copy and why.
- Produce ordered independent change sets with the verification command for each, so they can be approved in batches the way the low-risk fixes were.
- Name the ENFORCEMENT question and answer it: convention, lint rule, or gate? Say which and what it costs. A convention with no enforcement has already failed here - 7 of 50 follow it.

## Do not

- Do not apply any consolidation. Produce the plan and the diffs.
- Do not consolidate a helper whose callers differ in a way the signature does not capture. Encoding differences surface as wrong output, not as an error.
- Do not create a new helper for something used once. Two call sites is duplication; one is coincidence.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
