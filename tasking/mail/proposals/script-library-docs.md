---
proposal: script-library-docs
title: Document the script library so an agent can use it without reading source
derived_from: tasking/completed/code-audit/KNOWLEDGE.md
evidence: "Only 7 scripts import root. The convention is documented in check-seeds.mjs and followed by 7; the other 23 each solved a problem that was already solved."
shape: research
priority: highest
write_set:
  - tasking/completed/script-library-docs/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-shared-library-reference.md
  - 02-script-to-task-map.md
  - 03-conventions.md
  - 04-windows-traps.md
---

## Why

scripts/ is ~50 ESM modules with five shared helpers that only 7 of them import. An agent arriving cold must rediscover which module holds what, and code-audit found 23 scripts each solving a problem scripts/shared/ already solves. Documentation is cheaper than consolidation and is what actually unblocks the next agent.

## Scope

- Write a reference for scripts/shared/: data.mjs, encoding.mjs, bullet-sources.mjs, load-database.mjs, affiliate-links.mjs. For each export, state what it does, its exact signature, what it returns, and a one-line example. These five modules total ~54KB and are the library's entire public surface.
- Build a map from task to script: for each of the ~50 scripts, one line saying what it does and what invokes it. If nothing invokes it, say so - an unreachable script is either a one-shot tool or dead code, and a reader cannot tell which.
- Document the conventions a new script must follow, each with a live example: importing root from shared/data.mjs rather than deriving it, using readCsv rather than split(','), and the reason each exists. Cite the file recording the trap.
- State clearly what is NOT in the library and why. The duplication that remains is deliberate in at least one case, and naming that case stops someone 'fixing' it.
- Include the Windows traps, because they cost the audit three failed measurements: execFileSync with npm fails because npm is a .cmd shim, Select-String has no -Recurse, and .NET file APIs ignore PowerShell's cd so relative paths resolve to the wrong repository.

## Do not

- Do not write the documentation into scripts/ itself. Output stays in this folder; a human places it.
- Do not refactor, rename or re-export anything. This task reads and explains.
- Do not document a function you have not read. A reference that guesses is worse than none, because it will be trusted.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
