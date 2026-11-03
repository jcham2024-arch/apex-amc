# Ballistics oracle research

Output directory for task **T2** in `.cline/tasks/ledger.json`. Written by a
read-only research agent. **No source file was edited from here** —
`packages/ballistics-core/` is safety-critical and was read only.

## What this directory is for

The project has three ballistics defects that shipped while every test passed,
because the tests shared the author's assumptions. These files ask a narrow
question: **what evidence exists outside this repository that could catch that class
of error?**

The governing rule is the one in
[`../../data/reference/README.md`](../../data/reference/README.md): *a number with
no error bar can never fail a comparison.* Everything here is filtered through that.

## Files

| File | Contents |
|---|---|
| [`01-methods-found.md`](01-methods-found.md) | Four verification methods with equations, stated uncertainties, and an explicit independence assessment |
| [`02-candidate-datasets.md`](02-candidate-datasets.md) | Six candidate datasets, each put through the three-part oracle test, with a verdict |
| [`03-solver-gap-analysis.md`](03-solver-gap-analysis.md) | Where the solver agrees, disagrees and is silent, quoting the code |

## The headline

**Three genuinely independent methods are not available today. Two are.**

The three Courtney papers nominated in the brief are one research group, one
method and one set of apparatus — not three confirmations. What we actually have is
one published tabulation (McCoy) and one independent primary measurement (BTG
free-flight), and they agree. Full reasoning in
[`03-solver-gap-analysis.md`](03-solver-gap-analysis.md) §6.

## The finding worth acting on

The solver has **no representation of bullet stability at all** — no yaw model, and
twist rate is not a solver input. Measurement in arXiv:1309.5039 puts the resulting
BC error at up to ~36% as stability falls toward 1.0, and the solver emits no
warning when a load is marginal. That is the highest-priority gap found here, and it
is a **research task**, not a patch: `packages/ballistics-core/` was deliberately
not modified.

Second: `data/reference/measured_data.csv` holds **one** measurement-grade oracle
row, not seven. Three rows carry a ±15 fps tolerance this project imposed rather
than one a source published.

## Honest limits of this work

- The per-Mach drag coefficients in arXiv:1510.07336 exist only in a **figure**.
  They are recorded as endpoints and left blank, not digitised.
- All four papers are **arXiv preprints**. Peer review was not verified for any of
  them.
- Per-point uncertainties on the BC-vs-stability tables are described by the authors
  as "relatively large" but are **not tabulated**. Left blank.
- Every blank is a deliberate blank. See
  [`01-methods-found.md`](01-methods-found.md) § "What I left blank, and why".

## Status

Research complete. **Nothing here has been applied to the solver**, and applying it
is a later, separately-gated task.