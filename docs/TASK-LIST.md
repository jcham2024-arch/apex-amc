# MASTER TASK LIST

**Consolidated 30 Sep 2026. This is the source of truth for CODE, SAFETY and
VERIFICATION work.** Data-population tasks live in
**[DATA-TODO.md](DATA-TODO.md)**, which is more detailed and owns them.

> 
> **Splitting this across multiple agents? Use
> [`PARALLEL-WORK-PLAN.md`](PARALLEL-WORK-PLAN.md) instead.** This file is ordered by
> priority, which does not tell two agents which files they would both edit.
**Read both.** `DATA-TODO.md` covers the data layer. This file covers everything
> else, and above all **Priority 1 — the solver shipped three real ballistics
> defects while 161 tests passed.** If you take one thing from this document, take
> P1.1.

Every task states what to do, why, and how to know it is done. Ordered by
dependency, not by appeal.

**Repo:** `C:\Cline\ApexProject`
**Verify:** `npm run verify` (lint + typecheck + test + encoding + schema + seed
+ data validation + docs). **All nine stages must pass.**

---

## Current state, measured not remembered

| | |
|---|---|
| Tests | **235 passing, 0 failing** |
| `npm run verify` | **green, all 15 stages** |
| Data | 989 rows, 13 datasets, cross-references resolve |
| Bullets | 120 rows (Berger 109, Hornady 7, Sierra 4) |
| Powders | 169 rows, 7 manufacturers |
| Cartridges | 229 curated specs, 234 pressure rows + 114 secondary |
| Drag tables | **corrected**, verified 3 ways |
| Solver | **agrees with js-ballistics to 1 fps** |
| Recipes | **still zero** — the load feature has no data |

---

## BLOCKERS — resolve before anything else

### B1. `bullets.diameter_in` holds calibre DESIGNATIONS, not measurements

**Why it blocks:** `diameter_in` reads `0.264` for a 6.5mm bullet. A real 6.5mm
bullet is **0.256 in**. Any drag, sectional-density or form-factor calculation
using that column is silently wrong. The name promises a measurement and does not
deliver one.

**Do:**
1. Rename the column to `caliber_designation` (a sibling `caliber` column already
   exists; consolidate them).
2. Add `bullet_dia_in` as a real measurement, nullable, populated only where a
   manufacturer or CIP/CIPM source states it.
3. Leave it NULL where unknown. **A blank is a visible gap; a wrong value is a
   silent lie.** That rule is already in `data/schemas/bullets.yaml`.
4. Update `value_provenance.csv` — it carries an `estimated` 0.308 diameter with a
   warning note. Re-label it once real measurements exist.
5. Only then let drag code read a diameter.

**Done when:** no code path reads `diameter_in`, `bullets.yaml` documents both
columns, `bullet_dia_in` is populated for the major calibres.

**Also note:** `bc_reference`, `bc_g1_mach_2_25` and siblings were just added to
the bullet CSVs. Check whether they are populated; velocity-dependent BC columns
are valuable but must not be half-filled.

---

### B2. `.45 ACP` and `.357 SIG` maximum pressures are UNVERIFIED

**Why:** those chambers are dimensionally near-identical to 9mm, so selecting the
wrong one is a chambering error. We confirmed SAAMI/CIP figures for 9mm
(35,000 / 34,000 psi), 9mm+P (39,000), .40 S&W (35,000 / 33,000), 10mm
(38,000 / 34,000), .38 Spl (17,000 / 22,000) and .357 Mag (35,000 / 44,000) —
but not these two.

**Do:** read CIP TDCC and SAAMI Z299.3 directly. The archived
`saami-z299.3-2022-centerfire-pistol-revolver.pdf` is on disk and unread.

**Done when:** both appear in `cartridge_specs.csv` with `standard_body` set and a
source URL. Cross-check against the `ammolytics/cartridges` MIT dataset
(`docs/OPEN-SOURCE-LANDSCAPE.md` 2.3) — **as a cross-reference only, never a
primary source**, since its contents are transcribed from SAAMI/CIP.

**Important:** SAAMI and CIP disagree materially (.357 Mag is 35,000 vs 44,000).
Populate `standard_body`. A load developed to a CIP chamber is not a load
developed to a SAAMI chamber.

---

### B3. `recipes` is empty — a strategy decision, not a data task

Do not start transcribing until this is settled; the work may be throwaway.

