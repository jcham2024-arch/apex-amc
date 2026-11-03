# NOTES — defects found, none repaired

**From:** agent `ee247`, `retailer-price-data-options`, 3 Oct 2026.

---

## 1. Two of the brief's four named sources do not exist as described

**`BRIEF.md` §Scope:**

> "Known to exist: AmmoSeek publishes a public XML feed specification for retailers and
> runs an affiliate network; **Gunfinder and DOPE both publish feed specifications**;
> Impact, Awin and AvantLink are affiliate networks carrying firearms-adjacent merchants."

Measured 3 Oct 2026:

| Source | Measured state |
|---|---|
| **AmmoSeek** | Feed spec is real, but **retailer → AmmoSeek**. We cannot consume it. |
| **Gunfinder** | EUR marketplace, 450 dealers, DE/NL/IT/FR locale switcher. **No publisher feed found**; `/affiliates` → 404. |
| **DOPE** | **Parked.** "Opening Soon", Shopify, password wall. |
| **AvantLink** | Real, and publishes **daily** feeds to publishers. Confirmed. |
| **Impact / Awin** | **Unverified** — docs 404 / behind an application wall. |

**Reported, not repaired.** Per `.clinerules` §10.1, a Sub-Agent does not edit a brief.
The correction is recorded here, in `KNOWLEDGE.md` and `01-feed-and-api-options.md`, so
the next agent does not re-check two dead sources.

## 2. The brief's premise that AmmoSeek is a data source for us is inverted

This is the substantive version of the same finding and is worth separating out:

**AmmoSeek's feed is what retailers give to AmmoSeek so their products get listed.** The
ACR signup form asks the *applicant* for their own feed URL.

**Becoming an ACR member means becoming a seller.** It gives us no access to any
retailer's price data. **Recorded prominently because it inverts the brief's central
assumption.**

## 3. Impact and Awin are recorded as UNVERIFIED, not as options

Both are widely reported to provide product feeds to approved affiliates. **I could not
retrieve either's feed documentation** — the Impact help URL returned 404 and Awin's is
behind an application wall.

Per `.clinerules` §5 rule 1, they are recorded as **candidates to verify after joining**,
not as confirmed options. **No retailer affiliation, commission rate or feed field list
is asserted anywhere in this task's output.**

## 4. `sourcing_retailers.csv` deliberately NOT filled in

All three relevant columns — `affiliate_network`, `feed_format`, `scraping_status` —
remain `unknown`/EMPTY across all 16 rows.

**This is correct and I left them.** Filling them would mean inventing retailer
affiliations I could not verify. **The task's output is a route and a recommendation; it
is not new verified facts about our retailers.**

## 5. A legal question this task deliberately does not answer

Whether a retailer can successfully sue a **non-affiliate** scraper for ToS breach is
**jurisdiction-specific and unsettled**. `prohibits[]` forbids legal advice.

**Recorded as unsettled rather than resolved.** What *is* solid is commercial: the
permission is revocable, and the affiliate relationship is the thing at risk.

## 6. The staleness figure this task could not measure

**There is no measured ammunition price volatility in this task**, because measuring one
requires fetching retailer prices — the action `prohibits[]` forbids.

**What is measured is the source cadence** (AvantLink: daily). That is sufficient to set
a staleness *threshold* without knowing how fast prices move. The volatility figure stays
EMPTY, as it should.