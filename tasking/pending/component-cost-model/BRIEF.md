# BRIEF — Cost model - tax, shipping, provenance, and user override

**Task id:** `component-cost-model` · **Priority:** highest
**Grounded in:** `tasking/completed/ui-research/KNOWLEDGE.md`

## The owner changed the model, 3 Oct 2026 — read this before designing anything

The brief below originally treated cost as arithmetic: gather a price per component, add tax
and shipping, divide by the count. **That is not what the owner needs, and the correction
came from his own shopping trip:**

> "I drove 30 minutes and overpaid for the primers I like because they were all out
> everywhere else. **Availability is the driving factor.**"

**A price the user cannot obtain is worth zero, and the cheapest available option is often
not the cheapest option.** This inverts the model. Optimising for price when the item is not
in stock produces advice that is wrong in the only way that matters — the user drives home
with something they did not want, or drives two hours.

### The cost model therefore ranks by LANDED availability-adjusted cost

Not `price + shipping + tax`, but: *of the options the user can actually obtain, in a
reasonable drive, what is the best one?* Availability is a **filter before the
arithmetic**, not a line item after it.

### Powder and projectiles are different problems — do not model them alike

> "Especially with powder as it's a relatively low cost piece of the puzzle. Projectile
> choice is more of a cost factor."

| | Powder | Primers | Projectiles |
|---|---|---|---|
| Share of cost | Small | Small | **Large** |
| Where bought | Big-box: Sportsman's Warehouse, Midway, etc. | Big-box, same trip | **Niche + local** |
| Decision driver | Availability | Availability | **Quality per dollar** |

**The consequence for this site: local shops are NOT a general-purpose sourcing channel.**
Per the owner, local shops generally carry Hornady, Berry's and Xtreme, and are hit up when
availability is an issue or the shop is simply close. Pricing a full basket against local
shops is modelling the wrong market.

### Where the site genuinely wins — and this is the thesis

> "The niche boutique reloading manufacturers like RMR or Black Hills — having the price
> available to our user is a huge benefit."

**Projectiles are where we beat a local shop, and it is not close.** The owner's own
comparison: RMR match-grade hollow points with free shipping cost *about the same* as
plated Berry's at the local store. That is a **major component upgrade for the same money**,
and finding it requires someone to know that RMR exists and is priced competitively. A
driver at a local shop cannot give that. A search engine will not rank it. We can, because we
hold both the component data and the price.

**So the product is an aggregator and cost estimator for component choice** — chiefly
projectiles — and the local directory is a fallback for availability, not a competitor to
the online catalogue.

### Free shipping is a cost input, not a convenience

> "Things like free shipping make a huge difference."

Shipping is part of **landed** cost and must be computed with it, never appended as an
afterthought. Free shipping over a threshold changes which retailer wins, so a
threshold-aware comparison needs the threshold in the calculation.

### Quality has no schema — and that is now the most important gap

> "Are the bullets match grade? For example, the bullets I buy from RMR are match-grade
> hollow points with free shipping that cost as much as plated Berry's at the local stores.
> **It's a huge upgrade in component.**"

**Measured against the database: this question cannot currently be answered.**

- `bullets` (120 rows) has `construction`, `jacket_material`, `core_material`,
  `tip_type`, `base_type` — and **every single row is `construction='jacketed'` with
  `jacket_material = NULL`.** The columns exist and nobody populates them.
- **There is no match-grade, precision, or quality-tier column anywhere in the schema.**

Without it, the site's central value proposition is unrenderable. We would be comparing
prices while unable to say *what* is being compared — which is how a user ends up paying
Berry's money for RMR's product line and not knowing why. **Specify the quality-tier
attribute: how it is sourced, how it is displayed, and what it looks like when unknown.**
Assume it comes from the manufacturer's own copy — this is published product
specification, not a load quantity, so the cite-and-link rule in FIX-BACKLOG 10 does not
forbid it.

### `reviews` exists and is empty — treat with care

`reviews` has 0 rows and a `product_id` FK, but `products` also has **0 rows**. There is no
product table content to review, and `product_id` cannot currently resolve. Do not design a
review system on a table with no products; and note that user reviews are the one place an
**unsourced claim about a component** could enter the site. If reviews are in scope, a
review saying "match grade" is a claim with no provenance, and it must not render with the
same authority as a manufacturer's spec.

