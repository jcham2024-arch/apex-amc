# BRIEF — Negative tests for every gate in verify

**Task id:** `gate-negative-tests` · **Priority:** high
**Grounded in:** `tasking/completed/code-audit/KNOWLEDGE.md`

## Why this task exists

A completed audit found check-tasking.mjs shipped with a missing brace that silently reduced it to checking one task per run, and reported zero outputs verified while four completed tasks sat in completed/. ESLint and node --check both passed. It was found by an agent doing its own task, not by a gate.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/code-audit/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/gate-negative-tests tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- For each gate in npm run verify, construct an input that MUST make it fail, and state the expected failure.
- Record which gates you could not falsify, and why. A gate you could not break is an untested gate, and saying so is the finding.
- Identify gates that only read files when they should be checking deployed behaviour or actual output.
- Note gates whose exit code is untrustworthy. Several gates in this repo report pass while producing wrong output, so verify the artefact rather than the exit code.
- On Windows, execFileSync with npm fails because npm is a .cmd shim. Use cmd.exe /c npm run <script>. Getting this wrong manufactures a false every-gate-is-broken finding.

## Do not

- Do not modify any gate. Produce the test vectors; a human decides what to add.
- Do not run a destructive input against the real tree. Use a throwaway copy under tmp/.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-negative-test-matrix.csv`
- `02-untestable-gates.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/gate-negative-tests tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Claim the next task from `pending/`. Do not wait for a reply.
