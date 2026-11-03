---
proposal: centre-standard-error
title: Compute the standard error of the centre of impact in dispersion.ts
derived_from: tasking/completed/handgun-coaching-feasibility/01-measurement-accuracy.md
evidence: "`centreOfImpact` returns the **mean of the shots taken**. So a 'high group' is a
  statement about the *centre of the shots taken*, not about the shooter's intent or a fault's
  mean. For that offset to imply a fault it must be **larger than the sampling noise of the
  centre** — which depends on group size and shot count, and is not computed by
  `dispersion.ts`. ... A group with a large `sigma` can drift its centre substantially on a
  small `n` with no change in technique whatsoever. **Any rule of the form "if `poi.y` >
  threshold then vertical fault" must state that threshold in units of the group's own standard
  error, or it will fire on noise.** No source I found states such a threshold, and I have left
  it **EMPTY** rather than inventing one — this is the single most important gap if the feature
  proceeds."
shape: change
priority: high
write_set:
  - packages/ballistics-core/src/dispersion.ts
  - packages/ballistics-core/src/dispersion.test.ts
required_outputs:
  - REPORT.md
---

# Proposal: the standard error of the centre of impact

## Why this is `shape: change` and not research

It adds a **function to production code**. `.clinerules` §12 permits `shape: research` to
write only inside its own `completed/` folder; anything touching the application waits for the
owner. This touches `packages/ballistics-core/src/dispersion.ts`, so it waits.

## The problem

`centreOfImpact(shots)` returns the arithmetic mean of the observed impacts. Every downstream
use treats that mean as a property of the shooter. It is not: it is a sample mean, and it
carries sampling error that depends on `sigma` and `n`.

The standard error of a sample mean coordinate is `sigma / sqrt(n)`. The quantity already
exists in the returned object — `sigma.x`, `sigma.y` and `n` — so this is a few lines, not a
redesign. `dispersion.ts` already does Bessel correction for `sigma`; the standard error of
the *centre* needs the `n - 1`-aware form to be consistent with it.

## Why it matters beyond this one feature

1. **It makes a currently-untestable rule testable.** Any diagnostic threshold expressed in
   inches is meaningless without knowing whether the observed offset exceeds its own noise.
   Today there is no way to check that, so such a rule can only be guessed.
2. **It is a genuine correctness property of an existing API.** `Dispersion` returns `poi` and
   `sigma` as separate fields; any consumer combining them is already doing this arithmetic by
   hand, possibly incorrectly.
3. **It is cheap, bounded, and testable** — the rare kind of change that needs no permission
   debate.

## What the task would do

- Add `standardErrorOfPoi(): { x: number; y: number }` returning `sigma / sqrt(n)`, derived
  consistently with the existing Bessel correction.
- Add tests including the edge cases this codebase already cares about: `n = 2` (returns
  `null` or a documented sentinel — **not** `NaN`), and an all-coincident group where
  `sigma = 0` must return exactly `0`, following the same reasoning already documented in
  `detectFlyer` for the relative-tolerance check.
- Record the constant in `packages/ballistics-core/src/provenance/constants.ts` per rule 7 —
  **or** derive it entirely from existing constants if that can be done without inventing one.
  This is the part most likely to need owner input.
- **Do not add any fault mapping, threshold, or interpretation.** This task supplies the
  statistic; it does not decide what number is enough to claim a cause. That decision has no
  sourced answer and inventing one is what `shot-group-taxonomy` warns against.

## Evidence that this is not speculative

Two independent completed tasks hit the same gap:

- `tasking/completed/shot-group-taxonomy/04-rebuttals-and-exceptions.md` §5, under "The
  quantitative problem: a POI offset is not evidence of a constant fault."
- `tasking/completed/handgun-coaching-feasibility/01-measurement-accuracy.md` §6, which
  concludes the same thing and adds that the coaching feature is blocked on it.

**A note on a near-duplicate:** `tasking/mail/proposals/group-standard-error.md` was filed
separately by another agent and has been materialised into `pending/`. **That task is very
likely this proposal under a different name.** I am not filing this as new work to be run twice;
I am recording that the swarm converged on the same finding from two directions, which is
useful signal. **If `group-standard-error` is picked up, this proposal should be closed as
duplicate rather than executed in parallel.**

## The recommendation I am NOT making

I am not proposing a confidence level, a threshold, or a mapping from offset to fault. Those
require a sourced basis that **does not exist**, and this swarm's rules forbid inventing one.
Supplying the standard error is the honest prerequisite; the decision it enables is the
owner's, informed by a number rather than a guess.