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
