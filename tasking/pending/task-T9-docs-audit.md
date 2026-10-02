# Task T9 - Repository documentation audit

**Status:** READY
**Blocked by:** none
**Workflow:** copy-out to `tasking/completed/T9/` - see [tasking/README.md](../README.md)
**Model:** [record on start - fresh instance of the default model]

> **RESEARCH AND AUDIT ONLY. DO NOT EDIT ANY DOC IN `docs/`.**
> You produce a corrected set in your staging folder for a reviewer to merge.

---

## 1. Isolation Boundaries

**Strict Read Paths** - read anything; you NEED:

- `docs/**/*.md` - 30+ files, the subject of the audit
- `docs/README.md` - the index
- `AGENTS.md`, `ARCHITECTURE.md`, `HANDOFF.md`, `README.md`, `SECURITY.md`, `CHANGELOG.md`
- `.clinerules` - binding
- `.cline/tasks/ledger.json` - current task state

**Strict Write Paths** - ONLY inside `tasking/completed/T9/`:

- `tasking/completed/T9/01-findings.md`
- `tasking/completed/T9/02-stale-counts.md`
- `tasking/completed/T9/03-doc-index.md`
- `tasking/completed/T9/corrected/*.md`  (copies, if you propose replacements)
- `tasking/completed/T9/REPORT.md`

**Do not edit** `docs/`, `apps/`, `data/`, `scripts/`, or `package.json`.

---

## 2. Known problems - start here, then find more

Measured during this work:

- **Stage count drift.** `.clinerules` states a stale stage count for `verify`.
  The actual count must be MEASURED from `package.json`, never quoted from memory or
  copied between documents; `docs/PARALLEL-WORK-PLAN.md` says the same. Report what you
  measured and where it disagrees, and correct the source of truth rather than the copy.
  actually declares **19**, and `ci:check` reports 19. `docs/PARALLEL-WORK-PLAN.md`
  says *"Do not quote a stage count"* and then immediately quotes one. `AGENTS.md` and
  `CONVENTIONS.md` say 235 tests (correct); `docs/versions/README.md` records that
  doc counts were stale at tag time.
- **Ledger task count drift.** `ledger.json` `baseline.stages` says 14 while
  `ci:check` reports 25 tasks.
- **The `docs/mockups/` README and the new `tasking/` structure** are not cross-linked
  from `docs/README.md`.
- **The rename risk may not be documented anywhere** - the placeholder brand and the
  live `APEX AMMUNITION` registration (Reg 5391055, IC 013) should be recorded as an
  open legal item with a pointer to `tasking/pending/task-T1-trademark-clearance.md`.

---

## 3. Execution Prompt

> Paste verbatim.

Audit the repository documentation for accuracy, staleness and duplication, and
propose corrections in your staging folder.

**`01-findings.md`** - for each finding: file, line number, what is wrong, why it matters,
and the severity. Group as **factual error** / **stale** / **duplicate** /
**unlinked** / **unclear**.

**`02-stale-counts.md`** - find EVERY place a number is quoted that no longer matches
reality: test counts, stage counts, dataset row counts, task counts, file counts.
For each: where it is, what it says, what the true value is, and how you verified the
true value. **Do not correct a number you have not measured.**

**`03-doc-index.md`** - the doc index, restructured for someone who has never seen this
repo: what to read first, what is authoritative, what is historical, what is superseded.
Note which documents contradict each other and which one wins.

**`corrected/*.md`** - where a fix is a text edit rather than a deletion, stage the
corrected file. Preserve the original structure; this is not a rewrite. **Do not stage a
file you have not actually corrected** - a "corrected" copy identical to the original is
noise in a review.

---

## 4. Definition of Done

**Validation:**

- [ ] `git status --porcelain` shows changes ONLY under `tasking/completed/T9/`
- [ ] `npm run verify` still exits 0
- [ ] Every count you correct has a command output proving the true value
- [ ] Every finding has a file and line number
- [ ] No `docs/` file was modified

**Mandatory negative test:**

- [ ] Paste one count you initially believed was correct and found to be wrong
- [ ] Paste the commands that measured the true values
- [ ] Name one document you would DELETE rather than correct, with the reason

**Report:** `REPORT.md`, five-part summary from `.clinerules` §8.
