# KNOWLEDGE — handgun coaching app: feasibility and risk

**Task:** handgun-coaching-feasibility. **Start here.** Full detail in `06-feasibility-verdict.md`.

---

## The answer

> **Build the measurement half. Do not build the coaching half.**

The owner asked for real-time feedback on grip, trigger, and technique from a photo or video
of someone shooting. **The measurement is buildable. The advice is not, and should not be.**

## The three numbers that matter

| | |
|---|---|
| **131.6 ppi** | 48MP phone at 21 ft. A 3.0 in group spans 396 px — comfortably measurable. |
| **0.251 in** | The measurement floor. **Invariant** from 10 ft to 50 ft, and from 12MP to 108MP. |
| **0.25 %** | Probability any published fault-mapping accuracy figure exists. **None found.** |

## Why more megapixels buys nothing

The localisation error is dominated by the bullet hole itself:

```
group floor = 1.125 x hole_diameter = 1.125 x 0.223 in = 0.251 in
```

**ppi has cancelled out of the algebra.** You cannot localise a hole more precisely than the
hole is wide. This is not a hardware problem and cannot be bought, funded, or engineered away.

**Corollary worth remembering:** the obvious calculation — `pixels / target_width_inches` — gives
1196 ppi and is **wrong by ~9×**. It assumes the target fills the frame. At 21 ft a phone would
need a **572 mm** equivalent lens; it has 26 mm.

## Why the coaching half should not be built

Three independent findings, any one of which is sufficient:

1. **No validated mapping exists.** Every pattern in the canonical chart maps to 2–3 unrelated
   causes. **Not one pattern is unambiguous.** No source states a diagnostic accuracy, a
   false-positive rate, or a confidence percentage.
2. **The threshold does not exist.** `centreOfImpact` is the **mean of the shots taken**. For
   an offset to imply anything it must exceed that mean's own sampling noise — and
   `dispersion.ts` does not compute that noise. Any threshold rule fires on noise.
3. **A named instructor rejects the whole premise.** Patrick Henry, Aegis Academy: reading a
   group to diagnose a fault is *"like looking at an image of golf ball impacts and trying to
   diagnose a swing issue."*

## The good news nobody expected

**Neither app store prohibits this app.**

- **Google Play** regulates the **sale** and **manufacture instructions** of firearms. Not
  depiction, not analysis. Verbatim in `04-`.
- **Apple §1.1.3** targets *"depictions that encourage illegal or reckless use... or facilitate
  the purchase of firearms or ammunition."* A range app does neither. The real risk is §2.3.8
  on **store screenshots**, not function.

**And a decisive design win:** Apple states *"Data that is processed only on device is not
'collected' and does not need to be disclosed."* **Never uploading the image takes it out of
the privacy regime entirely.** On-device-only is the cheapest correct architecture, not a
constraint.

## The trap that inverts advice

**Handedness.** The canonical chart: *"For left-handed shooters, reverse the groups."*

An engine that ignores this tells a left-handed shooter **the exact opposite of the truth** —
not a vague imprecision, an inverted instruction about handling a gun. Handedness and eye
dominance must be **asked, never inferred**, stored with every result, and re-applied before
any screenshot is shared. Crossed dominance is unhandled by the chart entirely, and matters:
56.5% qualification vs 86.1% (Jones et al. 1996, n=308, p = .000).

## What to build instead

A measurement tool that **declines to diagnose**:

1. Photo + printed calibration grid → homography → inches. **Abort if it does not fit.**
2. Feed the existing `dispersion.ts`, unmodified — `poi`, `sigma`, `cep50`, `extremeSpread`,
   flyers.
3. **Show the measurement and its uncertainty. Say nothing about cause.**
4. Offer **cant** — the one fault a photograph genuinely shows, because the target's ellipse
   shows it.
5. *"This pattern is consistent with X, and also with Y."*
6. Surface the removed flyer; never silently shrink a group.

## What will not work

- **Steel.** No high-contrast edge; specular reflection. Thresholding fails where measurement
  is most valued. Needs a different detector class.
- **Overlapping holes** — one connected component, so **tight groups are under-counted**. This
  is where classical CV fails worst, and where a shooter most wants help.
- **Real-time technique feedback.** Timing faults (anticipation, follow-through, snatching) have
  no time axis in a static target. And video is the most privacy-sensitive version.
- **Anything server-side.** Breaks offline, fails at a range with poor signal, uploads images of
  a person with a firearm to a third party.

## Before anything ships

- **Get a lawyer.** Whether technique coaching is licensable is jurisdiction-specific and
  **I could not establish it** (`05-` §6). It is EMPTY, not benign.
- **Read** `tasking/completed/shot-group-taxonomy/REPORT.md` — the safety case against the
  advice feature lives there, not here.