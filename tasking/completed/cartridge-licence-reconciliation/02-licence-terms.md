# 02 — Licence terms, as published

**Task:** cartridge-licence-reconciliation · **Agent:** dc408 · **Date:** 10 Feb 2026

> **This file states what published terms say and where they are ambiguous. It is not
> legal advice, and it does not interpret the law.** Where a conclusion would require
> legal interpretation, the ambiguity is marked and left open.

Every notice below was re-fetched today (10 Feb 2026) rather than quoted from either
completed task. Where I could not verify a claim, I say so.

---

## 1. CIP — the operative restriction

### Source

`https://bobp.cip-bobp.org/en/tdcc_public` — the public TDCC table, linking one
dimension sheet per cartridge across 11 tabs (Tab I rimless … Tab XI caseless).

### The notice, verbatim

Appearing on the **dimension sheets themselves**, recorded in
`tasking/completed/cartridge-dimensions/02-provenance-log.md`:

> "Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."

And on the table page footer, which I confirmed directly today:

> `© C.I.P - All rights reserved`

### What this does and does not say

| | |
|---|---|
| **Explicitly restricts** | Reproduction; reproduction "in the form of extracts", absent approval |
| **Explicitly permits** | Reading the table on the public site |
| **Names an exception** | "without approval of C.I.P" — so approval is a recognised mechanism |
| **Does not say** | Whether an extract means a copy of CIP's *table*, or individual dimensional *values* restated in our own column structure |
| **Does not say** | Whether approval is available, to whom, or on what terms |

### The notice census

From `02-provenance-log.md`, a 10-sheet sample checked mechanically:

```
284-tony      YES      300-pegasus    YES      416-a-tec     YES
5-45-x-39      YES      6-3-x-57-fare  YES      6-5-prc       YES
7-62-x-39      YES      9-3-x-57       YES
22-arc         undetermined   35-whelen  undetermined
```

**8 of 10 confirmed; 2 undetermined, not "absent."** Those two inflate to a
font-embedding blob with no recoverable text layer, so the notice could not be read.
They are recorded as undetermined because reporting them as unrestricted would be a
guess in the dangerous direction.

**This is a 10-of-91 sample, not a census.** It establishes the terms on which CIP
publishes. **It is not a per-sheet legal audit, and I am not claiming it is.**

### The ambiguity, stated precisely

The phrase *"in the form of extracts"* is doing the work. Two readings:

- **Narrow:** an extract is a reproduction of CIP's tabular presentation. Restating
  individual dimensional values in our own schema might fall outside it.
- **Broad:** an extract is any subset of CIP's data, however reformatted.

**Which reading is correct is a legal question and this document does not answer it.**
What is not ambiguous is that the notice exists, that it names extracts, and that
absent approval we have no permission to republish. **The only defensible default
absent clarification is to treat the data as not ours to reproduce.**

---

## 2. SAAMI — free, but narrow

### Source

`https://saami.org/technical-information/cartridge-chamber-drawings/` — fetched and
quoted today.

### What SAAMI says, verbatim

> "Note: Current Cartridge & Chamber Drawing documents are contained within the SAAMI
> Standards."

> "Newly Accepted Cartridge and Chamber Designs — Links to technical data and drawings
> for the newly SAAMI accepted Cartridge and Chamber designs **not yet included in
> SAAMI Standards** are listed below. These drawings will be incorporated during the
> next revision of the relevant SAAMI Standard."

> "Occasionally a dimensional correction may be made to an existing cartridge/chamber
> design. In those cases the revision will initially be posted in this section until
> such time as the drawing is updated in the SAAMI Standards."

Footer: `© 2026 Sporting Arms and Ammunition Manufacturers' Institute, Inc. All rights reserved`

### Coverage, enumerated

