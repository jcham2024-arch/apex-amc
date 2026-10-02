# Future integrations: parked, with the reasoning kept

Written 30 Sep 2026. **This document deliberately preserves the design work for
features we are not building now, so that when the time comes the reasoning is
available and the safety boundaries are already settled.**

The user asked to park LLM integration and keep the ideas. Agreed. Nothing here
is scheduled. Nothing here is a commitment.

---

## 1. LLM integration — parked

### 1.1 The boundary, which is settled and should not be renegotiated later

**No LLM output may ever become a number that reaches a firing solution, a
charge weight, or a safety verdict.** The model is a navigation layer. Our
solver is the calculator.

This is not a prompt-tuning problem. It is an architectural one: the model must
not *have* the capability. Tool-calling with a read-only surface is the
mechanism, because it makes the boundary structural rather than aspirational.

### 1.2 What it would legitimately do

- **Natural-language catalogue search.** Our relational schema is poor for
  browsing and good for querying. "7mm bullets under 175gr for long range" is a
  natural question and an awkward SQL query. This is the strongest genuine use.
- **Explaining a solver result** in plain language — why a hold is 4.2 MOA, what
  the weather inputs did to it. The arithmetic stays ours.
- **Guided navigation** of a large manual archive.

### 1.3 What it must never do

- State a charge weight, pressure, or trajectory figure in prose.
- Rank or recommend a load.
- Convert an `estimated` value into a confident-sounding `published` one.
- Answer when a tool returns nothing. Decline instead.

### 1.4 BYO-key, and why that is architecture rather than a fallback

The user's position is that the provider is the user's own choice and not a core
feature. This is the right call for a stronger reason than cost: **it removes
operator liability for model output entirely.** We are not the party running the
model, and we ship no key.

### 1.5 The system prompt is a safety artefact

If we ever build this, the shipped prompt must declare the tool boundary as a
hard constraint, refuse to produce numbers in prose, require citations, and use
our provenance tiers (`published` / `derived` / `estimated`) as binding
vocabulary.

**Acceptance test:** point the shipped prompt at a hosted model, ask it directly
for a charge weight, and confirm it refuses. If it answers with a plausible
number, the prompt is wrong and no amount of UI copy will fix it. This belongs in
the test suite.

### 1.6 Corpus note

We have 69 MB of archived manuals (25 files) already in the repo. That is a
ready-made RAG corpus, and because it is our own archive we can ground citations
**without redistributing anyone's copyrighted tables** — which keeps it on the
right side of the licensing position in ROADMAP 1.1.

### 1.7 Privacy

If we relay queries to a third-party provider, the shooter is sending their
equipment list somewhere. Say so plainly in the UI, at the point of enabling it,
not in a policy page.

---

## 2. Errata monitoring — parked, but high value

From ROADMAP 1.1b: publisher errata is a safety feed, not a documentation
nicety. When we build it:

- Scrape publisher errata pages on a schedule.
- Match against `sources.edition` + page.
- Notify users who viewed an affected load.
- **Never auto-apply a correction** — show it and require acknowledgement. A
  correction we applied silently is a correction nobody verified.

The Hornady 12th Edition 6.5 PRC misprint is the proof this is real: a live
dangerous error in a current edition, published as a public correction.

---

## 3. Review and consensus aggregation — parked

See `BRASS-AND-PRESSURE-CLASS.md` section 3 for the full analysis. Summary:

- Count, link, attribute, date. Never score or rank.
- "Mentioned in 6 of 20 threads" is a fact. "4.2/5, best for hot loads" is an
  invention.
- Everything lands in `community_observations`, which already enforces
  `source_url NOT NULL` and blocks promotion of charge/pressure claims.
- **The hard limit: a consensus must never touch a load number.** That is the
  line between useful aggregation and the forum-recipe problem.

---

## 4. Weather and device integration — partially built

Already implemented, not parked:

- Open-Meteo forecast parsing with condition provenance
- Humidity, pressure, altitude derivation
- Forecast and manual-entry warnings
- Device capability contracts, simulated rangefinder / weather meter / turret /
  camera drivers

Outstanding, and genuinely blocked:

- **No real rangefinder or weather meter driver exists.** The Kestrel and
  Kestrel 5500 BLE details remain unverified — manufacturer sites blocked
  automated retrieval. Do not design against assumed BLE characteristics.
- **No major scope manufacturer exposes a supported public turret API.** The
  turret adjustment gate is contract-only by necessity: no fire control API, no
  automatic retries, explicit human acknowledgement, backlash and unverifiable
  moves surfaced. That gate is the right design and should not be relaxed if a
  vendor later offers an API.

The turret gate is worth remembering as a template. When a device integration
looks risky, the answer is usually a narrower contract plus mandatory human
acknowledgement, not "don't build it."

---

## 5. Equipment catalogue — parked

Scoped in `EQUIPMENT.md`. The open question that matters is whether we build a
product catalogue or a **compatibility** database (press fits shell, scale
accurate enough). The second is safer, fits our data model better, and avoids
the affiliate-integrity problem entirely.

---

## 6. What "parked" means here

These are not dead ideas. Each one has: a defined safe shape, a defined unsafe
shape, and in most cases an existing schema that already enforces the boundary.

**The recurring pattern worth preserving: in every case, the useful version of
the feature is the one that only reports facts we can cite, and links to the
evidence. The unsafe version is always the one that synthesises a
recommendation.** If a future feature starts requiring us to invent a number to
be useful, that is the signal it has become the wrong feature.