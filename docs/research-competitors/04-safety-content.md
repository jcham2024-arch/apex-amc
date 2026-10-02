# Safety content a responsible reloading site must surface

Drawn from what Hornady, Brownells, CIP and SAAMI visibly put in front of users on
2 Oct 2026, plus our own compliance work. This is the list we must never lose,
and the reason accounts must not gate any of it.

## What the established sources put up front

### Hornady
- **An 18+ age gate before the site loads.** Explicit: "Our site is for individuals
  at least 18 years old. Are you at least 18 years old?" This is the single most
  visible safety control in the category and we do not have it.
- **A prominent load-data safety notice, pinned to the top of the page**, not in
  a footer: "The 6.5 PRC entry in the 12th Edition Hornady Handbook of Cartridge
  Reloading contains a misprinted powder. Please read the safety update before
  loading." They surface a real defect loudly and immediately.
- **A Recalls link in the primary nav.** Recalls are a safety instrument, not a
  compliance chore.
- **Drag Variability Reduction technology** as an educational topic.
- **Warranty registration, MSDS sheets, product recalls** as distinct support
  destinations.

### Brownells
- **Safety Gear as a first-class category**: ear plugs, ear muffs, shooting
  glasses, first aid kits, gas masks, range flags, snap caps and dummy rounds.
- **Maintenance how-tos** (rifle, handgun, shotgun) promoted in the main nav.

### AmmoSeek / Ammo Scout (aggregators)
- **Explicit non-affiliation disclaimers, stated at the top.**
- **Ratings are clearly separated from facts.** AmmoSeek has a Retailer Ratings
  page, distinct from its price data, so a rating never masquerades as a
  measurement.

## What we have, and what is missing

| Control | Status |
| --- | --- |
| Affiliate / endorsement disclosure | done, and correctly placed above the retailer links |
| Substantiation gate for marketing claims | done (`claims:check`) |
| Safety information not behind a paywall | held, but not yet tested |
| **18+ age gate** | **MISSING** |
| **Load-data defect notices** | **MISSING** |
| **Product recall surface** | **MISSING** |
| **Safety-equipment guidance** | **MISSING** |
| Maintenance / cleaning education | thin |

## Review aggregation: what the law actually requires

Researched 2 Oct 2026 against 16 CFR Part 465 (Rule on the Use of Consumer
Reviews and Testimonials) and the FTC's own Q&A. Quoted, not paraphrased,
because this determines whether a core feature is legal.

**§465.2(a)** — it is unlawful for a business to "write, create, or sell a
consumer review... that materially misrepresents" that the reviewer exists, that
they used the product, or that their experience is what the review claims.

This is what our removed ratings were. There was no reviewer. **That removal
stands and is not reversible.**

**§465.2(b)** — it is unlawful to purchase a consumer review, or to disseminate
one the business "knew or should have known materially misrepresented" any of
those three things.

**§465.2(d)(2)** — paragraphs (b) and (c) "do not apply to:... [r]eviews that
appear on a website or platform as a result of the business merely engaging in
**consumer review hosting**."

**This is the provision that makes the user's stated model workable.** Aggregating
genuine third-party reviews of available products is expressly contemplated.

### The obligations hosting creates (465.3)

1. Have a **procedure for monitoring** the reviews you publish.
2. **Publish a statement** of that procedure.
3. **Send a sample** of the reviews you disseminated to the FTC, on request.

None of these is optional, and we meet none of them today. They are Phase 7 in
the feature plan, and the sample-production capability must be a command rather
than a reconstruction exercise.

### Two traps the FTC calls out specifically

- Suppressing reviews about "a particular seller's customer service, delivery,
  returns, and exchanges" "can be deceptive in violation of Section 5 of the FTC
  Act." Even an even-handed filter is dangerous here.
- An **incentivised** review is a problem even if honest. We will not run a
  "review us and get X" campaign, because it taints a pool we merely host.

### The line, stated once

| Prohibited | Permitted |
| --- | --- |
| Inventing a rating or a review | Displaying a real review with attribution |
| Buying reviews, incentivising them | Hosting reviews written elsewhere |
| Disseminating a review we know is false | Removing a review we can show is fake |
| An unattributed quote from nowhere | A quote with author, date and source |
| Ranking retailers by commission | Ranking on price, stock and history only |

## The rule that must not break when we add accounts

When membership arrives, these must remain reachable without an account:

1. **Every safety notice.** Absolutely all of them.
2. **The reloading checklist and beginner guidance.**
3. **Ballistic reference data and provenance.**
4. **The retailer directory with its disclosure.**
5. **Any statement about a load being unsafe or unverified.**

Rationale: a person who cannot afford or register for a membership may be the
person most in need of a chambering warning. Gating safety behind payment or an
email address would be both harmful and, for an endorsements-adjacent site,
a regulatory problem.

**Add this as a gate.** A test that asserts every element carrying a
`safety` or `notice` class is reachable in the no-account DOM. Without a test, a
well-meaning future refactor that wraps the hero in an auth check would pass
every existing gate in this repository - the same failure as the CSP gate that
passed while blocking the whole site.

## Copy we must never write

- A specific powder charge presented as correct without a cited manual.
- "Safe", "proven", or "factory match" applied to a load we have not verified.
- Any claim that a component is compatible, without a source.
- Any savings or accuracy figure without a stated condition and denominator.

Our existing `claims:check` gate covers the marketing surface. It does **not**
cover these, because they are about load data rather than advertising. A second
gate for load-data claims is the natural next task.