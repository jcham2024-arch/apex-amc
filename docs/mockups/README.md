# UI mockups

Three static mockups for design review, built from the competitor research in
`../research-competitors/`. Open any file directly in a browser; they need no
build step.

**These are not the real site.** Every price, retailer name, observation count and
date in them is invented for layout purposes. They must never be deployed, and
`claims:check` would object to several of the numbers if they were.

| File | Shows | Maps to |
| --- | --- | --- |
| `mockup-1-home.html` | 18+ age gate, top-of-page non-affiliation notice, reload-vs-buy verdict block, price-per-round table with trend sparklines | Phase 0.1, 0.2, 0.3, 0.4 |
| `mockup-2-history.html` | Price history chart that **refuses to chart past the data**, alert list, safety-not-gated notice | Phase 3.1, 3.3 |
| `mockup-3-membership.html` | Three pricing tiers, and the explicit list of what is never paywalled | Phase 4.4, and the 2.5 safety rule |

## Design direction

Dark tactical, brass accent. This is a deliberate differentiator: Brownells and
Hornady both run light, high-contrast retail schemes that read as mainstream-trustworthy.
We read as enthusiast-first. Both are defensible; the dark scheme is already part of
the site's identity and changing it would be a brand decision, not a UI cleanup.

Borrowed from the competitors, deliberately:
- **search-first entry**, with caliber chips above the fold rather than a hero image alone
- **price per round as the primary unit**, never raw case price
- **dense data tables** with a trend column
- **non-affiliation notice above the content**, not in the footer

Deliberately NOT borrowed: retailer star ratings. They are unsourced, and 16 CFR
255.2(b) forbids the representation. Our `claims:check` gate blocks them returning.

## The two states worth arguing about

`mockup-2` is the important one. Its chart fades to **no data** at the right edge and
carries a notice that 23 days is not enough to call a trend. Every competitor would
draw a confident line through the whole width.

That is the difference between this site and the ones we are benchmarking against.
It looks less finished and it is more honest. If we lose the honesty to look
competitive, we have copied the wrong thing.

## Tokens

`_tokens.css` holds the shared design tokens. It is deliberately a plain stylesheet
rather than a Tailwind build, so a designer can open one file and change the palette
without running our toolchain.
