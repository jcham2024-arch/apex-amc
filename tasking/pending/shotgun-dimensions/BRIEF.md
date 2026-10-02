# BRIEF — Shotgun gauge coverage and dimension source availability

**Task id:** `shotgun-dimensions` · **Priority:** medium
**Grounded in:** `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`

## Why this task exists

The emptiest category is among the cheapest to fill. SAAMI free drawings explicitly name 12 Gauge and 28 Gauge, and CIP TDCC covers shotgun dimensions. This task establishes which sources exist and what they permit; it does not touch safety limits.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/shotgun-dimensions tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Establish which of the 8 gauges have a free, named, primary dimensional source, and which are paywalled or restricted.
- Identify what the 4 Bore Rifle row - the only row filed as shotgun, created as a pressure placeholder - should actually be, or whether it should not exist.
- Record, per gauge, whether any safety-limit figure is available, and mark it as a separate open item if it is paywalled. Do not seek the value and do not reason about it.
- Cross-reference the licence question in tasking/completed/cartridge-dimensions/REPORT.md. Do not re-derive it.

## Do not

- Do not transcribe a value from a restricted source. Record the source and the permission status only.
- Do not resolve the CIP licensing question here. cartridge-licence-reconciliation owns it.
- Do not source, compare, or reason about any chamber safety limit. Recording availability is the deliverable; the value is not. See tasking/completed/interior-ballistics/KNOWLEDGE.md.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-source-availability.csv`
- `02-per-gauge-verdict.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/shotgun-dimensions tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Claim the next task from `pending/`. Do not wait for a reply.
