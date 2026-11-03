# KNOWLEDGE — retailer pricing

Task `retailer-price-data-options`. **Researched 3 Oct 2026.**

---

## 1. The AmmoSeek feed runs the wrong way, and that is the whole task

Everyone assumes "AmmoSeek has a feed spec, so we can consume AmmoSeek's data."

**The feed runs retailer → AmmoSeek.** From `ammoseek.com/xml/`:

> "In order to list your products, AmmoSeek needs a data feed … which describes all of
> your in-stock products … It should reside on a web server where **we** can access it"

And the ACR signup form asks the *retailer* for "Section 3: Data Feed Information —
**Data Feed URL**".

**Joining ACR means becoming a seller, not gaining access to competitors' prices.** The
brief named this as a route for us. **It is not one.** Any future task citing "the
AmmoSeek feed" as a data source has this backwards.

## 2. Two of the brief's four named routes do not exist as described

| Brief said | Measured |
|---|---|
| "Gunfinder publishes a feed specification" | **EUR marketplace**, 450 dealers, German/Dutch/Italian locale switcher. No publisher feed found; `/affiliates` 404s. |
| "DOPE publishes a feed specification" | **Parked domain.** "Opening Soon", Shopify, password wall. |

**Not hidden — recorded in `NOTES.md`.** A brief asserting a source exists when it does
not is worth surfacing, because the next agent will otherwise check the box without
looking.

## 3. robots.txt is the most probative artefact in this task — and it is not law

`https://www.midwayusa.com/robots.txt` disallows:

```
/category/*  /find*  /ProductStatuses*  /s?*  /api/*
```

**That is every path a price scraper requires** — listing, search, stock check, API. All
five, named.

**robots.txt is not a contract and generally creates no liability.** Its value is
different: it is **machine-readable evidence of expressed intent**, from the party whose
permission we need. That is worth more than a paragraph of unsettled CFAA analysis.

## 4. The CFAA is less scary than assumed, and ToS is more

- **Van Buren v. United States, 593 U.S. 374 (2021)** narrowed "exceeds authorized
  access" to a **gates-up-or-down** test, not a motivation test.
- **hiQ's public-scraping holding was VACATED** and remanded. It is not settled law.

So the CFAA exposure for a public-page scraper is real but modest — **and that is not the
argument.** The argument is commercial: the retailer can revoke our permission, our links
stop earning, and the affiliate relationship that funds the site dies. **No legal
analysis changes that.**

**Corollary worth keeping generally:** conflating ToS breach with CFAA liability
**overstates** legal risk while **understating** commercial risk. They are different
risks with different remedies.

## 5. Staleness is knowable from the source, not from the market

**We do not know how long an ammunition price is true, and cannot know without scraping
— which `prohibits[]` forbids.**

**But we do not need to.** The staleness threshold is **the feed cadence**. AvantLink
states feeds are *"updated daily"*; AmmoSeek requires retailers to feed every **5 minutes**
and rejects third-party generators at 60 min and 1–2 h.

> **The staleness rule is a property of the route we chose, not an assumption about the
> market.** Once a price crosses the cadence, the product has no price — and saying so is
> correct behaviour, not a bug.

**Generalisable:** when you cannot measure a value's volatility, find the source's own
refresh commitment. That is measurable and it is enough.

## 6. The display is gated on a prerequisite nobody has checked

The feature is blocked on one question this task could not answer:

> **How many of our 16 retailers are actually in a network we can join?**

`data/seeds/sourcing_retailers.csv` has `affiliate_network`, `feed_format` and
`scraping_status` columns, **all `unknown`/EMPTY across all 16 rows.** Those stay empty.
Filling them from this document would mean inventing affiliations.

**If coverage is thin, the feature should not be built at all** — that is a falsifier, not
a caveat.

## 7. The bar for a price is already set, and we should not lower it

`apps/website/src/data/retailers.js` removed fabricated ratings because they were
*"a fabricated endorsement, whether or not a label says 'affiliate'."*

**A price is a claim about a measurable quantity.** A stale or unsourced price is the same
failure in a different costume. **The existing file already forbids what we would build
without provenance — so this feature must meet the standard the directory already sets,
not a new one.**

## 8. Method: reading a robots.txt is not scraping

I was careful here and it is worth being explicit, because it looks like a contradiction.
`prohibits[]` says do not fetch a retailer storefront to test whether scraping works.

**`robots.txt` exists to be read by automated clients.** Retrieving it is the opposite of
scraping a storefront: it is reading the publisher's stated policy rather than acting
against it. **No product page, search result or API endpoint was requested** — and
noticing that the disallowed paths are exactly the ones a scraper needs required no
contact with those pages at all.