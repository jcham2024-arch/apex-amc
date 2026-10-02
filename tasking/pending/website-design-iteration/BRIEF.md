# BRIEF — Apply the accumulated UI findings to the live site

**Task id:** `website-design-iteration` · **Priority:** high
**Grounded in:** `tasking/completed/ui-research/KNOWLEDGE.md`

## Why this task exists

ui-research produced a specific, verified list of defects and none are fixed, because agents cannot edit the application. Four are concrete enough to act on and none need a design decision to settle.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ui-research/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/website-design-iteration tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Produce a concrete diff for each of the four verified defects: move affiliate disclosure onto the retailer card adjacent to the link; add font-variant-numeric tabular-nums to live numeric fields, noting docs/mockups/_tokens.css line 17 already has it and was never ported; split the accent so action and positive-status are never the same token; and replace any em-dash unknown marker with a word.
- State precisely where each change goes, by file and line, so it can be applied without re-deriving the analysis.
- Re-run the CSP grep against your own proposed diff before submitting it. The original task's grep found 19 violations in the author's OWN first draft - inline style= attributes written while styling quickly. A check that passed on someone else's artefact failed on the one just made, and it will fail on yours.

## Do not

- Do not edit apps/website/. Produce diffs. Same rule as every other research task.
- Do not introduce an inline style attribute, a new remote origin or an icon font. The site is one self-contained HTML file under a strict CSP, and the CSP constraint is why the design is coherent.
- Do not redesign anything not on the list. This is a defect sweep, not a redesign.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-defect-diffs.md`
- `02-csp-verification.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/website-design-iteration tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.
