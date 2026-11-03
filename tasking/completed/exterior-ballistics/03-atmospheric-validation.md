# T6-03 — Is `C_d` independent of air density? Evidence, and what our model assumes

**Task:** exterior-ballistics (brief id T6). **Research only.** Nothing under
`packages/ballistics-core/` was modified; the source files named below were read,
not written.

---

## 1. The question

Nearly every small-arms drag table indexes `C_d` on Mach number alone. The solver does
the same. If that is wrong, then every altitude-corrected trajectory we produce is wrong,
and the error grows with density departure from the conditions at which the table was
built. So: is the assumption defensible, and where does it stop being defensible?

---

## 2. What our model actually assumes (read from the source, not inferred)

From `packages/ballistics-core/src/drag/solver.ts` and
`packages/ballistics-core/src/atmosphere.ts`, as they stand today:

**The drag acceleration.** The solver header states the working equation as

```
a_drag = rho * v_rel^2 * Cd(M) / (2 * i * BC)
```

with `Cd(M)` read from the G1/G7 table at the local Mach number and the form factor `i`
absorbing the difference between the real projectile and the reference projodal.
`rho` enters **linearly and once**, from `airDensitySlugPerFt3(densityRatio)`, where
`STANDARD_SEA_LEVEL_DENSITY_SLUG_PER_FT3 = 0.0023769 slug/ft^3`.

**Therefore the assumption, stated plainly:** our model treats `C_d` as a function of
Mach number and of projectile geometry alone. It has no Reynolds-number term, no
viscosity term, and therefore no density dependence beyond the explicit linear factor in
front of `C_d`. The task brief's statement that "Reynolds-number dependence of `C_d` is
not modelled explicitly" is an understatement of the position: it is not modelled
*implicitly* either. Density enters exactly once.

**Three further things our model does do, which are easy to overlook.**

1. **Density enters the Mach number indirectly, through temperature.** `speedOfSoundFps`
   is `k * sqrt(T_rankine)`. Lower air is colder, so `c` falls, so a given true velocity
   is a *higher* Mach number, so `Cd` is looked up further along the table. This is a
   real effect and it is modelled. It is a *temperature* effect being used to stand in
   for a *density* effect, which is why the two are not equivalent.
2. **Humidity lowers density and is modelled.** `humidityDensityCorrection` returns
   `1 - 0.378 * (e / p)`, and `speedOfSoundHumidFps` raises `c` with humidity. Both
   effects are correct in sign.
3. **Muzzle velocity is density-corrected as `v * sigma^(1/3)`.** The function's own doc
   comment calls this "FIRST-ORDER ONLY" and defers to the trajectory correction, which
   is applied in the integrator rather than to the input velocity.

---

## 3. Evidence FOR the assumption

### 3.1 The direct test: Courtney, Courtney & Courtney (2015), arXiv:1510.07336

This is the **only direct experimental test at two air densities found in this survey**,
and it is also the only dataset in the whole of `01-trajectory-datasets.md` that passes
all three parts of the oracle test.

Design, as published: a 2.59 g Nosler Ballistic Tip (part 39510) fired from a Remington
700 ADL with a 1 in 12 in twist, over a 91.44 m (300 ft) chronograph separation, at
elevations of 0 m and 1981 m.

| Site | Temperature | Humidity | Pressure | Air density | Uncertainty in density |
|---|---|---|---|---|---|
| Low density | 26.7 degC | 22.6 % | 602.2 mm Hg | 0.9293 kg/m3 | 0.0016 kg/m3 |
| High density | 29.4 degC | 40.0 % | 755.7 mm Hg | 1.1526 kg/m3 | 0.0003 kg/m3 |

Result, in the authors' words: Cd fell from about **0.54 at M1.2** to about **0.33 at
M2.9**, and *"results of tests performed at different air densities were not
significantly different, smaller than the uncertainties of 1%-2%"*. Ten shots per powder
charge, twenty at the lowest; mean-value uncertainties on Cd under 2 %.

**This is a clean support for the assumption over M1.2 to M2.9, at a 24 % density
change, at 1-2 % resolution.**

### 3.2 How the field actually behaves: corroborating practice, not proof

Every serious implementation in this space publishes a `C_d`-versus-Mach curve and a
single BC per projectile, with no Reynolds term anywhere:

- **Berger** test fires each bullet by Doppler radar and reports *one* number, averaged
  over 3000-1500 fps. No density axis.
- **Hornady** bands BC by Mach (2.25, 2.0, 1.75) corrected to ICAO Standard Atmosphere.
  No density axis.
- **Tireur's manual**, quoted by Wikipedia section 2.8.2: the `C_d(Ma)` tables *"are
  aerodynamic data: CD is dimensionless and depends only on the projectile geometry and
  the Mach number, not on the atmosphere."*

That three parties, one of them commercially adversarial to the others, all build on the
assumption is evidence that it is a reasonable one. It is **not** evidence that it is
correct, and `data/reference/README.md` is right to say so: two compilations agreeing is
`derived`, not `published`.

