# 01 — Derivation: standard error of the centre of impact

**Task:** `group-standard-error`. **Specification only — nothing was implemented in
`packages/`.** Every quantity below is labelled **derived** or **published**. No threshold is
proposed as if it were sourced.

---

## 1. The problem, stated precisely

`centreOfImpact(shots)` in `packages/ballistics-core/src/dispersion.ts` returns the arithmetic
mean of the observed impacts. The file's own comment is precise about what it is:

> Uses the Bessel-corrected (`n - 1`) standard deviation. The centre of impact is estimated
> from these same shots, so a degree of freedom is consumed by that estimate…

**So the code already knows a degree of freedom is consumed — for `sigma`.** It does not carry
that reasoning forward to the *centre*. The centre has its own, separate uncertainty, which
grows as `1/sqrt(n)`, and **nothing in the returned `Dispersion` object expresses it.**

## 2. The derivation

Let `x_1 … x_n` be the shot coordinates on one axis. The sample mean is `x̄`, and `sigma_hat`
is the Bessel-corrected sample SD the code already computes.

**Standard error of the mean:**

```
SE(x̄) = sigma_hat / sqrt(n)
```

`sigma_hat` is already in `Dispersion.sigma.x` (or `.y`), and `n` is already in
`Dispersion.n`. **Every input to this formula is already returned.** The function would be
arithmetic on existing fields, not new estimation.

**The two axes are independent** (a shot's x and y are treated as independent by
`dispersion.ts`), so `SE` is computed per axis. **A combined radial standard error would
require the covariance and is NOT specified here** — the code assumes independence, and
adding a covariance term would be a modelling change, not a specification.

## 3. Numerical verification

**The brief requires verification against synthetic groups with a known sigma.** Done in
`tmp/gse/verify.mjs`: 20,000 Monte Carlo trials per `n`, known σ = 0.5 in, **seeded RNG
(`seed = 20261002`) so the result is reproducible rather than a lucky pass.**

```
 n   sigma/sqrt(n)   empirical SD of mean   ratio   Bessel E[sigma_hat]  bias %
  2        0.35355                0.35085  0.9923             0.39840  -20.32
  3        0.28868                0.28820  0.9983             0.43986  -12.03
  4        0.25000                0.24924  0.9970             0.46254   -7.49
  5        0.22361                0.22536  1.0078             0.47085   -5.83
  6        0.20412                0.20429  1.0008             0.47643   -4.71
  8        0.17678                0.17747  1.0039             0.48324   -3.35
 10        0.15811                0.15746  0.9959             0.48679   -2.64
 15        0.12910                0.12939  1.0023             0.49142   -1.72
 20        0.11180                0.11214  1.0030             0.49422   -1.16
 30        0.09129                0.09163  1.0038             0.49631   -0.74
```

**The ratio column is 1.00 ± 0.008 at every n.** The formula is confirmed: the empirical
spread of the centre is `sigma/sqrt(n)` to within Monte Carlo error.

**The bias column is the finding.** `E[sigma_hat] < sigma` at every n, worst at small n:
**−20.3% at n=2**, −12.0% at n=3, falling to −0.74% at n=30. Bessel's correction removes the
*mean* bias in the variance; it does not make `sigma_hat` an unbiased estimator of `sigma`,
## 4. Why that bias is dangerous: it inflates the false-alarm rate

If a rule sets its threshold at `k * SE` using `SE = sigma_hat / sqrt(n)`, and `sigma_hat` is
biased **low**, the threshold is set **too low**, and the rule **fires more often than
promised.** Measured under the null that the true centre is exactly zero — so every firing is a
false alarm:

```
 k    n=3      n=5      n=8      n=12     n=20
  1    42.5%    37.3%    35.2%    33.5%    32.5%      (nominal 31.7%)
1.5    27.2%    20.8%    18.0%    15.9%    14.7%      (nominal 13.4%)
  2    18.4%    11.7%     8.2%     7.1%     6.2%      (nominal  4.6%)
```

**At n=3 a "2-sigma" rule fires 18.4% of the time instead of 4.6% — four times the promised
rate.** That is 1 firing in 5 groups that should have been silent.

**This is the concrete answer to "a threshold based on an unstable standard error is worse than
no threshold."** It is not merely imprecise. **It is biased in the dangerous direction, and the
bias is worst at exactly the small n where the estimate is least trustworthy.**

## 5. Specification — function signature only, not implemented

```ts
/**
 * Standard error of the centre of impact, per axis.
 *
 * DERIVED: SE = sigma / sqrt(n) per axis. Verified by Monte Carlo against
 * synthetic groups with a known sigma; empirical/predicted ratio 1.00 ± 0.008
 * for n = 2..30 (tasking/completed/group-standard-error/01-derivation.md).
 *
 * CAVEAT the caller must honour: sigma is the Bessel-corrected sample SD, and
 * E[sigma_hat] < sigma, so this UNDERSTATES the true standard error. Measured
 * bias: -20.3% at n=2, -12.0% at n=3, -0.74% at n=30. Any threshold set at
 * k * this value fires more often than k-sigma nominal -- measured 18.4% at
 * n=3 for k=2, against a nominal 4.6%.
 *
 * Returns null when n < 2: with one shot there is no dispersion, and the
 * existing dispersion() already returns null in that case.
 */
export function standardErrorOfPoi(d: Dispersion): { x: number; y: number } | null
```

**Why `null` at n < 2 and not `NaN` or `0`:**

- `NaN` propagates silently and renders as `"NaN"`.
- `0` would make `|poi| > k * 0` **always true** — a rule that fires on every group. **This is
  the failure mode most likely to be introduced by a careless fix, and it is the same shape of
  bug as the `|| 0` defect in `main.js`.**
- `null` forces the caller to handle the case, and is consistent with `dispersion()` already
  returning `null` for `n < 2`.

**No radial/correlated form is specified.** See §2 — the code assumes axis independence.

## 6. Does `dispersion.ts` compute this today?

**No.** `Dispersion` exposes `poi`, `n`, `sigma.{x,y}`, `cep50`, `cep90`, `extremeSpread`,
`meanRadius`. **No field expresses the uncertainty of `poi`.** Confirmed by reading the
interface, not by assuming.

**Every input is already present.** This is `sigma / sqrt(n)` on two fields the object already
carries — the cheapest possible addition to the codebase, and the reason this specification is
small.
and the residual bias decays as `1/(4n)`.