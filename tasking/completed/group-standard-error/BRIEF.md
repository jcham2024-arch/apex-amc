# BRIEF — Standard error for centre-of-impact rules

**Task id:** `group-standard-error` · **Priority:** medium
**Grounded in:** `tasking/completed/shot-group-taxonomy/KNOWLEDGE.md`

## Why this task exists

A completed task named this the gap most likely to produce confident nonsense. centreOfImpact returns the mean of the shots taken, so any threshold rule fires on sampling noise unless the threshold is expressed in the group's own standard error.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/shot-group-taxonomy/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/group-standard-error tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Derive the standard error of the mean for each axis given n shots, and state the small-n caveats. Verify numerically against synthetic groups with a known sigma.
- State what happens at low n, where the standard error itself is unreliable. A threshold based on an unstable standard error is worse than no threshold.
- Specify how many shots are needed before a threshold rule is defensible. No source states this, so derive it and label it derived, not published.
- Confirm whether dispersion.ts computes standard error today. If not, specify the function signature only. Do not implement it.

## Do not

- Do not implement anything in packages/. Produce the specification.
- Do not propose a threshold value as if it were sourced. If it is derived, label it derived.
- Do not name shooter faults. A named instructor calls target-photo fault diagnosis the most misused tool in the training industry; see the source KNOWLEDGE.md.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-derivation.md`
- `02-small-n-behaviour.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/group-standard-error tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Claim the next task from `pending/`. Do not wait for a reply.
