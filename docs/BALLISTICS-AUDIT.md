# Ballistics: what is real and what is invented

**Read this before trusting any number the app or site produces.**

The ballistics screens inherited from the first Gemini pass contain
formulas that produce plausible-looking but physically wrong output. They
are not approximations that are merely imprecise — they are unrelated to
the physics, and two of them fail *optimistically*, which is the dangerous
direction.

Every claim below was verified by executing the shipped code, not by
reading it.

---

## 1. DOPE card — drop is fabricated

`screens/DopeCardScreen.jsx`

```js
const dropInches = 0.00008 * Math.pow(yd, 2.3);
```

This is a curve fit with no physical basis. Bullet drop is not a power law
in distance; it depends on muzzle velocity, drag coefficient, and altitude,
and it is close to quadratic over normal ranges.

Worse, the muzzle velocity and zero distance shown in the header
(`2,720 fps`, `100 yd`) are **static text that never enter the calculation**.
The card is hardcoded to a lookup curve.

Executed output vs. a real 6.5mm round at 2,700 fps:

| Distance | Code's drop | Actual | Error |
|---|---|---|---|
| 100 yd | 3.2 in | ~1.2 in | +170% |
| 300 yd | 39.9 in | ~10.7 in | +270% |
| 500 yd | 129 in | ~29 in | +345% |
| 1000 yd | **635 in (53 ft)** | ~93 in (7.7 ft) | **+580%** |

The error grows with distance because of the `y^2.3` exponent. Someone
shooting to 1000 yards off this card misses low by roughly 45 feet.

The wind column (`yd * 0.0018`) is a straight line and is not a drift model.
Time of flight (`110 + yd * 1.45`) is a linear guess.

**Status: unusable. Must be replaced with a real ballistic solver before
this screen is shown to anyone.**

---

## 2. Rayleigh / CEP — wrong estimator, fails optimistic

`screens/RayleighGroupCalculator.jsx`

```js
const sigma = Math.sqrt(sumSqRadii / (2 * n));
```

`Σr²/2n` is the maximum-likelihood estimator for a Rayleigh distribution
with a **known** centre. Here the centre of impact is estimated from the
same shots, so the correct estimator needs `n - 1`.

Executed against the component's own default 3-shot sample:

| Estimator | sigma | CEP50 |
|---|---|---|
| Shipped code (`/2n`) | 0.418 | **0.49"** |
| Bessel (`/2(n-1)`) | 0.512 | **0.60"** |

**The shipped code under-reports CEP by about 18%.** Shooters use CEP to
decide whether a rifle is sub-moa; under-reporting flatters their groups
and hides an actual problem. With 3 shots the bias is large; it shrinks
as n grows but never reaches zero.

Also: `cep90` is computed and never displayed, and `calculateMetrics()`
recomputes on every render with no memoization.

**Status: directionally correct model, wrong denominator. The one-line fix
is `/ (2 * (n - 1))`.**

---

## 3. Transonic / Sg — inputs are dead

`screens/TransonicStabilityScreen.jsx`

The screen accepts muzzle velocity and a stability factor `Sg`, and
**uses neither**. It only computes speed of sound and a fixed 1.2×
threshold:

```js
const speedOfSoundFps = 49.022 * Math.sqrt(temp + 459.67);
const transonicCutoffFps = 1.2 * speedOfSoundFps;
```

The speed-of-sound formula is correct — verified 1116.4 fps at 59 °F
against the accepted ~1116 fps. But the screen's own header promises
"gyroscopic stability factor ($S_g$)" and a transition zone, and delivers
neither. At the default 2700 fps the round is Mach 2.42; the app does not
say so.

**Status: the two inputs are decorative. Either implement Mach + SG or
remove the inputs so the screen stops implying capability it lacks.**

---

## 4. Powder temperature — correct, but trivial

`screens/PowderTempSensitivityScreen.jsx`

`v = v_base + ΔT · C_T` is the standard first-order temperature
sensitivity model and is implemented correctly.

