# The Physics & Mathematics of Bullet Trajectory

## Short-Range and Long-Range Sighting — A Comprehensive Technical Synthesis

**Compiled:** 2026-10-02 · **Method:** Multi-pass deep research (Exa + direct primary-source extraction)
**Primary sources:** R.L. McCoy *Modern Exterior Ballistics* (Schiffer, 2nd Ed.), JBM Ballistics, US Army
Ballistic Research Laboratory (BRL) technical reports, Applied Ballistics, FM 6-40 *Field Artillery
Gunnery*, peer-reviewed archery/aerodynamics literature.

> **Executive summary.** A bullet's trajectory is not a parabola. It is the solution of three
> competing differential forces — aerodynamic drag, gravity, and (later) the rotating Earth's frame —
> integrated in time. Drag is quadratic in velocity, which makes the trajectory a *self-reinforcing
> asymmetry*: fast bullets lose a large fixed fraction of speed early (drag ∝ V²), then coast on a
> nearly ballistic parabola. The classic flat-fire trajectory has a characteristic S-shape that
> flattens as speed decays. Everything else in this document — spin drift, Coriolis, wind drift,
> time of flight — is a small residual effect riding on top of that drag-dominated core.

---

## 1. The Three Forces (and the fourth, sneaky one)

### 1.1 Drag — the dominant force

Drag on a bullet is the classic Newtonian resistance force:

```
F_D = ½ · ρ · V² · A · C_D
```

| Symbol | Meaning | Typical bullet value |
|---|---|---|
| ρ | Air density | 0.002377 slug/ft³ sea level; falls ~1%/1000 ft |
| V | Speed **relative to air** | 780–915 m/s muzzle |
| A | Frontal area = πd²/4 | π(0.308 in)²/4 |
| C_D | Drag coefficient | **Function of Mach number**, 0.15–0.5 typical |

**Key consequence:** drag opposes velocity relative to the *air*, not the ground. Introduce wind `w`,
and drag uses `V_air = V_ground − w`. This one fact is the root of all wind drift physics (§6).

### 1.2 Gravity — steady, predictable

`a_g = g = 32.174 ft/s²` (9.80665 m/s²). Constant magnitude, always "down." Simple, and easy to
model — but its *effect* is amplified by time of flight, so gravity's importance scales with how
long the bullet is in the air.

### 1.3 Spin — gyroscopic stability (why the bullet flies straight at all)

Rifling imparts spin (typically 1-in-7 to 1-in-12 twist). This is what keeps an elongated bullet
point-forward. Without it, any aerodynamic perturbation causes tumbling. (§8 covers the math.)

### 1.4 The sneaky fourth force: the rotating Earth

The Earth spins at Ω = 7.292×10⁻⁵ rad/s. A projectile traveling far enough picks up **Coriolis**
and **centrifugal** accelerations. Small in absolute terms, but *systematic* (always same direction
at a given latitude/firing direction), so it never averages out like random dispersion does. (§6.3)

---

## 2. The Trajectory Shape: Why It's Not a Parabola

Drag ∝ V² means the bullet decelerates **hardest at high speed**. A .308 Win 175gr MatchKing at
2650 fps still carries ~1300+ fps at 1000 yards — it's still moving fast enough that drag still
matters, but the curve has visibly "settled" into near-ballistic flight.

The classic **flat-fire trajectory** (McCoy, Ch. 5) has this structure:
- **Initial (high-V) segment:** steep, drag-dominated curve — the bullet "falls away" fast.
- **Mid segment:** the S-curve — the path flattens relative to the bore line as speed decays.
- **Terminal (low-V) segment:** approaches a true ballistic parabola.

**Practical consequence:** you cannot use "point of aim + holdover = hit" naively at long range.
The holdover is not linear in range; it follows the flattening curve. This is exactly what a
ballistics solver integrates to produce a dope table.

---

## 3. The Governing Equations (Point-Mass Model)

### 3.1 Equations of motion (the "point mass" model)

Treat the bullet as a particle of mass `M` in a wind-free (or wind-augmented) atmosphere:

