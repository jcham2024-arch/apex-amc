# REPORT — shot-group-taxonomy

**Task:** `tasking/in-progress/shot-group-taxonomy/`. **Agent:** scout-research sub-agent.
**Scope:** research only. `packages/`, `apps/`, `data/`, `scripts/` and `package.json` were
read, never written. **No coaching advice is given and no shooter is assessed.**

## The headline

> **The feature as briefed cannot be built honestly, and the reason is not conservatism —
> it is that a named instructor whose name is on the Aegis Academy staff says the central
> artifact behind this idea should not be used to diagnose a shooter.**

The taxonomy was compiled as asked, in full, in `01-` and `03-`. But every pattern in the
canonical chart maps to **two or three unrelated faults**, **not one pattern is unambiguous**,
**no source supplies a diagnostic accuracy or false-positive rate**, and Patrick Henry argues
the entire exercise *"is like looking at an image of golf ball impacts and trying to diagnose
a swing issue."*

So the deliverables are both the mapping **and** the case against it. `04-` is not a caveat.

## 1. What changed

Five files, all inside this task folder. No main-tree file touched, no copies staged — the
work is additive research.

| File | Contents |
|---|---|
| `01-fault-taxonomy.md` | 10 chart patterns + 8 named faults, each with confidence; the instructor disagreement; evidence quality |
| `02-instructor-sources.md` | 4 tiers — named instructors, industry material, reposts, peer-reviewed — plus failed retrievals |
| `03-mapping-to-measurements.csv` | 17 rows × 7 cols, every quantity traceable to `dispersion.ts` |
| `04-rebuttals-and-exceptions.md` | Alternative explanations, instructor disagreement quoted, what a photo cannot show |
| `KNOWLEDGE.md` | The reusable finding, for a future feature owner |

## 2. What I verified and how

```
$ node tmp/sgt-check.mjs 03-mapping-to-measurements.csv
header columns : 7
data rows      : 17
ragged rows    : 0
quantities not traceable to dispersion.ts: 0
confidence = not stated : 16 of 17
confidence = EMPTY      : 0
confidence = a bare %   : 0 (must be 0 -- unsourced numbers are forbidden)
rows with no source     : 0
rows asserting a diagnosis: 0 (must be 0)
expected mappings: 11 | present: 11
BOM present  : false      CRLF pairs : 0      lone CR : 0
CSV CHECK PASSED                                        CHECK_EXIT=0
```

### Negative test — 7 cases, all observed failing

```
$ node tmp/sgt-negative.mjs tasking/in-progress/shot-group-taxonomy
PASS  control: untouched deliverables: exit 0, expected 0
PASS  unsourced numeric confidence: exit 1, expected 1
        FAIL: 1 row(s) carry an unsourced numeric confidence
PASS  diagnosis asserted as certainty: exit 1, expected 1
        FAIL: 1 row(s) phrase a diagnosis as a certainty
PASS  quantity not in dispersion.ts: exit 1, expected 1
        FAIL: row 5: measurable_quantity "barrel_timestamp" not traceable to dispersion.ts
PASS  required column dropped from header: exit 1, expected 1
        FAIL: missing required column: conflicting_causes
PASS  one mapping row silently dropped: exit 1, expected 1
        FAIL: mapping(s) missing from the table: Group centred high and right
PASS  ragged row: exit 1, expected 1
        FAIL: ragged row 4: 4 fields, expected 7
PASS  table gutted to a token row: exit 1, expected 1
        FAIL: only 1 rows -- too few to be a real mapping

NEGATIVE TEST HOLDS: control passes, every broken variant is rejected.
NEG_EXIT=0
```

**Two of my own checks were wrong before they were right, and both are worth recording.**

1. **The traceability check failed all 12 valid rows.** The CSV writes `poi_vertical_offset`;
   `dispersion.ts` declares `poi.y`. Comparing raw strings rejected correct data. Fixed by
   normalising both sides to a canonical token. **The check was wrong, not the CSV** — the
   same class of error as the G1/G7 rule in the exterior-ballistics task, and the reason the
   rule lives in a comment next to the fix.
2. **The "dropped row" case passed for the wrong reason.** My first version deleted a data
   *row* and called it a column test; it only exited 1 because the row-count rule noticed.
   A passing test that fires for an unrelated reason proves nothing, so the case was split
   into a true column-drop and a true row-drop, and a **new** expected-signature rule was
   added — deleting one mapping row is otherwise undetectable, because the remaining table is
   perfectly well-formed.