It is also one multiplication, and it does not read from the chronograph
logs the app already stores. The genuinely useful version fits `C_T` by
least squares across a user's own logged shots rather than asking them to
type in a sensitivity coefficient they do not know.

**Status: correct. Low priority.**

---

## What to do

The fix is structural, not a patch. Physics belongs in
`packages/ballistics-core/` as pure functions with tests, imported by both
the website and the app. A calculator app's only product is its arithmetic;
it cannot live inside component render bodies where it cannot be tested.

Priorities:

1. **Replace the DOPE drop model** with a proper solver
   (drag + zero offset + temperature-corrected MV + wind + spin drift).
   Blocking — the current output is dangerous.
2. **Fix the CEP denominator** to `n - 1`. One line, and it currently
   reports the flattering answer.
3. **Implement or remove** the transonic SG inputs.
4. Fit `C_T` from stored chrono data instead of asking for it.

Tests for 1 and 2 should assert against published reference values, so a
regression shows up as a failed test rather than a plausible wrong number.

---

# Trajectory solver — implementation record (30 Sep 2026)

The solver is now implemented, exported, and covered by 30 tests. This section
records what was wrong along the way, because each bug is a class of error that
will recur if the reasoning is not written down.

## Validation result

Reference case: .308 Win, 168 gr Federal Gold Medal Match BT, G1 BC 0.462,
2650 fps, 100 yd zero, ISA sea-level (59 degF, sigma 1.0), no wind.

| Range yd | Drop in | MOA | Velocity fps | Time s | Windage MOA at 10 mph |
|---|---|---|---|---|---|
| 100 | 0.0 | 0.0 | 2491 | 0.12 | 0.63 |
| 200 | -5.6 | -2.8 | 2337 | 0.24 | 1.29 |
| 300 | -17.6 | -5.9 | 2190 | 0.37 | 2.00 |
| 400 | -36.8 | -9.2 | 2048 | 0.52 | 2.75 |
| 500 | -64.3 | -12.9 | 1914 | 0.67 | 3.54 |
| 600 | -101.4 | -16.9 | 1785 | 0.83 | 4.39 |
| 700 | -149.3 | -21.3 | 1662 | 1.00 | 5.30 |
| 800 | -209.8 | -26.2 | 1547 | 1.19 | 6.26 |
| 900 | -284.9 | -31.7 | 1437 | 1.39 | 7.29 |
| 1000 | -376.8 | -37.7 | 1334 | 1.61 | 8.38 |

Velocity agrees with the commonly published table for this load to within
0.4% at 100 yd rising to 4.3% at 1000 yd. The gradient is consistent with a
slightly different BC in the source table: box BCs are quoted to two decimals
and vary by manufacturer, and a 4% BC spread produces exactly this velocity
spread. See the note on the drop convention below.

## The five bugs, and how each was caught

### 1. Inverted drag sign (pre-existing, carried in from the deleted file)

Adding `a_drag` instead of subtracting it made the bullet accelerate, giving
2650 -> 3929 fps. Caught immediately by a sanity run. Now guarded by
`velocity decreases monotonically`, which the header says must not be removed.

### 2. Dropped the pi/4 in the drag coefficient

Drag is `F = (1/2) rho v^2 Cd A` with `A = pi d^2 / 4`. Cancelling the 1/2
against a 2 and forgetting the pi/4 inflates drag by `4/pi = 1.2732`.

**How it was found:** the solver lost 1568 fps over 1000 yd where the reference
loses 1256. That ratio is 1.248, against a theoretical 1.273. Close enough to
identify; the remainder is the BC difference noted above.

Fix: `DRAG_COEFFICIENT_PI_OVER_8 = Math.PI / 8`, named so the constant cannot
be silently rewritten.

### 3. ISA lapse rate in the wrong units (the dangerous one)

