---
proposal: standing-slot-rotation-naming
title: "The standing slot's brief and its gate demand opposite folder names, and rotation 2 currently has no valid destination"
derived_from: tasking/completed/swarm-improvement/NOTES.md
evidence: "tasking/completed/swarm-improvement-20261003/task.json declares id \"swarm-improvement\" but lives in a folder named \"swarm-improvement-20261003\". The folder name is the lock, so the two must agree."
shape: change
priority: high
write_set:
  - scripts/gates/check-tasking.mjs
  - scripts/tasking/ensure-standing-task.mjs
  - tasking/README.md
required_outputs:
  - REPORT.md
---

## The conflict

Two binding documents disagree about where a finished standing-slot rotation goes.

**The brief** (`ensure-standing-task.mjs` line 125, and every generated `BRIEF.md`):

```
mv tasking/in-progress/%%ID%% tasking/completed/%%ID%%-$$(date +%Y%m%d)
```

…with the justification *"Datestamping keeps every rotation's output instead of
overwriting or blocking on the previous one."*

**The gate** (`check-tasking.mjs`): *"The folder name is the lock, so the two must agree."*

**Measured, rotation 1:** following the brief exactly produced

```
x tasking/completed/swarm-improvement-20261003/task.json declares id "swarm-improvement"
  but lives in a folder named "swarm-improvement-20261003". The folder name is the lock,
  so the two must agree.
x ... has no manifest in pending/, so its declared outputs cannot be verified.
```

Following the gate (plain name) passed: `tasking verified`, 99 declared outputs.

## Why this is urgent, not tidy

**Rotation 2 is currently blocked.** Rotation 1 now owns
`completed/swarm-improvement/`, so:

- the **plain name collides** — `mv` fails with *"Cannot create a file when that file
  already exists"*, which is the trap the datestamp was invented to avoid;
- the **datestamped name fails the gate.**

**There is no third option in the current design.** The next agent to finish this slot has
no destination that satisfies both documents. A standing slot whose only move command can
fail is the exact failure it exists to prevent.

## What would break, per option

**Option A — make the gate tolerant of a datestamped suffix** (recommended).
Match completed folders by the `id` in `task.json`, not by folder name. The folder name
remains the *claiming* lock; it stops being the *verification* key.

- **Breaks:** anything that assumes `completed/<id>/`. `check-mail`'s STOP verification
  counts files in `tasking/completed/<task>/`, so it needs the same id-based lookup.
- **Risk:** low, and it makes rotation 2+ work with the brief as written.

**Option B — make the brief say "plain name only".**
`mv tasking/in-progress/swarm-improvement tasking/completed/swarm-improvement/`

- **Breaks:** rotation 2 loses this rotation's output, because the folder already exists.
- **Unless** the brief also says to archive or overwrite deliberately.

**Option C — keep datestamping, and put rotation N in `completed/swarm-improvement-NN/`.**
Over-engineers a two-rotation problem.

## Recommendation

**Option A**, plus the brief naming the gate's rule so the two stop disagreeing. Then
verify with a **negative test**: complete a rotation to a datestamped name and require
`tasking:check` to pass — which, per `.clinerules` §5 rule 2 and the `code-audit`
finding that *"a gate in `verify` can be green and verify nothing"*, is the only proof
the fix works.

## What I did NOT do

Did not edit the gate, the restock script, or `tasking/README.md`. This task's write-set
is `tasking/completed/swarm-improvement/` only, and `prohibits[]` forbids changing the
protocol as research. **A protocol change is the owner's decision** — that is why this is
`shape: change` and will never be auto-dispatched.