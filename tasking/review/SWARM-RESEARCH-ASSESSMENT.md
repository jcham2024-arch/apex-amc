# Multi-agent research, tested against this swarm

Assessed 3 Oct 2026 from an external research document (646 Exa results, 8 subagents,
~55 arXiv abstracts screened).

**The document's central claim — that multi-agent systems fail on shared write state — was
already true in this swarm, live, at the moment it was read.** Everything below is either a
measurement taken here or a decision recorded with a reason.

## The finding

The paper's load-bearing claim is that agents writing the same file produce
last-writer-wins, no error raised, and both parties report success.

**Measured across all eight live agents:**

```
paths claimed by MORE THAN ONE agent: 7
  3x  tasking/pending/code-review-sweep/BRIEF.md   <- 23e31, fc6cc, ff96c
  3x  tasking/pending/blocker-ledger/BRIEF.md      <- e981f, fc6cc, ff96c
```

Three agents claimed `code-review-sweep`. Two — `fc6cc` and `ff96c` — both completed
**`blocker-ledger`**, and their outputs are **byte-different**:

```
  ff96c: 4 files   first
  fc6cc: 4 files   DIFFERENT

  REPORT.md      ff96c=AB63FEE9A3  fc6cc=774C62CF9F  DIFFERENT
  KNOWLEDGE.md   ff96c=1495473B59  fc6cc=A25CFE6675  DIFFERENT
```

Two different answers to the same question, from two agents that each believe they own it.
Whichever pushes second silently overwrites the first.

## Why our own design did not prevent it

`tasking/README.md` states that claiming is a folder move and the move *is* the lock:
*"no registry to race on, no lock to expire. A second agent simply cannot see a claimed
task."*

**True within one filesystem. False across eight.** Each agent has its own clone with its
own `tasking/pending/`, so a move in one worktree is invisible in the other seven. The lock
was designed for agents sharing a working directory and deployed to agents that do not.

This is the most valuable thing in the document, because it is a decision we already wrote
down, got right on paper, and shipped broken. No gate caught it: `check-tasking` reads one
worktree and cannot see that another worktree disagrees with it.

## The fix

```bash
npm run claim:scan
```

Reads every live worktree and reports any task claimed by more than one agent **with
uncommitted work**. Current output:

```
DUPLICATE CLAIMS: 3

  blocker-ledger          claimed by: e981f, fc6cc, ff96c   (ALL UNCOMMITTED)
  code-review-sweep       claimed by: 23e31, ff96c          (ALL UNCOMMITTED)
  claims-gate-prose-scope claimed by: 40a43, fc6cc          (ALL UNCOMMITTED)
```

**The first version reported 24 overlaps and almost all were false** — committed history
identical in every clone. It now requires the work to be *uncommitted*, which separates
"someone is working on this now" from "this is finished", and is also precisely the
dangerous state. A check that cries wolf 24 times gets ignored, which is the same failure
mode as a permanently red gate — the exact thing `check-proposals` was built to avoid.

Resolution is a move, not a negotiation: the losers move their folder to
`tasking/completed/_quarantine/<task-id>/` with a `QUARANTINE.md` saying the task was
already claimed. Work preserved, claim released.

## What we already do that the paper endorses

Recorded so a future agent does not "fix" mechanisms that are already correct.

| Paper's finding | Our status |
|---|---|
| Single-thread the writes | **Done.** `IMPLEMENTATION`, `DATA-STEWARD`, `QA-GATE-TESTER` are capacity 1. |
| A verifier that sees the answer is not a verifier | **Done.** Reviewers may not review their own work; each writes its own verdict file. |
| Handoff must carry constraints, not just facts | **Done.** `HANDOVER.md` requires *why you stopped* and *what is NOT done*. |
| Hard concurrency / budget caps | **Done.** Per-role capacity in `role-capacity.mjs`. |
| Duplicate/conflicting writes | **Was NOT done.** Found live today, above. |

## What we deliberately did NOT adopt

- **A2A / MCP interop.** We are eight shells on one repo, not services — there is nothing
  to federate. The paper's own note is that neither protocol yet has a standardised
  handoff primitive; every team hand-rolls one. Ours is `HANDOVER.md`.
- **OTel agent spans.** Good and vendor-neutral, but it instruments a runtime we do not
  control. The local equivalent is `swarm:sync` + `claim:scan` + `role -- status`.
- **Multi-agent debate.** The paper's own finding: homogeneous debate burns 2.1–3.4×
  tokens for equal-or-lower accuracy. Our reviewer/implementer split is *heterogeneous* —
  different roles, different write-sets — which is the version that works. A second
  reviewer reading the first reviewer's findings would be the failing version.
- **Markets / contract-net.** Reported as unfundamented: agents cannot self-report success
  probability well enough to bid. We use a *computed* ranking instead (`role-value.mjs`),
  where usefulness is measured from the queue rather than self-reported. Same instinct,
  known failure mode removed.
- **Scaling to more agents.** The paper finds agent count saturates or hurts, and that
  handoff quality beats adding agents. Our own numbers agree.

## The one number that matters most

**22 completed tasks, 1 verdict.** The swarm is not short of workers or tasks — it is
short of reviewers. Adding workers makes that ratio worse, and the paper's finding that
handoff quality dominates agent count points the same way.

This is why the role-ranking function puts REVIEWER first and why several agents should
claim it rather than taking WORKER.

## Related

- [DERIVED-VALUES.md](DERIVED-VALUES.md) — the citation discipline a reviewer enforces
- [PRODUCT.md](PRODUCT.md) — what the site is for
- [LESSONS.md](LESSONS.md) — the compiled trap history