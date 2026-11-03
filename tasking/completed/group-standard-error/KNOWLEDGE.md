# KNOWLEDGE — standard error for centre-of-impact rules

**Task:** `group-standard-error`. **Start here.** Derivation in `01-`, small-n in `02-`.

---

## The formula

```
SE(centre of impact, per axis) = sigma / sqrt(n)
```

**Every input already exists** in the `Dispersion` object — `sigma.x`, `sigma.y`, and `n`. This
is arithmetic on two fields the code already returns. `dispersion.ts` does **not** compute it
today.

## Verified, not asserted

20,000 Monte Carlo trials per n, known σ = 0.5 in, **seeded RNG** so it reproduces:

```
 n   sigma/sqrt(n)   empirical SD of mean   ratio
  3        0.28868                0.28820  0.9983
 10        0.15811                0.15746  0.9959
 30        0.09129                0.09163  1.0038
```

**Ratio 1.00 ± 0.008 at every n.** The formula is confirmed.

## The finding: the bias is in the DANGEROUS direction

`E[sigma_hat] < sigma` — **−20.3% at n=2, −12.0% at n=3.** Bessel corrects the variance's
mean bias but does not make `sigma_hat` unbiased, and the residual decays as `1/(4n)`.

**So a threshold set at `k * SE` is set too low, and fires too often:**

```
 k    n=3      n=5      n=8      n=20     nominal
  2    18.4%    11.7%     8.2%     6.2%      4.6%
```

**At n=3 a "2-sigma" rule fires 4× the promised rate.** The bias is worst at exactly the small
n where the estimate is least trustworthy. **An unstable threshold is worse than none, because
it produces confident, frequent, wrong output.**

## The derived shot count

**DERIVED, not published.** No source states one.

| Criterion (k=2) | Derived n |
|---|---|
| within 25% of nominal | **30** |
| within 10% of nominal | **60** |
| exact | never, finite n |

**A handgun string is 5–10 rounds. So at typical n, a POI-offset threshold rule is not
defensible.** Not "imprecise" — not defensible.

## Two corrections I made to my own work

**1. I interpolated n≈30, then measured it: 5.7%, not the ~4.9% I predicted** — 24% over
nominal, not 7%. **The plausible-looking number was wrong.** The 10% criterion needs n≈60.

**2. My Monte Carlo printed its tables inside the loop** because an `insert_line` landed
mid-loop. The numbers were stable across three runs (the seeded RNG made it deterministic), but
**a reproducible artifact still has to be readable to be evidence.** Fixed.

## The trap in the obvious fix

`standardErrorOfPoi` must return **`null` at n < 2, never `0`.**

`0` makes `|poi| > k * 0` **always true** — a rule that fires on every group. That is the same
shape of bug as the `|| 0` defect in `main.js`, and the most likely way to introduce this.

## What this file deliberately does NOT contain

**No k value. No confidence level. No interpretation.** The statistic is the deliverable; what
a POI offset *means* is not derivable from a standard error, and per
`completed/shot-group-taxonomy/` a named instructor calls target-photo fault diagnosis "the
most misused tool in the training industry."