# 02 — Target scale conventions

**Task:** handgun-coaching-feasibility. **The units problem**, and the trap that inverts a
shooter's advice if it is got wrong.

## 1. Why `dispersion.ts` deliberately works in inches

The file's own header comment records the reason, and it is a trap this feature must not
reintroduce one layer up:

> A `Shot` is a point in *inches* on the target, measured from the aim point. The caller
> converts pixels to inches; **nothing here takes a pixels-per-inch factor, because mixing the
> two silently was the original defect in this code.**

So the conversion boundary is already correctly placed: `dispersion()` receives inches and
never sees pixels. **A vision layer sits above it and must convert.**

## 2. The conversion, and why it must be explicit

```
inches_on_target = (pixel_x - origin_x) / ppi_measured
```

`ppi_measured` must come from a **calibration object in the same photograph** — never from
the target's nominal size, never from the camera spec, and never from a guess. Three reasons:

1. **Distance error propagates to every number.** A 5% error in shooter-to-target distance is
   a 5% error in every reported measurement.
2. **The FOV trap.** The ppi implied by dividing pixels by nominal target width (`01-` §1) is
   unattainable — a phone at 21 ft needs a 572 mm lens to achieve it. Using it inflates every
   measurement by ~9×.
3. **It is the exact defect the file was written to avoid.**

**Recommended input:** a printed grid with a known span, photographed flat against the target.
A planar homography from ≥4 correspondences removes scale *and* perspective together, which
two-point calibration does not.

## 3. Real conventions the engine must know

| Convention | Value | Trap |
|---|---|---|
| IPSC paper | 170 × 250 mm scoring area, A-zone 110 × 150 mm | A-zone is not the target — measuring to paper edge overstates group size |
| IDPA / NRA paper | Scoring to the **ten ring** at various scale factors | Scale factor varies (e.g. 6× vs 5×); **the same target means different inches** |
| Point of aim vs point of impact | POI is *offset* from POA by the shot | The canonical pistol chart diagnoses from **POI**, and `centreOfImpact` returns the mean impact — correct, but it must be *displayed* against the aim point |
| Y-ring orientation | Differs by target type | A "high" group can be a left-handed shooter's low group if X/Y are flipped |
| Steel | 165 × 460 mm (IDPA), 245 × 170 mm (IPSC) | Hole diameter varies with obliquity — see `01-` §4 |

**The scale-factor trap is the dangerous one.** IDPA targets are scored to the ten ring at
different scale factors; a 21×30 cm target at 6× is not the same physical target as at 5×.
An app that infers scale from target dimensions will be wrong by the ratio between them, and
**nothing in the photo will reveal the error.**

## 4. The handedness mirror — this inverts advice

This is the sharpest correctness issue in the whole feature.

The canonical pistol chart (`tasking/completed/shot-group-taxonomy/01-fault-taxonomy.md`) states:

> "The following groups assume a right handed, right eye dominant shooter. **For left-handed
> shooters, reverse the groups.**"

**A diagnosis engine that ignores this tells a left-handed shooter the exact opposite of the
truth.** Not a vague inaccuracy — an inverted instruction about how to hold a gun.

Worse, and unhandled by the chart itself: **crossed dominance**, where a right-handed shooter
is left-eye dominant. Jones et al. (1996, n=308) found those shooters achieved qualification
at **56.5% vs 86.1%** for uncrossed (p = .000). That is a real, large effect — and the chart
supplies no mapping for it at all.

### Required design consequence

1. **Handedness must be an explicit user input**, stored, and applied as a mirror on every
   diagnosis. Never inferred.
2. **Dominance must be asked separately** — it is not derivable from handedness, and the
   chart's "reverse the groups" instruction does not cover the crossed case.
3. **A screenshot must not be shared between a right- and left-handed shooter without the
   mirror being re-applied** — a bug that produces an inverted safety instruction is worse
   than no output.
4. **Never persist a diagnosis without the handedness flag attached.** A stored "low-left"
   without it is a latent inversion.

## 5. Recommended interface

```
Photo + calibration grid
  → homography (pixel → inches on target plane)
  → verify scale against the grid; ABORT if residual > tolerance
  → dispersion.ts (inches, unchanged, unaware of pixels)
  → display, with handedness mirrored and the shot count shown
```

**The abort at the homography step is load-bearing.** If the calibration does not fit, the
measurement is not degraded — it is meaningless, and the honest output is to decline.