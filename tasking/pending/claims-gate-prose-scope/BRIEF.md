# BRIEF — Extend claims:check to the prose corpus, not just the built site

**Task id:** `claims-gate-prose-scope` · **Priority:** high
**Grounded in:** `tasking/completed/gate-negative-tests/KNOWLEDGE.md`
**Dispatched from:** `tasking/mail/proposals/claims-gate-prose-scope`, approved in
`scripts/tasking/proposal-triage.mjs`.

## Why this task exists

Output only. Analysis of what check-claims actually enforces versus its prose.

## Before you start

1. Read `.clinerules` — §10 swarm, §11 mail, §12 proposals, §13 the standing slot.
2. Read your source: `tasking/completed/gate-negative-tests/KNOWLEDGE.md`.
3. **Read `tasking/mail/bulletin/*.md` and `tasking/completed/FINDINGS.md` first.** Check
   whether this ground is already covered. Two agents once proposed the same index and
   neither could see the other; a third version is worse than the first.
4. Claim it: `mv tasking/pending/claims-gate-prose-scope tasking/in-progress/`
5. Send START to your inbox.

## Do not

- Do not enact the protocol or policy change this task specifies. You produce the analysis; the owner decides.
- Do not edit another task's files. One writer per file.
- Do not re-derive a finding already in tasking/completed/FINDINGS.md.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`

```
npm run tasking:check
npm run verify
```

Then move to `completed/`, send STOP with the REAL file count, run
`npm run tasking:restock`, and claim the next task.
