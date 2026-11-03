# Task T2 - Ballistics oracle research: independent verification methods

**Status:** READY
**Blocked by:** none
**Write-set lock:** `docs/research-oracles/` (new directory)
**Model:** [record on start - fresh instance of the default model]

> **RESEARCH ONLY. DO NOT CHANGE THE SOLVER.**
>
> `packages/ballistics-core/` is SAFETY-CRITICAL and out of scope. You are finding
> evidence, not applying it. Applying it is a later, separately-gated task.

---

## 1. Isolation Boundaries

**Strict Read Paths** - you may read anything, you NEED:

- `packages/ballistics-core/src/drag/solver.ts` - the governing equations and its
  documented failure modes
- `packages/ballistics-core/src/atmosphere.ts` - air density, humidity, speed of sound
- `data/reference/README.md` - **the rules you must satisfy for a row to be an oracle**
- `data/reference/measured_data.csv` - only 7 rows today, and it is thin
- `docs/ORACLE-SOURCES.md` - the existing source survey
- `scripts/gates/check-oracle.mjs` - what CI verifies, and what it admits it does not

**Strict Write Paths** - the ONLY files you may create:

- `docs/research-oracles/01-methods-found.md`
- `docs/research-oracles/02-candidate-datasets.md`
- `docs/research-oracles/03-solver-gap-analysis.md`
- `docs/research-oracles/README.md`

> If a required change falls outside this list, **halt and report it**. See `.clinerules` §1.

**Shared files this task may touch:** NONE. Do not edit `packages/`, `data/`, `scripts/`,
`package.json`, or the ledger.

---

## 2. Context Anchors - read in this order

1. `.clinerules` - binding, §5 rule 1: **never invent a value, leave it EMPTY**
2. `data/reference/README.md` - what makes a row a valid oracle: stated test
   conditions, stated uncertainty, independent derivation. **A number with no error bar
   can never fail a comparison and is therefore not an oracle.**
3. `docs/CONVENTIONS.md` - binding
4. `scripts/gates/check-oracle.mjs` - read its "WHAT IT DELIBERATELY DOES NOT DO" section

### The goal

The owner wants: *"3 methods that reach the same conclusion, backed by hard science."*
Your job is to say whether that is achievable, and with which sources.

**Be honest if it is not.** Three methods sharing the same underlying physics are NOT
three independent confirmations. Say which sources are genuinely independent and which
are convergent-but-shared. Overclaiming here would poison a safety-critical claim, which
is exactly what this repository exists to prevent.

---

## 3. Execution Prompt (part 1: methods)

> Paste this section verbatim into the sub-agent.

The project has a validated point-mass trajectory solver with 215 passing tests and a
physics oracle in CI. Three ballistics defects previously shipped while all tests
passed, because the tests shared the author's assumptions. Find external evidence that
can catch that class of error.

**Deliverable 1: `01-methods-found.md`**

Document each independent verification method. For each: paper (title, authors, year,
DOI/arXiv/PMID), the governing equation **written out**, what it independently measures
or predicts, its stated uncertainty, and whether it is genuinely independent of our
solver or shares its assumptions.

These three were already located and MUST be covered first and in depth - expand each
with full numerical results, ranges and error bounds:

1. **arXiv:1510.07336** - Courtney/Courtney, *Experimental Tests of the Proportionality
   of Aerodynamic Drag to Air Density for Supersonic Projectiles*. Work-energy inverse:
   `F_d = m(v_f^2 - v_i^2) / (2d)`, then `C_d = 2 F_d / (rho v^2 A)`. **Highest-value
   source** - it measures drag with no drag model at all. Extract the full
   velocity/density/drag table, chronograph separations, projectile mass, the two air
   densities (0.93 and 1.15 kg/m^3), and the stated 1-2% error.
2. **arXiv:1503.05504** - Courtney et al., *Methods for Accurate Free Flight Measurement
   of Drag Coefficients*. Quantifies two independent methods and their error
   propagation. Extract the sensitivity finding: a 0.5% near-velocity error yields ~3%
   BC error at 200 yd, ~6% at 100 yd.
3. **arXiv:1309.5039** - Courtney & Courtney, *Aerodynamic Drag and Gyroscopic Stability*.
   Extract the measured BC-vs-stability tables (VMAX/SBK/TSX) and the Miller Twist
   relationship. Our solver explicitly does NOT model yaw - this bounds a documented
   limitation rather than validating the solver.

Then search for further peer-reviewed work. Prioritise: empirical validation of
point-mass and 6-DOF models; bore-sight / muzzle-reference velocity error propagation;
Reynolds-number and air-density dependence of `C_d`; Doppler vs optical chronograph
accuracy (arXiv:1608.06500 claims sub-$600 units at 1-2% - verify this claim);
atmospheric models beyond ISA.
**Deliverable 2: `02-candidate-datasets.md`**

For each dataset that could become a row in `data/reference/`, give: source table
reference, the exact rows with units, **stated uncertainty**, the test conditions
(temperature, pressure, altitude, humidity), and the licence/permission status.

**Apply the three-part oracle test explicitly per dataset.** Mark any dataset that FAILS
any part as not-an-oracle and say why. This is the single most important discipline in
this task: a dataset without a stated error bar cannot fail a comparison, so it proves
nothing when it agrees.

**Deliverable 3: `03-solver-gap-analysis.md`**

Compare the papers' models against `solver.ts` and `atmosphere.ts`. Identify where the
solver would AGREE with these methods, where it would DISAGREE, and where it is SILENT
(does not model it at all). Be specific and quote the code.

Three gaps we already know - confirm and find more:

- no yaw / spin-drift model (`solver.ts` states this outright)
- Reynolds-number dependence of `C_d` not modelled explicitly
- `measured_data.csv` has only 7 rows, two of which are explicitly labelled NOT oracle
  rows, and none has a stated SD for the barrel-length rows

**Deliverable 4: `README.md`** - directory index, following
`docs/research-competitors/README.md`.

---

## 4. Definition of Done

**Validation:**

- [ ] `npm run verify` exits 0 and you did not change it
- [ ] `git status --porcelain` shows ONLY files under `docs/research-oracles/`
- [ ] `npm run tasks:check` exits 0
- [ ] Every source cited with a resolvable identifier (DOI / arXiv ID / PMID)
- [ ] Every claimed number has its units and uncertainty attached
- [ ] NO change to `packages/`, `data/`, or `scripts/`

**Mandatory negative test** - this is a research task, so the negative test is about
honesty rather than a gate failing:

- [ ] Paste the `git status --porcelain` output proving zero changes outside your write-set
- [ ] Paste your explicit verdict on whether "3 truly independent methods" is
      achievable, naming which methods share assumptions
- [ ] Paste one place where you were tempted to state something you could not source,
      and what you did instead (leave it blank and say so)

**Report:** the five-part summary required by `.clinerules` §8. Item 4 (what you
believe is wrong) must state plainly whether the three-method claim is defensible, and
what the single highest-value dataset to add next would be.