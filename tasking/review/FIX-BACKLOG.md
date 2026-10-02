# Fix backlog — everything the swarm found, and what happened to it
> **Nothing gets deleted from here.** A finding is closed, not removed. The reason a
> finding is NOT fixed is usually the most useful part.
**Why this exists.** The swarm found roughly a dozen real defects and could not fix
any of them: unattended agents write findings, not application source. Without a
ledger those findings would live only inside completed task folders, get read once,
and be forgotten — which is exactly what `check-tasking` exists to stop happening to
tasks, and it was about to happen to defects.
The owner asked for a batch of low-risk fixes to be approved, with a note kept so
everything can be swept later. This is that note.
**Status values**
| Status | Meaning |
| --- | --- |
| `FIXED` | Applied and verified in `npm run verify`. |
| `APPROVED-BATCH` | Owner approved fixing; not yet applied. |
| `DEFERRED` | Known and valuable, deliberately not done yet. Reason stated. |
| `BLOCKED` | Cannot proceed without an owner decision or external fact. |
| `REJECTED` | Deliberately not a defect. Reason stated so it is not re-raised. |
---
## Fixed — 2026-10-02, owner-approved batch
### 1. `process.cwd()` in four gates — FIXED
**Found by:** `tasking/completed/code-audit/KNOWLEDGE.md`
**Quote:** *"Run from the wrong directory it walks the wrong tree and can report a
**false green**."*
| File | Line | Gate |
| --- | --- | --- |
| `scripts/gates/check-docs.mjs` | 62 | resolves every backticked path in every doc |
| `scripts/gates/check-oracle.mjs` | 48 | cross-checks physics against `data/reference` |
| `scripts/gates/check-regulations.mjs` | 39 | validates regulation rows |
| `scripts/gates/check-ci-parity.mjs` | 27 | compares `verify` against CI |
All four now import `root` from `scripts/shared/data.mjs`. `check-docs` was the
serious one: it resolves every repository path in every document, so a cwd-rooted
run checks the wrong tree and can pass while checking nothing.
### 2. Naive CSV split on a write path — FIXED
**Found by:** `code-audit`, marked **High, latent**
**Quote:** *"`import-bullets.mjs` splits bullets CSVs on `,` while
`shared/data.mjs` says of the same operation that it 'is not merely inelegant, it is
wrong'. Currently latent (no bullet row has an embedded comma) but it is a **write**
path."*
`scripts/data/import-bullets.mjs` now uses the shared RFC 4180 `readCsv`.
**Why this was safe to approve.** The corruption is silent — a field containing a
comma shifts every later column, and the row count still matches, so nothing
downstream notices. It is a data-writing path, which is why it was not auto-approved.
Before changing it I verified equivalence rather than assuming it:
```
berger     naive===readCsv: true | rows: 109
hornady    naive===readCsv: true | rows: 7
sierra     naive===readCsv: true | rows: 4
```
Byte-identical across all 120 real rows, so the fix removes a latent corruption path
and changes no current output. **Prove a no-op before applying a fix to a write
path — that is what makes "low risk" a measurement rather than a hope.**
### 3. `eslint.config.js` ignoring a non-existent `temp/**` — APPROVED-BATCH, not yet applied
**Found by:** `code-audit`
**Quote:** *"it silently tolerates a second scratch location that `.clinerules` §5
rule 10 does not mention — the rule says scratch goes in `tmp/`."*
Deliberately not applied yet: deciding whether to delete the ignore entry or amend
§5 rule 10 is a **protocol** decision, and protocol changes are the owner's. Left for
the sweep.
---
## Deferred — known, valuable, not now
### 4. `9 Luger` and `.22 LR` filed under `rifle.csv` with `family=rifle` — DEFERRED
**Found by:** `ammoseek-coverage`, and named by its own author as *"a real defect,
not yet fixed — it was outside this task's write-set."*
**Why deferred:** `cartridge-family-audit` is producing the complete list and an
exact diff. Fixing two rows from a summary would mean acting on a partial view of a
defect class. Wait for the audit; the sweep applies its diff.
### 5. Eleven remaining `process.cwd()` sites — DEFERRED
Same defect as item 1, in `scripts/extract/`, `scripts/security/` and `scripts/text/`.
Excluded from the batch because `extract-website.mjs` *overwrites six hand-edited
files* and is deliberately unreachable from `package.json`. Changing root resolution
in a script that rewrites the site is not a mechanical edit.
### 6. Fifteen re-derived `root` constants + nine sha256 call sites — DEFERRED
Cosmetic duplication, correctly identified by `code-audit` as *"each solved a problem
that was already solved."* Zero behavioural risk, no defect. Worth a sweep for
consistency, not worth interrupting a green build.
### 7. `ledger.json` records `"stages": 14`, real is 22 — DEFERRED
**Quote:** *"That file is called 'the authoritative task ledger' by
`tasking/README.md`."*
Deliberately **not** fixed by editing the number. `.clinerules` already resolved this
exact class of drift by *deleting* the count rather than replacing it: a number in a
rules file is trusted, and a wrong one is worse than none. The real fix is to stop
restating a derivable count, which is a protocol change.
---
## Blocked — needs the owner or an external fact
### 8. `brand-rename` — BLOCKED
Trademark clearance is complete and `docs/BRANDING.md` holds the options. **Needs an
owner-chosen name.** `APEX AMMUNITION` is a live USPTO registration (Reg. 5391055,
IC 013) with an operating storefront, so this is a naming decision with legal weight,
not a technical one.
### 9. CIP licensing contradiction — RESOLVED by not transcribing (see item 19)

