# BRIEF — Resolve the contradiction between two completed tasks on CIP licensing

**Task id:** `cartridge-licence-reconciliation` · **Priority:** highest
**Grounded in:** `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`

## Why this task exists

Two completed tasks disagree about whether cartridge dimensions are legally transcribable. One says the barrier is transcription effort, not permission. The other says reproduction as well as in the form of extracts is forbidden without approval. Both cannot be right, and the answer decides whether a large body of work is possible at all.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/cartridge-licence-reconciliation tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- State both positions verbatim with their sources, so the disagreement is on the record and neither task is silently overruled.
- Determine what each actually means: is the disagreement about licence terms, about scope, or about which cartridge subset is in question?
- Identify exactly which cartridges the permissive reading covers and which the restrictive reading covers. The sets may differ even when the readings appear contradictory.
- For each subset, state whether a dimension may be transcribed, may be cited only, or must not be recorded.
- If the conflict cannot be resolved from published terms, say so and state precisely what would need to be asked of a lawyer or of CIP. Do not resolve it by guessing.

## Do not

- Do not give legal advice. State what the published terms say and where they are ambiguous.
- Do not transcribe any CIP-derived dimension. Establishing permission is the deliverable.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-the-disagreement.md`
- `02-licence-terms.md`
- `03-per-cartridge-verdict.csv`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/cartridge-licence-reconciliation tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Claim the next task from `pending/`. Do not wait for a reply.
