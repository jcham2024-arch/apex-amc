# NOTES — for the planner and the review agent

**From:** agent working `interior-ballistics`. **Date:** 10 Feb 2026.
**My work is complete and in `tasking/completed/interior-ballistics/`.** This file
records two things that need a human decision, neither of which is mine to fix.

---

## 1. BLOCKER: `tasking:check` has never checked more than one task

`npm run tasking:check` **fails**, and it would fail for every completed task in this
repo. It is not caused by my work. Three tasks completed by other agents fail
identically.

### The cause

In `scripts/gates/check-tasking.mjs`, the `for (const dir of taskFolders(PENDING))`
loop that registers manifests is **missing its closing brace**. It is swallowed by the
dependency loop further down, so **the loop body executes exactly once** and the
whole gate only ever sees the first directory.

Proven by instrumenting a copy:

```
PENDING= C:\Cline\ApexProject\tasking\pending
dirs= 8
  SET ammoseek-coverage        <- only one SET, then the loop ends
tasking manifests
  1 task(s) in pending/, 1 ready
  4 task(s) in completed/, 0 declared output(s) verified
```

The gate reports **1 task in `pending/`** while **8 directories exist**, 7 of them
with valid `task.json`. Reproducing the loop standalone finds all 8 and registers all
8 — so the manifests are fine and the loop is the defect.

### Why no gate caught it

There is a **stray `}` at end-of-file** (line 223) that balances the missing one:

```
open=58 close=58 delta=0
```

The file is net brace-balanced, so `node --check`, ESLint and every syntax gate pass.
Two braces are in the wrong place and cancel out. **This is the same failure family
`AGENTS.md` records** ("`insert_line` inserting into the middle of a block"; "adding a
`CREATE VIEW` to migration 016 landed inside the open `CREATE TABLE`") — and the same
family as the T5 `BRIEF.md` corruption. Both this and the brief are **out-of-order
insertions that no structural check can see**.

### The second-order problem

Even with the brace fixed, the gate has a design contradiction:

- It builds its manifest map by scanning **`pending/` only** (line 62).
- The documented workflow **moves** the task folder out of `pending/` into
  `completed/`, manifest included (`pending/README.md` §"When you finish", step 1).
- So a completed task has **no manifest in `pending/`**, and the gate fails with
  *"has no manifest in pending/, so its declared outputs cannot be verified."*

That is exactly the message all four completed tasks produce. **The gate and the
protocol disagree about where a manifest lives after a task finishes.**

### What I need

Two changes to `scripts/gates/check-tasking.mjs` (planner-owned, not my write-set):

1. **Close the `for` loop** after `tasks.set(manifest.id, manifest);` (line 122), and
   **delete the stray `}` at EOF** (line 223). Both are required; one alone is a
   syntax error.
2. **Scan `pending/`, `in-progress/` and `completed/`** when building the manifest
   map, so a moved task still resolves.

I have **not** applied either, because `scripts/` is outside my write-set and I must
not edit the main tree. I can provide the tested patch on request — I verified the
brace fix against a copy.

### Why this matters more than a red gate

This gate exists **specifically** because 12 agents once reported finished and wrote
nothing, and nothing on disk could tell the difference. As shipped it verified
**one task at a time and zero outputs** (`0 declared output(s) verified` while four
tasks sat in `completed/`). It would not have caught that original failure either.
Its whole purpose is currently unfulfilled.

---

## 2. DEFECT: `BRIEF.md` for interior-ballistics is corrupted (not repaired)

The brief in my folder is assembled out of order:

- §3 "Context Anchors" has **1 of 4** items; items 2–4 are orphaned **after §7**.
- §5 is cut mid-sentence at "burn rate, pressure exponent, force" and resumes
  **after §7**.
- §5 items 2–5 and the `04-equivalence-rules.md` / `05-feasibility-verdict.md`
  deliverable definitions are all **after §7**, not in place.

Content is complete, only misplaced. I read the orphans and did the work anyway.

**I did not repair it** — `pending/README.md` states the planner owns briefs and this
boundary was already crossed on 2 Oct 2026.

**This is the second occurrence of the same corruption on this brief.** Per
`review/README.md` ("a brief that produces the same rejection twice needs rewriting,
not a second attempt"), it should be **regenerated from a source, not hand-edited a
third time**. Note `docs/AGENT-PROMPTS.md` generates A1–D4 only — **there is no
generator for the T-series briefs**, so nothing would catch or repair this
automatically.

---

## 3. Minor: `KNOWLEDGE.md` has no defined format

It is a `required_outputs` entry in five manifests, is described in **no** brief, and
no other task has produced one yet. I wrote it as the durable cross-task
distillation and said so in its own header. Worth a written convention before five
agents each invent a different one.

---

## State at time of writing

- `tasking/completed/interior-ballistics/` — complete, all 7 declared outputs present.
- `npm run verify` — **passes**.
- `npm run tasking:check` — **fails**, for the gate reason above, affecting four tasks.