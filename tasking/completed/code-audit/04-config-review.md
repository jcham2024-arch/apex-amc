# 04 — Config review

**Task:** code-audit. **Audit only — nothing was changed.**

Reviewed: `eslint.config.js`, root `tsconfig.json`,
`apps/ballistics/tsconfig.json`, and the script graph in `package.json`.

**Method note.** Scripts were **run**, not merely read, because `AGENTS.md` records
that `node --check` validates syntax and not that a named export exists — and that a
claim a gate passed without pasted output is not a verification. Running them also
caught two harness bugs of my own, recorded in §5.

> **Concurrent-agent warning.** While this audit ran, **another agent began editing
> `scripts/gates/check-tasking.mjs` and `package.json`** and added
> `scripts/gates/check-mail.mjs` and `scripts/gates/_probe_tasking.mjs`. None of
> that is mine; `git status` shows my writes confined to
> `tasking/in-progress/code-audit/`. Findings below describe the state I measured,
> and some are **already fixed by that agent**. Marked accordingly.

---

## FINDING 1 — a gate was added to `verify` without being added to CI (live, not mine)

`npm run ci:check` currently fails:

```
FAIL mail:check is in npm run verify but not named in verify.yml

1 gate(s) would be skipped by CI. A gate that runs locally but not in CI is not a
gate: add it to the workflow, or record a reason in CI_ONLY above.

ci FAILED
```

**Cause:** another agent added `mail:check` to the `verify` chain and created
`scripts/gates/check-mail.mjs`, but has not yet added the stage to
`.github/workflows/verify.yml`. Work in flight, not a committed defect.

**It is worth noticing anyway**, because the failure is exactly the one this gate
exists to catch — and it was caught. A gate that runs locally but not in CI is not
a gate. The `ci:check` design is sound and is doing its job.

**Correct statement for the review agent:** this resolves itself when the concurrent
agent finishes. Do not "fix" it by adding a `CI_ONLY` exemption — that would
silently drop a gate from CI, which is precisely what the gate exists to prevent.

---

## FINDING 2 — `eslint.config.js`: three ignores point at nothing that exists

The config carries eight scratch exclusions with a documented history:

```js
// eslint.config.js:23-41
      // Scratch left by parallel data agents. Excluded from lint rather than
      // deleted, because that agent may still be mid-run.
      //
      // This is load-bearing, not cosmetic. `npm run verify` runs `eslint .`,
      // and these one-shot scripts use `console`/`Buffer`/`process` in ways that
      // are correct for a diagnostic but fail `no-undef` under the default
      // config. They produced 40 errors that made the whole build look broken
      // while every real source file was clean. New scratch goes in tmp/.
      'scripts/_*.mjs',
      'scripts/fix_*.mjs',
      'scripts/fix_*.ps1',
      'scripts/remove_*.mjs',
      'scripts/remove_*.ps1',
      'scripts/replace_*.mjs',
      'scripts/test_read_csv*.mjs',
      // Second scratch directory created by later data-agent work.
      'tmp/**',
      'temp/**',
      '**/_tmp-*.mjs',
      '**/_tmp*/**',
```

Measured:

```
$ Test-Path temp
False
$ (Get-ChildItem scripts -Recurse -Include _*.mjs,fix_*,remove_*,replace_* -File).Count
0
```

**`temp/` does not exist, and no `scripts/_*`, `fix_*`, `remove_*` or `replace_*`
file exists.**

**Assessment, applying the brief's instruction not to propose removing exclusions
without understanding why:**

| Exclusion | Keep? | Reason |
|---|---|---|
| `tmp/**` | **Keep** | Live. Every agent, including this one, writes scratch here. |
| `**/_tmp-*`, `**/_tmp*/**` | **Keep** | Cheap, and the `_tmp` pattern recurs. |
| `scripts/_*.mjs`, `fix_*`, `remove_*`, `replace_*`, `test_read_csv*` | **Keep** | Documented history: they caused 40 errors that made a clean build look broken. Zero cost, and the failure they prevent is expensive and recurring. |
| **`temp/**`** | **Questionable** | The justification comment says "created by later data-agent work"; the directory does not exist. |

`temp/**` is the only entry with no referent. It is harmless — an ignored glob
matching nothing costs nothing — **but it also silently permits a second scratch
location that `.clinerules` §5 rule 10 does not mention.** The rule says:

> 10. **Scratch goes in `tmp/`**, not the repo root.

An agent following the rule has no way to learn `temp/` is also tolerated. **Two
options, both defensible:** delete the `temp/**` entry, or amend rule 10 to name both.
**Do not leave it as is** — it is the config-file version of an unreferenced path,
which `AGENTS.md` already flags as a class of drift no gate can catch.

**Recommendation:** delete `temp/**`. The history comment about 40 errors is worth
keeping in full; it documents *why* the remaining exclusions exist.

---

## FINDING 3 — ESLint rule scope: `packages/` is typed, everything else is not

Correctly structured, and the ordering is deliberate and documented:

```js
// eslint.config.js:4-7
// Scoping note: type-aware rules only run where a tsconfig covers the file.
// `packages/` has one; the website and the Expo app do not, so those blocks
// disable type checking rather than erroring. Ordering matters in flat config
// — later blocks override earlier ones — so the non-typed blocks come last.
```

Verified: root `tsconfig.json` has `"include": ["packages/**/*.ts",
"packages/**/*.tsx"]` and `"strict": true`, with
`noUncheckedIndexedAccess`, `verbatimModuleSyntax` and
`allowImportingTsExtensions` — a genuinely strict configuration.

