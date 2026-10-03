# Agent roles — read the one that is yours

Seven roles, hard boundaries. The separation is the point: an agent that reviews its own
work finds nothing, and an agent that both decides and implements has nobody to
disagree with it.

## Plan

| File | Role | Owns | The one thing it must never do |
|---|---|---|---|
| [TASK-AUTHOR.md](TASK-AUTHOR.md) | turns findings into tasks | `tasking/pending/**` | write a brief it cannot specify |
| [WORKER-MONITOR.md](WORKER-MONITOR.md) | keeps the swarm moving | `outbox/taskmaster/**` | let a stall go unanswered |

## Produce

| File | Role | Owns | The one thing it must never do |
|---|---|---|---|
| [WORKER.md](WORKER.md) | produces research | one task at a time | write app code, or stall |
| [DATA-STEWARD.md](DATA-STEWARD.md) | reference data correctness | `data/seeds/**` | fill a cell it cannot source |

## Check

| File | Role | Owns | The one thing it must never do |
|---|---|---|---|
| [REVIEWER.md](REVIEWER.md) | audits findings | verdicts in `tasking/review/` | fix what it reviews |
| [QA-GATE-TESTER.md](QA-GATE-TESTER.md) | proves gates work | `scripts/tests/**` | edit the gate it is testing |

## Build

| File | Role | Owns | The one thing it must never do |
|---|---|---|---|
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | writes code | `apps/`, `packages/`, `scripts/` | decide what to build |

## Running more than one

Roles are **instanced**, not unique. Several agents may hold the same role at once, and
the swarm is expected to grow by adding instances rather than roles.

- **WORKER** — scale freely. This is the parallel one.
- **REVIEWER** — scale freely, and **this is the current bottleneck**: 22 tasks completed,
  1 verdict written. Partition the queue to avoid two reviewers auditing the same folder.
- **WORKER-MONITOR** — one is usually right, because the whole job is having the whole
  picture. Two means two agents messaging the same worker.
- **TASK-AUTHOR** — one or two. Briefs are only as good as the research behind them.
- **QA-GATE-TESTER** — one at a time. Two testers on one gate will produce conflicting
  fixtures, and the tests collide on the same files.
- **DATA-STEWARD** — **exactly one.** This role takes the seeds lock, and the lock
  serialises it. A second steward waits rather than works.
- **IMPLEMENTATION** — one at a time per file. It is the only role that writes
  application code, so parallel instances collide immediately.

When two instances of the same role would collide, the second waits. Say so and pick
different work.

## The pipeline

```
TASK-AUTHOR ──seeds──▶ pending/
                            │
WORKER ──claims──▶ in-progress/ ──finishes──▶ completed/ + HANDOVER.md
                            │                        │
                    WORKER-MONITOR                  │  DATA-STEWARD audits the data
                    watches, routes                 │  (if the task touched data)
                            │                        ▼
                            └────────────────────▶ REVIEWER ──verdict──▶ PASS
                                                                    │
                                                      FAIL ─────────┤
                                                      SUSPEND ──────┘ (owner)
                                                                    │
                                                            IMPLEMENTATION
                                                                    │
                                                        code + gates, then
                                                                    │
                                                        QA-GATE-TESTER proves
                                                        the gate still bites
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

## Three rules that override everything else

1. **A worker never stalls.** Red gate, missing write-path, wrong brief, unknown value —
   all of these are things to *document*, not reasons to stop. Write the handover, claim
   the next task. See `.clinerules` §1.
2. **The implementation agent only acts on PASS.** If the reviewer said FAIL, the code
   does not get written.
3. **Nobody fills a value they cannot source.** Leave it EMPTY. This outranks the
   requirement to finish.

## Verify these still say what they say

```bash
npm run roles:check
```

Fails if a role file is missing, if a role has lost its defining prohibition, or if the
handover statuses drift between the role files and `.clinerules` §10.6 — which are read
by different agents and would otherwise disagree silently. A protocol nobody checks is a
protocol that decays.