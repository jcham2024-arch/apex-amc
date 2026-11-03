# Documentation audit — findings

Task `docs-audit` (T9). Audit only. **No file in `docs/` was modified**, and no file
outside `tasking/in-progress/docs-audit/` was created or edited.

**Model:** default model, fresh instance. **Audited:** 3 Oct 2026.
**Scope:** 154 Markdown files (47 under `docs/`).

Every finding carries a file and a line number. Counts in `02-stale-counts.md` carry
the command that measured them.

---

## Severity scale

| Level | Meaning |
|---|---|
| **critical** | An agent acting on this doc would be wrong about something load-bearing or safety-adjacent. |
| **high** | A reader would form a false belief about the current state of the repo. |
| **medium** | Misleading, but survivable if the reader verifies. |
| **low** | Cosmetic or historical. |

---

## 1. factual error

### F-1 · `.cline/tasks/ledger.json` → `baseline.stages` = 14 — **high**

The file `tasking/README.md` calls authoritative. It carries **14** where `verify`
declares **19** — the stalest count in the repo, in the file agents are told to trust.

**Recommendation: delete the field, do not bump it.** Bumping re-stales at 20. Replace
with a pointer to the command. `.clinerules` already argues this; the ledger did not
get the same treatment.

### F-2 · `AGENTS.md:52,53,59,61` — **high**

Row count (989 → **1031**), CSV count (23 → **26**), manufacturers (50 → **58**), tests
(215 → **235**), coverage (not started=32→**33**, n/a=8→**15**). Full table in
`02-stale-counts.md`. `AGENTS.md` is the file every agent is told to read first.

### F-3 · `README.md:54,57` — **high**

`15 gates` → **19 stages**; `1,666 rows` → **1031** measured (`1,666` unverified — see
§6). The README is the first document a visitor or new agent reads.

### F-4 · `docs/TASK-LIST.md:28,38,277` — **medium**

`All nine stages` ×2 → **19**. `989 rows` → **1031**.

### F-5 · `docs/TODO.md:198` — **medium, and the most instructive**

> "Reconcile the README test count | Says 157; `npm test` reports **215 passing**."

This frames 215 as the project total. **`npm test` is the core suite only.** The total
is `npm run test:all` = 215 + 7 + 13 = **235**. The doc is wrong in *scope*, which is
worse than being wrong in a number — a reader who runs `npm test` reproduces the error
and concludes the doc is right.

### F-6 · `docs/PARALLEL-WORK-PLAN.md:90,94,295` — **medium**

Line 90 issues the rule "Do not quote a stage count"; lines 94 and 295 then quote stage
counts (15). The document breaks its own rule. Line 295's `15 stages` → **19**.

### F-7 · `ROADMAP.md:24` — **medium**

`215 passing` → **235**, or "215 in the core suite" if the scope is named.

### F-8 · `docs/TODO.md:128` — **medium**

`n/a=8 of 50 manufacturers` → **n/a=15 of 58**.

### F-9 · The trademark risk is documented nowhere in `docs/` — **critical**

The site is named after a **LIVE registered trademark in its own product category**:
APEX AMMUNITION, reg. **5391055**, IC 013, Apex Ammunition LLC (Mississippi), live
storefront with an 18+ age gate.

**No file in `docs/` mentions it.** `grep` for `5391055`, `APEX AMMUNITION` across
`docs/` returns **zero hits**. It appears only in `tasking/`, which is gitignored for
`in-progress/` and is not part of the documentation a human reads.

**Why critical:** `docs/DATA-TODO.md` records the other open legal item (the `recipes`
gap) as a blocker. The brand risk is larger and it is invisible. Anyone auditing this
repo for open work would not know to look. `tasking/completed/trademark-clearance/`
now holds the clearance research and should be linked from `docs/DATA-TODO.md` or
`docs/README.md`.

---

## 2. stale

### S-1 · `docs/PARALLEL-WORK-PLAN.md` — **medium**

A working plan written 2 Oct 2026 describing parallel task execution. Tasks A1–D4 have
since moved to the `tasking/` folder protocol, and the file still describes the old
model. It is also the source of the `15 stages` figure.

**Recommendation: DELETE, not correct.** It documents a process that no longer exists,
and correcting its counts would imply it is still current. See §5.

