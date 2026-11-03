# 03 — Staleness: how long is a scraped price true?

Task `retailer-price-data-options`. **The brief asks for a number, not an opinion.**

> **This document contains no measured price data, because I did not fetch any.** Per
> `prohibits[]` I did not hit a retailer storefront to see how fast prices move. Every
> figure below is either **measured from a publisher's own published cadence** or **stated
> as an unknown.** The unknown is the finding.

---

## 1. What is measured

| Source | Stated cadence | Measured how |
|---|---|---|
| **AvantLink publisher feeds** | **"updated daily"** | Quoted from avantlink.com/publishers |
| AmmoSeek's required retailer feed | ≤ **5 minutes** | Quoted from ammoseek.com/xml |
| AmmoSeek's rejected 3rd-party tools | 60 min (DataFeedWatch), 1–2 h (FeedGeni) | Same page |
| **Our likely route (AvantLink)** | **24 hours** | Quoted |

**So the realistic answer to "how long is our price true?" is: up to 24 hours, before
any bug, before any sale ends, before any stock movement, and before we even begin.**

## 2. What is NOT measured, and why that matters more

**I do not know how long an ammunition price remains true. Nobody in this repository
does.** That is not a gap I could close without breaking `prohibits[]`, and closing it by
scraping would be exactly the mistake this task exists to evaluate.

**Per `.clinerules` §5 rule 1 the cell stays EMPTY.** And the empty cell is the most
useful output of this section.

## 3. What the UI must therefore be able to say

**A price of unknown age cannot be displayed as a price.** It can only be displayed with
its age attached. This is the whole design constraint, and it is the same constraint
`ui-research` reached independently:

> "A design that has no vocabulary for absence renders a blank cell, and a blank cell is
> read as `0`. **That is a silent data error**"
> — `tasking/completed/ui-research/KNOWLEDGE.md` §1

**Concretely, a price row needs at minimum:**

| Element | Requirement |
|---|---|
| The figure | Tabular figures; unit shown |
| **The age** | *"as of 3 Oct"* — not a live look |
| **The provenance** | Which route it came from |
| **A stale state** | Older than the feed cadence → stop showing the figure |

**And the staleness threshold is knowable without knowing price volatility:** it is the
**feed cadence.** AvantLink updates daily, so a feed price is stale at **24 hours** by
definition — regardless of whether ammunition prices actually move that fast.

**That is the elegant part: the staleness rule is a property of the source we chose, not
an assumption about the market.** We do not need market data to know when to stop
showing a number.

## 4. What a price looks like over time

| Age | What it means | What we show |
|---|---|---|
| **0–24 h** | Within the feed's stated cadence | Figure + "as of 3 Oct" |
| **24 h+** | Beyond cadence; may be wrong | **Stop showing the figure.** Say so. |
| **Unknown age** | Cannot be established | **Nothing.** No figure, no estimate. |

**The line between row 2 and row 3 is the entire feature's honesty budget.** Once a price
crosses it, the product has no price — and saying that is correct behaviour, not a bug.

## 5. The commercial tension, stated honestly

**A daily feed means we can be up to 24 hours stale — and a user comparing our number to
theirs at checkout will find it wrong at least sometimes.** That is a real product cost.

**The alternative is worse.** Options:

- **Show nothing until the data is trustworthy** — no feature, no risk.
- **Show a number and let users find it stale** — the feature fails quietly, and the
  failure looks like *our* error even though it is the source's.

**Recommendation: ship the first, expand only when the display can carry the age.**
The `ui-research` design already has the provenance vocabulary to do this — **that task's
spec is a prerequisite for this feature, not a parallel nicety.**

## 6. The FTC layer

`apps/website/src/data/retailers.js` already reasons carefully about FTC endorsement
rules — its header records that it removed `rating: 4.9` and *"Verified Shipping Partner"*
because those were *"fabricated endorsement"* claims requiring substantiation.

**A price is a claim about a measurable quantity.** Displaying a stale or unsourced
price is the same failure in a different costume:

> "A bare '4.9' with no review count is a claim about a measurable quantity… Displaying
> them is a fabricated endorsement, whether or not a label says 'affiliate'."
> — `apps/website/src/data/retailers.js`

**So the file's own standard already forbids what we would build without provenance.**
A price without a source and a date fails the test that file already applies to
everything else. **The bar is not new — it is already set, and we should not lower it.**