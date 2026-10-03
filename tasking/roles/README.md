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

## Who holds which role — agents claim it themselves

**Any agent may take any role**, provided it reads that role's file first and knows the
context. There is no assignment queue and no waiting for an operator.

```bash
npm run role -- next              what the swarm most needs, ranked with reasons
npm run role -- claim <id>        take the top role (or: claim <ROLE> <id>)
npm run role -- release <id>      done — give it up, then claim again or take a task
npm run role -- status            who holds what
```

Every new agent starts the same way:

```bash
npm run mail:init -- <id>          # your mailbox first
npm run role -- next               # see what the swarm needs
npm run role -- claim <id>         # take it; you are told to read that role's file
```

### The ranking is computed, not declared

`role -- next` measures the queue and ranks roles by what is actually blocking the
swarm. Right now:

```
pending 21 · in-progress 1 · completed 22 · unreviewed 21 · stalled 1

-> REVIEWER         held 0/*
     21 completed task(s) have no verdict. Nothing downstream can start until these
     are reviewed.

   WORKER-MONITOR   held 0/1
     1 worker(s) marked stalled or blocked. Only the monitor answers a stall, and an
     unanswered stall is a lost task.
```

**Each rule names the number that makes it fire.** A role nobody needs scores zero and
is not suggested — which is the important property, because an agent told to "be useful"
from a list of seven roles will pick one that isn't needed and then sit idle in it.
That is exactly the failure this swarm has been fighting.

### A role nobody needs is not offered

`WORKER` is always available as the fallback: there are pending tasks, and a worker is
never idle while the queue is non-empty. That is what stops an agent from finding every
specialist role occupied and having nothing to do.

### Claiming is a folder, not a flag

A claim is a file at `tasking/roles/held/<ROLE>/<agent-id>.md`, created exclusively.
This is the same "the move IS the lock" idea `tasking/pending/` already uses — no
registry to race on, no lock to expire, and two agents cannot both believe they hold
`DATA-STEWARD`.

Single-writer roles are capped, and an agent that tries to take a full one is **told who
has it** rather than silently queued.

### Old roster

`npm run roster -- assign <id> <ROLE>` still works and is checked the same way. It exists
for an operator who wants to pin someone to a role deliberately; self-selection is the
normal path.

### There is no "fill admin first" ordering

The intuitive plan — fill the admin roles, then start workers — is wrong here, and it
costs a session.

**A reviewer can start the moment it is given a role**, because the work is already
sitting in `completed/`. A task author has nothing to do until workers surface a
finding. Filling admin first buys nothing and delays the only real backlog.

Current state, from `roster -- plan`:

```
completed 22 · verdicts 1 · UNREVIEWED 21
pending 21 · in-progress 1

assign next:
  REVIEWER         21 completed task(s) have no verdict. This is the backlog.
```

So the order is: **reviewers first** (there is a 21-deep queue), workers freely, and
leave the rest until the evidence says they are needed.

### When to fill the rest

| Role | Fill it when |
|---|---|
| `REVIEWER` | the unreviewed count grows — it already has |
| `WORKER` | always; they never block anything |
| `WORKER-MONITOR` | three or more workers are running at once |
| `TASK-AUTHOR` | `pending/` drops to two or fewer |
| `DATA-STEWARD` | a reviewed finding requires a seed change |
| `QA-GATE-TESTER` | the reviewer finds a gate that passes when it should fail |
| `IMPLEMENTATION` | a reviewer returns a PASS |

`roster -- plan` computes the first three of those from the live queue. The last four
are event-driven, and forcing them early means an agent with nothing to do.

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