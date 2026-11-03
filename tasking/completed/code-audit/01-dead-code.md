# 01 — Dead code

**Task:** code-audit. **Audit only — nothing was refactored.** Every claim below
carries the search that produced it.

Scope reminder: `packages/ballistics-core/` is **safety-critical and read-only**.
No finding here proposes changing the physics.

---

## How dead code was searched

Symbol-level reference counting across 102 source files (`.mjs`, `.js`, `.ts`,
`.tsx`), excluding `node_modules`, `dist`, and `archive`. Occurrences were counted
per identifier, not per line, and a symbol's **own declaration site was excluded**
so an export used only by its own file scores zero.

**A zero reference count is a candidate, never a verdict.** `AGENTS.md` is explicit
that a file referenced only by a gate is not dead. Two of my initial candidates were
killed by that rule — recorded below rather than quietly dropped.

---

## FINDING 1 — `check-tasking.mjs` verifies exactly one task (live defect, not dead code)

The single most important result of this audit, and it is not dead code — it is the
opposite: **code that looks alive and passes, while doing almost nothing.**

```
$ node scripts/gates/check-tasking.mjs
  1 task(s) in pending/, 1 ready
  4 task(s) in completed/, 0 declared output(s) verified
```

`pending/` contains **8** task directories, 7 of them with a valid `task.json`.
Instrumenting a copy shows the loop body executing once and then ending:

```
PENDING= C:\Cline\ApexProject\tasking\pending
dirs= 8
  SET ammoseek-coverage        <- only one SET, then the loop ends
```

**Cause.** In `scripts/gates/check-tasking.mjs` the manifest loop opened at line 62

```js
for (const dir of taskFolders(PENDING)) {
```

is **missing its closing brace**. `tasks.set(manifest.id, manifest);` is the last
statement in the loop body, and the brace that should close it is absent — so the
`for` is closed instead by the dependency loop further down, at which point the
manifest loop has already ended. Every statement after `tasks.set` inside the loop
becomes part of the *following* statement block.

**Why every gate is green.** A **stray `}` sits at end-of-file** (line 223) which
balances the missing one:

```
$ open=58 close=58 delta=0
```

The file is net brace-balanced, so `node --check`, ESLint, and every syntax gate
pass. Two braces in the wrong place cancel out. This is why the defect is invisible
to tooling and why it shipped.

