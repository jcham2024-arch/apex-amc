---
proposal: load-interpolation-schema
title: Schema and EMPTY semantics for load-data interpolation
derived_from: tasking/completed/interior-ballistics/05-feasibility-verdict.md
evidence: "The achievable goal is an interpolation engine over published load data, with mandatory EMPTY on an unresolvable match - which is exactly what Berger and Hornady do by hand."
shape: research
priority: high
write_set:
  - tasking/completed/load-interpolation/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-match-keys.md
  - 02-empty-semantics.md
---

## Why

`05-feasibility-verdict.md` concludes that a genuine interior-ballistics calculator
is not achievable from published data, but an interpolation engine over published
load tables is — and is what two manufacturers already do by hand.

The verdict also names the one design decision that makes it safe: **mandatory EMPTY
on an unresolvable match.** This task exists to specify that emptiness before any
lookup code exists, because EMPTY is a correctness property, not an error path. Get
it wrong and the product confidently returns a load it cannot support.

## Scope

Specify, as data and prose, with no interpolation logic yet:

- **Match keys.** Which published fields must agree for a row to be a candidate:
  cartridge, bullet make/model, powder, bullet weight, projectile length. Include
  which of these have usable coverage across the sources we can read, and which are
  absent — an unmatchable key is the most likely EMPTY trigger.
- **Disagreement semantics.** When two sources give different velocities for the
  same row, which wins and why. Manufacturer-published data vs crowd-observed must
  not be silently averaged.
- **EMPTY conditions, exhaustively enumerated.** Below what combination of matched
  keys must the answer be EMPTY rather than approximate? Include: no powder match,
  no projectile match, single-source-only row, and any row where the interpolation
  would extrapolate beyond the matched envelope.
- **Provenance of every returned value.** A returned number must name its source
  row. A number that cannot name its source is EMPTY by definition.

## Do not

- **Do not compute, interpolate, extrapolate, or fit any charge weight.** This task
  is a specification. Producing a charge weight is out of scope and unsafe.
- Do not build the engine, the loader, or the schema file in `data/`. Output stays
  in this folder.
- Do not treat a crowd-reported velocity as equivalent to a manufacturer-published
  one. Their provenance classes must stay distinguishable in the spec.

## Why this is safe to run unattended

Output-only, inside this folder, and it cannot emit a charge weight — the
specification's central deliverable is the list of conditions under which the
product returns nothing at all.