Two completed tasks disagreed on whether CIP cartridge dimensions may be transcribed (see
`tasking/completed/ammoseek-coverage/KNOWLEDGE.md` §7 versus
`tasking/completed/cartridge-dimensions/REPORT.md`). The reconciliation found the terms
genuinely self-contradictory: the notice forbids reproduction, and it lives in the
per-cartridge PDFs but not on the index page.

**Resolved without a lawyer**, because the answer turned out to be a product question rather
than a legal one: **CIP dimensions are not needed for cost, ballistics, cartridge selection
or sourcing.** So we do not transcribe them, we link instead, and the contradiction never has
to be adjudicated. Verified mechanically — no CIP dimensional value appears in any output.

Permission was checked rather than assumed and is not available as a free self-service
route; CIP is a body of fourteen sovereign member states. **Full reasoning and the retrieval
evidence are in item 19.**
### 10. Load-table licensing — RESOLVED (owner decision, 3 Oct 2026)
> **"Cite and link. If we are not able to give the user that data, then they need to go
> buy the book. That keeps us legally safe."**
The owner chose the most conservative of the options, and it is the right one. **We do
not store, cache, or republish any manufacturer's load data.** We cite the source,
attribute it, link to it, and tell the user plainly when a figure lives behind a
purchase they must make themselves.
This resolved a commercial question that had blocked the load-lookup feature since
`interior-ballistics` first reported it, and it unblocked `published-load-lookup-spec`.
**What it makes unnecessary — a real simplification, not just a legal one:**
| No longer needed | Why |
| --- | --- |
| A `recipes` dataset | We would never populate it |
| Load-data schema and migration | Nothing to store |
| Staleness handling for load figures | We display a link, not a snapshot |
| Per-edition correction tracking | The manufacturer's edition *is* the source |
**What it does not remove:** the refusal requirement. A lookup that cannot say "no
manufacturer publishes this combination" is still unsafe — the Hornady 6.5 PRC
misprint is a name-matching hazard regardless of where the number comes from. And a
sourced figure and a derived one must still never share a visual treatment.
**The boundary that needs care:** storing *pointers* is not storing *values*. Knowing
"Berger publishes load data for bullet X at this URL" is metadata; copying the grain
weights off that page into `data/` is redistribution. The lookup cannot route a user
to a page without knowing the page exists, so it must store metadata — and the task is
required to keep that line explicit rather than let it erode.
`interior-ballistics`' finding still stands and is still load-bearing: no manufacturer
publishes burn rate or pressure exponent, and none ever will.
---
## Rejected — not defects
### 11. Over-exported helpers in `scripts/security/security-rules.mjs` — REJECTED
`code-audit` flagged `templateInjectionFindings` and `remoteScriptFindings` as
unreferenced, then rejected its own flag: they are used inside the file by
`securityFindings`, which is what callers import. **Over-exported, not dead.**
### 12. Eight scripts unreachable from `package.json` — REJECTED
### 13. Retailer price storage + monetisation posture — PARTIALLY RESOLVED (owner, 3 Oct 2026)
> "As far as revenue generation goes, we don't need to make things easy for anyone who is
> not paying us to send people to them."
**Affiliates unblock stored prices — and only for the retailers in those programmes.**
This is a real and correct point about *permission*: an affiliate agreement is itself a
licence to display the partner's product data, including price. It is also the mechanism
that makes the non-paying case cheap rather than merely unprofitable.
Store-and-display prices therefore become permitted **for affiliate partners**, and the
lawful-routes question in `retailer-price-data-options` closes for them.
**The requirement this creates, which is not optional**
**Any outbound link must carry its commercial relationship.** The FTC endorsement guides
require a clear and conspicuous disclosure that we receive compensation when we receive
it. A design that pushes paying retailers to the top and buries the rest is exactly the
arrangement that disclosure exists for, and **the incentive to obscure grows precisely as
the money does.**
So this decision has a mandatory companion: a per-link or per-row disclosure that
survives the case where every visible link happens to be an affiliate. That is the hardest
case to notice and the one most likely to be wrong, because it looks identical to the
correct case.
**The conflict - RESOLVED by the owner, in favour of local utility**
> "We can display local shops."
The directory stays, free and complete for independent FFLs whether or not they pay us.
Revenue comes from online retailer comparison; the local directory is not a revenue
surface. This settles the tension I flagged two messages ago.
**The obligation this creates.** Because the directory is explicitly not monetised, it
must be *visibly* not monetised. If independent shops appear in one surface and are
absent from another, a user reads that as a judgement about those businesses rather
than a commercial decision about us. Keep its neutrality explicit in the data model -
`affiliate_network` is already a column, and it must not affect presence, ordering or
labelling in that surface.
**Deferred by agreement - shop scraping, once there is traffic**
> "Once we are up and running, we can send messages to these local shops and if they are
> not a part of an affiliate program, we can make our own arrangements to scrape and
> display their sites. But we need enough traffic first."
Agreed and deferred, and the sequencing is right: a shop has no reason to grant a
stranger permission, and audience is the one asset that changes that. Two things to
preserve when it is picked up:
1. **"Our own arrangements" means permission, and it must be recorded.** Written, per
   shop, naming what may be collected and how often.
