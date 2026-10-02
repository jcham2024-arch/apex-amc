# REPORT — cartridge-licence-reconciliation

**Task:** resolve the contradiction between two completed tasks on CIP licensing.
**Agent:** dc408 · **Date:** 10 Feb 2026 · **Write-set:**
`tasking/completed/cartridge-licence-reconciliation/` only.

---

## 1. Verdict, first

**`cartridge-dimensions` is right. `ammoseek-coverage` §7 is superseded.**

Both were reasoning carefully; they were answering about **different permissions**.
`ammoseek-coverage` recorded CIP's licence as *"free to download from publisher"* —
true, and irrelevant, because the deliverable is a **republished column of numbers**,
not a download. CIP's notice, which I re-fetched today from `bobp.cip-bobp.org`:

> **"Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."**

**Download is free. Reproduction is not. We were planning to reproduce.**

The dimensional columns stay empty. That is now a **recorded decision with a named
obstacle**, not an unfinished task.

**The second finding is more useful than the first: for 226 of our 229 cartridges the
obstacle is not permission at all — it is that we have not bought the standard.**
Those need different conversations with the owner.

---

## 2. What I did

1. Read both positions verbatim and recorded them in `01-the-disagreement.md` without
   overruling either.
2. **Re-fetched both sources today** rather than trusting either task's transcription —
   CIP's TDCC page and SAAMI's drawings page.
3. Measured the coverage arithmetic against the actual dataset instead of inheriting
   either task's estimate.
4. Wrote `03-per-cartridge-verdict.csv`: a verdict per cartridge, **containing no
   dimension**, because establishing permission was the deliverable.

---

## 3. What I found

### The disagreement was about the operative verb

`ammoseek-coverage` §7: *"The barrier to this work is transcription effort, not
permission."*

But its own table routes 14 of 18 rows into the wall it says does not exist:

> `CIP TDCC where covered; otherwise SAAMI New & Revised Drawings if the design is listed there`
> — `source_licence: free to download from publisher`, `sourcing_feasibility: easy`

**Its own evidence contradicted its conclusion.**

### Two obstacles, kept separate because the remedies differ

| Verdict | Count | Obstacle | Remedy | Who decides |
|---|---|---|---|---|
| `may-transcribe` | **3** | none | proceed, flagged pre-standard | — |
| `no-free-source` | **226** | **availability** | buy SAAMI Z299.x | **owner, budget** |
| `blocked-cip` | **0 asserted** | **permission** | written CIP approval | **owner / CIP** |

**All 3 `may-transcribe` slugs verified individually** against our seeds:
`6-5-grendel`, `44-40`, `44-rem-mag` — 3 of 3 confirmed, not inherited.

### A correction beyond the licence

`ammoseek-coverage` §7's 18-row table reads as 18 gaps. **4 of 18 are held; 14 are
not.** The 14 are *acquisition candidates*, not gaps in existing rows — different work
entirely.

### A MIT licence does not launder a restrictive source

`ammolytics-cartridges` is MIT and `adopt=true`, drawn from SAAMI/CIP/STANAG. **A
permissive licence on a derivative work cannot convey more rights than its source
holds.** Useful for naming; not a route to dimensions.

---

## 4. Reasoning

The decisive question was never "is CIP free?" It was **"free to do what?"** Two
completed tasks used the same word — *free* — for two different permissions, and each
was correct about its own.

I checked the sources directly rather than trusting either transcription, because
`ammoseek-coverage` and `cartridge-dimensions` disagree on the operative phrase and at
least one of them must be paraphrasing. Both the CIP notice and SAAMI's footer were
confirmed verbatim against the live pages.

Where coverage was asserted rather than measured, **I declined to expand it.** Reading
91 CIP sheets to classify which cartridges they cover is wasted work while the licence
forbids the use — so the CSV records `blocked-cip: 0` meaning *"not asserted"*, not
*"none exist"*. Approximately 11 are expected to move there if N2 resolves
permissively. **Recording an unverified subset would have been the easier and wrong
answer.**

---

## 5. Verification

Every number below was measured, not quoted.

