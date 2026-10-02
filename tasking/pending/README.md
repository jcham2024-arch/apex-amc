# Pending tasks

Each task is a **folder** holding two files with different jobs:

```
task-<name>/
  task.json   the MANIFEST - machine-checkable. Write-set, required outputs,
              prohibitions, status. `npm run tasking:check` enforces it.
  BRIEF.md    the CONTEXT - what to do and why, in prose. No gate can enforce
              prose; this is for you.
```

The split is the point. The manifest says what must *exist* when you're done, so
"finished" becomes a checkable claim rather than a chat summary. The brief carries
the reasoning that a machine can't check.

> ## This folder is read-only to you
>
> **The Master Planner owns `pending/`. You may read everything. You may not write,
> rename, move, or "tidy" anything in it.**
>
> Claiming a task means **moving its whole folder out** into `../in-progress/`.
> That move is the lock — no registry to race on, no lock to expire. A second agent
> simply cannot see a claimed task.
>
> **If a brief is wrong, report it. Do not repair it.** Fixing briefs is the
> planner's job. This boundary was already crossed on 2 Oct 2026, and it cost a
> corrupted brief and two agents renaming the same file at once.

## Claiming

```bash
mv tasking/pending/task-<name> tasking/in-progress/
```

First mover owns it. If the folder is gone, another agent has it — **choose another,
do not touch the running one.**

## When you finish

Your folder must contain **every file listed in `required_outputs`** in your
`task.json` — no exceptions, or `npm run tasking:check` fails and the task is not
done. Then:

1. Move `tasking/in-progress/<task>/` to `tasking/completed/<task>/`.
2. **Immediately claim the next available task** without being asked.

An idle worker is a task not being done. If this folder is empty when you look,
report **"queue empty"** and stop — that's a correct result and the signal the
planner needs to write more.

## Available now

These are all **research-only** and safe to run in parallel: each writes only inside
its own output folder and copies nothing into the main tree.

| Task folder | Agent | Delivers |
|---|---|---|
| [trademark-clearance/](trademark-clearance/) | scout-legal | Name clearance for 12+ candidates + domains |
| [ballistics-oracles/](ballistics-oracles/) | scout-math | Peer-reviewed methods to verify the solver |
| [cartridge-dimensions/](cartridge-dimensions/) | scout-data | SAAMI/CIP dimensions for our 229 cartridges |
| [interior-ballistics/](interior-ballistics/) | scout-math | Powder properties + load-synthesis verdict |
| [exterior-ballistics/](exterior-ballistics/) | scout-data | Trajectory datasets + BC reference |
| [ammoseek-coverage/](ammoseek-coverage/) | scout-data | Caliber gap table + sourcing plan |
| [ui-research/](ui-research/) | scout-design | Top-tier layout research + mockups |
| [docs-audit/](docs-audit/) | scout-data | Documentation accuracy audit |
| [code-audit/](code-audit/) | scout-code | Dead code, duplication, config review |
| [shot-group-taxonomy/](shot-group-taxonomy/) | scout-research | Instructor-verified shot-fault taxonomy |
| [handgun-coaching-feasibility/](handgun-coaching-feasibility/) | scout-research | Feasibility, privacy and liability verdict |

### Read before dispatching

**Some tasks carry a `prohibitions` array in `task.json` — read it.** Two are
safety-critical:

- **interior-ballistics** must **not** state a charge weight for any
  cartridge/projectile/powder combination, not even as an example. A charge weight is
  the one output in this domain where a plausible-looking wrong number injures
  people. If the agent reports it cannot complete the task without stating one, that
  is the finding, and it is a good one.
- **shot-group-taxonomy** must **not** write coaching advice or assess a shooter.
  It compiles what instructors already teach; it does not invent an interpretation.

**One task expects an incomplete result.** `cartridge-dimensions` starts from six
dimensional columns that are 0/229 populated. The correct output leaves cells EMPTY
where no source states a value. An agent reporting "90% complete" has probably
invented the other 10%.

## Blocked

| Task folder | Waiting on |
|---|---|
| [brand-rename/](brand-rename/) | **A human** — the name is your decision, informed by `trademark-clearance` |

Not delegable. Do not dispatch.

## Before you start

Read `.clinerules` §1 and §10: **if `npm run verify` is red when you start, stop and
report.** A red baseline invalidates every Definition of Done in every task.

Run `npm run tasking:check` before you begin — it confirms the queue is coherent and
tells you how many tasks are ready.