# Task D1 - Reconcile stale doc counts

**Status:** BLOCKED
**Blocked by:** A1, B3
**Shared-path lock needed:** none
**Model:** fresh instance of the default model

> GENERATED FILE - DO NOT EDIT.
>
> The execution prompt below is extracted from
> [`docs/AGENT-PROMPTS.md`](../docs/AGENT-PROMPTS.md), which is the single
> source of truth. Edit the prompt there and run `npm run tasks:gen`.
> This file adds the machine-readable write-set that `npm run tasks:check` validates.

---

## 1. Isolation Boundaries

**Strict Write Paths** - the ONLY files you may create, modify, or delete:

- `AGENTS.md`
- `README.md`
- `HANDOFF.md`
- `docs/TASK-LIST.md`
- `docs/DATA-TODO.md`
- `docs/`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Runs after the last doc writer. It also RE-MEASURES the stage count rather than copying it, so an out-of-date run cannot ship a wrong number.

---

## 2. Context Anchors - read in this order

1. [`.clinerules`](../../.clinerules) - binding
2. [`docs/CONVENTIONS.md`](../../docs/CONVENTIONS.md) - binding
3. [`docs/PARALLEL-WORK-PLAN.md`](../../docs/PARALLEL-WORK-PLAN.md)
4. `AGENTS.md`

---

## 3. Execution Prompt

> Paste verbatim into the sub-agent.

```markdown
You are working in C:\Cline\ApexProject, task **D1: reconcile stale counts**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. AGENTS.md's "Before you do anything" and "Current state" sections
4. README.md, HANDOFF.md, docs/TASK-LIST.md, docs/DATA-TODO.md
5. package.json — the actual verify chain

BACKGROUND — WHY THIS IS A PREREQUISITE, NOT COSMETIC
The docs disagree with each other and with reality:
  TASK-LIST.md  says 9 verify stages
  DATA-TODO.md  says 10
  AGENTS.md     says 11 and "~215 tests"
  README.md     says 215 passing
  ACTUAL        14 stages, 235 tests (2 Oct 2026)
Every §A/§B prompt states its own measured number rather than citing the docs
precisely because an agent reading a stale figure will mis-plan.

YOUR WRITE-SET:
  AGENTS.md, README.md, HANDOFF.md, docs/TASK-LIST.md, docs/DATA-TODO.md
  and any other doc quoting a stage or test count you find

DO NOT TOUCH: source files, data, scripts. This is a documentation task.

METHOD
- MEASURE first: run `npm run verify` and count the stages and tests yourself.
  Do not copy any number from any document, including this prompt. The count will
  have moved if A1 added a stage.
- Fix every stale count, not just the four named above. Search the docs.
- Where a number will go stale again, replace it with the COMMAND that produces
  the live value. AGENTS.md already uses that pattern — apply it consistently.
- Leave TASK-LIST.md's reasoning intact. It is stale on numbers and correct on
  why. Annotate the numbers; do not delete the reasoning.
- Add docs/CONVENTIONS.md and docs/AGENT-PROMPTS.md to any index listing the
  other docs, so an agent finds them.

DONE WHEN
- no document quotes a count that disagrees with a fresh measurement
- docs:check exits 0
- summary states the measured numbers and every file you changed
```

---

## 4. Definition of Done

- [ ] `npm run verify` exits 0
- [ ] Mandatory negative test run and observed FAILING; output pasted verbatim
- [ ] `git status --porcelain` shows nothing outside section 1
- [ ] Documentation updated in the same change
- [ ] If the main app changed: `npm run website:build`, then
      `npm run handoff:accept -- --note="what changed and why"`
- [ ] Model used recorded here: fresh instance of the default model
- [ ] Five-part summary per [`.clinerules`](../../.clinerules) section 8,
      including what you found but did NOT touch
