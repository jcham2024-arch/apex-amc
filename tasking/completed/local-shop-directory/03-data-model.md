# 03 — Data model for a local shop record

Task `local-shop-directory`. **Specification only. Not implemented** — `prohibits[]`
forbids building the feature.

**The column list is UNVERIFIED** (ATF returns 403 — `01-` §1). This is therefore a model
with **unknown fields left explicitly unknown**, not a schema mapping.

---

## 1. The geographic question — the brief asked this first, and it gates the design

> "state whether the data carries latitude/longitude or is street address only. That
> decides whether distance-sort is possible at all"

**UNVERIFIED.** The catalogue records `spatial: "U.S. State/Territory"` — which describes
the *coverage* (all states and territories), **not** the geometry. The distribution is an
**XLS**, not a shapefile, which weakly suggests address records rather than points.

**So the answer has three possible outcomes, and the design must tolerate all three:**

| If the file has… | Then distance-sort… |
|---|---|
| `lat`/`long` columns | **works**, client-side haversine — no geocoding, no external service |
| Street address only | **impossible** without geocoding, which `prohibits[]` forbids |
| Address + ZIP only | ZIP centroid as an approximation — **must be labelled as approximate** |

**Decision rule for the implementer: build the model so that `latitude`/`longitude` are
OPTIONAL and nullable, and the UI degrades from "distance" to "state filter" when they are
absent.** Do not design assuming they exist.

## 2. The record

```ts
interface LocalShop {
  // --- identity, from the FFL file ---
  fflNumber: string;        // the licence number; primary key
  name: string;
  licenseType: string;      // "01" | "02" | "06" | "07" | ... UNVERIFIED codes
  licenseTypeLabel?: string; // present only if the file supplies it
  streetAddress: string;
  city: string;
  state: string;            // 2-letter; every US state/territory
  zip?: string;             // UNVERIFIED whether present
  latitude?: number | null; // null = NOT KNOWN, not "zero"
  longitude?: number | null;

  // --- provenance: what we know about the knowledge ---
  source: 'atf-ffl';        // single source; do not merge others
  dataAsOf: string;         // ISO date. REQUIRED, and the most important field here.
  sourceUrl: string;
  licencePosition: string;  // citation string, see 01- §4

  // --- what we DO NOT store, deliberately ---
  // phone, hours, storefront, currentStock: absent by design.
  // See §4. A field that is always NULL is a lie about its own reliability.
}
```

**`dataAsOf` is the load-bearing field.** The brief's own warning — *"a shop that closed
two years ago is worse than no shop"* — has exactly one structural answer: **every record
carries the date it was true, and the UI is required to show it.**

---

## 3. Absence is a first-class state

The brief: *"A shop with no recorded hours must not render as open 24 hours."*

**Generalised, this is the same rule `ui-research` reached for numeric data:**

> "A design that has no vocabulary for absence renders a blank cell, and a blank cell is
> read as `0`. **That is a silent data error.**"

| State | Representation | Renders as |
|---|---|---|
| Known | value present | the value |
| **Not known** | `null` / absent | **an explicit "not recorded" — never `0`, `—`, or `--`** |
| **Not applicable** | field absent from model | **field not rendered at all** |

**The critical rule: `latitude: null` must never render as `0.0`.** A point at 0°,0° is in
the Atlantic; a user seeing a shop 400 km off the coast of Africa could not tell the
difference between "no coordinates" and "coordinates we have not checked".

**Reuse the vocabulary `ui-research` already specified** (`_tokens.css`: `.unknown`, the
dashed-box treatment). **This is not a parallel design — it is the same one.**

## 4. What must never be added

`prohibits[]` is explicit, and it is right:

> "Do not add a storefront, phone or hours field from any source other than this dataset.
> … **never merge unverified attributes into an authoritative record.**"

**The failure mode this prevents, concretely:** a directory that renders every entry
identically, where a shop with a verified address looks exactly like a shop whose address
was guessed. **Once merged, the distinction is unrecoverable** — nobody can tell which
field came from where.

**If hours are obtained elsewhere later:** keep them in a **separate, clearly-labelled
source** with their own `dataAsOf` and their own provenance. Two sources, rendered with
their provenance, is honest. One merged record is not.

## 5. The staleness gate — what must be true before this ships

**From `01-` §3: the catalogue describes content dated December 2021, last updated
September 2025, today 3 Oct 2026.**

**Three questions must be answered before any implementation, and none is answered here:**

1. **What is the real content date of the file?** If December 2021, the directory is
   **~5 years stale** and the honest framing is historical, not current.
2. **Does the record carry any status or expiry field?** If a licence can be shown lapsed,
   the worst failure mode is removable. **Unverified.**
3. **Is there a newer source than the catalogue entry?** The catalogue's own ArcGIS
   download link does not resolve (`01-` §5).

**My judgement, stated as a judgement: do not build this until #1 is answered.** Not
because the code is hard, but because **the feature's value is a claim about where ammo
can be bought today, and December 2021 data cannot support that claim.**

## 6. What the feature can honestly say

| It can say | It cannot say |
|---|---|
| "A licensed dealer was at this address in December 2021" | "This shop is open" |
| "This business held an FFL reloader licence" | "This shop reloads / sells ammo" |
| "Here are licencees in your state" | "Here's the cheapest ammo near you" |
| "Here are businesses of this licensed type near you" | "This shop is recommended" |
| — | **Anything about price, stock, or hours** |

**That right-hand column is the honest limit of the source**, and `prohibits[]` forbids
every entry in it.