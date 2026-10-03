# BRIEF — Design the script object factory - real insulation, not ceremony

**Task id:** `script-object-factory` · **Priority:** highest
**Grounded in:** `tasking/review/LESSONS.md`

## Why this task exists

The owner asked that functional scripting come from a shared library and be called through a script object factory, so modules are insulated and an agent can author a small codebase that drops in as an object. The goal is sound and this repo needs it: code-audit measured 15 sites re-deriving root, 13 using process.cwd() and 9 sha256 call sites, so the library discipline is not yet real. What needs evidence is WHICH parts of 'wrap it in an object' deliver fault isolation and which do not.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/review/LESSONS.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/script-object-factory tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

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

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-insulation-evidence.md`
- `02-script-object-contract.md`
- `03-module-contract-for-agents.md`
- `04-migration-plan-and-line.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/script-object-factory tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.

## If you get stuck - read this before you stop

**You are working in a sandbox. Everything you write is reviewed before it reaches the
main project.** A concern is not a reason to stop.

Do **not** halt because:

- a file you want is outside your write-set - write it up in `NOTES.md`, work around it
- `npm run verify` is red - that is a shared gate; your completion is judged by
  `npm run tasking:check`, which is scoped to **your** declared outputs. Note the
  failure and keep working.
- a brief is wrong or contradicts another document - say so in your report. Fixing
  briefs is the planner's job, and reporting it is the whole contribution.
- a value is unknown - **leave it EMPTY.** An honest gap beats an invented number.

Do **not** halt when you finish with gaps. "I completed most of this and documented
exactly what is missing and why" is a **successful** task. An empty folder with an
explanation is not.

The only two things that stop you: the task folder is gone (someone else claimed it), or
`pending/` is empty - report **"queue empty"** and stop. Both are correct results.

Never weaken a gate and never run `handoff:accept`. Not for permission - those are
judgements about production, which is what the review step is for.
