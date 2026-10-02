# Multi-agent workspace

**Set up 2 Oct 2026.** This is the machine-readable half of
[`docs/PARALLEL-WORK-PLAN.md`](../docs/PARALLEL-WORK-PLAN.md). The plan says
*what* the tasks are; this directory says *how an agent gets assigned one* and
*how overlap is prevented mechanically*.

```bash
npm run tasks:check    # inside `verify` — fails on any overlapping write-set
```

---

## What is here

| Path | What it is |
| --- | --- |
| [`../.clinerules`](../.clinerules) | Binding rules for every agent. Read first, always. |
| `templates/task-schema.md` | The shape of a task file. Copy it; do not invent a format. |
| `tasks/ledger.json` | Task state, dependencies, write-sets, shared-path locks, model policy |
| `tasks/task-*.md` | 16 generated task files, one per punchlist item |

**The task files are generated.** Each embeds the execution prompt extracted from
[`docs/AGENT-PROMPTS.md`](../docs/AGENT-PROMPTS.md), so there is exactly one
place to edit a prompt. Change it there, regenerate, never hand-edit the copy.

---

## How to run work

1. Confirm `npm run verify` exits 0. A red baseline invalidates every
   Definition of Done in every task.
2. Read [`../.clinerules`](../.clinerules), then the task file.
3. Claim any shared-path lock in `ledger.json` **before** writing it.
4. Spawn a **fresh instance of the default model** for the task.
5. Verify with a negative test, then report the five-part summary.

To see what can run right now:

```bash
npm run tasks:check
```

It prints how many tasks are concurrently runnable. Anything blocked on another
task is excluded, because two tasks that are ordered may safely share a file —
they will never run at the same time.

---

## The two shared surfaces

Almost every collision in this repo reduces to one of these.

**`data/generated/**`** — `npm run data:build` rewrites *every* dataset, so two
agents running it produce ~28 unattributable modified files each. One builder at
a time. To check your own CSV edits use `npm run seed:check`, which writes
nothing.

**`data/schema/*.sql`** — migration numbering is global and every gate replays
the chain. Strictly one agent at a time. See `.clinerules` §3.

`package.json` is also shared, because several tasks add npm scripts. It uses the
lock rather than a blanket ban, because banning it would block A1, A2, A3 and C2
outright.

---

## What the gate does and does not check

**Checks:** every `blocked_by` resolves; no two *concurrently runnable* tasks
share a write path; a blocked task is not marked ready; no path is double-locked;
every referenced file exists.

**Does not check:** whether a write-set is *sensible*. It proves two sets do not
overlap — that is objectively checkable. Whether the split is the right split is
a judgement, and it stays with the Master Planner.

That limit is deliberate. A gate that tries to judge intent cries wolf, and a
gate that cries wolf gets ignored — which is worse than no gate.

---

## It found real bugs immediately

The gate was written after the ledger, and on its **first run** it rejected
three genuine collisions in work I had already planned:

- `A2` and `B3` both wrote `docs/DATA-MODEL.md`
- `A3` and `C2` both wrote `package.json`
- `D1` and `A1` both wrote `README.md`

All three would have had two agents editing one file. The write-sets in
`docs/PARALLEL-WORK-PLAN.md` were written by hand and looked fine; only an
automated comparison found them.

It also caught `D3` being marked `ready` while depending on `D2` and `A3`.

---

## Model policy

Recorded in `ledger.json` under `model_policy`:

- Preferred: **a fresh instance of the default model** (the planning agent's own
  model).
- `require_fresh_instance: true` — a reused context carries the planning
  conversation into the task, which is how context rot starts.
- `allow_downgrade: false` — do not silently switch model to save cost. If the
  user wants a different model, they will say so.

Each task file carries a `**Model:**` line, and the Definition of Done requires
the agent to record what it actually used.

---

## Adding a task

1. Add the prompt to `docs/AGENT-PROMPTS.md`.
2. Add an entry to `ledger.json` with `id`, `title`, `status`, `blocked_by`,
   `write_set`, `file`, and `notes`.
3. Regenerate the task file.
4. Run `npm run tasks:check`. It will tell you if the new write-set collides with
   something already runnable — **that rejection is the feature working.**
