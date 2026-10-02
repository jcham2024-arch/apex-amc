# Product direction

The owner's statement of what this project is for, and the constraints that follow from
it. Recorded 3 Oct 2026 because it is the reason several tasks exist and the test every
later proposal should be measured against.

---

## What the site is for

> "We want the user to come to us to see what they want to build, how to build it, and
> where the best place to buy the parts are."

Three jobs, in that order: **decide what to build, learn how to build it, find where to
buy it.** Cost is the thread running through all three — not a calculator bolted on, but
the number that ties a component choice to a purchase.

## What that requires

| Need | State |
| --- | --- |
| All caliber presets, dropdown not buttons | `caliber-preset-selector` |
| Every page section a module, not hardcoded | `site-modular-architecture` |
| Ballistics reachable from the main page | `ballistics-surface-spec` |
| Primer, powder, projectile with real prices | `component-cost-model` |
| Tax and shipping | `component-cost-model` |
| User can override with their own prices | `component-cost-model` |
| Links to cheapest/fastest source, price shown | **blocked** on retailer data |
| Safe load ladder from chosen components | **blocked** on licensed load data |

## Two things that are blocked, and why

**Retailer pricing.** The owner wants live prices with links to the best source. Scraper
writing is the obvious approach and the wrong one: retailer terms of service generally
prohibit it, and a scraped price is a snapshot that silently decays. `retailer-price-data-options`
is researching the lawful routes — published feed specifications and affiliate networks.

**The load ladder.** This is the one to read carefully. The physics cannot do what the
owner described, and the swarm established why before the request was made:

> No manufacturer publishes a burn rate, pressure exponent, force curve, heat of
> explosion, or loading density for any reloading powder we hold. Fitting powder
> constants from published load data yields a **degenerate family, not an estimate**.
> — `tasking/completed/interior-ballistics/KNOWLEDGE.md`

**But the feature is still buildable**, and the same research says so — as nearest-
neighbour interpolation over published load tables with **mandatory EMPTY on an
unresolvable match**, which is exactly what Berger and Hornady do by hand. That is a
real, valuable, safe product. It is blocked on **licensed citable load observations,
which we hold none of** — Hornady sells theirs. That is a commercial decision with legal
exposure, and it is `FIX-BACKLOG.md` item 10.

## The constraint that applies to all of it

Every surface here renders data that is mostly **absent** — six dimensional columns are
0/229, powders have no prices, primers do not exist. So the unknown-state rule from
`ui-research` is not one requirement among many; it is the design:

> **Design the unknown state before the known one.** A blank cell reads as zero.

A cost calculator that silently shows `$0.00` for an unknown price is worse than one that
says "not recorded," because the user will act on it. **A fabricated price in a cost
calculator is worse than no calculator.**

## Related

- [FIX-BACKLOG.md](FIX-BACKLOG.md) — item 9 (CIP licensing), item 10 (load-table licensing)
- [LESSONS.md](LESSONS.md) — lesson 6, read intent not keywords
- [../mail/README.md](../mail/README.md) — §12, why these tasks exist and who may run them