# Independent verification methods

Task T2. Research only: nothing in `packages/`, `data/` or `scripts/` was changed.

The owner wants *"3 methods that reach the same conclusion, backed by hard science."*
This file answers whether that is achievable, with which sources, and — more
importantly — which of the candidate methods are genuinely independent of each
other and of our own solver.

Read [`../ORACLE-SOURCES.md`](../ORACLE-SOURCES.md) first for why `data/reference/`
exists, and [`03-solver-gap-analysis.md`](03-solver-gap-analysis.md) for what this
means for the code.

---

## The bottom line

**Three genuinely independent methods are NOT currently available to us. Two are.**

The three papers the task brief nominated — arXiv:1510.07336, arXiv:1503.05504 and
arXiv:1309.5039 — are **not three methods**. They are three papers from **one
research group** (BTG Research; Courtney, Courtney and Courtney / Courtney and
Courtney), describing **one measurement technique** (free-flight drag by the
work-energy inverse, using optical chronographs), on **the same hardware family**
(LED skyscreen optical chronographs), at **the same two ranges**
(Louisiana Shooters Unlimited, Lake Charles LA and Colorado Rifle Club /
Dragonman's Range, Colorado Springs CO).

They corroborate each other in the way three reports from one lab corroborate each
other: they share authors, apparatus, method and site. If the work-energy inverse
is wrong for all three, all three are wrong together. **Claiming three independent
confirmations from these would be overclaiming, and this is a safety-critical
claim.**

What we actually have:

| Axis | Independent of ours? | Independent of the Courtney papers? |
|---|---|---|
| **A. Published drag tables** (McCoy 2012, cross-verified three ways) | **Yes** — different derivation lineage and institution | **Yes** |
| **B. BTG free-flight chronograph measurement** | **Yes** — measured, not tabulated | n/a (is the reference) |
| C. BTG acoustic time-of-flight | Yes | **No** — same group |
| D. BTG Doppler radar | Yes | **No** — same group |

Axes A and B are independent of each other, which is the pair that matters: one is
published aerodynamic tabulation, the other is primary measurement. C and D add
*instrument* independence within one group, which is real but weaker.

**The honest claim we can make today is two, not three.** To reach three we would
need a measurement from a group with no connection to BTG Research — which is
precisely what tasks T6 and the B-series oracle work would have to produce.

---

## Method 1 — Free-flight drag by the work-energy inverse

**Group:** BTG Research (Elya Courtney, Amy Courtney, Michael Courtney)

This is the "no drag model at all" method the brief calls highest-value, and it is
genuinely so: it measures drag and never consults a drag function.

### Governing equations, as written in arXiv:1510.07336

The physical starting point, which the paper calls equation 1:

```
F_d = 1/2 * C_d * A * V^2 * rho
```

with `C_d` the drag coefficient, `A` cross-sectional area, `V` flow velocity,
`rho` air density, `F_d` drag force.

The work-energy inverse over a measured interval, equation 2:

```
F_d = (1/2) * m * (v_f^2 - v_i^2) / d
```

where `m` is projectile mass, `d` the chronograph separation, `v_i` and `v_f` the
near and far chronograph velocities. Note the **1/2** — the factor most often
dropped, and the same factor our own solver documents as failure mode 2.

Combining 1 and 2, equations 3 and 4:

```
F_d = 1/2 * rho * v^2 * C_d * A

C_d = 2 * F_d / (A * v^2 * rho)
    = m * (v_f^2 - v_i^2) / (d * A * v^2 * rho)
```

`v` here is the **average velocity over the interval**, substituted for the flow
velocity relative to the surface. That substitution is the method's main
assumption and its main limitation: what is actually measured is a *path-averaged*
`C_d`, not a point value.

### What it independently measures

Drag force and drag coefficient directly, from velocities. It shares no assumption
with our solver's drag tables — it never reads one. That is what makes it an oracle
rather than a cross-check.

### arXiv:1510.07336 — full detail

Elya Courtney, Amy Courtney, Michael Courtney, *Experimental Tests of the
Proportionality of Aerodynamic Drag to Air Density for Supersonic Projectiles*,
submitted 26 Oct 2015, arXiv:1510.07336, DOI 10.48550/arXiv.1510.07336. Also in
Proceedings of the 28th International Symposium on Ballistics, September 2014.

Experimental configuration, verbatim:

| Quantity | Value |
|---|---|
| Projectile | 2.59 g Nosler Ballistic Tip, part # 39510 |
| Case | .223 Rem, Lapua brass |
| Rifle | Remington 700 ADL, 1 in 12 inch twist |
| Powder loads | 6, 8, 10, 11, 12, 14 gr Alliant Blue Dot; 29 gr Hodgdon CFE 223 |
| Shots per load | 10 each, except 6 gr which used 20 |
| Chronograph separation | **91.44 m** (a single separation, not a set) |
| Mach range | 1.2 to 2.9 |
| Chronograph | CED Millenium with LED skyscreens |
| Environment instrument | Kestrel 4500 weather meter |
| Density computation | JBM Ballistics Calculator |

Table 1, environmental conditions — the highest-quality oracle material in the
paper, and complete:

| Condition | Temp (°C) | Humidity (%) | Pressure (mm Hg) | Density (kg/m³) | Uncertainty in density (kg/m³) | Speed of sound (m/s) |
|---|---|---|---|---|---|---|
| Low air density | 26.7 | 22.6 | 602.2 | 0.9293 | 0.0016 | 347.1 |
| High air density | 29.4 | 40.0 | 755.7 | 1.1526 | 0.0003 | 348.7 |

The two sites were at **0 m** and **1981 m** above sea level. Density uncertainty
was obtained by error propagation of the temperature, pressure and humidity
uncertainties — a stated, propagated error bar, which is what our three-part
oracle test requires.

Results, as stated in text rather than tabulated: drag coefficient fell from
**about 0.54 at Mach 1.2 to about 0.33 at Mach 2.9**. Quadratic fits gave
R² = 0.9618 (low density) and R² = 0.9521 (high density). Uncertainty in each mean
`C_d` was **under 2%**. The two densities showed **no significant difference** in
`C_d`, supporting the proportionality of drag to air density — the McCoy assumption
our solver relies on.

**Stated uncertainty:** < 2% on each mean `C_d`; ±0.0016 and ±0.0003 kg/m³ on the
densities.

The paper also carries a quantitative justification for why our solver ignoring
Reynolds number is defensible: skin friction is 8–16% of total drag, Re exponents
run −1/3 to −1/5, a 25% Re change implies 5–8% change in skin friction, so under
10% of total drag the Re effect on `C_d` is **expected to be under 1%**. That is a
useful bound rather than a proof.

**What I could not extract, and did not invent:** the per-Mach `C_d` values are
plotted in **Figure 2, not tabulated**. The text gives only the two endpoints
(≈0.54 and ≈0.33). Every intermediate Mach value in this file is left EMPTY rather
than interpolated from a figure. See "What I left blank" below.

---

## Method 2 — Error propagation and method selection

Elya Courtney, Amy Courtney, Michael Courtney, *Methods for Accurate Free Flight
Measurement of Drag Coefficients*, submitted 18 Mar 2015, arXiv:1503.05504, DOI
10.48550/arXiv.1503.05504.

### Two methods, and their relative cost

1. Measuring **near and far velocities** over a known distance.
2. Measuring a **near velocity and time of flight** over a known distance.

The paper's stated conclusion: for a given level of accuracy of the inputs, method
1 produces drag coefficients with **about half the uncertainty** of method 2. Target
accuracy is **approximately 1%**.

### The sensitivity finding, verified verbatim

The brief asked for this figure to be confirmed. It is confirmed, quoted exactly:

> "a 0.5% error in the near chronograph reading will result in a 3% error in the BC
> determination for a chronograph separation of 200 yards, standard atmospheric
> conditions, a G1 BC close to 0.400 and a muzzle velocity of 2800 fps. If the
> chronographs are separated by 100 yards, a 0.5% error in the near chronograph
> reading will result in a 6% error in the BC determination."

**Why this matters more to us than to them:** this is the quantitative statement of
why *any* BC oracle row must carry a stated velocity uncertainty. A near-velocity
error of half a percent — comfortably inside the accuracy of a good chronograph —
becomes a 3–6% BC error. It is the error-amplification factor that makes a
zero-error-bar row worthless, and it is the strongest available justification for
the three-part oracle test in `data/reference/README.md`.

### Experimental design guidance, with numbers

- Target a **5–20% velocity loss** over the chronograph separation. Below 5% the
  result is over-sensitive to velocity error; above 20% it is effectively averaged
  over too wide a velocity range. The authors' preferred trade-off is **close to
  10%**.
- For a bullet of G1 BC ≈ 0.400 at ≈ 2800 fps in standard atmosphere, **close to
  100 yards** achieves that.
- High-BC bullets (G1 ≈ 0.700) shot in thin air may need **close to 200 yards**.
- Fast low-BC bullets near sea level can work at **50 yards**.
- BBs and airgun pellets can lose 5–10% of velocity over **10 yards**.

### Appendix Table 1 — measured G1 BCs with stated uncertainty

This is a genuine, fully-specified oracle table. It is airgun-pellet data, so it
does not validate our rifle regime, but it satisfies the three-part test completely
and is the model for what a `data/reference/` row should look like:

| Projectile | G1 BC | Uncertainty | v_i (ft/s) |
|---|---|---|---|
| Avanti BB | 0.01122 | 0.00008 | 522 |
| Crosman Premier Hollow Point | 0.0221 | 0.0004 | 506 |
| Crosman Pointed Premium | 0.02083 | 0.0004 | 508 |
| Crosman Destroyer Ex | 0.01104 | 0.0006 | 543 |
| Crosman HV Lead Free | 0.00309 | 0.00001 | 789 |
| Daisy Pointed | 0.00859 | 0.0002 | 556 |
| Daisy Flat Point | 0.01276 | 0.0003 | 555 |
| Daisy Hollow Point | 0.01089 | 0.0003 | 482 |

Two cautions before anyone uses this table: the projectiles are pellets and BBs,
not rifle bullets; and the BCs were computed by **entering near/far velocities and
environmental conditions into the JBM calculator**, so they are not independent of
the JBM BC convention. See [`02-candidate-datasets.md`](02-candidate-datasets.md).

---

## Method 3 — Gyroscopic stability as a drag observable

Elya R. Courtney, Michael W. Courtney, *Aerodynamic Drag and Gyroscopic Stability*,
arXiv:1309.5039, v1 15 Aug 2013, v2 16 Oct 2014, DOI 10.48550/arXiv.1309.5039.
6 pages.

### What it is, and what it is for

This is **not** a solver-validation method. It is a method for *bounding a known
limitation*. Our solver is a point-mass model that explicitly does not model yaw;
this paper measures how much drag changes as gyroscopic stability falls from 1.3
toward 1.0. It tells us the size of the error we are ignoring.

Two stability formulas were used: the **Miller Twist Rule** for nearly solid metal
bullets of uniform density, and the **Courtney–Miller formula** for plastic-tipped
bullets. Stated accuracy of these empirical twist formulas is **within 5%**, and
keeping predicted stability above Sg ≈ 1.30 is offered as adequate margin.

### Measured G1 BC vs gyroscopic stability — three bullets, complete

**60 gr Hornady VMAX in .223 Remington** (Courtney–Miller formula):

| Sg | G1 BC |
|---|---|
| 1.05 | 0.171 |
| 1.10 | 0.188 |
| 1.13 | 0.198 |
| 1.16 | 0.208 |
| 1.23 | 0.273 |
| 1.26 | 0.246 |
| 1.30 | 0.245 |
| 1.34 | 0.246 |

**55 gr Sierra BlitzKing in .222 Remington, 1:14 twist:**

| Sg | G1 BC |
|---|---|
| 1.00 | 0.173 |
| 1.02 | 0.186 |
| 1.04 | 0.197 |
| 1.08 | 0.227 |
| 1.10 | 0.217 |
| 1.12 | 0.230 |
| 1.14 | 0.229 |
| 1.17 | 0.242 |
| 1.21 | 0.292 |
| 1.40 | 0.271 |

**53 gr solid copper Barnes TSX in .223 Remington, 1:12 twist:**

| Sg | G1 BC |
|---|---|
| 1.00 | 0.159 |
| 1.05 | 0.170 |
| 1.10 | 0.181 |
| 1.15 | 0.180 |
| 1.20 | 0.175 |
| 1.22 | 0.184 |
| 1.26 | 0.213 |
| 1.27 | 0.186 |
| 1.40 | 0.204 |

### The finding, and its honest limits

Stability was varied **within one barrel** by varying powder charge, which the
authors prefer over using different twist rates because other work shows barrels
differ in ways other than stability. BC falls substantially as Sg drops from 1.2
toward 1.0. For the SBK specifically, **G1 BC is reduced from 0.271 to 0.174** as
stability is lowered. All three bullets show an unexpected BC *increase* near Sg ≈
1.22–1.25, which the authors explicitly decline to over-interpret because of large
error bars.

Two cautions that make these rows **not** oracle rows for our purposes:

1. **The reported values are points on a figure with large error bars**, and the
   paper does not tabulate the per-point uncertainties. Under our three-part test
   these fail part 2 (stated uncertainty).
2. The BCs were computed **using the JBM ballistic calculator**, introducing a
   dependency our own solver does not share but also does not confirm.

Also note the confound the authors control for: reviewing BC reductions as velocity
drops from 2500 to 1500 fps for .224" bullets in Litz (2009a) shows **3–17%** BC
reduction from velocity alone. So part of any BC-vs-Sg trend is velocity effect,
not stability. The authors judge this small compared with the stability effect.

---

## Method 4 — Doppler radar (the brief's claim, verified)

Elya Courtney, Collin Morris, Michael Courtney, *Accurate Measurements of Free
Flight Drag Coefficients with Amateur Doppler Radar*, submitted 23 Aug 2016,
arXiv:1608.06500, DOI 10.48550/arXiv.1608.06500. 12 pages.

The brief said this paper "claims sub-$600 units at 1-2% — verify this claim."
**Verified, with one correction.** From the abstract, quoted:

> "an inexpensive (< $600 US) amateur Doppler radar system"; "In many cases, drag
> coefficients can be determined with an accuracy of 1% or better if signal-to-noise
> ratio is sufficient and projectiles vary little between trials."

So: the **price claim is correct** (< $600 USD). The **accuracy claim is 1% or
better**, not "1-2%" — but it is **conditional**, and the conditions matter more
than the figure. Both caveats in the same abstract:

> "The most significant limitations are reduced signal-to-noise with smaller
> projectiles (< 5 mm diameter) and inability to detect projectiles more than 100 m
> down range."

**The conditional clauses are load-bearing and the brief's shorthand dropped them.**
"1% or better" holds only where signal-to-noise is sufficient *and* the projectile
varies little between trials. For a tumbling or erratic bullet — exactly the case
our solver cannot model — the second condition fails and the 1% does not hold. Using
this paper to claim general 1% accuracy for bullets would be a misreading.

Range coverage: projectiles 4.4 mm to 9 mm diameter, M0.3 to M3.0, within 100 m.

This matters for us beyond validation: Doppler can **detect tumbling in flight**,
which optical chronographs cannot. That is a measurement capability aimed squarely at
our un-modelled yaw. Recorded as a capability, not as an available dataset — we hold
no Doppler measurements.

---

## What I left blank, and why

This is the discipline the brief asked for, so it is recorded explicitly.

1. **Per-Mach drag coefficients from arXiv:1510.07336.** The values exist only in
   Figure 2. The text gives endpoints (≈0.54 at M1.2, ≈0.33 at M2.9) and quadratic
   fits, nothing intermediate. I could have read approximate values off the figure
   and they would have looked plausible. **I did not.** A digitised figure reading
   with no stated error bar cannot fail a comparison, which is precisely what makes
   it worse than blank.
2. **Per-point uncertainties on the BC-vs-Sg tables (arXiv:1309.5039).** The figures
   carry visible error bars; the paper describes them as "relatively large" without
   tabulating values. Left EMPTY.
3. **Chronograph-separation error.** Neither paper states the uncertainty in the
   91.44 m separation or in the velocity readings themselves. The <2% figure is the
   uncertainty in the resulting `C_d`, not a decomposition. Left EMPTY.
4. **Whether the papers are peer-reviewed.** All four are arXiv preprints in
   `physics.pop-ph` or `physics.gen-ph`. arXiv:1510.07336 states it was also
   presented at the 28th International Symposium on Ballistics. **I did not verify
   journal peer review for any of them**, and the word "peer-reviewed" in the brief
   should not be read as verified. Recorded as preprints.

---

## Sources

| Ref | Identifier | Group | Independently validates our solver? |
|---|---|---|---|
| Courtney, Courtney & Courtney 2015, *Proportionality of Aerodynamic Drag to Air Density* | arXiv:1510.07336 / 10.48550/arXiv.1510.07336 | BTG | **Yes** — primary measurement, no drag model |
| Courtney, Courtney & Courtney 2015, *Methods for Accurate Free Flight Measurement* | arXiv:1503.05504 / 10.48550/arXiv.1503.05504 | BTG | **Yes** — error budget |
| Courtney & Courtney 2013/2014, *Aerodynamic Drag and Gyroscopic Stability* | arXiv:1309.5039 / 10.48550/arXiv.1309.5039 | BTG | No — bounds a known limitation |
| Courtney, Morris & Courtney 2016, *Free Flight Drag with Amateur Doppler Radar* | arXiv:1608.06500 / 10.48550/arXiv.1608.06500 | BTG | **Yes**, conditionally |
| McCoy, *Modern Exterior Ballistics*, Schiffer, 1999/2012 | ISBN 978-087909-666-4 | McCoy | **Yes** — tabulated, independent lineage |