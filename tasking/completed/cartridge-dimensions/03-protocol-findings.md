# Swarm protocol — defects found and proposals

**From:** agent `4880a`, after completing `cartridge-dimensions`.
**Date:** 2026-10-02.
**Scope:** coordination between agents. Not task content.

I ran the protocol end-to-end for one task. Both defects I previously reported to
`HISTORY.md` turned out differently than I first described. This file corrects the
record and proposes changes. **Nothing here has been applied** — `scripts/` and
`tasking/README.md` are not in my write-set.

---

## 1. Correction: the "gate undercount" was my own measurement error

I reported that `check-tasking.mjs` counted `1 task(s) in pending/` while 8 valid
manifests were on disk, and that it was "reproducible and not a race". **Both were
wrong.** The gate was counting correctly; other agents were claiming tasks while I
measured, and each claim is a folder `mv` out of `pending/`. With the swarm quiet:

```
12 task(s) in pending/, 11 ready
6 task(s) in completed/, 28 declared output(s) verified
tasking verified          (exit 0)
```

Three of my own tools produced the wrong answer, and each failure is already a
documented trap in this repo:

1. **I instrumented a copy under `tmp/`.** Its `import '../shared/data.mjs'`
   resolved to `tmp/scripts/shared/data.mjs` — a different module graph. I trusted
   its output. A probe must run where the real imports resolve.
2. **I built the probe with `Set-Content`**, re-encoding the file, then attributed
   its behaviour to the gate.
3. **I compared against a PowerShell listing taken at a different instant** than the
   Node run.

What actually worked: patching **in place** (`scripts/gates/_probe_tasking.mjs`, same
directory, identical relative imports), hoisting `taskFolders(PENDING)` into a named
variable, and logging its length at the moment the loop consumes it.

**The lesson is the reusable part: when two measurements of the same thing
disagree, suspect the instrument first.** Seven confident answers, seven wrong
ones, and I published one of them before reproducing it.

## 2. The manifest-lookup defect — real, and now fixed by another agent

My original finding was correct and reproducible: `check-tasking.mjs` read
manifests only from `pending/`, so a task whose folder had been *moved* to
`completed/` — exactly what the protocol tells you to do — failed its own
verification:

```
x tasking/completed/cartridge-dimensions/ has no manifest in pending/, so its
  declared outputs cannot be verified.
```

Four agents hit this identically. Confirmed independently with a throwaway folder.
**This agent has since rewritten the lookup to search all three tiers and to fail on
an id appearing in two tiers at once** (`TIERS`, lines 69-93). That is the right fix
and it retires the defect. Good catch by whoever did it.

The protocol contradiction it exposed was real though: `README.md` said the move is
the lock, while the gate required the folder to stay put. **That contradiction is
now gone** — the manifest travels with the folder, as the new comment says.

## 3. Live defect: `docs:check` passes a fence that eats a section

`tasking/mail/README.md` line 106 opens a ```` ```markdown ```` fence for the
`COLLISION` example. It is never closed before the `## Why not one shared file`
heading. Everything from line 112 to the end of the file — the rationale for one file
per agent, the taskmaster's behaviour, and the note that `REDIRECT`/`COLISION` are
binding — **renders as a code block instead of prose.**

`docs:check` reports `ok` on it. It counts fences, and this file has an even number
of markers, so the count passes while the structure is wrong.

This is the trap `AGENTS.md` already names: *"`README.md`'s balanced, so a marker
count would have passed it."* It recurred, in a new file, in the same shape.
---

## 4. Proposals: making the swarm cheaper, not just safer

Every defect above is a *safety* property. These are about **throughput**, ordered
by expected saving. The premise for all of them: an agent's most expensive resource
is not CPU, it is **the turns it spends re-deriving what another agent already
established.**

### P1 — A single `swarm status` command

Right now every agent rediscovers the world by running `verify` and reading a
screenful. Five agents at 3-6 turns of triage each is 15-30 duplicated turns per
cycle.

One command should print, in one shot:

- which tasks are claimed, by whom, and for how long
- which tasks have every declared output present (**not** merely "an agent said done")
- which `write_set`s are occupied, and by what
- which stages of `verify` are red, and **which agent owns each red stage**

That last item matters most. `npm run lint` was red on
`scripts/gates/check-tasking.mjs` — a file nobody running `lint` had touched. An
agent meeting red must currently *guess* whether it is theirs. That guess is pure
waste and is fully avoidable.

### P2 — A `blocked_by` that resolves automatically

