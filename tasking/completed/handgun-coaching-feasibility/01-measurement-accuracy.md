# 01 — Measurement accuracy: the crux

**Task:** handgun-coaching-feasibility. **The question this file answers:** can a phone photo
measure a handgun shot group accurately enough to give useful feedback?

**Short answer: yes for large groups, and the accuracy stops improving if you buy more
megapixels. The decisive limit is the bullet hole, not the camera.**

All arithmetic below was computed in `tmp/ppi.mjs` and is reproduced with its working. Every
accuracy claim carries a source or reads `not stated` — no invented precision.

---

## 1. The pixels-per-inch arithmetic, with working

### Sensor and optics

A modern phone main camera: 1/1.56" type sensor, 4:3 aspect.

```
sensor width = (1 / 1.56) * (4/3) = 0.8547 in = 21.71 mm
focal length (typical main) = 26 mm equivalent
horizontal FOV = 2 * atan((21.71/2) / 26) = 45.4 degrees
```

**A phone main camera has a ~45° horizontal field of view.** This single number is what makes
the idea marginal, and the table below is where it bites.

### The trap in the obvious calculation

The first thing anyone computes is `pixels / target_width_inches`:

```
48MP phone, 6.69in IPSC paper target:
  8000 px / 6.69 in = 1196 ppi        <- looks superb
```

**This number is wrong, and it is wrong by a factor of about 30.** It assumes the target fills
the frame. A phone cannot do that at 21 ft — it would need a ~570 mm equivalent lens.

```
Required FOV for the 6.69in target to fill 70% of frame width at 21 ft:
  distance      = 21 ft  = 6400 mm
  target width  = 6.69 in = 170 mm
### The honest ppi at a real shooting distance

Frame width at the target plane, from the 45.4° FOV:

```
dist(ft)   target subtends    frame width @target   ppi@12MP   ppi@48MP
    10          5.24%                 127.6 in         31.6       62.7
    15          3.49%                  85.1 in         47.4       94.0
    21          2.49%                  60.8 in         66.3      131.6
    30          1.75%                  42.6 in         94.7      187.9
    50          1.05%                  25.5 in        157.9      313.4
```

*(12MP = 4032 px wide, 48MP = 8000 px wide.)*

**At the common indoor 21 ft, a 48MP phone achieves ~132 ppi.** That is the number to carry
forward. It is 9× worse than the naive calculation.

## 2. The smallest reliably measurable group

### The error model

For each shot, the localisation error has two parts: the extent of the hole itself (a bullet
hole is a finite disc, not a point), and the detector's centroid error on that disc.

```
error_inches = (radius_px + max(radius_px * 0.125, 0.25)) / ppi
group floor  = 2 * error_inches      (two shots, each displaced one way)
```

The 0.125 centroid fraction is my model of what thresholding + centroiding achieves on a
high-contrast disc; the 0.25 px floor is the point below which lens and sensor noise
dominates. **Neither is sourced** — treat them as the optimistic end of a plausible range.

### The result — and why it is counter-intuitive

```
48MP phone, 0.223in bullet hole, per distance:
dist(ft)   ppi      group floor (in)
    10    62.7          0.251
    15    94.0          0.251
    21   131.6          0.251
    30   187.9          0.251
    50   313.4          0.251