2. **A shop that agrees to scraping is a shop we should pay.** Taking a catalogue for
   free while sending buyers elsewhere is how a site gets blocked and disliked. Not
   urgent, but worth not designing in.
Not a safety blocker. Ordinary commercial negotiation, conservatively sequenced.
*(Superseded positions, kept because the reasoning is reusable: 1. Monetise-first -
affiliate partners only, drops the directory, maximum revenue and smallest local
utility. 3. Two surfaces - directory free for everyone, monetisation only in online
comparison; viable, but needs the directory visibly marked as non-revenue, which is the
same obligation as the chosen option.)*
### 14. Hodgdon confirmed as a first-class source — RESOLVED (owner decision, 3 Oct 2026)
> "We should not forget about Hodgdon powder, I know they publish load data."
**Verified — and it is the strongest free source in the whole investigation.**
`https://hodgdonreloading.com/rldc/` is free, searchable, needs no purchase or
registration, and covers **Hodgdon and IMR powders** in one place. Cross-references
Berger, Hornady, Nosler, Sierra, Speer and Winchester bullets.
The licence clause is unusually explicit and settles both questions at once:
> "Use of this data is strictly limited to personal, non-commercial purposes. Any
> automated scraping, redistribution, or incorporation into third-party platforms,
> software, or apps without written consent is prohibited and **may result in legal
> action**."
We are a third-party platform and "incorporation into ... platforms, software, or apps"
describes this project verbatim. **Cite and link is permitted; scraping is prohibited and
the clause names legal action.**
The lesson worth keeping is the asymmetry: **Hodgdon publishes more freely than anyone
else and is therefore simultaneously the most citable source and the one we may touch
least.** Availability and permissibility are independent axes. "We could get the numbers"
is never the question — "may we" is.
Full evidence is in `tasking/pending/published-load-lookup-spec/BRIEF.md`.
All are imported by another script or are documented one-shot tools.
`extract-website.mjs` is unreachable *by design* — it overwrites hand-edited files
and requires `--force`.
---
## Sweep checklist
When doing the sweep, in order:
- [ ] Read `tasking/completed/*/KNOWLEDGE.md` for anything newer than this file.
- [ ] Check each `DEFERRED` item: is its blocker resolved?
- [ ] Run `npm run tasking:check` — a **new** completed task with findings not
      recorded here is the most likely reason this file is out of date.