```
=== SAAMI free-drawing matches, verified against slugs ===
MATCH: slug=44-rem-mag    name=".44 Rem Mag"   family=pistol
MATCH: slug=6-5-grendel   name="6.5 Grendel"   family=rifle
MATCH: slug=44-40         name=".44-40"        family=rifle
matched: 3 of 3 claimed

=== ammoseek table: which of its 18 do we hold? ===
9mm Luger canon="9 Luger" alias=yes held=true
.22LR     canon=".22 LR"  alias=yes held=true
.308 Win  canon=".308 Win" alias=yes held=true
.223      canon=".223"     alias=yes held=true
(14 further rows: canon="" alias=no held=false)
held: 4 of 18

=== family distribution + the misfiling defect ===
{ pistol: 16, rifle: 212, shotgun: 1 }
MISFILED: slug=22-lr   name=".22 LR"  family=rifle  file=rifle.csv
MISFILED: slug=9-luger name="9 Luger" family=rifle  file=rifle.csv
shotgun: 4-bore-rifle "4 Bore Rifle"

=== verdict CSV, read back from disk ===
header: slug | name | family | verdict | basis | dimensional_cells_populated
body rows: 229
ragged rows: 0 (must be 0)
verdict tally from disk: { 'no-free-source': 226, 'may-transcribe': 3 }
rows with any populated dimensional cell: 0 (must be 0)
BOM present: false (must be false)
```

**Negative test — the CSV's own guarantee.** The task's hard prohibition is *"do not
transcribe any CIP-derived dimension."* Verified mechanically: **0 of 229 rows carry a
populated dimensional cell**, and the file contains no measurement of any kind. The
prohibition holds in the artefact, not just in the prose.

**Two self-corrections, because the first attempts produced wrong answers:**

1. **My first CSV parse used `split(',')`** and emitted garbage
   (`" pressure columns)\""`) because the file has quoted fields with embedded commas.
   That is precisely the hazard documented at `scripts/shared/data.mjs:117` — *"split(',')
   is not merely inelegant, it is wrong"* — and exactly the duplication I reported in
   `code-audit/02-dupes.md`. I switched to the shared `readCsv`.
2. **My first coverage probe keyed on a column `canonical_name`, which does not exist**
   in this schema; identity is `slug`. It silently returned 0 of 3 matches, which
   *looked like* "SAAMI covers none of our cartridges" — a wrong conclusion from a
   wrong key. Re-run against `slug`: 3 of 3.

Both were caught by reading the output rather than the exit code. Had I trusted the
first run of either, this report would have contained a confident falsehood.

---

## 6. What I did NOT do, and why

1. **No legal advice.** Where the terms are ambiguous — the CIP extract boundary, and
   whether SAAMI's "all rights reserved" footer defeats its own free drawings — I
   recorded the ambiguity and named who must resolve it. See `NOTES.md` N1, N2.
2. **No CIP dimension transcribed.** The prohibition, enforced and tested.
3. **No source file modified.** `data/`, `scripts/`, `apps/`, `package.json` untouched.
4. **No repair of other agents' work.** `cartridge-dimensions`' output-count mismatch
   and the stray `T5/` folder are reported in `NOTES.md` N4, N5, not fixed —
   `.clinerules` §1 makes them out of my write-set.
5. **No expansion of CIP coverage to a census.** Pointless while the licence forbids
   the use, and it would have meant asserting numbers I could not verify.
6. **I did not claim `roadmap-synthesis`.** It is also `highest`, but this one unblocks
   the 0/229 dimensional gap and that one plans work already queued.

---

## 7. Unresolved

Seven items in `NOTES.md`. Two need an owner decision and **no amount of research will
settle them**: whether SAAMI's free drawings are clear to republish (N1, 3 cartridges
plus the precedent), and where CIP's "extracts" boundary falls (N2, ~11 cartridges).

**N4 is the only item currently keeping a gate red** — `cartridge-dimensions` declares
4 outputs and has 7 files, so `check-mail` fails. Not mine to fix.

---

## 8. Gates

`npm run tasking:check` and `npm run verify` — results appended to my inbox STOP
message. Both were run after the folder move; see the message for the recorded output.

---

## 9. What I believe is wrong

**Two competent agents reached opposite conclusions on a licence question and neither
noticed, because "free to download" and "free to republish" are the same three words
in a different order.** The disagreement was not resolved by better research — the
research was fine. It was resolved by asking *which verb governs our deliverable*.

That generalises past licensing. This codebase repeatedly decides whether work is
possible by asking whether a source is "free", when the useful question is always
**"free to do what, and what exactly are we doing?"** The same confusion is why
`03-per-cartridge-verdict.csv` distinguishes `no-free-source` from `blocked-cip`: they
look identical from outside and need opposite responses.

**And the honest headline for the owner is a budget line, not a legal one.** 226 of 229
cartridges are blocked by **not having purchased the SAAMI standard**. If dimensional
coverage matters, that is a purchase decision. Only about 11 cartridges are blocked by
CIP's licence at all — and those need an approval request, not a lawyer.