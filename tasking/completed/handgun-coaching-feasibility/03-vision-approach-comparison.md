# 03 — Vision approach comparison

**Task:** handgun-coaching-feasibility. **Platform:** Expo 57 / React Native 0.86 per
`apps/ballistics/package.json`.

**Every accuracy figure below reads `not stated` where I could not source one.** That is not
sloppiness — it is the finding from `01-` §5 restated, and it changes the recommendation.

---

## 1. Classical CV — thresholding, edges, connected components

**How it works:** convert to greyscale → adaptive threshold to separate dark hole from light
paper → connected-component labelling → centroid of each blob.

**What makes it attractive here — auditability.** Every step is a named, inspectable
operation. A wrong detection can be traced to a specific threshold. That matters more than
usual here because of `01-`'s finding: **accuracy is not the scarce resource, honesty about
accuracy is.** A classical pipeline can be *shown* to be wrong in a way a neural net cannot.

| Property | Value |
|---|---|
| Accuracy claim | `not stated` — no published error bars found |
| Latency | ~10–50 ms on-device for a single frame |
| Cost per image | $0 |
| Offline | **Yes, fully** |
| Auditability | **High** — every operation is inspectable |

**Where it fails:**

- **Steel.** No high-contrast edge; specular reflection makes the "hole" a highlight. Detecting
  a hole in steel needs specular-edge or differential-reflectance, not thresholding.
- **Shadows.** A shadow crossing a hole splits one blob into two — a false double shot.
  This is the dominant failure mode under range lighting.
- **Overlapping holes.** Two overlapping holes are one connected component. A tight group —
  exactly where a shooter needs help most — is where this fails hardest.
- **Printed scoring rings and text** create structure that looks like holes.

## 2. ML on-device

**What it could do better:** handle shadows, steel, and overlapping holes, which is exactly
where classical CV fails.

| Property | Value |
|---|---|
| Accuracy claim | `not stated` — no shot-detection model with published test conditions found |
| Model size | **EMPTY** — I found no specific model, so I cannot state a size |
| Latency | `not stated` for any specific model |
| Cost per image | $0 on-device |
| Offline | Yes, if bundled |
| Auditability | **Low** — a failure is not traceable to a cause |

**The blocking issue for Expo:** whether a bundled vision model is practical in an Expo app is
an **engineering question I did not resolve**, and I am not going to guess at it. No specific
model was identified, so package size, runtime, and licensing are all `not stated`.

**Expo is the binding constraint here, not the algorithm.** Whatever the model, it must run
in React Native — which historically rules out arbitrary Python/C++ inference without a
native module.

## 3. Server-side

| Property | Value |
|---|---|
| Accuracy | Potentially higher — no size or latency constraint |
| Cost per image | **EMPTY** — no basis to estimate without knowing a provider |
| Latency | Network round trip; **real-time feedback from a range with poor cell service is a problem** |
| Offline | **No** |
| Privacy | **Worse** — see `04-` |

**Server-side is the worst fit for this use case on three independent grounds:** it cannot
work where the shooter is (indoor ranges, dead zones), it uploads images of a person handling
a firearm to a third party, and the brief's framing is *real-time* feedback, where a network
round trip is disqualifying.

## 4. The comparison that decides it

| Criterion | Classical CV | On-device ML | Server-side |
|---|---|---|---|
| Accuracy claim | `not stated` | `not stated` | `not stated` |
| **Auditability** | **High** | Low | Medium |
| **Offline** | **Yes** | Yes | **No** |
| **Privacy** | **Best** — image never leaves the phone | Good | **Worst** |
| Real-time viable | Yes | Probably | **No** |
| Handles steel/overlap | **No** | Probably | Probably |
| Expo feasible | Yes | Unresolved | Yes |

## 5. The decision, and the honest caveat

**Classical CV on-device is the only approach that survives all four constraints** — and I want
to be precise about why. **It is not chosen because it is the most accurate.** No accuracy
claim for any approach could be sourced. It is chosen because:

1. It is the only one whose failures can be **explained to a user**, which is what
   `shot-group-taxonomy` says the product must do.
2. It works offline and keeps the image on the device (`04-`).
3. It is the only one with no unsourced Expo integration risk.

**Its real limitation must be stated plainly: it will fail on steel and on overlapping
holes** — which is the overlap case, a tight group, where a shooter most wants feedback.
A classical pipeline's most likely real-world behaviour is to under-count shots in a tight
group, and therefore **overstate dispersion.**

**Overstating dispersion is the safer failure direction** — it under-claims skill rather than
over-claims it — but that is luck, not design, and it must not be relied on.