# Feature gap plan

Written 2 Oct 2026 from the competitor research in this directory. The goal is
parity on what every competitor already has, without surrendering the provenance
and compliance position that none of them have.

Sequenced by dependency, not by appeal. Each phase states its write-set so the
multi-agent overlap gate can verify no two run concurrently.

## The strategic line

We will **not** try to match AmmoSeek on breadth. 273 retailers and 1.24M products
is a scraping operation, and their own disclaimer concedes the data "may not
always be accurate." Our asset is that every number has a citation and an
independent oracle behind it in CI.

So: **match them on the account and history layer they all have, and keep the
integrity advantage they all lack.**

## What this site is

Stated plainly so no future task drifts from it:

> A **research and tooling site**. We do not sell ammunition, components or
> firearms, and we will not. We aggregate data, we aggregate genuine reviews of
> available products, and we present the result with links to where the user can
> buy. We earn a commission on some links, which is disclosed.

Three consequences that are load-bearing for everything below:

1. **We never take title, inventory, or a customer's money for a physical good.**
   That is why membership billing is ordinary e-commerce and why no FFL, no
   hazardous-materials handling and no payment-processor firearms policy is in
   scope.
2. **Affiliate revenue must never influence ordering or inclusion.** If a
   retailer pays us, they do not get a better rank. This must be enforced, not
   promised.
3. **"Research and tooling" means the tools stay free.** A paywall on the cost
   calculator would contradict the site's purpose, not merely its business model.

## Phase 0 - free, no new infrastructure

Highest value per hour, and it closes two gaps competitors treat as table stakes.

| # | Change | Why now | Write-set |
| --- | --- | --- | --- |
| 0.1 | **18+ age gate** | Hornady does it before the site loads. Table stakes in this vertical. | `apps/website/src/index.html`, `apps/website/src/main.js`, `apps/website/src/dom.js` |
| 0.2 | **Reload-vs-buy verdict** | We compute both numbers; we do not state the conclusion. Pure presentation. | `apps/website/src/main.js`, `dom.js`, `apps/website/src/data/calibers.js` |
| 0.3 | **Non-affiliation notice at the top** | All four competitors state it up top. We have it footer-only. | `apps/website/src/index.html` |
| 0.4 | **Cents-per-round everywhere** | Competitors quote price-per-round as the primary unit. Match it. | `apps/website/src/main.js`, `apps/website/src/data/retailers.js` |

0.1 and 0.3 share `index.html`, so they run together. 0.2 and 0.4 share
`main.js`, so they run together. Two groups, no collision.

## Phase 1 - the data model that makes history possible

**Nothing in Phase 2 works until this lands.** `price_observations` is empty and
single-valued, so we cannot answer "is today a good price?"

| # | Change | Notes | Write-set |
| --- | --- | --- | --- |
| 1.1 | **Migration: observations become time-series** | `(retailer_id, product_id, observed_at, unit_price)`, unique per observation. STRICTLY SERIAL - only one agent may add a migration at a time. | `data/schema/017_*.sql` only |
| 1.2 | **Seed an initial history** | Only from data we already have with provenance. An empty table is honest; a fabricated one is not. | `data/seeds/`, `data/schemas/` |
| 1.3 | **Collector job** | `scripts/data/`. Single-builder lock applies. | `scripts/data/*.mjs` |

1.1 finishes before 1.2. 1.2 and 1.3 can run together once 1.1 lands.

## Phase 2 - accounts

| # | Change | Notes | Write-set |
| --- | --- | --- | --- |
| 2.1 | **Auth provider decision, recorded** | Supabase Auth vs Clerk. Record the choice and its cost. | `docs/DATA-MODEL.md` |
| 2.2 | **Schema: users, saved_searches, alerts** | SERIAL (migration). Store the minimum; no reload data. | `data/schema/018_*.sql` |
| 2.3 | **Sign-up / sign-in UI** | Must not gate any safety content. | `apps/website/src/` |
| 2.4 | **Saved searches** | The feature all three competitors name first. | `apps/website/src/` |
| 2.5 | **GATE: safety reachable without an account** | **Mandatory.** New file, does not exist yet. | `scripts/gates/check-safety-access.mjs` (to create) |

### 2.5 is not optional

Every one of these must work logged-out: every safety notice; the reloading
checklist and beginner guidance; ballistic reference data and provenance; the
retailer directory and its disclosure; any statement that a load is unsafe or
unverified.

A test must assert each is present in the DOM with no session. Without it, a
future refactor that wraps the page in an auth check would pass every existing
gate here - precisely the CSP-gate failure this repository already suffered.

