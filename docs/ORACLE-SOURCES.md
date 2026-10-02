# Oracle sources: hard external data (surveyed 30 Sep 2026)

A survey of **published, citable data we can check ourselves against.** This is
the companion to `OPEN-SOURCE-LANDSCAPE.md`, which covered implementations. This
file covers *measurements*.

**The headline: we found the authoritative G7 drag table, and it confirms our
table is wrong.**

---

## 1. RESOLVED: the published McCoy G7 drag coefficients

### 1.1 The values

From the Tireur *Competition Ballistics* manual, Table 5.2, credited to
**McCoy, *Modern Exterior Ballistics* (2012)**:

| Mach | Cd | Mach | Cd | Mach | Cd |
|---|---|---|---|---|---|
| 0.00 | 0.1198 | 1.00 | 0.3803 | 2.00 | 0.2980 |
| 0.50 | 0.1194 | 1.05 | 0.4043 | 2.50 | 0.2697 |
| 0.80 | 0.1242 | 1.10 | 0.4014 | 3.00 | 0.2424 |
| 0.90 | 0.1464 | 1.20 | 0.3884 | 3.50 | 0.2154 |
| 0.95 | 0.2054 | 1.50 | 0.3440 | 4.00 | 0.1935 |

The manual states these are "reproduced verbatim from the table embedded in the
solver," and adds a methodological point worth adopting:

> The CD(Ma) tables (G1, G7, ...) are aerodynamic data: CD is dimensionless and
> depends only on the projectile geometry and the Mach number, not on the
> atmosphere. They are therefore identical whether one takes them from McCoy or
> from an equivalent published tabulation.

**That last sentence matters.** It means this is *the* table, not one vendor's
version, and a second independent implementation reproducing it is corroboration
rather than coincidence.

### 1.2 Our table is now confirmed wrong

Cross-referencing all three:

| Mach | **McCoy (authoritative)** | js-ballistics | **Ours** |
|---|---|---|---|
| 0.00 | **0.1198** | 0.1198 | 0.1954 ✗ |
| 0.50 | **0.1194** | 0.1194 | 0.0970 ✗ |
| 1.00 | **0.3803** | 0.3803 | 0.0892 ✗ |
| 2.00 | **0.2980** | 0.2980 | 0.0886 ✗ |
| 3.00 | **0.2424** | 0.2424 | 0.0886 ✗ |
| 4.00 | **0.1935** | 0.1935 | (extrapolated) ✗ |

**js-ballistics matches McCoy exactly at every point we can compare. Our table
matches nothing.** The earlier concern that js-ballistics might be the odd one out
is now resolved in its favour.

The transonic structure, which our table lacks entirely:

```
Mach 0.80  0.1242
Mach 0.90  0.1464   <- drag beginning to climb
Mach 0.95  0.2054
Mach 1.00  0.3803   <- 3x the subsonic value: the transonic cliff
Mach 1.05  0.4043   <- peak
Mach 1.20  0.3884   <- settling
Mach 1.50  0.3440
```

The manual describes it directly:

> Both rise sharply through the transonic region, but the slender G7 has a
> markedly lower, flatter peak - the physical reason its BC stays nearly constant
> across the supersonic range.

**Our table is monotone-decreasing with no cliff at all.** That is the whole
error, and it fully explains the measured symptom: **-22 inches of drop at 1000
yards**, because the bullet is modelled as losing much less energy in transit
than it actually does.

### 1.3 Action

Replace `G1_DRAG_TABLE` and `G7_DRAG_TABLE` in
`packages/ballistics-core/src/drag/dragTables.ts` from McCoy Table 5.2 (G7) and
its equivalent (G1). Re-run the velocity regression and expect the drop
discrepancy to close. **This unblocks G7 output.**

Note for the record: the current `dragCoefficient()` also clamps beyond the
table end. With a correct table running to Mach 4-5, that extrapolation path
should be revisited rather than left as a silent fallback.

---

## 2. Datasets found, ranked by value as an oracle

### 2.1 Tireur Competition Ballistics — the single best find

**URL:** `https://www.tireur.org/BallisticsGuide/doc/ballistics_manual.pdf`
84 pages, free, no registration. Verified: downloaded and text-extracted.

