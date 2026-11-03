---
proposal: poise-required-n
title: Carry the shot count with every centre-of-impact reading
derived_from: tasking/completed/group-standard-error/02-small-n-behaviour.md
evidence: "3. **Report n alongside the statistic, always.** A POI offset with no `n` beside it
  is unfalsifiable — and this repo has a standing rule against numbers without error bars
  (`data/reference/README.md`: *\"A number with no error bar can never fail a comparison.\"*)"
shape: change
priority: medium
write_set:
  - packages/ballistics-core/src/dispersion.ts
required_outputs:
  - REPORT.md
---

# Proposal: `n` must travel with every centre-of-impact reading

## Why this is separate from adding `standardErrorOfPoi`

Adding the statistic is arithmetic (`sigma / sqrt(n)` on fields already returned). **This is
about making the existing `poi` field unfalsifiable no longer possible** — which is a different
defect, and it is the one that survives the other fix.

## The problem

`Dispersion` already carries `n`, and `centreOfImpact()` returns a bare `{x, y}`. **Any caller
can read `poi` without ever seeing how many shots produced it.** Two groups can share a POI
offset and mean completely different things:

| | n=3 | n=30 |
|---|---|---|
| POI offset | 0.15 in | 0.15 in |
| SE of centre | 0.36 in | 0.08 in |
| a "2-sigma" rule fires | **18.4%** of the time | **5.7%** of the time |

**The number is identical. The meaning is not.** And the app's rendering path has no way to
tell them apart, because `n` is not part of the value being rendered.

## Why this is the highest-value part of this task's work

The `standardErrorOfPoi` fix gives a caller the tool. **It does not force them to use it.** A
field that exists and is optional stays optional, and the first caller who omits it reintroduces
the exact defect `handgun-coaching-feasibility` identified:

> A group with a large `sigma` can drift its centre substantially on a small `n` with no change
> in technique whatsoever.

**A POI without n is that sentence, in code.**

## What is proposed

1. **Document `n` as mandatory context on every rendering of `poi`.** A JSDoc contract, since
   the field itself cannot change type without breaking callers.
2. **Add the derived minimum `n` as an exported, named constant** — **labelled DERIVED**, with
   the criterion and the measurement in its provenance entry, per `.clinerules` §5 rule 7. It is
   a derived quantity, not a physical constant, and the provenance module should say so.
3. **A negative test that fails on the dangerous case:** an object where `n < 2` must yield
   `null`, never `0`. `0` makes `|poi| > k*0` always true — a rule that fires on every group,
   and **the same shape of bug as the `|| 0` defect in `main.js`.**

## What is NOT proposed

- **No k value.** No source states one; it is a judgement about what a false positive costs.
- **No interpretation of a POI offset.** Per this task's own prohibitions, and per
  `completed/shot-group-taxonomy/`: a named instructor calls target-photo fault diagnosis "the
  most misused tool in the training industry." **This supplies uncertainty. It must never
  supply meaning.**
- **No threshold value presented as sourced.** The n≈60 figure is **derived here** and the
  criterion behind it is the owner's to change.

## Related, and possibly one fix

`completed/unknown-state-design/` found **7 occurrences of `|| 0`** in
`apps/website/src/main.js`, where an unpriced input renders as `$0.000` and break-even renders
"0 rounds". **That is the same shape of defect: an unknown rendered as a confident number.**
Proposal `no-zero-defaults` covers it. **Whether one policy should cover both — "no unknown
may render as a number" — is an owner's call, and it is worth making.**