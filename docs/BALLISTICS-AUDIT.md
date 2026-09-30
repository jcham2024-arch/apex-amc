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
