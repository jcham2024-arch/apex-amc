# T4 — Provenance log

**One row per populated cell, per the brief.**

## Populated cells: 0

`cartridge_dimensions_filled.csv` contains **zero** newly populated dimensional
cells. All 229 rows carry EMPTY in:

`bullet_dia_in`, `case_length_max_in`, `max_col_in`, `rim_dia_in`,
`head_dia_in`, `capacity_gr_h2o`, `primer_type`

**This is a deliberate result, not an oversight.** An empty cell here means
"the governing source does not permit us to republish this value", not "we did
not look". The log below therefore records, per *source*, why the cells are
empty — which is the part that survives the merge, exactly as the brief says.

---

## Source 1 — CIP TDCC per-cartridge dimension sheets

| Field | Value |
|---|---|
| Source id | `cip-tdcc-dimension-sheet` |
| URL | `https://bobp.cip-bobp.org/en/tdcc_public` |
| Sheet URL pattern | `https://bobp.cip-bobp.org/uploads/tdcc/tab-<n>/<designation>-en.pdf` |
| Retrieval date | 2026-10-02 |
| Language used | EN (FR/DE variants also published) |
| Sheets found | 91 EN sheets linked from the public table page |
| Authoritative for | CIP dimensions and CIP proof pressures, in **millimetres** |
| Field mapping | `L1` case length · `L2` length to datum · `L3` overall cartridge length · `R1` rim diameter · case-head diameter · `G1` bullet/bore diameter · `Pmax`/`PK`/`PE` CIP pressures |
| Text extractable | Yes, for 8 of the 10 sheets sampled |
| Licence status | **Restricted.** Verbatim: "Reproduction forbidden as well as in the form of extracts without approval of C.I.P." Site footer: "© C.I.P - All rights reserved" |
| Cells populated from it | **0** |
| Reason | The notice names *extracts* specifically. A column of transcribed dimensions drawn from these sheets is an extract. |
| Conflict | None recorded — no two CIP sheets for the same cartridge were compared |

### Notice census (10-sheet sample, method attached)

| Sheet | Notice | How determined |
|---|---|---|
| 7-62-x-39-en | YES | contiguous in stream |
| 9-3-x-57-en | YES | contiguous in stream |
| 300-pegasus-en | YES | contiguous in stream |
| 6-3-x-57-fare-en | YES | contiguous in stream |
| 5-45-x-39-en | YES | after kern-aware concat |
| 6-5-prc-en | YES | after kern-aware concat |
| 416-a-tec-en | YES | after kern-aware concat |
| 284-tony-en | YES | after kern-aware concat |
| 22-arc-en | **undetermined** | no text layer; notice unreadable |
| 35-whelen-en | **undetermined** | no text layer; notice unreadable |

Method: inflate streams → collect PDF literal strings → concatenate with **no
separator** → decode octal escapes → match. The no-separator step is load
bearing; see `01-source-survey.md` §1.

**The two "undetermined" rows are deliberately not "no".** An unreadable notice
is not permission.
---

## Source 2 — SAAMI new & revised cartridge and chamber drawings

| Field | Value |
|---|---|
| Source id | `saami-free-drawings` |
| URL | `https://saami.org/technical-information/cartridge-chamber-drawings/` |
| Retrieval date | 2026-10-02 |
| Authoritative for | Newly accepted designs and pending dimensional revisions, from the standards body itself |
| Licence status | Free to download. **Pre-standard.** Verbatim: "These drawings will be incorporated during the next revision of the relevant SAAMI Standard." |
| Designs published | 17 total — 11 newly accepted, 6 revisions |
| Overlap with our 229 | **3** |
| Cells populated from it | **0** |
| Reason | The 3 overlapping designs (`6-5-grendel`, `44-40`, `44-rem-mag`) are in-progress revisions or chamber drawings, not settled dimensional text; and the CIP finding governs the task. |

### The three overlaps, listed

| SAAMI free design | Our slug | Kind |
|---|---|---|
| 6.5 Grendel | `6-5-grendel` | revision |
| 44-40 | `44-40` | revision |
| 44 Rem Mag | `44-rem-mag` | revision |

All three are revisions. None is a newly accepted design, so none carries
settled dimensions.

---

## Source 3 — SAAMI Z299.x standards (text)

| Field | Value |
|---|---|
| Source id | `saami-z299` |
| URL | `https://saami.org/technical-information/ansi-saami-standards/` |
| Retrieval date | 2026-10-02 (index page only) |
| Authoritative for | Cartridge and chamber dimensions; pressure ceilings |
| Licence status | **Proprietary, sold.** Not purchased for this task. |
| Cells populated from it | **0** |
| Reason | Not obtained. Purchasing it is an owner decision. |

---

## Sources considered and rejected

| Source | Why rejected |
|---|---|
| `ammolytics/cartridges` (MIT, `adopt=yes`) | Wrapper over SAAMI/CIP/NATO content. MIT on the wrapper does not license the underlying standards. Its own registry entry warns to verify against the standards body. |
| Manufacturer datasheets | A restatement of SAAMI/CIP figures; does not clear the restriction. |
| kwk.us compilation | Already the source of our `saami_max_psi`; carries no dimensions. |
| Blogs, forums, load-data sites | Excluded by the brief and project rules. |

---

## SAAMI vs CIP disagreement check

The brief asks for a cartridge where SAAMI and CIP disagree, **or a plain
statement that none was found.**

**None was found — and none could be.** Comparing the two requires holding both
values side by side, and holding a CIP value is precisely what is not permitted.
Recording a disagreement now would require reproducing the CIP side of it.

This is a limitation of the licence, not an absence of disagreement: SAAMI and
CIP are known to differ on some cartridges, and that difference is real and
resolvable **only after** permission is obtained. When the columns are filled,
this log must be revisited and disagreements recorded as both values, marked
unresolved, and **never averaged** — per `data/reference/README.md`.