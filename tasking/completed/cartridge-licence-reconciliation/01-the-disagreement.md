# 01 — The disagreement, on the record

**Task:** cartridge-licence-reconciliation · **Agent:** dc408 · **Date:** 10 Feb 2026

Neither completed task is silently overruled here. Both positions are stated
verbatim with their sources, and then resolved.

---

## Position A — `ammoseek-coverage`

**File:** `tasking/completed/ammoseek-coverage/KNOWLEDGE.md` §7, verbatim:

> ## 7. No licence wall on cartridge dimensions
>
> Every genuine gap in this task's table has a free, named, primary source. Only
> shotgun **max pressure** is paywalled (SAAMI Z299.5). **The barrier to this work is
> transcription effort, not permission.** Scope the next task accordingly.

Its per-cartridge table (`ammo_seek_coverage_gap.csv`) repeats this for all 18 rows.
The `source_licence` column reads, for the 14 CIP-named rows:

> `free to download from publisher`

and for 5.56x45mm NATO:

> `free to download from CIP`

with `sourcing_feasibility` = `easy` on every row.

**In one sentence:** reading and downloading are unrestricted, so the only cost is the
effort of typing numbers in.

## Position B — `cartridge-dimensions`

**File:** `tasking/completed/cartridge-dimensions/REPORT.md`, verbatim:

> - **CIP** states, verbatim on its dimension sheets: *"Reproduction forbidden as
>   well as in the form of extracts without approval of C.I.P."* The words "in the
>   form of extracts" decide it — a column of transcribed dimensions **is** an
>   extract.
>
> The brief described CIP as "free to read; reprinting verbatim may be restricted."
> **The actual restriction is broader: reading is free, extracting is not.** That
> correction is the most useful thing this task produced.

`02-provenance-log.md` records the same notice with the site footer:

> "Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P." Site footer: "© C.I.P - All rights reserved"

And the result it produced: **1,603 cells left EMPTY (7 columns × 229 rows),
deliberate.**

**In one sentence:** the licence forbids exactly the deliverable, so the task is
impossible as specified.

---

## Both are partly right, and they are answering about different things

The brief asked whether the disagreement is about **licence terms**, **scope**, or
**which cartridge subset**. Measured, it is **all three, and they separate cleanly.**

### 1. On the licence terms, B is right and A is wrong about the operative verb

`ammoseek-coverage` recorded the CIP licence as **"free to download from publisher."**
That phrase is true and irrelevant. CIP's notice restricts **reproduction**, not
**download**:

> "Reproduction forbidden as well as in the form of extracts without approval of C.I.P."

I re-fetched `https://bobp.cip-bobp.org/en/tdcc_public` today to confirm this
independently rather than trusting either task's transcription. The page footer reads:

> `© C.I.P - All rights reserved`

The full sentence *"Reproduction forbidden as well as in the form of extracts"* appears
on the **dimension sheets themselves**, which is why the notice census in
`02-provenance-log.md` found it in 8 of 10 sheets sampled. **Position A's error was
reading "free to download" as "free to republish."** Those are different permissions,
and the dataset is a republication.

**This is the substantive correction.** The obstacle to dimensional data is not
effort; it is a licence term that names the exact act we would perform.

### 2. On scope, A is right that most cartridges have *a* free primary source — but
that source is CIP, which brings us back to B

Position A's table is not fabricated. It names real, free, primary sources. But for
**14 of its 18 rows** the named source is *itself* CIP:

> `CIP TDCC where covered; otherwise SAAMI New & Revised Drawings if the design is listed there`

So the permissive reading is conditional on a source whose terms forbid the use.
**A's own table refutes A's conclusion** — it routes the work straight into the wall
B identified.

### 3. On which cartridges, the two subsets barely overlap — this is why both agents
were confident

| | Count | Notes |
|---|---|---|
| Cartridges we hold | **229** | measured across `data/seeds/cartridge_specs/*.csv` |
| SAAMI free drawings cover | **3** | verified: `6-5-grendel`, `44-40`, `44-rem-mag` — all 3 matched |
| CIP TDCC covers | **~11** | `cartridge-dimensions` sampling; **not independently confirmed by me** |
| Union of free primary dimensional sources | **≤ 14 of 229** | **~6%** |
| Cells deliberately left EMPTY | **1,603** | 7 columns × 229 rows |

