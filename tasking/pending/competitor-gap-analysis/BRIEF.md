# BRIEF — Competitor teardown - features we lack

**Task id:** `competitor-gap-analysis` · **Priority:** high
**Grounded in:** `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`

## Why this task exists

The owner asked what competitors are doing that we are not. We have partial coverage: ammoseek-coverage compared cartridge NAME coverage and found 36.30 percent of their search share is already held by us. That compared names. Nobody has compared features, calculators or the shopping experience.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/competitor-gap-analysis tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Enumerate the competitors. AmmoSeek is already studied for coverage; find the others - gun.deals, gunammo.deals, FIREARMSDATA, reloadus, AmmoReady and whatever else carries real traffic. Record each URL and the date observed.
- For each, list what they offer that we do not, ranked by how much a user would care. Distinguish a genuine capability from a presentation difference - a prettier page is not a feature, and a feature we have but present worse is a different fix.
- State what THEY lack that we have, and say so plainly. A teardown that only finds gaps is marketing, not research, and it would mislead the owner into thinking we are behind.
- For the top five gaps, give a rough effort estimate and the write-set each would touch, so the owner can approve a batch the way the low-risk fixes were approved.

## Do not

- Do not copy a competitor's design, copy, code or layout. Record what capability exists and what problem it solves. We build our own expression of it.
- Do not scrape a competitor to measure anything. Read what they publish.
- Do not rank by what is easiest for us to build. Rank by what a user would actually notice missing.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-competitor-inventory.md`
- `02-feature-gap-matrix.csv`
- `03-effort-and-write-sets.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/competitor-gap-analysis tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.
