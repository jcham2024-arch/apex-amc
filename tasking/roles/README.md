# Agent roles — read the one that is yours

Four roles, four hard boundaries. The separation is the point: an agent that reviews
its own work finds nothing, and an agent that both decides and implements has nobody to
disagree with it.

| File | Role | Owns | The one thing it must never do |
|---|---|---|---|
| [TASKMASTER.md](TASKMASTER.md) | plan & triage | `tasking/pending/`, seeding, routing | implement anything |
| [WORKER.md](WORKER.md) | produce research | one task at a time | write app code, or stall |
| [REVIEWER.md](REVIEWER.md) | audit | verdicts in `tasking/review/` | fix what it reviews |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | write code | `apps/`, `packages/`, `scripts/` | decide what to build |

## The pipeline

```
taskmaster ──seeds──▶ pending/
                         │
worker ──claims──▶ in-progress/ ──finishes──▶ completed/ + HANDOVER.md
                                                          │
                                              reviewer ──audits──▶ PASS / FAIL / SUSPEND
                                                          │
                                    PASS ─────────────────┤
                                    FAIL ─────────────────┘ (back to a worker)
                                                          │
                                              implementation agent
                                                          │
                                                      code + gates
```

## HANDOVER.md is required of every worker

Every task folder ends with one. It is what stops a stall from becoming a loss.

```markdown
# HANDOVER — <task-id>

**Status:** complete | partial | stalled | blocked
**Declared outputs written:** N/M

## What I did
## What I found — cited to a file
## What is NOT done, specifically
## Why I stopped
## What the next agent should do first
```

`partial` with documented gaps is a **successful** outcome. An empty folder with an
explanation is not.

## Two rules that override everything else

1. **A worker never stalls.** Red gate, missing write-path, wrong brief, unknown value —
   all of these are things to *document*, not reasons to stop. Write the handover, claim
   the next task. See `.clinerules` §1.
2. **The implementation agent only acts on PASS.** If the reviewer said FAIL, the code
   does not get written.

## Verify these still say what they say

```bash
npm run roles:check
```

Fails if a role file is missing, if the handover template has drifted from
`.clinerules` §10.6, or if a role has lost one of its hard boundaries. A protocol nobody
checks is a protocol that decays.