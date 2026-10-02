---
proposal: code-review-sweep
title: Adversarial review of gates, physics core, and website
derived_from: tasking/completed/code-audit/KNOWLEDGE.md
evidence: "A gate in verify can be green and verify nothing... It was eventually found - by an agent doing its own task, not by a gate."
shape: research
priority: high
write_set:
  - tasking/completed/code-review-sweep/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-gate-adversarial-review.md
  - 02-core-correctness.md
  - 03-website-findings.md
  - 04-defect-list.csv
---

## Why

code-audit found that a gate shipped with a missing brace, silently reduced it to checking one task per run, and reported success while four completed tasks sat unchecked - ESLint and node --check both passed. It was found by an agent doing its own task, not by a gate. That class of defect nothing currently catches, and a second pair of eyes is the cheapest mitigation available.

## Scope

- Review scripts/gates/ adversarially, because those are the checks everything else trusts. For each, construct an input that MUST make it fail and confirm it does. A gate you cannot break is an untested gate, and saying so is the finding.
- Hunt the loop-variable and scope defects code-audit documented, because they have now appeared three times in this repo: a missing closing brace silently truncating a loop, a const declared below the loop that calls it, and a gate that reads files when it should check deployed output.
- Review packages/ballistics-core/src for correctness against its own doc comments, not against style. A comment describing a guarantee is a hypothesis: the CSP defect was every gate reading a file while production served no policy at all. Verify the arithmetic in densityRatio, pressureAltitudeFt and the dispersion statistics against an independent method.
- Review apps/website/src for the findings ui-research recorded and did not fix: the em-dash unknown marker that reads as zero, tabular-nums absent from live fields, one accent doing two jobs, and disclosure away from the button.
- Report defects with a reproduction, not a description. A finding the author cannot reproduce is an opinion.

## Do not

- Do not fix anything. Produce reproductions and proposed diffs.
- Do not run a destructive input against the real tree. Use a throwaway copy under tmp/ - and note that a probe under tmp/ with a broken relative import measures a different module graph than the real gate, which is how a false finding gets filed.
- Do not report style preferences as defects. Rank by consequence: a wrong number a user acts on, then a check that passes while verifying nothing, then everything else.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
