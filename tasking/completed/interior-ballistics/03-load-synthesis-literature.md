# T5 / 03 — Load-synthesis literature: the physics, and what it cannot do

**Task:** interior-ballistics. Research only. **No charge weight appears in this
document, by design** — see §7.

---

## 1. The governing equations

### 1.1 Viebig's law (1879)

The linear law of burning, as first stated, is a velocity proportional to pressure:

```
r = k · p
```

with `r` the linear burning rate, `p` the pressure, `k` a material constant. This is
the degenerate case of the general form with `n = 1`.

### 1.2 The pressure-dependent form (standard in propellant engineering)

```
r = a · p^n
```

- `a` — burn-rate coefficient at the reference pressure (mm·s⁻¹·bar⁻ⁿ)
- `n` — pressure exponent, dimensionless
- `p` — pressure, bar

**The pressure exponent `n` is the safety-critical parameter.** For a physical
steady-burning process thermodynamics bounds it near unity; observed values in the
literature for gun propellants run lower. A large `n` means the burn accelerates
sharply with pressure — the pressure-runaway mechanism. Neither `a` nor `n` is
published for any powder we sell (see `01-burning-rate-sources.md`).

### 1.3 Temperature correction

Real burn rate also varies with initial temperature. Engineering practice uses:

```
r(p, T) = a · p^n · f(T)
```

where `f(T)` is expressed through the **temperature sensitivity** `φ_σ` relative to
a reference temperature `T₁` (typically 20 °C / 68 °F):

```
f(T) = exp(φ_σ · (T − T₁))
```

A model, not a measurement. **No powder we hold publishes `φ_σ`**, so this term is
not merely unknown, it is unparametrisable.

### 1.4 The Hill force law

Hill's form converts a burn law into a **pressure-time curve** in a closed vessel:

```
P(t) = P_i · F(t)
```

with `F(t)` a dimensionless normalised force built from the burn law and the initial
loading density:

```
F(t) = t · r₀ · Δ / (l · m)  ·  [ 1 − λ·t·r₀ / (5·Δ) ]^5
```

with `t` time, `r₀` the reference burn rate, `l` the charge length, `m` the charge
mass, `Δ` the propellant density, and `λ` the form function. The bracketed term is
the characteristic **form function**, encoding how the burn finishes. This is why
"percentage of powder burned" is a real, separately-reported quantity: incomplete
burn is a known load-development concern, not a rounding detail.

### 1.5 The internal-ballistics energy balance

Pressure depends on: charge mass `ω`, the powder's characteristic velocity `v_c`
(or force constant), the burning rate law, the **case volume**, and the projectile
mass. Velocity comes from integrating projectile momentum against pressure over the
barrel length:

```
m_p · dv/dt = A · P(t)
```

**Note what is absent: no term lets you go backwards from a projectile to a charge.**
The system is causal — you *provide* powder properties to *predict* a load. It is
not invertible, because `a`, `n`, `Q` and the force curve are independent unknowns
that velocity and pressure together do not uniquely determine. This is the crux of
§4.

---

## 2. Inputs required, per quantity

| Quantity | Scope | Published for our powders? |
|---|---|---|
| Burn-rate coefficient `a` at a stated reference pressure | per powder | **No** |
| Pressure exponent `n` | per powder | **No** |
| Force curve / form function λ | per powder | **No** |
| Heat of explosion / characteristic velocity `v_c` | per powder | **No** |
| Propellant density `Δ` (loading density) | per powder | **No** (one historical bulk density) |
| Temperature sensitivity `φ_σ` | per powder | **No** |
| Projectile mass | per bullet | Yes (109 Berger bullets held) |
| Case volume | per cartridge | **No** — 0/229 populated |
| Breech pressure | per load | 231 pressure references held |

**Two compounding gaps.** `cartridge-dimensions` measures `capacity_gr_h2o` and
`case_length_max_in` at **0 / 229**. Those are the geometric inputs to interior
ballistics. So even with a complete powder database — which does not exist — the
cartridge-side inputs are absent. The two largest data gaps in the project compound
in exactly the region this task is about.

---

## 3. Ballistic coefficients, and the velocity–pressure relationship

Published loads are not computed from first principles. They are **measured**: a
manufacturer runs combinations of bullet, powder and charge, chronographs velocity,
measures pressure, and tabulates the results. Berger's own disclaimer confirms:

> "The loading data on our website and in our reloading manual has been developed
> using a combination of handloading software and live fire testing."

What accuracy do manufacturers claim? **They do not claim a figure.** They disclaim
consistency instead, in terms worth quoting into our own trust material:

> "it is impossible to provide perfectly consistent data between all manuals and
> websites that provide load data because of performance variations from one lot to
> another."

**This is the correct posture and the one our project must adopt: a published load is
a starting point requiring verification, not a guarantee.** No manufacturer states a
model accuracy because the dominant error is material and lot variation, not
modelling.

---

## 4. The central result: ill-posed as posed

