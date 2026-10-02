# Task ID: [ID] - [Title]

**Status:** Ready | In Progress | Blocked | Done
**Blocked by:** [IDs, or none]
**Write-set lock:** [shared path currently locked by this task, or none]
**Model:** [name + whether a fresh instance]

> Template for this repository. Every field in §1 and §4 is enforced by
> `npm run tasks:check`, which fails on an overlapping write-set, an unresolved
> backticked path, or a missing negative test.

---

## 1. Isolation Boundaries

**Strict Read Paths** — you may read anything, but these are what you NEED:

- `path/`

**Strict Write Paths** — the ONLY files you may create, modify, or delete:

- `path/`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See `.clinerules` §1.

**Shared files this task may touch** (lock each in `ledger.json` first):

- [ ] `package.json`
- [ ] `data/schema/*.sql` — migrations are STRICTLY SERIAL
- [ ] `data/generated/**` — only one agent may run `npm run data:build`
- [ ] `scripts/shared/data.mjs`

---

## 2. Context Anchors — read in this order

1. `.clinerules` — binding
2. [`docs/CONVENTIONS.md`](../../docs/CONVENTIONS.md) — binding: OOP, comments,
   security, negative tests, encoding
3. [`docs/PARALLEL-WORK-PLAN.md`](../../docs/PARALLEL-WORK-PLAN.md) — shared-surface rules
4. `AGENTS.md` — traps and boundaries
5. Task-specific files listed below

**Task-specific:**

- `path/to/file` — why it matters

---

## 3. Execution Prompt

> Paste this section verbatim into the sub-agent.

[Direct, imperative instructions. State what to build, the constraints, and the
traps most likely to be hit. Name the rejected alternative where there is one.]

---

## 4. Definition of Done

**Validation commands** — run all, paste output:

```bash
npm run verify
```

**Mandatory negative test** — break it deliberately, observe the failure, restore:

- [ ] Gate/run X FAILS with exit 1 on the injected fault
- [ ] Faulting output pasted verbatim in the summary
- [ ] Clean run FAILS-free afterwards

> A gate never observed failing is not known to work. Three in this repo passed
> against deliberately broken input before that was found.

**Isolation check:**

- [ ] `git status --porcelain` shows no modification outside §1
- [ ] No speculative "while I was in there" edits

**Docs:**

- [ ] Documentation updated in the same change
- [ ] Every backticked path resolves (`npm run docs:check`)
- [ ] New gate added to `README.md` and the `verify` chain

**If the main app changed:**

- [ ] `npm run website:build` run
- [ ] `npm run handoff:accept -- --note="what changed and why"` run

**Report:** the five-part summary required by `.clinerules` §8.
