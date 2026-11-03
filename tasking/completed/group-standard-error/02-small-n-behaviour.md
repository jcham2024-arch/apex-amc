# 02 — Small-n behaviour, and how many shots are enough

**Task:** `group-standard-error`. **Every number in this file is DERIVED by the method stated,
not published.** No source states a minimum shot count — `01-` §5 of
`completed/handgun-coaching-feasibility` records the accuracy of shot-detection systems as
`not stated`, and this file is the same kind of gap: **the number is derived, and labelled so.**

---

## 1. Why small n is the whole problem

`SE = sigma_hat / sqrt(n)` shrinks as `1/sqrt(n)`, so a threshold expressed in SE units gets
**tighter** as n grows. That is the intent — but it means the rule is **most aggressive exactly
where the estimate is worst.**

Two distinct failures compound:

1. **The standard error itself is unreliable at small n.** It is built from a sample SD with
   `n - 1` degrees of freedom. At n=2, one degree of freedom.
2. **The sample SD is biased low**, which pushes the threshold down (§4 of `01-`).

**A rule that is unstable is worse than no rule**, because it produces confident, frequent,
wrong output. The user cannot tell a 2-sigma finding at n=3 from one at n=20 — the app looks
identical either way.

## 2. What the bias costs at each n

From the verified Monte Carlo (`01-` §3, §4):

| n | SE bias on `sigma_hat` | "2-sigma" false-alarm rate | vs nominal (4.6%) |
|---|---|---|---|
| 2 | **−20.3%** | not measured (1 dof) | — |
| 3 | **−12.0%** | **18.4%** | **4.0×** |
| 5 | −5.8% | 11.7% | 2.5× |
| 8 | −3.4% | 8.2% | 1.8× |
| 12 | ~−2.2% | 7.1% | 1.5× |
| 20 | −1.2% | 6.2% | 1.3× |

**The convergence is slow.** Even at n=20 the false-alarm rate is 35% above nominal. **There is
no n at which this is exact** — only n → ∞.

## 3. The derived minimum shot count

**The derivation, stated so it can be checked or rejected:**

The criterion: the false-alarm rate should be within 10% (relative) of its nominal value.
Measured directly (`tmp/gse/verify2.mjs`, n = 20…60):

```
 k=2, nominal 4.6%
n    20      25      30      40      60
rate 6.2%    5.7%    5.7%    5.5%    5.0%
x nominal  1.35   1.24   1.24   1.20   1.09
```

**The 10% criterion is reached at n ≈ 60, not n ≈ 30.**

```
DERIVED: n >= 60 for a 2-sigma rule at the 10%-of-nominal criterion.
```

**I initially wrote n≈30 by interpolating between n=20 (6.2%) and the nominal 4.6%, and then
measured n=30 directly: 5.7%, which is 24% over nominal, not 7%. The interpolation was wrong
because the bias decays as `1/(4n)` and does not reach nominal at 30.** Recording the correction
because the wrong number was the plausible-looking one.

**DERIVED, not published.** And the derivation is only as good as its criterion, which is mine:

| Criterion | Derived n (k=2, measured) |
|---|---|
| within 25% of nominal | **30** |
| within 10% of nominal | **60** |
| asymptote (exact) | never, for finite n |

**I am not recommending a number. I am showing that the number is a choice, and that the choice
has to be made deliberately by someone who owns the consequence.**

**And note what this does NOT license:** a higher `k` reduces the nominal rate but does not fix
the bias — at k=1 the rate is 32.5% at n=20 and still 32.4% at n=60, against a nominal 31.7%.
**Raising k does not repair small n; it only lowers the baseline.**

## 4. Where 30–60 shots is unrealistic

**A handgun string is commonly 5–10 rounds.** A 30-shot string is unusual outside a formal
event, and 60 is rarer still. So for the realistic case the honest conclusion is:

> **At typical n, a POI-offset threshold rule is not defensible.**

That does not mean the statistic is useless — it means the *decision* it supports is not
supported at small n. The statistic is still worth returning; **what must not happen is a
confident verdict derived from it.**

## 5. What a caller must do instead of guessing

Three specified behaviours, in order of preference:

1. **Refuse below the derived n.** If `n < threshold`, return the statistic **and an explicit
   "insufficient shots" state**. Do not silently widen the interval.
2. **Report n alongside the statistic, always.** A POI offset with no `n` beside it is
   unfalsifiable — and this repo has a standing rule against numbers without error bars
   (`data/reference/README.md`: *"A number with no error bar can never fail a comparison."*).
3. **Never convert a small-n result into a verdict.** Surface the measurement; say nothing
   about cause. This is the same rule that governs the whole shot-group feature, and it is not
   a statistics point — it is a safety point.

**Widening the interval to compensate is explicitly rejected.** A conservative interval makes
the rule fire less, which would silently hide real signal. Better to refuse than to guess.

## 6. What is NOT specified here

- **Any k value.** No source states one, and the choice depends on what a false positive costs
  — which is a domain judgement, not a statistical one.
- **Any confidence level.** `not stated` in every source reviewed.
- **Any claim about what a POI offset means.** Per this task's own prohibition, and per
  `completed/shot-group-taxonomy/`: a named instructor calls target-photo fault diagnosis "the
  most misused tool in the training industry." **This file supplies the uncertainty. It does not
  supply, and must not supply, an interpretation.**