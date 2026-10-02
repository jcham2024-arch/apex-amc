# Roadmap: UI, offline, LLM support, and load design

Planning document. No code changes proposed here yet. Written 30 Sep 2026 after
measuring the actual state of the repo.

---

## 0. What we actually have today

Measured, not assumed. This shapes everything below.

| Area | Reality |
|---|---|
| Domain library | Solid. Solver validated to 0.40% velocity. |
| Mobile screens | 8 screens, **none wired to the domain package**, each with its own inline maths |
| Website | Single `index.html`, CDN React + Babel in production, calculator working |
| Database schema | 16 migrations, 20 tables, all applied clean |
| Load data | **`recipes` table is EMPTY. Zero published loads.** |
| Powder data | 169 rows, 7 brands, all committed and loading |
| Bullet data | 120 rows, 3 manufacturers (Berger 109, Hornady 7, Sierra 4) |
| Cartridge data | 318 cartridges, 229 curated specs, 782 pressure references |
| Archived sources | 25 files, 69 MB (manuals, burn rate charts, CIP/SAAMI pressures) |
| Data governance | 23 of 23 CSV files have column manifests |
| Tests | 215 passing |

**The load-data gap is the headline.** Everything else is engineering. That one
is a multi-week content problem, and it gates the feature that matters most.

---

## 1. Load design — read this first, it changes the priority order

The request was: *user says caliber, bullet weight, desired velocity; we
recommend powder, cartridge and primer.*

I want to be direct about this, because the gap between what that sounds like
and what it should be is the difference between a useful product and a
liability.

### 1.1 The data problem blocks the feature entirely

We have **zero load recipes**. The `recipes` table is empty. We have powders,
cartridge specs, and 69 MB of archived manuals — but the actual
bullet + powder + charge + velocity data, which is the entire output of this
feature, does not exist in the database yet.

So the first question is not architectural. It is: **can we legally and
accurately transcribe published load data?** Manufacturer reload guides are
copyrighted. Sierra, Hornady, Hodgdon, IMR and Winchester all publish load data
we may not redistribute verbatim.

Three options, in order of preference:

| Option | Description | Tradeoff |
|---|---|---|
| **A. Link, don't host** | Store *citations* — cartridge, bullet, powder, page number, charge range — and link the shooter to the page in the manufacturer's guide | Legally safest. Less useful offline. Requires the shooter to own the guide. |
| **B. Curated subset, attributed** | A small hand-checked set of loads from guides we have licensed or that permit it, always with attribution and a link | Useful and safe. Slow to build. Limited coverage. |
| **C. Full transcription** | All loads from all manuals | Not viable. Copyright exposure, and the volume makes verification impossible. |

**Recommendation: A as the spine, B as a bonus.** Every recipe row already
carries `source_id NOT NULL` with a URL, which is the right shape for A. The
"recipes" table should hold *references to published loads*, not
reproductions of them.

If the product only works when you own six $50 handbooks, that is a real
limitation and we should say so plainly rather than pretend otherwise.

**Checked, not assumed (retrieved 30 Sep 2026):**

