# BRIEF — Every page section becomes a module, not a hardcoded block

**Task id:** `site-modular-architecture` · **Priority:** highest
**Grounded in:** `tasking/completed/ui-research/KNOWLEDGE.md`

## Why this task exists

The owner asked that every piece of the main page be a module we add, not a hardcoded item. Today apps/website/src/index.html is one 593-line file with the calculator, the retailer directory and the content sections all inline. Nothing can be added, removed or reordered without editing that file, and two agents adding two sections at once would collide in the same markup.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ui-research/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.

**Provision your mailbox:** `npm run mail:init -- <your-id>`. It is idempotent, so run it even if the file looks present. An agent with no inbox is an agent whose findings nobody reads. Archived mail from closed agents is in `tasking/mail/archive/` — worth reading before you rediscover their findings.
5. Claim it: `mv tasking/pending/site-modular-architecture tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Inventory every section currently in index.html: its id, purpose, data dependencies, and whether it renders from a data module or hardcoded markup. This table is the input to everything else here.
- Define a module contract: what a section declares (id, title, data source, render function, whether it needs a nav entry) and what the page does with it. Concrete enough that a third party could add a section without reading the page source.
- State the ORDER problem honestly. A registry gives add and remove, but visual order matters on a landing page and a registry has no natural order. Propose the mechanism and say what it costs.
- Specify migration as INDEPENDENT change sets, one per section, each verified alone. A migration that only passes as a whole cannot be reviewed.
- Address the CSP head-on, because it decides the answer: no inline styles, no new remote origins, no icon fonts, one self-contained HTML file. State which module mechanisms survive - ES modules are fine, a bundler is not, dynamic import may be.
- Say what this costs in bytes. The site is 96.3 KB today and the CSP forbids loading anything it did not already load. If modularity pushes past a threshold that matters, give the number.

## Do not

- Do not restructure the page. Produce the contract, the inventory and the plan.
- Do not propose anything adding a runtime dependency, a new remote origin, an inline style, or a bundler step. check-website-build will fail the build.
- Do not design the visuals of any section. Modularity only.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-section-inventory.md`
- `02-module-contract.md`
- `03-migration-plan.md`
- `04-csp-and-size-analysis.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/site-modular-architecture tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.

## If you get stuck - read this before you stop

**You are working in a sandbox. Everything you write is reviewed before it reaches the
main project.** A concern is not a reason to stop.

Do **not** halt because:

- a file you want is outside your write-set - write it up in `NOTES.md`, work around it
- `npm run verify` is red - that is a shared gate; your completion is judged by
  `npm run tasking:check`, which is scoped to **your** declared outputs. Note the
  failure and keep working.
- a brief is wrong or contradicts another document - say so in your report. Fixing
  briefs is the planner's job, and reporting it is the whole contribution.
- a value is unknown - **leave it EMPTY.** An honest gap beats an invented number.

Do **not** halt when you finish with gaps. "I completed most of this and documented
exactly what is missing and why" is a **successful** task. An empty folder with an
explanation is not.

The only two things that stop you: the task folder is gone (someone else claimed it), or
`pending/` is empty - report **"queue empty"** and stop. Both are correct results.

Never weaken a gate and never run `handoff:accept`. Not for permission - those are
judgements about production, which is what the review step is for.