`densityRatio` used `0.00687535` as **K/ft**. The standard atmosphere quotes
0.0065 K per **metre**, and 0.00687535 is also a per-metre figure. Using a
per-metre number as per-foot is a 3.28x error, and it made density almost
independent of altitude: sigma 0.998 at 10,000 ft instead of 0.7385.

**This has no visible symptom.** No exception, no NaN, plausible-looking
numbers. A shooter in Denver would have been handed a sea-level firing
solution and had no way to notice.

Caught by asserting against the ISA table. Now `ISA_LAPSE_RATE_K_PER_FT` is
stored in K/ft (0.0019812, equivalently 0.003566 degF/ft) with a warning in
its doc comment, and `test/atmosphere.test.ts` pins sigma at 0, 1000, 5000 and
10000 ft.

### 4. Rigid zero offset instead of a line through the zero point

The first implementation subtracted the raw trajectory height at the zero
distance from every sample. That measures drop relative to a *horizontal* line
through the zero point. A scope is bored parallel to the line of sight, so the
real line of sight is a straight line from the muzzle through the zero point.

Effect: drop was overstated by 100-300% beyond the zero distance — -400 in at
1000 yd where the reference is -341 in.

Caught by the reference-table comparison, and confirmed by an independent
hand calculation of the 200 yd figure.

Fix: `boreSlope = rawAtZero / zeroDistance`, and drop is measured against
`losSlope * range`.

### 5. Scope zero offset applied as a height instead of an angle

`zeroMoa` is an angular offset. It was added as a constant height, so a 1 MOA
scope reference shifted the table by 1 inch at every range instead of 1 inch
at 100 yd and 10 inches at 1000 yd. Then the corrected version dropped the
inches-to-feet factor, making it 12x too large (120 in at 1000 yd).

Both variants are wrong in the same way, which is why the test asserts the
1000 yd shift specifically rather than just "it changes."

Fix: `scopeSlope = zeroMoa / (12 * 100 * 3) = zeroMoa / 3600` ft per ft.

## Two things that are correct but look wrong

**Ballistic coefficients are not comparable across drag models.** A G7 BC of
0.320 and a G1 BC of 0.462 describe similar drag for the same bullet, because
they are measured against different reference projodals. The quantity that
enters the retardation equation is the product of form factor and BC:

    G1: 1.0 * 0.462 = 0.462
    G7: 1.2 * 0.320 = 0.384

so the G7 solution retains **more** velocity. An early test asserted the
opposite, on the reasonable-sounding but incorrect grounds that "higher BC means
less drag." The test now asserts the correct relationship and explains why the
naive one is a category error.

**Wind drift is smaller than a tracer estimate.** At 10 mph and 1000 yd a
passive tracer would drift `wind_speed * time_of_flight` = 14.67 fps * 1.61 s =
283 in. The solver gives 84 in. That is correct: the bullet is decelerating, so
it spends proportionally less of its flight aligned with the wind, and drag
works against the lateral component. The test bounds the result against the
tracer limit rather than against a guessed figure.

## Open items

1. **The drop convention must be reconciled against a named source.** The
   published table this was compared to could not be retrieved (the
   calculator sites block automated access), so its drop column is recorded but
   not asserted. Publishers differ on whether "drop" means below the line of
   sight for the stated zero, below the bore, or below a horizontal muzzle
   line. This solver uses the first, which is what a shooter needs. Before the
   drop figures are used as a tight regression gate, someone must read a real
   published table and confirm its stated convention.

2. **BC provenance.** Every BC a shooter enters comes from a box or a manual,
   usually to two decimals. The app should record the BC alongside the source
   and the resulting velocity, so a dope card can be revisited if the BC turns
   out to be optimistic. The trajectory is only as good as that number.

3. **Beyond 2000 yd** the model omits yaw, coriolis and curvature. The solver
   emits a caution when `maxRangeYd` exceeds 2000.

4. **The DOPE card is not yet rewired.** `DopeCardScreen.jsx` still uses
   `0.00008 * Math.pow(yd, 2.3)`, which returns 53 ft of drop at 1000 yd where
   this solver returns 31 ft. That screen must not ship.

