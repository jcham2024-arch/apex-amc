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
| Fabricated retailer ratings | 16 CFR 255.2(b). Already removed once; `claims:check` blocks reintroduction |
| Unqualified savings claims | "30-60% avg savings" was false |
| Paywalled safety content | Harmful, and a regulatory risk |
| Breadth scraping (1000+ retailers) | Not achievable, not the point, and would cost the accuracy we have |
| A forum before there is a community | An empty forum reads as abandonment |

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

## Phase 6 - compliance follow-ups

| # | Change | Why |
| --- | --- | --- |
| 6.1 | Gate for load-data claims | `claims:check` covers advertising, not load data. "Safe"/"proven" about a load is a more dangerous class. |
| 6.2 | Recall surface | Every manufacturer site has one; a chambering error is a safety event. |
| 6.3 | Safety-equipment guidance | Ear and eye protection, first aid. |