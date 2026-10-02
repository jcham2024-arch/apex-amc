# Solver gap analysis: agree, disagree, silent

Task T2, deliverable 3.

Compares the papers in [`01-methods-found.md`](01-methods-found.md) against
[`../../packages/ballistics-core/src/drag/solver.ts`](../../packages/ballistics-core/src/drag/solver.ts)
and
[`../../packages/ballistics-core/src/atmosphere.ts`](../../packages/ballistics-core/src/atmosphere.ts).

Three categories: **AGREE** (both model it the same way), **DISAGREE** (both model
it, differently), **SILENT** (the papers model it, we do not at all).

**Nothing in this file was changed. It is a gap list, not a patch.**

---

## 1. The three known gaps — confirmed

### 1.1 No yaw or spin-drift model — **SILENT, confirmed**

`solver.ts` states it outright in its own "WHAT THIS MODEL DOES NOT DO" block:

> "Point mass. No yaw, so it cannot predict the yaw-induced drag that makes
> short-throat high-BC bullets "flip" below about Mach 1.2, or the boat-tailed
> versus wadcutter difference in flight."

A repository-wide search for `yaw` returns **no occurrence anywhere in
`packages/`** other than that comment. There is no yaw model to find, and no partial
one either.

**Now bounded by measurement.** arXiv:1309.5039 quantifies the error this
introduces. Lowering gyroscopic stability from ~1.3 toward 1.0 drops measured G1 BC
hard — for the 55gr Sierra BlitzKing, from **0.271 down to 0.174**, a fall of about
36%. The same paper notes onset of BC variation at or below **Sg ≈ 1.25**.

The practical reading: for well-stabilised match bullets at Sg ≥ 1.30 the yaw error
is small enough to ignore, and for marginal-stability loads it is not. Our solver
gives a confident-looking number in both cases with no warning, which is the actual
defect. `apps/ballistics/screens/TransonicStabilityScreen.jsx` computes Sg for
display, so the information exists in the app — it just never reaches the solver.

### 1.2 Reynolds-number dependence of `C_d` — **SILENT, confirmed, and now bounded**

A repository-wide search for `Reynolds` returns **zero hits in `packages/`** — not
even a comment. The word appears only in task briefs.

Our tables are indexed by Mach number alone. `dragTables.ts` header:

> "The CD(Ma) tables (G1, G7, ...) are aerodynamic data: CD is dimensionless and
> depends only on the projectile geometry and the Mach number, not on the atmosphere."

**arXiv:1510.07336 bounds this omission rather than refuting it**, with arithmetic:
skin friction is 8–16% of total drag; Re exponents run −1/3 to −1/5; the experiment's
25% Re change therefore implies 5–8% change in skin friction; if skin friction is
under 10% of total drag, the Re effect on measured `C_d` is **expected under 1%**.

So the omission is defensible to roughly 1% — below our 0.40% velocity agreement
and our 1–2% measurement-grade oracle. **This gap is real, bounded, and low
priority.** It should be documented with the bound rather than treated as an
open risk.

### 1.3 `measured_data.csv` is thinner than its name implies — **confirmed, worse than stated**

Read directly: 7 rows, of which **two are explicitly labelled "NOT an oracle row"**
(load-data envelopes), **three carry "SD not stated; treat as ±15 fps"** — a
tolerance we imposed, not one Tireur published — and **one** is a genuine oracle
row (6mm BR, 2920.9 fps, ES 14 fps, SD 3.9 fps, 20-round string, full conditions).

**One measurement-grade oracle row exists, not seven.** The brief said two rows are
labelled NOT oracle; that is right, but the three ±15 fps rows are not oracle rows
either in substance, only in labelling.

---

## 2. Where we AGREE

### 2.1 Drag force is linear in air density — **AGREE, and this is now evidenced**

Our formulation, `solver.ts`:

```
a_drag = rho * v_rel^2 * Cd(M) / (2 * i * BC)
```

