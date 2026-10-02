# BRIEF — Design the unknown state before the known state

**Task id:** `unknown-state-design` · **Priority:** high
**Grounded in:** `tasking/completed/ui-research/KNOWLEDGE.md`

## Why this task exists

Six dimensional columns are 0/229 populated. A design with no vocabulary for absence renders a blank cell, and a blank cell reads as zero. That is a silent data error, and it is invisible to every test that checks for rendering failures.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ui-research/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/unknown-state-design tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Specify the unknown state for every data surface in the product: which components render data, and what each shows when the value is absent.
- State the vocabulary. An em-dash is explicitly ruled out; propose and justify what replaces it.
- Distinguish not-recorded from not-applicable from unknown-to-us from restricted-by-licence. Four different absences; one marker collapses them wrongly.
- Check docs/mockups/_tokens.css and the mockups before designing anything - they may already have solved part of it.
- Note the related defect: one accent colour currently marks both interactive elements and positive results, so this-is-good-news and click-me cannot be told apart.

## Do not

- Do not edit apps/website/. Produce the specification; a human implements it.
- Do not design the populated-data presentation until the empty case is specified. That ordering is the finding.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-unknown-state-spec.md`
- `02-surface-inventory.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/unknown-state-design tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Claim the next task from `pending/`. Do not wait for a reply.
