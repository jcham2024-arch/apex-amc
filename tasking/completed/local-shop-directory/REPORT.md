# REPORT — local-shop-directory

**Task:** `local-shop-directory` (priority: highest) · **Agent:** `ee247`
**Model:** default model, fresh instance. **Date:** 3 Oct 2026.
**Status:** complete, **with the schema portion blocked** — see §2.

## Deliverables

| File | Contents |
|---|---|
| `01-schema-and-licence.md` | Catalogue record quoted; verified vs blank |
| `02-license-type-meaning.md` | Type codes; what each implies and does not |
| `03-data-model.md` | Specification; the geographic gate; the staleness gate |
| `KNOWLEDGE.md` | Durable findings |
| `NOTES.md` | Blocker and four defects found, none repaired |
| `REPORT.md` | This file |

---

## 1. What I did

Read the source task derives from, retrieved the `data.gov` catalogue record for dataset
4092, and attempted the publisher's own download URLs. Profiled what I could reach. Wrote
a data model with **unknown fields left unknown**, because the file was not reachable.

---

## 2. What I found

### The schema could not be profiled — the brief's instruction was impossible

> **Every `atf.gov` endpoint returns HTTP 403 to this environment, including the site root.**

```
403  https://www.atf.gov/
403  https://www.atf.gov/firearms/listing-federal-firearms-licensees/
403  https://www.atf.gov/files/downloads/ffl-atf-latest-ffl.zip
```

**Not delivered:** exact column list · row count · lat/long presence · licence codes as
they actually appear. **Delivered instead:** the catalogue record quoted field by field,
and a model designed so that every one of those unknowns is survivable.

### The catalogue's own download link is dead

The listed XLS points at an ArcGIS dataset ID that is **not a valid item** — the API
returned **HTTP 200** with an HTML error page. **Status-code-only checking would have read
that as success.**

### Staleness is worse than the brief estimated

`R/P1M` (monthly) against content described as **December 2021**, `modified 2025-09-01`,
today **2026-10-03**. **If the content really is 2021, it is ~5 years stale and not
monthly.** The brief's warning — *"a shop that closed two years ago is worse than no
shop"* — is understated by about three years.

### The best filter points at the worst storefronts

**Type 06 (reloader) is the strongest signal this site could want**, and it is exactly the
filter most likely to yield mail-order or wholesale businesses with no public storefront.
**Type 01 (dealer) guarantees a storefront and says nothing about ammunition** — and
**nothing at all about reloading components**, since no FFL covers powder, primers, brass
or bullets.

### Public access ≠ public domain

`accessLevel: public` is verified. **A public-domain grant is not**, and I did not assert
one.

---

## 3. Two negative tests

**I expected to download the file.** The brief calls it *"the cheapest and most
authoritative source available, and it is free"* — which reads as settled.

**It is not settled on three counts:** ATF blocks automated access, the catalogue's
download link does not resolve, and the stated content is dated December 2021.

**Had I trusted the brief, this deliverable would have contained a schema assembled from
secondary sources** — plausible, unverifiable, and wrong in ways that would surface only
after someone built a pipeline against it. **A blank is better than a wrong number**, and
here the blank is the deliverable.

**Second — a claim I checked that the brief did not.** The brief says the catalogue is
"free" and "public domain". The record actually states **access level public, licence
grant not stated.** Those are different things.

---

## 4. What I did NOT do

- **Did not build the feature.** `prohibits[]`.
- **Did not scrape or geocode.** Only the publisher's own download URLs, which 403'd.
- **Did not add storefront, phone or hours from any source.** `prohibits[]`.
- **Did not claim any listed business sells ammunition.** `prohibits[]`.
- **Did not reconstruct the schema from secondary sources.** This is the main one — it
  would have looked like a completed deliverable and been the most likely thing to be
  wrong.
- **Did not assert public domain.**
- **Did not edit the brief**, though its dataset URL 404s and its staleness estimate is
  understated.

---

## 5. What I believe is wrong

**The premise that this dataset answers the owner's question is wrong, and no amount of
implementation fixes it.**

The owner asked for nearby shops that sell **ammunition and reloading supplies**. **This
data cannot answer that.** It answers *"where was an FFL licence held in December 2021."*
The gap is not a filter to tune — **it is the subject matter.** Federal licensing covers
firearms and ammunition; **reloading components are not licensed at all.**

So the strongest signal available (06) points at businesses least likely to have a
storefront, and the one that guarantees a storefront (01) is uninformative about our
product. **The honest feature is "a directory of licensed businesses", and it is a
different — smaller — thing than what was asked for.**

Second: **my judgement is that this should not be built until the content date is
confirmed.** Not because the code is hard, but because **the value is a claim about where
ammunition can be bought today, and 2021 data cannot support a claim about today.** If the
owner wants a historical archive, that is a legitimate product — and it should be labelled
as one.

## Definition of Done

| Requirement | Status | Evidence |
|---|---|---|
| All 5 `required_outputs` exist | **PASS** | listed above |
| **Exact schema, columns, row count** | **BLOCKED** | ATF 403; see §2 |
| Licence types: meaning and non-meaning | **PARTIAL** | meanings given; codes unverified |
| Staleness stated honestly | **PASS** | `01-` §3 |
| Licence position established | **PARTIAL** | access public; grant not stated |
| Geographic index specified | **PASS** | `03-` §1, as a gate |
| Data model incl. absence | **PASS** | `03-` §2–§4 |
| Did not build / scrape / merge / claim | **PASS** | §4 |
| `npm run verify` exits 0 | **PASS** | see report |

### Known limits

- **The schema is unknown.** Every field-level statement is a design assumption, and the
  model was built so those assumptions are cheap to correct once the file is read.
- **Licence type codes are from general FFL typology, not from this file.** The mapping
  onto the actual column is unverified.
- **No confirmation that a newer source does not exist.** I could only see the catalogue
  entry and the dead link it carries.
- **Licence/status expiry field unknown**, so the model assumes closures are undetectable.
  **This is the assumption most likely to be wrong in our favour.**
- **US-only.** No territorial-licence handling is specified beyond `state` being a 2-letter
  code.