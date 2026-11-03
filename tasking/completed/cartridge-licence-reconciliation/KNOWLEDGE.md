# KNOWLEDGE — cartridge licence reconciliation

**Task:** cartridge-licence-reconciliation · **Agent:** dc408 · **Date:** 10 Feb 2026

---

## 1. The disagreement resolved: it was never about "free or not free"

Two completed tasks disagreed. Both were confident. Neither was careless. **They
answered about different permissions.**

`ammoseek-coverage` recorded CIP's licence as **"free to download from publisher."**
That is true. It is also irrelevant to our task, because we are not trying to
download — we are trying to **republish a column of numbers**.

CIP's actual notice, re-fetched today from `bobp.cip-bobp.org`:

> **"Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."**

**Download is free. Reproduction is not. The dataset is a reproduction.**

> **Reusable rule: when a licence question decides whether work can proceed, identify
> the exact verb the deliverable uses.** "Free to download", "free to read", "free to
> cite" and "free to republish" are four different permissions, and only the last one
> matters for a dataset.

`cartridge-dimensions` was right. Its §7 correction in `ammoseek-coverage` should be
treated as **superseded**.

---

## 2. Two different obstacles, and the distinction is worth money

Keeping these apart matters because **the remedies are different.**

| Verdict | Count | Obstacle | Remedy |
|---|---|---|---|
| `may-transcribe` | **3** | none | Proceed, flagged pre-standard |
| `no-free-source` | **226** | **availability** | **Purchase SAAMI Z299.x** — a budget decision |
| `blocked-cip` | **0 asserted** | **permission** | Written CIP approval — a legal decision |

226 of 229 cartridges are blocked by **availability**. Three by nothing. None by
permission alone, because CIP's ~11-sheet coverage was never independently confirmed
and I declined to expand it — reading 91 sheets to classify coverage is pointless
while the licence forbids the use.

> **Reusable rule: "blocked" is not one state.** A task that says "blocked on
> licensing" when it is really blocked on *not having bought the standard* will send
> the owner to the wrong conversation. Name the obstacle.

---

## 3. The arithmetic that makes this a business decision, not an engineering one

```
cartridges held                    229
SAAMI free drawings cover            3   (verified: 6-5-grendel, 44-40, 44-rem-mag)
cells deliberately left EMPTY    1,603   (7 columns x 229 rows)
dimensional cells populated         0
```

**The dimensional columns stay empty, and that is now a recorded decision rather than
an unfinished task.** `.clinerules` §5 rule 1 says never invent a value; this is the
same rule applied to provenance. A blank here means *"not ours to publish"*, which is
a different blank from *"not yet researched"* and must be recorded differently.

---

## 4. A third-party MIT dataset does not launder a restrictive source

`opensource_resources.csv` lists `ammolytics-cartridges` as MIT and `adopt=true`. It
is drawn from SAAMI, CIP and NATO STANAG. **An MIT licence on a derivative work cannot
convey more rights than the underlying data carries.** The same row already says
*"Verify any dimension against the standards body before publishing it."*

It remains genuinely valuable — for **CIP and NATO designations we do not carry**,
which is naming, not measurement.

> **Reusable rule: a permissive licence on a compilation does not make the
> compilation's inputs permissive.** Check the provenance chain before treating an
> `adopt=true` as clearance.

---

## 5. Correction to `ammoseek-coverage` §7's table, beyond the licence

Its 18-row table reads as 18 outstanding gaps. Measured against our seeds:

**4 of 18 held, 14 not held.**

The 14 unheld rows (5.56x45mm NATO, 12 Gauge, .410 Bore, 8/20/28 Gauge, 5.7x28 FN,
8.6 Blackout, 21 Sharp, 25 Creedmoor, 30 Super Carry, 338 ARC, 7mm Backcountry, 25
Weatherby Rebated) are **acquisition candidates, not gaps in existing rows** —
different work from dimensional transcription. Do not read that table as a backlog.

The 4 held (`9 Luger`, `.22 LR`, `.308 Win`, `.223`) all carry
`alias_match=yes`, confirming `ammoseek-coverage` §1: **naive string matching
manufactures gaps out of abbreviations.** Its six other findings stand.

---

## 6. Two live defects this task confirmed, both outside its write-set

**(a) 9 Luger and .22 LR are filed as `rifle`.** Measured:

```
MISFILED: slug=22-lr   name=".22 LR"    family=rifle  file=rifle.csv
MISFILED: slug=9-luger name="9 Luger"   family=rifle  file=rifle.csv

family distribution: { pistol: 16, rifle: 212, shotgun: 1 }
```

**212 of 229 are filed `rifle`,** including the two most-searched handgun cartridges.
Already reported by `ammoseek-coverage` §3; still unfixed.

**(b) Shotgun is a single placeholder.** `family=shotgun` contains exactly one row:
`4-bore-rifle "4 Bore Rifle"` — *"Curated row created to attach a pressure figure."*
We hold **0 of 8 gauges**, while SAAMI's free page names 12 Gauge and 28 Gauge
explicitly. **The emptiest category is among the cheapest to fill**, and the licence
problem does not bite here because neither design is in a published standard.

---

## 7. What I deliberately did NOT resolve

The SAAMI free drawings carry an "All rights reserved" footer, yet
`cartridge-dimensions` treated them as free to use because SAAMI publishes them
itself. **I have not resolved whether that distinction holds.** It is the one place
the permissive reading survives, and it governs 3 of 229 cartridges.

**That is a legal question. This task's prohibition on legal advice is why it is left
open rather than argued.** Recorded in `NOTES.md`.

---

## Reusable lesson

> **A licence dispute between two competent agents is usually a dispute about
> different verbs.** Before deciding who is right, write down the exact act each task
> wanted to perform — read, download, cite, or republish — and find the clause that
> governs *that* verb. Both agents were reasoning correctly about permissions they had
> not compared.