## Phase 3 - price history UI

| # | Change | Write-set |
| --- | --- | --- |
| 3.1 | Sparklines on retailer cards | `apps/website/src/main.js`, `dom.js` |
| 3.2 | "Best time to buy" panel, method stated | `apps/website/src/` |
| 3.3 | Honest empty state when history is too thin | `apps/website/src/` |

## What we deliberately will not add

| Not adding | Reason |
| --- | --- |
| **Fabricated** ratings | No reviewer existed: 465.2(a). Already removed once; `claims:check` blocks reintroduction. Genuine aggregated reviews are Phase 7 and are permitted by 465.2(d)(2). |
| Unqualified savings claims | "30-60% avg savings" was false |
| Paywalled safety content | Harmful, and a regulatory risk |
| Breadth scraping (1000+ retailers) | Not achievable, not the point, and would cost the accuracy we have |
| A forum before there is a community | An empty forum reads as abandonment |
| Reviews displayed without a monitoring procedure | Required by 465.3. Hosting reviews without one is the real exposure. |
| Selling ammunition or components | We are a research and tooling site. This is out of scope permanently, not pending. |
| Ranking retailers by commission paid | Would make every price comparison a conflict of interest |

## Sequencing

```
Phase 0 (free, do now)
   |
Phase 1 (time-series schema)  <- blocks everything below
   |
Phase 2 (accounts + safety-access gate)
   |
Phase 3 (history UI)
   |
Phase 4 (paid membership)      <- only after 3 proves retention
   |
Phase 5 (community)           <- only after real demand
```

## First three things to do

1. **0.1 age gate** - a few hours, closes a table-stakes gap.
2. **0.2 reload-vs-buy verdict** - we compute it already; stop hiding it.
3. **2.5 safety-access gate** - write it *before* accounts exist, so the rule is
   enforced by the time there is something to break.
3.3 matters more than it looks. After one or two months of data any "best time to
buy" claim is noise. The empty state must say so rather than render a confident
chart.

## Phase 4 - membership (only after Phase 3 shows retention)

| # | Change | Write-set |
| --- | --- | --- |
| 4.1 | Stripe Billing + Checkout | `apps/api/` (new), `apps/website/src/` |
| 4.2 | Webhook handler, signature-verified | `apps/api/` |
| 4.3 | Entitlements model | `data/schema/019_*.sql` (SERIAL) |
| 4.4 | Pricing page | `apps/website/src/` |

Do not start Phase 4 before Phase 3. Charging for something that does not work
yet is worse than not charging.

**Membership may unlock:** saved searches, price alerts, advanced ballistics,
data exports, ad-free viewing.
**Membership may never lock:** anything in the Phase 2.5 list.

## Phase 5 - community (only against real demand)

Flarum is the right technical answer (MIT, self-hostable) but needs PHP and
MySQL, which our stack does not have. Use GitHub Discussions meanwhile; consider
Flarum only when there are real threads to move.

## Phase 7 - review aggregation (the site is a research site; this is core)

Placed last deliberately. It is the most valuable feature *and* the one with
real obligations attached, so it goes after the data plumbing exists and after we
have written the compliance scaffolding. Doing it first would mean shipping
review display before we can honour 465.3.

**Why it is legal at all.** 16 CFR 465.2(d)(2) exempts "[r]eviews that appear on
a website or platform as a result of the business merely engaging in consumer
review hosting" from the prohibition on disseminating reviews. We are a host of
genuine third-party reviews, not their author.

**Why it is not the same as what we removed.** The ratings we deleted in
September 2026 violated 465.2(a): there was no reviewer, no experience, and no
source. Displaying a real review written by a real person about a product they
bought is the opposite of that.

| # | Change | Why | Write-set |
| --- | --- | --- | --- |
| 7.1 | **Review data model** | Review, source, product, author hash, date. Provenance on every row, as with physical constants. | `data/schema/020_*.sql` (SERIAL) |
| 7.2 | **Collector with source licensing** | Each source's terms reviewed before ingesting. Do not scrape what forbids it. | `scripts/data/*.mjs` |
| 7.3 | **PUBLISH THE MONITORING PROCEDURE** | Required by 465.3. A real page, linked from every review display. | `apps/website/src/` |
| 7.4 | **Ability to produce a sample of disseminated reviews** | Required by 465.3: the FTC may ask. Must be a command, not an archaeology exercise. | `scripts/data/*.mjs` |
| 7.5 | **Review display with mandatory attribution** | Author, date, source. Never an unattributed quote. | `apps/website/src/` |
| 7.6 | **GATE: no synthetic ratings** | Extends `claims:check`. Fails if a rating appears with no underlying review rows. | `scripts/gates/` |