Density enters as a linear prefactor. arXiv:1510.07336 tested exactly this across a
24% density change (0.9293 vs 1.1526 kg/m³) and found **no significant difference**
in `C_d`, supporting the hypothesis within 1–2%.

This is the strongest agreement in the whole analysis, and it is worth being precise
about why: **the two densities in that experiment are our altitude regime.** A
Denver shooter sits near sigma ≈ 0.80; Colorado Springs at 1981 m is about the
same. The measurement and our use case overlap.

### 2.2 Speed of sound as the Mach reference — **AGREE**

The experiment computed its own speeds of sound from measured conditions (347.1 and
348.7 m/s) and indexed `C_d` by Mach, exactly as `atmosphere.ts` does via
`speedOfSoundHumidFps`. Both approaches are temperature-and-humidity aware.

### 2.3 The dropped ½ factor — **AGREE, and the same trap**

Our failure mode 2 is dropping the π/4, inflating drag by 4/π ≈ 1.2732. The papers'
equation 2 carries the same **½** in `F_d = ½ · m(v_f² − v_i²)/d`. Two independent
derivations put the factor in the same place. Good corroboration of the constant.

---

## 3. Where we DISAGREE

### 3.1 Density handling: the solver can ignore humidity in a way the paper cannot

arXiv:1510.07336 measured humidity at both sites (22.6% and 40.0%) and propagated
its uncertainty into the density. Our `densityRatio(altitudeFt, tempF)` is:

```
const pressureRatio = Math.pow(
    1 - (ISA_LAPSE_RATE_K_PER_FT.value * altitudeFt) / STANDARD_SEA_LEVEL_TEMP_K.value,
    ISA_BAROMETRIC_PRESSURE_EXPONENT.value,
);
return pressureRatio * (STANDARD_SEA_LEVEL_TEMP_K.value / tempK);
```

**No humidity term.** It is a pure ISA altitude-and-temperature relation. A separate
`humidityDensityCorrection()` exists in the same file, and
`densityRatioFromPressure()` is documented as preferable when a real station reading
exists. So the capability is present but **optional**, and the elevation-based path
can be taken without it.

Is this a disagreement with the papers? Not exactly — neither paper models humidity
either, they *measure* it. The honest framing: **our humidity treatment is
caller-dependent rather than mandatory**, so two shooters at the same altitude and
temperature can get different answers depending on which arguments they passed. The
paper's method has no such branch because it measures rather than models.

### 3.2 Velocity loss over the measurement interval — **DISAGREE on practice**

arXiv:1503.05504 is emphatic that the projectile should lose **5–20% of velocity**
over the chronograph separation, preferring ~10%, and that below 5% the resulting BC
is "overly sensitive to velocity errors."

This matters for anyone who wants to use these measurements against our solver: a
near/far pair taken over too short a separation yields a BC that looks precise and
is not. Combined with the 0.5% → 3–6% BC amplification, **an oracle row built from
an ill-conditioned chronograph setup can fail for reasons that have nothing to do
with our solver.** Any future comparison must record the separation and the velocity
loss.

---

## 4. Where we are SILENT

### 4.1 Above Mach 4 — **SILENT, and self-disclosed**

`dragTables.ts`:

> "Above Mach 4 the curve is held flat; the reference data extends to Mach 5 and the
> tables were truncated to 4 for compactness. Neither regime is reached by a rifle
> load in normal use."

The interpolation returns `last[1]` past the table end. Honestly documented, and the
claim that rifle loads do not reach it is reasonable. Worth noting our own gate
already flags the tail mismatch: `check-oracle.mjs` reports missing CSV counterparts
because the tables stop at Mach 4 while the CSV runs to 5, and says so.

### 4.2 Below Mach 0 — **SILENT**

> "Below Mach 0 the curve is extrapolated linearly from the first segment, which is
> the conventional treatment."

Reached only by very slow projectiles.

### 4.3 Gyroscopic stability as an input to the solver — **SILENT, and this is the actionable one**