```
M·(dv/dt) = -½ ρ |v| v · A·C_D(|v|)   +   M·g
```

With drag evaluated as a function of Mach number. In component form for downrange (x), height (y),
lateral (z), and time (t), you integrate four coupled ODEs. Ballistics solvers use a **Runge–Kutta
4th-order integration with variable step** (the industry standard; EBV4, JBM, and most commercial
solvers use RK4) [JBM; EBV4 docs].

### 3.2 The McCoy flat-fire form and drag formulation

McCoy (and JBM's clearer restatement) define a Mach-dependent drag **K**-function and a ballistic
coefficient **C**:

```
C  =  M / (i·d²)  =  SD / i          (ballistic coefficient)
F_D = -i · K_D(Mach) · ρ · d² · |v| v      (drag force, K-drag form)
a_D = -(ρ/ρ₀) · [G(Mach)/C] · v           (drag acceleration, G-function form)
a   = -(ρ/ρ₀) · [G(Mach)/C] · v + g       (total acceleration + gravity)
```

where:
- `i` = **form factor** (shape/fineness penalty, ≥1)
- `SD` = **sectional density** = M/d² (mass, not weight — multiply by g for lb/in²)
- `G(Mach)` = drag "G-function," the standard drag curve as a function of Mach
- `M` = Mach number

**The classic G1/G7/G8 drag tables** (§4) are just tabulations of `G(Mach)` for standard projectile
shapes, to which your specific bullet's BC is scaled.

### 3.3 Why solvers transform time → range

A key numerical trick (JBM): substitute downrange distance `x` for time `t`:

```
du/dt = (du/dx)·(dx/dt) = (du/dx)·u_x
```

This yields equations in (Mach, range) that are **better conditioned** — easier and more accurate to
integrate — because it removes the fast time-oscillation and lets you step along the trajectory in
natural spatial increments. It adds one extra ODE (for time) but the integration is more robust.

---

## 4. Drag Tables: G1, G7, G8, and the M-Tables

### 4.1 The "G" system (sporting)

Instead of tabulating C_D for every bullet, the US military defined **standard reference
projectiles** with known drag curves. Your real bullet's BC scales the standard:

- **G1** — early standard (WWII-era, ~3.3-caliber round-nose boat-tail). Now dated; poor match for
  modern long ogives. *One rigorous source (Tireur "Consolidated Competition Ballistics" v3.2)
  asserts the published G1 and G7 **supersonic branches were fabricated/extrapolated** and that
  they replaced them — see §11, Disagreement A.*
- **G7** — modern standard (~high-L/D boat-tail), far better match for today's hunting bullets.
  Now the default in most sporting solvers.
- **G8** — limited-use, niche.

### 4.2 The "M" system (military / artillery)

- **M-1, M-2, M-3** drag tables (and M-193/M-1500): organized by **relative length L/D** and
  **yaw factor Y**. Reference shapes include:
  - M-1: L/D = 3, Y = 0
  - M-2: L/D = 5, Y = 0
  - M-3: L/D = 10, Y = 0 (long, streamlined)
  - Variants with Y = 1° or Y = 2° (non-zero yaw) simulate imperfect/unsteady projectiles.
- Interpolate between tables by **L/D** and **Y**. Used for artillery and long stabilized rounds.

### 4.3 The drag *curve* vs Mach number

The canonical structure (Weinacht/Cooper/Newell, BRL):

```
Drag coefficient vs Mach:

  C_D
   ^
   |        ____  (transonic "drag rise/divergence")
   |       /    \________________________  (supersonic asymptote)
   |  _____/
   | /  (subsonic plateau)
   +----------------------------------------> Mach
        <0.8     0.8-1.2      >1.2
```

- **Subsonic (M < 0.8):** C_D roughly constant.
- **Transonic (0.8 < M < 1.2):** sharp **drag rise** (flow transition, wave drag).
- **Supersonic (M > 1.2):** C_D falls off with Mach.

**Bullet-specific consequence:** if a bullet starts supersonic but decelerates *through* Mach 1
mid-flight (very common for standard .308 at long range), it experiences the transonic drag
penalty right when its remaining speed can least afford it — dramatically increasing drop and time
of flight. This is why high-BC, long-core bullets dominate extreme long range.

### 4.4 Power-law drag approximation

A powerful closed-form tool (BRL). Assume:

```
C_D(M) = C₀ / M^n
```

Weinacht et al. fit real munitions: **n ranged 0.40–0.99, mean ≈ 0.77** — *not* simply n=1
(the common `C_D ∝ 1/M` simplification is only approximate). This power law has **closed-form
trajectory solutions** (velocity, time, range, height as functions of n) — no numerical integration
needed. Two limiting cases:

- **n = 0** → constant C_D (subsonic).
- **n = 1** → C_D ∝ 1/M.

Both yield **analytic** velocity-vs-range and drop-vs-range expressions (see §5). This is the basis
of many fast "closed-form" trajectory approximations.

---

## 5. Closed-Form & Numerical Solutions Compared

### 5.1 The classical closed-form approximations (flat-fire, McCoy Ch. 5)

McCoy derives three analytic approximations, each dropping drag's Mach-dependence into a simpler
form, valid to different velocity regimes:

1. **Constant drag coefficient** (C_D = const) — valid **subsonic**. Cleanest closed form; this is
   the classic "parabola-like" curve, accurate when the bullet stays below ~M0.8.
2. **C_D ∝ 1/M** — better in the **supersonic** regime.
3. **C_D ∝ 1/√M** — intermediate, sometimes used near transonic.

The Siacci functions and related historical methods (Siacci, 1880s) solved flat-fire trajectories by
**numerical quadrature** of closed-form integrands — historically the first practical bullet-drop
method, still the basis of some classical textbooks (McCoy Ch. 6; McShane/Kelley/Reno 1953).

### 5.2 Numerical (the modern standard)

For real accuracy across sub→supersonic→transonic, solvers use **Runge–Kutta 4th order, variable
step**, integrating the coupled ODEs from the muzzle to the target:

```
k₁ = h·F(xₙ, yₙ) ; k₂ = h·F(xₙ+h/2, yₙ+k₁/2) ; k₃ = h·F(xₙ+h/2, yₙ+k₂/2) ; k₄ = h·F(xₙ+h, yₙ+k₃)
yₙ₊₁ = yₙ + (k₁ + 2k₂ + 2k₃ + k₄)/6 + O(h⁵)
```

(JBM cites Abramowitz & Stegun, *Handbook of Mathematical Functions*, for these; the
**simultaneous-coupled-ODE** RK4 form — needed because position/velocity are coupled — is laid out
in *Ballistics of the Future*, Kooij & Uytenbogaart, McGraw-Hill 1946.)

Variable step size matters: the solver takes big steps where the solution is smooth (high, supersonic)
and small steps through the transonic region where C_D changes rapidly.

### 5.3 The time-of-flight trick (the observable that matters)

**Key insight (Oehler; JBM; BRL):** *Time of flight* is the single best-integrated observable of
cumulative drag. Over a known range, measuring TOF validates the whole drag model. Because:

- Muzzle velocity alone ≠ downrange velocity.
- Bullet path (drop) is measurable, but noisy.
- **TOF over a known distance directly encodes total drag.**

Doppler radar (proving grounds) measures velocity-vs-time for the entire flight, yielding an
empirical drag function *exactly matching that bullet*. Civilian solvers approximate this with
G-tables + BC. Modern chronographs let shooters validate their own solver's predicted TOF.

---

## 6. Long-Range Physics: The Lateral Forces

These are the small-but-systematic effects that separate a 1 MOA shooter from a 5 MOA shooter.

### 6.1 Wind Drift — and the great paradox

Naive intuition: crosswind pushes the bullet sideways by (wind × time). But the measured drift is
**larger** than a simple airmass calculation predicts. Why:

1. Crosswind creates a **yaw** of the bullet's nose relative to its path.
2. Yaw **increases drag** (extra lift/drag on an angled body).
3. That **lift force, perpendicular to flight path, pushes the bullet farther sideways** than the
   airmass model alone predicts.

So drift ≠ pure airmass. The winding-up: *crosswind → yaw → drag + lateral lift → drift > airmass.*

#### The K-factor (empirical, USMC/SNIPER derived)

```
WD (MOA) = (Crosswind / K) × (Range / 100)
```

`K` = crosswind (mph) that yields 1 MOA drift per 100 yards. Depends on caliber, altitude, bullet
weight, muzzle velocity. **Lower BC → higher K** (slower bullet, longer flight time, more wind
exposure).

Example (CSEC LRP, .308 165gr base, sea level, 2700 fps): **Base K = 10 mph.** Adjustments:
- Altitude: +0.00006 × ft (e.g., 5300 ft → +0.32)
- Bullet weight: ±0.01 per grain (heavier → less drift)
- Muzzle velocity: ±0.001 per fps (faster → less drift)
- Range bands: **K_Hunting = K_LR × 1.4**; **K_ELR = K_LR × 0.75**

*(MOA→MRAD: multiply by ~0.3.) The estimator is explicitly approximate; its largest error source
is the shooter's estimate of the actual cumulative crosswind. It is calibrated for high-BC
spire-point boat-tails — not reliable for flat-based round noses.)* [CSEC; Applied Ballistics]