---

# Device integration layer (30 Sep 2026)

`packages/ballistics-core/src/devices/` is the contract for talking to shooting
hardware. It has no vendor-specific code, and nothing in it imports React,
React Native, or Expo.

## What is built

| File | Purpose |
|---|---|
| `types.ts` | `DeviceDriver`, `Capabilities`, `TurretControl`, `DeviceReadError` |
| `solution.ts` | `buildFiringSolution()`, `applyAdjustment()`, `DriverRegistry` |
| `drivers/simulated.ts` | Simulated rangefinder, weather meter, turret, scope camera |

## Adding a device later

Write one file implementing `DeviceDriver`, declare its `Capabilities`, and
register it. No change to the solver, the solution layer, or the UI is needed
unless the UI wants a brand-specific affordance — which it should not.

That is the whole point of the capability model. The first design would have
been a `DeviceType` enum, and every new rangefinder would have been a change to
the core plus a `switch` in the UI. Instead the UI asks "is there a live wind
source?" and does not care which device answers.

## The turret gate

Automated turret movement is designed, documented and tested, and **there is no
driver for it, because no manufacturer permits it.** See below.

`applyAdjustment()` refuses to move a turret unless the caller passes
`acknowledged: true`. That single boolean is the entire mechanism, and it is
deliberately not a setting or a "trusted mode" toggle, because those can be set
once and forgotten, and the failure mode is a rifle pointed at a solution nobody
chose.

Other enforced rules:

- **No trigger, ever.** There is no `fire()` anywhere in the interface. A test
  asserts that `fire`, `fireRound`, `trigger` and `shoot` are all undefined, so
  a future change that adds one fails the build rather than shipping.
- **No auto-retry.** A failed move is reported once. Retrying a mechanical
  movement behind the shooter's back is how a rifle ends up somewhere unintended.
- **Unverifiable moves warn even on success.** A driver that can move a turret
  but not read it back must declare `verification: 'none'`, and the outcome
  carries a "verify by hand" warning.
- **Backlash is modelled.** `TurretControl.backlashClicks` lets a driver declare
  its slack, and a move smaller than that is flagged as possibly not having
  happened at all.
- **A driver that lies about its capabilities is caught.** Claiming
  `writesTurret` without implementing `moveTurret` is reported as a driver bug
  rather than silently tolerated.

## Why there is no scope driver

**No major scope manufacturer exposes a public API for third-party read or
control of turrets.** SIG BDX, Nightforce NFOR, Leupold LR/TX, Vortex Venom and
Swarovski all speak proprietary protocols to their own apps. There is no open
standard, and no way to read a turret position or command a turret without a
vendor partnership or a protocol reverse-engineered from firmware.

So the capability exists and the pipeline is built, but the driver does not.
That is the honest state, and it is recorded in `DriverStatus` as
`'contract-only'` so a UI can say so.

Rangefinders and weather meters are a different matter: several expose
Bluetooth today, and those are the drivers worth writing first.

---

# Solver correction: the zero is a launch angle (30 Sep 2026)

Found while wiring the device pipeline, and it was the most consequential bug in
the project so far.

## What was wrong

The solver fired the bullet **horizontally** and then subtracted a straight line
to fake the zero. That is wrong in three independent ways, all of which were
live at once:

1. **The zero was read from the first output sample.** With a coarse output
   step, the first sample can lie beyond the zero distance, so the zero was
   taken from the wrong range entirely. A `stepYd` of 1000 with a 100 yd zero
   reported **+362 MOA of elevation** at 1000 yd, where the correct answer is
   -37.7 MOA. A 1000 yd zero reported a 400 inch hold at 1000 yards.
2. **The line-of-sight slope had the wrong sign**, which inverted every hold.
3. **Velocity and time of flight were those of a horizontal shot**, not of the
   bore angle the rifle is actually firing at — so the numbers a shooter would
   most want to sanity-check were wrong too.

