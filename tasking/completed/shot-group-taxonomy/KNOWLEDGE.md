# KNOWLEDGE — what a future feature owner needs to know

**Task:** `shot-group-taxonomy`. One page. If you read nothing else, read this.

---

## The one thing

**Do not build "shot-group diagnosis" that names a shooter fault from a target photo.**

Not because it is risky-sounding, but because a named instructor — Patrick Henry, Aegis
Academy staff — writes that the artifact this idea is built on is *"the most misused tool in
the training industry"*, and that

> *"It would be like looking at an image of golf ball impacts and trying to diagnose a swing
> issue."*

And the underlying statistics do not exist. Across every source retrieved for this task:
**no diagnostic accuracy, no false-positive rate, no minimum shot count, and not one
confidence percentage.** Every one of those cells is `not stated`, and they are left blank
because a blank makes a reader careful and a number does not.

## What the evidence actually supports

**Safe to say, because these are measurements `dispersion.ts` already makes correctly:**
group size, `sigma`, `cep50`, `extremeSpread`, and which axis a group is elongated on.

**Defensible as a fault, because the photo shows it:** **cant** — the target's own ellipse
records it. This is the only one.

**Safe to say, with the ambiguity attached:** the group is displaced from the aim point. Then
say *why that is not a fault*: it is equally consistent with a mechanical zero offset, an
ammunition change, or a shooter change, and `dispersion.ts` has no record of where the gun was
sighted in.

## What you must not say

| Never | Because |
|---|---|
| "Your trigger pull is jerking" | A diagnosis stated as fact. No source supports it. |
| "This is a sight alignment problem" | **A sight picture is not in a target photograph** — yet the canonical chart lists it for four patterns. |
| "You're anticipating recoil" | A *timing* fault. A static target has no time axis. |
| "Your group is too large, work on fundamentals" | Group size is mechanical or multi-fault. Two sources say so; `data/seeds/regulations.csv` makes it a YMYL exposure. |
| Any confidence percentage | None exists. Inventing one is the failure this repo's rules exist to prevent. |

## The trap that will bite the implementation

`centreOfImpact` returns the **mean of the shots taken**. So a "high group" describes the
centre of *those shots*, not a fault's mean. Before any threshold rule fires
(`poi.y > t ⇒ vertical fault`), `t` must be expressed in units of the group's **own standard
error** — otherwise the rule fires on sampling noise. `dispersion.ts` does not compute that
standard error today, and no source states a threshold. **This is the gap most likely to
produce confident nonsense.**

## If you build it anyway

1. **Ask handedness and eye dominance first.** The canonical chart is explicitly conditional:
   *"The following groups assume a right handed, right eye dominant shooter."* Mirror for
   left-handers. It says nothing about crossed dominance, where a right-handed shooter is
   left-eye dominant — and Jones et al. (1996, n=308) found those shooters qualified at
   **56.5% vs 86.1%** (p = .000).
2. **Surface, never assert.** Match Henry's own construction: *"This pattern is consistent
   with X, and also with Y; Z is a common cause."*
3. **Say "more than one thing."** Henry: *"Typically, there is more than one error
   contributing."*
4. **Never let `detectFlyer` silently shrink a group** — its own source comment requires the
   removed shot be shown and the shooter decide. Hold every claim to the same standard.
5. **Do not report group size as skill**, ever.

## Where the detail is

`01-fault-taxonomy.md` (patterns, faults, confidence, evidence quality) ·
`02-instructor-sources.md` (sources by tier, failures recorded) ·
`03-mapping-to-measurements.csv` (17 rows, every quantity traceable to `dispersion.ts`) ·
`04-rebuttals-and-exceptions.md` (the case against, in full) ·
`REPORT.md` (verification and negative test)