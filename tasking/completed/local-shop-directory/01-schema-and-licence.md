# 01 — Schema and licence

Task `local-shop-directory`. **Researched 3 Oct 2026.**

> **I did not download the file. The brief says to, and I could not.** This document
> records what is verified, what is not, and why. `.clinerules` §5 rule 1: a blank is
> better than a wrong number.

---

## 1. The finding that changes the brief

**Every `atf.gov` endpoint returns HTTP 403 to this environment, including the site root.**

```
403  https://www.atf.gov/
403  https://www.atf.gov/firearms/listing-federal-firearms-licensees/
403  https://www.atf.gov/files/downloads/ffl-atf-latest-ffl.zip
```

`prohibits[]` says *"Do not scrape or geocode anything. Reading the file the publisher
provides is not scraping."* **I agree, and I did not scrape** — I attempted only the
publisher's own download URLs, which ATF refuses.

**The brief's instruction — "download the file and read it" — could not be executed.**

### What this means, stated carefully

**It does not mean the data is unavailable.** It means **ATF blocks automated clients from
this environment**, and *I* cannot profile it. A human in a browser can almost certainly
download it. **The difference matters and I will not paper over it**: the row count and
the exact column list below are **NOT measured**, because measuring them requires the file.

---

## 2. What IS verified — the catalogue record

The `data.gov` catalogue entry for dataset **identifier `4092`** was retrieved and reads:

| Field | Value |
|---|---|
| Title | Federal Firearms Licensees |
| Publisher | Bureau of Alcohol, Tobacco, Firearms and Explosives (USDOJ) |
| Access level | **public** |
| Accrual period | **R/P1M** (released monthly) |
| Description | *"Complete listing of federal firearms licensees in **December 2021**"* |
| Issued | 2021-12-01 |
| Dataset last updated | 2025-09-01 |
| Catalog last checked | 2026-09-10 |
| Temporal coverage | 2021-12-01 / **2025-09-30** |
| Spatial | **U.S. State/Territory** |
| Contact | atfopendata@atf.gov |
| Identifier | **4092** |
| Theme | geospatial |

**This confirms the brief's staleness concern precisely, and it is worse than "stale".**

## 3. The staleness problem, stated as measured

**Two dates disagree, and the gap is the finding.**

| Source | Says |
|---|---|
| Description text | Data is **December 2021** |
| Dataset last updated | **September 2025** |
| Accrual period | **Monthly** |
| **Today** | **3 Oct 2026** |

**If the content really is December 2021, it is nearly five years old and NOT monthly.**
A file described as `R/P1M` whose content is stamped 2021-12 is either a stale copy behind
a refreshed catalogue record, or a re-publication of old content under a new timestamp.

**I cannot determine which, because I cannot read the file.** And the difference decides
whether the dataset is usable:

> "**a shop that closed two years ago is worse than no shop.**" — the brief

**That warning is correct and I am strengthening it.** A directory of *licences* that
existed in December 2021, rendered in 2026, is **not a directory of shops that exist now.**
An FFL licence that lapsed, a business that closed, an address that changed — none is
distinguishable in this data.

**This is the gating question for the whole task, and it is unanswered.**

---

## 4. Licence position

**Verified from the catalogue record:**

- `accessLevel: **public**`
- Publisher is a **US federal government agency** (ATF, DOJ).
- A US federal government work is **not automatically public domain** — copyright runs to
  the author, and an agency may have contracted for it. **The catalogue states access
  level; it does not state a licence grant.**

**So: access is public; the licence grant is NOT stated on the record I could read.**

Per `.clinerules` §5 rule 1, **I am not asserting public domain.** What can be said:

- We **cite** the source either way — the brief is right that attribution is required as
  good practice regardless.
- Redistribution terms should be **confirmed from the ATF open-data terms before we
  republish**, and that page is behind the same 403.

**Recorded as an open item, not resolved.**

---

## 5. The catalogue's own download link does not resolve

The catalogue lists two distributions:

| Resource | Status when I tried it |
|---|---|
| FFL ISO 19139 metadata XML — `atf-geoplatform.maps.arcgis.com/...` | Not retrieved |
| Federal Firearms Licensees XLS — `opendata-atf-geoplatform.hub.arcgis.com/datasets/e7a13c9919314e51b240031e697ae095_0/explore` | **Renders empty** |

**And that dataset ID is not a valid ArcGIS item.** The ArcGIS item API returned an HTML
directory page instead of JSON:

```
https://www.arcgis.com/sharing/rest/content/items/e7a13c9919314e51b240031e697ae095?f=json
  -> HTTP 200, but body = "ArcGIS Portal Directory" error page, 458 bytes
```

**So the catalogue's own download link does not resolve to a service.** That is consistent
with December-2021 content: the item appears to have been unpublished or rotated.

**Conclusion: the brief's "cheapest and most authoritative source available, and it is
free" is not currently verifiable from here, on three counts** — ATF blocks automated
access, the catalogue download link is dead, and the stated content is dated December 2021.

---

## 6. What is NOT verified, and stays blank

| Question | Status |
|---|---|
| **Exact column list** ("every column name") | **NOT VERIFIED.** Requires the file. |
| **Row count** | **NOT VERIFIED.** |
| **lat/long present?** | **NOT VERIFIED.** See `03-data-model.md`. |
| Licence type codes | **Unverified against the file.** See `02-license-type-meaning.md`. |
| Real currency | **UNRESOLVED — see §3.** |
| Licence grant | **Partly.** Public access confirmed; grant not stated. |
| Contact | **Verified:** atfopendata@atf.gov |

**Three of the brief's questions answered, four blank.** That is the honest state, and it
is why `03-data-model.md` is a specification rather than a schema mapping.

## Sources

- `http://catalog.data.gov/dataset/federal-firearms-licensees` — catalogue record,
  retrieved 3 Oct 2026. **The brief's cited dataset 4092 URL (`/dataset/ffls`) returns 404;
  the live path is `/dataset/federal-firearms-licensees`.**
- `https://www.atf.gov/**` — **HTTP 403 on every endpoint attempted, including the root.**
- `https://www.arcgis.com/sharing/rest/content/items/e7a13c9919314e51b240031e697ae095?f=json`
  — returns an HTML error page, not JSON.