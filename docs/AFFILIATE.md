# Affiliate programs — what exists, what earns, and what does not

**Read before doing anything in `sourcing_retailers` or `sourcing_searches`.**

This file exists because the difference between "we have an affiliate link" and
"we earn commission" is not a formatting question, and getting it wrong costs
money quietly rather than loudly.

---

## The one thing to understand first

**A link earns commission. A price does not.**

This inverts the obvious plan. The obvious plan is "scrape prices, show the
cheapest, earn a cut." The working plan is:

> Send the visitor to a retailer with a tagged deep link. They buy. You get paid.

No price data is required for step one. The data needed for a *useful* link —
the retailer, the search terms, the manufacturer part number — is already in this
repository, and the code to join it is
[`scripts/shared/affiliate-links.mjs`](../scripts/shared/affiliate-links.mjs).

That module fetches nothing. It is pure string handling, deliberately kept free
of network access. See "Why not a price scraper" for what changes if you do want
prices.

---

## Current state

```
$ npm run affiliate:status
```

Eight retailers, zero outreach records, zero approved programs, zero tagged
links. The 22 existing `sourcing_listings` are all `confidence = 'likely'` — we
believe these retailers carry these items; nobody has confirmed it against a live
site.

### What the schema already gives you

Migration 013 anticipated all of this in October, and got it right:

| Column | What it is for |
|---|---|
| `link_template` | Deep-link template with `{search}` / `{sku}` placeholders |
| `affiliate_network` | Which network runs the program |
| `network_store_id` | **Your** publisher ID inside that network |
| `affiliate_status` | Does a program exist: `unknown` / `none` / `applied` / `approved` … |
| `feed_url`, `feed_format` | Whether the retailer offers a sanctioned product feed |
| `scraping_status` | Whether automated retrieval is permitted, per retailer |

Migration 016 adds `affiliate_outreach`, which tracks the human work. Run
`npm run affiliate:status` for the joined view.

### The row that matters most

```
approved but no store id - links are UNTAGGED, no commission
```

An approved program with no `network_store_id` is green in every column and
earning nothing. That state is invisible in either table alone, which is why
`affiliate_outreach_status` exists.

---

## The order that works

**1. Apply, before building anything.** Most of these run through a network, not
the retailer — you apply to AvantLink or Impact or Partnerize, not to Brownells.
You get a `network_store_id` **only on approval.** Nothing downstream works
without it.

**2. Set `affiliate_status` and `network_store_id`.** Until both are set, every
link the site emits is clean and untagged. That is a safety property, not a
limitation — see the module docstring.

**3. Only then worry about links per SKU.** The `link_template` search URL works
today for all eight retailers. A captured per-SKU `retailer_url` beats it, and
`linkForListing` prefers it, but it is an optimisation, not a prerequisite.

**4. Record what you learn in `affiliate_outreach`.** Fill in `outreach_status`,
`network`, `application_url`, and — critically — `pitch_notes` **before** sending
the email. Retailers approve outreach that argued a specific case; they decline
"please add me to your list."

Run `npm run affiliate:status` at any point to see where every retailer stands.

## Why not a price scraper

This is the part most worth arguing, because the original request was to scrape
prices from every retailer, and that plan has real problems.

**It is usually a contract violation, not just a technical risk.** Affiliate
programs grant permission to send *traffic*, not to copy *data*. Most network
agreements prohibit scraping, and several large retailers carry pricing only
under terms that forbid it. Getting caught means account closure — and that
closure is permanent in the way that matters: it is the account that would have
earned the commission.

**The sanctioned path already exists in the schema.** `feed_url` and
`feed_format` are there. Affiliate networks exist largely to *distribute* product
data to approved publishers; a product feed is how you are meant to get price and
stock. Using one is faster, permitted, and gives better data than scraping would.

**Price advertising creates legal exposure.** Displaying a price can be a
representation that must be accurate. A stale scraped price is a compliance
problem in several jurisdictions and a customer-trust problem everywhere. The
schema anticipates this: `price_observed_on` exists because
`sourcing_listings.price_cents` is explicitly a *snapshot*, not a live value.

**`scraping_status` already encodes the decision.** Its allowed values include
`blocked`, `unsupported` and `no_feed`, and the migration comment says plainly
that a retailer which blocks bots is *"a supported outcome"* — not a failure to
work around.

### So, if you do want prices on the site

In order of preference:

