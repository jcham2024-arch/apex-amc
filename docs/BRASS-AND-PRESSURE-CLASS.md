# Brass, case capacity, and pressure class

Researched 30 Sep 2026. **VERIFIED** means read from a primary or
well-established source during this session. **UNVERIFIED** means a lead that
needs confirming before we design against it.

This document exists because "which brass is best" is one of the most-asked
reloading questions and one of the most badly answered online. The honest
answer is partly measurable, partly a genuine capacity question, and partly an
unsummarisable matter of opinion. Separating those three is the whole job.

---

## 1. Correction to the "stronger brass" model

The user offered: *"Nato can handle higher pressures and needs less powder to
do it."* The **first half is right; the second half is a category error, and the
two are unrelated.**

### 1.1 What +P and NATO brass actually do

VERIFIED (American Handgunner, "Handloading +P Brass", Brad Miller, 2017):

> Plus P (+P) brass is designed to be stronger than regular brass in order to
> withstand the additional pressure of +P rated cartridges.

> In some semi-automatic pistols, the feed ramp consists of a slight cutout of
> the barrel chamber which might leave some portion of the case above the
> extractor groove exposed, or unsupported. This unsupported part of the case
> can expand when the cartridge is fired, and if the brass is not strong enough
> to hold the pressure, the case can burst.

> Brass is usually made stronger by thickening the web and case wall near the
> base. [...] A thicker web and case walls reduce internal volume, and this in
> itself will increase pressure and velocity since the powder chamber is
> smaller. Some +P brass does have reduced volume, but some +P cases might not
> have less volume than standard cases.

The mechanism matters, and it is *not* "stronger brass absorbs more pressure."
It is **two separate effects that are frequently conflated**:

1. **Strength (the real reason +P exists).** A thicker web resists the case
   bulging at the unsupported forward portion, which is where pistols actually
   fail cases. This is a *durability* property.
2. **Capacity (a side effect, not a benefit).** A thicker web also *reduces
   internal volume*, which **raises** pressure at the same charge weight.

**So +P brass does not make a hot load safer by absorbing it. It makes the case
more likely to survive it, while simultaneously making the same charge weight
hotter.** Those pull in opposite directions, and any UI that implies "+P brass
= more headroom" is wrong in a way that could hurt someone.

The article's own conclusion is the correct posture:

> If you're loading +P loads, it's wise to use +P brass because this identifies
> it as being strong enough for the task. [...] Even the strongest brass has
> limitations.

### 1.2 The design rule we should encode

> **Stronger brass buys margin against case failure. It buys NO margin against
> pressure, and typically costs some capacity — which increases pressure at a
> given charge weight.**

The correct recommendation for a shooter approaching the top of the ladder is
therefore:

- Use brass **rated for the pressure class** (`pressure_class` already exists in
  `case_reuse_profiles`, with `'plus_p'`, `'nato'` and `'magnum'` values).
- **Re-derive the charge weight for that brass.** A charge weight published for
  standard brass is *not* transferable to +P or NATO brass with any confidence,
  because capacity differs between them.
- Never present +P brass as permitting a higher charge weight.

This is a case where our provenance discipline pays for itself: if we show a
published load's max charge for a *specific headstamp*, and the shooter's brass
is a different headstamp, the honest output is a warning, not a number.

### 1.3 What we must not build

**No "pressure rating" or "safety score" for brass.** There is no citable
metric for this, and manufacturing a composite score would be a fabricated
number presented as measurement — precisely what the provenance system exists to
prevent. Brass may be **filtered** by:

- pressure class rating (a real, published attribute)
- measured capacity (real, if we have a sourced figure)
- case-source consistency (real, from `case_reuse_profiles`)
- primer type and pocket condition (real)

and it may be **ordered only by cited attributes**. Never by an invented
composite.

---

## 2. Case capacity is the measurable variable

This is the part we *can* quantify, and it is what actually explains the
velocity differences people attribute to brand.

VERIFIED, same source, measured with a Powley:

> The capacity of two other brands of new .45 Auto cases was measured, standard
> Winchester and Remington +P. The Winchester case held 28.3 grains of Accurate
> #7, and the Remington +P held 27.9 grains. [...] Less case capacity increases
> velocity and pressure.

> If you use mixed headstamp brass, there is a good chance the velocity will be
> more variable than if the cases are all the same headstamp. If you want the
> most consistent speeds, use the same headstamp.

The user's Speer observation lands here and is well-founded: **capacity
consistency within and between lots is the real quality axis**, not hoop
strength.

Note the spread in that measurement — about 1.4% between two mainstream
brands. That is enough to matter, and it is why a single published ladder is a
starting point rather than an answer. The correct advice is uniform headstamp
for consistency, which is *behavioural* and we can state it without inventing a
metric.

`cartridges.capacity_gr_h2o` already exists in schema 009 and `012` already
provenance-tracks it. Good.

---

## 3. The consensus-aggregation idea, and its hard limits

The user wants to aggregate published reviews — YouTube and forum threads — into
a consensus on which brass suits which application.

**This is worth doing, but it is the highest-risk feature in the product and it
must never touch a load number.** Three reasons the risk is higher than it looks:

