# Task A1 - CI oracle cross-check

**Status:** READY
**Blocked by:** none
**Shared-path lock needed:** `package.json`
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

- `.github/workflows/verify.yml`
- `scripts/gates/ (new file)`
- `scripts/tests/ (new file)`
- `package.json`
- `README.md`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Blocks confidence in all data work. Nothing runs data/reference/ in CI today.

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
You are working in C:\Cline\ApexProject, task **A1: CI oracle cross-check**.

READ FIRST, IN THIS ORDER — do not skip:
1. AGENTS.md
2. docs/CONVENTIONS.md  (binding: OOP, comment style, security, negative tests)
3. docs/PARALLEL-WORK-PLAN.md — the "two shared surfaces" section
4. packages/ballistics-core/src/drag/solver.ts — the drag constant, the
   form-factor derivation, and four named unit/dimension traps in its header
5. packages/ballistics-core/src/drag/dragTables.ts — corrected tables plus the
   three-defect history in its header
6. data/reference/README.md — what makes a dataset an oracle
7. scripts/extract/crosscheck-pressures.mjs — may already do part of this
8. docs/BALLISTICS-AUDIT.md §0 — current ballistics state

BACKGROUND
Three real ballistics defects shipped while 161 tests passed. The tests agreed
with the implementation because both were wrong the same way. data/reference/
is an independent oracle that NOTHING runs in CI. That is the gap.

YOUR WRITE-SET (edit nothing else):
  .github/workflows/verify.yml
  one new gate under scripts/gates/
  one new test under scripts/tests/
  package.json  (add the script AND the verify chain entry, in one edit)
  README.md  (add the npm script to the script table)

DO NOT TOUCH:
  data/schema/011_community_layer.sql
  anything under data/seeds/ or data/schemas/
  packages/ballistics-core/src/** — you are ADDING a check, not changing physics
  apps/** — changing the main app requires `npm run handoff:accept`

WHAT TO BUILD
A gate comparing the domain implementation against data/reference/ that FAILS
npm run verify on a meaningful divergence.

- Assert QUANTITATIVE agreement, not file presence. A gate that checks the
  reference file exists has re-created the problem you are fixing.
- Tolerances must be physically justified. Comment what each is and why. Do not
  pick a number to make it pass.
- Every physical constant per CONVENTIONS §3. If a tolerance needs a constant and
  provenance/constants.ts is outside your write-set, use a named local constant
  with a full comment on its basis, and report this in your summary.
- OOP per CONVENTIONS §2 IF the comparison needs a type with invariants. If it is
  pure functions over parsed data, plain functions are correct — do not
  manufacture a class.
- Header comment: what it checks, why it exists, what it deliberately does NOT.
- If crosscheck-pressures.mjs already does this, REUSE it. Duplicated oracles
  drift, and that is the failure mode.

THE MANDATORY NEGATIVE TEST
Run green. Then deliberately break the implementation — alter a drag constant or
form-factor term in a scratch copy — and show the gate FAILS with exit 1 and a
message naming the divergence. Paste both runs in your summary.

Do NOT claim it works without showing it fail. Three gates in this repo passed
against deliberately broken input before that was discovered. A gate never
observed failing is not known to work.

DONE WHEN
- npm run verify exits 0 with the new stage included
- the negative test was run and observed failing
- README.md lists the new script
- summary states what it checks, the tolerances and their justification, both
  test runs verbatim, and anything found but not touched
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
