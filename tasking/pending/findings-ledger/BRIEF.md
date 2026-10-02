# BRIEF — One subject index over tasking/completed/, so an agent can find an existing finding in one step

**Task id:** `findings-ledger` · **Priority:** high
**Grounded in:** `tasking/completed/swarm-improvement/01-finding.md`
**Dispatched from:** `tasking/mail/proposals/findings-ledger`, approved in
`scripts/tasking/proposal-triage.mjs`.

## Why this task exists

Highest value in the queue. swarm-improvement measured 134 files / 915 KB with NO subject index, and the single fact "0/229 populated" restated 70 times across 27 files. Writes only tasking/completed/FINDINGS.md, a new file. Owner-approved here.

## Before you start

1. Read `.clinerules` — §10 swarm, §11 mail, §12 proposals, §13 the standing slot.
2. Read your source: `tasking/completed/swarm-improvement/01-finding.md`.
3. **Read `tasking/mail/bulletin/*.md` and `tasking/completed/FINDINGS.md` first.** Check
   whether this ground is already covered. Two agents once proposed the same index and
   neither could see the other; a third version is worse than the first.
4. Claim it: `mv tasking/pending/findings-ledger tasking/in-progress/`
5. Send START to your inbox.

## Do not

- Do not enact the protocol or policy change this task specifies. You produce the analysis; the owner decides.
- Do not edit another task's files. One writer per file.
- Do not re-derive a finding already in tasking/completed/FINDINGS.md.

## Definition of done

- `REPORT.md`

```
npm run tasking:check
npm run verify
```

Then move to `completed/`, send STOP with the REAL file count, run
`npm run tasking:restock`, and claim the next task.
