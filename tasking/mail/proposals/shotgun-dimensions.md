---
proposal: shotgun-dimensions
title: Shotgun gauge coverage and dimension source availability
derived_from: tasking/completed/ammoseek-coverage/KNOWLEDGE.md
evidence: "We hold 0 of 8 gauges... But SAAMI's free drawings page names 12 Gauge and 28 Gauge explicitly, and CIP TDCC covers shotgun dimensions. So the emptiest category is also among the cheapest to fill."
shape: research
priority: medium
write_set:
  - tasking/completed/shotgun-dimensions/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-source-availability.csv
  - 02-per-gauge-verdict.md
---

## Why

The emptiest category is among the cheapest to fill. SAAMI free drawings explicitly name 12 Gauge and 28 Gauge, and CIP TDCC covers shotgun dimensions. This task establishes which sources exist and what they permit; it does not touch safety limits.

## Scope

- Establish which of the 8 gauges have a free, named, primary dimensional source, and which are paywalled or restricted.
- Identify what the 4 Bore Rifle row - the only row filed as shotgun, created as a pressure placeholder - should actually be, or whether it should not exist.
- Record, per gauge, whether any safety-limit figure is available, and mark it as a separate open item if it is paywalled. Do not seek the value and do not reason about it.
- Cross-reference the licence question in tasking/completed/cartridge-dimensions/REPORT.md. Do not re-derive it.

## Do not

- Do not transcribe a value from a restricted source. Record the source and the permission status only.
- Do not resolve the CIP licensing question here. cartridge-licence-reconciliation owns it.
- Do not source, compare, or reason about any chamber safety limit. Recording availability is the deliverable; the value is not. See tasking/completed/interior-ballistics/KNOWLEDGE.md.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