---

## 4. Evidence AGAINST, and the limits of 3.1

### 4.1 The theory does not license the assumption

The Reynolds number is `Re = rho * V * L / mu`. At fixed Mach and fixed temperature,
lowering `rho` lowers `Re` by the same proportion. Classical aerodynamics says `C_d` is
a function of both `Re` and `M`. Supersonic flight theory adds base drag, which is also a
`Re` effect. So the assumption is a **simplification theory does not grant**, adopted
because it works in the range that has been measured.

### 4.2 The size of the expected error, from the authors' own scaling

Courtney et al. give the quantitative case against themselves, and it is worth quoting
because it is the only error budget available anywhere in this survey:

> Skin friction drag only accounts for 8% to 16% of the total drag coefficient.
> Various formulas estimate skin friction as depending on Reynolds number to the negative
> 1/3 to negative 1/5 power. This would imply that a 25% change in Reynolds number (as
> estimated in this experiment) would only yield a 5% to 8% change in skin friction. If
> skin friction accounts for 10% or less of the total drag, then the effect of changing
> Reynolds number would be expected to be less than 1% of the measured drag coefficient.

So the **skin-friction channel** contributes under about 1 % to `C_d` across the tested
density span. That is the same order as the experiment's own 1-2 % resolution, which is
precisely why the experiment cannot see it.

### 4.3 Base drag is the real objection, and it is unresolved

The same paper is careful here, and the caution is the important part:

> In contrast, base drag is often a much more significant component to total drag than
> skin friction. Strong dependencies of base drag on Reynolds number would have been
> apparent in the experimental data, especially in the data below Mach 1.5.

and, on the historical record:

> McCoy's (1981) analysis of Ballistics Research Laboratory data suggested that only the
> skin friction depended on Reynolds number, as he found no correlation between base drag
> and Reynolds number.

That last sentence is **not** something this survey verified. ADA098110 (McCoy, "McDrag",
1981) was not retrieved. It is cited second-hand. Our own `drag_tables.csv` is attributed
to McCoy 2012, a different edition, and McCoy's Reynolds treatment is described by
Courtney as estimating `Re` as *"a constant times the Mach number times the projectile
total length"* - a function of Mach and length that **deliberately excludes density and
viscosity**. If our own drag table descends from a treatment that excludes the very term
in question, then D01 is partly validating McCoy against McCoy. That is worth saying out
loud.

### 4.4 The two gaps that matter most

**Gap A: the density range is narrow, and narrow in the wrong direction.** D01's two
sites give density ratios of

```
sigma_low  = 0.9293 / 1.2250 = 0.759
sigma_high = 1.1526 / 1.2250 = 0.941
```

against the ISA sea-level value 1.2250 kg/m^3, which is what our own
`STANDARD_SEA_LEVEL_DENSITY_SLUG_PER_FT3 = 0.0023769 slug/ft^3` represents. The only
oracle-grade test of this assumption therefore covers **sigma 0.76 to 0.94**. The
atmosphere model is asked to handle everything down to roughly sigma 0.74 at 10,000 ft.
**The region below the tested floor is unverified**, and the authors say so: the density
change was *"relatively a small change ... compared to what is theoretically possible"*.

**Gap B: the transonic region is untested by anything.** D01 starts at M1.2. The
transonic drag rise is where the aerodynamic literature consistently finds the strongest
`Re` sensitivity, and it is also the region where a long-range shooter's solution is most
sensitive. We have **no measurement at all** at M0.9 to M1.2 for any bullet we model, and
that region contains the single largest term in our whole drag curve (`G7` peaks at
`C_d = 0.4043` at M1.05, per `data/reference/drag_tables.csv`).

### 4.5 What this survey did NOT find

- No independent measurement of `C_d` versus air density at any Mach below 1.2.
- No small-arms wind-tunnel dataset with stated `Re` conditions. NASA NTRS and DTIC
  holdings were identified but could not be opened (403 Forbidden; DTIC maintenance).
- No measurement separating base drag from skin friction for a spin-stabilised small-arms
  projectile as a function of density.
- Nothing at all on density dependence for *yawing* projectiles, which is a separate
  mechanism (yaw-induced drag) and which we do not model at all.

---

## 5. Verdict

**The assumption is defensible, and defensible with a stated envelope.**

| Flight regime | Verdict | Basis |
|---|---|---|
| Supersonic, M1.2 to M2.9, density ratio 0.76 to 0.94 | **Supported to within 1-2 %** | D01, direct measurement at two densities |
| Supersonic, outside that density range (high altitude, below about sigma 0.76) | **Extrapolation; plausibly under 1-2 %, but unverified** | linear-in-rho physics plus the skin-friction bound of section 4.2 |
| **Transonic, M0.9 to M1.2** | **Unverified. No measurement found.** | nothing in this survey, and this is where the drag curve is steepest |
| Subsonic | **Unverified for density specifically** | D02 and D03 report subsonish points but not a two-density comparison |
| Yawing projectiles | **Out of scope** | our solver is a point mass with no yaw, as its own header discloses |

