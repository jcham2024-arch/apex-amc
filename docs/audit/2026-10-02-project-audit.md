# Project audit, 2 Oct 2026

Baseline: tag `v0.1.0-consolidated`, `npm run verify` exit 0, 15 stages,
235 tests (215 + 7 + 13).

Every finding is labelled. **PROVEN** means a command demonstrates it.
**RISK** means inferred from reading code. **PREFERENCE** means a style opinion.

---

## PROVEN-1: the physics oracle is not wired in (highest value)

`data/reference/` exists for one reason, stated in its own README: "so that a
wrong number in our code can be caught by something we did not write."

It is not consumed:

    git grep -E 'referenceDir|reference/|ORACLE' -- '*.ts' '*.js' '*.mjs'
    -> packages/ballistics-core/src/drag/dragTables.ts:20  (a comment only)
    -> scripts/shared/data.mjs:82  (a path constant, never read)

| File | Rows | Compared to our solver |
| --- | --- | --- |
| `drag_tables.csv` | 730 | never |
| `bullet_reference.csv` | 8 | never |
| `measured_data.csv` | 6 | never |

Three ballistics defects shipped while 161 tests passed, because the tests and
the implementation were wrong the same way. A suite written by the same
reasoning that produced the bug cannot catch that bug. These 744 rows are the
only independent data in the repo, and nothing reads them.

> **Resolution (partial).** `scripts/gates/check-oracle.mjs` now compares our
> G1/G7 transcription against the CSV: **153 drag points**, plus hygiene checks on
> all 744 rows (every row must carry a source and a stated uncertainty).
> Wired into `npm run verify` as `oracle:check`.
>
> Negative-tested four ways: corrupting one Cd value fails; blanking a source
> fails; stripping a stated uncertainty fails. Verified good: removing a field
> that the file has no column for correctly passes.
>
> **Still open.** The gate does NOT run the solver against `measured_data.csv`.
> Those 6 rows need barrel-length scaling and an atmosphere model before they
> are comparable, and a comparison that skips those would manufacture agreement.
> That is the remaining part of task A1.

## PROVEN-2: documentation quotes stage counts that are all wrong  [FIXED, GATED]

> **Resolution.** All live claims corrected to 15 stages / 235 tests. A
> `docs:check` rule now reads the real count from `package.json` and fails on
> any document that quotes a different one. Negative-tested: injecting
> "7 stages" fails the gate. `CHANGELOG.md` is exempt, because a stage count in
> a historical entry is history, not drift.
>
> **The gate immediately found two more that my manual sweep missed:**
> `ARCHITECTURE.md` (said 12) and `docs/README.md` (said 8, and 215 tests).
> That is the argument for automating this rather than fixing it by hand.


Real count: **15**. Quoted:

| File | Claims |
| --- | --- |
| `README.md` | 8 |
| `docs/TASK-LIST.md` | 9 |
| `docs/PARALLEL-WORK-PLAN.md` | 9 (x2), 14 (x3) |
| `docs/DATA-TODO.md` | 10 |
| `AGENTS.md` | 11 |
| `docs/CONVENTIONS.md` | 14 |
| `docs/AGENT-PROMPTS.md` | 14 (x2) |

Ten claims, no two agree. Quoting a count a machine can check is what created
the drift. Fix: either stop quoting it, or add a gate that reads it from
`package.json`.

## PROVEN-3: the gates are not vacuous

| Gate | Method | Result |
| --- | --- | --- |
| `website:check` | broke the wrangler dist path | **exit 1**, correct |
| `tasks:check` | injected overlapping write-sets | **exit 1**, correct |
| `claims:check` | injected a forbidden claim, rebuilt | **exit 0** - investigated |
| `docs:check` | CRLF + mojibake | **exit 1**, correct |

### Why claims:check passed - not a defect

It reads `dist/index.html`, not the source. The claim reached the artefact but
only inside an HTML comment documenting the removal. The gate strips comments
first, by design (check-claims.mjs lines 38-40, 54-55).

Verified: 1 raw occurrence, 0 in visible text. Correct behaviour.

**Real trap for whoever tests this next:** tampering the source proves nothing.
You must tamper source, rebuild, then check. I got this wrong twice before
getting it right.

