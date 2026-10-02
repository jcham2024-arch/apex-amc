---
proposal: standing-slot-rotation-naming
title: "RESOLVED in dff44f2 — the standing slot's brief and gate demanded opposite folder names"
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

> ## ✅ RESOLVED in `dff44f2` — DO NOT MATERIALISE THIS PROPOSAL
>
> The taskmaster fixed the gate. `check-tasking.mjs` now permits the standing slot in both
> `pending/` and `completed/`, keyed on the **`standing: true` manifest flag** rather than a
> hardcoded id:
>
> ```js
> function isStandingSlot(folderDir, prevTier, tier) {
>   if (prevTier !== 'pending' || tier !== 'completed') return false;
>   const manifest = join(folderDir, 'task.json');
>   if (!existsSync(manifest)) return false;
>   try { return JSON.parse(readFileSync(manifest, 'utf8')).standing === true; }
>   catch { return false; }
> }
> ```
>
> The commit message reads *"…and a gate I had wrong."* **Verified 3 Oct 2026:**
> `swarm-improvement` is currently in both tiers and `npm run tasking:check` reports
> **`tasking verified`**, 110 declared outputs.
>
> **The diagnostic here was correct and is why the gate was fixed.** The *recommendation*
> below (match completed folders by id rather than folder name) is **not** what was
> implemented and is **not needed** — the narrower fix is better, because `standing: true`
> is already a manifest flag, so no folder-name parsing is required.
>
> **Retained as the evidence trail for that fix.** Not to be dispatched.

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