### Rules this phase must not violate

- **No review without a traceable source row.** An unattributed quote scraped
  from nowhere is invention, which is what we just cleaned up.
- **Do not filter out complaints about shipping, returns or service** unless the
  rule excludes them regardless of sentiment. The FTC Q&A warns that suppressing
  reviews about "a particular seller's customer service, delivery, returns, and
  exchanges" can itself be deceptive under Section 5.
- **No review incentives of our own.** We do not pay for reviews, and we do not
  run a "review us" campaign, because 465.2(b) prohibits purchasing reviews and
  an incentive taints the pool we host.
- **Affiliate status is never attached to a review.** A review of a product is
  about the product. A review of a retailer is about the retailer. Mixing them
  lets commission colour an opinion.

## Phase A - ammunition catalogue (BLOCKS all comparison work)

Placed first because it is a hard dependency and it is currently missing
entirely. **We hold no loaded-ammunition data at all** - no SKU, no box, no
stated velocity, no loaded bullet weight. Every comparison feature is blocked
until this lands.

Detail in `06-ammunition-comparison-model.md`. The short version:

| # | Change | Write-set |
| --- | --- | --- |
| A.1 | **Ammunition product schema** - caliber, loaded weight, bullet type, stated velocity with source, box size, UPC | `data/schema/021_*.sql` (SERIAL) |
| A.2 | **Seed ~20 duty and defensive lines**, not 1,000 SKUs | `data/seeds/`, `data/schemas/` |
| A.3 | **Provenance on every velocity**, tiered like every other number we hold | `data/seeds/value_provenance.csv` |
| A.4 | **GATE: no ammunition row without a source** | `scripts/gates/` |

Then Phase B: comparison view, review aggregation, conditions-required gate,
scoped conclusions, and a citation on every claim.

### The rule B4 turns on

We may draw our own conclusions. What we may not do is synthesise a score from
incomparable inputs. **Terminal performance is not a property of the
ammunition** - it depends on barrel length, media and temperature, so averaging
results across setups produces a number that is precise and meaningless. That
would be the fabricated-rating defect rebuilt out of real data.

Entitled to claim: cheapest per round, best value within a stated budget frame,
and "these sources agree". Not entitled to claim: a bare winner, or a star
rating synthesised across sources that measured different things.

## Phase 8 - ballistics video and review links

Deliberately adjacent to Phase 7 and sequenced after it, because both are
"content written by other people, displayed by us" and they share the same
obligation: we host, we do not author.

Detail in `05-ballistics-video-sources.md`. The short version:

| # | Change | Write-set |
| --- | --- | --- |
| 8.1 | `**Sources dataset** for third-party ballistics results, one row per (product, source, claim, cartridge, conditions) | `data/schema/021_*.sql` (SERIAL) |
| 8.2 | **Chambering-error gate for video claims** — a claim about cartridge X may not appear on bullet Y | `scripts/gates/` |
| 8.3 | **Conditions mandatory** on any third-party claim | `scripts/gates/` |
| 8.4 | **Neutral link display** — no `recommended`, no star-rating of a video | `apps/website/src/` |
| 8.5 | **Manufacturer data labelled first-party**, never mixed with independent testing | `apps/website/src/` |
| 8.6 | **Disagreement displayed, not resolved** | `apps/website/src/` |

### The creator-partnership constraint, recorded so it cannot drift

Partnerships are permitted for **promotion only, never for a finding**. Paying
for a ballistics test is prohibited in substance by 465.2(b), and a paid
recommendation is not evidence. If we ever pay or incentivise a creator, that is
a material connection we must disclose **on our side as well as theirs**, under
16 CFR 255 and the FTC guidance that disclosure travel with the endorsement, in
the video, not in the description.

Start with neutral links to creators we have no relationship with. That is the
`consumer review hosting` the rule contemplates, and it has no incentive to
distort on either side.

## Phase 6 - compliance follow-ups

| # | Change | Why |
| --- | --- | --- |
| 6.1 | Gate for load-data claims | `claims:check` covers advertising, not load data. "Safe"/"proven" about a load is a more dangerous class. |
| 6.2 | Recall surface | Every manufacturer site has one; a chambering error is a safety event. |
| 6.3 | Safety-equipment guidance | Ear and eye protection, first aid. |