# Community, Group Buys, and the Group-Wallet Question

Status: **research and design only. Nothing is implemented.** This document
exists so the idea is not lost, and so nobody builds the wrong version of it.

---

## The headline: a "group wallet" is off the table

The instinct — pool money so a group can hit a bulk-order threshold — is the
obvious design. It is also the one version that would put the site outside the
law.

FinCEN's rule (verified at fincen.gov, MSB Registration guidance):

> "No activity threshold applies to the definition of money transmitter.
> Thus, a person who engages as a business in the transfer of funds is an MSB
> as a money transmitter, regardless of the amount of money transmission
> activity."

So if Apex AMC **receives and holds** members' money — even briefly, even
escrow-style — it is a money transmitter. That means:

- FinCEN MSB registration (Form 107), renewed every two years
- Record retention in the US for five years
- Customer identification, AML programme, suspicious-activity reporting
- **Separate state money-transmitter licences in every state we operate in**,
  which is the expensive part — each is its own application, bond, and exam
- Personal criminal liability for the owner/control person

And that is the *federal floor*. Layer on top:

- Payment processors (Stripe, PayPal, Square) terminate accounts whose
  business model is pooled payments, regardless of licence status.
- A site holding pooled funds for **firearms-adjacent goods** attracts
  enforcement attention a normal retailer never sees.
- E&O insurance excludes money-transmission risk.

**Conclusion: we do not hold member funds. Ever. This is a hard
architectural constraint, not a preference.**

---

## What the working models actually do

Two real-world patterns, both of which avoid touching the money.

### Pinduoduo (origin of the "group buy" idea)

Members join a group and commit. When the threshold is met, the group closes
and the single bulk order is placed. Critically, **the platform takes the money
at checkout after the group has already closed** — it is buying goods for
customers, not brokering money between them. A retailer running a preorder,
not a wallet.

### Groupspree (the transferable version)

Their published flow is the cleanest model to copy:

1. **Supplier proposes** a product at a set bulk quantity and discount.
2. **Group-buy opens**, showing details, photos, reviews.
3. **Members pledge** to buy at that price.
4. **Once the quantity is met, the group closes.**

---

## The design we should build

**A coordination layer, not a financial one.** Apex AMC provides matching,
information, and logistics; payment happens between member and licensed
retailer.

```
   ┌──────────────┐         ┌───────────────────┐
   │  20 members  │────────>│  Apex AMC         │
   │  each wants  │  pledge │  (never holds $)  │
   │  1 case of   │         └───────────────────┘
   │  Federal     │              │ group fills
   └──────────────┘              v
                     ┌───────────────────────┐
                     │  MidwayUSA (licensed  │
                     │  retailer) ships to   │
                     │  each member directly │
                     └───────────────────────┘
```

Every member gets their own invoice, shipping address, and affiliate tag. Our
commission comes from the affiliate link either way — the same revenue we
already have — so **group-buy adds no new monetisation risk and needs no
financial licence.**

### What Apex AMC actually provides

1. **A group object** — proposed purchase with target quantity, deadline, and
   per-member allocation.
2. **A pledge** — "I want 5 boxes." No payment captured.
3. **A fill notification** — when the threshold is met, members get a
   personalised checkout link, individually affiliate-tagged.
4. **A failure path** — if the group does not fill, pledges expire. No
   refunds, because no money was taken.

That last point is a genuine design advantage: **our model has no refund
liability at all.**

---

## The forum

Separate from group-buy, and much less legally fraught. A normal community
product; the real obligations are moderation, privacy, and section 230
posture for user-posted content.

### Schema

```sql
-- Members and their location (location-based, per the user's request)
CREATE TABLE members (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    handle        TEXT NOT NULL UNIQUE,
    display_name  TEXT,
    bio           TEXT,
    -- Coarse location only. Never store a street address.
    city          TEXT,
    region        TEXT,               -- state / province
    country       TEXT DEFAULT 'US',
    latitude      REAL,               -- deliberately rounded
    longitude     REAL,
    location_fuzz_km REAL NOT NULL DEFAULT 50,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE threads (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id    INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    -- Soft delete for moderation; never hard-delete, so replies keep context.
    removed_at  TEXT
);

CREATE TABLE posts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id   INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    body        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    edited_at   TEXT,
    removed_at  TEXT
);
```


