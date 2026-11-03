# KNOWLEDGE — code audit

**Task:** code-audit. **Date:** 10 Feb 2026. **Format note:** declared in
`task.json`; no brief defines its shape. Written as durable, cross-task findings.

---

## The one thing to carry forward

**A gate in `verify` can be green and verify nothing.** `check-tasking.mjs` shipped
with a missing brace that silently reduced it to checking **one task per run**, and
reported `0 declared output(s) verified` while four completed tasks sat in
`completed/`. A stray `}` at EOF balanced the missing one, so `node --check` and
ESLint both passed.

It was eventually found — **by an agent doing its own task**, not by a gate.

> **Operational rule:** for anything load-bearing, the negative test comes first,
> and a comment describing a guarantee is a hypothesis. `AGENTS.md` already records
> four instances of "a check that passes while producing wrong output" and
> `tasking/review/HISTORY.md` records the CSP, where every gate passed because every
> gate *read the file* instead of the deployed response. **This repo verifies its
> intent more reliably than its effect.**

(Finding now resolved — another agent fixed the brace during the audit. Retained as
trap history per `.clinerules` §5 rule 7.)

---

## `scripts/shared/` exists and is correct — 23 scripts still reimplement it

Measured across 50 `.mjs` files:

| Pattern | Count | Should import |
|---|---|---|
| `root` re-derived via `resolve(import.meta.dirname, '..', '..')` | **14** | `root` from `shared/data.mjs` |
| `root = process.cwd()` | **9** | `root` from `shared/data.mjs` |
| `createHash('sha256')` call sites | **9** (7 hex, 2 base64) | a shared helper — none exists |
| RFC 4180 CSV parsing reimplemented | **1** | `readCsv` from `shared/data.mjs` |

Only **7** scripts import `root`. The convention is documented in `check-seeds.mjs`
and followed by 7; the other 23 each solved a problem that was already solved.

**The one that actually bites:** `process.cwd()` rooting in 9 scripts, including
`check-docs.mjs` — the gate that resolves every repository path in backticks. Run
from the wrong directory it walks the wrong tree and can report a **false green**.
`AGENTS.md` records the same family: *".NET file APIs ignore PowerShell's `cd` … npm
honours the PowerShell location, so it looked correct while the call silently read
the wrong repo."*

**The one that is a live trap:** `import-bullets.mjs` splits bullets CSVs on `,`
while `shared/data.mjs` says of the same operation that it "is not merely inelegant,
it is wrong." Currently latent (no bullet row has an embedded comma) but it is a
**write** path, and it is exactly the ragged-row corruption `AGENTS.md` records.

**Correctly not duplicated:** database loading (`shared/load-database.mjs`, imported
by 3), manifest loading and row validation. The "one loader, not two" rule was
applied once, correctly.

---

## Not dead, despite looking it

**A file referenced only by a gate is not dead** — `AGENTS.md` says so explicitly.
Two candidates were killed by that rule during this audit:

- `scripts/security/security-rules.mjs` exports `templateInjectionFindings` and
  `remoteScriptFindings` with **zero external references**. Both are used *inside*
  the file by `securityFindings`, which is what `security-baseline.mjs` and
  `security-check.mjs` actually import. **Over-exported, not dead.**
- Eight scripts are unreachable from `package.json`; all are imported by another
  script or are documented one-shot tools. `extract-website.mjs` is deliberately
  unreachable — it overwrites six hand-edited files and needs `--force`.

Genuinely unused, low value: `requirePath`, `prototypeIndexFile`, `referenceDir`,
`extractsDir`, `researchDir`, `handoffDir` in `scripts/shared/data.mjs`.
**Keep the path constants** — they cost nothing and removing them trades real risk
for no benefit. `requirePath` is the only clean removal.

---

## Two comments that lie

1. **`eslint.config.js` ignores `temp/**`** with the justification *"Second scratch
   directory created by later data-agent work."* `temp/` does not exist, and no
   `scripts/_*`/`fix_*` file does either. Worse, it silently tolerates a second
   scratch location that **`.clinerules` §5 rule 10 does not mention** — the rule
   says scratch goes in `tmp/`. Delete the entry or amend the rule.

2. **`.cline/tasks/ledger.json` records `"stages": 14`.** Real count is 20 (19
   before `mail:check` was added). That file is called *"the authoritative task
   ledger"* by `tasking/README.md`. `.clinerules` resolved this exact problem by
   **deleting** its count rather than replacing it.

**What did *not* lie:** ten numeric claims in code comments, all verified accurate
against the data. The comments about *data* are excellent. The ones that lie are the
comments about *gates* — because a gate's comment records what it was written to do,
and nothing forces it to keep doing it.

---

## Verified-good, so nobody re-checks it

- **All 49 `package.json` script targets exist.** No broken entries.
- **12 of 14 read-only gates exit 0 when actually run.** (`docs:audit` exits 1 **by
  design** — "report only"; it is not in `verify`.)
- **ESLint typing is correctly scoped**: `packages/` only, matching root
  `tsconfig.json` (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`).
  `scripts/` is plain ESM Node and correctly exempted.
- **`check-seeds.mjs` is exactly 1,644 lines**, matching `AGENTS.md`.
- **235 tests** = 215 + 7 + 13. Both doc claims accurate.

---

## Traps hit during this audit, worth not repeating

- **`execFileSync('npm', ...)` fails on Windows** — npm is a `.cmd` shim. All 15
  gates returned `ERR`, which would have been a fabricated "every gate is broken"
  finding. `spawnSync('npm.cmd', …, shell:false)` then failed **EINVAL** on this
  Node/Windows combo. **`cmd.exe /c npm run <script>` works** and returns real exit
  codes. Three attempts before a correct measurement — the lesson is the repo's
  own: *verify the artefact, not the exit code.*
- **`Select-String` has no `-Recurse`** (it is `Get-ChildItem -Recurse |
  Select-String`), and PowerShell mangles inline regex with nested quotes — the trap
  `AGENTS.md` records as "PowerShell mangling inline `node -e`".
- **`.NET` file APIs ignore PowerShell's `cd`** — a relative path in
  `[System.IO.File]::ReadAllBytes()` resolved to `C:\Cline\...` instead of
  `C:\Cline\ApexProject\...`. **Use absolute paths in .NET calls.**
- **A `const` declared below the loop that calls it** (`PATH_SCOPE` →
  "Cannot access before initialization") — same failure family as the missing brace.

---

## Open for the planner

| Item | Status |
|---|---|
| `import-bullets.mjs` CSV re-implementation | **Open — High, latent** |
| 9 `process.cwd()` roots (incl. `check-docs.mjs`) | **Open — Medium** |
| 14 re-derived `root` + 9 sha256 sites | **Open — Low** |
| `eslint.config.js` `temp/**` | **Open — Low/Medium** |
| `ledger.json` `stages` | **Open — Medium/High** |
| `check-tasking.mjs` brace defect | **Fixed by another agent mid-audit** |
| Duplicate task in two folders | Fixed; newly-working gate caught it |