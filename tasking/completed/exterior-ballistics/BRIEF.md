# Task T6 - Exterior ballistics: trajectory reference and validation dataset

**Status:** READY
**Blocked by:** none
**Workflow:** copy-out to `tasking/completed/T6/` - see [tasking/README.md](../README.md)
**Model:** [record on start - fresh instance of the default model]

> **RESEARCH ONLY. DO NOT TOUCH `packages/ballistics-core/`.**
> That solver is safety-critical. You are gathering evidence to check it, not to
> change it.

---

## 1. Isolation Boundaries

**Strict Read Paths** - read anything; you NEED:

- `packages/ballistics-core/src/drag/solver.ts` - the governing equations
- `packages/ballistics-core/src/atmosphere.ts` - density, humidity, speed of sound
- `data/reference/README.md` - the three-part oracle test. **Binding.**
- `data/reference/measured_data.csv` - only 7 rows, two of them not oracle rows
- `data/reference/drag_tables.csv` - 730 rows, already cross-verified 3-way
- `docs/ORACLE-SOURCES.md`, `docs/BALLISTICS-AUDIT.md`
- `docs/research-oracles/` - task T2's output, if present

**Strict Write Paths** - ONLY inside `tasking/completed/T6/`:

- `tasking/completed/T6/01-trajectory-datasets.md`
- `tasking/completed/T6/02-bc-reference.csv`
- `tasking/completed/T6/03-atmospheric-validation.md`
- `tasking/completed/T6/REPORT.md`

**Do not edit** `packages/`, `data/`, `scripts/`, `package.json`, or `apps/`.

---

## 2. Where we stand

Already done and strong: the **G1/G7/G8/RA4 drag tables** (730 rows) are verified
3-way against McCoy 2012, `js-ballistics` and `py_ballistics`, agreeing **exactly** at
all 15 comparable Mach points.

Thin and worth fixing:

- `measured_data.csv` has **7 rows**, and 2 of them are explicitly labelled
  "Load-data envelope, NOT an oracle row."
- The 5 rows that remain carry no stated SD for the barrel-length entries
  ("SD not stated; treat as +-15 fps").
- **No trajectory dataset exists at all.** We have raw muzzle velocities but zero
  measured point-of-impact data: no drop, no windage, no retained velocity at range.
- The solver explicitly does **not** model yaw / spin drift, and says so.
- Reynolds-number dependence of `C_d` is not modelled explicitly.

---

## 3. Context Anchors

1. `.clinerules` - binding
2. `data/reference/README.md` - **"A number with no error bar can never fail a
   comparison."** That is the test every row must pass.
3. `docs/BALLISTICS-AUDIT.md` - the validated solver and its documented limits

---

## 4. Execution Prompt

> Paste verbatim.

Gather external, citable datasets that could verify our trajectory solver. Note task
T2 is independently researching *methods*; you are gathering **data**, and you may use
its findings if `docs/research-oracles/` exists when you start.

**`01-trajectory-datasets.md`** - find every legitimate source of measured exterior
ballistics data:

- Peer-reviewed chronograph / Doppler-radar studies reporting point-of-impact at range
- Public and government datasets (ballistic research laboratories, forensic case
  studies with published reconstruction validation)
- Competition and match records that publish DOPE-style drop tables WITH stated
  conditions and uncertainty
- University theses and technical reports

For each candidate: source, licence, whether it is machine-readable, the exact fields
available, **and the stated uncertainty**. Apply the three-part oracle test explicitly
per dataset and mark anything that fails it as not-an-oracle.

**Pay special attention to datasets that state their conditions**: muzzle velocity,
bullet, barrel length, temperature, pressure, altitude, humidity, chronograph
calibration uncertainty, sample size, and SD or ES of the group. A dataset without
those cannot fail a comparison and therefore proves nothing.

**`02-bc-reference.csv`** - projectile reference data: bullet, manufacturer, calibre,
weight, sectional density, BC (G1 and G7 where both published), the model used, the
source, and any stated uncertainty. Prefer manufacturer datasheets and the published
coefficients of drag for specific projectiles. Note which BC *model* each figure uses -
a G1 figure and a G7 figure are not interchangeable, and conflating them is a known
error mode in this field.

**`03-atmospheric-validation.md`** - evidence for and against treating `C_d` as
independent of air density for supersonic projectiles. Task T2 located
arXiv:1510.07336 which tests this directly at two densities. Find more, and state
plainly what our atmosphere model assumes and whether that assumption is defensible.

---

## 5. Definition of Done

**Validation:**

- [ ] `git status --porcelain` shows changes ONLY under `tasking/completed/T6/`
- [ ] `npm run verify` still exits 0
- [ ] Every dataset has the three-part oracle test applied explicitly
- [ ] Every numerical row carries stated uncertainty OR is marked not-an-oracle
- [ ] Every BC value states which model (G1/G7) it uses

**Mandatory negative test:**

- [ ] Paste the count of datasets you found that FAIL the oracle test, and why
- [ ] Paste a self-check proving no project file changed:
      `git status --porcelain` showing only `tasking/completed/T6/`
- [ ] State which single dataset you would add first and what it would prove

**Report:** `REPORT.md`, five-part summary from `.clinerules` §8.