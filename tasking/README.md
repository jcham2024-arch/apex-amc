# Tasking - the agent swarm

This directory is the **only** coordination channel between agents on this project.
Four folders, and the single rule that matters is at the top.

---

## THE ONE RULE

> **`pending/` is owned by the planning agent. Every other agent READS it and never
> writes to it. Not to fix a typo. Not to fill in a blank. Not to "just correct the
> path". Not ever.**
>
> If a brief is wrong, finish your task and **report the defect**. The planning agent
> fixes briefs. That is its job, not yours.

This rule exists because it was already violated. On 2 Oct 2026 multiple agents edited
briefs in `pending/` concurrently. Two agents renamed the same file at the same moment,
one brief was briefly corrupted with its whole body collapsed into a single line, and
`tasks:check` went red because a brief pointed at a file that no longer existed. It was
recovered from git, but only because the damage happened to be tracked.

**Recovery was possible by luck. Do not rely on it again.**

---

## The four folders

| Folder | Who writes | What it is |
|---|---|---|
| `pending/` | **planning agent only** | Task briefs waiting to be claimed. READ-ONLY for you. |
| `in-progress/` | **you** | Your workspace. Claimed tasks, work in flight. |
| `completed/` | **you** | Finished and self-checked, awaiting review. |
| `review/` | **review agent only** | Findings, merge decisions, rejections. |

### Why `in-progress/` exists

Without it, an agent that starts has nowhere to put work that isn't finished. The
result is that half-finished output lands in `completed/` where it reads as done, or in
`pending/` where it corrupts the briefs. That is exactly what happened.

`in-progress/` is yours. Put whatever you like there. Nobody reviews it, nobody gates
it, and it is gitignored. If your session dies, the folder is the record of how far you
got, and a reassigned agent can resume from it.

---

## How to claim a task

Every task is a **folder** holding two files:

- `task.json` — the manifest: write-set, **required outputs**, prohibitions. This is
  machine-checked by `npm run tasking:check`.
- `BRIEF.md` — the context: what to do and why, in prose.

Read both before starting.

```bash
ls tasking/pending/                        # what's available
cat tasking/pending/<task>/task.json       # what is REQUIRED of you
mv tasking/pending/<task> tasking/in-progress/   # CLAIM - the move is the lock
```

**The move is the lock.** The folder physically leaves `pending/`, so a second agent
listing the directory cannot see it. No registry to race on, no lock to expire. First
mover owns it. If the folder is gone, another agent has it — pick a different one.

Work in `in-progress/<task>/`. When you are done, that folder must contain **every
file listed in `required_outputs`** — no exceptions. Then move the whole folder to
`completed/<task>/`, brief included, because a reviewer needs it to judge the work.
---

## Take the next task without being asked

**When you finish a task and a task remains in `pending/` that nobody has claimed,
claim it and start. Do not wait to be prompted. Do not stop after one task.**

This is the rule that makes the swarm fast. A worker that finishes and sits idle is the
most expensive outcome here, because every idle worker is a task not being done.

Before claiming, check:

- **Is there a brief in `pending/`?** If not, **stop and wait.** That is not a failure -
  it means the queue is empty and the planning agent owes you work.
- **Has its `blocked_by` been satisfied?** If not, leave it and try another.
- **Does it claim a write-set another running task owns?** If so, **skip it** and say so
  in your report. Two agents on one file is the collision that is actually expensive.

Then claim it and go.

**When you run out of tasks, say so plainly and stop.** Do not invent work, do not
improve the codebase unasked, and do not start a task with no brief. Reporting "queue
empty" is a correct and useful result, not a failure.

---

## Write-sets are the collision boundary

Every brief states its own write-set. Read it before starting.

- **Research-only tasks are mutually safe.** Each writes only inside its own output
  folder and touches no shared file. **These should all run at once.**
- **Tasks touching `data/`, `packages/`, `apps/`, `scripts/` or `package.json` are not
  safe alongside another task touching the same file.**
