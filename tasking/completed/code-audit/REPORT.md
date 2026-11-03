# REPORT — code-audit

**Task:** Source code quality and dead-code audit. **Agent:** scout-code.
**Model:** default model, fresh instance. **Date:** 10 Feb 2026.
**Write-set:** `tasking/completed/code-audit/` only. **Nothing was refactored,
edited, or fixed** — as the brief requires.

---

## 1. What changed

Five files, all research outputs inside my own folder:

| File | Substance |
|---|---|
| `01-dead-code.md` | Symbol-level dead-code analysis. Headline: **a green gate that has never once done its job** |
| `02-dupes.md` | Duplication audit against the repo's "one loader, not two" rule — root resolution, cwd rooting, sha256, CSV parsing |
| `03-comments.md` | Comment audit. **Ten numeric claims verified — all hold.** Two genuinely false comments found |
| `04-config-review.md` | `eslint.config.js`, both tsconfigs, the 49-script graph, and 14 gates **executed** |
| `REPORT.md` | This file |

**No source file was touched.** `git status` shows my footprint as only the claim
move (`D` on the two `pending/code-audit` files) plus this untracked folder.

> **Concurrent-agent note, and it matters for review.** While this audit ran,
> **another agent was editing `scripts/gates/check-tasking.mjs`, `package.json` and
> `scripts/gates/`.** Those edits are not mine. `git status` confirms my writes are
> confined to this folder. Findings that another agent resolved mid-audit are
> labelled as such rather than reported as still-open.

---

## 2. What was verified and how

### 2.1 The critical finding — a gate that verifies nothing (now fixed by another agent)

`scripts/gates/check-tasking.mjs` — the gate whose stated purpose is to make
"finished" a checkable claim — **checked exactly one task per run:**

```
  1 task(s) in pending/, 1 ready
  4 task(s) in completed/, 0 declared output(s) verified
```

`pending/` held **8** directories, 7 with valid `task.json`. Instrumenting a copy
showed the loop body executing once:

```
dirs= 8
  SET ammoseek-coverage        <- only one SET, then the loop ends
```

**Cause:** the `for (const dir of taskFolders(PENDING))` loop at line 62 is missing
its closing brace, so it is closed instead by the dependency loop below.
**Why no tool caught it:** a stray `}` at end-of-file balances it —

```
open=58 close=58 delta=0
```

— so `node --check` and ESLint both pass. Two braces in the wrong place cancel out.
Introduced in commit `a939ecd`.

**Current state:** the brace has been fixed by the concurrent agent. The gate now
reports **28 declared output(s) verified** and **passes**. Verified just now:

```
  12 task(s) in pending/, 11 ready
  6 task(s) in completed/, 28 declared output(s) verified
  every declared output exists; no concurrent write-set overlap

tasking verified
```

The defect and its diagnosis are retained as trap history per `.clinerules` §5
rule 7.

### 2.2 "One loader, not two" — a real, latent violation

`scripts/shared/data.mjs` documents why naive CSV splitting is wrong:

```
// scripts/shared/data.mjs:116-118
// RFC-4180. The seed data genuinely needs it: cartridge names contain commas
// and escaped quotes (".500 NE 3""", '12 gauge 3 1/2" mag'), so split(',')
// is not merely inelegant, it is wrong.
```

`scripts/data/import-bullets.mjs` writes bullets CSVs with `split(',')` at lines
110, 111 and 128 — while already importing from that same module (line 18).

**Verified latent, not active.** Measured against every bullet CSV:

```
berger: naive ragged=0  readCsv rows=109 naive rows=109
hornady: naive ragged=0  readCsv rows=7   naive rows=7
sierra: naive ragged=0  readCsv rows=4   naive rows=4
```

No current row has an embedded comma. The hazard is real but dormant, on a
**file-writing** path, and the exact corruption `AGENTS.md` records.

### 2.3 Duplication measured, not asserted

| Pattern | Sites |
|---|---|
| `root` re-derived instead of imported | **14 scripts** |
| `root` = `process.cwd()` (cwd-dependent) | **9 scripts** |
| `createHash('sha256')` call sites, no shared helper | **9 sites** |
| Exact duplicate fingerprint functions | **2** (`security-rules.mjs`, `check-handoff-rules.mjs`) |

Only **7** scripts import `root` from `scripts/shared/data.mjs`. The convention
exists, is documented in `check-seeds.mjs`, and is simply not followed.

The `process.cwd()` group is the serious half: `check-docs.mjs` — the gate that
resolves every repository path in backticks — roots at `process.cwd()`, so run from
the wrong directory it walks the wrong tree and can report a false green.