None of this was caught by the reference-table tests, because those all used
`stepYd: 100`, which happens to sample the zero distance exactly. **The bug was
invisible to every test until the device pipeline asked for a solution at an
arbitrary range.**

## The correct model

A zeroed rifle does not fire horizontally. The shooter raised the bore until the
bullet crossed the line of sight at the zero distance, so:

```
Pass 1:  integrate a horizontal launch to zeroYd, measure the fall
Pass 2:  launch along the slope that cancels that fall
         drop(x) = trajectory height, which is zero at zeroYd by construction
```

The second integration is not an optimisation to avoid. Gravity and drag act on
the air-relative velocity, so a constant launch angle only subtracts a straight
line — but firing along the real bore angle makes the reported velocity and time
of flight physical, which is what a shooter uses to sanity-check a solution.

Validated result, unchanged where it was already correct:

| Range | Drop in | MOA | Velocity | Time |
|---|---|---|---|---|
| 100 | 0.0 | 0.0 | 2491 | 0.12 |
| 300 | -17.6 | -5.9 | 2190 | 0.37 |
| 500 | -64.3 | -12.9 | 1914 | 0.67 |
| 700 | -149.3 | -23.9 | 1662 | 1.00 |
| 1000 | -376.8 | -37.7 | 1334 | 1.61 |

## New regression tests

- **Zero holds at any output step.** Four zero distances, three step sizes each,
  all within 0.5 inch. This is the test that was missing and that let the bug
  through.
- **Inside the zero the bullet is high, beyond it low.** A 500 yd zero gives
  +21.0 in at 300 yd, 0.0 at 500, and -24.1 at 600. This is the physical
  signature of a real zero.
- **Drop is monotonic in the zero distance.** At 300 yd: a 100 yd zero gives
  -17.6 in, a 300 yd zero gives 0.0, a 500 yd zero gives +21.0 in. A strong check
  that the launch-angle model is right rather than merely self-consistent.

## Lesson worth keeping

The earlier validation was thorough about the *physics* and blind to the
*geometry*. Every test used a step size that happened to align with the zero
distance. Adding a second consumer that asked an awkward question — "what is the
hold at whatever range the rangefinder just reported?" — found it immediately.

Tests that only exercise the case you designed for are not validation.

---

# Building and verifying the reference trajectory (30 Sep 2026)

This records how the reference trajectory was verified, what was found, and
what remains open. It exists because the honest answer turned out to be more
interesting than a simple "we checked it against a table".

## The problem

The solver's validation was incomplete. We had:

- A commonly-cited velocity column (2501 fps at 100 yd falling to 1394 fps at
  1000 yd), recalled rather than retrieved, for a .308 Win, 168 gr Federal Gold
  Medal Match boat-tail, G1 BC 0.462, 2650 fps, 100 yd zero.
- A drop column (0 to -341 in over the same span) that we had deliberately
  **stopped asserting against**, because publishers disagree on what "drop"
  means and we could not read a real table to find out.

So: velocity half-verified, drop not at all.

---

## Step 1 — Establish that the discrepancy is real and systematic

Comparing our velocity against the reference, the error is not noise:

| Range | Reference | Ours | Error |
|---|---|---|---|
| 100 yd | 2501 | 2491 | -0.40% |
| 300 yd | 2218 | 2190 | -1.26% |
| 500 yd | 1954 | 1914 | -2.05% |
| 700 yd | 1711 | 1662 | -2.86% |
| 1000 yd | 1394 | 1334 | -4.30% |

**A deficit that grows linearly with range is the signature of a drag-scale
error, not of a bad reference column.** Random scatter would not do that. So
either our drag is systematically too high, or the reference used a different
ballistic coefficient than the 0.462 we passed in.

## Step 2 — Test whether the drag table is at fault