### Encoding

All five deliverables: LF only, no BOM, no lone CR. Verified by re-reading bytes with
absolute paths — a relative path resolved against the wrong working tree on the first
attempt and read a **different repository**, the trap `AGENTS.md` already records.

### Source retrieval

The canonical chart was extracted with this repo's own `npm run probe:pdf` after a direct
fetch returned binary. **Four other sources failed** (HTTP 403/404) and one PDF could not be
decoded (`Tj literals: 0`, `hex Tj: 0`). All recorded in `02-instructor-sources.md`; none is
## 3. Mandatory negative test — the three required items

**(a) One pattern with instructor disagreement, quoted.** Full quotes in
`04-rebuttals-and-exceptions.md` §3. The core of it:

> Patrick Henry, Aegis Academy, on pistol correction charts: *"**If you didn't make the pistol
> correction chart, that chart is not universally applicable to you.** It might be that
> error, or any other number of combinations of errors that is causing you to miss the center
> of the target."*

> W.H. Fuller, *Small-bore Target Shooting* (1963): *"The diagram covers faults that are most
> likely to be made by the marksman, but **similar departures can be produced by faults in the
> rifle or in the ammunition or in both.**"*

This is not a disagreement about one pattern. **Henry and Fuller disagree with the premise of
the whole exercise**, while the chart that this task was asked to reproduce presents the same
mapping as usable. Fuller also supplies the statistical argument: causes must be considered
*"casual"*, and *"elaborate records do not give any better diagnosis than rough guides."*

**(b) One fault I could NOT source, left EMPTY.** Five, in fact. The one the brief asks for:

> **Diagnostic accuracy of a POI-offset → named-fault mapping: EMPTY (`not stated`).**
> False-positive rate: **EMPTY**. Minimum shots for a meaningful offset: **EMPTY**. POI
> direction for crossed-dominance shooters: **EMPTY**. Any confidence percentage: **EMPTY**.

**No source in the entire task supplies one.** Per `.clinerules` §5 rule 1 these are blank, not
guessed. The brief's own reasoning applies directly: *"A fabricated 87% is worse than a blank,
because a blank prompts the reader to be careful and a number does not."* The CSV reflects
this — **16 of 17 rows read `not stated`, and the 17th is the one real statistic in the task**
(86.1% vs 56.5%, Jones et al. 1996), which is about **qualification score**, not POI direction.

**(c) Self-check: no staged file phrases a diagnosis as a certainty.**

