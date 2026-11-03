# BRIEF — Cartridges whose family disagrees with their name

**Task id:** `cartridge-family-audit` · **Priority:** high
**Grounded in:** `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`

## Why this task exists

A completed task found 9 Luger and .22 LR filed under rifle.csv with family=rifle, and called it a real defect it could not fix because it was outside its write-set. Family drives presentation and filtering, so the most-searched cartridge on the index is in the wrong bucket.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/cartridge-family-audit tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Enumerate EVERY cartridge in data/seeds/cartridge_specs/*.csv whose family disagrees with its name. Not just the two known cases - find them all.
- For each: file, name, declared family, what the name implies, and the evidence for the correct family.
- Flag any case where the correct family is genuinely ambiguous, and say so rather than picking one.
- State the blast radius: which parts of the app read family, and what visibly breaks for a user who filters by it.
- Produce the exact rows to change as a diff an owner can apply. Do not apply it.

## Do not

- Do not edit data/seeds/. Produce the diff; a human applies it.
- Do not rename cartridges to match their file while you are there. Name normalisation is a separate task with its own over-merge risk.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-family-defects.csv`
- `02-blast-radius.md`
- `03-proposed-fix.diff`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/cartridge-family-audit tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Claim the next task from `pending/`. Do not wait for a reply.
