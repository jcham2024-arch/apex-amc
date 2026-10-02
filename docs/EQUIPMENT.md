# Reloading equipment: what to cover, and the rules that constrain it

Drafted 30 Sep 2026. This is a scoping document for a feature the user asked
for, not a buying guide. **No product recommendations are made here, because a
recommendation without a citable test is exactly the kind of invented claim this
project exists to avoid.**

---

## 1. Why equipment belongs in this app at all

A load calculator that ignores the equipment produces numbers a shooter cannot
use. The same powder weight behaves differently through different dies, and the
equipment is where a beginner's first mistake is most likely to happen.

**But equipment is also the highest-liability content category we would carry.**
A press rated for a specific shell, a scale with a stated accuracy, a collet
that must match a case — every one of those has a specification that matters to
safety, and a wrong specification can split a case or damage a press.

---

## 2. The rule that makes this safe: equipment data is specification data

Equipment has a property that load data does not: **a manufacturer's
specification is authoritative and citable.** A Dillon press is rated for
specific shells. A Lee load master holds a specific number of cases. Those are
published facts with URLs, not opinions.

So the equipment catalogue is a clean fit for our existing provenance system:

| Field | Provenance | Notes |
|---|---|---|
| Manufacturer model number | `published` | Always |
| Rated shell/capacity | `published` | The safety-critical field |
| Shell gauge/die compatibility | `published` | |
| Scale accuracy / capacity | `published` | |
| Price | `derived` | Dated, retailer-sourced |
| "Is it good?" | **never** | Opinion, belongs in community layer |

**The one non-negotiable rule: capacity and pressure ratings are quoted, never
ranked.** Same reasoning as brass. We do not compute a "press safety score."

---

## 3. What to cover, by category

### 3.1 The bench core (highest value)

- **Presses** — turret vs progressive vs inline. Rated shell ranges.
- **Dies** — caliber, and the seating/stage geometry that affects COAL.
- **Scales** — this is the one that silently ruins loads. A scale that reads
  0.1 gr light adds up. **We should display required scale accuracy for the
  charge weight being loaded**, not just a product list.
- **Powder measures** — by volume and by weight, and the honest warning that
  volumetric measures are charge-weight-agnostic and drift with fill density.
- **Case prep** — necked vs unnecked brass, priming systems.

### 3.2 Consumables with a safety dimension

- **Primer**, and the CCI/FIOC difference in ruskin thickness. This one has real
  consequences for pressure in the 38 Spl + 40 S&W family, which is why the
  manufacturer data carries them separately.
- **Bullets and jackets** — seated vs cannelure.
- **Lube and wax** — case mouth seal.
- **Anneling** — equipment and the temperature discipline.

### 3.3 Measurement and verification

This is the category we care about most, because it is what makes a shooter's own
data comparable to ours:

- **Chronographs** — and the honest caveat that chrono readings vary with siting
  and barrel length, so a published velocity is not comparable to the shooter's
  without adjustment.
- **Pressure gauges** — with the strong caveat from the ROADMAP sources that
  cheap gauges are uncalibrated and readings are not comparable between units.
  **We must not present a pressure number from an unknown gauge as equivalent
  to a SAAMI figure.**
- **Headspace gauges** — cheap, but every gauge has an opinion about datum.

### 3.4 Gauges and tooling

- **GO/NO-GO gauges** — the correct answer to "how long should this be," and a
  genuinely useful pairing with the COAL work in ROADMAP 1.2d.
- **Case gauges, neck gauges,reamers.**
- **Priming tools** — and the separate loader / press-mounted decision.

---

## 4. Feature ideas that make equipment data more than a catalogue

These are the parts worth building, because they connect equipment to the
physics we already model:

1. **COAL helper.** "Your gun seats to X; your bullets need Y minimum; your
   manual load was published at Z." Three cited facts compared, no invention.
   Ties directly to GO/NO-GO gauges as the recommended verification method.
2. **Scale check.** Given a load, state the scale accuracy the shooter needs.
   Cheap to build, and catches a real failure mode.
3. **Primer substitution warning.** Different manufacturers' primers are not
   interchangeable at the margins. This is documented, citable, and a genuine
   safety value-add — and it belongs in the same place as the SAAMI/CIP
   standard-body warning.
4. **Difficulty filtering.** "First press", "first progressive", "bench setup for
   a beginner" — tagged per product, sourced, no judgement scores.

---

## 5. Hard constraints

- **No affiliate links in the safety path.** If equipment recommendations carry
  affiliate revenue, they stop being recommendations. This is a product-integrity
  decision and it should be written down before the first such link exists, not
  after.
- **No "best" or ranked lists.** Filter and tag; never score.
- **Prices are dated.** Anything with a price shows the retrieval date or it is
  not displayed.
- **Regional availability varies.** A product that is not sold in the user's
  country is not a recommendation. This requires the retailer data the data agent
  is already building (`006_manufacturer_directory`, `013_sourcing`).

---

## 6. Open questions

- Do we list equipment at all, or only equipment *compatibility* (press fits
  shell, die fits chamber, scale accurate enough)? **The second is safer and
  probably more useful**, and it fits our data model better. Worth deciding
  early — it changes whether we need retail and pricing data at all.
- How do we handle discontinued equipment, which is a large fraction of the
  reloading press market and still widely owned?