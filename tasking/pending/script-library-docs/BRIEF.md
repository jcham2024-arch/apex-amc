# BRIEF — Document the script library so an agent can use it without reading source

**Task id:** `script-library-docs` · **Priority:** highest
**Grounded in:** `tasking/completed/code-audit/KNOWLEDGE.md`

## Why this task exists

scripts/ is ~50 ESM modules with five shared helpers that only 7 of them import. An agent arriving cold must rediscover which module holds what, and code-audit found 23 scripts each solving a problem scripts/shared/ already solves. Documentation is cheaper than consolidation and is what actually unblocks the next agent.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/code-audit/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/script-library-docs tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Write a reference for scripts/shared/: data.mjs, encoding.mjs, bullet-sources.mjs, load-database.mjs, affiliate-links.mjs. For each export, state what it does, its exact signature, what it returns, and a one-line example. These five modules total ~54KB and are the library's entire public surface.
- Build a map from task to script: for each of the ~50 scripts, one line saying what it does and what invokes it. If nothing invokes it, say so - an unreachable script is either a one-shot tool or dead code, and a reader cannot tell which.
- Document the conventions a new script must follow, each with a live example: importing root from shared/data.mjs rather than deriving it, using readCsv rather than split(','), and the reason each exists. Cite the file recording the trap.
- State clearly what is NOT in the library and why. The duplication that remains is deliberate in at least one case, and naming that case stops someone 'fixing' it.
- Include the Windows traps, because they cost the audit three failed measurements: execFileSync with npm fails because npm is a .cmd shim, Select-String has no -Recurse, and .NET file APIs ignore PowerShell's cd so relative paths resolve to the wrong repository.

## Do not

- Do not write the documentation into scripts/ itself. Output stays in this folder; a human places it.
- Do not refactor, rename or re-export anything. This task reads and explains.
- Do not document a function you have not read. A reference that guesses is worse than none, because it will be trusted.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-shared-library-reference.md`
- `02-script-to-task-map.md`
- `03-conventions.md`
- `04-windows-traps.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/script-library-docs tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.