- [ ] Apply fixes **in batches by risk**, and for any write path prove the fix is a
      no-op on current data first (as item 2 did).
- [ ] Move items to `FIXED` with the commit hash. Do not delete them.
## Related
- [HISTORY.md](HISTORY.md) — why decisions were made
- [../completed/code-audit/KNOWLEDGE.md](../completed/code-audit/KNOWLEDGE.md) — the audit that found items 1–3, 5–7, 11–12
### 15. "An average price based on what we know" — RESOLVED: the average was never the answer
> "We can display local shops, and we can determine an average price based on what we know
> about the components."
**Measured against the actual database before writing this down, because the claim sounds
like a data problem and is actually a division problem.**
`data/generated/apex.sqlite` today:
| Table | Rows | Price data |
|---|---|---|
| `products` | **0** | — |
| `price_observations` | **0** | `price_cents` |
| `sourcing_listings` | 22 | `price_cents` — **all 22 NULL** |
| `sourcing_retailers` | 16 | no price column |
| `affiliate_outreach` | 0 | — |
**There is no price data. Not sparse price data — none.** The schema is in place and the
tables exist, but every one of the 22 listings has `price_cents` as NULL. `products` is
empty, so there are no components to attach a price to either.
So an average price is currently `avg()` over an empty set. It is not a rough estimate, it
is `NULL`, and the number of unknowns is total.
**This is not an argument against ever having one.** It becomes computable the moment any
of these are true: an affiliate feed lands, shops are contacted, or a single scrape is
authorised. Those are all plausible and the owner expects them. The point is the ordering
and the honesty of the estimate.
**Why an average is the wrong number even with data.** An average across shops hides the
thing a reloader cares about: availability. A powder at $60 is not a bargain if four of the
six shops in range are out of stock, and the average says $60. An average also implies a
symmetry that does not exist — the cheapest shop is reachable, the most expensive one is a
200-mile round trip. And averages go stale invisibly, which is precisely the failure mode
`retailer-price-data-options` was written to avoid.
**If and when it is built, the shape should be:** a median or a range, an observation date,
a sample count, and an explicit `n`. A user acting on "$42" cannot tell whether that is one
ancient observation or thirty from this morning. `n` and a date are what make a number
honest, and they cost nothing to carry.
**And the derived figure must never be visually identical to a real one** — the same rule
already applied to load data in FIX-BACKLOG 10. An estimated price and an observed price
looking alike is how a user spends money on a number we invented.
**Not a blocker on the product, and the question is now closed for a better reason.** It was
never the right statistic: see item 17, where the owner established availability as the
driving factor. An average hides exactly that. **The v1 cost model ranks by
availability-filtered landed cost, and carries no average at all.** The measurement below
still stands — it explains why the number could not be produced even if we wanted it.
### 18. Bullet shape taxonomy — DEFERRED, and it is the second blocked data axis

> "Don't forget hollow point vs round nose vs wadcutter... The same goes for match grade
> flat nose, these are more competition style bullets and cost more off the shelf. We need to
> have those distinctions in our dataset."

**Correct, and this is the same axis as match grade (item 17) rather than a separate
problem. Measured against `bullets` (120 rows):**

| `tip_type` | Rows |
|---|---|
| **NULL** | **111** |
| `polymer_tip` | 4 |
| `hollow_point` | 1 |
| `hpbt` | 1 |
| `round_nose` | 1 |
| `spitzer` | 1 |

**The axis is 93% empty, and the 9 populated rows use five different vocabularies for the
same concept** — `hollow_point` and `hpbt` are the same shape written two ways. So this is
not "add some values"; it is **define a controlled vocabulary, then populate it**, and the
vocabulary is a judgement call about shape, use and performance that belongs in a spec
rather than in an import script.