1. **A product feed from the affiliate network**, once approved. This is the
   intended path and needs no new scraping logic at all.
2. **A retailer-supplied feed** — check `feed_url` once the account is live.
3. **Manual curation** with `price_observed_on` set honestly, and the UI showing
   "last checked". Twelve search targets is a tractable amount of manual work,
   and it is accurate.

Not on this list: an unattended scraper pointed at retailer search pages. If
someone wants that anyway, it is a deliberate decision that needs its own design
note and a per-retailer `scraping_status` entry reading `allowed`, with the basis
recorded — not a default.

---

## What the network will check before approving you

Requirements vary by network, but the baseline every one of them applies is the
same, and it is the same baseline the law applies:

1. **Proximate, clear disclosure of the commission.** Not buried in the footer.
2. **No claims you cannot substantiate.** This is the part sites fail on.
3. **No incentivised traffic.** No coupons, no cashback, no "buy through my link
   and get $5 off", no requiring a purchase before the content is readable.
4. **No trademark in your domain or site name.** `apex-amc.com` is fine; a name
   containing a retailer or manufacturer is not.
5. **Real, original content.** An empty shell with eight outbound links is
   usually rejected.

Two requirements are specific to this category and easy to miss:

- **Ammunition eligibility varies.** Some programs exclude ammunition, some
  exclude it during promotional windows, and some pay a reduced rate on it. The
  rate in the network's directory is the one that counts — not a third-party
  blog's summary.
- **Age-gating and shipping restrictions.** Most firearms retailers will not
  permit an unverified affiliate to send traffic without an age-verification
  attestation. Expect a question about it on the application.

### The one that decides whether you get approved

It is number 2, and it is where this site previously had real problems.

`apps/website/src/data/retailers.js` used to carry `rating: 4.9` on all eight
retailers, render a gold star next to each, and label every card "Verified
Shipping Partner". None of that was true. Nobody had rated these retailers
through us, no source for the numbers existed anywhere in the repository, and no
code verifies anything.

Under 16 CFR 255.2(b) an endorser may not make a representation they cannot
substantiate — and a disclosure does **not** cure that. Disclosing "I earn a
commission" tells the reader who paid you. It does not license the claim beside
it. An affiliate site with a fabricated rating is worse than no affiliate site,
because it is the specific deceptive pattern the Guides exist to address.

Those claims are gone. The gate `npm run claims:check` keeps them gone, and
fails the build if a rating, a "verified" claim, or a percentage savings figure
reappears.

### Disclosure placement, specifically

The FTC's own guidance states that disclosures are likely to be missed when they
appear "at the end" of the content. A reader who scrolls to the directory, sees
the cards and clicks one has not been told at the point of the decision.

So the disclosure sits **above** the retailer grid, in the same viewport as the
links it qualifies. The footer copy remains; both, not either. The gate asserts
the ordering rather than the presence, because a footer-only disclosure passes a
presence check and fails this one.

Wording that fails review: `sp`, `collab`, a bare "thanks", "ambassador", or
"this is a partnership". Wording that passes: a plain sentence naming the
commission and stating that it does not change the price.

---

## What is not built, deliberately

- **Price ingestion.** See above.
- **Per-SKU deep links.** The 22 listings resolve through the search template,
  which works. Capturing exact product URLs is a manual research task.
- **Automatic application submission.** Requires an account and often a tax
  form. Not something a script should do on your behalf.

---

## Related

- [`../HANDOFF.md`](../HANDOFF.md) — why the data layer may not touch the page
- [`../SECURITY.md`](../SECURITY.md) — the XSS findings this work depends on
- [`../scripts/gates/check-claims.mjs`](../scripts/gates/check-claims.mjs) — the
  gate that keeps unsupported retailer claims off the built page
- `data/schema/013_sourcing.sql` — the original design and its reasoning
- `data/schema/016_affiliate_outreach.sql` — the tracker

---

## Two things the seed data refuses to guess

Every retailer row says the affiliate network is unconfirmed, because the README
warns that several programs have migrated. That is not caution for its own sake —
**Natchez migrated off AvantLink**, and Brownells is listed on more than one
network. A network recorded from a stale third-party summary is a number that
looks right and does nothing.

Verify against the network's own directory, then record `terms_verified_on`.
`commission_rate_pct` is nullable and should stay NULL until you have read it — a
blank rate gets looked up, a wrong one gets used.