- **load-data.com** (Wolfe Publishing, rights holder for the "Ultimate Reloading
  Manual") carries an explicit copyright notice, a paywall, and terms granting
  no right of republication. Nothing there is free to copy.
- **Hornady** sells its Handbook as a **$19.99 subscription** or **$0.99 per
  cartridge**, with the app and book as explicitly separate products. Only
  selected PDFs are free, under the same notice. It is a commercial data
  product, not a public dataset.

Both point the same way: **this load data is owned, licensed, and sold.** Any
plan assuming we can ingest a manual and ship its tables is not viable, and
building on that assumption would waste months.

### 1.1b An errata system is not optional — it is a safety requirement

While checking licensing I found something more important.

**Hornady's 12th Edition carries a published safety notice: page 350 of the
6.5 PRC data misprints the powder.** It lists StaBall Match; it should read
StaBall HD. Hornady's own wording is that using the misprinted powder
**"could result in dangerously high pressures."**

This is the strongest argument in the entire roadmap for our product. It is not
a reason to *avoid* the feature — it is the reason to *own* it.

**A load table without a correction feed is a liability.** Print manuals cannot
be updated. An app can be. If we index published loads we must:

1. Model **errata as first-class data**, not a footnote — a `corrections` table
   keyed to source edition and page.
2. **Never display a load from an edition with an open errata without showing
   the correction.** Blocking banner, not a warning.
3. Record **edition and page** for every citation, so corrections apply
   retroactively.
4. Watch publisher errata pages on a schedule and alert users who have viewed
   an affected load.

Every major reloader publishes errata, and a misprint in a load table is a
pressure event. An app that tracks corrections is measurably safer than a book.
That is a real, defensible differentiator — *provided* we are honest that our
coverage of corrections is incomplete.

The 12th Edition errata is published as a public PDF by Hornady, so the
corrections themselves are usually public even when the tables are not.
**Correct the record; cite the source; link to the manual.**

### 1.2 Even with perfect data, we must not compute charges

This is the safety line, and I would hold it firmly.

**What we can do — and this is genuinely valuable:**

- Given a cartridge, bullet, powder and target velocity, **find published
  loads that already exist** in the cited manuals and show them
- Filter by the shooter's actual barrel length, seating depth, and twist rate
- Show the **safety margin**: how far below max pressure each published load
  sits, expressed as a percentage and as SAAMI/CIP headroom
- **Warn loudly** when the requested combination is not in any manual
- Flag compression ratio, seating depth beyond published, and bullet twist
  mismatch
- **Refuse** to extrapolate. If no published load matches, say "not found" and
  point at the manual

**What we must not do:**

- Compute a charge weight that appears in no manual
- Predict pressure from a model and present it as safe
- Recommend a load outside a published envelope
- Present any of it without the disclaimers below

There is a meaningful difference between *finding a load in a manual* and
*inventing a charge weight*. The first is what every responsible reloader does.
The second is how people get hurt.

### 1.2b Component recommendation — the reframed feature, and its one trap

The user reframed the load feature as **component recommendation**: "I want a
124gr hollow point at 1175 fps from a Glock 34, tell me which bullets, which
powders, which brass."

**This is a genuinely good product and it is categorically safer than load
design.** It resolves to a bounded question with a factual answer:

> which bullets does RMR or Hornady actually make in 124gr JHP, which
> manufacturers publish data for that bullet in 9mm, and which of those have a
> powder the manual pairs with it?

Nothing is invented. The answer is a join across `bullets`, `powders`,
`manufacturers`, and `recipes` — and every component listed genuinely exists
and is purchasable. **The app stops being the author of load data and becomes
the index of it.** That is exactly the posture we want.

### 1.2c The trap: "whichever brass handles the pressures best"

The example included: *"in whichever brass is best able to handle the
pressures."* **We must not rank brass by pressure tolerance.** There is no
such metric, and manufacturing brass that is stronger does not make it a safer
choice — it is a marketing claim, not a load variable.

Pressure is a function of **powder charge, case volume, and barrel**, none of
which brass choice alters meaningfully. Brass varies by *capacity consistency*
between lots, which is a real and legitimate concern (and why case reuse
tracking exists in schema 010), but "stronger brass" is not a safety axis.

**Correction to this, from the user's follow-up** — the user proposed that NATO
brass "can handle higher pressures **and needs less powder to do it**." The first
half is right; the second is a category error, and the two are unrelated. +P
brass is stronger by **thickening the web and case wall**, which *reduces*
internal volume and therefore **raises** pressure at the same charge weight. So
stronger brass buys margin against *case failure* while costing some capacity.
Full sourcing and the measured capacity data are in
**docs/BRASS-AND-PRESSURE-CLASS.md**.

The design rule that follows:

> **Stronger brass buys NO margin against pressure. It buys margin against case
> failure, and it typically makes the same charge weight hotter.**

Which means the genuinely useful behaviour is: when a shooter is approaching
the top of the ladder, recommend brass **rated for that pressure class**
(`pressure_class` exists in schema 010 with `plus_p` / `nato` / `magnum`
values) and tell them to **re-develop the charge weight for that brass** — not
permit them more powder.

So the rule is: **brass may be *shown* and *filtered* by capacity, pressure
class, and case-source consistency. It is never *ranked* by a pressure-safety
score we invented.** If we cannot cite a metric, we do not display a sort
order. This is the same discipline as the `estimated` provenance tier — an
unmeasured quantity gets no visual confidence.

### 1.2d COAL is the load variable people most often get wrong

The user made an important correct point: a CZ 75 Shadow (COAL ~1.026) and a
Glock 17 Radian (COAL ~1.047+) have materially different case volumes, and
**the same bullet and powder behave differently between them.** A load developed
at one COAL is not the same load in the other.

This is a real safety axis and the schema already supports it —
`recipes.published_coal_in`, `firearm_profiles`, and `cartridges.max_col_in` all
exist. But we must be careful about *how* we use it:

**We can:** record COAL per recipe, record per-firearm COAL limits, and warn
that a recipe's published COAL differs from the shooter's actual seating depth.
That is a comparison of two cited facts.

**We must not:** extrapolate velocity or pressure from one COAL to another and
present the result as a load. The existing Homann/Fraser barrel-length scaling
is explicitly marked `estimated` in `constants.ts`, and its own comment says it
is "fine for estimating a barrel length; NOT fine for computing a charge
weight." The same applies to COAL scaling. If we ever scale by COAL, the result
is `estimated` and must render differently from `published`.

The genuinely useful output here is **comparative, not predictive**: "this load
was published at COAL 1.047; your gun seats to 1.060 — the published test barrel
differs from yours, verify with your own chronograph." That is honest and useful.
A scaled velocity number would be neither.

### 1.4 Forum-sourced "recipes" — the one thing I would refuse outright

The proposal: also populate recipes from reloader forums, warned and linked.

**Recommendation: do not store forum posts as recipe rows at all.** Warnings are
not sufficient protection here, and I think this is the clearest disagreement I
have with the plan.

The problem is not disclosure. It is that a forum post fails to be *load data*
at all:

1. **A forum post has no known test barrel, and often no known COAL.** Our own
   `recipes` schema marks `test_barrel_length_in` and `published_coal_in` NOT
   NULL because a load without those is not interpretable. A forum load is
   usually "I ran 5.5gr CFE in a Glock 43x" — a hard-charged carry gun load
   quoted without context, exactly the data that gets copied into the wrong
   barrel.
2. **There is no errata channel.** The 6.5 PRC misprint is survivable because
   Hornady published a correction. A forum typo is permanent, uncorrectable,
   and would sit in our database looking authoritative.
3. **A pressure claim from a forum is unverifiable.** Someone reporting a case
   headspace number has an uncalibrated gauge and no published method. We would
   be presenting a number with no unit of trust, and our UI cannot visually
   distinguish it from a gauge-verified manual figure.

The existing schema already encodes this decision correctly, and says so in its
header comment: *"the community layer is a lead, never a citation."*
`community_observations` carries `source_url NOT NULL`, a constrained
`agreement_level`, a 1-5 `confidence`, and a trigger that blocks promotion of
anything mentioning charge or pressure. That is the right design and I would not
weaken it.

**What we can honestly offer from the community layer:** *"reducers report
inconsistent capacity in this lot"* (with the link), *"this bullet is reported
to need X twist"*, *"annealing this case before fireforming extends life"* —
qualitative, attributed, never a number presented as a setting.

So the rule: **forum content informs the shooter's search; it never populates
the load table.** If we want to support forum discovery, the feature is
"here are the threads discussing this load, follow the links" — we link out,
we do not ingest. That preserves the value, removes the risk, and keeps the
"aggregating not creating" promise honest.

### 1.4c Using an LLM to read forums at scale

The user proposed letting an LLM read forums, weigh opposing viewpoints, and
weight by poster strength. This is the right problem with one part of the
proposal to decline.

**Keep:** scale reading, claim extraction, attribution, and — most valuable —
*surfacing where the forums disagree*. Disagreement is a fact about the corpus,
extractable and checkable, and it is the thing a human sampling misses.

**Decline:** having the model weigh arguments and decide what experience shows.
"Poster strength (posts, rank)" measures participation, not accuracy — a
high-ranked account can be repeating a load that damages guns. And a model-
produced weighted verdict is a number with no provenance: undocumented weights,
not reproducible, varies between runs. That is exactly what the provenance
system exists to prevent, and it would be harder to audit than a human's notes
because it *looks* like analysis.

So the rule stands as: **an LLM may extract and organise; it may not weigh,
score, or conclude.** Model output lands `status = 'unreviewed'` and stays there
until a human moves it. Full design in **docs/COMMUNITY-INTELLIGENCE.md**.

### 1.5 The disclaimer and warning design

The user is right that we need these, and right that most users will not read
them. Design accordingly — **not a wall of text, but structured, escalating,
and technically enforced.**

**Layer 1 — persistent, non-dismissable, on every load result:**

```
REFERENCE DATA ONLY — NOT A LOAD RECIPE
Every figure here is transcribed or cited from a published source.
Cross-reference EVERY load against the manufacturer's current guide
and your own chronograph data before firing. Apex AMC is not liable
for damage or injury. [Open the cited source]
```

Not a modal, not a checkbox. A standing element in the result header, with the
source link inline on every row.

**Layer 2 — contextual, per-result warnings that actually change the UI:**

| Condition | Presentation |
|---|---|
| Requested velocity not achievable with published data | Red banner, no suggestions offered, link to the manual |
| Load sits within 5% of max pressure | Amber, states the percentage and the source's own caution |
| Seating depth beyond published | Red, explains pressure risk, cites CIP/SAAMI max |
| Compression ratio above published | Red — this is a squib risk, not just a pressure one |
| Bullet twist rate below published | Amber, cites the manual's own note |
| Barrel length differs materially | Amber, shows the published test barrel |
| Case brand differs from published | Info — many manufacturers are case-specific |

**Layer 3 — a pre-fire checklist the app generates** from whatever conditions
it knows. Not a disclaimer, a tool: max-pressure check, start-charge reminder,
temperature note, chronograph requirement. Genuinely useful, and it discharges
the duty-to-warn concern better than prose does.

**Layer 4 — technical enforcement, not just UI:**

- `source_id` is already `NOT NULL` — a recipe cannot exist uncited
- **Add a check: refuse to display a load whose source has no URL**
- Log every displayed load to a local audit table
- Record the app version and data version with each viewed load, so if
  something goes wrong we can prove what the shooter was shown

**Links to published guides, built into the data:**

- Hornady Reloading Manual — hornady.com
- Sierra Loading Manual — sierrabullets.com
- Hodgdon Reload Guide — hodgdon.com
- Winchester Supreme handbook
- IMR / DuPont Reloading Guide
- Alliant Reloader's Guide (we have 2020 and 2021 archived)
- **CIP and SAAMI maximum pressure tables** (we have these archived)

### 1.6 Honest scope

Even done well, this feature is a **reference tool that points at published
data**, not a load design engine. We should position it that way from day one.
A shooter who understands that distinction will trust it; one who doesn't will
eventually blame it.

---

## 2. User interface — website and mobile

### 2.1 Principle: one design system, two renderers

The current state is the problem. The website is a single HTML file with CDN
React; the app is 8 independent screens with duplicated math. Neither is
acceptable and they cannot be fixed independently.

**Everything above the UI must be shared.** The app already imports
`@apex/ballistics-core`; the website does not.

### 2.2 Website

| Step | Work | Notes |
|---|---|---|
| 1 | Kill CDN React, Babel, unpinned lucide | Babel in production ships a compiler to users. This is a security and performance problem, not just hygiene. |
| 2 | Build on Vite with real modules | `src/main.js` is already module-structured. Mostly a build config change. |
| 3 | Pull in the domain package | Calculator, dispersion and trajectory currently reimplemented or absent. |
| 4 | Design system | One set of tokens — colour, type, spacing — used by both surfaces. |
| 5 | Pages beyond the landing page | Catalog, calculators, data browser, community. |
| 6 | Strict CSP | Only possible once inline scripts are gone. |

### 2.3 Mobile

| Step | Work |
|---|---|
| 1 | **Rewire all 8 screens to the domain package.** The Rayleigh calculator still has its own inline maths; the DOPE card is fixed but the others are not. This is correctness work, not UI work. |
| 2 | Shared state via React context — `useBallisticsDb` is per-screen today, so a rifle created on one screen is invisible on others |
| 3 | Migrate `backupService` off removed `expo-file-system` APIs |
| 4 | Navigation shell with the 8 screens plus the new ones |
| 5 | Dark mode, outdoor legibility — these are used in bright sun and read at a distance |

### 2.4 Offline architecture

The requirement: reloading and shooting modules work with no network.

**What must be local** (and mostly already is):

| Module | Offline? |
|---|---|
| Trajectory solver | **Yes** — pure computation, no network |
| Dispersion / Rayleigh | **Yes** |
| Ladder builder, COAL warnings | **Yes** |
| DOPE card | **Yes**, once screens are rewired |
| Load data | **Yes**, if the database ships with the app |
| Weather | **No** — but degrades gracefully to manual entry |
| Prices, availability | **No** |
| Community | **No** |

**The concrete approach:**

1. **Bundle the seed database into the app binary.** It is small today (8
   cartridges) and will grow. SQLite is already the storage layer.
2. **Versioned local data store.** Ship a data version in the binary; fetch
   deltas when online; apply on next launch. A shooting app that silently
   changes data under you is a problem.
3. **Mark network-dependent data explicitly at the boundary** — the
   `WeatherReading<T>` provenance system we built does this already. A field
   with no reading is `null`, never a default.
4. **Cache the last successful weather fetch**, clearly timestamped. A shooter
   at the range with no signal should see "last read 14 minutes ago", not a
   confident stale number.

**Design principle worth stating: offline is not a degraded mode, it is the
primary mode.** Field use means no signal. Anything that requires a network
round-trip to compute a firing solution is a design error.

---

## 3. LLM support

Asked for: let a user use a reasoning model to search and get help. Worth
doing, and one thing we must be careful about.

### 3.1 Where it genuinely helps

| Use case | Value | Risk |
|---|---|---|
| **Natural-language catalog search** — "7mm bullets under 175gr for long range" | **High.** Our schema is relational and awkward to browse; an LLM over it is much better than a filter UI. | Low — read-only |
| **Explaining a result** — "why is the hold 4.2 MOA at 800?" | **High.** A shooter who understands the reasoning shoots better. | Low |
| **Comparing loads conversationally** — "compare these two in a 26" barrel" | Medium-high | Low |
| **Help with the app itself** — "where is the barrel-length setting?" | Medium | Low |
| **Drafting range cards / notes** | Medium | Low |
| **Explaining manual language** | Medium | Low — if grounded in a cited source |

### 3.2 Where it must not go

**No LLM output may ever become a number that reaches a firing solution.** This
is the hard boundary. The trajectory solver is validated to 0.40% against
published data; an LLM inventing a plausible-looking drop figure would be
indistinguishable from a correct one and could be off by a factor of two.

**Never:**
- Generate a charge weight, pressure, or velocity
- Modify a firing solution
- Recommend a load not present in the database
- Answer "is this safe to fire?" from general knowledge

**Always:**
- Call our solver for anything numeric
- Present the model's output as a lookup, clearly attributed
- Say "I don't have data on that" rather than filling the gap

### 3.3 Architecture

```
User question
     |
     v
[LLM with tool access]  -- decides what to ask for
     |
     |-- query_load_data(cartridge, bullet, powder, ...)  --> SQL
     |-- solve_trajectory(profile, env)                   --> ballistics-core
     |-- lookup_manual(cartridge, topic)                  --> citations
     |
     v
LLM composes a natural-language answer,
quoting tool results and citing sources
```

**The LLM is a translation layer, not a source of numbers.** The tools are the
only path to data. This makes it auditable and keeps our validation intact.

### 3.4 Provider notes

**BYO-key is the architecture, not a fallback.** The user's position is that the
LLM API is the user's own functional choice, not a core feature. Agreed, and the
reasoning is stronger than just cost: it means the app ships with **no operator
liability for model output** and no per-user cost, and it keeps the hard
guarantee in section 3.2 enforceable — the user's model is a UI, our solver is
the calculator, and we never blur that regardless of provider.

- **Bring your own key.** Stored in device keychain / secure storage, never in
  the bundle. A shipped API key is a bill someone else pays.
- **Small model is enough** for search and explanation. This is a lookup and
  summarisation task, not reasoning. Keeps cost near zero for the user.
- **No API key required for the core app.** The calculators must work with no
  account, no key, no network. LLM is an optional enhancement.
- **Cache aggressively** — the same cartridge question gets asked constantly.

### 3.5 The system prompt is part of the product

The user's point that we should ship context and system prompts that "guide the
LLM correctly" is the most important LLM decision in this document, and it is
easy to underrate.

Every safety guarantee we have rests on the model being *steered* rather than
merely *capable*. A raw model asked "what charge should I use for 124gr JHP at
1200fps" will happily produce a number, well-formatted and plausible. **We do
not fix that by asking nicely at inference time — we fix it by not giving the
model that capability in the first place.**

So the shipped system prompt must:

1. **Declare the tool boundary as a hard constraint**, in the same words every
   time, because prompts are the only lever we have for a user's own model.
2. **Refuse to state a charge weight, pressure, or trajectory number in prose.**
   If a user asks directly, the assistant routes to the solver tool and cites
   its output, or explains it cannot answer.
3. **Require a citation for every factual claim**, and instruct the model to
   decline rather than guess when the tool returns nothing.
4. **Treat our provenance tiers as binding vocabulary** — `published`, `derived`,
   `estimated` must be used correctly, so the model cannot upgrade a soft number
   into a hard one by describing it confidently.

A useful test: **point the shipped prompt at a hosted model, ask it the load
question directly, and confirm it refuses.** If it answers with a number, the
prompt is wrong and no amount of UI wording will fix it. This belongs in the
test suite, not in a manual review.

The 69 MB of archived manuals (25 files) is a genuine RAG corpus for this, and
because it is our own archive we can ground citations without redistributing
anyone's copyrighted tables.

### 3.6 The privacy angle

If we relay user queries to a third-party model provider, that is the shooter
sending their equipment list somewhere. Say so plainly. Local models are
possible but out of scope; a clear notice is mandatory if we do this.

---

## 4. Sequencing

Ordered by dependency, not by appeal. Each phase is independently shippable.

### Phase 0 — Correctness foundations (do first)

Nothing user-facing. Prevents shipping known-wrong numbers.

1. Rewire all 8 mobile screens to the domain package
2. Fix the per-screen database state
3. Migrate `backupService` off removed Expo APIs
4. **Build the load-data pipeline** — this is the long pole and it starts now

### Phase 1 — Website, made real

Kill CDN/Babel, Vite build, domain package wired in, strict CSP, design
tokens. The site is the revenue path; it should be the most polished thing.

### Phase 2 — Mobile offline core

Bundle the database, versioned data updates, connection-state UI, the full
shooting toolkit working with no signal. This is the differentiator against
every other reloading app.

### Phase 3 — Load reference (needs Phase 0.4 data)

- Recipe storage as *citations*, with links
- Search by cartridge / bullet / powder / velocity
- Safety-margin display
- The four warning layers
- A pre-fire checklist generator

**Positioned as a reference tool from the start.** If we have thin data, it
launches thin and says so.

### Phase 4 — Community and group buy

Forum, location board (with coordinate fuzzing), trading, group-buy
coordination. **Pledge-then-link, never holding money** — see
`COMMUNITY-AND-GROUP-BUY.md`.

### Phase 5 — LLM assistant

Once the data is good enough to be worth querying. Tool-calling architecture,
BYO key, grounded in citations, hard rule that it never produces a number.

---

## 5. What I would push back on

Three things, plainly:

**"Recommend what powder and cartridge and primer to use"** — the useful and
safe version is *find published loads that match, and show how much margin each
one has*. Computing a charge weight is a different product with a very different
risk profile, and I don't think we want to be in that business.

**LLM integration** — worth doing, genuinely. But it should be a search and
explanation layer over data we have verified, never a source of numbers. Get
this backwards and the LLM will produce confident wrong ballistics that look
identical to the correct ones.

**Parallel feature work on GUI while the load database is empty** — the GUI is
the fun part and it is also the part that gets replaced. The data is the asset.
Nothing we build is differentiated until the data is there.

---

## 6. Open questions

1. **Load data licensing** — the evidence says *link only* is the defensible
   default. Confirming that may need a lawyer, and it gates all data work.
   Worth noting: even Hornady, who own the data, sells it at $19.99; there is a
   real market for something that makes those manuals *navigable* rather than
   something that competes with them. That framing avoids the legal question
   and is probably the better product anyway.
2. **How many cartridges do we cover first?** Depth on ten rifles beats breadth
   on none. Probably: .308 Win, 6.5 Creedmoor, 6.5 PRC, 7mm, 300 Win Mag, .223
   Rem, 5.56, 9mm, 45 ACP, 40 S&W.
3. **Do we require an account?** Free and no-account is the differentiator.
   Worth resisting.
4. **LLM provider default?** Or BYO key only?
5. **How much of the manual corpus can we quote?**