**Do not let an importer invent it.** The temptation is to pattern-match on product names
("FMC", "HP", "HPBT", "OTBT", "Flat Nose"), and each is ambiguous — "FM" is both a
manufacturer prefix and a full-metal jacket, and `HPBT` and `OTBT` differ by one letter. A
name heuristic produces confident wrong answers, which is the exact failure this project has
been guarding against all along.

**The cost argument is the strongest statement of the thesis we have**

> "I shoot hollow points as the price is the same as round nose, but to buy a hollow point
> off the shelf is generally way more expensive. **So the bullets I make have a massive
> savings versus buying a similar product.**"

**Loading is not a cheaper way to make range ammo — it is the way to get premium
projectiles cheaply.** That is the opposite of the assumption most people start from, and
exactly what a cost calculator exists to reveal.

Which makes the missing fields load-bearing: **a price comparison that cannot say "this is a
hollow point" is the same defect as one that cannot say "this is match grade"** — and per
item 17 there is no such field. Both axes must land together or the cost surface cannot make
the argument that justifies it.

**Distinct shapes to model — note the first two are a different axis again**

| Shape | Character | Notes |
|---|---|---|
| **Round nose** | Range ammo only, per the owner | The cheap baseline; the denominator for every comparison |
| **Hollow point** | Expands; duty cycle | Much more expensive off the shelf |
| **Wadcutter** | Flat nose, pre-cut skirt | The pre-HP expansion answer; the owner's third category |
| **Flat nose (match)** | Competition | Costs more off the shelf |
| **Spitzer / boat tail / polymer tip** | Target | Already partly present |

**Careful: "wadcutter" and "flat nose" overlap but are not identical.** A wadcutter is
defined by its cut skirt (and usually a hollow base or rebated nose); a match flat nose need
not be skived. `base_type` currently holds `boat_tail` (96) and `flat` (13) but **0 rows**
distinguishing wadcutter from plain flat nose. Decide explicitly rather than folding them
together.

### 16. Hodgdon link presentation — RESOLVED (owner, 3 Oct 2026)
> "As far as Hodgdon is concerned, we give a link to their calculator, perhaps a pop-up
> window or new tab. We make it easy for our user to use their resource."
Agreed, and it is the correct handling — their own tool, their data, their terms, one
click. Implementation notes worth fixing now rather than later:
- **New tab, not a pop-up window.** Real pop-ups are blocked by default in most browsers
  and read as an attack. `target="_blank" rel="noopener noreferrer"` is the accessible,
  non-blocking equivalent and is what the phrase almost certainly means.
- **Say what the user is leaving for.** A bare link to a manufacturer is a dead end on our
  page; "Hodgdon's Reloading Data Center — free, covers Hodgdon and IMR powders" is a
  destination with a reason.
- **A link is a link.** Sending a user to Hodgdon earns us nothing and costs nothing, and
  it must never appear alongside affiliate links without the distinction being visible.
  This is the disclosure requirement from 13, and this is a live example of it.
### 17. Availability outranks price - and quality has no schema at all

> "I drove 30 minutes and overpaid for the primers I like because they were all out
> everywhere else. **Availability is the driving factor.**"

**This inverts the cost model, and the correction came from his own shopping trip rather
than from analysis.** A price the user cannot obtain is worth zero; the cheapest option is
frequently not the cheapest option. Ranking by price while ignoring stock produces advice
that is wrong in the only way that matters.

**The real thesis: quality per dollar, on projectiles**

> "Are the bullets match grade? For example, the bullets I buy from RMR are match-grade
> hollow points with free shipping that cost as much as plated Berry's at the local stores.
> It's a huge upgrade in component. That's where our site becomes a resource."

**A major component upgrade for the same money.** Finding that requires knowing RMR exists
and is priced competitively - something a shop counter cannot tell you and a search engine
will not rank. We can, because we hold the component data and the price together.

**And the schema cannot express it.** Checked against data/generated/apex.sqlite:

- `bullets` - 120 rows. `construction` is `jacketed` for EVERY row; `jacket_material` and
  `core_material` are NULL for EVERY row. The columns are stubs and nothing populates them.
- **No match-grade, precision or quality-tier column exists anywhere in the schema.**
- `reviews` - 0 rows, and `product_id` cannot resolve because `products` also has 0 rows.