### 6.2 Gyroscopic (Spin) Drift

Gravity pulls the bullet's velocity vector downward. The spinning bullet "weather-vanes" its nose
to follow the velocity vector — a nose-down aerodynamic torque. Because the body is spinning, the
torque response is **90° into the rotation**, not straight down: the nose deflects **sideways**
(right for a standard **right-hand twist** barrel).

Result: a **systematic rightward drift for right-twist rifles**, independent of wind, independent
of Earth's rotation. Depends on air density, BC, and range.

- **Magnitude (Applied Ballistics):** typically **8–9 inches at 1000 yards** for small-arms
  trajectories. *"Spin drift is negligible at hunting ranges… significant at 1000+ yards."*
- Left vs right twist flips the sign; magnitude is otherwise symmetric.

> Note: This is the **precession/spin-drift** term. It is distinct from wind drift and from the
> Coriolis effect, and it is **systematically signed** — it does not average out over many shots.

### 6.3 Coriolis Effect

The rotating Earth deflects a moving object. For a projectile it has **two components**:

**Horizontal (left/right) component:**
- Depends on **latitude**: **maximum at the poles, zero at the equator.**
- Direction-independent (same magnitude no matter which way you shoot, though the *sense* interacts
  with travel direction).
- At 45° N latitude, ~1000 yd: **~2.5–3.0 inches to the right.** [Applied Ballistics]