Re-deriving the trajectory with a completely independent implementation —
classical Euler-Cromer, written from `F = ma` rather than reusing the solver —
produced a *larger* disagreement with the solver (0.8% at 100 yd growing to
16.5% at 1000 yd) than the solver has with the reference. Two implementations
using the same G1 table should not disagree at all, so this needed
investigating before anything else.

Ruled out, one variable at a time:

| Hypothesis | Test | Result |
|---|---|---|
| The G1 drag table differs between the two | Compared element by element | **Identical.** Ruled out. |
| The bore launch angle reduces reported velocity | 0.26 deg, cos = 0.99999 | 0.001%. Ruled out. |
| A first-order integrator artefact | Added second-order correction | No change. Ruled out. |
| Drag depends on 3D air-relative speed | Inspected state vector | Negligible at these angles. |

**The standalone was wrong, not the solver.** It had been typed from memory
with a coarser table, and the "independent check" was measuring my own
transcription error. Worth recording: an independent reimplementation only
counts as validation if it is written from the physics, not from memory of the
thing it is checking.

## Step 3 — Solve for the coefficient that does match

Fitting the reference velocity column across 1000 yards gives a best-fit BC of
**0.4910**, which reproduces every published velocity figure to within 0.16%:

| Range | Reference | At BC 0.491 | Error |
|---|---|---|---|
| 100 yd | 2501 | 2500 | -0.05% |
| 500 yd | 1954 | 1953 | -0.04% |
| 1000 yd | 1394 | 1394 | +0.02% |

But the bullet is published as **G1 0.462**, and 0.491/0.462 = 1.063. A 6.3%
discrepancy is far too large to be BC-rounding on a box.

## Step 4 — The answer: we were solving the wrong drag model

This bullet has **two** published coefficients:

- **G1 = 0.462**
- **G7 = 0.320**

A G1 BC is measured against the **G1 reference projodal: a 10 lb, 1.275 in,
ROUND-NOSE projectile.** G7 was introduced precisely because that projodal does
not represent modern high-velocity boat-tailed bullets, which slip more
efficiently through the transonic region and retain more velocity than a G1
prediction allows.

So running our own solver on the correct model:

| Model | BC used | 1000 yd velocity | Error vs published |
|---|---|---|---|
| G1 | 0.462 | 1334 fps | **-4.34%** |
| G7 | 0.320 | 1388 fps | **-0.40%** |

**The G7 model matches the published velocity to within 0.40%.** The G1 model
is 4.3% low, which is exactly the expected disagreement between a boat-tailed
bullet and a reference projodal that is round-nosed.

**Our solver was correct all along. The validation was wrong**, because it
pinned `dragModel: 'G1'` on a bullet whose published G7 is the better fit.

This also explains the "0.491" fit. 0.462 G1 and 0.320 G7 are the *same
projectile* described against two different reference shapes, and the effective
drag they imply is close; the 6% is the systematic difference between the G1
projodal and a real boat-tail.

### What this means for the drop column

The drop figures we produce are internally consistent and physically correct,
but the reference drop column cannot be reconciled until we know which model
produced it. With the correct G7 model our 1000 yd drop is -374 in; the
recalled reference says -341 in. Since velocity now agrees to 0.4%, the
remaining 9% drop difference is a **convention question, not a physics
question** — most likely the reference measures from the bore or from a
horizontal muzzle line rather than from the line of sight through the zero.

**This is not resolved.** It needs a real table with a stated convention.

---

## Sources gathered

| Source | URL | What it gave | Status |
|---|---|---|---|
 Courtney, Morris & Courtney, "Accurate Measurements of Free Flight Drag Coefficients with Amateur Doppler Radar", arXiv:1608.06500 | https://arxiv.org/abs/1608.06500 | Confirms G1/G7 can be validated empirically to **1% or better** by Doppler radar, for Mach 0.3–3.0 and 4.4–9 mm projectiles. Establishes the accuracy bar our 0.40% velocity agreement is measured against. | **Retrieved and verified** |
