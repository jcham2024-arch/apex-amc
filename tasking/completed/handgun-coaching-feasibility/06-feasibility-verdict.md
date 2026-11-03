# 06 — Feasibility verdict

## THE VERDICT

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

---

## 1. The honest numbers

| Quantity | Value | Source |
|---|---|---|
| ppi, 48MP phone, 21 ft | **131.6** | Computed, `01-` §1 |
| ppi, 12MP phone, 21 ft | 66.3 | Computed |
| Naive ppi (wrong by ~9×) | 1196 | `01-` §1 |
| Focal length needed for naive ppi | **572 mm equiv** (phone has 26 mm) | Computed |
| Smallest measurable group | **~0.25 in floor; <0.3 in unmeasurable** | Computed, `01-` §2 |
| ppi below which a 0.223 in hole is invisible | **~18 ppi** | Computed |
| Diagnostic accuracy of any fault mapping | **`not stated`** — no source | `01-` §5 |
| Probability of correct app-store approval | **`not stated`** | `04-` §6 |

**The single most important number is 0.251 in**, because it is invariant: it is the bullet
hole's own width, not a camera limit.
## 2. What is cheap, and what is expensive

**Cheap and worthwhile:**
- Homography from a printed calibration grid → inches. Well-understood, and it removes both
  scale and perspective at once.
- Feeding calibrated shots into the existing `dispersion.ts`. Already written, already
  correct, already in inches.
- On-device classical CV for hole detection on paper. Auditable, offline, private.
- Displaying `sigma`, `cep50`, `extremeSpread`, and the aspect ratio — **as measurements**.

**Expensive or impossible:**
- Fault-level advice. Not expensive to write; **impossible to write honestly.**
- Steel detection with thresholding — needs a different detector class.
- Real-time video analysis of *technique* (grip, trigger). Not addressed by a target photo at
  all, and `shot-group-taxonomy` establishes that a static target cannot record timing.
- Any accuracy claim. Nobody publishes one, so we would have to measure our own.

## 3. What we should NOT build — and why

| Do not build | Why |
|---|---|
| **"Your trigger pull is jerking"** | No source validates any position→fault mapping. Patrick Henry (Aegis): it would be *"like looking at an image of golf ball impacts and trying to diagnose a swing issue."* |
| **Any confidence percentage** | None exists. Inventing one is the failure this repo's rules exist to prevent. |
| **Group size presented as skill** | Two sources contradict it; a YMYL exposure. |
| **Anything inferring handedness** | Getting it wrong **inverts** the advice. It must be asked. |
| **Real-time technique feedback from video** | Timing faults have no time axis in a target photo; and video of technique is the most privacy-sensitive version of this. |
| **Anything server-side** | Breaks offline operation, makes real-time feedback impossible at a range, and uploads images of a person with a firearm to a third party. |
| **A prototype, now** | The brief is right: a working demo creates pressure to ship something unsound. |

## 4. What we SHOULD build instead

**A measurement tool that declines to diagnose.**

1. Photograph the target with a printed calibration grid.
2. Homography → inches. **Abort if it does not fit.**
3. Compute `poi`, `sigma`, `cep50`, `extremeSpread`, aspect ratio, flyers — via the existing
   `dispersion.ts`, unmodified.
4. **Show the measurement and its uncertainty, and say nothing about cause.**
5. Offer the one fault the photo genuinely supports — **cant**, because the target's own
   ellipse shows it — framed as an observation.
6. State the alternatives honestly: *"This pattern is consistent with X, and also with Y."*
7. Show the removed flyer; never silently shrink the group.

**That product is buildable, store-legal, private by construction, and true.** It is also less
compelling than "AI tells you what's wrong with your shooting" — and that gap is the finding.

## 5. If the owner wants the coaching feature anyway

The precondition is a **threshold that survives noise**, which does not exist today:

> Compute the standard error of the centre of impact, and require any fault claim to exceed
> it. Until that quantity exists and is sourced, every threshold rule is a guess, and guesses
> in this domain hurt people.

That is the follow-up I am proposing (`proposals/centre-standard-error.md`).

**And regardless of engineering: get a lawyer.** Whether shooting-technique advice is
licensable or restricted is jurisdiction-specific and I could not establish it
(`05-` §6). Assuming "it's just an app" is exactly the assumption that produces the incident.

## 6. The strongest argument AGAINST building this

Recorded because the brief asks for it, and because a verdict of "no" deserves its best
opposition rather than a strawman.

**The strongest case for building it anyway:** this project already contains correct,
well-tested dispersion mathematics, a defensible measurement layer is genuinely buildable, and
the honest measurement-only product in §4 would still be worth having. The comparison is not
"risky coaching app vs nothing" — it is "honest measurement app vs nothing." Building the
measurement half has real value and low risk.

**Why I still answer "do not build the coaching feature":** the value the owner describes is
in the *advice*, and that half has no honest form. The measurement half is a different, smaller
product — and shipping it under the promise of coaching would be the worst outcome, because it
would attract users for a capability it does not have.

**The honest framing: build the thing that is true, not the thing that was proposed.**