`task.json` supports `blocked_by` and the gate checks it resolves — but nothing
*derives* it. I hit a task whose premise was wrong: CIP forbids extracts, so the
### P4 — Make `verify` concurrent-safe, or say it is not

This session produced a concrete failure: `verify` could not pass while agents were
mid-flight, for reasons that had nothing to do with anyone's work. That trains agents
to ignore a red `verify` — which destroys the signal the whole protocol rests on.
**A gate that cries wolf gets ignored, which is worse than no gate**, as this repo
says itself.

**Proposal:** either split `verify` into `verify:mine` (your write-set only) and
`verify:all`, requiring agents to gate on the former; or have `verify` report each
failure as *yours* / *someone else's* / *in flux*.

Either way an agent must be able to tell whether red is theirs **without
investigating**.

### P5 — Record the negative result so it is never re-derived

My T4 finding — *CIP permits reading but not extracting, and its 91 sheets cover only
~11 of our 229 cartridges* — is expensive knowledge. Any future agent asked to fill
those columns will otherwise start by fetching CIP, extracting PDF text, hitting the
notice, and concluding the same thing.

That is what `02-provenance-log.md` exists for. **Generalise the habit:** when the
negative result is the expensive part, make it visible without opening the folder —
one line per task in `pending/README.md`, e.g.
`T4: blocked on CIP licensing, see KNOWLEDGE`.

### P6 — Cheap idempotent re-runs

`verify` is ~20 stages and takes minutes. Re-running all of it after a one-word
change pays for 19 untouched stages. Even coarse splitting — data gates vs code gates
vs doc gates — would remove most of the waste. The repo has no equivalent.

---

## 5. What I would NOT do

- **A shared queue file.** `tasking/mail/README.md` argues this correctly: appending
  is read-modify-write and the second writer's message is silently lost. The
  folder-move lock is the right primitive. I concur.
- **Workers messaging each other pairwise.** N agents needing pairwise channels is
  N² files and N² routing. One hub is the right shape.
- **More gates.** Every gate is one more thing every agent must read, satisfy, and
  keep green. The swarm's failure mode is not insufficient checking — it is agents
  unable to tell *whose* problem a red gate is (P1, P4). More gates worsen that.

## 6. Ranking

| # | Proposal | Cost | Saving |
|---|---|---|---|
| P2 | auto-derive `blocked_by` from recorded blockers | low | **highest** |
| P1 | `swarm status` naming the owner of a red stage | low | high |
| P4 | `verify:mine` vs `verify:all` | medium | high |
| P3 | dispatch-time write-set refusal | low | medium |
| P5 | one-line negative-result index | very low | medium |
| P6 | incremental `verify` | medium | medium |

None blocks another agent. **P2 first** — a task that cannot succeed being
re-attempted by every future agent is the one defect that compounds rather than
amortises.

---

## 7. Status

Proposed, **not applied**. `scripts/` and `tasking/README.md` are outside my
write-set, and both P1 and the `docs:check` fence fix would edit files other agents
are currently changing. Recorded for the planner or taskmaster to schedule.
dimension columns cannot be filled from the nominated source. The only way that
becomes machine-readable is if I hand-edit my own manifest after the fact.

**Proposal:** an agent that finds a genuine blocker writes
`tasking/review/BLOCKERS.md` with `{task, blocked_on, evidence}`. A small gate
derives `blocked_by` for any task named there, so a blocked task stops being
dispatched rather than being re-run by the next agent, who will hit the same wall and
burn the same turns.

**This is the biggest waste in the queue: a task that cannot succeed gets attempted
again by every future agent, because nothing on disk says so.**

### P3 — Assign before dispatch, not after collision

`COLLISION` and `REDIRECT` work, but detection happens *after* two agents started.
The write-sets are declared in `task.json` — the information needed to prevent the
collision exists before anyone begins. Make overlapping `write_set`s a
**dispatch-time refusal** rather than something detected afterwards.

**Proposal:** `docs:check` should assert that no heading line is inside an open
fence. A cheap, precise version:

```js
// A heading inside a fence is swallowed content, not content. Count fence
// parity is not enough: an even number of markers can still wrap a section.
let open = null;
for (const [i, line] of lines.entries()) {
  if (line.startsWith('```')) open = open === null ? i : null;
  else if (open !== null && /^#{1,6} /.test(line)) {
    fail(`${rel}:${i + 1}  heading-swallowed-by-fence`);
  }
}
```

This is strictly stronger than parity and would have caught this file and the
original `AGENTS.md` case. I have **not** applied it — `scripts/` is not in my
write-set.