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
| **Manufacturer's own published load data, cited** | `published-load-lookup-spec` — **unblocked by owner decision** |

## The load ladder — settled twice, by the owner

**First the design, then the licence. Both were the owner's calls, and both were better
than what I had written.**

> "We should be getting all the relevant data we need from the component manufacturers —
> they publish how much powder to use for what. I want to give the user that, **not
> necessarily our own calculated load**."

**This removes calculation from the product entirely.** Every number a user sees is a
manufacturer's — attributed, dated, linked. The project becomes a good index to
authoritative data rather than a second and worse source of it.

> "Cite and link. If we are not able to give the user that data, then they need to go buy
> the book. That keeps us legally safe."

**We store, cache and republish nothing.** We cite the source, attribute it, link to it,
and say plainly when a figure lives behind a purchase the user must make themselves.

### What that makes unnecessary — simplification, not just compliance

A `recipes` dataset. A load-data schema and migration. Staleness handling for load
figures — we display a link, not a snapshot. Per-edition correction tracking, because
the manufacturer's edition *is* the source.

### The line that still needs care

**Storing a pointer is not storing a value.** Knowing "Berger publishes load data for
bullet X at this URL, edition N" is metadata and is what makes routing possible. Copying
the numbers off that page into `data/` is redistribution and is not permitted. The
lookup cannot route a user to a page without knowing the page exists, so it must store
metadata — carrying no quantities of any kind, only who publishes what, where, in which
edition, and whether it is free or behind a purchase.

### What survived unchanged

**The refusal requirement.** A lookup that cannot say "no manufacturer publishes this
combination" is unsafe by construction, and where the number comes from is irrelevant to
the hazard: Hornady's own 12th Edition carries a misprinted powder for 6.5 PRC that
should read StaBall HD. A name-matching system inherits exactly that risk with no
erratum channel to catch it.

**Interpolation stays out of scope** — an interpolated figure looks identical to a
sourced one and is not. The lookup either finds what a manufacturer published, or says
nobody publishes it.

## Retailer pricing — blocked, for a related reason

Live prices with links to the best source. Scraper writing is the obvious approach and
the wrong one: retailer terms of service generally prohibit it, and a scraped price is
a snapshot that silently decays. `retailer-price-data-options` is researching the
lawful routes — published feed specifications and affiliate networks.

The owner's licence decision here was *cite and link*. The parallel open question is
whether **prices** may be stored under an affiliate feed, which is a different permission
from storing load data and has not been decided.

## The constraint that applies to all of it

Every surface here renders data that is mostly **absent** — six dimensional columns are
0/229, powders have no prices, primers do not exist. So the unknown-state rule from
`ui-research` is not one requirement among many; it is the design:

> **Design the unknown state before the known one.** A blank cell reads as zero.

A cost calculator that silently shows `$0.00` for an unknown price is worse than one that
says "not recorded," because the user will act on it. **A fabricated price in a cost
calculator is worse than no calculator.** The same rule governs the load lookup: a
sourced figure and a derived one must never share a visual treatment.

## Related

- [FIX-BACKLOG.md](FIX-BACKLOG.md) — item 9 (CIP licensing), item 10 (load-table licensing)
- [LESSONS.md](LESSONS.md) — lesson 6, read intent not keywords; lesson 14, insulation comes from a contract
- [../mail/README.md](../mail/README.md) — §12, why these tasks exist and who may run them