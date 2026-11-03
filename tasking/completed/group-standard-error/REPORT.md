# REPORT — group-standard-error

**Task:** `tasking/in-progress/group-standard-error/`. **Derived from:**
`tasking/completed/shot-group-taxonomy/KNOWLEDGE.md`. **Nothing was implemented in
`packages/`** — this is a specification, per the task's prohibitions.

---

## What I did

Derived the standard error of the centre of impact per axis, **verified it numerically against
synthetic groups with a known sigma**, measured what the small-sample bias does to a
k-sigma rule, and specified the function signature — including the edge case most likely to be
implemented incorrectly.

| File | Contents |
|---|---|
| `01-derivation.md` | The formula, the Monte Carlo verification, the bias, the false-alarm table, the signature |
| `02-small-n-behaviour.md` | Why small n is the whole problem; the derived shot count; caller obligations |
| `KNOWLEDGE.md` | One page |

## What I found

**1. The formula is confirmed, not assumed.** `SE = sigma / sqrt(n)`. Empirical/predicted
ratio **1.00 ± 0.008 across n = 2…30**, 20,000 trials each, seeded RNG.

**2. Every input already exists.** `sigma.{x,y}` and `n` are all returned by `dispersion()`.
This is arithmetic on existing fields — the cheapest possible addition to the codebase.

**3. The sample-SD bias is in the dangerous direction.** `E[sigma_hat] < sigma`:
**−20.3% at n=2, −12.0% at n=3**, decaying as `1/(4n)`. So `k * SE` is a threshold set **too
low**, and the rule **fires more often than promised**:

| k=2 | n=3 | n=5 | n=8 | n=20 | nominal |
|---|---|---|---|---|---|
| false-alarm rate | **18.4%** | 11.7% | 8.2% | 6.2% | 4.6% |

**At n=3, four times the promised rate.** This is the brief's "worse than no threshold", now
quantified: not imprecise, but **confidently wrong, most often, where it is least trustworthy.**

**4. The derived minimum shot count is n≈60, not the n≈30 one might expect.** And a handgun
string is 5–10 rounds. **At typical n, a POI-offset threshold rule is not defensible.** No
source states any of these numbers — they are derived here and labelled **DERIVED**.

**5. The most likely implementation bug is returning `0` at n < 2**, which makes
`|poi| > k*0` always true. That is the same shape as the `|| 0` defect in `main.js` found
earlier today. Specified as `null`.

## What I did NOT do, and why

- **I did not implement anything in `packages/`.** Explicitly prohibited. `dispersion.ts` is
  untouched.
- **I did not propose a k value or a confidence level.** No source states one, and inventing
  one is what this repo's rules exist to prevent. `02-` §3 shows the *dependence* on the
  criterion instead of picking one.
- **I did not name shooter faults or interpret a POI offset.** Explicitly prohibited, and the
  instruction is right: a standard error says how noisy a number is, never what it means.
- **I did not specify a radial or correlated standard error.** `dispersion.ts` treats the axes
  as independent; adding a covariance term is a modelling change, not a specification.

## Two corrections to my own work

**1. I derived n≈30 by interpolation, then measured it: 5.7%, not ~4.9%.** That is 24% over
nominal, not 7% — the 10% criterion needs **n≈60**. The interpolated number was the
plausible-looking one and it was wrong. Corrected in `02-` §3 with the correction recorded, not
quietly overwritten.

**2. My verification script printed its tables inside the loop**, because an `insert_line`
landed mid-block. The numbers were **stable and identical across three runs** — the seeded RNG
guaranteed determinism, so the *data* was sound — but an artifact nobody can read is not
evidence. Fixed, and the false-alarm table re-measured separately (`verify2.mjs`) rather than
accepted from the broken run.

## Unresolved

1. **Which criterion should set the required n?** 25%, 10%, or 5% of nominal is a judgement
   about what a false positive costs — a domain decision, not a statistical one. **Deliberately
   left open.**
2. **Does `main.js`'s `|| 0` defect have the same root cause?** Both convert an unknown into a
   confident zero. Whether one fix should cover both is an owner's call; `main.js` is outside
   this write-set.
3. **Whether `n` should be required in the `Dispersion` interface** or derived. It is already
   present, so this is moot unless the interface changes.

## Verification

```
$ node tmp/gse/verify.mjs
ratio column: 0.9923 0.9983 0.9970 1.0078 1.0008 1.0039 0.9959 1.0023 1.0030 1.0038
   -> 1.00 ± 0.008 across n = 2..30, 20000 trials each, seed 20261002

$ node tmp/gse/verify2.mjs
k=2 false-alarm: n=20 6.2%  n=25 5.7%  n=30 5.7%  n=40 5.5%  n=60 5.0%   (nominal 4.6%)
```

All four files: LF only, no BOM, no lone CR.
`git status --porcelain -- packages data scripts apps package.json` — **no changes of mine.**