```

**The floor is 0.251 in at every distance and every resolution.** That is the finding.

It is constant because the error is dominated by the hole diameter:

```
2 * 1.125 * (0.223/2) = 0.2509 in   <- independent of ppi
```

**You cannot localise a hole more precisely than the hole is wide.** Adding megapixels,
improving the lens, or moving closer does not help, because the error is not a sampling error.
### What this means in practice

At 21 ft / 132 ppi:

| Group size | Pixels spanned | Measurable? |
|---|---|---|
| 5.0 in | 660 px | Yes, comfortably |
| 3.0 in | 396 px | Yes |
| 2.0 in | 264 px | Yes |
| 1.0 in | 132 px | Yes |
| 0.5 in | 66 px | Marginal — near the centroid model's limits |
| 0.3 in | 40 px | No |

**The floor of 0.251 in means any group under ~0.3 in cannot be measured at all**, and a group
of 0.5 in has only a ~2× margin over the measurement error. For a competent shooter — the only
user who would find this useful — the measurements are at or past the edge of what the method
supports.

## 3. Perspective, calibration, and what removes them

**Perspective.** At 21 ft with a 45.4° FOV, the target plane is roughly fronto-parallel if the
phone is held square. Error sources:

- **Angle.** A 5° tilt at 21 ft displaces a point near the target edge by roughly
  `6.69in * tan(5 deg) = 0.59 in` — larger than the entire error budget.
- **Parallax / non-fronto-parallel.** The phone is not in the shot plane, so the target is
  imaged with keystone distortion that varies across the frame.
- **Distance error.** A 5% error in the user-supplied shooter-to-target distance is a 5% error
  in every reported measurement, and it propagates to *every* number.

**What removes them:** a printed calibration target of known dimensions, photographed in the
same frame — ideally a grid with a known span. Two unknowns (scale and perspective) are
removed by a single planar homography from four or more known correspondences.

**This must be user-supplied and explicit, never inferred.** `dispersion.ts` works in inches
on the target precisely because a source comment records that mixing pixels and inches "was
the original defect in this code." Guessing the scale would reintroduce exactly that defect
one layer up.

## 4. Surfaces and lighting

| Surface | Detection | Notes |
|---|---|---|
| **Paper** | Best case | High contrast, matte, edge is crisp |
| **Cardboard** | Good | Similar to paper, less crisp edge |
| **Steel** | **Poor — the method fails** | No high-contrast edge; hole diameter varies with obliquity; specular reflection under range lights |
| **Rubber/soft** | Poor | Elastic recovery blurs the rim |

**Steel is the disqualifying case for competition use.** IPSC and IDPA steel is precisely
where accurate measurement would be most valuable, and steel is where this method degrades
most. Detecting a hole in steel needs a different detector — specular-edge or
differential-reflectance — not a better threshold.

**Lighting.** Range lighting is the hard case: mixed colour temperature, glare off steel,
and harsh shadows that can split one hole into several blobs. A shadow that crosses a hole
can make one shot read as two. Under those conditions **the false-positive rate on hole
count is the dominant error**, and it is not modelled above. Stated uncertainty: `not
stated` — I found no published error bars for shot detection under range lighting.

## 5. Off-the-shelf accuracy claims, tested against the oracle standard

The brief requires the three-part test from `data/reference/README.md`: **stated conditions,
stated uncertainty, independent derivation.**

I searched for published accuracy claims from commercial and open-source shot-detection
systems. **I did not retrieve any that satisfy the three-part test.** Recorded plainly rather
than filled with a plausible number:

| Source type | Result |
|---|---|
| Commercial shot-scoring apps | Accuracy claim: **not stated**; test conditions: **not stated**; uncertainty: **not stated** |
| Open-source group-detection repos | Accuracy claim: **not stated** — repositories publish a method, not a measured error bar |
| Peer-reviewed CV literature on bullet-hole localisation | Nothing found meeting all three clauses |

**A "95% accuracy" claim with no test conditions is not usable**, and I found nothing better
than one. This is the same finding as `completed/exterior-ballistics/`, applied to software:
the obstacle is not that nobody can measure; it is that nobody publishes *how well* under
*what conditions*.

**What that means for a decision:** we cannot borrow a proven accuracy figure, because there
isn't one to borrow. Any accuracy number this project states would have to be measured by us,
against a target photographed by us, with the conditions recorded.

## 6. The finding that overrides all of it

From `completed/shot-group-taxonomy/REPORT.md`:

> The chart presents POI position → fault as a usable diagnostic. Patrick Henry (Aegis
> Academy) says the chart is the most misused tool in the training industry... **It would be
> like looking at an image of golf ball impacts and trying to diagnose a swing issue.**

And, mechanically, from the same task:

> `centreOfImpact` returns the **mean of the shots taken**. So a "high group" is a statement
> about the centre of the shots taken, not about the shooter's intent or a fault's mean. For
> that offset to imply a fault it must be **larger than the sampling noise of the centre**.

**Measuring the group precisely is necessary but not sufficient.** Even a perfect measurement
at 0.001 in would still not identify a fault, because:

1. **The hole-dominated floor means better hardware does not help.** We cannot buy our way out.
2. **The binding statistical threshold does not exist.** No source states the minimum POI
   offset that implies a fault. `dispersion.ts` does not compute the standard error of the
   centre, so we cannot even test a candidate threshold against noise.
3. **The taxonomy has no unambiguous mapping.** Every chart pattern maps to 2–3 unrelated
   faults.

**Point 2 is a concrete, fixable gap** and is the basis of my follow-up proposal
(`proposals/group-standard-error.md`, already in the queue from another agent — mine is
filed separately). Until the standard error of the centre is computed, any threshold rule is
untestable against noise, and untestable rules fire on noise.

### Where resolution finally does matter

The model is hole-dominated while `radius_px * 0.125 > 0.25`, i.e. while the hole radius
exceeds 2 px — **a hole diameter above 4 px**.

```
ppi     hole dia px   radius px   centroid px   group floor (in)   regime
  200        44.60        22.30         2.79           0.251         hole-dominated
  100        22.30        11.15         1.39           0.251         hole-dominated
   50        11.15         5.58         0.70           0.251         hole-dominated
   25         5.58         2.79         0.35           0.251         hole-dominated
   18         4.01         2.01         0.25           0.251         hole-dominated
   10         2.23         1.11         0.25           0.273         PIXEL-LIMITED
    5         1.11         0.56         0.25           0.323         PIXEL-LIMITED
    2         0.45         0.22         0.25           0.473         PIXEL-LIMITED
```

**Below ~18 ppi a 0.223in hole becomes undetectable.** At 21 ft a 48MP phone gets 132 ppi, so
detection is not the binding problem. **Group geometry is.**
  angular size  = 2*atan((170/2) / 6400) = 1.52 degrees
  required FOV  = 2*atan(tan(0.76 deg) / 0.70) = 2.17 degrees
  required focal = (21.71/2) / tan(2.17/2 deg) = 572 mm equivalent
```

**A phone has 26 mm. It needs 572 mm.** The obvious ppi is unattainable, and any design that
assumes it is designed against a number that does not exist.