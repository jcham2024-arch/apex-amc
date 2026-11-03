# REPORT — Two-way cartridge name normaliser

**Task:** `name-normaliser-spec` · **Agent:** `4880a` · **Date:** 2026-10-02
**Derived from:** `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`

---

## 1. What I did

Produced a rules specification and a two-direction test corpus, in both directions,
using **real rows mined from the database** rather than invented examples.

1. Read the existing `CARTRIDGE_ALIASES` map in `scripts/gates/check-seeds.mjs` —
   12 entries.
2. Applied candidate normalisations cumulatively across all 318 rows and recorded
   every collision each one introduced.
3. Mined under-match cases by probing expanded/abbreviated forms against stored names.
4. Cross-checked every alias target against the database, including whether an exact
   match already existed.
5. Validated my own corpus by parsing it and resolving every slug against the DB.

## 2. What I found

### 2.1 The existing alias map resolves before trying an exact match

`check-seeds.mjs` consults `CARTRIDGE_ALIASES` **before** any exact lookup. **4 of 12
aliases bypass a row whose name matches the query exactly:**

| Query | Alias sends it to | Exact row that exists |
|---|---|---|
| `9 luger` | `9mm-luger` (family=pistol) | `9-luger` (family=rifle) |
| `.308 win` | `308-winchester` | `308-win` |
| `.223` | `223-remington` | `223` |
| `.30-06 springfield` | `30-06` | `30-06-springfield` |

The fix is a precedence change, not new aliases: **exact `name` → `short_name` →
`slug` → then alias.**

### 2.2 One of the four is a live data defect

`30-06-springfield` exists with `saami_max_psi = NULL`; the alias redirects to `30-06`
which has 60,000 psi. **A pressure lookup for that cartridge silently returns another
row's value.** Both are `family=rifle`, so no filter separates them.

The other three return identical figures *today* — by coincidence, not correctness.

### 2.3 `.308 Winchester` has the wrong `short_name`

I initially claimed case/whitespace folding produced zero collisions. **False for
`short_name`:** `.308 Winchester` carries `short_name = ".308 Win Mag"`, which belongs
to a different cartridge. **Do not fold `short_name` until that is fixed.**

### 2.4 Safe rules, measured

Collapse whitespace, strip trailing `.`, case-fold, trim: **zero** collisions across
all 318 `name` values. Those four rules are safe for `name`.

### 2.5 Prefix matching is unsound, and it currently looks correct

A prefix rule is the obvious fix for a bare `9mm` query. Measured, it matches exactly
one row today — so **it would pass every available test.** It is still wrong: it
breaks the moment a genuine `9mm`-prefixed different cartridge is added. `OM-05` pins
it, and `OM-16`…`OM-19` record cartridges we do *not* hold so a future agent adds them
without testing.

### 2.6 The source KNOWLEDGE.md baseline is stale

`ammoseek-coverage/KNOWLEDGE.md` §4 states "We hold **0 of 8 gauges**. The only row
filed as `shotgun` is `4 Bore Rifle`." **Measured: `family=shotgun` now holds 9
rows**, including 5 gauges and 2 .410 bores. Another agent filled them.

`cartridge-family-audit` (mine) is cited as ground truth by tasks in the queue. **Its
§4 is now wrong and should be re-measured before anyone plans from it.**

## 3. Reasoning

An under-match produces a visible "not found"; an over-merge silently attributes one
cartridge's data to another. **They are not symmetrical, and the specification is
organised around that asymmetry** — every rule is tagged with which it can cause.

The central recommendation is precedence, not a bigger alias map: 4 of the existing
aliases are only wrong because exact match is never tried.

## 4. What I deliberately did NOT do

- **Did not implement the normaliser.** `task.json` prohibits it; this is a spec.
- **Did not rename or rewrite any stored name.** That is a data migration.
- **Did not edit `CARTRIDGE_ALIASES` or `check-seeds.mjs`.** Not in my write-set, and
  the fix belongs with whoever owns the loader.
- **Did not add a `4 Bore` alias.** It would point at `4 Bore Rifle`, whose name is
  itself wrong. Fix the name first.
- **Did not fill the "not held" gaps** in `UM-11`/`UM-12`. Those are data gaps, not
  normalisation failures, and recording them as normaliser failures would be wrong.

## 5. Verification

| Check | Result |
|---|---|
| `02-test-corpus.csv` parses | 6 columns, 31 rows, **0 ragged** |
| Every referenced slug exists | **46 of 46** resolve; 2 intentional `(not-held)` future-trap markers |
| Over-merge rows have two distinct cartridges | all verified against the DB |
| Corpus is two-directional | 12 under-match, 19 over-merge |
| S1–S4 safety claim | **0** collisions on `name`, **1** on `short_name` (corrected) |

**Two of my own claims were false and were caught by measuring rather than asserting:**
the "zero collisions" claim (false for `short_name`) and the source's "0 gauges"
claim. Both corrections are in `KNOWLEDGE.md` §3 and §6.

**My corpus was also defective on first write** — 16 ragged rows from a missing field,
then two guessed slugs. A checker that parsed the CSV and resolved every slug caught
all of it.

## 6. Unresolved

- **`.30-06 Springfield`'s NULL psi** needs a decision: fill the row, or drop the alias
  redirect? Filling requires a source; I did not invent one.
- **`.308 Winchester`'s `short_name`** is wrong and blocks safe `short_name` folding.
  This belongs to whoever owns that seed row.
- **Which of the two duplicate-row policies applies** — my `cartridge-row-identity`
  proposal. Several rules here depend on it.
- **`4 Bore Rifle`'s name.** Renaming is mine to propose, not to perform.