## Why this task exists

The owner wants cost-per-round from real components — primer type and price, powder type
and price, projectile — plus tax and shipping. None of that model exists. We hold powders
with NO price and no load data: the columns are manufacturer, product_name, product_line,
burn_rate_class, relative_burn_rate_position, geometry, source_url. A price is a NEW field
with a NEW provenance requirement, not a value to fill in.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ui-research/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/component-cost-model tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Design AVAILABILITY as a first-class dimension, because the owner identified it as the
  driving factor and it inverts the arithmetic. Specify the stock state (in stock, low,
  out, unknown), where it comes from, its timestamp, and - crucially - what renders when
  it is unknown. **An unknown stock state must not silently rank an option as available.**
  Then specify the ranking rule itself: availability filters first, then landed cost ranks
  what survives. Cover the owner's actual case, where he drove 30 minutes and overpaid
  because his preferred primer was out everywhere else, and say what the site should have
  told him instead.
- Design the LOCAL SHOP ROLE correctly. Per the owner, local shops generally carry Hornady,
  Berry's and Xtreme, are used when availability fails or the shop is close, and are NOT a
  general sourcing channel for niche projectiles. Powder and primers are bought at
  Sportsman's Warehouse, Midway and similar. Specify how the local directory coexists with
  the online catalogue without implying the local shop is the cheaper option for everything.
- Specify QUALITY TIER for projectiles, which the schema cannot currently express. This is
  the site's central differentiator: RMR match-grade hollow points with free shipping cost
  about the same as plated Berry's locally, which is a major component upgrade for the same
  money. Name the fields (match grade / match-quality, jacket material, core material,
  tip type, base type), how each is sourced from manufacturer copy, and how tier is
  displayed. Note that `bullets.jacket_material` exists and is NULL for all 120 rows, and
  `construction` is 'jacketed' for all of them - the columns are stubs and nothing populates
  them. **Also specify what "unknown quality" looks like**, because with the data we have,
  unknown is the normal case and it must never render as "standard".
- Specify LANDED cost, treating free shipping as an input to the comparison rather than an
  afterthought. Free shipping and free-shipping thresholds change which retailer wins, so
  the threshold must be part of the calculation, and the comparison must be able to say
  "this retailer becomes the cheapest at your basket size".
- Design the cost model as a SCHEMA, not as numbers. Every price needs: value, currency, unit (per round, per 100, per pound, per 1000), retailer, capture timestamp, and whether it is observed or user-entered. A price without a timestamp is a claim that decays silently - that is the argument against scraping, made structural.
- Specify PRIMER data, which we hold none of. Required distinctions include manufacturer (CCI, Federal, Winchester), type (standard, match, magnum, non-magnum), and magnum status specifically, because it changes the calculation and getting it wrong changes the result. Name the fields and sources. DO NOT populate it with plausible values.
- Specify tax handling. Sales tax is jurisdiction-dependent and a national average is a fiction. Say whether tax is entered by the user, looked up, or shown as a range, and be honest about which is feasible without a tax API.
- Specify shipping as an ESTIMATOR with visible assumptions, because actual shipping needs retailer data we do not have. Cover flat-rate, free-shipping threshold, weight-based and per-item. Every assumption must be visible, because a silently assumed shipping cost is an invented datum wearing a UI.
- Specify the USER OVERRIDE path. The owner wants users able to enter their own prices. Make override structurally distinct from sourced data so nobody later mistakes a typed number for an observed one. That distinction is the difference between a useful tool and a confident wrong answer.
- Define provenance end to end: how a price travels from source to screen, and what renders when the chain is incomplete.

## Ballistics: what we build, what we do not — owner raised 3 Oct 2026

> "When it comes to hollow points, we want to see if we can find ballistics data on them.
> What do they expand to and at what speeds? How much penetration can be expected at what
> muzzle velocities, etc."

**Half of this is ordinary reference data and half is a duty-to-care question. Both matter,
so here is exactly where the line falls and why.**

