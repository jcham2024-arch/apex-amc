---
proposal: site-modular-architecture
title: Every page section becomes a module, not a hardcoded block
derived_from: tasking/completed/ui-research/KNOWLEDGE.md
evidence: "The site is one self-contained HTML file under a strict CSP. The CSP constraint is why the design is coherent, and it also decides which module mechanisms are available."
shape: research
priority: highest
write_set:
  - tasking/completed/site-modular-architecture/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-section-inventory.md
  - 02-module-contract.md
  - 03-migration-plan.md
  - 04-csp-and-size-analysis.md
---

## Why

The owner asked that every piece of the main page be a module we add, not a hardcoded item. Today apps/website/src/index.html is one 593-line file with the calculator, the retailer directory and the content sections all inline. Nothing can be added, removed or reordered without editing that file, and two agents adding two sections at once would collide in the same markup.

## Scope

- Inventory every section currently in index.html: its id, purpose, data dependencies, and whether it renders from a data module or hardcoded markup. This table is the input to everything else here.
- Define a module contract: what a section declares (id, title, data source, render function, whether it needs a nav entry) and what the page does with it. Concrete enough that a third party could add a section without reading the page source.
- State the ORDER problem honestly. A registry gives add and remove, but visual order matters on a landing page and a registry has no natural order. Propose the mechanism and say what it costs.
- Specify migration as INDEPENDENT change sets, one per section, each verified alone. A migration that only passes as a whole cannot be reviewed.
- Address the CSP head-on, because it decides the answer: no inline styles, no new remote origins, no icon fonts, one self-contained HTML file. State which module mechanisms survive - ES modules are fine, a bundler is not, dynamic import may be.
- Say what this costs in bytes. The site is 96.3 KB today and the CSP forbids loading anything it did not already load. If modularity pushes past a threshold that matters, give the number.

## Do not

- Do not restructure the page. Produce the contract, the inventory and the plan.
- Do not propose anything adding a runtime dependency, a new remote origin, an inline style, or a bundler step. check-website-build will fail the build.
- Do not design the visuals of any section. Modularity only.

Seeded by `scripts/tasking/seed-wave.mjs` from the matching `waveN.spec.json`,
which holds the same record as the task manifest. Neither was hand-typed, so they
cannot drift apart.
