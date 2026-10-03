# BRIEF — Audit the knowledge base for staleness and contradiction

**Task id:** `knowledge-base-audit` · **Priority:** medium
**Grounded in:** `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`

## Why this task exists

Over twenty completed tasks each produced a KNOWLEDGE.md, and they contradict each other on a question that determines whether a large amount of data work is lawful. A knowledge base that silently disagrees with itself is worse than none, because a later agent will pick whichever file it read first.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/knowledge-base-audit tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Inventory every KNOWLEDGE.md in tasking/completed/ and record what each claims to be authoritative about. Then find every pair that disagrees. The CIP contradiction between ammoseek-coverage and cartridge-dimensions is already known; find the others.
- For each contradiction, state whether it is a genuine conflict, a difference in scope that makes both true, or one file being outdated. These need different resolutions and treating them identically wastes the reader's time.
- Check claims that time has invalidated: paths that moved, counts that drifted, functions since fixed, work since done. Quote the claim and give its current state.
- Propose a structure that makes contradiction VISIBLE rather than requiring a reader to hold twenty-two files in their head. State the cost of the proposal and who would maintain it.
- Flag anything that, read alone, would lead an agent to do the wrong thing.

## Do not

- Do not resolve a contradiction by choosing a side. Record both claims with their sources; resolution is the taskmaster's or the owner's.
- Do not delete or rewrite another task's KNOWLEDGE.md. This task reports; the record stays as written, because the reason a claim changed is itself worth keeping.
- Do not treat an absence of contradiction as success. Twenty-two files agreeing is a claim to verify, not a fact to assume.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-inventory.md`
- `02-contradictions.md`
- `03-stale-claims.md`
- `04-structure-proposal.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/knowledge-base-audit tasking/completed/`
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