So: **we are not wrong to assume `C_d` depends on Mach alone, but we are relying on a
measurement that covers roughly one octave of density and does not touch the region where
our answer is most sensitive.** The honest label for this assumption is
*tested-and-holding-in-part*, not *verified*.

If a reviewer asks what would change this verdict, the answers in priority order are:

1. **A two-density measurement that brackets the transonic region.** That is the single
   highest-value measurement in exterior ballistics for a long-range solver, and nothing
   in the public domain currently offers it.
2. **ADA439796**, *Analytical Prediction of Trajectories for High-Velocity Direct-Fire
   Munitions* - public domain, described by its DTIC landing page as *"the drag
   coefficient data used to develop firing tables for U.S. Army munitions"*. It **could
   not be retrieved in this session** (DTIC returned HTTP 403, then a maintenance page).
   Highest-priority retry.
3. **ADA098110** (McCoy, "McDrag", 1981), to read the Reynolds treatment in the original
   rather than through Courtney's summary, per section 4.3.

---

## 6. The trap this file exists to prevent

A G1 figure and a G7 figure are **not** interchangeable, and neither is a `C_d` measured
at one density interchangeable with a `C_d` measured at another. `02-bc-reference.csv` is
built so that this cannot happen by accident: every row names the model in a `bc_model`
column, the measured rows carry a **separate** SEM for G1 and for G7, and the self-check
in `tmp/t6-oracle-check.mjs` fails if a figure whose text mentions G7 ever appears in a
`bc_g1` column, or vice versa.

The clearest evidence in the survey, both from Courtney, Morris & Courtney (2016),
arXiv:1608.06500, Table A1:

- The same 208 gr Hornady ELD falls from **G1 0.697 to G1 0.550** (a 21 % drop) between
  2888 and 1353 fps, while its **G7 falls only from 0.348 to 0.337** (a 3 % drop).
- The same 125 gr Nosler Ballistic Tip **rises** from G1 0.306 to G1 0.319 (4.2 %) across
  a 2245-to-3010 fps sweep, so the relationship is not even monotonic in velocity.
- One row, the 125 gr Hornady Super Shock Tip at 2893 fps, has a **measured G7 (0.314)
  larger than its measured G1 (0.309)**. That is transcribed exactly as published and is
  not corrected, because correcting a published figure is how a reference table quietly
  stops being a reference.

A BC is not a number. It is a number *at a Mach, in a model, at a density, for a barrel.*

---

## 7. Verification status of this file

Written across two sessions of the same task. Two of the claims in this file are strong
enough to lean on; the quotations are not yet strong enough to quote onward.

**Independently re-verified in the second pass.**

- The section 3.1 abstract-level facts: the arXiv abstract for 1510.07336 independently
  confirms the 2.59 g projectile, the 91.44 m separation, the M1.2-M2.9 range, the two
  densities at "0.93 kg/m3 and 1.15 kg/m3", and the "within the experimental error of
  1%-2%" conclusion.
- The density-ratio arithmetic in section 4.4: `sigma_low = 0.9293 / 1.2250 = 0.7586` and
  `sigma_high = 1.1526 / 1.2250 = 0.9409`, against the ISA sea-level value.
- That the repo's `STANDARD_SEA_LEVEL_DENSITY_SLUG_PER_FT3 = 0.0023769` really is ISA
  sea level: `1.2250 kg/m3 x 0.00194032033 = 0.0023769 slug/ft3`, exact.
- The section 6 percentages, recomputed from `02-bc-reference.csv`: the 208 gr ELD G1 falls
  **21.1 %** and its G7 **3.2 %** between 2888 and 1353 fps; the 125 gr NBT G1 **rises
  4.2 %**; the 125 gr SST row really does carry a measured G7 (0.314) above its G1 (0.309),
  transcribed uncorrected.

**Cited but not re-verified — treat the quotation marks with care.**

The three block quotations in sections 4.2 and 4.3, and the section 3.1 site-condition
table, come from the first pass's reading of the PDF body. The second pass could not
re-extract them: the PDF has no usable ToUnicode map, so no automated route to the body
text exists in this repo today. They read as faithful and are probably correct. But
"probably correct transcription" is exactly the category that `data/reference/README.md`
refuses to accept, and it is why the verdict in section 5 is phrased as
*tested-and-holding-in-part* rather than *verified*.

**The honest strength of the section 5 verdict.** The *direction* of the answer is solid:
the assumption is defensible, the theory does not grant it, and the tested region is
sigma 0.76 to 0.94, supersonic, one projectile, no transonic. That much rests on verified
material. The *quantities* — the skin-friction 8-16 % bound, the two site-condition rows —
rest on a single unrepeated reading of one PDF. If a reviewer needs the section 4.2 bound
to hold, they must open the PDF.