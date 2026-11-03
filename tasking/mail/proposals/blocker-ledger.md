---
proposal: blocker-ledger
title: A blockers ledger so a task that cannot succeed is never re-attempted
derived_from: tasking/completed/cartridge-dimensions/REPORT.md
evidence: "I did not guess. I sent BLOCKED the moment I would otherwise have had to
  choose, and I left all 1,603 dimensional cells EMPTY rather than transcribe CIP."
shape: change
priority: high
write_set:
  - tasking/completed/blocker-ledger/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
---

# Blocker ledger

Per the taskmaster's REDIRECT of 2026-10-02T15:24. Written as `shape: change`, not
research, because `check-proposals` refuses a research-shaped proposal reaching
outside its own `completed/` folder — and this touches the manifest layer.

**Do not implement from this file.** Protocol changes are the owner's decision.

## The problem, stated by evidence

From `tasking/completed/cartridge-dimensions/REPORT.md`:

> "I did not guess. I sent BLOCKED the moment I would otherwise have had to choose,
> and I left all 1,603 dimensional cells EMPTY rather than transcribe CIP."

That was the right behaviour, and it still cost the swarm. Four agents have now
independently re-attempted work that cannot succeed without permission, because
**nothing on disk distinguishes "this task is blocked" from "this task is ready."**
`task.json` supports `blocked_by`, but nothing *derives* it — an agent must
hand-edit its own manifest after the fact. A task whose premise is wrong will be
dispatched again, reach the same wall, and burn the same turns.

A blocked agent costs one message. Re-attempting a blocked task costs an agent per
dispatch, forever.

## What the ledger records

One file, `tasking/review/BLOCKERS.md`, append-only:

```markdown
| task | blocked_on | evidence | raised_by | date | status |
|---|---|---|---|---|---|
| cartridge-dimensions | CIP extract licence | REPORT.md §2 | 4880a | 2026-10-02 | awaiting-owner |
```

- `task` — the id, must resolve to a real task folder.
- `blocked_on` — what is missing (licence, source, a human decision).
- `evidence` — a path and quote. **No evidence, no entry.** Same rule as
  `.clinerules` §12: a guess wearing a manifest is the failure this replaces.
- `status` — `awaiting-owner` | `resolved`.

## Who may append

**Any agent that has actually hit the blocker — which is the only qualification that
matters.** Appending is one line per row; concurrent appends to a short table are
lower-risk than the shared-file problem `tasking/mail/README.md` describes, but if
that risk is judged unacceptable, the same rule applies: one file per agent, or
blockers written into the agent's own `completed/<task>/NOTES.md` and indexed by a
gate. **The index file is derived, never hand-maintained.**

## How a task becomes permanently blocked rather than infinitely re-attempted

A gate, `scripts/gates/check-blockers.mjs`, wired into `verify`:

1. Every row in `BLOCKERS.md` must name a task that exists, and must carry evidence.
2. Any task appearing there with `status: awaiting-owner` is **excluded from the
   runnable set** that `tasking:check` reports as `ready`.
3. It is never *deleted*. A blocked task stays visible and stays claimed-as-blocked,
   so it disappears from a dispatch list without disappearing from the repository.

## What an agent sees instead of a retry prompt

Today: `12 tasks in pending, 11 ready`, with no indication that one of the 11 is
impossible.

After: the same line, plus the blocked task named with its reason —

```
12 task(s) in pending/, 9 ready, 3 blocked
  cartridge-dimensions: blocked on CIP extract licence (awaiting-owner)
```

An agent reading that knows not to claim it, and knows a human is needed. **The
failure this prevents is an agent spending a full session rediscovering a wall that
is already written down** — which is the same waste as my own re-derivation of the
`check-tasking.mjs` undercount, and the re-derivation of the CIP restriction by four
agents before me.

## Cost

Low. One append-only file, one small gate, one column in existing gate output. No
schema change, no migration, no write-set conflict with any task in flight.