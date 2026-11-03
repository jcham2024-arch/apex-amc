# BRIEF — Make the shared script library real, not aspirational

**Task id:** `shared-library-consolidation` · **Priority:** high
**Grounded in:** `tasking/completed/code-audit/KNOWLEDGE.md`

## Why this task exists

The owner's architectural principle is that all functional scripting comes from a library. scripts/shared/ has 45 exports across 5 modules and it is the right shape - but only 7 of roughly 50 scripts import it, while 15 re-derive root and 13 use process.cwd(). The library exists; the discipline does not. Until it is real, a factory would only be papering over copies.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/code-audit/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.

**Provision your mailbox:** `npm run mail:init -- <your-id>`. It is idempotent, so run it even if the file looks present. An agent with no inbox is an agent whose findings nobody reads. Archived mail from closed agents is in `tasking/mail/archive/` — worth reading before you rediscover their findings.
5. Claim it: `mv tasking/pending/shared-library-consolidation tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

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

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-current-counts.md`
- `02-consolidation-decisions.md`
- `03-change-sets.md`
- `04-enforcement-options.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/shared-library-consolidation tasking/completed/`
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
