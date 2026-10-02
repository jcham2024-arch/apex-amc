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
| **Manufacturer's own published load data, cited** | **blocked** on licensing — `published-load-lookup-spec` |

## The load ladder — settled by the owner, and it is the right call

The owner resolved the design question that had been blocking this:

> "We should be getting all the relevant data we need from the component manufacturers —
> they publish how much powder to use for what. I want to give the user that, **not
> necessarily our own calculated load**."

**This is materially safer and simpler than the interpolation engine an earlier task
assumed, because it removes calculation from the product entirely.** Every number a user
sees is a manufacturer's, attributed, dated and linked. The project becomes a good index
to authoritative data rather than a second and worse source of it.

What was replaced: `load-ladder-interpolation-spec` asked for nearest-neighbour
interpolation over published tables. **Interpolation is now explicitly out of scope** —
an interpolated figure looks identical to a sourced one and is not, and that
indistinguishability is the exact failure the design has to prevent. The lookup either
finds what a manufacturer published, or it says no manufacturer publishes it.

The safety property that remains is the **refusal**: a lookup that cannot say "no
manufacturer publishes this combination" is unsafe by construction. The precedent is
Hornady's own 12th Edition carrying a misprinted powder for 6.5 PRC that should read
StaBall HD — a name-matching system inherits that risk with no erratum channel.

**Still blocked**, and it is a commercial decision rather than an engineering one:
what we may *store, cache or republish* is different from what we may *cite and link*,
and those are three different permissions. Berger is © CGP, Vihtavuori is © Nammo,
Hornady's handbook is sold. See `FIX-BACKLOG.md` item 10.

## Retailer pricing — also blocked, for a different reason

Live prices with links to the best source. Scraper writing is the obvious approach and
the wrong one: retailer terms of service generally prohibit it, and a scraped price is
a snapshot that silently decays. `retailer-price-data-options` is researching the
lawful routes — published feed specifications and affiliate networks.

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