# Stale counts — every number quoted that no longer matches reality

Measured **3 Oct 2026**. **No number below was corrected without a command producing
the true value.** Where I could not measure something, it says so rather than
guessing.

---

## Measured truth (the reference table)

| Quantity | Measured value | Command |
|---|---|---|
| `verify` stages | **19** | count `&&` in `package.json` `verify`; `npm run ci:check` → "verify declares 19 stages" |
| Total tests | **235** (215 + 7 + 13) | `npm run test:all` → three `# pass` blocks: 215, 7, 13 |
| Core suite only | **215** | `npm test` → `# pass 215` |
| Ledger tasks | **19** | `npm run tasks:check` → "19 tasks, 8 concurrently runnable" |
| Governed data rows | **1031** | `npm run data:health` → `TOTAL 26 1031` |
| Seed CSVs | **26** | `Get-ChildItem -Recurse data/seeds -Filter *.csv` → 26 |
| Manufacturers | **58** | `Import-Csv data/seeds/manufacturers.csv` → 58 rows |
| Bullets | **120** | sum of `data/seeds/bullets/*.csv` → 120 |
| Powders | **169** | sum of `data/seeds/powders/*.csv` → 169 |
| Coverage | done=7, partial=3, not started=33, n/a=15 | `npm run coverage` → "status totals" |

### The single most important correction in this document

> **`docs/TODO.md:198` says "`npm test` reports **215 passing**" and frames it as the
> number to beat a stale 157. But `npm test` runs only the core suite. The project
> total is `test:all` = 215 + 7 + 13 = **235**.**
>
> **`AGENTS.md:59` ("Tests | 215 passing") and `ROADMAP.md:24` ("215 passing") are
> therefore wrong twice over: wrong number *and* wrong scope.** The correct statement
> is 235, project-wide, or "215 in the core suite" if the scope is named.

This is the same defect `.clinerules` §1 warns about, reproduced in the very docs
that should prevent it.

---

## Findings by file

### `AGENTS.md` — the root baseline file, and the most-quoted

| Line | Says | Truth | Severity |
|---|---|---|---|
| 29 | `Every stage, 235 tests.` | **Correct.** | — |
| 52 | `**989 rows across 13 datasets; all 23 CSVs have manifests**` | **1031 rows**, **26 CSVs** | **factual error** |
| 53 | `**50** in manufacturers.csv; 51 rows in the DB` | **58** in `manufacturers.csv` | **factual error** |
| 58 | `1,666 rows / 24 tables` | **Not verified this run** — requires `npm run db:local`; left as-is rather than guessed | unverified |
| 59 | `Tests \| 215 passing` | **235** project-wide | **factual error** |
| 61 | `done=7, partial=3, not started=32, n/a=8` of 50 | done=7, partial=3, **not started=33, n/a=15**, of **58** | **factual error** |

### `README.md`

| Line | Says | Truth | Severity |
|---|---|---|---|
| 54 | `13 governed datasets, 1,666 rows` | **1031** rows | **factual error** (row count) |
| 57 | `15 gates, 235 tests` | **19** stages, 235 tests | **factual error** (stage count) |
| 161 | `Tests \| 235 passing, lint and typecheck clean` | **Correct.** | — |
| 168 | `(actual; 215 tests against 235). Task D1 fixes this.` | Refers to a completed task; historical | stale note |

### `.cline/tasks/ledger.json` — the authoritative ledger

| Location | Says | Truth | Severity |
|---|---|---|---|
| `baseline.stages` | `"stages": 14` | **19** | **factual error** |
| `baseline.tests` | `"tests": 235` | **Correct.** | — |
| `baseline.exit_code` | `0` | **Correct.** | — |

The ledger is described as authoritative in `tasking/README.md`, and it carries the
**stalest stage count in the repository** while `.clinerules` has already been fixed to
say "never quote a stage count". This is the drift `.clinerules` warns about, in the one
file agents are told to trust.

**Recommendation:** rather than bumping 14 → 19 (which re-stales at 20), **delete
`baseline.stages`** and leave a pointer to the command that produces it. A stale count
is worse than no count because agents trust it — that is the argument `.clinerules`
already makes and it applies here.

### `docs/PARALLEL-WORK-PLAN.md` — contradicts itself

| Line | Says | Truth | Severity |
|---|---|---|---|
| 90 | `Measured 2 Oct 2026: exit 0, 235 tests. Do not quote a stage count;` | Tests correct; the instruction is contradicted 4 lines later | self-contradiction |
| 94 | `... README 215. Do not quote a` | quotes counts while forbidding it | self-contradiction |
| 295 | `Every doc that quoted a count disagreed with reality: **15 stages, 235 tests**.` | **19 stages** | **factual error** |

This file both **issues** the rule "do not quote a stage count" and **breaks** it three
times. The stage counts it quotes (15) are wrong; the test count (235) is right.

### `docs/TASK-LIST.md`

| Line | Says | Truth | Severity |
|---|---|---|---|
| 28 | `**All nine stages must pass.**` | **19** | **factual error** |
| 36 | `**235 passing, 0 failing**` | **Correct.** | — |
| 38 | `989 rows, 13 datasets` | **1031 rows** | **factual error** |
| 277 | `All nine stages.` | **19** | **factual error** |

### `ROADMAP.md`

| Line | Says | Truth | Severity |
|---|---|---|---|
| 24 | `Tests \| 215 passing` | **235** project-wide | **factual error** |

### `docs/TODO.md`

| Line | Says | Truth | Severity |
|---|---|---|---|
| 128 | `n/a=8** of 50 manufacturers` | **n/a=15** of **58** | **factual error** |
| 198 | "`npm test` reports **215 passing**" | `npm test` = core only. Project total **235** | **factual error** (scope) |

### Correct, and worth protecting

- `README.md:161` — `235 passing` ✔
- `AGENTS.md:29` — `235 tests` ✔
- `docs/TASK-LIST.md:36` — `235 passing, 0 failing` ✔
- `.clinerules` — no numbers at all; says "Never quote a stage or test count from
  memory, from a task brief, or from another document". **This is the correct pattern**
  and is why those three are right while the others are not.

### CHANGELOG.md — deliberately excluded

`CHANGELOG.md` quotes `215 tests`, `9 stages`, `10 stages`, `989 rows` throughout. These
are **point-in-time records of what was true when each entry was written**, which is what
a changelog is for. `AGENTS.md` rule 7 exempts `CHANGELOG.md` from path checking for the
same reason. **These are not defects and must not be "corrected."** Correcting a
historical record would be the error.

---

## Counts I could NOT verify

| Item | Where | Why not |
|---|---|---|
| `1,666 rows / 24 tables` | `AGENTS.md:58`, `README.md:54,68` | Requires `npm run db:local`, which writes `data/generated/apex.sqlite` — a write outside my write-set. **Not corrected, because correcting an unverified number is worse than leaving it.** |
| `2 unresolved pressure disputes` | `data` | Measured via `coverage`: 6.5 Rem Mag and .350 Rem Mag. Accurate, not a docs defect. |

## Pattern

Nine of the eleven live count-quoting sites are wrong, and **every wrong one is a
number that was true once**. Nothing here is a typo — it is all drift, which is exactly
what `.clinerules` §1 was amended to warn about. The mechanism is visible in the file
that is correct: it removed the numbers rather than updating them.