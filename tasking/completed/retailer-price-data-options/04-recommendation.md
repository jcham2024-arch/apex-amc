# 04 — Recommendation

Task `retailer-price-data-options`. **One approach, with the falsifier stated.**

---

## Recommendation: join an affiliate network and consume its product feed

**AvantLink first**, because it is the only route I could verify from a primary source:
it publishes feeds to publishers, states a **daily** update cadence, and operates US /
Canada / Australia networks that plausibly overlap our retailer list.

**Not: scraping.** Not because scraping is a federal crime — it is not, and the CFAA
question is genuinely unsettled (`02-scraping-legality.md`). Because:

1. **Every path a scraper needs is explicitly disallowed** at MidwayUSA in robots.txt —
   measured, and it is the most probative single fact in this task.
2. **It threatens the thing we already depend on.** Our affiliate relationships are the
   revenue. A retailer we scrape is a retailer we need to keep working with us.
3. **It buys a worse product.** A feed gives us a defined cadence, a stable SKU join key
   and a provenance story. A scraper gives us a snapshot with an unknown age and no
   contractual right to keep taking it.

---

## What we give up — stated, not glossed

| Cost | Real? |
|---|---|
| **Commission share on every attributed sale** | **Yes.** This is the actual price. |
| **Dependency on one intermediary** | **Yes.** If AvantLink changes or exits, we re-do this. |
| **Coverage limited to merchants in the network** | **Yes** — our 16 retailers may not all be there. |
| Loss of the "compare all retailers" framing | **Yes**, and it is a real product change. |
| Data must be attributed and disclosed | Already required. Not a new cost. |

**A zero-cost route exists and it is the one to reject:** scraping costs no commission and
no dependency, which is precisely why it is attractive. It also costs the affiliate
relationship, the provenance, and the ability to show a price we can defend. **"Zero
cost" here means "cost paid somewhere we do not measure."**

---

## Order of work

1. **Apply to AvantLink as a publisher.** This is an account action, not research.
2. **On approval, check which of our 16 retailers are present.** Until then
   `affiliate_network` in `sourcing_retailers.csv` correctly stays NULL.
3. **Only then** design the display — and it must carry provenance and age
   (`03-staleness-and-display.md`).
4. **Do not build the display before step 2.** A price display with no source is the
   exact failure `retailers.js` was written to prevent.

---

## Falsifiers — what would change this recommendation

**A recommendation without a falsifier is an opinion. These are the conditions under
which this recommendation is wrong:**

| If this turns out to be true | Then |
|---|---|
| **Most of our 16 retailers are not in any affiliate network we can join** | The feature has too little coverage to be worth it. Recommend **not building it**. |
| **No network carries our retailers at all** | Scraping's *commercial* advantage disappears, and with it the argument against it becomes purely legal — still insufficient, but the project should know the feature is dead. |
| **Feeds are commercial-tier / paid** | The "free" advantage over scraping narrows to zero. Re-evaluate on cost alone. |
| **Feed price data is materially delayed** (not daily, e.g. weekly) | The 24-hour staleness rule collapses; the display must change or the feature waits for `ui-research`'s provenance work. |
| **AvantLink carries firearms-adjacent merchants we cannot use** | Coverage assumption fails. Re-check Impact/Awin, then re-evaluate. |
| **Retailers begin publishing their own open feeds to anyone** | **This would flip the recommendation.** An open, retailer-sanctioned feed has none of the affiliation cost. It is the route worth watching. |

**The last one is the important falsifier:** the whole recommendation rests on affiliate
feeds being the only sanctioned bulk-price route. If retailers open their own feeds, that
changes and we should revisit immediately.

---

## What I did NOT do, and will not

- **Did not write a scraper, and did not test whether one would work.** Per
  `prohibits[]`. I read one robots.txt — a file published *for* automated clients — and
  that is the only retailer resource I retrieved.
- **Did not give legal advice.** Cited the cases and what they hold; marked unsettled
  where it is unsettled.
- **Did not recommend a price display.** `prohibits[]` forbids it until staleness and ToS
  are answered. `03-staleness-and-display.md` answers staleness; this document answers
  ToS; **the display recommendation is therefore still withheld** — which is correct,
  because step 2 above (which retailers are actually in a network) is not yet answered.
- **Did not fill in `affiliate_network`, `feed_format` or `scraping_status` in
  `sourcing_retailers.csv`.** Those columns stay as they are: `unknown`/EMPTY. **Filling
  them from this document would be inventing retailer affiliations I could not verify**,
  which is the precise failure `retailers.js` exists to prevent.

**That last point is the honest limit of this task.** It produced a route and a
recommendation; it did not produce a single new verified fact about our retailers, and
the columns correctly remain empty until someone with an affiliate account can fill them.