Publisher load data is owned and sold. Verified 30 Sep 2026: Wolfe Publishing /
load-data.com carries an explicit copyright notice and grants no republication
rights; Hornady sells its Handbook at $19.99 or $0.99/cartridge. **Default
posture is cite-and-link, never reproduce.**

- **A (recommended).** A **citation layer**: the app says which manual carries a
  load and links to it. No copyrighted rows stored.
- **B.** Licensed curated subset, if a publisher will deal.
- **C. Rejected** — transcribing manuals. Bad legally and for maintenance.

**Related:** build the **errata system** (`docs/ROADMAP.md` 1.1b). Hornady's 12th
Edition has a live safety notice — page 350 of the 6.5 PRC data misprints the
powder (StaBall Match for StaBall HD), which Hornady says "could result in
dangerously high pressures." A printed manual cannot be corrected; an app can.
**This is the strongest safety argument for the product.**

**Done when:** the decision is recorded in `docs/ROADMAP.md` with the licensing
evidence, and the chosen path has a schema.

---

## PRIORITY 1 — Stop the same class of bug recurring

### P1.1 CI cross-check against js-ballistics

**The single highest-value task in this list.**

On 30 Sep 2026 three separate ballistics defects were found by diffing against an
independent implementation. **All three would have been caught by a CI check.**
Every one passed the existing test suite.

Add `js-ballistics` (ISC, permissive) as a devDependency and assert:

- Retained velocity within ~0.5% across 100–1000 yd
- Drop within a stated tolerance
- **Both G1 and G7**
- Across a matrix of Mach regimes — **the transonic region is where the error was
  found**, so do not test only subsonic
- `G7_DRAG_TABLE` equals `data/reference/drag_tables.csv` row for row

**Do not** make it a runtime dependency. It is a test oracle.

**Done when:** a deliberately corrupted drag table fails the build.

### P1.2 Physical sanity gates that need no oracle

```
muzzle drag deceleration must be O(1-10) g for a rifle bullet
   -> the broken solver reported 260 g and nothing complained
```

That is the one that was missing. Keep the ones already present: time of flight
1000 yd in 1.3–1.9 s; velocity monotonically decreasing; drop under the vacuum
limit 0.5·g·t².

### P1.3 A "two errors cannot cancel" test

The three defects were **a too-low drag table masking a too-large drag constant**.
Both wrong, same direction, plausible output, all tests green. A test that varies
one input at a time cannot find that.

Verify a *whole curve*, not an endpoint:

```
Cd(Mach 1.0) / Cd(Mach 0.8) must be > 2 for both G1 and G7
```

Our old table gave 1.11. That one assertion would have caught it.
**Done when:** reintroducing the old table fails the build.

### P1.4 Never write test expectations from our own solver

`REFERENCE_VELOCITY_FPS` was **21% high at 1000 yards** because it had been
generated by the buggy solver rather than measured. It was an oracle that agreed
with the bug. Expectations come from `data/reference/`, never from our own output.

---

## PRIORITY 2 — Correctness in the app

### P2.1 Rewire the last screens to the shared domain

Only 2 of 6 mobile screens use `@apex/ballistics-core`:

| Screen | Status |
|---|---|
| `RayleighGroupCalculator.jsx` | **DONE** — was under-reporting CEP by 22% |
| `TransonicStabilityScreen.jsx` | **DONE** |
| `PowderTempSensitivityScreen.jsx` | User-input coefficient, low risk, unshared |
| `RifleProfileScreen.jsx` | Form only, no maths — verified, not a defect |
| `BackupRestoreScreen.jsx` | Uses **removed Expo filesystem APIs** |

**Do:** rewire powder-temp; fix backup/restore to current Expo APIs.
**Done when:** no screen contains ballistics arithmetic that is not imported.

### P2.2 Audit for other cancelling errors

Same class of bug may exist elsewhere. For each numeric constant in the app ask:
**what independent physical bound would this violate if it were wrong by 10×?**
If nothing would catch it, that is a missing test.

### P2.3 Website hardening — CSP and compiled CSS

**Done:** the duplicate renderer is gone. `apps/website/index.html` (a
hand-maintained 1,075-line file that never loaded `src/`) has been retired; the
site is now built from `apps/website/src/` by `npm run website:build`. That
removed 5 `innerHTML` sinks and 3 recorded XSS findings.

**Still open:** the page loads `cdn.tailwindcss.com` (a runtime CSS compiler)
with no Content Security Policy. Both are tracked in `SECURITY.md` and recorded
in the finding baseline, so they do not fail `verify` — but they are real. The
target is a build-time stylesheet and a nonce-based strict CSP.