## PROVEN-4: no CI run has ever happened  [RESOLVED]

> **Resolution.** CI now runs on every push and was green on its sixth attempt
> (run 36967250713, ubuntu-latest, 1m14s). All 15 workflow steps pass, including
> the browser CSP check and the reproducible-build check.
>
> Getting there required five real fixes, none of which a Windows-only run could
> have found:
>
> | Run | Failure | Cause |
> |---|---|---|
> | 1 | lint: `'console' is not defined` | `c.mjs`, a scratch script, committed and pushed |
> | 2 | lint: same | a second scratch file from the same mistake |
> | 3 | `docs:check` broken-path x5 | docs cite gitignored PDFs, absent on a clean checkout |
> | 4 | `tasks:check` | R1-R3 pointed at empty directories git does not record |
> | 5 | `npm audit` | 4 high advisories, no patch available |
> | 6 | lint: unused variable | my own new gate |
>
> Two findings are worth more than the fixes:
>
> - **The recorded build SHA-256 could never match a Linux build.** It had been
>   captured from a Windows working copy with CRLF endings while git stores LF.
>   The artefact was right; the recorded hash was wrong, and no CI run could have
>   satisfied it.
> - **Three gates were in `verify` but absent from the workflow.** CI listed its
>   gates by hand and had drifted. `ci:check` now fails on that drift.
>
> This is the whole argument for running CI: every one of these passed locally.

## PROVEN-4 (original)

`verify.yml` specifies `runs-on: ubuntu-latest`, node 22. `gh run list`
returns nothing. The browser CSP check has only run on this Windows machine,
where it was fixed for a Windows-specific deadlock. It has never been proven on
the platform that will actually run it.

## PROVEN-5: the "unexamined" physics commit is good work

I flagged `eaf9d2b` as an unreviewed physics change. Having read it, it is
sound and can be treated as reviewed:

- Header corrected from "TWO/THE THREE failure modes" to **FIVE**. The old text
  had two distinct failure modes sharing the number 4 - precisely the
  stale-comment failure AGENTS.md warns about.
- `G1_FORM_FACTOR` / `G7_FORM_FACTOR` imports **removed**, reason recorded:
  they describe reference projectiles (1 and 1.2), not a real bullet. Verified:
  now comment-only (solver.ts:129, 671).
- Inline `const INCHES_PER_FOOT = 12` and `32.17405` **replaced** with imports
  from `provenance/constants.ts`. Verified: no literal duplicates remain.

No action needed. This is the pattern the project wants more of.

## RISK-1: ~29 tracked files are unreachable

Sweeping for tracked source whose name appears in no other tracked file returns
29 candidates. Most are false positives - test files, `vite.config.js`,
`eslint.config.js` are entry points, and the check only sees filename mentions.

One is real and deliberately parked: `apps/ballistics/_unscreens/` (3 files,
referenced only by its own README, `tsconfig.json`, CHANGELOG). **Deliberately
parked work, not rot - do not delete.**

Worth a real dead-code pass later using import graphs, not filename mentions.

## RISK-2: docs:check cannot catch its most likely error

It enforces LF and rejects mojibake (it caught my own CRLF damage). But it does
not check stage counts (PROVEN-2), so the drift it should prevent is invisible
to it.

## Confirmed NOT broken

- No secrets in any tracked file (full scan). `.env.example` is the only env
  file and is a template.
- Largest tracked files are legitimate: 297 KB `package-lock.json`, 288 KB
  `data/extracts/berger-reference-charts.html` (source material), 227 KB
  generated JSON.
- TODO/FIXME sweep returns no stubs - every hit is explanatory prose or a
  documented placeholder pattern.

---

## Recommended order

1. **Wire the oracle in (A1).** 744 rows, zero comparisons. Highest value by a
   wide margin; it is the fix for the project's recurring defect class.
2. **Prove CI on ubuntu.** One push. Everything else is unverified until then.
3. **Stop quoting stage counts**, or gate them from `package.json`. Ten wrong
   numbers is pure liability.
4. Confirm `docs/ORACLE-SOURCES.md` is in the doc index.
5. Real dead-code pass with import graphs.
