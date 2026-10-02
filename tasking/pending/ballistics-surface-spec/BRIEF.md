# BRIEF — Make the ballistics module reachable from the main page

**Task id:** `ballistics-surface-spec` · **Priority:** medium
**Grounded in:** `tasking/completed/exterior-ballistics/REPORT.md`

## Why this task exists

The owner asked for the ballistics module to be accessible from the main page. Today packages/ballistics-core is a library with 7 test files and no user-facing entry: the site has a cost calculator but no trajectory or zeroing surface at all. This specifies the entry point rather than building it.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/exterior-ballistics/REPORT.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/ballistics-surface-spec tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Inventory what packages/ballistics-core actually exposes and what each function needs as input. Several require a full BallisticProfile, which a visitor will never have - state which surfaces are genuinely reachable by a first-time visitor and which are not.
- Specify the entry point on the page: what the user sees, what they input, and what comes out. Identify the smallest useful slice - the exterior-ballistics verdict is that these are the measurements dispersion.ts already makes correctly: group size, sigma, cep50, extremeSpread, and which axis a group is elongated on.
- State honestly what this module CANNOT do. shot-group-taxonomy established that naming a shooter fault from a target photo is unsafe and unsourced, that no confidence percentage exists anywhere, and that centreOfImpact is the mean of the shots taken so any threshold rule fires on sampling noise without a standard error. The surface must not imply it can diagnose anything.
- Address the same unknown-state rule: a trajectory result computed from a 0/229 dimensional record is meaningless, and the surface must refuse or label it rather than render a confident number.
- Specify how it links to the cost calculator, since the owner's stated intent is a user arriving to decide what to build, how, and where to buy the parts.

## Do not

- Do not build the surface. Produce the specification.
- Do not design any shooter-fault diagnosis, confidence percentage, or threshold rule. shot-group-taxonomy records that a named instructor calls target-photo fault diagnosis the most misused tool in the training industry, and that no diagnostic accuracy figure exists in any source retrieved.
- Do not compute a charge weight, powder constant, or pressure figure.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-module-surface.md`
- `02-reachable-inputs.md`
- `03-limits-and-refusals.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/ballistics-surface-spec tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.