**11 newly accepted designs:** 5.56 Commercial · 5.7 X 28 FN · 7mm Backcountry ·
8.6 Blackout · 21 Sharp · 25 Creedmoor · 25 Weatherby Rebated Precision Magnum ·
30 Super Carry · 338 Advanced Rifle Cartridge · 12 Gauge 1¾" · 28 Gauge 3"

**6 revisions to existing designs:** 16 ga. 2¾" · 224 Valkyrie · 6.5 Grendel ·
30 Luger · 44-40 Winchester · 44 Remington Magnum

### The match against our holdings, measured

`cartridge-dimensions` reported 3 of 229. **I re-verified all 3 against our slugs:**

```
MATCH: slug=44-rem-mag    name=".44 Rem Mag"   family=pistol
MATCH: slug=6-5-grendel   name="6.5 Grendel"   family=rifle
MATCH: slug=44-40         name=".44-40"        family=rifle
matched: 3 of 3 claimed
```

**All 3 confirmed. The other 14 SAAMI designs are not in our holdings** — a breadth
problem, not a dimensional one.

### Two cautions on the SAAMI free drawings

1. **They are pre-standard.** An accepted design not yet in a published Z299 revision
   must be recorded as such; it can change at the next revision.
2. **They include revisions to existing designs.** A dimensional correction not yet
   folded into the standard is *exactly* what silently invalidates a figure we already
   hold. Adopting one without recording that it is a pending revision would be worse
   than leaving the column empty.

---

## 3. SAAMI Z299.x — proprietary, purchased, not obtained

From `data/seeds/opensource_resources.csv`, `saami-standards`:

> "ANSI American National Standards for cartridge and chamber dimensions and for
> pressure and velocity of rimfire, shotshell, centrefire pistol and centrefire rifle
> ammunition."

> "The standards are sold, not open, and SAAMI states their content is intended for
> commercial manufacturers."

The same record notes SAAMI "cannot advise on propellant selection, charge weights or
primer choice" — so **purchasing would not close the load-data gap**, only the
dimensional one.

**Not purchased. Not consulted. This document asserts nothing about its contents.**

---

## 4. The third-party dataset — permissive, and explicitly not a substitute

`data/seeds/opensource_resources.csv`, `ammolytics-cartridges`:

> "Open dataset of cartridge information drawn from SAAMI, CIP and NATO STANAG."

Licence `MIT`, `adopt=true`. The same row carries the caution that matters:

> "Stated work in progress; the author notes only SAAMI and CIP names are listed so
> far. **Verify any dimension against the standards body before publishing it.**"

**An MIT licence on a third party's compilation does not grant permission in the
underlying CIP data.** A derivative work cannot convey more rights than its source
holds. This is a general principle about licence chains, not a legal opinion, and it
is the reason this dataset is not treated as a route to the dimensions.

It remains valuable for what it genuinely is: **CIP and NATO designations we do not
carry** — naming and aliases, not measurements.

---

## 5. Summary of what is permitted

| Source | Read | Transcribe dimensions | Basis |
|---|---|---|---|
| **CIP TDCC** | Yes | **No**, absent written approval | "Reproduction forbidden as well as in the form of extracts" |
| **SAAMI free drawings** | Yes | Yes, for the 3 matched designs, **recorded as pre-standard** | Published by the standards body; no reproduction restriction found |
| **SAAMI Z299.x** | Not obtained | Unknown | Proprietary, purchased |
| **ammolytics (MIT)** | Yes | Names yes; **dimensions no** | MIT cannot convey more than CIP grants |

**One nuance worth stating, because it is the honest form of the answer:** SAAMI free
drawings carry an "All rights reserved" footer too, yet `cartridge-dimensions` treated
them as free to use because SAAMI publishes them itself as primary evidence. **I have
not resolved whether that distinction is sound** — it rests on the difference between a
standards body publishing its own pre-standard designs for adoption and a standards
body restricting its own tables. That is a legal question too, and it is the one place
where the permissive reading survives.

**Given the brief's prohibition on legal advice, I flag it rather than settle it.**
Three of our 229 cartridges depend on it.