**Introduced in** commit `a939ecd` ("tasking: make 'done' a checkable claim via
task.json manifests"). `git show a939ecd:scripts/gates/check-tasking.mjs` confirms
the brace was already missing there, so **this gate has never verified more than one
task, since the moment it was written.**

**Why it matters more than a red gate.** The file's own header states its purpose:

> "On 2 Oct 2026 several agents were dispatched from `tasking/pending/`. All of them
> finished. **None wrote anything to `tasking/completed/`**, and the queue looked
> identical before and after — because 'finished' and 'started and abandoned' are
> the same thing on disk."

The gate was written specifically because nothing on disk could distinguish a
finished task from an abandoned one. **As shipped it reports `0 declared output(s)
verified` while four completed tasks sit in `completed/`.** It would not have caught
the original failure either. Its entire purpose is currently unfulfilled.

**There is a second, independent defect.** Even with the brace restored, the gate
builds its manifest map by scanning `PENDING` only, while the documented workflow
*moves* the task folder (manifest included) out of `pending/` into `completed/`
(`tasking/pending/README.md`, "When you finish", step 1). A finished task therefore
resolves to nothing, producing:

> `tasking/completed/<id>/ has no manifest in pending/, so its declared outputs
> cannot be verified.`

**Both changes are required.** Not applied — `scripts/` is outside this task's
write-set and this audit is explicitly read-only.

---

## FINDING 2 — `import-bullets.mjs` re-implements CSV parsing against the shared loader

The repo's rule is *"One loader, not two."* (`docs/DATA-TODO.md:103`). One script
breaks it.

`scripts/shared/data.mjs` exports the correct RFC 4180 reader and says why a naive
split is wrong:

```js
// scripts/shared/data.mjs:116-118
// RFC-4180. The seed data genuinely needs it: cartridge names contain commas
// and escaped quotes (".500 NE 3""", '12 gauge 3 1/2" mag'), so split(',')
// is not merely inelegant, it is wrong.
export function readCsv(path) {
```

`scripts/data/import-bullets.mjs` writes bullets CSVs with its own comma split:

```
scripts\data\import-bullets.mjs:110  ? readFileSync('data/seeds/bullets/hornady.csv', 'utf8').split(/\r?\n/)[0].split(',')
scripts\data\import-bullets.mjs:111  : lines[0].split(',');
scripts\data\import-bullets.mjs:128  const existing = lines.slice(1).map((l) => l.split(','));
```

It already imports from `scripts/shared/data.mjs` (line 18, `loadManifest`), so the
shared module is available and simply not used for parsing.

**Current impact: latent, not active.** Verified against every bullet CSV — no
current row contains an embedded comma, so nothing is being corrupted today:

```
=== hornady.csv ===
naive header cols : 26
shared readCsv cols: 26
header identical   : true
naive RAGGED rows : 0
=== all bullet CSVs ===
berger: naive ragged=0  readCsv rows=109 naive rows=109
hornady: naive ragged=0  readCsv rows=7   naive rows=7
sierra: naive ragged=0  readCsv rows=4   naive rows=4
```

**Risk.** The exact hazard `data.mjs` warns about already exists in the dataset —
cartridge names carry commas and embedded quotes. A bullet field gaining one would
silently shift every later column, producing exactly the ragged-row corruption
`AGENTS.md` records ("the reader pads short rows, so a row with a missing field
loads with the right *number* of keys and the wrong *values*"). **This is a latent
trap on a file-writing path, not a formatting nit.**

**Fix (not applied):** use `readCsv` from `scripts/shared/data.mjs` for both the
header and the existing-row read, and quote on write.

---

## FINDING 3 — over-exported symbols (minor; a tidy-up, not dead code)

Symbols exported with no external consumer. Each was checked individually, because
the first two turned out **not** to be dead.

### NOT dead — recorded because I was wrong first

`scripts/security/security-rules.mjs` exports `templateInjectionFindings` and
`remoteScriptFindings` with zero external references. They are used *inside* the file
by `securityFindings`, which is what both real callers import:

```
  145: export function securityFindings(html, rel) {
  147:   ...templateInjectionFindings(html, rel),
  148:   ...remoteScriptFindings(html, rel),
```

```
security-baseline.mjs  import { securityFindings, SCANNED } from './security-rules.mjs';
security-check.mjs     import { securityFindings, loadKnown, SCANNED, KNOWN } from './security-rules.mjs';
```

**Verdict: not dead.** The `export` keyword is unnecessary (internal helpers), but
removing the code would break the security gate. `security-rules.mjs` itself is
heavily used.

### Genuinely unused exports in `scripts/shared/data.mjs`

```
prototypeIndexFile   0 external refs
referenceDir         0 external refs
extractsDir          0 external refs
researchDir          0 external refs
handoffDir           0 external refs
requirePath          0 external refs
```

Searched across all 50 `.mjs` files. `requirePath` appears exactly **once** — its
own declaration. These are path constants and one helper with no consumer today.

**Risk of removing: low, but non-zero.** They are cheap, self-documenting
declarations of the repository's directory layout, and `data.mjs` is described as
the single source of governed paths. **Recommendation: leave the path constants**;
they cost nothing and removing them trades a real risk for no benefit.
`requirePath` is the only one where removal is clearly justified.

### `htmlTable` (same file family)

`scripts/shared/bullet-sources.mjs:htmlTable` — used twice inside its own file, no
external consumer. Used by the BERGER parser. **Not dead**; consider dropping the
`export`.

---

## FINDING 4 — scripts on disk not referenced by `package.json` (by design)

Eight scripts are not reachable from any `package.json` script:

```
scripts/data/promote-powders.mjs
scripts/data/split-cartridge-specs.mjs
scripts/data/split-seeds-by-manufacturer.mjs
scripts/extract/extract-website.mjs
scripts/handoff/check-handoff-rules.mjs
scripts/security/security-rules.mjs        <- imported by security-check.mjs
scripts/shared/load-database.mjs            <- imported by 3 scripts
scripts/text/repair-encoding.mjs
```

**Not dead.** Every one is either imported by another script (`security-rules`,
`load-database`) or is a documented one-shot tool. `AGENTS.md` lists
`promote-powders.mjs` and `extract-website.mjs` by name as real commands; the
`split-*` scripts are recorded history from the 1 Oct data reorganisation.

All 49 `package.json` scripts were checked for missing targets: **every referenced
file exists.** No broken script entries.

**One genuine risk, already documented:** `AGENTS.md` records that
`extract-website.mjs` is a **one-shot extractor that overwrites six hand-edited
files** in `apps/website/src/`, stripping `main.js`'s ES imports and XSS hardening.
It now requires `--force`. Being unreachable from `package.json` is the right
posture.

---

## Summary

| Finding | Severity | Live? |
|---|---|---|
| 1. `check-tasking.mjs` verifies one task; braces cancel out | **Critical** | **Yes** |
| 2. `import-bullets.mjs` re-implements CSV parsing | **High (latent)** | No — trap on a write path |
| 3. Over-exported symbols; 6 unused in `data.mjs` | Low | No |
| 4. Unreferenced scripts | Informational | No |

**Nothing here is dead code in the ordinary sense.** The important result is the
inverse of what the brief asked for: a green gate that has never once done its job.