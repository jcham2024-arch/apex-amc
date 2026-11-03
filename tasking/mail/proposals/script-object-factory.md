---
proposal: script-object-factory
title: Design the script object factory - real insulation, not ceremony
derived_from: tasking/review/LESSONS.md
evidence: "A pattern is not an improvement. The owner said it directly: if a change does not improve the code, do not make it. Applying a pattern because it is fashionable is a regression wearing a costume."
shape: research
priority: highest
write_set:
  - tasking/completed/script-object-factory/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-insulation-evidence.md
  - 02-script-object-contract.md
  - 03-module-contract-for-agents.md
  - 04-migration-plan-and-line.md
---

## Why

The owner asked that functional scripting come from a shared library and be called through a script object factory, so modules are insulated and an agent can author a small codebase that drops in as an object. The goal is sound and this repo needs it: code-audit measured 15 sites re-deriving root, 13 using process.cwd() and 9 sha256 call sites, so the library discipline is not yet real. What needs evidence is WHICH parts of 'wrap it in an object' deliver fault isolation and which do not.

## Scope

- FIRST establish where the insulation ALREADY comes from, because this decides the design. Every ES module already has its own scope and explicit exports, so a bare class wrapper over a pure function adds indirection and NO isolation. Measure it: take two functions in scripts/shared/data.mjs, show what a class wrapper changes and what it does not. A design that wraps without adding containment is exactly the regression wearing a costume the owner named.
- Then design the factory for what it genuinely adds: a uniform lifecycle a bare module does not have. Specify a ScriptObject contract - identity, declared dependencies, validate(input), run(input), and a typed failure result rather than a thrown exception. A thrown error from one agent-authored module should be CONTAINED and reported, not propagated into the build. That is the owner's 'if anything breaks it is just that piece of code', and it needs the wrapper to be real rather than nominal.
- Specify dependency INJECTION concretely. Today a script reaches for root, readCsv and loadManifest by importing them directly, which is why 15 sites re-derive root. A factory that passes dependencies in makes the coupling visible and testable with a stub. Show before and after for one script.
- Define the module contract an AGENT follows to contribute: file shape, what it must declare, how it declares dependencies, what validate() must check, and what it returns. The owner's point is that agents author small codebases and drop them in - so state the contract precisely enough that a stranger could comply without reading an existing module.
- Specify the registry and discovery: how modules are found, how duplicates are detected, and how a module that fails to load is reported WITHOUT stopping the others. That last case is the fault isolation the owner actually wants, and it is what a bare import cannot do.
- Give a migration plan as independent change sets, starting with the highest-value target and STOPPING at the point where further wrapping stops paying. Say where the line is and why. A migration that wraps all 50 scripts because it was started is the failure mode, not the success.
- State the cost honestly, in code and in comprehension: extra indirection, a learnable contract, and what a reader must now understand that they did not before. Where total cost exceeds the containment benefit, say which scripts and recommend leaving them as plain modules.

## Do not

- Do not implement anything. Produce the contract, the evidence and the migration plan.
- Do not wrap a pure function in a class merely to satisfy the request. State plainly where that adds nothing and why - the owner's own rule is that a change which does not improve the code should not be made.
- Do not convert packages/ballistics-core. It is a published library whose functional purity IS the API contract; wrapping it would break that contract for no benefit. Say so in the report rather than silently omitting it.
- Do not touch a gate while proposing this. If a gate would need to change, that is a separate reviewed change set.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