| Wikipedia, "External ballistics" | https://en.wikipedia.org/wiki/External_ballistics | The G1/G7 framework, that wind drift is caused by drag not by "wind pushing," and that G7 is recommended for modern low-drag rifle bullets. Article is flagged as needing citations. | Retrieved; corroborated our diagnosis |
| Wikipedia, "Ballistic coefficient" | https://en.wikipedia.org/wiki/Ballistic_coefficient | BC definition, the Bashforth/Siacci history, and the list of primary references including the Sierra manual, Litz's *Applied Ballistics*, and the DTIC Doppler-radar studies. | Retrieved |
| Bohnenkamp, Hackert, Motley & Courtney, "Comparing Advertised Ballistic Coefficients with Independent Measurements", DTIC ADA554683 | https://apps.dtic.mil/sti/citations/ADA554683 | — | **Blocked (403).** Referenced by Wikipedia as the key study of advertised-vs-measured BC error. |
| Halloran, Huntsman, Demers & Courtney, "More Inaccurate Specifications of Ballistic Coefficients", DTIC ADA555975 | https://apps.dtic.mil/sti/pdfs/ADA555975.pdf | — | **Not retrieved.** |
| McDonald & Algren, *Sierra Loading Manual*, 5th ed., section 2.5 | — | The G1 standard projodal definition and the method of quoting BCs. | **Not retrieved.** |
| Litz, *Applied Ballistics for Long Range Shooting*, 2nd ed. 2011 | — | Standard reference for BC usage and wind. | **Not retrieved.** |

## Compilation logic, written out

So that a future reader can reproduce or challenge this:

1. **Fix the projectile and the conditions first.** A reference trajectory is
   meaningless without bullet, BC, both G1 and G7, muzzle velocity, zero
   distance, and the atmosphere it assumes. Ours: .308 Win, 168 gr Federal Gold
   Medal Match BT, G1 0.462 / G7 0.320, 2650 fps, 100 yd zero, 59 degF, ISA
   sea level, no wind.
2. **Choose the drag model by bullet shape, not by which coefficient is
   easier to type.** G1 for round-nose and historic data; G7 for modern
   boat-tailed rifle bullets. This is the single decision that mattered.
3. **Validate velocity first.** It integrates the drag coefficient directly and
   has no convention ambiguity, so it isolates physical error from
   presentational error.
4. **Check the error's SHAPE, not just its size.** Linear in range means a drag
   scale or BC mismatch. Random means a transcription or unit error. This step
   is what turned "we are 4% off" into a specific diagnosis.
5. **Fit a BC and see if it is physically plausible.** A fitted 6.3% above the
   stated value was the clue that the stated value belonged to a different
   model rather than that the solver was wrong.
6. **Only then look at drop**, and only against a table whose convention is
   stated.
7. **Prefer primary measurement over a calculator's output.** The Doppler radar
   work shows what "correct" means: ~1%. A published calculator table carries
   its own modelling choices and is a comparison, not a ground truth.

## Still open

- **The drop column is unreconciled.** Velocity now agrees to 0.40% on the
  correct model, so the physics is sound; the remaining difference is a
  reference convention we have not read stated. Needs a real table.
- **Our G1/G7 drag tables have not been compared line by line against a
  published copy.** They are internally consistent and produce correct
  velocities, but the table *values* themselves are from recall, not from a
  retrieved source. Given the 0.40% velocity agreement this is low risk, but it
  is not verified, and it is the one thing that would invalidate a 1000+ yard
  result if wrong.
- **No Doppler-radar measurement of this specific bullet.** The 1% accuracy
  figure in the literature is for other projectiles.

## What we would do to close it

1. Read the McCoy reference and one authoritative drag table, and diff our
   G1/G7 values against it. This is the highest-value remaining check.
2. Obtain one published trajectory table for a modern boat-tailed bullet with a
   stated drop convention, and reconcile.
3. Record the verdict in `docs/SOURCES.md` alongside the velocity result, so
   the next reader knows velocity is closed and drop is not.
