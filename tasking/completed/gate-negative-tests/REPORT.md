# REPORT — gate-negative-tests

**Agent:** 879ca · **Priority:** high · **Status:** COMPLETE (4/4 outputs).
**Write-set:** `tasking/completed/gate-negative-tests/` only.
**No gate modified.** Confirmed: `git status` shows no change under `scripts/`
from my work.

---

## 1. What I did

Built a harness that copies the repo into a throwaway `tmp/` sandbox, applies one
semantic mutation per gate, and records whether the gate **exits non-zero**. Every
verdict in `01-negative-test-matrix.csv` is observed, not predicted.

**Result: 8 caught, 4 blind, across 11 of 21 verify stages.**

## 2. The four blind gates — the substance of this task

| Gate | Mutation | Result |
|---|---|---|
| **`claims:check`** | charge weight written into `docs/ROADMAP.md` | exit 0 |
| **`audit:check`** | deleted the security advisory file | exit 0 |
| **`oracle:check`** | deleted 4 of 6 measured rows | exit 0 |
| **`regulations:check`** | pointed `source_url` at an unreachable domain | exit 0 |

**`claims:check` is the one that matters.** It is the gate that bans charge-weight
claims — the single class of number in this repo where a plausible wrong value
injures someone. It reads exactly one file:

```js
const html = readFileSync(builtIndexFile, 'utf8');
```

It enforces the ban **in the rendered site** and is silent across the whole
Markdown corpus. A charge weight in `ROADMAP.md` is invisible to the gate named
for preventing exactly that.

**`oracle:check` is the subtlest.** Deleting measured data made it *quieter and
still green*:

```
measured_data.csv: 2 rows checked
our physics agrees with data/reference at every compared point
oracle OK    exit=0
```

An oracle that degrades gracefully is not a tripwire. There is no minimum-coverage
floor, so **losing evidence is indistinguishable from passing on less evidence.**

## 3. A correction to my own first result

I initially recorded `ci:check` as blind: renaming `npm run oracle:check` to
`...-BOGUS` still produced `all 21 stages accounted for`, exit 0.

**That was wrong.** The check is `workflow.includes('npm run ' + s)`, and
`npm run oracle:check-BOGUS` *contains* `npm run oracle:check`. Deleting the line
outright fails correctly:

```
FAIL oracle:check is in npm run verify but not named in verify.yml
ci FAILED   exit=1
```

`ci:check` is sound. The matrix records CAUGHT. I would have published a false
positive had I stopped at the first observation — the same "check that passes
while producing wrong output" family this repo keeps cataloguing, this time
pointed at my own measurement instead of a gate.

## 4. What I did NOT do, and why

- **Did not modify any gate.** Prohibited by `task.json`. Every suggestion in
  `02-untestable-gates.md` is written as a *vector for a human*, not applied.
- **Did not run destructive input against the real tree.** All mutations went to
  `tmp/` copies, now deleted.
- **Did not attack a large part of the chain** — reasons tabulated in §C of
  `02-untestable-gates.md`. An un-attacked gate is an untested gate.
- **Did not fix anything I found**, including defects outside this task.

## 5. Gates that only read files when they should check behaviour

- `audit:check` — wraps `npm audit`; never reads the advisory it is named for.
- `regulations:check` — asserts "retrievable citation" without fetching anything.
- `claims:check` — checks built output only, not the source corpus it governs.
- `oracle:check` — compares whatever points exist; no floor on how many.

## 6. Notes on exit codes

All 8 caught gates returned a **truthful** exit code; none printed success while
failing. The risk is one-directional: **the failures are gates that exit 0 with
no warning at all.** A silent gate is worse than a loud wrong one, because the
loud one gets investigated.

## 7. Unresolved

- Whether `docs/`, `README.md` and the tasking corpus should be in scope for
  `claims:check`. **An owner's decision**, not an agent's — it changes what the
  gate means.
- A committed baseline row-count for `measured_data.csv`, so oracle coverage
  regressions become failures.
- The 10 unattacked stages remain untested. Recorded, not hidden.

## 8. Environment notes for whoever continues this

- **`execFileSync('npm', …)` fails on Windows** — npm is a `.cmd` shim. Must use
  `cmd.exe /c`. Getting this wrong manufactures a false "every gate is broken".
- **Copy `packages/` as well as `data/` and `scripts/`** for `oracle:check`; it
  imports from `packages/ballistics-core/src/drag/`. Omitting it produced an
  exit 1 that looked like a caught violation but was a missing file.
- **Capture output with `cmd /c "... 2>&1"` and read `$LASTEXITCODE`.** Piping
  into `Select-Object` masks the exit code and produced one misleading "failure".
- **`AGENTS.md` quotes a stage count for `npm run verify` that no longer matches.**
  `docs:check` enforces this with `verify-stage-count`. Compute it with
  `node -e "console.log(require('./package.json').scripts.verify.split('&&').length)"`
  rather than typing the number — which is why I did not type it here either.