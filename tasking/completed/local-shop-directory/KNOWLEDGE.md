# KNOWLEDGE — local shop directory (ATF FFL)

Task `local-shop-directory`. **Researched 3 Oct 2026.**

---

## 1. I could not download the file, and that is the headline

The brief says *"download the file and read it."* **Every `atf.gov` endpoint returns 403
to this environment, including the site root.**

```
403  https://www.atf.gov/
403  https://www.atf.gov/firearms/listing-federal-firearms-licensees/
403  https://www.atf.gov/files/downloads/ffl-atf-latest-ffl.zip
```

**So: column list, row count, and lat/long presence are UNVERIFIED.** They stay blank.

**This does not mean the data is unavailable** — it means ATF blocks automated clients
*here*. A human in a browser can very likely download it. **The distinction matters and I
will not paper over it.**

> **Generalisable: "the publisher publishes a file" is not the same as "an agent can read
> the file."** Check the second before planning a task around the first.

## 2. The catalogue's own download link is dead

The catalogue entry lists an XLS at an ArcGIS hub URL. **That dataset ID is not a valid
ArcGIS item:**

```
https://www.arcgis.com/sharing/rest/content/items/e7a13c9919314e51b240031e697ae095?f=json
  -> HTTP 200, body = "ArcGIS Portal Directory" error page, 458 bytes
```

HTTP 200 with an error page — **a status code alone would have read as success.** Verify
the artefact, not the exit code; that rule now has a second instance.

## 3. The staleness is worse than the brief thought

The catalogue says **`R/P1M`** (monthly) but describes content as **December 2021**, with
`modified: 2025-09-01`. Today is 2026-10-03.

**A monthly dataset whose content is stamped 2021-12 is not monthly.** Either a stale copy
sits behind a refreshed record, or old content was re-published under a new timestamp.

> **If it is December 2021 content, a directory built from it renders 2021 businesses in
> 2026.** The brief's own warning — *"a shop that closed two years ago is worse than no
> shop"* — is **understated by three years.**

## 4. The best filter points at the worst storefronts

**Type 06 (RELOADER OF AMMUNITION) is the strongest signal this site could want** — the
licence exists *because* reloading ammunition is the business.

**But a reloader may be mail-order-only, wholesale, or not open to the public at all.**
And type **01 (dealer) — the one that guarantees a storefront — says nothing about
ammunition**, and **nothing at all about reloading components**, because no FFL covers
powder, primers, brass or bullets.

> **The dataset cannot answer the owner's question.** It answers the much weaker *"where
> was a licence held in December 2021."* That is a framing decision, not a detail.

**And `prohibits[]` already forbids the claim the data invites** — "the FFL list says a
licence exists, not what is on the shelf." **The temptation is built into the source.**

## 5. A federal government work is not automatically public domain

The catalogue states `accessLevel: public`. **It does not state a licence grant.** Copyright
in US federal works runs to the author, and an agency may have contracted for it.

**So: public access confirmed; public-domain status NOT asserted.** Attribution is good
practice regardless, and redistribution terms should be confirmed before republishing —
behind the same 403.

**The brief's "it is free" is an assumption I did not adopt.**

## 6. The geographic question gates the whole design, and it is unanswered

**Unknown whether lat/long exist.** The catalogue's `spatial: "U.S. State/Territory"`
describes *coverage*, not geometry; the distribution is XLS, not a shapefile.

**So the model must make coordinates OPTIONAL and nullable**, and the UI must degrade from
distance-sort to state-filter when they are absent. **Designing as if they exist is the
risk**, because the design would be untestable until someone downloads the file.

## 7. `latitude: null` must never render as `0.0`

The brief says a shop with no hours must not render as open 24 hours. **Generalised: a
point at 0°,0° is in the Atlantic.** A shop shown 400 km off the coast of Africa, with no
indication the coordinates are missing, is the same silent-error class as a blank price
cell reading as zero.

**Reuse `ui-research`'s `.unknown` vocabulary — this is the same finding in a second
domain, reached independently by two tasks.** That is the strongest argument in this
repo's data layer for the provenance work being a prerequisite rather than a nicety.

## What I did NOT do

- **Did not build the feature.** `prohibits[]`.
- **Did not scrape or geocode.** Only the publisher's own download URLs, which 403'd.
- **Did not add storefront, phone or hours from anywhere.** `prohibits[]`.
- **Did not claim any listed business sells ammunition.** `prohibits[]`.
- **Did not assert public domain**, or a row count, or a column list, or lat/long presence.