# BRIEF — Ranked roadmap across all completed findings

**Task id:** `roadmap-synthesis` · **Priority:** highest
**Grounded in:** `tasking/completed/code-audit/KNOWLEDGE.md`

## Why this task exists

Ten tasks completed and the queue is empty. Nobody has read all ten KNOWLEDGE.md files together, so nobody can rank what to do next. This is the task that turns ten reports into a plan.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/code-audit/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/roadmap-synthesis tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Read the KNOWLEDGE.md of ALL ten completed tasks in full. This is the one task where reading broadly is the job.
- Read any REPORT.md section that names a successor task or an open item.
- Produce one ranked list of candidate work. Rank by: (a) does it unblock other work, (b) is it a defect that produces WRONG OUTPUT rather than a visible failure, (c) how confident is the evidence behind it.
- For each candidate, name the completed task that justifies it and quote the sentence. A candidate with no quotation does not go in the list.
- Separate work that can be done unattended from work that needs an owner decision, and mark every owner decision explicitly.
- List what is BLOCKED and why, so the plan records what cannot be planned around.

## Do not

- Do not modify any source file. This task produces a plan, not changes.
- Do not re-summarise findings that are already written. Link to the file.
- Do not propose load-synthesis or charge-weight work as attainable; see tasking/completed/interior-ballistics/KNOWLEDGE.md finding 3.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-ranked-roadmap.md`
- `02-owner-decisions.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/roadmap-synthesis tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Claim the next task from `pending/`. Do not wait for a reply.
