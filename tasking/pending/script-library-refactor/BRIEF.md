# BRIEF — Assess script consolidation, and whether OOP factories are warranted

**Task id:** `script-library-refactor` · **Priority:** high
**Grounded in:** `tasking/completed/code-audit/KNOWLEDGE.md`

## Why this task exists

The owner asked for OOP factories where possible. That deserves a real answer rather than compliance. packages/ballistics-core is deliberately FUNCTIONAL - pure exported functions with no hidden state, and its 10 classes are reserved for things that genuinely have state (profiles, sources, devices). Blanket OOP there would be a regression dressed as progress. scripts/ is plain ESM Node, where a class wrapping a function is strictly worse than the function. So this produces the refactor that IS warranted and says plainly where a factory is not.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/code-audit/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/script-library-refactor tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

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

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-duplication-counts.md`
- `02-oop-assessment.md`
- `03-change-sets.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/script-library-refactor tasking/completed/`
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