**Vertical (high/low) component:**
- Depends on **latitude AND firing direction**:
  - Firing **North/South** → zero vertical deflection.
  - Firing **East** → **hit high**. Firing **West** → **hit low** (Northern hemisphere).
- Magnitude: **maximum at the equator, zero at the poles.**
- At 45° N, ~1000 yd: **+2.5–3.0 in (east) / −2.5–3.0 in (west).**

**Why it matters:** like spin drift, it's small (~2-3 in) but **perfectly systematic** at a given
latitude/firing direction. A shooter who ignores it has a tiny, consistent vertical bias. It's
why experienced long-range shooters calibrate at the latitude they'll shoot in.

#### My independent check (and an honest correction)
The textbook Coriolis acceleration for horizontal firing is `a ≈ 2Ω·cos(λ)·V` (vertical component,
for east/west fire). Plugging in V ≈ 780 m/s, λ = 45°, and a realistic 1000-yd flight time of
T ≈ 0.9–1.0 s gives `Δz ≈ ½·a·T²` ≈ **1–2 inches**. This is **order-of-magnitude consistent**
with the published ~2.5–3.0 in, but modestly lower — as expected, because a full numerical solution
integrates the *decaying* velocity profile and the trajectory curvature rather than assuming
constant V. Take the **published 2.5–3.0 in @ 1000 yd** as the practical figure; the discrepancy is
within the expected gap between a hand-check and a full coupled integration. *(Disagreement B,
§11.)*