### 2.4 Comments: ten numeric claims, all verified accurate

```
site                          claim                          verdict
build-data.mjs:175            169 rows                       HOLDS
build-database.mjs:7          bullets 120 / powders 169      HOLDS
import-bullets.mjs:139        109 rows + 2 more unused       HOLDS
bullet-sources.mjs:27         13 cols, 111 rows              HOLDS*
split-cartridge-specs.mjs:5   229 rows, 212 rifle            HOLDS
split-cartridge-specs.mjs:17  EMPTY ON ALL 229 ROWS          HOLDS
check-seeds.mjs:755           capacity_gr_h2o empty on 229   HOLDS
data.mjs:352                  orphaning 98 of 169 rows       HOLDS
AGENTS.md                     check-seeds.mjs 1,644 lines     HOLDS
AGENTS.md                     235 tests / 215 passing        HOLDS (215+7+13)
```

\* See the mandatory negative test below — my first automated check **wrongly
flagged this as false** and the correction is recorded.

### 2.5 Gates executed, not assumed

12 of 14 read-only gates exit 0 when run (`oracle`, `regulations`, `audit`,
`claims`, `security`, `tasks`, `schema`, `seed`, `data:validate`, `coverage`,
`data:health`, `docs`). Two non-zero exits were each investigated rather than
reported as defects:

- **`docs:audit` exits 1 by design** — its own output says "report only (no files
  changed)". It is not in the `verify` chain.
- **`ci:check` exits 1** — another agent added `mail:check` to `verify` without
  adding it to `verify.yml`. Their in-flight work, correctly caught by their own
  gate.

All 49 `package.json` script targets were checked for existence: **none missing.**

### 2.6 Mandatory negative tests

**One thing that LOOKED dead but is not** — and I nearly got this wrong:

`scripts/security/security-rules.mjs` exports `templateInjectionFindings` and
`remoteScriptFindings` with **zero external references**. My automated scan flagged
them. The proof they are alive:

```
  145: export function securityFindings(html, rel) {
  147:   ...templateInjectionFindings(html, rel),
  148:   ...remoteScriptFindings(html, rel),
```

```
security-baseline.mjs  import { securityFindings, SCANNED } from './security-rules.mjs';
security-check.mjs     import { securityFindings, loadKnown, SCANNED, KNOWN } from './security-rules.mjs';
```

They are used **inside** the file by `securityFindings`, which is what both callers
import. **Not dead — only over-exported.**

A second near-miss: `bullet-sources.mjs:27` says "111 rows". My check compared it
against Hornady's 7 seed rows and called it false. It was **my error**: the comment
says *"See BERGER below"*, and `import-bullets.mjs:139` records *"109 rows"* and
*"2 more we could not use"*. 109 + 2 = 111 — it describes the **source page** row
count, which is correct.

**One comment that states something now false:**

> `eslint.config.js` — `'temp/**'` is ignored with the justification
> *"Second scratch directory created by later data-agent work."*
> Measured: `Test-Path temp` → **False**, and no `scripts/_*`, `fix_*`, `remove_*`
> or `replace_*` file exists.
>
> **Correct statement:** the `temp/**` exclusion has no referent. Worse, it silently
> tolerates a second scratch location that `.clinerules` §5 rule 10 does not
> mention — the rule says scratch goes in `tmp/`. Either delete the entry or amend
> rule 10 to name both.

The second false comment:

> `.cline/tasks/ledger.json` records `"stages": 14`. Measured against `package.json`:
> **20 stages now** (was 19 before the concurrent agent added `mail:check`).
>
> **Correct statement:** the ledger undercounts, and a stage count in the file
> `tasking/README.md` calls *"the authoritative task ledger"* is exactly the kind of
> stored number that must be measured. `.clinerules` already resolved this same
> problem by deleting its count rather than replacing it.

### 2.7 Gate status at completion — and one failure that is not mine

Final measurement, `tasking/pending/` emptied of my task and
`tasking/completed/code-audit/` populated:

```
npm run tasking:check
  12 task(s) in pending/, 11 ready
  8 task(s) in completed/, 40 declared output(s) verified
  every declared output exists; no concurrent write-set overlap

tasking verified          (exit 0)
```

**The gate I reported as broken in §2.1 is now fixed by another agent and passes,
verifying 40 declared outputs.** My finding stands as the record of why it was
broken.

**`npm run verify` currently exits 1 — on `mail:check` only.** Every stage was run
individually:

