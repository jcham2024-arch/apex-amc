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

> **Rewritten 2 Oct 2026 - do not trust the old table.** Every row in the previous
> version of this table pointed at a task that had already moved to `completed/`, so
> **11 of its 12 links were dead**. A new agent reading it would have tried to claim
> `trademark-clearance` or `interior-ballistics` - work already finished - and either
> failed confusingly or duplicated it. Reported by agent dc408; verified before
> rewriting: all 12 resolved to `completed/`, none to `pending/`.

**This folder is the source of truth. Read the folders, not this table.** It is
generated from their `task.json` files and is a convenience, not the queue.

**Nothing here is a code task.** These are research/spec tasks: each writes only inside
its own output folder and copies nothing into the main tree. They are safe to run in
parallel.

### highest

| Task folder | Delivers |
|---|---|
| [caliber-preset-selector/](caliber-preset-selector/) | A searchable caliber dropdown covering every cartridge we hold |
| [component-cost-model/](component-cost-model/) | Cost model - tax, shipping, provenance, and user override |
| [script-library-docs/](script-library-docs/) | Document the script library so an agent can use it without reading source |
| [script-object-factory/](script-object-factory/) | Design the script object factory - real insulation, not ceremony |
| [site-modular-architecture/](site-modular-architecture/) | Every page section becomes a module, not a hardcoded block |

### high

| Task folder | Delivers |
|---|---|
| [blocker-ledger/](blocker-ledger/) | A blockers ledger so a task that cannot succeed is never re-attempted |
| [cartridge-row-identity/](cartridge-row-identity/) | One row per cartridge, or one per cartridge-platform - decide before re-filing |
| [claims-gate-prose-scope/](claims-gate-prose-scope/) | Extend `claims:check` to the prose corpus, not just the built site |
| [code-review-sweep/](code-review-sweep/) | Adversarial review of gates, physics core, and website |
| [findings-ledger/](findings-ledger/) | One subject index over `tasking/completed/`, so an agent can find an existing finding in one step |
| [load-interpolation-schema/](load-interpolation-schema/) | Schema and EMPTY semantics for load-data interpolation |
| [pdf-licence-probe/](pdf-licence-probe/) | Build a reusable notice-detector for third-party PDF data sources |
| [published-load-lookup-spec/](published-load-lookup-spec/) | Give the user the manufacturer's own published load data, cited |
| [script-library-refactor/](script-library-refactor/) | Assess script consolidation, and whether OOP factories are warranted |
| [shared-library-consolidation/](shared-library-consolidation/) | Make the shared script library real, not aspirational |
| [website-design-iteration/](website-design-iteration/) | Apply the accumulated UI findings to the live site |

### medium

| Task folder | Delivers |
|---|---|
| [ballistics-surface-spec/](ballistics-surface-spec/) | Make the ballistics module reachable from the main page |
| [knowledge-base-audit/](knowledge-base-audit/) | Audit the knowledge base for staleness and contradiction |

### standing - always available

| Task folder | Delivers |
|---|---|
| [code-health/](code-health/) | Continuous code health - functionality, design, efficiency, commentary |
| [swarm-improvement/](swarm-improvement/) | Improve the agentic swarm framework |

> **Known contradiction, unresolved.** `tasking/README.md` says: *"When you run out of
> tasks, say so plainly and stop. Do not invent work, do not improve the codebase
> unasked."* The `standing` tasks above ask for exactly that work while idle. Both cannot
> govern. Until the owner rules, a new agent should **claim a real task first** and treat
> `standing` only as what to do after that queue is empty. Raised by dc408; still open.

### Read before dispatching

**Check each task's `prohibitions` array in `task.json` - do not assume it is empty.**

- **No task may state a charge weight** for any cartridge/projectile/powder
  combination, not even as an example. A charge weight is the one output in this domain
  where a plausible-looking wrong number injures people.
- **No coaching advice, and no assessment of a shooter.** Agents compile what
  instructors already teach; they do not invent an interpretation.
- **Incomplete results are expected and correct.** Leave unknown values EMPTY. An agent
  reporting "90% complete" has probably invented the other 10%.

### Blocked

| Task folder | Waiting on |
|---|---|
| [brand-rename/](brand-rename/) | **A human** - the name is your decision, informed by `trademark-clearance` (done - see `../completed/trademark-clearance/`) |

Not delegable. Do not dispatch.

## Before you start

Read `.clinerules` §1 and §10: **if `npm run verify` is red when you start, stop and
report.** A red baseline invalidates every Definition of Done in every task.

Run `npm run tasking:check` before you begin — it confirms the queue is coherent and
tells you how many tasks are ready.
