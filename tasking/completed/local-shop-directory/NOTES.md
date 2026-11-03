# NOTES — defects and blockers

**From:** agent `ee247`, `local-shop-directory`, 3 Oct 2026.

---

## 1. BLOCKER — the file could not be downloaded, so the schema is unverified

The brief: *"Fetch and profile the ATF FFL dataset. Report the EXACT schema: every column
name, the licence type codes and their meanings, and the row count. **Do not summarise from
the catalogue page - download the file and read it.**"*

**Every `atf.gov` endpoint returns HTTP 403 to this environment**, including the site root.
The catalogue's own download link is an ArcGIS URL whose dataset ID is not a valid item.

**Not delivered:** exact column list · row count · lat/long presence · licence-type
codes as they actually appear.

**Delivered instead:** everything the catalogue record states, quoted; a data model with
unknown fields left unknown; and the three gating questions in `03-` §5.

**This is a human-action blocker, not an agent blocker.** Someone in a browser can
probably download it. **What I will not do is reconstruct the column list from secondary
sources** — a plausible schema that does not match the real file is worse than a blank
one, because it would be built into a data pipeline and discovered later.

## 2. The brief's dataset URL is wrong

The brief cites *"catalog.data.gov dataset 4092"*. **`/dataset/ffls` returns 404.** The
live path is `/dataset/federal-firearms-licensees` (identifier `4092` is correct).

Reported, not repaired — `.clinerules` §10.1.

## 3. `R/P1M` versus December 2021 content is a contradiction in the source

`accrualPeriodicity: R/P1M`, `modified: 2025-09-01`, description *"licensees in
**December 2021**"*. Today is 2026-10-03.

**Either the content is ~5 years stale, or a monthly dataset is not monthly.** The
catalogue record does not distinguish these. **This is the gating question for the whole
feature** and it is unresolved.

## 4. "It is free" is an assumption I did not adopt

The brief: *"It is free: the ATF publishes a complete, PUBLIC DOMAIN listing."*

**Verified:** `accessLevel: public`, publisher is ATF/DOJ.
**NOT verified:** that the work is public domain. **A US federal government work is not
automatically public domain** — copyright runs to the author and an agency may have
contracted for it. The catalogue states access level, not a licence grant.

`01-` §4 records this as an open item.

## 5. An HTTP 200 that was an error page

The ArcGIS item API returned **HTTP 200** with an HTML "ArcGIS Portal Directory" error
page instead of JSON. **Status-code-only checking would have recorded success.**

Same family as the traps in `AGENTS.md` and the `code-audit` finding that *"a gate in
`verify` can be green and verify nothing."* **I checked the body because of that rule,
and it is what surfaced the dead link.**

## 6. The brief anticipated the risk, and the data confirms it

`prohibits[]`: *"Do not claim a listed business currently sells ammunition."*

**The source invites exactly that claim**, because type 01 reads as "dealer" and type 06 as
"reloader". **A user of an implemented directory would infer it regardless of what our
copy says.** That is why `03-` §6 states what the feature can and cannot say, rather than
leaving it to implementation.

## 7. One thing I could not check

Whether the FFL file carries a **licence status or expiry field.** If it does, the "shop
closed two years ago" failure mode is partly removable. **It almost certainly does not —
licence files are snapshots — but I could not read the file to confirm**, so it stays
unverified and the model does not assume it.