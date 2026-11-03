# 04 — Rebuttals and exceptions

**Task:** `shot-group-taxonomy`. The brief calls this "the part everyone skips and that
decides whether this feature is honest."

**This file is not a disclaimer bolted onto the research. It is the research's main result.**
If the exceptions below are correct, then the feature as briefed cannot be built honestly, and
that is more useful to the planner than a table of mappings.

---

## 1. A pattern with many causes — and the chart admits it

Every one of the ten chart entries lists **two or three unrelated mechanisms** for the same
observable POI position. Worked examples:

| Observable | Chart's own candidate causes |
|---|---|
| High centre | heeling · wrist break-up · front sight too high |
| Right | thumb pressure · sight alignment off right |
| Low-left | trigger push · sight alignment off left · fingertip/pinky pressure |

A pattern that maps to three unrelated faults does not identify a fault. It narrows nothing.
**Low-left is the clearest case:** the chart itself lists canting as one cause, and canting
produces a *vertical* low signature too — so the same underlying physical action appears in
two different chart cells.

## 2. Cant, trigger, dominance and sight alignment all produce the same observable

The brief asks specifically about these four. Combined:

- **Cant** (the brief's example) produces an apparent vertical shift — and by rotation also a
  horizontal one. It is listed under low-left on the chart.
- **Crooked trigger pull** appears under left, low-left and low-right on the chart — three
  different cells for one behaviour, differing only in direction.
- **Dominant eye** changes the mapping entirely. The chart's own caveat: *"The following
## 3. Where instructors disagree — quoted

This is the mandatory negative test, and it is not a marginal disagreement.

**Patrick Henry, Aegis Academy** (instructor, staff author; full citations in
`02-instructor-sources.md`), on pistol correction charts — the artifact this research was
commissioned to reproduce:

> "Pistol Correction Charts (Also Known and Common Error Charts) are the probably the most
> misused tool in the training industry."

> "**If you didn't make the pistol correction chart, that chart is not universally applicable
> to you.** It might be that error, or any other number of combinations of errors that is
> causing you to miss the center of the target."

> "There are certainly trends that can be identified, but they are designed to help diagnose
> **trends, not individual shots** and are far from universally applicable."

> "**A coach should not be looking at the impact of your bullets to tell you what you are
> doing wrong. He or she should be looking at you!**"

> "Without actually observing the technique in practice, it is impossible to accurately assess
> the fault and provide effective corrective actions. **It would be like looking at an image of
> golf ball impacts and trying to diagnose a swing issue.**"

**W.H. Fuller**, *Small-bore Target Shooting* (1963) — rifle, and the most rigorous statement
of the inference problem available:

> "Although the reasons for inaccuracies may be causal, they have to be considered as
> **casual**, because there is little to be recognised to account for the departures from
> accuracy and almost nothing that can be done to correct the apparent errors."

> "The diagram covers faults that are most likely to be made by the marksman, but **similar
> departures can be produced by faults in the rifle or in the ammunition or in both.**"

> "**Elaborate records do not give any better diagnosis than rough guides.**"

**The disagreement is about the entire premise.** The chart treats POI→fault as a usable
diagnostic. Henry says a target photo cannot diagnose an individual, and that the person who
## 4. What cannot be determined from a photo at all

This list is the operational limit, and it is long:

- **Sight alignment** — the sight picture does not exist in a target photo. Yet it is listed as
  a cause for four chart patterns.
- **Timing of the fault.** Anticipation ("riding recoil"), follow-through drop, and snatching
  are all *when* errors. A static target records only *where*. Henry names anticipation
  explicitly; the chart names follow-through and snatching.
- **Grip pressure.** Too much and too little both push the barrel, in different directions.
- **Trigger finger placement.** Aegis: *"usually too much or too little on the trigger which
  pushes the barrel inward or outward"* — the direction depends on which, and the photo gives
  no way to tell.
- **Whether a fault is habitual or a one-off.** Henry: *"everyone has bad shots from time to
  time, which are outside their personal norms."* A single string cannot separate habit from
  noise.
- **Cause vs offset.** A group displaced from the aim point is equally consistent with a
  mechanical zero offset, an ammunition change, or a shooter change. `dispersion.ts` measures
  `poi` in inches from the aim point and has **no reference** for where the gun was sighted in.
- **Handedness and eye dominance**, unless the user is asked. The chart is explicitly
  handedness- and dominance-conditional and supplies no way to detect either.

## 5. The quantitative problem: a POI offset is not evidence of a constant fault

This is the part that decides the feature, and it follows from `dispersion.ts` itself.

`centreOfImpact` returns the **mean of the observed shots**. So a "high group" is a statement
about the *centre of the shots taken*, not about the shooter's intent or a fault's mean. For
that offset to imply a fault it must be **larger than the sampling noise of the centre** —
which depends on group size and shot count, and is not computed by `dispersion.ts`.

A group with a large `sigma` can drift its centre substantially on a small `n` with no change
in technique whatsoever. **Any rule of the form "if `poi.y` > threshold then vertical fault"
must state that threshold in units of the group's own standard error, or it will fire on
noise.** No source I found states such a threshold, and I have left it **EMPTY** rather than
inventing one — this is the single most important gap if the feature proceeds.

`dispersion.ts` is also careful elsewhere in a way a diagnosis layer would have to be: its
`detectFlyer` comment says it *"must never silently reduce a group"* and that callers
*"must surface the removed shot and let the shooter decide."* The same discipline applies to
every claim in `03-mapping-to-measurements.csv`.

## 6. Group size is not skill

No source states group size is a marksmanship deficit; two contradict it:

- Fuller: *"it is known that the marksman is not as yet, the weakest link in the chain"*, and
  that rifle and ammunition *"will produce groups of specific size and shape."*
- Henry: a large group reflects *"more than one error contributing"*, in grip, trigger, stance.

**A large group is mechanical or multi-fault. Reporting it as poor shooting would be both
wrong and insulting, and `data/seeds/regulations.csv`'s YMYL rules make that a compliance
problem, not a style question.**

## 7. What I could not source — EMPTY, not guessed

| Question | Value |
|---|---|
| Diagnostic accuracy of POI→fault mapping | **EMPTY** — `not stated` in every source |
| False-positive rate | **EMPTY** — `not stated` |
| Minimum shots for a POI offset to be meaningful | **EMPTY** — `not stated`; see §5 |
| POI offset direction for crossed-dominance shooters | **EMPTY** — Jones et al. give qualification scores only |
| Any confidence percentage for any fault | **EMPTY** — no source states one |

**No number in this task's deliverables is invented.** Every blank above is a blank because
the literature does not fill it.
*can* diagnose is the coach who watched you shoot. Fuller says the direction may not even be a
shooter property, and that more data does not help.
  groups assume a right handed, right eye dominant shooter. For left-handed shooters, reverse
  the groups."* Reverse the groups is a crude correction for handedness; **it does not address
  crossed dominance at all**, where a right-handed shooter is left-eye dominant.
- **Poor sight alignment** is listed as a cause for high-centre, low-centre, right *and*
  low-left — four cells — **and a sight picture is not present in a target photograph.**

So at least four distinct physical causes, one of which is literally unobservable in the input
the app would analyse, converge on the same small set of POI offsets.