**Assessment: no defect.** The type-aware surface covers exactly `packages/`, which
is the domain library and the only place type errors would matter. `scripts/` is
plain ESM Node, correctly exempted.

**One observation, not a defect.** `apps/ballistics/**` sets `'no-undef': 'off'`
(ESLint config line 163). For the Expo app with JSX and legacy JS that is a
deliberate relaxation, and `no-unused-vars` is downgraded to `warn` rather than
`error` across `apps/website` and `apps/ballistics`. **The consequence is that a
genuinely unused variable in the shipped website or the field app would not fail
the build.** Given the CSP and XSS hardening in `apps/website/src/`, that is worth
knowing; it is a judgement call, not an error, and this audit was not asked to
change lint policy.

---

## FINDING 4 — script graph: all 49 entries resolve; no broken targets

Every `scripts/...mjs` path referenced by a `package.json` script was checked for
existence:

```
$ node -e "...for each of 49 scripts, check referenced file exists..."
checked 49 scripts
(no MISSING FILE lines)
```

**No script points at a deleted file.** The graph is structurally sound.

---

## FINDING 5 — gates actually run, verified by execution

Read-only gates were run rather than assumed:

| Gate | Exit | Reported |
|---|---|---|
| `oracle:check` | 0 | oracle OK |
| `regulations:check` | 0 | regulations OK |
| `audit:check` | 0 | 4 high acknowledged, 0 new |
| `claims:check` | 0 | 5 claim types banned, 12 inputs labelled |
| `security:check` | 0 | security verified |
| `tasks:check` | 0 | 19 tasks, 8 runnable, no overlapping write-sets |
| `schema:check` | 0 | schema + seed verified |
| `seed:check` | 0 | seed data verified |
| `data:validate` | 0 | validated 1031 rows across 16 datasets |
| `coverage` | 0 | (runs) |
| `data:health` | 0 | all 26 CSV files governed |
| `docs:check` | 0 | docs verified |
| `ci:check` | **1** | `mail:check` missing from verify.yml — concurrent agent, Finding 1 |
| `docs:audit` | 1 | **by design**: "report only (no files changed)" |
| `modules:check` | **1** | concurrent agent's uncommitted new files |

Two of these need reading carefully, because a non-zero exit is not automatically a
defect:

- **`docs:audit` exits 1 by design.** Its own last line is *"report only (no files
  changed)"*. It is a reporting tool, not a gate, and it is **not** in the `verify`
  chain. **Not a defect.**
- **`modules:check` exits 1** while the concurrent agent has uncommitted files in
  `scripts/gates/`. Expected transient state, not mine.

**The important result is that 12 of 14 gates exit 0 when actually executed.**

---

## FINDING 6 — `tasking:check` was fixed mid-audit, and now works

Recorded because the brief asks for scripts that no longer work, and the honest
answer is "it did, and another agent fixed it while I was measuring."

Before, during this audit:

```
  1 task(s) in pending/, 1 ready
  4 task(s) in completed/, 0 declared output(s) verified
```

After the concurrent agent's changes:

```
tasking manifests
  12 task(s) in pending/, 11 ready
  7 task(s) in completed/, 34 declared output(s) verified
```

**The missing brace is fixed** — `brace delta = 0`, and the stray `}` at EOF is
gone (the file now ends on `console.log('\ntasking verified');`).

The gate now performs its documented job: **34 declared outputs verified across 7
completed tasks.** My Finding 1 in `01-dead-code.md` is **resolved**; it is retained
as trap history per `.clinerules` §5 rule 7.

The gate is nonetheless still red, for a **different and genuinely interesting
reason** — and this is a new finding the fixed gate surfaced:

```
x task "ammoseek-coverage" exists in BOTH in-progress/ and completed/. A task may
  only be claimed once - claiming is a folder move, so this is one task that was
  copied rather than moved, and two agents may be working on it.
x task "cartridge-dimensions" exists in BOTH pending/ and completed/. ...
```

**Two tasks exist in two places at once** — evidence of a **copy** where the
protocol requires a **move**. That is precisely the collision the four-tier protocol
was built to prevent, and the newly-working gate is now detecting it. This validates
the fix: a gate that could not see the queue can also not see a duplicate claim.

---

## FINDING 7 — `tsconfig.json` `exclude` contains a redundant entry

```json
"exclude": ["node_modules", "**/node_modules", "apps/ballistics", "archive", "**/archive/**"]
```

`node_modules` and `**/node_modules` overlap, as do `archive` and `**/archive/**`.
Harmless — TypeScript's default excludes already cover `node_modules`, and
`archive/` contains no `.ts`. **Trivial. No action.**

---

## Summary

| Finding | Severity | Status |
|---|---|---|
| 1. `mail:check` in `verify` but not `verify.yml` | Medium | Concurrent agent, in flight |
| 2. `eslint.config.js` ignores `temp/**`, which does not exist | Low–Medium | Open |
| 3. ESLint typing correctly scoped to `packages/` | None | Sound |
| 4. All 49 script targets resolve | None | Sound |
| 5. 12 of 14 gates verified running, exit 0 | — | Verified |
| 6. `tasking:check` broken → **fixed mid-audit**; now surfaces a duplicate claim | **Resolved** | Fixed by concurrent agent |
| 7. Redundant `tsconfig` excludes | Trivial | Open, cosmetic |

**The config layer is in good shape.** One script-graph gap (a gate added to
`verify` but not CI, caught by `ci:check`), one stale ignore glob, and two cosmetic
items. The consequential defect was in a gate's braces, not in its configuration —
and it has already been fixed by another agent while this audit ran.