`SolveRequest` takes bullet weight, diameter, G1 BC and optional G7 BC. **It takes
no twist rate and no stability factor.** So a bullet fired at marginal stability and
the same bullet fired well-stabilised produce **identical solver output**, when
measurement says their BC differs by up to ~36%.

This is the single clearest gap between what the literature measures and what our
solver accepts as input. `bullet_reference.csv` already records a `twist` column for
eight competition bullets, so the data partly exists upstream of the solver — it is
simply not plumbed through, and not used to emit a caution.

**I am not proposing a fix.** A yaw model is a research project, not a change to
make here, and `packages/ballistics-core/` is out of my write-set. The finding is
recorded for a later, separately-gated task.

### 4.4 Barrel-length dependence — **SILENT, but corroborated as second-order**

arXiv:1503.05504 notes ballistic coefficients "can depend on the bore of the rifle
from which a bullet is shot (Bohnenkamp et al., 2011)". Our solver takes muzzle
velocity as an input and does not model bore. That is defensible: bore effects enter
through muzzle velocity, which we require the shooter to measure.

---

## 5. Summary of gaps, by consequence

| # | Gap | Status | Consequence | Priority |
|---|---|---|---|---|
| 1 | No yaw / spin-drift | SILENT | Up to ~36% BC error at marginal stability; no warning emitted | **Highest** |
| 2 | Twist rate not a solver input | SILENT | Solver cannot distinguish a stable from an unstable load | **Highest** — same root cause as 1 |
| 3 | `measured_data.csv` has 1 oracle row | Confirmed | Weakest verification surface in the project | High |
| 4 | Humidity optional, not mandatory | DISAGREE | Caller-dependent results at same altitude/temp | Medium |
| 5 | Reynolds dependence of `C_d` | SILENT | **Bounded under 1%** by arXiv:1510.07336 | **Low** — document the bound |
| 6 | Mach >4 held flat | SILENT, disclosed | Not reached by rifle loads | Low |
| 7 | Bore dependence | SILENT | Enters via measured muzzle velocity | Low |

**Gaps 1 and 2 are one defect.** They are the same finding seen twice: the solver has
no representation of bullet stability, so it cannot be wrong about it — it simply
cannot be *checked* about it. Fixing one without the other achieves nothing.

---

## 6. The verdict the brief asked for

**Is "3 methods that reach the same conclusion, backed by hard science" defensible?**

**No — not today. Two are defensible, and saying three would be overclaiming.**

Naming the sharing precisely, as the brief required:

- **arXiv:1510.07336, arXiv:1503.05504 and arXiv:1309.5039 are not independent of
  each other.** All three are BTG Research; the first two share all three authors;
  the third shares two of them; all use the same work-energy inverse, the same class
  of LED-skyscreen optical chronograph, and the same two shooting ranges. Three
  papers, one method, one laboratory. If the method has a blind spot, all three
  have it.
- **arXiv:1608.06500 adds instrument independence, not independence of judgement.**
  Same group again. Doppler radar is a genuinely different sensor, but the group
  choosing the experiment, the projectile and the analysis is the same one.
- **The McCoy drag tables ARE independent** — different institution, different
  derivation lineage, tabulated rather than measured.
- **The published tables and the BTG free-flight measurements ARE independent of
  each other**, which is the pair that matters.

So the honest formulation is: **one published aerodynamic tabulation and one
independent primary measurement, which agree.** That is a real, defensible two-way
confirmation, and it is a considerably stronger claim than we could make if we
counted the BTG papers three times.

**What would make three real?** A drag or BC measurement from a group with no
connection to BTG Research, carrying stated conditions and a stated error bar. The
three Doppler-paper references to USAFA funding are worth noting as a possible
starting point, though funding is not a group.

**What I believe is wrong outside my write-set:** `docs/ORACLE-SOURCES.md` §5 lists
"stand up the CI cross-check" as the highest-value remaining item, which I agree
with. But the *research* implication is stronger than that framing suggests — we
would be wiring a CI oracle whose primary measurement source is a **single research
group's unpublished preprint figures**, not a standard. That should be recorded as a
dependency risk before the gate is built on it.