```
lint 0  typecheck:all 0  test:all 0  test:encoding 0  test:bullets 0
schema:check 0  seed:check 0  data:validate 0  docs:check 0  handoff:status 0
security:check 0  modules:check 0  website:check 0  claims:check 0
tasking:check 0  oracle:check 0  ci:check 0  audit:check 0  regulations:check 0
mail:check 1
```

**19 of 20 stages pass.** The single failure is `check-mail.mjs`, a gate another
agent is building concurrently. Its two findings are:

```
- mail/inbox/4880a.md: unparsed text outside any message header...
- mail/inbox/4880a.md: STOP for "cartridge-dimensions" declares 4/4 files
  written, but 7 are present in completed/cartridge-dimensions/.
```

**Neither is mine.** `git status --porcelain mail/` returns nothing — I have not
touched `mail/`. The second finding concerns `cartridge-dimensions`, another
agent's completed task, which contains 7 files against a manifest declaring 4.
`git status` confirms my footprint is exactly `?? tasking/completed/code-audit/`.

Worth noting: that gate is doing exactly what this audit argues for. It caught a
task whose on-disk state disagrees with its own manifest — the "did the work get
written down" check this codebase needed and, until today, did not have.

---

## 3. What was found but NOT touched

1. **`scripts/gates/check-tasking.mjs`, `package.json`, `scripts/gates/*.mjs` are
   being edited by another agent right now.** Not mine, not touched. Any review of
   my findings 2.1 must be re-measured — the state I measured is already stale.
2. **`packages/ballistics-core/` was read but never proposed for change**, as the
   brief requires. `solver.ts` (860 lines) and `devices/solution.ts` (588) are the
   largest files in the repo; **I make no claim about them** — the brief puts the
   physics out of scope and a code-quality reading of safety-critical physics is
   not evidence.
3. **`check-seeds.mjs` is 1,644 lines** — confirmed exactly. `AGENTS.md` flags it for
   splitting. I did not assess it; it is 72 KB and its structure is not a dead-code
   question.
4. **Nine `process.cwd()` roots and fourteen re-derived `root` sites** are reported
   with the exact fix (import from `scripts/shared/data.mjs`) but **not applied**.
5. **`apps/ballistics/**` sets `no-undef: off`** and downgrades `no-unused-vars` to
   `warn` in two app blocks. That means an unused variable in the shipped website
   would not fail the build. A judgement call, recorded, not changed.

---

## 4. What I believe is wrong about the codebase's structure

**The gates are trusted more than they are measured, and that trust is the actual
weakness.** The repo has built an extraordinary apparatus for not inventing values,
and then stores its own safety claims as *comments*. The gate header says it makes
"done" a checkable claim; the gate verified zero outputs for four completed tasks
and no test, lint rule or type check noticed, because two braces in the wrong places
balanced out. It took an agent writing its own output before anyone looked.

That is the same shape as four entries already in `AGENTS.md`'s trap table — "a
check that passes while producing wrong output" — and the CSP incident recorded in
`tasking/review/HISTORY.md`, where every gate passed because every gate *read the
file* rather than the deployed response. **The pattern is consistent: this repo
verifies its intent, not its effect.**

**The second structural point is smaller and more actionable.** `scripts/shared/`
exists, is correct, and 21 scripts import it — while 23 more each independently
solved a problem it had already solved: fourteen re-derived the repository root,
nine rooted at `process.cwd()`, nine re-implemented sha256, and one re-implemented
RFC 4180 CSV parsing on a write path. None of this is clever work. It is one
missing import per site, and it accumulated because nothing makes the import the
easy path.

**The remedy that follows from the repo's own rules:** for anything load-bearing,
write the negative test first, and treat a comment describing a guarantee as a
hypothesis rather than a fact. The one gate that would have caught this audit's
biggest finding is the gate that was broken.

---

## 5. Locks

**`code-audit` holds no shared locks.** Write-set is
`tasking/completed/code-audit/` — one folder, no shared file. `scripts/`,
`packages/`, `package.json`, `apps/` and `data/` were all untouched, as the brief
requires for an audit task.

**Claim status:** claimed by moving `tasking/pending/code-audit/` →
`tasking/in-progress/code-audit/`. No other agent's task was touched.

**Scratch** (`tmp/audit-*.mjs`) is in `tmp/`, per `.clinerules` §5 rule 10.

**For the review agent:**
- Re-measure before acting — another agent changed `scripts/gates/` during this audit.
- Finding 2.2 (CSV re-implementation) is the only **High** item still open.
- `eslint.config.js` `temp/**` and `ledger.json` `stages` are the two false claims.
- The `tasking:check` brace defect is worth a `HISTORY.md` entry if it is not already
  recorded: **a gate can be green, in `verify`, and verify nothing.**