# BRIEF — Two-way cartridge name normaliser

**Task id:** `name-normaliser-spec` · **Priority:** medium
**Grounded in:** `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`

## Why this task exists

A coverage comparison run on raw strings manufactures gaps out of abbreviations. The normaliser must be tested in both directions: does it find cartridges naive matching called absent, and does it keep genuinely different cartridges apart.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/name-normaliser-spec tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Specify the normalisation rules, and for each state whether it can over-merge or under-match. Both are defects and they are not symmetrical.
- Build a test corpus with expected outcomes in BOTH directions: under-match cases that abbreviations caused naive matching to miss, and over-merge cases that must stay separate.
- The over-merge corpus must include real near-collisions in this dataset. Find them rather than inventing them.
- State where normalisation is safe to apply and where it is not. Never silently normalise a stored name.

## Do not

- Do not implement the normaliser. Produce the rules and the test corpus.
- Do not rename or rewrite any stored cartridge name. That is a data migration and a human decision.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-rules.md`
- `02-test-corpus.csv`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/name-normaliser-spec tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Claim the next task from `pending/`. Do not wait for a reply.