---

## Risks to weigh

| Risk | Severity | Mitigation |
|---|---|---|
| Pooling money → money transmitter | **Critical** | Never hold funds. Pledge, then link out. |
| Member location privacy | High | Coordinate fuzzing, distance bands only |
| Selling ammo without a licence | Critical | **We link to licensed retailers. We never sell.** |
| Moderation burden | Medium | Start small; require account age for trading boards |
| Fraud in trading posts | High | Reputation history; escrow-free by design, so no loss |
| Liability for bad advice | Medium | Clear disclaimers; require citations in load-data posts |
| Payment processor termination | Low | By design — we are not a payments business |

**The ammunition one worth stating plainly:** selling ammunition directly in
the US requires licensing, and above certain thresholds it is a regulated
activity. We are an **affiliate directory and reference**, not a seller.
Group-buy must route to licensed retailers and never fulfil itself.

---

## Recommended build order

1. **Location-aware forum**, no payments at all. Proves the community works
   and carries no financial exposure.
2. **Material trading** between members — used brass, projectiles, gear.
   Purely peer-to-peer; we are not a party to the transaction.
3. **Group-buy coordination** with pledge-then-link, no custody.
4. Only after 3 has traction would a payment partner (Stripe Connect, for
   example) be worth evaluating — and that conversation needs a lawyer, not a
   guess.

---

## Open questions for the user

1. **Do we ever want to sell directly?** If yes, that is a separate and much
   larger business (licensing, FFL-adjacent questions, storage compliance)
   and should be scoped separately from the reference site.
2. **Moderation appetite.** A trading board needs real moderation. Who does
   it, and how many hours a week? This determines whether the forum launches
   at all.
3. **Private or public groups?** Private cartridge-specific groups are much
   friendlier for beginners. Requires invitation/join-request flow.
4. **Age gate.** Most of this audience is over 18 but some retailers require
   21+. Decide whether group-buy requires a verified age.

---

## Sources

- FinCEN, *Money Services Business (MSB) Registration* — the "no activity
  threshold applies to money transmitter" rule:
  https://www.fincen.gov/resources/money-services-business-msb-registration
- 31 CFR 1022.380 and 31 CFR 1010.100(ff) — MSB definition and registration
- Groupspree, *How it works* — pledge-then-checkout flow:
  https://www.groupspree.com/How-it-works
- Pinduoduo corporate history and group-buy mechanics:
  https://en.wikipedia.org/wiki/Pinduoduo

**Not legal advice.** Get an actual attorney before implementing anything in
the group-buy section. The forum section is low-risk, but moderation policy
and privacy design deserve real review too.

### Location privacy — decide this before writing any UI

"Local reloaders near me" is the part with real privacy risk. Members posting
their address in a niche hobby community is a genuine targeting problem.

**Requirements:**
- Store **rounded** coordinates only. Members set their own fuzz radius;
  default 50 km (~30 miles), never finer than 10 km.
- Never display a member at their exact coordinates. Distance is shown as a
  band ("within 25 miles"), never as a point.
- No exact location in search results, exports, or API responses.
- Distance via Haversine against rounded coords, computed server-side.

### Boards to start with

| Board | Purpose |
|---|---|
| Loading data | Paste a result, get it checked against manuals |
| Component availability | "Who has H4350 near me?" |
| Brass & case sourcing | New/used, LC vs PBr, match-grade |
| Gear | Scales, presses, dies — often local, rarely shipped well |
| Range reports | Group photos plus the data behind them |

5. **Participants then check out and pay**, and the product ships.

The critical property: **payment happens after the group has already formed.**
The site never holds anyone's money before the purchase exists.

### Tidal Line and similar firearms services

These run group-buys on a *consignment* basis — the retailer or a sponsor
fronts the bulk order with its own money, and members pay the retailer
directly once confirmed. The site coordinates; it does not custody.