So **~215 of 229 cartridges have no free primary dimensional source at all.** For
those, the licence question is moot — there is nothing to transcribe even if
permission existed.

---

## The one place A is unambiguously right, and B did not address it

Position A's §5 finding — that **SAAMI free drawings cover only newly accepted
designs and pending revisions, not the common calibres** — I confirmed today against
the live page. SAAMI's own text:

> "Newly Accepted Cartridge and Chamber Designs — Links to technical data and drawings
> for the newly SAAMI accepted Cartridge and Chamber designs **not yet included in
> SAAMI Standards** are listed below."

and

> "Note: Current Cartridge & Chamber Drawing documents are contained within the SAAMI
> Standards."

The 11 newly accepted designs listed are 5.56 Commercial, 5.7 X 28 FN, 7mm
Backcountry, 8.6 Blackout, 21 Sharp, 25 Creedmoor, 25 Weatherby Rebated Precision
Magnum, 30 Super Carry, 338 Advanced Rifle Cartridge, 12 Gauge 1¾", 28 Gauge 3" — plus
6 revisions (16 ga., 224 Valkyrie, 6.5 Grendel, 30 Luger, 44-40 Winchester, 44
Remington Magnum).

**Only 3 of those 17 touch our 229 holdings.** The obstacle for the remaining 226 is
availability, not permission — a distinction worth preserving, because the remedy is
different: one needs a licence, the other needs a purchase.

---

## Verdict

**Position B is correct on the operative question and should stand.** The licence
forbids extracts, and the deliverable is an extract.

**Position A is wrong on the licence and should not be relied on for it.** Its
conclusion — "the barrier is transcription effort, not permission" — would have sent
a future agent to transcribe CIP data, which is the one thing the terms forbid.

**Position A's other six findings are unaffected and remain good.** Its §1 (the brief's
coverage baseline was wrong; 36.30% of AmmoSeek share already held), §2 (the gap is
depth not breadth), §3 (9 Luger and .22 LR misfiled as rifle), §4 (shotgun empty),
§5 (SAAMI covers only new designs), §6 (CIP vs STANAG on 5.56) all stand and are not
in dispute. **This reconciliation corrects §7 only.**

### One correction to `ammoseek-coverage` §7's own table

Its 18 rows describe cartridges we largely do **not** hold. Measured against the seeds:

```
9mm Luger    canon="9 Luger"     alias=yes  held=true
.22LR        canon=".22 LR"      alias=yes  held=true
.308 Win     canon=".308 Win"    alias=yes  held=true
.223         canon=".223"        alias=yes  held=true
5.56x45mm NATO, 12 Gauge, .410 Bore, 8/20/28 Gauge,
5.7x28 FN, 8.6 Blackout, 21 Sharp, 25 Creedmoor,
30 Super Carry, 338 ARC, 7mm Backcountry, 25 Weatherby Rebated
             canon=""            alias=no   held=false
```

**4 of 18 held, 14 not held.** The 14 unheld rows are *acquisition candidates*, not
gaps in existing rows — a different kind of work from the dimensional transcription
§7 was used to justify. Worth stating plainly so the next agent does not read that
table as 18 outstanding gaps.

---

## What would actually resolve this, and who must be asked

1. **Written approval from CIP** to reproduce dimensional values as a derived dataset.
   CIP states approval is the mechanism; whether it is granted, and on what terms, is
   not ours to predict. Until it is, the honest cell value is EMPTY.
2. **Purchase of SAAMI Z299.x**, which covers the settled designs for our holdings.
   This is an owner budget decision, not an engineering one.
3. **A licence question with a lawyer**, specifically: *does "in the form of extracts"
   cover individual dimensional values restated in our own column structure, or only
   reproduction of CIP's tables as tables?* The wording names extracts; the boundary
   between an extract and a restatement of facts is a legal question and **I am not
   answering it.** I am recording that the terms are ambiguous in exactly this place.