# BRIEF — Schema and EMPTY semantics for load-data interpolation

**Task id:** `load-interpolation-schema` · **Priority:** high
**Grounded in:** `tasking/completed/interior-ballistics/05-feasibility-verdict.md`
**Dispatched from:** `tasking/mail/proposals/load-interpolation-schema`, approved in
`scripts/tasking/proposal-triage.mjs`.

## Why this task exists

Already `shape: research` and written before the interior-ballistics verdict landed. Re-check it against 05-feasibility-verdict.md before dispatching; the mandatory EMPTY semantics must survive into the spec.

## Before you start

1. Read `.clinerules` — §10 swarm, §11 mail, §12 proposals, §13 the standing slot.
2. Read your source: `tasking/completed/interior-ballistics/05-feasibility-verdict.md`.
3. **Read `tasking/mail/bulletin/*.md` and `tasking/completed/FINDINGS.md` first.** Check
   whether this ground is already covered. Two agents once proposed the same index and
   neither could see the other; a third version is worse than the first.
4. Claim it: `mv tasking/pending/load-interpolation-schema tasking/in-progress/`
5. Send START to your inbox.

## Do not

- Do not enact the protocol or policy change this task specifies. You produce the analysis; the owner decides.
- Do not edit another task's files. One writer per file.
- Do not re-derive a finding already in tasking/completed/FINDINGS.md.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-match-keys.md`
- `02-empty-semantics.md`

```
npm run tasking:check
npm run verify
```

Then move to `completed/`, send STOP with the REAL file count, run
`npm run tasking:restock`, and claim the next task.
