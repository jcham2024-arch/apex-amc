# Competitor landscape

Fetched 2 Oct 2026 from the sites themselves. Every feature claim below was read
off the live page, not inferred from marketing copy. Prices and features change;
re-verify before relying on any of it.

## The four that matter

| Site | What it is | Scale | Accounts | Paid tier |
| --- | --- | --- | --- | --- |
| **AmmoSeek** | price-comparison search engine | 273 retailers, 1,239,687 products | yes | yes, gated |
| **Ammo Scout** | price comparison + analytics | ~2,973 products tracked | yes | yes |
| **ReloadingBot** | reloading COMPONENT price comparison | 20+ retailers | yes | yes |
| **Brownells / Hornady** | retailers/manufacturers | full commerce | yes | retail accounts |

## What they have that we do not

### 1. Membership (you already spotted this)
AmmoSeek gates its best features behind login: Saved Searches, Price Alerts,
Exclude Retailers, Rate/Review Retailers. The homepage states plainly that you
"need to [log in] to unlock additional features like: Saved Searches, Price Alerts,
Exclude Retailers, Rate/Review Retailers and more!" ReloadingBot leads with
"Create Free Account" and promises alerts for price drops and restocks.

This is the single clearest gap. Every competitor treats the account as the
product's retention mechanism, not an afterthought.

### 2. Price history and time-series
- Ammo Scout: "Ammo Price Trends", "Best Time to Buy" (data-backed buy-or-wait
  recommendations per caliber against historical averages), "Why Is Ammo Expensive?"
  (supply-chain cost drivers), and per-week trend deltas for 9mm, .223, 5.56, .22
  LR and gauges.
- ReloadingBot: 1W/1M/1Y market overview, avg price per lb (powder) and per ea
  (primers) with % change, and a "Price Changes / Past 7 days" panel.

We have a **single** price observation model. We have no history, so we cannot
answer "is today a good price?" - which is the question users actually arrive with.

### 3. A working "reload vs buy" verdict
ReloadingBot shows a live verdict: reload $0.145/round vs factory $0.169/round,
"-14% SAVE, Save $0.023 per round", with the winning recipe broken out
(4gr Titegroup, 124gr FMJ, SPP, free range brass).

We compute the same numbers. We do not present the conclusion. That is a
presentation gap, not a data gap.

### 4. Restock and deal alerts
ReloadingBot: "Recent Restocks" and "Current Deals" panels, plus per-product
alerts. Ammo Scout: "Today's Deals" and "This week's trends".

### 5. Coverage and scale
AmmoSeek indexes 273 retailers and 1.24M products, and publishes per-category
rankings (handgun / rifle / rimfire / shotgun splits, plus caliber popularity
percentages). We have 8 retailers and 13 governed datasets.

### 6. Retailer ratings
AmmoSeek has Rate/Review Retailers and a Retailer Ratings page. We deliberately
removed ratings on compliance grounds, so this gap is **intentional and should
stay closed** unless we can gather real, attributable reviews. See the
compliance note in 04-safety-content.md.

### 7. Mobile app and saved profiles
Hornady: a Reloading App with handbook data, saved products, and a personal
scrapbook. Hornady also gates: "Gain access to special features, save products to
your personal profile and our shooter stories scrapbook."

### 8. Age gate
Hornady shows an explicit 18+ confirmation before the site loads. For a
firearms-adjacent site this is table stakes and we do not have it.

### 9. Educational depth as a differentiator
Brownells runs "The Bench" with rifle-build and maintenance how-tos. Hornady runs
anatomy explainers (Anatomy of a Cartridge, Anatomy of a Bullet). Our guides
section exists but is thin by comparison.

## Visual and layout patterns observed

**Structure.** All four lead with search or comparison above the fold, then
category chips, then a deals or trends panel, then editorial. Ours leads with a
hero then a calculator - we have no search-first entry point.

**Navigation.** Dense mega-menus by category (Brownells lists hundreds of SKUs
in a mega-menu). AmmoSeek uses a "Quick Seek" caliber chip row. Ours is a short
4-item anchor nav.

**Data density.** AmmoSeek is extremely dense - long retailer tables with counts.
ReloadingBot favours cards with sparkline-style trend rows. Ours is
deliberately low-density, which is defensible but reads as thin next to them.

**Trust signals.** Every competitor carries a prominent disclaimer that they do
not sell or vet products and are not affiliated with retailers. We have this in
the footer; they put it at the top.

**Colour.** Brownells and Hornady run light, high-contrast retail schemes
(white/near-white grounds, a single saturated brand accent, heavy black type).
Our dark tactical scheme reads as enthusiast-first where they read as
mainstream-trustworthy. Both are valid; ours is a deliberate differentiator.

## What we should copy, and what we should not

| Copy | Reason |
| --- | --- |
| Account + saved searches | Every competitor's retention mechanism |
| Price history charts | Answers the real user question; needs a data model change first |
| Reload-vs-buy verdict | We already compute it; pure presentation win |
| Restock alerts | High perceived value, needs background jobs |
| 18+ age gate | Table stakes for this vertical |
| Top-of-page disclaimer | Trust parity; currently footer-only |
| Search/compare as the entry point | Matches user intent better than a hero image |

| Do NOT copy | Reason |
| --- | --- |
| Fabricated retailer ratings | Unsubstantiated; FTC 16 CFR 255.2(b). We already removed these |
| Unqualified savings claims | "30-60% avg savings" was false. Our gate blocks it |
| Verbatim copy | Competitor text is not ours to lift |

## Honest assessment of the gap

Our differentiator is **provenance**: every constant cited, an independent oracle
in CI, compliance gates that block unsourced claims. None of the four competitors
can show that. AmmoSeek's own disclaimer concedes its data "may not always be
accurate."

So the plan is not to out-competition them on breadth. It is to keep the
integrity advantage and add the account + history layer they all have. Breadth
(273 retailers, 1.2M products) is not achievable and not the point.
