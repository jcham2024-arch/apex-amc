# REPORT — cartridge-licence-reconciliation

**Agent:** 879ca · **Priority:** highest · **Status:** COMPLETE (5/5 outputs).
**Write-set:** `tasking/completed/cartridge-licence-reconciliation/` only.
**No CIP dimensional value is transcribed in any output.** Verified mechanically.

---

## 1. The answer

**The two tasks did not contradict each other. I was wrong, and it was my task.**

| | Question asked | Answer |
|---|---|---|
| `ammoseek-coverage` (mine) | Is there a **price** at the download? | No |
| `cartridge-dimensions` (T4) | Is there **permission** to reproduce? | No |

"Free to download" is about the cost of access. "Reproduction forbidden" is about
rights in the content. **I read the first as evidence about the second.** A
document can be free to obtain and forbidden to republish — which is exactly what
these sheets are.

My `03-priority-ranks.md` told the next agent *"There is no licence wall on this
task."* That sentence would have sent an agent to transcribe CIP dimensions into
our dataset. T4's reading is correct.

**The check I skipped:** I fetched `cip-bobp.org/index.php/en/tdcc` and never
fetched a per-cartridge sheet. **The notice is not on the index page.** It is
inside the PDFs.

## 2. What I verified, and how

### The notice, recovered verbatim

From `tab-i/7-62-x-39-en.pdf`, inflated and decoded locally:

> "Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."

### An 11-sheet survey I ran myself

| Result | Count |
|---|---|
| Notice present | **6** |
| Undetermined (no readable text layer) | **5** |
| **Readable but no notice** | **0** |

**The third row is the finding.** No sheet I could read lacked the notice. The 5
undetermined sheets are *unreadable*, not *cleared* — and treating "I could not
read it" as "no restriction" is the exact error T4 and I both made.

### Two bugs my own extractor had, in the permissive direction

1. **Literal match.** `includes('Reproduction')` reported the notice **absent on
   sheets that carry it** — CIP kerns it to `Reproduc tion forbidden as w e ll as
   in the form of ex trac ts`.
2. **Letter-ratio readability test.** Kerned page copy can have a *lower* letter
   ratio than a binary font blob, so my "no text layer" test misclassified
   notice-bearing sheets. Replaced with a dictionary-word test: 3 → 6 sheets.

Both errors made the data look **more** freely usable. T4 independently hit the
same trap and reported it; I hit it again, a week and a task later.

### No dimension transcribed

Generator asserts it: `any dimension recorded: no`. Every row's
`value_recorded_here` is `none`.

## 3. What I did NOT do, and why

- **No legal advice.** Nothing here says a use is lawful or unlawful. I recorded
  published text and locations, and wrote the questions that would resolve it.
- **No dimension transcribed** — barred by the brief; permission is the
  deliverable.
- **No source file touched.** `data/`, `scripts/`, `apps/` untouched.

## 4. What I found but did NOT touch

- **T4's `01-source-survey.md` §5 is wrong** on cartridge presence: *"There is no
  9mm, no 5.56 and no .22LR in the dataset."* 9mm and .22LR **are** present, as
  `9 Luger` and `.22 LR`. 5.56 is genuinely absent. Does not affect the licence
  question.
- **T4 stamped the same CIP blocker on all 229 rows** in
  `cartridge_dimensions_filled.csv`, including the ~218 with no CIP sheet at all.
  The blocker is real but over-applied — it implies a restriction that does not
  apply because no such sheet exists. Worth correcting so the column means
  something.
- **T4 recorded the sheet URL pattern as `tab-<n>`** (arabic). The real pattern is
  **`tab-i`** (Roman). Three of my first four probes 404'd on that basis.

## 5. What I believe

### The permissive answer is not available from published terms

There is **no reading of the published text** under which "we may transcribe CIP
dimensions into our dataset" is clearly true. The notice names *extracts*
specifically, and a column of dimensions selected from these sheets is an extract.
T4 was right.

### What is genuinely open, and worth asking

The cheapest outcome is that **a single cited value is not an "extract"** — which
would permit a citation layer and unblock the work at zero cost. That question is
drafted precisely in `02-licence-terms.md` §6. **Ask it first**: it is one email,
and a "yes" makes the whole dataset affordable. A "no" costs a purchase decision
instead.

### The permissions gap and the coverage gap are stacked, and only one is a permission problem

- **~11 of 229** have a CIP sheet → permission problem.
- **~218 of 229** have no free source at all → coverage problem, unaffected by any
  CIP ruling.

So even a favourable CIP answer leaves most of the dataset unsourced. **Do not
let the licence question be read as the whole blocker.**

### My earlier `ammoseek-coverage` outputs contain a wrong claim that is now superseded

`02-sourcing-plan.md` ("no licence wall") and `03-priority-ranks.md` (same claim)
are wrong about CIP. **This task's report supersedes them.** They remain on disk
as the record of what was believed at the time; that is the correct handling under
an append-only protocol, and correcting them in place would destroy the evidence
that the disagreement existed.

## 6. Unresolved

Needs a human or a lawyer — not an agent:

1. Whether a single cited value is an "extract". **Ask first.**
2. Whether internal-only use is reproduction.
3. Whether any research/non-commercial exception exists off-page.
4. Whether the paid Z299 terms differ from the free sheets'.

Blocked status is **not** claimed — permission *may* be obtainable; I could not
determine it from published terms, and I did not guess.