# Task: handgun-coaching-feasibility - Handgun coaching app: technical feasibility and privacy

**Status:** READY
**Blocked by:** none (shot-group-taxonomy is a useful parallel, not a prerequisite)
**Workflow:** copy-out to `tasking/completed/handgun-coaching-feasibility/` - see [tasking/README.md](../README.md)
**Model:** [record on start - fresh instance of the default model]

> **FEASIBILITY RESEARCH. NO IMPLEMENTATION.**
> The owner proposes photographing or recording a shooter and giving real-time feedback
> on grip, trigger, and technique. Your job is to find out what is actually possible,
> what the measurements cost, and where this becomes unsafe.

---

## 1. Isolation Boundaries

**Strict Read Paths** - read anything; you NEED:

- `packages/ballistics-core/src/dispersion.ts` - existing measurement code
- `apps/ballistics/package.json` - Expo 57, React Native 0.86, the target platform
- `docs/CONVENTIONS.md` - binding, especially YMYL/trust material
- `SECURITY.md` - the project's threat model, which this feature touches directly
- `docs/REVIEW.md`, `docs/GAME-PLAN.md`

**Strict Write Paths** - ONLY inside `tasking/completed/handgun-coaching-feasibility/`:

- `tasking/completed/handgun-coaching-feasibility/01-measurement-accuracy.md`
- `tasking/completed/handgun-coaching-feasibility/02-target-scale-conventions.md`
- `tasking/completed/handgun-coaching-feasibility/03-vision-approach-comparison.md`
- `tasking/completed/handgun-coaching-feasibility/04-privacy-and-app-store.md`
- `tasking/completed/handgun-coaching-feasibility/05-safety-and-liability.md`
- `tasking/completed/handgun-coaching-feasibility/06-feasibility-verdict.md`
- `tasking/completed/handgun-coaching-feasibility/REPORT.md`

**Do not edit** `packages/`, `apps/`, `data/`, `scripts/`, or `package.json`.

---

## 2. The owner's question, stated plainly

Take a photo or video of someone shooting, work out where the shots landed, and give
real-time feedback on whether grip, trigger pull, or technique is causing the group to
miss centre mass.

**You must not assume this is feasible.** Find out what it would actually take.

---

## 3. Execution Prompt

**`01-measurement-accuracy.md`** - the crux. Quantify "where the shot landed":

- Target dimensions in real use (IPSC, IDPA, NRA paper, common steel). What target size
  is realistic for a phone photo at a normal indoor range?
- **How many pixels per inch does that give**, and therefore what is the smallest
  reliably measurable group? Compute this honestly for several distances and phone
  resolutions. This single number decides whether the idea works.
- Perspective distortion: what angle and distance errors introduce, and what
  calibration target removes them.
- Lighting, glare, shadow, paper vs steel vs cardboard, and how each affects detection.
- Reported accuracy of current off-the-shelf and open-source shot-detection systems, with
  **stated error bars** where published. Apply the three-part oracle test from
  `data/reference/README.md`: stated conditions, stated uncertainty, independent
  derivation. A claim of "95% accuracy" with no test conditions is **not** usable.

**`02-target-scale-conventions.md`** - the units problem. `dispersion.ts` works in
**inches on the target**, deliberately, because a comment records that mixing pixels and
inches "was the original defect in this code." Document:

- real conventions used (IPSC/IDPA scoring rings, point-of-aim vs point-of-impact, X/Y
  ring orientation, and the handedness mirror)
- conversion from photo pixel coordinates to inches at target scale
- why that conversion must be explicit and user-supplied, never guessed
- the handedness trap: **low-left means one thing for a right-handed shooter and the
  opposite for a left-handed one.** A diagnosis engine that ignores this inverts its own
  advice.

**`03-vision-approach-comparison.md`** - compare honestly:

- on-device (what the Expo app can do offline, model size, package size)
- server-side (accuracy, cost per image, latency, privacy cost)
- classical CV vs ML: what classical CV (edge/threshold/Hough) does that is *auditable*,
  and where it fails
- for each: accuracy claim + source, latency, cost, offline capability, auditability
**`04-privacy-and-app-store.md`** - a real product risk:

- filming a person handling a firearm, indoors, at a range. What do Apple and Google
  policies actually say about weapon content, and about apps soliciting camera access in
  this context? **Cite the policy; do not summarise from memory.**
- Is a coaching app that films someone shooting likely to be rejected, restricted, or
  delisted? What specifically triggers each?
- Data handling: photos and video of a person's face, plus their shooting technique.

**`05-safety-and-liability.md`**:

- Someone follows the app's advice and a shot lands where it should not. What does that
  mean for a US-based developer?
- What liability disclaimers do established shooting apps carry, and what do they NOT
  cover?
- Why "this is educational, consult an instructor" is probably **not** a sufficient
  defence, given this domain.

**`06-feasibility-verdict.md`** - **the first paragraph IS the deliverable.** State:

- whether this can work, and at what accuracy
- the honest pixels-per-inch figure and the smallest measurable group
- what is cheap to build vs expensive
- **what we should NOT build**, and why

---

## 4. What you must NOT do

**Do not build a prototype.** Research only. The owner has not decided this is a
direction, and a working demo creates pressure to ship something unsound.

**Do not evaluate desirability.** Your job is feasibility and risk. Say plainly if the
honest answer is "this should not be built" - that is a valid and valuable outcome, and
far cheaper than discovering it later.

**Do not soften a safety finding.** If shooting-analysis apps carry real liability or
app-store risk, state it in the verdict's first paragraph.

---

## 5. Definition of Done

**Validation:**

- [ ] `git status --porcelain` shows changes ONLY under `tasking/completed/U2/`
- [ ] `npm run verify` still exits 0
- [ ] Every accuracy claim carries a source and a stated uncertainty, or `not stated`
- [ ] App-store policy claims cite the policy document
- [ ] The verdict states a pixels-per-inch figure derived by actual arithmetic

**Mandatory negative test:**

- [ ] Paste the arithmetic for the smallest reliably measurable group, showing working
- [ ] Paste your verdict's first paragraph verbatim
- [ ] Paste the strongest argument AGAINST building this

**Report:** `REPORT.md`, five-part summary from `.clinerules` §8. Item 4 must answer
the owner's question directly: should we build this, and if not, why not.