So the site's central differentiator is currently unrenderable: we would be comparing
prices while unable to say WHAT is being compared. **This is the highest-value data gap
found in the project.** One piece of good news - quality tier is published product
specification, not a load quantity, so the cite-and-link rule in item 10 does not forbid it.

**The market splits cleanly, and local shops are not the competitor**

| | Powder | Primers | Projectiles |
|---|---|---|---|
| Share of cost | Small | Small | **Large** |
| Bought at | Sportsman's, Midway | Same big-box trip | **Niche + local** |
| Decided by | Availability | Availability | **Quality per dollar** |

> "Local shops are only really hit up when availability is an issue or they just happen to
> be very close geographically."

Local shops carry Hornady, Berry's and Xtreme. They are an **availability fallback**, not a
sourcing channel to price against. Pricing a full basket against a local shop models the
wrong market, and would rank the local shop as the sensible choice for everything - which
is precisely wrong for the niche projectile the user actually wants.

**Free shipping is a cost input**

> "Things like free shipping make a huge difference."

It changes which retailer wins and, at a threshold, changes it discontinuously. Part of
**landed** cost, never an afterthought.

**Two guards written into the brief**

Availability and quality are unknown for every row today, so the DEFAULTS are the dangerous
part: an unknown stock state must not rank as available, and an unknown tier must not
render as "standard". Both are now prohibitions in component-cost-model/BRIEF.md, which was
rewritten before an agent could pick it up.
### 19. CIP licensing - DEFERRED to a paid/free test by the owner (3 Oct 2026)

> "We probably won't get CIP licensing anytime soon, but we can look into what it takes
> to do so. If it's free, let's see if we can. If it's paid, let's not. We can treat it
> like Hodgdon's in the meantime and just link to it for now."

**Accepted, and the free/paid rule is the right test.** Note this retires item 9, which sat
BLOCKED for weeks: CIP dimensions are not needed for cost, ballistics, cartridge selection
or sourcing, so it is a nice-to-have rather than a blocker. **Until it is answered we link,**
on exactly the Hodgdon pattern - free, authoritative, reachable by URL, zero transcription.

**What checking CIP actually showed** (retrieved 3 Oct 2026). I looked for a price and a
procedure rather than assuming one:

| Question | Finding |
|---|---|
| Are the TDCC tables sold for a price? | **No price published.** Presented as approved tables under "Menu TDCC Downloads" |
| Is a fee published for reproduction permission? | **None published anywhere on the site** |
| Is there a permission procedure? | **None published.** Contact is a generic web feedback form |
| Is there an email or postal address for licensing? | **None exposed** - only `cip-bobp.org/en/contact` |
| Does the membership route work? | A "Membership procedure" nav item exists, but **the page 404s** |
| Who may be a member? | **Fourteen member STATES** - Austria, Belgium, Chile, Czechia, Finland, France, Germany, Hungary, Italy, Portugal, Russia, Serbia, Slovakia, Spain, UAE, UK |

**The decisive finding: CIP is a body of sovereign states and we are not one.** Membership
is how a body obtains standing with it, and the membership page does not even resolve. So
the free-permission path does not exist as a self-service route - no application form, no fee
schedule, no address to write to.

**Therefore, by the owner's own rule: it is not free, so we do not do it.** The rule decides
the question without anyone having to adjudicate the licence, which is the point of setting
it. Written permission would most likely arrive as a non-response, because there is no
published channel to send it through.

**This supersedes an earlier suggestion in this record** that obtaining CIP approval was a
live option. It is not one we can exercise.

**What linking looks like.** `cip-bobp.org/en/tdcc` is stable and canonical, and its index
page carries no reproduction restriction of its own. Same treatment as item 16: new tab,
`rel="noopener noreferrer"`, and say what the user is leaving for - "CIP Tables of
Dimensions of Cartridges and Chambers (TDCC) - the European standard, unlike SAAMI in the
US." That last clause is the genuinely useful part for a reloader, and it is the one a local
shop cannot supply.

**And the free subset we CAN build.** CIP issues **proof marks**, and a proof-mark lookup is
unambiguously ours to publish. A reloader can check whether a cartridge or case carries CIP
proof without us transcribing a single dimension. If proof marks are wanted later, that is
the part of CIP that costs nothing to use.
