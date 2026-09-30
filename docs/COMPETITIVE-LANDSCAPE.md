# Competitive Landscape and Strategy

Researched 30 Sep 2026 against live sites. This is competitive analysis, not
speculation.

---

## Who we are actually competing with

The reloading-data market has three distinct tiers, and **we are only
meaningfully competing in one of them.**

### Tier 1 — Simulated load data (the giants)

| Site | Scale | Model |
|---|---|---|
| **xxlreloading.com** | 4.6 M loads, 5,495 bullets, 278 powders, 465 calibers | Proprietary inner-ballistics solver, calibrated against DEVA (German Testing and Research Institute for Hunting and Sporting Weapons) |
| **ApexLOAD PRO** | Paid, ranked 97/100 | Internal ballistics platform; pressure, velocity, trajectory |
| **QuickLOAD** (Hartmut Brömel) | Licensed | Classic German internal-ballistics simulation |
| **Gordon Reloading Tool** | Free | Internal ballistics with pressure curves |

**This is not a fight we can win.** These are engineers with cloud compute,
proprietary solvers, and lab partnerships. We have a documentation budget and
a nap schedule.

More importantly, we would be doing something *ethically worse*. Every one of
their loads is **simulated**. We are better placed to publish **transcribed
manual data with a citation**, because that is verifiable and our whole
provenance system is built for it. Trying to match a solver is both impossible
and pointless.

### Tier 2 — Aggregated published data

| Site | Note |
|---|---|
| **LoadData.com** (Wolfe Publishing, *Handloader*/*Rifle* magazines) | Ranked 29/100. **Last major update 6 March 2018.** Non-standardised: case capacity, barrel length, seating depth and pressure method are missing or inconsistent. This is a live opening. |
| **Hornady Reloading Handbook** | Print. Good, but Hornady-bullets-only and not searchable |

LoadData.com's weakness is the opportunity. It aggregates *good* data and then
loses the context that makes it safe. Our schema already refuses to accept a
recipe without a source, a barrel length, and a pressure basis. That is a
genuine structural advantage over a table dump.

### Tier 3 — Retail + community

Guns.com, Brownells, MidwayUSA — catalogs and forums, no serious load data.
Weak in data, strong in commerce and community. **This is the gap.**

---

## The opening

**Nobody is combining verified load data with community and commerce.**

xxlreloading has the data but gates exact powder charges behind a paid licence
and has only a thin suggestion form, no real community. LoadData.com has
archives but no commerce and stale data. The retailers have community but no
trustworthy data.

Our position: **trusted data (free) + community + affiliate commerce.** That
combination does not exist today.

---

## Features worth stealing (and their weaknesses)

| Feature | Who has it | The weakness to exploit |
|---|---|---|
| **Fill ratio / powder compression** per load | xxlreloading shows fill ratio and has published a post explaining they **refuse highly compressed loads** outright | Compression is the top safety issue in modern reloading — bullet-curve/land-can-boundary wedging causes erratic pressure. Almost nobody explains it well. **This is our safety-authority angle.** |
| **Barrel-length variant of every load** | xxlreloading: "particularly important for regions where silencers are used with shorter barrels" | Nobody else does this properly. The Homann `t^-1/9` scaling already in our `reloading.ts` is exactly this. |
| **Community loads kept strictly separate from modelled** | xxlreloading: "so you always know which figures are modelled and which were shot by another reloader" | Maps *directly* onto our `published`/`derived`/`estimated` tiers. We have the better version — we also distinguish *published* from *estimated*. |
| **Subsonic load data** as a first-class section | xxlreloading | Cheap to add once recipes are modelled, genuinely useful for suppressed users |
| **Shared case capacities** across cartridges | xxlreloading | GECO and Norma cases are reused in wildcat cartridges. Non-obvious, high-value. |

---

## Ideas specific to the group-buy and forum work

| Idea | Why it works |
|---|---|
| **Load-data contests** — members submit groups for a caliber, ranked by published criteria | Free content, drives engagement, criteria are objective, and it teaches people to be better. |
| **Component availability board** — "who has X in stock near me" | Highest-intent, hardest-to-solve content. Drives repeat visits and gives genuine local value. |
| **"My brass for sale" with a trade history** | A rep score from completed trades. No custody needed — see the community doc. |
| **Bulk-powder group coordination** | Powders are the one consumable where bulk genuinely helps and online stock is poor. |
| **Free-text → structured load comparison** | "What loads exist for 168gr HPBT in .308?" Our relational schema answers it; LoadData.com cannot without a rewrite. |

---

## Positioning statement

> Apex AMC is the only reloading reference that shows you **where every number
> came from**, shows you the **safety margin** before you load it, and lets you
> **find the components near you**. Free, and linked to the retailers you
> already use.

Test every feature decision against that sentence. If a feature does not make
us more *trusted*, more *local*, or more *useful*, it is noise.

---

## What not to build

| Idea | Why not |
|---|---|
| Our own internal-ballistics solver | Cannot match four competitors who have labs. Our edge is transcription and provenance. |
| Paid load data licence | Our differentiator is free and verified. Charging contradicts it. |
| Unbounded user-posted loads on the main site | Community loads on a *safety-critical* surface are a liability we cannot moderate. If we do it, it belongs on a separate board, clearly marked, with required source citations. |
| Anything that holds member money | See [COMMUNITY-AND-GROUP-BUY.md](COMMUNITY-AND-GROUP-BUY.md). |
| Predicting velocity from charge weight | Without a validated solver this is a guess with a firearm attached. Never. |

---

## Sources

- https://www.xxlreloading.com/ — scale, feature list, safety policy, model description
- https://www.xxlreloading.com/load-data — filter structure, inner-ballistics model, CIP/SAAMI pressure capping, compression guidance
- https://loaddatacompare.com/reloading-resources — 26-resource competitive ranking with scores
- https://en.wikipedia.org/wiki/Pinduoduo — group-buy model
- https://www.groupspree.com/How-it-works — pledge-then-checkout mechanics

| **Digital load diary** | xxlreloading (paid) | We already log chronograph + shot groups in the Expo app, and the schema supports it. |
| **Unit switching (gr/g, fps/ms)** by locale | xxlreloading — English site imperial, German site metric | Trivial for us, and the audience is genuinely international |

### Two things nobody does that we should

1. **Surface the safety margin as a number.** `reloading.ts` already emits a
   COAL warning when a user seats deeper than published. Nobody shows "you are
   0.010 in deeper than the manual; expect roughly this much more peak
   pressure." Make that a headline feature.
2. **Show pressure conflicts in the data itself.** The seed data already found
   two (`.350 Rem Mag` and `6.5 Rem Mag`, SAAMI vs copper-crusher). Surfacing
   disagreement honestly is a trust signal no competitor offers.