A consolidated competition ballistics manual with **quantified error budgets and
explicitly stated test conditions**. Unlike most reloading content, it shows its
working and admits what it does not know.

| Table | Content | Use |
|---|---|---|
| 5.2 | McCoy G7 Cd values | **Settles the drag table** |
| 11.1 | Ballistic data for 8 competition bullets — weight, calibre, G1, G7, SD, twist | Cross-check our bullet BCs |
| 11.2 | Trajectory: 6.5 CM 140gr, G7 0.311, 2700 fps — drop, come-up, velocity, energy, ToF, **wind drift, spin drift** | **End-to-end oracle case** |
| 10.8 | Full DOPE card 200-1000 yd, with wind-per-mph and spin+Coriolis columns | Field-validates our dope output |
| 13.1 | **Error budget** — each input's contribution to total error | Validates our input priorities |
| 3.1 | Measured muzzle velocity vs barrel length, .308 Win / Lapua 155gr Scenar, 20/24/26 in | Validates our barrel scaling |
| 15.3 | Temperature sensitivity by propellant class | Powder-temp screen |
| 15.4 | SAAMI MAP for competition cartridges | Cross-check pressures |
| 8.3 | 3-DOF vs 6-DOF comparison, with accuracy limits | Informs our solver scope |

A worked example worth quoting, because it is exactly the discipline we have
been arguing for:

> A 20-round chronograph string from this load: 2918, 2925, 2914, 2928, 2920,
> 2916, 2922, 2919, 2927, 2921, 2915, 2923, 2926, 2917, 2920, 2924, 2919,
> 2922, 2916, 2925
> Statistics: v̄ = 2920.9 fps, ES = 14 fps, SD = 3.9 fps.

**Raw shots, not just the summary.** That is what makes it an oracle rather than
an assertion.

Its error budget (Table 13.1) independently confirms the priority order already
in `HARDWARE-AND-SENSORS.md`:

| Parameter | Uncertainty | Vertical | Horizontal |
|---|---|---|---|
| Wind speed (10 mph cross) | ±2 mph | — | **15.4 in** |
| Wind direction | ±10° | — | 6.8 in |
| Spin drift (uncomp.) | — | — | 5.1 in |
| BC | ±3% | 3.2 in | 1.8 in |
| Muzzle velocity | ±10 fps | 2.5 in | — |
| Coriolis (45°N, uncomp.) | — | <1.0 in | 2.8 in |
| Temperature | ±10°F | 0.8 in | — |

> Wind reading dominates the error budget at long range. Wind-related errors
> are 3-5 times larger than all other sources combined.

**Two independent sources now agree that wind dominates.** Ours said a 5 mph
crosswind is worth 4.19 MOA at 1000 yd, more than the entire sea-level-to-Denver
elevation change; this says the same in different units. That convergence is
itself evidence.

### 2.2 CSEC LRP Wind Drift Estimator 2.0

**URL:** `https://cameosec.org/wp-content/uploads/2022/12/CSEC-WD-Estimator_v2.pdf`
By Brian Young, Captain USN(r), CSEC LRP RSO. Free, single page. Verified:
downloaded and extracted.

An empirically derived wind-drift model that **states its own limitations**,
which is rarer than it should be:

> The CSEC LRP Wind Drift Estimator is precisely that, an estimator, not intended
> to be exact, but sufficiently accurate to spot hits or bullet splash out to
> 2000 yds.

> Bullet Spin Drift is not included in the estimator and must be applied
> independently.

> The CSEC LRP Wind Drift Estimator is based on high-BC, Spire Point, Boat Tail
> bullets; it is not reliable for flat-based round nose bullets, but may yield
> usable results for flat-based Spitzer bullets, such as Nosler Partition, inside
> of 450 yards.

The method: `WD = (CW / K) × R/100`, where K is the crosswind producing 1 MOA per
100 yards. Distinct K values for three range intervals, with published corrections:

```
Altitude       ±0.00006 per ft
Bullet weight  ±0.01 per grain above/below base
Muzzle velocity ±0.001 per fps above/below 2700
KHR = KLR × 1.4        KELR = KLR × 0.75
Base .308 KLR = 10 mph at 165gr, 2700 fps, sea level
```