The owner wants: *given a projectile not on any published chart, compute the charge.*

That requires `a`, `n`, `Q`/`v_c`, `λ`, `φ_σ` and case volume. **None are
published**, so they must be *fitted* from observations — the "infer a powder's
behaviour from many load observations" idea.

**Why that does not work:**

1. **Ill-conditioning.** In the model above, velocity and peak pressure are smooth
   functions of `a`, `n` and `ω` together. Across the small range of charges that
   are safe and useful, changing `ω` alone can reproduce almost any velocity. The
   parameters trade off strongly. Many `(a, n, ω)` triples fit the same
   observations — the system does not determine them separately.

2. **A degenerate family, not an estimate.** Because a near-degenerate family fits,
   the result is not "an estimate with an error bar." Extrapolating to an *unlisted*
   bullet means extrapolating along a direction the data cannot constrain. The
   uncertainty is unbounded in the direction that matters.

3. **Lot variation dominates and is unobservable.** The manufacturers state the
   same powder lot produces materially different velocity and pressure. Fitted
   constants therefore describe *one lot, on one day, in one rifle*. We cannot know
   which lot a user holds. This error is **irreducible from published data**, and
   larger than the modelling error we would be arguing about.

4. **The burn law is known to fail.** The literature (PMC7411880) finds propellants
   whose burning deviates from the geometric law. A model fitted on observations that
   do not span the extrapolation region has no guarantee of extrapolating.

5. **Even a perfect model would be certifying a maximum.** The output of an
   inference is a charge weight. For an unlisted projectile the safe charge is
   bounded by what the action, barrel and ammunition will survive — quantities our
   dataset does not hold (action dimensions: 0/229).

---

## 5. How many observations would be needed?

Quantitative, with the caveat that the requirement is set by ill-conditioning rather
than sample size:

- **Per powder, per cartridge:** a factorial design. With `q` powders and `k` charge
  levels each, on the order of `q × k` chronograph-and-gauge runs, and the **gauge is
  the binding constraint** — pressure measurement requires a piezoelectric gauge, a
  drilled barrel, and a controlled facility. Pressure is not measurable on a normal
  range.
- **Ill-conditioning is the real limit.** Increasing runs near a charge reduces
  parameter correlation only slowly. The literature requirement in this field is on
  the order of **dozens of points spanning a wide pressure range** to recover `a`
  and `n` for a *single* propellant in a *single* vessel.
- **The multiplier that matters:** that is one powder, one cartridge, one
  instrument, one day. Characterising one powder across a cartridge family, with
  temperature spans and lot replicates, is a laboratory programme — realistically
  hundreds of instrumented runs per powder. For 169 powders that is not a project.

**Every one of those observations is a pressure-instrumented firing, and the charge
weights come from a published table the experimenter is testing.** The method is
sound; the cost is the barrier.

---

## 6. The routes that do exist, ranked

1. **Interpolation to a near neighbour in the published table** — what Berger and
   Hornady actually do (`04-equivalence-rules.md`). No model. Inherits all table
   uncertainty. **This is what the product should do.**
2. **Hold the powder constant, interpolate the bullet** — scaling by sectional
   density. Standard industry practice; uncertainty of order the table's own.
3. **A calibrated interior-ballistics solver with measured powder constants** — the
   engineering route. Legitimate, and a real product. Requires licensing or
   measuring the constants. **Feasible.** See the verdict.
4. **Fitting `a`, `n` from published load data** — **not defensible**, per §4.

Route 3 is *not* what was asked. It requires the powder constants as input; it does
not derive them from nothing. The owner's premise conflates "a calculator that uses
powder data" with "an inference engine that creates powder data."

---

## 7. The prohibition, honoured

Per the manifest's `prohibitions` entry and the brief's §6, **this document contains
no charge weight for any cartridge/projectile/powder combination**, not as an
example, not as an approximation, not in any units.

It is satisfiable because the physics genuinely does not require one: the equations
and their inputs are stated, and no worked numeric example was needed to make any
argument above. The proof is the `grep` in `REPORT.md`.

A note for the record: the prohibition was **not** the binding constraint. The
binding constraint is §4 — the quantities simply do not exist in obtainable data.
Had the prohibition been absent, the deliverable would still have been an empty
dataset. That is the honest finding.

---

## 8. Sources

- Vihtavuori Reloading Guide ed. 13, pp. 1–9 — quoted in `01-burning-rate-sources.md`.
- Hodgdon Reference Data — chart titled "RELATIVE BURN RATES".
- Berger Bullets, Reloading Disclaimer — quoted in `01-burning-rate-sources.md`.
- Hornady Load Data page — paid-data model, and a live 6.5 PRC erratum.
- PMC7411880 / doi 10.3390/ma13143243 — abstract cited; geometric-law deviation.
  **Full text not retrieved; no numbers quoted from it.**
- Measured inputs: `data/generated/json/powders.json` (169 rows, physical columns
  absent) and `cartridge_specs.json` (0/229 dimensional).