### S-2 · `README.md:168` — **low**

`(actual; 215 tests against 235). Task D1 fixes this.` — Task D1 is complete. The
sentence describes an unresolved state that no longer exists.

### S-3 · `docs/TODO.md` and `docs/TASK-LIST.md` both exist — **medium**

`AGENTS.md` itself flags this: `docs/TODO.md` is "**Superseded by `DATA-TODO.md` 2 Oct
2026**; kept for provenance." Two active-looking task lists, one explicitly
superseded. A reader who opens the alphabetically-first one gets a stale answer.

---

## 3. duplicate

### D-1 · Brand guidance is spread across three files — **medium**

`BRANDING.md`, `docs/AFFILIATE.md:147` and `README.md:3` all discuss brand/trademark.
`BRANDING.md` alone has 10 relevant lines. **Three sources of truth for one policy**, no
cross-reference declaring which wins.

### D-2 · Count-quoting is duplicated across 6 files — **high**

`AGENTS.md`, `README.md`, `ROADMAP.md`, `docs/TASK-LIST.md`, `docs/TODO.md`,
`docs/PARALLEL-WORK-PLAN.md` all quote test/stage/row counts. **Nine of eleven quotes
are wrong.** Duplication is not a neutral maintenance cost here — it is the *mechanism*
of the drift. `.clinerules` fixed this by removing the numbers; the fix has not spread.

**Recommendation: quote a count in exactly one place** (`AGENTS.md`), and have every
other document link to it.

---

## 4. unlinked

### U-1 · `tasking/` is not cross-linked from `docs/README.md` — **medium**

The brief predicted this, and it is partly wrong: **`docs/README.md:92` does link
`mockups/` and line 95 links `versions/`.** So `docs/mockups/` *is* cross-linked — that
part of the brief's known-problems list is out of date.

But **`tasking/` is genuinely unlinked** from `docs/README.md`. The whole four-tier
agent protocol, including the required-output manifest that makes "done" checkable, is
invisible from the documentation index.

### U-2 · The completed clearance research is unlinked from `docs/` — **critical**

Same root cause as F-9. `tasking/completed/trademark-clearance/` is a real, complete,
git-tracked research result with no pointer from `docs/`.

### U-3 · `docs/lessons/` and `docs/research-methods/` — **low**

Present, each with a README, not linked from `docs/README.md`'s table.

---

## 5. unclear

### U-4 · Which document wins when two disagree? — **medium**

Six files quote counts and disagree. `docs/versions/README.md` notes doc counts "were
stale at tag time", `AGENTS.md` says to trust measurements, `.clinerules` says never
quote a count — **but no document states the precedence rule for docs that contradict
each other.** `03-doc-index.md` proposes one.

---

## 6. Not verified — stated rather than guessed

| Item | Where | Why not |
|---|---|---|
| `1,666 rows / 24 tables` | `AGENTS.md:58`, `README.md:54,68` | Verifying requires `npm run db:local`, which writes `data/generated/apex.sqlite` — outside my write-set. **Left uncorrected.** Correcting an unmeasured number is the exact failure mode this repo exists to prevent. |

---

## 7. The document I would DELETE

> **`docs/PARALLEL-WORK-PLAN.md` — delete rather than correct.**

**Reason:** it is not wrong in a way a number can fix. It describes a **process that no
longer exists** — a parallel task plan superseded by the `tasking/` folder protocol with
`task.json` manifests. Correcting its `15 stages` to `19` would make it look
*maintained*, which is worse than leaving it visibly stale: the next agent would trust a
document describing a protocol that was replaced three commits ago.

It also breaks its own central rule three times (F-6), so it cannot be cited as
authority even for the parts that are right.

**The honest fix is deletion plus a pointer.** `.clinerules` §5 rule 7 asks for trap
history, so the *lesson* ("do not quote a stage count") should be preserved — in
`.clinerules`, where it already lives — while the artefact goes.

---

## Summary

| Severity | Count |
|---|---|
| critical | 2 (F-9, U-2) |
| high | 3 (F-1, F-2, D-2) |
| medium | 8 |
| low | 2 |

**The single highest-value action is F-9/U-2: the trademark risk is invisible in
`docs/`.** Everything else is drift in numbers that were once true.