---
proposal: gate-negative-tests
title: Negative tests for every gate in verify
derived_from: tasking/completed/code-audit/KNOWLEDGE.md
evidence: "A gate in verify can be green and verify nothing. check-tasking.mjs shipped with a missing brace that silently reduced it to checking one task per run, and reported 0 declared output(s) verified while four completed tasks sat in completed/."
shape: research
priority: high
write_set:
  - tasking/completed/gate-negative-tests/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-negative-test-matrix.csv
  - 02-untestable-gates.md
---

## Why

A completed audit found check-tasking.mjs shipped with a missing brace that silently reduced it to checking one task per run, and reported zero outputs verified while four completed tasks sat in completed/. ESLint and node --check both passed. It was found by an agent doing its own task, not by a gate.

## Scope

- For each gate in npm run verify, construct an input that MUST make it fail, and state the expected failure.
- Record which gates you could not falsify, and why. A gate you could not break is an untested gate, and saying so is the finding.
- Identify gates that only read files when they should be checking deployed behaviour or actual output.
- Note gates whose exit code is untrustworthy. Several gates in this repo report pass while producing wrong output, so verify the artefact rather than the exit code.
- On Windows, execFileSync with npm fails because npm is a .cmd shim. Use cmd.exe /c npm run <script>. Getting this wrong manufactures a false every-gate-is-broken finding.

## Do not

- Do not modify any gate. Produce the test vectors; a human decides what to add.
- Do not run a destructive input against the real tree. Use a throwaway copy under tmp/.

Seeded by `scripts/tasking/seed-wave1.mjs` from `wave1.spec.json`, which holds the
same record as the task manifest. Neither was hand-typed, so they cannot drift apart.
