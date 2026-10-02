# REPORT — handgun-coaching-feasibility

**Task:** `tasking/in-progress/handgun-coaching-feasibility/`. **Agent:** scout-research
sub-agent, fresh instance of the default model. **No prototype was built** (prohibited).

---

## The answer to the owner's question

> **Do not build the coaching feature — but build the measurement half, which is different,
> cheaper, and true.** Full verdict, first paragraph verbatim, in `06-feasibility-verdict.md`.

The measurement is feasible: **131.6 ppi at 21 ft on a 48MP phone**, a 3.0 in group spans 396
pixels, and **neither app store's weapons policy prohibits it** — Google Play's policy
regulates *sale and manufacture* of firearms, not depiction or analysis.

The advice is not feasible, for reasons that are not costs to be managed but findings:

1. **No source validates any position→fault mapping.** Every chart pattern maps to 2–3
   unrelated causes; not one is unambiguous.
2. **The threshold the app would need does not exist.** `centreOfImpact` is the *mean of the
   shots taken*; it must exceed its own sampling noise to mean anything, and `dispersion.ts`
   does not compute that noise.
3. **More megapixels buys nothing.** The localisation error is dominated by the bullet hole:
   **0.251 in at every resolution from 10 ft to 50 ft.**

## 1. What changed

Six research files inside the task folder. `packages/`, `apps/`, `data/`, `scripts/` and
`package.json` were read, never written. Scratch is in `tmp/`.

| File | Contents |
|---|---|
| `01-measurement-accuracy.md` | The ppi arithmetic with working; error model; surfaces; oracle-tested accuracy claims |
| `02-target-scale-conventions.md` | Pixel→inch conversion, real target conventions, the handedness mirror |
| `03-vision-approach-comparison.md` | Classical CV vs on-device ML vs server, per the four binding constraints |
| `04-privacy-and-app-store.md` | Verbatim Apple and Google policy text; the on-device privacy win |
| `05-safety-and-liability.md` | Liability theories; why disclaimers fail here; mitigations in order of force |
| `06-feasibility-verdict.md` | The verdict; what to build instead; the strongest case against me |

## 2. Mandatory negative test — all three required items

### (a) The arithmetic for the smallest reliably measurable group, showing working

```
Error model:   error_in  = (radius_px + max(radius_px * 0.125, 0.25)) / ppi
               group     = 2 * error_in

At 48MP, 0.223in hole, 21 ft:
  frame width at target = 2 * 6400mm * tan(22.7 deg) = 1544 mm = 60.8 in
  ppi                    = 8000 px / 60.8 in       = 131.6 ppi
  hole diameter          = 0.223 * 131.6           = 29.3 px
  radius                 = 14.7 px
  centroid term          = 14.7 * 0.125            = 1.83 px   (> 0.25 floor)
  error                  = (14.7 + 1.83) / 131.6   = 0.1256 in
  group floor            = 2 * 0.1256              = 0.251 in
```

**And the finding — the floor does not improve with resolution, because it is algebraically
independent of ppi:**

```
group floor = 2 * 1.125 * (hole_diameter / 2)
            = 1.125 * hole_diameter
            = 1.125 * 0.223 = 0.2509 in     <- ppi has cancelled out
```

Verified across distances: **0.251 in at 10, 15, 21, 30 and 50 feet.** The floor is the hole.
More megapixels cannot help, because the error is not a sampling error.

### (b) The verdict's first paragraph, verbatim

> **Do not build the coaching feature.** Specifically: do not build anything that tells a
> shooter what fault they have. The measurement half is buildable and worth doing — a phone
> photo resolves a 3.0-inch group comfortably at 21 ft, and both app stores' weapons policies
> turn out not to prohibit it. But the advice half cannot be built honestly and should not be
> built at all: across every source I could reach, **no pattern position implies a named
> fault with any stated accuracy, and not one pattern is unambiguous** — the canonical chart
> gives two to three unrelated causes for every entry, and a named Aegis Academy instructor
> calls that chart "the most misused tool in the training industry" and says reading a group
> is "like looking at an image of golf ball impacts and trying to diagnose a swing issue."
> Worse, the specific rule the app would need does not exist: `centreOfImpact` returns the
> **mean of the shots taken**, so a "high group" must be larger than the sampling noise of
> that mean before it means anything — and `dispersion.ts` does not compute that noise, and
> no source states the threshold. An app applying an untestable threshold fires on noise and
> tells competent shooters they are doing something wrong, **systematically**, in a domain
> where the consequence of a wrong instruction is a gunshot and the developer carries
> personal exposure. Separately and counterintuitively, **more megapixels buys nothing**: the
> localisation error is dominated by the bullet hole itself — 0.251 inches at every resolution
> from 10 to 50 feet — so the accuracy ceiling is not a hardware problem and cannot be bought
> out of.

