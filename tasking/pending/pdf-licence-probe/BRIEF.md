# BRIEF — Build a reusable notice-detector for third-party PDF data sources

**Task id:** `pdf-licence-probe` · **Priority:** high
**Grounded in:** `tasking/completed/cartridge-licence-reconciliation/KNOWLEDGE.md`
**Dispatched from:** `tasking/mail/proposals/pdf-licence-probe`, approved in
`scripts/tasking/proposal-triage.mjs`.

## Why this task exists

Already `shape: research`. Small, cheap, and unblocks part of the CIP question.

## Before you start

1. Read `.clinerules` — §10 swarm, §11 mail, §12 proposals, §13 the standing slot.
2. Read your source: `tasking/completed/cartridge-licence-reconciliation/KNOWLEDGE.md`.
3. **Read `tasking/mail/bulletin/*.md` and `tasking/completed/FINDINGS.md` first.** Check
   whether this ground is already covered. Two agents once proposed the same index and
   neither could see the other; a third version is worse than the first.
4. Claim it: `mv tasking/pending/pdf-licence-probe tasking/in-progress/`
5. Send START to your inbox.

## Do not

- Do not enact the protocol or policy change this task specifies. You produce the analysis; the owner decides.
- Do not edit another task's files. One writer per file.
- Do not re-derive a finding already in tasking/completed/FINDINGS.md.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-the-trap.md`
- `02-detector.md`
- `03-negative-test.md`

```
npm run tasking:check
npm run verify
```

Then move to `completed/`, send STOP with the REAL file count, run
`npm run tasking:restock`, and claim the next task.