---

## PRIORITY 3 — Data completion

### P3.1 Bullet coverage

120 bullets, heavily skewed: **Berger 109, Hornady 7, Sierra 4.** The imbalance
means a Hornady or Sierra shooter gets a poor result, and those are mainstream.

**Priority order:** Hornady, Sierra, Speer, Nosler, Lapua — matching the
manufacturers already in `manufacturers.csv`. Use `ammolytics/projectiles` (MIT)
as an **index of what to fetch**, not as a source; every row still needs its
manufacturer URL.

### P3.2 Populate `standard_body`

Load-bearing for the SAAMI/CIP divergence. See B2.

### P3.3 Extract SAAMI reference velocities

`data/published/saami-z299.{2,3,4}` are on disk and **unread**. They contain
measured proof-load velocities with stated test barrels — the highest-quality
primary oracle data available. Extracting these closes the barrel-scaling
validation gap and upgrades several `derived` rows to `published`.

### P3.4 Powder data

169 rows exist. Check burn-rate class is populated for all of them, since it drives
the barrel-scaling exponent (`SCALING_EXPONENT` is `estimated`).

---

## PRIORITY 4 — Optional, parked

Deliberately not scheduled. Design and safety boundaries are already written down,
so they can be picked up without re-deriving anything:

| Feature | Doc | Constraint |
|---|---|---|
| LLM assistant (BYO key) | `FUTURE-INTEGRATIONS.md`, `ROADMAP.md` 3 | Model must never produce a charge weight, pressure, or trajectory number. System prompt is a shipped safety artefact. |
| Errata monitoring | `ROADMAP.md` 1.1b | Never auto-apply a correction — show and require acknowledgement |
| Review aggregation | `BRASS-AND-PRESSURE-CLASS.md` 3, `COMMUNITY-INTELLIGENCE.md` | Count, link, attribute. Never score. A consensus must never touch a load number. |
| Forum extraction agent | `LANE-7-FORUM-AGENT.md` | Ready-to-hand brief. Extraction only, never adjudication. |
| Equipment catalogue | `EQUIPMENT.md` | Prefer compatibility data over product rankings |

---

## Rules that apply to every task

Not style preferences. Each exists because breaking it caused a documented defect
or would create an unrecoverable one.

1. **Never invent a safety-critical value.** Leave it NULL. A blank is a visible
   gap; a wrong value is a silent lie.
2. **Every value carries provenance.** `published` / `derived` / `estimated`, with
   `method` or `reasoning`. `estimated` without reasoning throws
   `UnverifiedValueError`.
3. **Never write test expectations from our own output.** Use `data/reference/`.
4. **Cite, do not reproduce, publisher load data.** Verified 30 Sep 2026.
5. **Community data never enters published tables.** Enforced by schema: no foreign
   keys from official tables into the community set. Do not weaken it.
6. **Run `npm run verify` before finishing.** All nine stages.
7. **Do not edit files you were not assigned.** Report problems in your summary.

---

## Critical files

**Read before changing ballistics:**

- `packages/ballistics-core/src/drag/dragTables.ts` — corrected tables plus the
  three-defect history in the header
- `packages/ballistics-core/src/drag/solver.ts` — the drag constant, form-factor
  derivation, and four named unit/dimension traps
- `docs/BALLISTICS-AUDIT.md` — **section 0** is the current ballistics state
- `data/reference/README.md` — what makes data an oracle
- `docs/OPEN-SOURCE-LANDSCAPE.md` 1.1b — how three defects hid each other

**Do not touch:** `data/schema/011_community_layer.sql` — the community/official
separation is deliberate and load-bearing.

---

## Suggested first week

| Day | Task |
|---|---|
| 1 | **P1.1** CI cross-check — catches all three known defects at build time |
| 2 | **P1.2, P1.3** sanity gates and the cancelling-error test |
| 3–4 | **B1** diameter column split — blocks all drag work |
| 5 | **B2** .45 ACP / .357 SIG from SAAMI Z299.3 |
| 6 | **B3** record the recipes decision — everything downstream waits on it |
| 7 | **P3.1** bullet coverage, Hornady and Sierra first |

**If only one thing gets done: P1.1.** Three real ballistics defects shipped in a
test suite with 161 passing tests. The oracle is what changed that, and without
it in CI the next one ships too.