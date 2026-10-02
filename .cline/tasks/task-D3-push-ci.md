# Task D3 - Push review branch, confirm CI, merge

**Status:** BLOCKED
**Blocked by:** D2, A3
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

- `(git remote only)`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Do not merge until the browser CSP step is seen RUNNING and PASSING.

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
You are working in C:\Cline\ApexProject, task **D3: push a review branch,
confirm CI, then merge**.

BLOCKED ON: D2 complete, and A3 complete (the browser CSP check must have
actually run on ubuntu-latest at least once).

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. .github/workflows/verify.yml
4. docs/PARALLEL-WORK-PLAN.md §D3

SEQUENCE
1. Push a BRANCH. Not main. Never push directly to main.
2. Watch the GitHub Actions run to completion. Do not merge on assumption.
3. Confirm specifically that the browser CSP step RAN and PASSED. It has never
   executed on the runner, and a step that silently skips is the exact failure
   this task exists to prevent. Check the step list, not just the green tick.
4. Only then merge.

IF CI FAILS
Fix it. Do not weaken a gate to get green — a gate that has to be relaxed to
accept a change is telling you something true. Report what it caught.

IF THE CSP STEP DOES NOT APPEAR
Stop. That is A3's failure, not something to work around here.

YOUR WRITE-SET: git remote operations only. DO NOT TOUCH file contents.

DONE WHEN
- the branch is pushed and CI ran to completion
- you have pasted the CI step list showing the CSP check running and passing
- merged to main only after that
- summary states the branch, the CI run URL, the step list, and the merge result
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
