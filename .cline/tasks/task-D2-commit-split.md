# Task D2 - Logical commit split

**Status:** BLOCKED
**Blocked by:** D1, A2, A3, B1, B2, B4, B5, C2, C4
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

- `(git index only)`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Runs last. Never git add -A. Each commit must pass npm run verify on its own.

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
You are working in C:\Cline\ApexProject, task **D2: logical commit split**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. docs/PARALLEL-WORK-PLAN.md §D2
4. `git status` and `git diff --stat` for the actual state

BACKGROUND
195 changed files (156 tracked, 39 untracked) with no logical grouping. One
commit makes the history useless and makes any revert all-or-nothing.

YOUR WRITE-SET: the git index ONLY. Do not edit any file's contents.

Suggested order, each a commit that leaves `npm run verify` green:
1. Remote-history rescue (archive/**)
2. Deploy-path fix (wrangler.toml + the gate that enforces it)
3. CSP browser-check fix (spawn, closeAllConnections, real proof-of-execution)
4. Claims/compliance pass + claims:check
5. Data corrections (pressure primary keys, regenerated data)
6. Documentation and governance

CRITICAL RULES
- Never `git add -A` across chunks. Stage explicit paths per commit.
- `npm run verify` must exit 0 BEFORE each commit. If a commit would need code
  from a later commit to pass, reorder or merge it — do not commit a broken state.
- Do NOT rewrite or squash existing history. These are new commits on top.
- If a file belongs to two commits, put it in the LATER one, where it makes the
  earlier commit coherent.
- data/generated/** is regenerated as a whole. It belongs in whichever commit
  changes the seeds that produce it — and nowhere else.

VERIFY BEFORE YOU FINISH
`git log --oneline -8` and confirm the split reads as a coherent history. Then
confirm nothing you meant to commit is still unstaged. Report anything you
deliberately left out and why.

DONE WHEN
- the history reads as the six logical changes
- every commit individually passed npm run verify
- summary lists the commits, what each contains, and what you left uncommitted
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