**Value to us: a field-validated wind-drift figure with stated conditions and
honest scope limits.** Two more search references (Bison, Berger, Hornady 4DOF
calculators) let it be triangulated.

Note the base conditions differ from our reference load (165gr not 168gr, 2700
fps not 2650), so it checks our wind model, not a drop comparison.

### 2.3 CSEC caliber sheets — not yet retrieved

The estimator references per-caliber base K values. They were not in the
one-page PDF and need separate retrieval. Worth pulling: they give per-caliber
empirical drift constants with a stated reference load, a clean oracle for the
wind component.

---

## 3. Places to look next (not yet retrieved)

| Source | What it would give | Caution |
|---|---|---|
| **Precision Rifle Blog** (Jacob Hershey) | Long-range dope data, transonic transition analyses, BC-vs-velocity curves | Blog: class as compilation, not standard |
| **Bryan Litz, *Applied Ballistics*** | Velocity-dependent G7 BC curves (0.211-0.226 for the 168gr OTM) | Paywalled; data is quoted in secondary sources but must be cited to the book |
| **DEVA** (German test house) | Lab pressure/velocity data | Cited by competitors; access not open |
| **Applied Ballistics LLC** | Doppler-radar derived drag functions | Commercial |
| **SAAMI Z299 PDFs (already archived)** | Proof-load velocities per cartridge | **Best primary available.** Ours is velocity-based; extracting these closes the barrel-scaling gap |
| **Mil/TRAJ-style datasets** | Trajectory validation corpora | Rarely published openly |

**The archived SAAMI PDFs are the most under-used asset we have.** We hold
Z299.2/3/4 locally and have not extracted the reference velocities. Those are
*measured proof-load velocities with stated test barrels* — the highest-quality
oracle data available to us, already on disk.

---

## 4. What makes data an oracle

Three properties, and the Tireur manual happens to have all three:

1. **Stated conditions.** Barrel length, temperature, pressure, altitude, twist.
   Data without conditions cannot be checked, only admired.
2. **Stated uncertainty.** ES and SD, or a stated accuracy. A number with no
   error bar cannot fail a comparison.
3. **An independent derivation.** Not derived from our own code or assumptions.

Most reloading content fails all three. Content that passes them is rare, and is
why the drag table defect was findable at all: an independent implementation
carrying the published McCoy numbers gave us something to compare against.

**Corollary: we should require these three properties of our own reference
dataset.** Every row should carry test conditions and an uncertainty. A row
without them cannot serve as an oracle even if it is correct.

---

## 5. Action list

**Completed 30 Sep 2026:**

1. ✅ **Replaced the G1 and G7 drag tables from McCoy** (section 1). This
   unblocked G7, and immediately exposed two further solver defects — see
   `OPEN-SOURCE-LANDSCAPE.md` section 1.1b.
2. ✅ **Built `data/reference/`** with three typed files rather than one flat
   CSV, each designed around the three properties in section 4:
   - `drag_tables.csv` — 730 rows, 9 models, Mach 0-5, `cross-source-3-way`
   - `measured_data.csv` — 7 rows, including a 20-round chronograph string
   - `bullet_reference.csv` — 8 competition bullets with G1, G7, SD and twist

**Still open:**

3. ⬜ **Extract reference velocities from the archived SAAMI Z299 PDFs.** Already
   on disk, highest-quality primary data available, and still unread.
4. ⬜ **Retrieve CSEC caliber sheets** for per-caliber wind-drift constants.
5. ⬜ **Stand up the CI cross-check** against js-ballistics *and* the published
   tables, so a future table regression fails the build rather than waiting to
   be noticed in the field. This is the single highest-value remaining item:
   the three defects found on 30 Sep would all have been caught by it.
6. ✅ **Cited McCoy** in `dragTables.ts` and `data/reference/`, with the
   three-way verification recorded in the file header.

## 6. Standing caveat

Two independent implementations reproducing McCoy's table is strong evidence,
not proof — though the manual's own argument that CD(Ma) is a geometric property,
identical from any faithful tabulation, is good reason for confidence. Where our
table disagrees with a named publication, the publication wins unless we can show
the publication is wrong.