### Build it: bullet performance as a property of the BULLET

Manufacturers publish expansion and penetration per projectile — diameter recovered and
depth in calibrated gelatin, usually with a stated velocity condition. That is **published
specification about a manufactured item**, and it can be stored, attributed and cited
exactly like a burn-rate figure.

**Confirmed by inspection, not assumed:** `bullets` has no expansion or penetration column,
and no table anywhere in the schema mentions them.

Required fields: recovered diameter, penetration depth, gelatin standard and block used,
**muzzle velocity under test**, barrel length, publisher, edition and retrieval date.

### Do not build it: penetration or expansion as a function of the USER'S LOAD

The risky part of the sentence is *"at what muzzle velocities, **etc.**"* — because in a
reloading tool, velocity is not a constant. **It is the output of a charge weight the user
chooses.** So "expansion at velocity V" sitting next to a load calculator is a duty-to-care
device wearing the costume of a spec sheet.

- ✅ "**This bullet**, per Hornady, expanded to X in their published test at Y fps."
- ❌ "**Your load** will expand to X at Y fps."

The first cites a fixed fact about a fixed product under the manufacturer's own conditions.
The second is our own inference about a specific charge fired from a specific barrel with a
specific lot of powder — a chain we neither control nor measure.

**This is a different boundary from the load-lookup prohibition, drawn for a different
reason.** Item 10 prohibits computing *charge weights*, because a wrong charge weight is
dangerous to fire. This prohibits *predicting a bullet's behaviour in the user's gun*,
because it is a duty-of-care inference we have no basis for. Same destination, different
argument — and writing both down is what stops someone finding the gap later and assuming it
was an oversight.

### And there is a plain technical impossibility, which is the more useful answer

**We hold no load data — that is item 10, by the owner's own decision.** So we cannot tell
any user what velocity their load produces. **A penetration model keyed to muzzle velocity
is inoperable without load data.**

Either we model penetration only against a manufacturer's published test velocity — safe,
citable, honestly labelled as the manufacturer's result rather than the user's — or we build
the load side first and revisit. **The load side is exactly the part we decided not to
build**, so this is not a restriction we are imposing; it is what the existing decision
already implies.

**Recommendation, which costs us nothing:** build the performance table as sourced,
attributed, test-condition-labelled reference data. Every figure carries publisher, barrel
length and velocity condition, plus a link. The user reads what the manufacturer found; we
never tell them what their round will do.

Most of this data lives in manufacturer PDFs, so it takes the same **cite-and-link**
treatment as load data in item 10 — store attribution and conditions, and where a figure sits
behind a purchase, say so plainly.

## Do not

- Do not populate any price, primer or component value. Design the schema. A fabricated price in a cost calculator is worse than no calculator.
- Do not rank by price alone, and do not present a price comparison that omits
  availability. The owner established from his own experience that availability is the
  driving factor: he drove 30 minutes and overpaid because his preferred primers were out
  everywhere else. A cheapest-first list that ignores stock answers the wrong question and
  looks authoritative while doing it.
- Do not predict or infer what a bullet will do in the USER'S load. Citing a
  manufacturer's published expansion or penetration result under stated test conditions is
  reference data and is in scope; projecting that onto a user's charge weight, barrel and
  powder lot is not, and it is a duty-to-care inference with no measurement behind it. Note
  that we hold no load data at all (FIX-BACKLOG 10), so no such projection is even
  computable.
- Do not default an unknown quality tier to "standard", and do not default an unknown stock
  state to "available". Both would convert absent data into a confident claim, and unknown
  is the normal case for every price, stock and quality field in this database today.
- Do not treat the local shop directory as a general sourcing channel for niche projectiles.
  The owner is clear that local shops carry Hornady, Berry's and Xtreme, and that powders and
  primers come from the big-box retailers.
- Do not build the feature. Produce the specification.
- Do not scrape a retailer. Real price acquisition is owned by retailer-price-data-options; coordinate rather than duplicate.
- Do not state a national average sales tax as if it were the user's tax.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-cost-schema.md`
- `02-primer-data-spec.md`
- `03-tax-and-shipping.md`
- `04-override-and-provenance.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/component-cost-model tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.
