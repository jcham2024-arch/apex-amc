# REPORT — docs-audit (T9)

**Task:** `docs-audit` (brief calls it T9). **Agent:** scout-data
**Model:** default model, fresh instance.
**Scope:** 154 Markdown files (47 under `docs/`). **Audited 3 Oct 2026.**
**Status:** complete, staged for review. **No file in `docs/` was modified.**

## Deliverables

| File | Contents |
|---|---|
| `01-findings.md` | 15 findings, each with file + line + severity |
| `02-stale-counts.md` | Every stale count, with the command that measured the truth |
| `03-doc-index.md` | Reading order, authority tiers, 7 documented contradictions |
| `REPORT.md` | This file |
| `SUMMARY.md` | One-page digest — start here |

**No `corrected/` folder is staged.** `task.json` does not require one, and the brief is
explicit that *"Do not stage a file you have not actually corrected — a 'corrected' copy
identical to the original is noise in a review."* Every fix here is either a one-line
number change or a deletion decision; both are the reviewer's to apply, and describing
them precisely is more useful than shipping nine near-identical copies.

---

## 1. What changed

Only `tasking/in-progress/docs-audit/`, and only four new files. **No file in `docs/`,
`apps/`, `data/`, `scripts/` or `package.json` was created, edited or deleted.** No
corrected copies of `AGENTS.md`, `README.md`, `ROADMAP.md` or any `docs/` file were
staged — see above.

## 2. What I verified, and how

**Baseline before starting:** `npm run verify` → exit 0. **Unchanged by me.**

### Mandatory negative test — a count I believed was correct and found wrong

**The brief asserted: *"`AGENTS.md` and `CONVENTIONS.md` say 235 tests (correct)"* and
implied `docs/TODO.md:198` was wrong for the same reason.**

**I believed the brief on this and it was half wrong.** My own prior task had recorded
"215 tests, not 235", and the brief asserted 235. Measuring:

```
npm run test:all ->
  # tests 215   # pass 215   # fail 0     <- core
  # tests 7     # pass 7     # fail 0     <- website
  # tests 13    # pass 13    # fail 0     <- affiliate
```

**215 + 7 + 13 = 235.** The brief was right that 235 is the project total. But it was
wrong about *why* `docs/TODO.md:198` is a defect: that doc says "`npm test` reports 215"
— and `npm test` genuinely does report 215, because it runs **only the core suite**.
The defect there is **scope, not arithmetic**. A reader who follows the doc's own advice
reproduces "215" and concludes the doc is correct.

**This corrected a belief I had carried into this task from the previous one.** The 235
figures at `README.md:161`, `AGENTS.md:29` and `TASK-LIST.md:36` are genuinely correct;
`AGENTS.md:59` and `ROADMAP.md:24` are genuinely wrong.

### Commands that measured every corrected value

```
npm run ci:check    -> verify declares 19 stages; all 19 accounted for
npm run tasks:check -> 19 tasks, 8 concurrently runnable
npm run data:health -> TOTAL 26 1031
npm run coverage    -> done=7 partial=3 not started=33 n/a=15
                        bullet=120 powder=169
Import-Csv data/seeds/manufacturers.csv      -> 58
Get-ChildItem -Recurse data/seeds -Filter *.csv -> 26
$verify -split '&&').Count                     -> 19
```

### Isolation

```
git status --porcelain
```
shows only task-folder entries from the protocol's own move, plus other agents'
concurrent claims. **No project file modified.**

**Correction to my previous report:** in the trademark task I flagged "the 235-test
baseline is stale" — that was **wrong**, and this task is where I caught it.

---

## 3. What I found but did NOT touch

- **`1,666 rows / 24 tables`** (`AGENTS.md:58`, `README.md:54,68`) — **not corrected.**
  Verifying needs `npm run db:local`, which writes `data/generated/apex.sqlite`, outside
  my write-set. Correcting an unmeasured number is the exact failure this repo exists to
  prevent.
- **`docs/PARALLEL-WORK-PLAN.md`** — recommended for **deletion**, but deleting it is a
  reviewer's call and would touch `docs/`.
- **The `tasking:check` defect** found in the previous task (manifests read only from
  `pending/`) — still open, still affecting every completed task.
- **`BRIEF.md` says write to `tasking/completed/T9/`; `task.json` says
  `tasking/completed/docs-audit/`.** Followed the manifest. Not corrected — `pending/`
  is not mine to edit.
- **`CHANGELOG.md` counts deliberately not "fixed"** — they are historical records.

---

## 4. What I believe is wrong

**The most serious finding is not a number. It is F-9: the trademark risk is documented
nowhere in `docs/`.**

The site is named after a LIVE registered trademark in its own product category —
APEX AMMUNITION, reg. 5391055, IC 013, held by an operating ammunition business with a
live storefront and an 18+ age gate. `grep` across `docs/` returns **zero hits**. It
exists only in `tasking/`, which a human reading the documentation would never open.

`docs/DATA-TODO.md` diligently records the other open legal blocker — the empty
`recipes` table. The brand risk is larger and invisible. **That asymmetry is the defect:
the repo tracks its content risk carefully and its legal risk not at all.**

Second, the drift pattern. Nine of eleven live count-quoting sites are wrong, and every
one was true once. `.clinerules` §1 was amended to say *"never quote a stage or test
count… a stale count in a rules file is worse than no count because agents trust it."*
**`.clinerules` obeys this — it removed the numbers instead of updating them. No other
document did.** The fix is known, proven, and has not spread. The remaining stale counts
are not carelessness; they are documents written before the rule existed and never
migrated.

Third, my recommendation to **delete `docs/PARALLEL-WORK-PLAN.md` rather than correct
it.** Correcting its counts would make a dead document look maintained. It describes a
protocol replaced three commits ago and breaks its own central rule three times, so it
cannot be cited as authority even where it is right.

### Definition of Done

| Requirement | Status | Evidence |
|---|---|---|
| `git status` shows changes only in my folder | **PASS** | no project file modified |
| `npm run verify` still exits 0 | **PASS** | exit 0 |
| Every corrected count has a command proving the true value | **PASS** | `02-stale-counts.md`, one command per row |
| Every finding has a file and line number | **PASS** | 15 findings, all with `file:line` |
| No `docs/` file modified | **PASS** | read-only throughout |
| Negative test: a count I believed correct and found wrong | **PASS** | §2 — the 215/235 scope error, which corrected my own prior report |
| Name one document to DELETE with a reason | **PASS** | `docs/PARALLEL-WORK-PLAN.md`, §7 of `01-findings.md` |

### Known limits

- **`1,666 rows / 24 tables` unverified** and left uncorrected — see §3.
- Static read-only audit. **I did not evaluate whether the documentation is *true about
  the code*** beyond the counts measured; claims about behaviour were not tested.
- 154 files audited by targeted search for the patterns in scope, not by reading every
  line. A stale claim outside those patterns could be missed.
- Coverage figures shift as manufacturer rows are added; the numbers here are a
  **3 Oct 2026 snapshot**.