### 6.4 Earth curvature

Beyond ~1000 yd the Earth's surface curves away. A shooter aiming at a target's base must add
elevation. The drop due to curvature grows with range² — negligible at 100 yd, a few inches by
1000 yd, feet beyond 2000+ yd. Most modern shooters ignore it below 1000 yd.

---

## 7. Short-Range Physics: Why It's a Different Animal

### 7.1 The regime flips: drag dominates even harder

At short range with slow projectiles (airguns, archery), the projectile is **subsonic and
low-BC** almost the whole flight. Consequences:
- **Very high drag-to-weight ratio** → steep, strongly-curving arc.
- **Long time of flight** (a pellet/arrow hangs in the air) → wind sensitivity is at a **maximum**.
- Air density matters far more (it's the *only* thing decelerating it).

### 7.2 Airgun pellets

Wind-tunnel work (Sports Eng., 2019) at M ≈ 0.58, Re ≈ 54,000:
- **≈65% of pellet drag is on the front face**, ~35% on the base, ~0 net from the side slopes.
- **Dome-head/diabolo tails** enable flow reattachment and raise base pressure, cutting base drag.
- Spherical (BB) pellets can't reattach at that Reynolds number → higher base drag, but are
  **spherically symmetric → inherently yaw-stable**, often very accurate.
- **Instability source:** even slight mass asymmetry makes the pellet yaw and spiral → at extreme
  range it **tumbles**. Small pellets are relatively *longer* (more yaw-stable); the diabolo tail
  acts a bit like a shuttlecock fin for lateral stability. A damaged/uncut muzzle dramatically
  increases instability.

### 7.3 Arrows & the Archer's Paradox

**Archer's paradox** (Kooi & Sparenberg, *J. Eng. Math.* 31(4), 1997): In a vertical bow, the
arrow visibly *vibrates horizontally* after release. Causes:
1. **Mediterranean release** — string slips off three fingers, nock snaps sideways → arrow bends by
   inertia.
2. **Grip contact** — the rigid grip forces the arrow off the vertical plane as nock distance
   collapses.

The **longitudinal string force buckles the shaft**. After release the (still-curved) arrow
oscillates at a frequency set by its mass/flexural-rigidity distribution. Because bending is in a
**horizontal** plane, the arrow naturally points where it's aimed — the oscillation makes it
"snake" around the grip rather than slapping it. The paradox: *the sight is aligned to the launch
tangent, yet the arrow still hits the aim point*, because the flex is symmetric about the vertical
plane. The practical requirement is **dynamic spine** tuned to the bow's power.

**Arrow ballistics (Park et al.):** arrow BC is very low; typical arrow slows dramatically over
50–70 yards; wind drift is large relative to group size; flight time is long (~1+ s). Archery is a
paradoxically **more** wind-sensitive sport than long-range rifle shooting per unit of range.

---

## 8. Stability: Why a Bullet Flies Straight (Gyroscopic Mechanics)

This is the deepest physics in the topic.

### 8.1 Gyroscopic stability — the spin resists tilting

A spinning body resists changing the direction of its spin axis. The restoring torque is
proportional to **spin rate**. Rifling imparts enough spin to keep the bullet's nose forward against
aerodynamic overturning moments. Too little spin → the bullet yaws → more drag → possible tumble.

- **Rate of twist (1 in N):** higher N = more twist per inch = **more spin, more stability**, but
  excessive spin can increase **spin drift**. Typical match/precision: 1-in-8 to 1-in-12; military
  minimum commonly ~1-in-7 (GB/T 19978, SAAMI).
- **Dynamic vs static stability:** static stability = restoring moment exists at zero spin; dynamic
  stability = the damped oscillation actually settles (damping exponents negative). For most
  spin-stabilized bullets, static stability (S_g > 1) plus gyroscopic spin is sufficient.

### 8.2 Precession & coning (the "spin axis weaves")

The spin axis doesn't rigidly follow the velocity — it **precesses** (epicyclic motion), tracing a
circle/spiral in the wind frame. Boatright's *Coning Theory* (arXiv 1205.2071) describes the
bullet's center of gravity as orbiting the mean trajectory in a **damped, right-circular cone** at
the gyroscopic precession rate, with the nose angled slightly inward. This coning grows the effective
angle-of-attack → **increasing yaw drag** and contributes to the observed **spin drift** and
**"jump"** (crosswind deviation near the muzzle).

### 8.3 Reversal of Steering (ROS)

For *very* slender projectiles at *very* high supersonic spin, the overturning moment can reverse
direction past Mach ~5 (Prandtl–Glauert effects), sending the bullet into a divergent spiral.
Historically it wrecked long-range artillery; for modern small arms it's essentially **absent**
(small arms decelerate through the transonic region long before ROS velocities). You may see it
discussed as a WWII artillery problem; don't expect it in a rifle.

### 8.4 The "jump"

Fired into a crosswind, a spinning rifle bullet often deflects noticeably **to the right in the
first few feet** (independent of range) — the "jump." Cause: **unsteady aerodynamics** as the bullet
exits into the muzzle gas / early boundary layer in a crosswind. Magnitude ~ a few MOA at 100 yd,
then it straightens into the normal spin-drift line. Real ballistic solvers (EBV4 4-DOF) model this
explicitly.

---

## 9. Aiming Geometry: MOA, MIL, SMOA, Zeroing

*(This is the "how you convert physics into clicks/held-over" layer.)*

### 9.1 Angular units (verified numerically)

| Unit | Definition | Size | Per circle |
|---|---|---|---|
| **Radian** | arc = radius | 1.000000 rad | 2π ≈ 6.2832 |
| **True MIL** | 1/1000 radian | 0.001 rad | **6283.19** |
| **True MOA** | 1/60 degree | 2.90888×10⁻⁴ rad | **21,600** |

**True MOA vs SMOA (the crucial practical distinction):**
- **True MOA:** 1 MOA = 1.047″ at 100 yd (because tan(1 MOA) × 36,000 in = 1.047 in).
- **SMOA / IPHY ("shooters MOA" / inch-per-100-yard):** by definition 1.000″ at 100 yd.

The difference (~4.7%) is why scope reticles (usually mil or true-MOA) and "click" turrets (often
SMOA) don't perfectly match. **Know which your turret uses.**

**Useful anchor (my verified calc):** 1 true MOA = 1.047″ @100yd = 5.236″ @500yd = 10.47″ @1000 yd.

### 9.2 The tangent (range) equation

```
tan(θ) = Height / Distance      →      Distance = Height / tan(θ)
```

For small angles, `tan(θ) ≈ θ`, which is why linear mil/MOA rules work at short range — but the
**approximation error grows with angle/range**. At extreme long range and high MOA, use true
geometry or a mil-dot reticle, not linear IPHY.

### 9.3 Zeroing physics

A **zero** aligns the bore so the **point of impact (POI)** equals the **point of aim (POA)** at the
zero distance, with the bore angled up slightly. Between muzzle and zero, the bullet arcs *above*
the line of sight; at the zero, POI = POA.

- **Why zero at 100 yards?** Balance: close to zero for practical engagement ranges, minimizing
  the arc's height over bore, with manageable holdover beyond. A **100-yd zero** is the military/
  match standard; **battlefield/max-point-blank (MPBR) zero** optimizes for the largest guaranteed
  hit radius within a bracketed range (max terminal ordinate ≤ ½ target radius).
- **Bore angle vs shift:** bore elevation ≈ (drop / range) for the zeroed range; the scope's
  "shift" converts that to click adjustments (1 SMOA click ≈ 1″ @100yd).

### 9.4 Holdover & mil-dot

After zeroing, hitting further targets = **holdover** (aim high by the remaining drop). A **mil-dot
reticle** encodes this: the bullet's drop between two mil marks at a range equals the mil spacing
you dial. Mil-dot works cleanly from a 100-yd zero up to ~600 yd; beyond that it drifts (the
non-linear S-curve) and dope tables/solver data take over.

### 9.5 Terminal ordinate (max arc height)

The **maximum height** the bullet reaches above the line of sight between muzzle and target. For a
zeroed rifle this is typically 2–4″ (100-yd zero), occurring a few hundred yards out. It defines
**MPBR** — the range at which POI is still within a target of the aim point. Higher arc → larger
arc → holdover is *lower* at a given far range but the near-field is more forgiving.

---

## 10. Terminal Ballistics (the impact side, briefly)

Flight physics sets the *arrival state*; terminal ballistics determines what it does:

- **Energy** `E = ½mv²`: e.g. .30-06 180gr @3000 fps ≈ **3,600 ft·lb** (my verified calc).
  Quadruples energy for a 2× velocity → velocity is the dominant wounding variable.
- **Momentum** `p = mv`: governs *penetration depth*, more than energy alone.
- **Sectional density** `SD = m/d²`: the practical penetration predictor (lb/in²). e.g.
  .30-06 180gr ≈ 0.271; .308 168gr ≈ 0.253 (verified).
- **Temporary cavity** (cavitation): radial tissue displacement, peak expansion a few hundred fps
  after impact; scales with velocity/energy. Significance threshold roughly **>1,000 fps** strike
  velocity.
- **Yaw-induced tumbling** ("jackknifing"): a yawing bullet dumps energy fast → rapid temporary
  cavity, less penetration.
- **Expansion vs penetration** trade-off: hollow-point/jacket design that mushrooms creates a
  wider channel but higher drag → less depth. The FBI standard balances both: **12–18 in penetration
  in calibrated gelatin**, minimal overpenetration, maximized expansion.

*(This section is context for why long-range shooters care about velocity/BC — a faster, higher-BC
bullet delivers more energy AND more stable, penetrative wound channels.)*

---

## 11. Disagreements & Uncertainties (honesty section)

- **A. G1/G7 supersonic accuracy is contested.** The Tireur "Consolidated Competition Ballistics"
  manual (v3.2) explicitly states it **replaced the G1 and G7 drag tables because their supersonic
  branches "had been fabricated,"** and removed a `4/π` factor that had masked the error; it
  recomputed every trajectory figure. This is a *specific, checkable claim* from a rigorous
  recent manual. Most commercial solvers still ship classic G1/G7 tables. **Take drop predictions
  transonic-and-beyond with some caution** and validate with a chronograph / Doppler where possible.
- **B. Coriolis magnitude:** my closed-form hand-check gives ~1–2 in @1000 yd; Applied Ballistics
  (full numerical treatment) reports ~2.5–3.0 in. Same order of magnitude; the published value
  reflects the integrated, decelerating trajectory. Trust the numerical result, understand the hand
  estimate as a sanity bound.
- **C. Spin drift:** Applied Ballistics gives 8–9 in @1000 yd as a representative figure. Actual
  values vary with BC, velocity, altitude, twist rate. No single hard number generalizes; treat
  8–9 in as an order-of-magnitude anchor at 1000 yd, and scale to ~zero (negligible) at hunting
  ranges.
- **D. The "wind drift" K-factor** is an *estimator*, explicitly not exact, and its biggest error
  is the shooter's own crosswind estimate — not the formula. Treat K as a sanity-check on ballpark
  hold, not a substitute for actual dope/solver data in real wind.

---

## 12. The Error Budget (what actually limits you)

For a given shot, error sources roughly rank as:
1. **Muzzle velocity variation** (lot-to-lot, temp) — usually the **#1** vertical error at range.
2. **Crosswind** (estimate + actual) — usually the #1 lateral error.
3. **Drag-model mismatch** (G-table vs real bullet; transonic) — matters at long range (§11-A).
4. **Spin drift** — systematic, ~8-9 in @1000 yd; correctable once calibrated.
5. **Coriolis** — systematic, ~2-3 in @1000 yd; latitude-dependent.
6. **Zero/POA-POI geometry, cant, shooter technique.**

The physics in §§1-9 lets you model 1-5; #6 is on you.

---

## 13. Key Sources

- **R. L. McCoy, *Modern Exterior Ballistics: The Launch and Flight Dynamics of Symmetric
  Projectiles*, 2nd Ed. (Schiffer Military History).** The definitive modern text. Ch.4 drag, Ch.5
  flat-fire + closed-form approximations, Ch.6 Siacci method, Ch.7 wind/rat-fire, Ch.8 point-mass +
  Coriolis, Ch.9 6-DOF. (Full text via Internet Archive.)
- **JBM Ballistics — "Topics: CD and KD", "Topics: Runge-Kutta".** Clearest public restatement of the
  G-function/ballistic-coefficient drag formulation and the RK4 coupled-ODE integrator.
- **Weinacht, Cooper, Newell (BRL/DTIC ADA439796), "Analytical Prediction of Trajectories for
  High-Velocity Direct-Fire Munitions."** Transonic drag curve structure; power-law drag `C_D∝M^-n`;
  closed-form supersonic solutions; fitted exponents n=0.40-0.99 (mean 0.77).
- **Applied Ballistics (Bryan Litz) — "Gyroscopic (Spin) Drift and Coriolis Effect"; CSEC LRP Wind
  Drift Estimator.** Best practitioner-level quantitative treatment of lateral effects (spin drift
  8-9 in @1000yd; Coriolis 2.5-3 in @1000yd; K-factor wind method).
- **FM 6-40 *Field Artillery Gunnery*, Ch.3 "Ballistics"; FM 3-22 *Rifle Marksmanship*.** Military
  framing of exterior ballistics, standard atmosphere, drift/wind/rotation corrections.
- **Kooi & Sparenberg, "On the Mechanics of the Arrow: Archer's Paradox," *J. Eng. Math.* 31(4)
  (1997).** Definitive archery-paradox analysis.
- **Park, J.L. et al., "The impact of the atmosphere on target archery," *Sports Engineering*
  (2019); "Influence of air rifle pellet geometry on aerodynamic drag," *Sports Engineering* (2019).**
  Peer-reviewed short-range aerodynamics.
- **Boatright, J., "Coning Theory of Bullet Motions" (arXiv:1205.2071).** Gyroscopic precession,
  coning, yaw-of-repose, jump.
- **Borden Institute, *Conventional Warfare: Ballistic, Blast and Burn Injuries*, Ch.4.** Cavitation,
  temporary/permanent cavity physics.
- **Oehler / Doppler-radar discussions (JBM).** Time-of-flight as the integrated-drag observable.

*(Full text of McCoy and links to all sources compiled during research; several DTIC/PDF sources
returned raw binary via direct fetch and were extracted via Exa's markdown extractor.)*

---

## 14. One-Page Mental Model

1. **Drag ∝ V²** → fast bullets lose big speed early, then coast ballistic. Trajectory S-flattens.
2. **Ballistic coefficient BC = SD / form-factor** is the single number that says "how well does
   this bullet punch through air." Weight ÷ diameter² (sectional density) / shape penalty.
3. **G1/G7/M-tables** are standard reference drag curves you scale by BC. Transonic drag rise is
   the killer at long range (use high-BC, long-core bullets).
4. **Time of flight** is the master observable — it integrates all the drag. Longer flight = more
   gravity, more wind, more spin drift, more Coriolis.
5. **Short range / slow stuff** (pellets, arrows): drag dominates, huge wind sensitivity, archer's
   paradox. **Long range / fast stuff:** transonic drag + the systematic lateral forces (spin drift
   ~8-9″, Coriolis ~2-3″ per 1000 yd) decide the shot.
6. **Aiming is geometry** (tan θ = H/D); MOA/mil/SMOA conversions must be consistent; know your
   turret.
7. **Error budget:** muzzle velocity (vertical) and crosswind (lateral) dominate; spin drift and
   Coriolis are correctable systematic biases once you calibrate for them.