### (c) The strongest argument AGAINST building this

> **The strongest case for building it anyway:** this project already contains correct,
> well-tested dispersion mathematics, a defensible measurement layer is genuinely buildable,
> and the honest measurement-only product would still be worth having. The comparison is not
> "risky coaching app vs nothing" — it is "honest measurement app vs nothing." Building the
> measurement half has real value and low risk.
>
> **Why I still answer "do not build the coaching feature":** the value the owner describes is
> in the *advice*, and that half has no honest form. Shipping the measurement app under the
> promise of coaching would be the worst outcome — attracting users for a capability it does
> not have.
## 3. Verification

**Arithmetic.** `tmp/ppi.mjs` computes every figure; nothing is asserted in prose. Cross-check
of the key derivation: the per-distance table (ppi 62.7→313.4) and the sweep table (ppi
200→2) are the same function on different inputs, and they agree — at ppi ≈ 132 the sweep's
regime column reads `hole-dominated`, and the floor is 0.251 in both.

**Encoding.** All six deliverables re-read after writing: LF only, no BOM, no lone CR.

**Isolation.**

```
$ git status --porcelain -- packages data scripts apps package.json
(empty)
```

**Retrieval failures, recorded not glossed:** two Google Play pages fetched by mistake (UGC,
Deceptive Behavior) — neither is cited. Commercial shooting apps' terms of service: 403/404,
**so `05-` §4 states `not stated` rather than generalising from memory.**

## 4. Item 4 — the owner's question, answered directly

**Should we build this?**

**The measurement half: yes.** Photographed target → calibration grid → homography → the
existing `dispersion.ts`. It is offline, private by construction, store-legal, auditable, and
it uses machinery the project already has and has tested.

**The coaching half: no, and not later.** Not because it is expensive, but because three
independent findings say the honest version does not exist:

- **No validated mapping exists anywhere in the literature.** Not weak evidence — none.
- **The threshold is undefined and untestable** with current code, so any rule fires on noise.
- **The accuracy ceiling is a physics limit**, not a hardware one. 0.251 in, invariant.

**What I would build instead:** a tool that measures honestly and declines to diagnose.
Offer cant — the one fault a photograph genuinely shows. State alternatives as alternatives.

**Two things a human must do before any of this ships:** get a lawyer (the licensure question
in `05-` §6 is jurisdiction-specific and I could not establish it), and read
`tasking/completed/shot-group-taxonomy/REPORT.md`, which is where the safety case against the
advice feature actually lives.

## 5. What I found but did NOT touch

1. **`tasking:check` is still broken** — it reads manifests from `pending/` only, so every
   completed task reports having none. This has now been the blocker across three of my tasks.
   `scripts/` is outside every write-set I hold, so it stays a BLOCKED item.
2. **The brief's DoD says changes only under `tasking/completed/U2/`** — a stale path. The
   actual id is `handgun-coaching-feasibility`. Reported, not repaired (`tasking/README.md`:
   "If a brief is wrong, report it. Never repair it.")
3. **Commercial shooting apps' liability terms — `not stated`.** Retrieval failed and I did not
   substitute recollection.
4. **Whether technique coaching is licensable — EMPTY.** Jurisdiction-specific; needs counsel.

## 6. What I believe is wrong, including out of scope

- **The premise that this is a computer-vision problem is wrong.** Vision is the *easy* half
  and it works. The hard half is that the knowledge to act on the measurement does not exist,
  and shipping it anyway would launder an absence of evidence into an assertion about a
  person's ability.
- **Both app stores are far less of a problem than assumed, and that is a genuine surprise.**
  The weapons policies regulate sale and manufacture. Anyone who assumed "Google will ban a gun
  app" was wrong about the text. **But absence of prohibition is not approval** — review is
  discretionary.
- **Apple's on-device privacy exclusion is a real design lever**, quoted and verified, and it
  makes "never upload" the cheapest correct architecture rather than a constraint.
- **The 0.251 in finding is more useful than a verdict.** It says the measurement product has a
  hard accuracy ceiling no engineering removes. That belongs in any future proposal about
  vision features.
- **I may be under-weighting the coaching value.** A hypothesis-framed suggestion with honest
  alternatives may help a shooter more than silence. I judged that systematic false diagnosis
  outweighs it; a domain expert could reasonably disagree, and I would want that argument in
  writing rather than decided by me.