# REPORT — retailer-price-data-options

**Task:** `retailer-price-data-options` (priority: highest) · **Agent:** `ee247`
**Model:** default model, fresh instance. **Date:** 3 Oct 2026.
**Status:** complete.

## Deliverables

| File | Contents |
|---|---|
| `01-feed-and-api-options.md` | 4 routes measured; 2 do not exist as described |
| `02-scraping-legality.md` | robots.txt evidence; CFAA status; ToS |
| `03-staleness-and-display.md` | Cadence-based staleness rule; display requirements |
| `04-recommendation.md` | One recommendation, costs stated, 6 falsifiers |
| `KNOWLEDGE.md` | Durable findings |
| `NOTES.md` | Three defects found, none repaired |
| `REPORT.md` | This file |

---

## 1. What I did

Read the source the task derives from (`apps/website/src/data/retailers.js`, 103 lines),
then researched each route the brief named **from primary sources** — publisher's own
pages, not summaries. Read **one** retailer resource: a `robots.txt`, which is published
*for* automated clients.

Wrote a recommendation with **six falsifiers**, per the brief's requirement that a
recommendation without one is an opinion.

---

## 2. What I found

### The central finding inverts the brief

**AmmoSeek's feed runs retailer → AmmoSeek.** From their own feed page:

> "In order to list your products, AmmoSeek needs a data feed … It should reside on a web
> server where **we** can access it at any time."

**Joining their programme means becoming a seller, not gaining access to competitors'
prices. It is not a data source for us.**

### Two of four named sources do not exist as described

| Brief said | Measured |
|---|---|
| "Gunfinder … publish feed specifications" | **EUR marketplace**, 450 dealers, DE/NL/IT locale switcher. No publisher feed; `/affiliates` 404s. |
| "DOPE … publish feed specifications" | **Parked.** "Opening Soon", Shopify, password wall. |
| "Impact, Awin … firearms-adjacent merchants" | **Unverified** — docs 404 / behind a wall. |
| AvantLink | **Confirmed.** Publishes **daily** feeds to publishers. |

### The most probative single artefact

**`midwayusa.com/robots.txt` disallows `/category/*`, `/find*`, `/ProductStatuses*`,
`/s?*`, `/api/*` — every path a price scraper needs**, named specifically.

### The legal answer: less scary than assumed, and not the deciding factor

Van Buren (2021) narrowed the CFAA to a gates test; **hiQ's public-scraping holding was
vacated**. CFAA exposure is therefore modest. **But the deciding factor is commercial:**
the permission is revocable and the affiliate relationship funds the site.

### Staleness is knowable without measuring the market

**We cannot measure price volatility without scraping**, which `prohibits[]` forbids.
**But the staleness threshold is the feed cadence** — AvantLink says daily. A property of
the route we choose, not an assumption about ammunition.

---

## 3. Two negative tests

**I expected a free lawful route to exist.** The brief's framing — *"the obvious
implementation — scrape the storefronts — is the wrong one"* — implies the legitimate
routes are otherwise equivalent. **They are not:**

- AmmoSeek: **not available to us at all**
- Gunfinder: **wrong market** (Europe, EUR, dealers)
- DOPE: **a parked domain**
- Impact/Awin: **unverified**

**One of four named routes exists as described.** That is stronger evidence against
scraping than any legal argument: **there is no free lawful alternative on the table.**
Scraping will be proposed again — precisely because the alternatives look thin — and the
answer has to be on record.

**Second — a premise I checked rather than accepted.** The brief listed Gunfinder and
DOPE as known feeds. I fetched both: one is a European marketplace, one is parked. **Had
I trusted the brief, both would have gone into the recommendation.**

---

## 4. What I did NOT do, and why

- **Did not write a scraper, and did not test whether one works.** Per `prohibits[]`.
- **Did not give legal advice.** Cited cases and holdings; marked unsettled as unsettled.
- **Did not recommend a price display.** `prohibits[]` withholds it until staleness and
  ToS are answered — and although those two are answered, **coverage is not**, so it stays
  withheld. That is the correct reading.
- **Did not fill `affiliate_network`, `feed_format` or `scraping_status`** in
  `sourcing_retailers.csv`. All 16 rows stay `unknown`/EMPTY. **Filling them would mean
  inventing affiliations I could not verify** — the precise failure `retailers.js` exists
  to prevent.
- **Did not edit the brief**, though two of its claims are wrong. Reported in `NOTES.md`.

---

## 5. What I believe is wrong

**The premise that this is an ordinary data-acquisition problem is wrong, and the owner
should know that before anyone builds it.**

The question is not "how do we get prices." It is **"is there enough retailer coverage
through any sanctioned route to make the feature worth building at all?"** — and **that
question is unanswered, because answering it requires an affiliate account.** All three
relevant columns in `sourcing_retailers.csv` are `unknown` across all 16 rows.

**If coverage is thin, the right answer is not to build the feature.** I would rather say
that plainly now than have someone build a price display over two retailers.

Second: **the legal analysis is the wrong thing to argue.** The CFAA risk is modest and
hiQ's holding was vacated — so a "scraping is illegal" argument is **overstated**. The
real argument is commercial, and it is stronger: we would threaten the revenue
relationship the feature exists to serve. **An overstated legal claim in a project built
on not inventing values is still a wrong claim.**

## Definition of Done

| Requirement | Status | Evidence |
|---|---|---|
| All 6 `required_outputs` exist | **PASS** | listed above |
| Each route: data, cost, participation | **PASS** | `01-` |
| ToS position with sources; CFAA + hiQ | **PARTIAL** | see limits |
| **Unsettled stated as unsettled** | **PASS** | `02-` §4 |
| Staleness quantified | **PASS** | cadence measured; volatility EMPTY |
| One recommendation + falsifier | **PASS** | `04-`, 6 falsifiers |
| Did not fetch a storefront | **PASS** | one robots.txt only |
| No source file modified | **PASS** | write-set is `completed/` only |

### Known limits

- **Retailer coverage is unmeasured and unmeasurable from here.** The task's central gap,
  and no amount of further research closes it — it needs an affiliate account.
- **I did not retrieve Impact's or Awin's feed documentation** (404 / auth wall). Marked
  UNVERIFIED rather than described.
- **No retailer ToS was read** beyond noting MidwayUSA's terms URL 404s. My ToS analysis
  rests on the general legal position and on robots.txt, **not** on quoted ToS text — and
  the brief asked for ToS specifically. **This is the weakest part of the deliverable.**
- **No price volatility was measured**, by design.
- **Not legal advice**, and the CFAA analysis is US-only.