- `.cline/tasks/ledger.json` records the authoritative write-sets. Read it. It is
  authoritative on overlap; your judgement is not.
- **Migrations are strictly serial.** One agent at a time, ever.
- `npm run data:build` rewrites every generated dataset. **One agent at a time.**

If your task needs a file another running task owns: **skip it, and say which task
blocked you.** That is a valid outcome and far better than a merge conflict.

---

## Two things you must not do

**Do not edit the main project tree.** Not the code, not the data, not the config. You
copy files out, work on the copies, and stage them in your output folder. A merge is a
separate, deliberate act by the review agent who has read the diff.

> This is what the whole system is for. An agent that edits `main` has already shipped,
> whether or not anyone reviewed it. A rejected task costs nothing here; a rejected
> task that already edited the tree costs a revert.

**Do not trust the gates to validate your own output.** `tasking/completed/` and
`tasking/in-progress/` are deliberately excluded from `npm run lint` and
`npm run docs:check`. A staged copy may be deliberately partial, or mid-way through
removing a defect, and failing the build for it would be wrong.

The consequence is real: **a defect in your staged output will not be caught by running
the gates. You must read your own work back and check it.** This asymmetry is why the
review step exists, and why "the gates passed" is never a verification of your output -
only of your isolation.

---

## Talking to other agents

**Write it in a file.** Any agent can read any file.

- `tasking/in-progress/<task>/NOTES.md` - anything you want to tell another agent.
- `tasking/review/FINDINGS.md` - the review agent's decisions, readable by everyone.
- The `NOTES.md` in a completed task, if a finding needs to reach the planner.

This is deliberate over any chat channel: **a file survives a dead session**, it is
version-controlled, and it cannot be lost by an agent that has exited. A message sent to
an agent that is no longer running is simply gone.

**What belongs in a file:** anything that changes what another agent would do.
Everything else is noise.

---

## Related

- `.clinerules` - **binding.** §1 isolation, §5 rules 1 and 10, §8 the report format
- [pending/README.md](pending/README.md) - the queue index
- [.cline/tasks/ledger.json](../.cline/tasks/ledger.json) - authoritative write-sets

## Why the gates ignore `tasking/completed/`

Both exclusions were measured, not assumed, and both were failures first.

`eslint .` linted a staged `.mjs` copy and failed with
`'unused' is assigned a value but never used`. `npm run docs:check` failed a staged
`.md` for CRLF line endings. Neither file was project code - both were copies of files
under review - so neither failure meant anything.

A staged copy may also be a deliberately partial intermediate state, or may be
mid-way through removing a defect. Either way, failing the build for it is wrong.
`tasking/pending/` is **not** excluded: those are real briefs and are checked.

In `scripts/gates/check-docs.mjs` the exclusion is the **bare directory name**
`'completed'`, not `'tasking/completed'`. `SKIP_DIRS` is compared against each entry's
own name as the walk recurses, so a path string can never match. The first attempt
used the full path and silently did nothing.

## What a reviewing agent does

1. List what the Sub-Agent staged: `git status` in `tasking/completed/`.
2. For each staged file, `git diff --no-index` it against the main-tree original.
   That shows the change as a reviewer should see it.
3. Decide **per file**: merge it, discard it, or send it back with a reason.
4. Merging is a real edit to the main tree. Run `npm run verify` afterwards.
5. Move the brief from `pending/` to `completed/` once fully merged, or delete the
   staged folder if the work was rejected. A rejected brief is worth recording, not
   deleting - `.clinerules` §5 rule 7 asks for trap history.

## Related

- `.clinerules` - binding, especially §1 isolation and §5 rule 10 (scratch goes in
  `tmp/`, not the repo root)
- `.cline/tasks/ledger.json` - the authoritative task ledger and write-set locks
- [pending/](pending/README.md) - the briefs currently available