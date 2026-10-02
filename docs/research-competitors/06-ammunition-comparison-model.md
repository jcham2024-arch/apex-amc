# Ammunition comparisons: the product model, and the one place it breaks

Written 2 Oct 2026. This answers the request to aggregate existing comparisons
("how does Critical Duty stack up against Gold Dot"), derive our own
conclusions, and link the reviewers we cite.

## The finding that shapes everything else

**We currently hold no loaded-ammunition data at all.** A scan of all eleven seed
datasets for Critical Duty, Gold Dot, White Box, Blazer, FTX, XTP, HST, Copper
Core and Total Brass returned zero hits.

We hold cartridge pressures (231 rows), bullets (120), powders (169), and
sourcing (22 listings across 8 retailers). What we do not hold is a single
ammunition product: no SKU, no box, no bullet weight as loaded, no stated
velocity.

That is not a small gap. It means the comparison feature has no left-hand side
until we build one. Phase A is the real work; everything after it is
presentation.

## What is genuinely aggregable, and what is not

The comparisons named already exist in abundance on the internet. That is
exactly right, and aggregating them is the site's mission. But they are several
different kinds of thing, and they are not equally usable:

| Kind | Usable? | Why |
| --- | --- | --- |
| Manufacturer load data (Hornady, Speer, Winchester) | yes, labelled first-party | A velocity figure the maker published about its own product. Not independent, but real and citable. |
| Independent bench testing (precision rifle, bench-rest groups) | yes | Methodologically sound when conditions are stated. |
| Terminal / gel testing | **only with conditions** | Expansion and penetration depend on barrel length, media and temperature. |
| YouTube gel tests | only with conditions, and per-product | Often one person's one sample. Directionally useful, not conclusive. |
| Forum threads and Reddit | no as a rating; yes as a pointer | Anecdotal, and survivorship-biased toward problems. |
| Retailer "customer reviews" of ammo | no | Describes shipping and packaging, not performance. |

## The one place this approach breaks

**Terminal performance is not a property of the ammunition.**

A bonded core bullet's expansion depends on barrel length above a threshold that
differs by design and by caliber. The same 124gr Critical Duty load can behave
materially differently from a 3-inch and a 5-inch barrel. A gel result without a
stated barrel length is not a weaker claim; it is not a claim about the product
at all. It is a claim about the product **in one setup**.

This is the principle already written into `data/reference/README.md`: a row
missing its test conditions cannot serve as an oracle, "however correct it is."
Data without conditions cannot be checked, only admired.

**So any conclusion we draw must name the condition it was derived under.**

> Not: "Critical Duty expands wider than Gold Dot."
>
> Rather: "In this source, at a 5-inch barrel and 20C, Critical Duty recovered
> more material at 12 inches in 10% gelatin."

The second is checkable. The first is not.

There is a second trap, and it is the one that could actually hurt someone:
**correlating a duty round with a hunting round, or a 9mm with a .357.** The
examples given compare within-caliber products, which is the right instinct. A
gate should enforce it rather than assume it.

## Phase A - the ammunition catalogue (the actual work)

| # | Change | Notes | Write-set |
| --- | --- | --- | --- |
| A.1 | **Product schema** | Manufacturer, product line, caliber, loaded bullet weight and type, stated velocity with source, box size, UPC. Sourced, never inferred. | `data/schema/021_*.sql` (SERIAL) |
| A.2 | **Seed the top duty and defensive lines** | Start with what the questions named: Critical Duty, Gold Dot, Ranger, XD/XTP, White Box, Blazer, FTX, Match, TMX. Roughly 20 lines, not 1,000 SKUs. | `data/seeds/`, `data/schemas/` |
| A.3 | **Provenance on every velocity** | Manufacturer-published or measured, tier recorded in `value_provenance.csv` like every other number we hold. | `data/seeds/value_provenance.csv` |
| A.4 | **GATE: no ammunition row without a source** | An uncited velocity is the same defect as an uncited rating. | `scripts/gates/` |

## Phase B - comparison and reviews

| # | Change | Notes | Write-set |
| --- | --- | --- | --- |
| B.1 | **Comparison view** | Side by side, per caliber. Specs sourced and dated. No composite score. | `apps/website/src/` |
| B.2 | **Review aggregation** | Real third-party results with conditions attached. Reuses Phase 7 hosting obligations. | `apps/website/src/`, `data/schema/022_*.sql` (SERIAL) |
| B.3 | **Conditions required on every claim** | A terminal claim with no barrel length, media and temperature is shown as a setup-specific observation, or not at all. | `scripts/gates/` |
| B.4 | **Our own conclusion, properly scoped** | See the table below. | `apps/website/src/` |
| B.5 | **Cite every reviewer, always** | Named source, link, date, conditions. A reader must be able to check us. | `apps/website/src/` |

## On "come up with our own conclusions"

This is reasonable and I support it. The constraint is only *what kind* of
conclusion we are entitled to draw.

| Conclusion | Entitled? | Why |
| --- | --- | --- |
| "Cheapest per round right now, at these retailers" | **yes** | Arithmetic on sourced prices. A reader can check it in a minute. |
| "Best value for a budget duty load" | **yes**, as a budget frame | A defensible reading of price plus availability, with the criteria shown. |
| "These three sources agree that X expands more" | **yes**, as a report | We are reporting agreement, not asserting performance. |
| "X has the best terminal performance" | **only with conditions** | Never as a bare verdict. |
| "X is better than Y", unqualified | **no** | That is the unsourced claim removed in September. |
| A star rating or 1-10 score across sources | **no** | Arithmetic over incomparable inputs yields a confident wrong number. |

**The distinction is the whole thing.** A composite score is not more honest
than a fabricated one just because its inputs were real. Averaging terminal
results across different barrels, media and temperatures produces a number that
is precise and meaningless, which is worse than saying nothing.

What we can be is the site that says: *here is what the evidence shows, here is
exactly what each source measured, here is where they disagree, and here is what
it costs.* As far as the research went, nobody else does it honestly.

## Sequencing

```
A.1 product schema      <- BLOCKS everything. No products, no comparison.
A.2 seed ~20 lines
A.3 + A.4 provenance and gate
   |
B.1 comparison view     <- can ship once A lands
B.3 conditions gate
   |
B.2 review aggregation  <- needs the Phase 7 hosting obligations
B.4 scoped conclusions
B.5 citations
```

## What we should not build

- A synthetic overall score. Precise and meaningless.
- A "winner" per category without stated conditions.
- Terminal claims displayed beside velocity claims as though comparable. They
  measure different things.
- Any suggestion that a conclusion is manufacturer-neutral when the manufacturer
  funded the source it rests on.
**correlating a duty round with a hunting round, or a 9mm with a .357.** The
examples given compare within-caliber products, which is the right instinct. A
gate should enforce it rather than assume it.