```
$ Select-String ... -Pattern '\byou (are|have|were)\b|\byour [a-z]+ (is|are) (jerking|...)|the cause is'
02-instructor-sources.md:54:  - *"Group analysis allows you to determine what you are doing wrong..."
04-rebuttals-and-exceptions.md:55: > "**A coach should not be looking at the impact of your bullets..."

=== empty above = no certainty language ===
## 4. What I found but did NOT touch

1. **The brief's measurable vocabulary does not match `dispersion.ts`.** The brief lists
   "group width, group height, ... aspect ratio, and flyer count" as quantities that exist.
   Checked against the source: `Dispersion` exposes `poi`, `n`, `sigma.{x,y}`, `cep50`,
   `cep90`, `extremeSpread`, `meanRadius`. **`aspect`, `width` and `height` appear nowhere in
   the file** — they are *derivable* from `sigma`, but nothing computes them. Every row in
   `03-` therefore names its quantity as `poi.x`, `poi.y`, `sigma.x`, `sigma.y`,
   `extremeSpread` or `flyer`, and the two aspect-ratio rows are marked
   *"derived from dispersion.ts"* rather than pretending a field exists. **The brief's
   Definition of Done — "every measurable quantity in `03-*.csv` exists in `dispersion.ts`" —
   is unsatisfiable as literally written.** Recorded rather than worked around.
2. **`tasking:check` remains broken** for all completed tasks (manifest map built from
   `pending/` only). Reported in `tasking/completed/exterior-ballistics/NOTES.md`; `scripts/`
   is outside this write-set.
3. **`npm run verify` fails only on that gate.** All 19 other stages pass. Not caused here.
4. **`cartridge-dimensions` was present in both `pending/` and `completed/` while I worked** —
   another agent mid-move. I did not touch it.
5. **Four source URLs in circulation return 403/404** and one 4-H PDF will not decode. Listed
   in `02-` so nobody re-tries them expecting different results.

## 5. What I believe is wrong — including out of scope

- **The feature's premise is weaker than the brief assumes, and the brief's own mandatory
  deliverable proves it.** `04-` is not filler: Henry's argument is that the artifact is
  *"the most misused tool in the training industry."* Building "shot-group diagnosis" around
  the chart would ship the most-cited artifact in the field as if it were validated, while the
  one instructor writing about it publicly says it does not work that way.
- **The quantitative hole is real and specific.** `centreOfImpact` returns the **mean of the
  shots taken**. Any rule "`poi.y` > threshold ⇒ vertical fault" must threshold against the
  group's own standard error, or it fires on sampling noise. `dispersion.ts` does not compute
  the standard error of the centre, and **no source states such a threshold.** This is the
  single gap most likely to produce confident nonsense.
- **Sight alignment is the most-used and least-supportable cause in the chart** — listed for
  four patterns, and **a sight picture is not in the photograph.**
- **Timing faults are undetectable by construction.** Anticipation, follow-through and
  snatching are all *when* errors; a static target records only *where*.
- **Cant is the one fault a photo genuinely supports**, because the target's own ellipse shows
## 6. Definition of Done

| Requirement | Status |
|---|---|
| Changes only under this task folder | **YES** — `git status --porcelain -- packages data scripts apps package.json` returns empty. |
| `npm run verify` exits 0 | **NO — blocked by the `tasking:check` gate bug** (§4.2). Not caused by this task; all 19 other stages pass. |
| Every fault has ≥1 named, credentialed source | **PARTIAL — stated plainly.** The mechanism names come from Aegis (named instructor) and Target Shooting Canada (**author not named**, © 2003). Fuller supplies the counter-argument. **No fault has a source supplying a statistic**, because none exists. |
| Every quantity in `03-*.csv` exists in `dispersion.ts` | **YES**, verified mechanically (0 untraceable of 17 rows) — using the real field names, since the brief's list includes three that are derived rather than present (§4.1). |
| `04-*.md` non-trivial | **YES** — 7 sections, the longest deliverable, carrying the task's main finding. |
| Instructor disagreement, quoted | **YES** — §3 above and `04-` §3. |
| A fault left EMPTY | **YES** — five, §3(b) above. |
| Self-check: no diagnosis as certainty | **YES** — §3(c), with the CSV check enforcing it. |

## 7. Item 4 as the brief asks it: how much is supportable from a photo?

**Stated plainly, as required.**

**Supportable:**
- That a group is **large or small**, and its `sigma`, `cep50`, `extremeSpread`. These are
  measurements, and `dispersion.ts` computes them correctly.
- That a group is **elongated on one axis** — as a *description*.
- **Cant**, because the target's ellipse shows it. The only fault visible in the input.
- That the group is **displaced from the aim point** — as a description, with the ambiguity
  in §4 of `04-` stated alongside it.

**Not supportable, and would produce confident nonsense:**
- Any **named fault** from a POI direction. No pattern is unambiguous; each maps to 2–3
  unrelated mechanisms; no source gives an accuracy or false-positive rate.
- **Sight alignment** — not in the photograph, yet listed for four patterns.
- **Timing** faults (anticipation, follow-through, snatching) — a static target has no time axis.
- **Habit vs one-off**, from a single string.
- **Causation at all** without knowing handedness, dominance, and where the gun was sighted in.

**The defensible product, if one is wanted:** describe the group honestly, offer the cant
observation, ask the user about handedness and dominance, and say plainly that several
mechanical causes produce the same picture. **Do not name a fault.** That is close to what
Henry says a coach should do — *"He or she should be looking at you"* — and it is what the
evidence will actually carry.
  it. If any fault gets surfaced, that is the defensible candidate — and even it is ambiguous
  with hand position.
- **Group size must never be reported as skill.** Two sources contradict that reading, and
  under `data/seeds/regulations.csv`'s YMYL rules it is a compliance exposure, not a style
  choice.
- **The chart's author is unnamed.** The most-copied artifact in this field carries only a
  2003 copyright line. Combined with no supporting data, that is the weakest possible
  provenance for advice aimed at people.
```

**Two matches, and both are inside quoted source material being criticised** — not my own
voice. The CSV check enforces this mechanically: `rows asserting a diagnosis: 0`, and negative
case 2 proves the check fires on *"your trigger pull is jerking."*
cited as support.