1. **A consensus of 40 videos is still 40 anecdotes.** It is a *prevalence*
   measure, not a truth measure. Popularity is not accuracy, and brass
   preference is partly a matter of what a reviewer happens to own.
2. **"Best" is not a property of the brass.** It is a property of the
   brass/application/price-availability triple. Blazer is "not great for higher
   pressures" *and* is the easiest to load *and* is cheap and consistent for
   low-pressure plinking. A naive "score" would rank Blazer poorly and mislead a
   beginner who would be perfectly safe and happy with it. **The user's own
   framing is better than a score: each brass has a place, and the useful output
   is "for your use, start here."**
3. **Sentiment toward a brand is near-worthless as a safety signal.** If we ever
   let a scraped consensus nudge a load number, we have crossed the line into
   the forum-recipe problem we already rejected in ROADMAP 1.4.

### 3.1 What we can legitimately build

- **A linked digest.** "Here are 6 threads and 4 videos discussing Speer brass
  for 9mm +P work." We index and link; we do not paraphrase into a verdict.
- **Frequency counts, shown as counts.** "Mentioned in 6 of 20 discussions" is
  a fact. "Score: 4.2/5, best for hot loads" is an invention.
- **Per-application summaries, attributed and dated**, explicitly labelled as
  opinion. Honest about sample size: "6 threads, 2019-2026, low sample."
- **Author reputation weighting** — a gunsmith with a shop and a named
  following is a different evidence class from a first-post. Both are
  community sources; neither is a manufacturer.

All of this lands in the existing `community_observations` table, which already
has `agreement_level`, `confidence`, `source_url NOT NULL`, and no FK path into
official data. **The schema already encodes the rule; we do not need to relax it
to build this.**

### 3.2 The beginner-starting-point feature (worth doing)

The user wants a good default for newbies. This is safe *if* it is expressed as
a pointer, not a number:

> "For a first 9mm target load on standard brass, the manuals consistently
> start with [powder] at [range] gr. [Cite each manual and its edition.] Your
> gun's max COAL is X; verify your actual seating depth."

Every element of that is a cited fact or an explicit pointer. It is not a
recommendation we generated. And it composes with the errata system from
ROADMAP 1.1b — if one of those manuals has a published correction, the
suggestion changes. **That is the single best argument for building the load
feature at all**, and it is a stronger product than a score ever would be.

---

## 4. The user's practical point, restated safely

> I personally load my hotter loads in SPEER brass or Winchester Nato.

That is a legitimate, defensible practice and the reasoning checks out against
the physics above: uniform headstamp for consistency (Speer), and a case rated
for the pressure class (Winchester NATO) for hotter loads.

The version we can support: *"for hot loads, +P or NATO-rated brass is
appropriate; re-develop your charge weight for that brass; uniform headstamp
gives the best consistency."*

The version we must not support: *"Speer brass is rated for higher pressure than
Blazer."* Not a real metric, and wrong.

---

## 5. Standards reference (VERIFIED)

Max pressures, rounded up to the nearest ksi, from the KWK cartridge pressure
standards table (last updated 8/2005 - 11/2023), which reproduces SAAMI and CIP
figures:

| Cartridge | SAAMI max | CIP max | Notes |
|---|---|---|---|
| 9mm Luger | 35,000 psi | 34,000 psi | |
| 9mm +P | 39,000 psi | — | Separate, higher-pressure designation |
| .40 S&W | 35,000 psi | 33,000 psi | |
| 10mm Auto | 38,000 psi | 34,000 psi | |
| .38 Special | 17,000 psi | 22,000 psi | **CIP is higher** — chambering matters |
| .38 Special +P | 20,000 psi | — | |
| .357 Magnum | 35,000 psi | 44,000 psi | **CIP far higher** — not interchangeable |
| .45 ACP | **UNVERIFIED** | **UNVERIFIED** | Must confirm before use |
| .357 SIG | **UNVERIFIED** | **UNVERIFIED** | Must confirm before use |

The SAAMI/CIP divergences are not trivia. **A .357 Mag rated 35,000 by SAAMI is
44,000 by CIP**, and `.45 ACP` and `.357 SIG` are both absent from the table I
could reach. This is a concrete, sourced example of why the `standard_body`
column in `009_cartridge_specs.sql` (`SAAMI` / `CIP` / `NATO` / `other`) must be
populated and surfaced. A load developed to a CIP chamber is not a load
developed to a SAAMI chamber.

**Action: confirm .45 ACP and .357 SIG before any 9mm-family load UI ships.**
The chambers are visually and dimensionally near-identical to 9mm, which is
exactly how chambering errors happen.

---

## 6. Open items for the data agent

- Populate `pressure_class` on `case_reuse_profiles` — real values, per
  cartridge, with `source_url`.
- Record **measured** capacity figures per brass where a manufacturer or a
  recognised authority publishes them. These are `published` provenance. Do not
  interpolate.
- Populate `standard_body` per cartridge. It is load-bearing for the above.
- Add **brass headstamp** granularity to `recipes.case_brand` — "Speer" is too
  coarse given capacity differences of ~1.4%.
- If a capacity figure is a community measurement, it belongs in
  `community_observations`, not in `cartridges.capacity_gr_h2o`.