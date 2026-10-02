# 05 — Safety and liability

**Task:** handgun-coaching-feasibility. **My judgement, not a legal opinion.** I am not a
lawyer and this file is not legal advice. Every case-specific question needs a real attorney,
and the honest recommendation below is to consult one *before* writing any coaching output.

---

## 1. The shape of the risk

Someone follows the app's advice and a shot lands where it should not. In the US, the
developer's exposure comes from several independent theories:

| Theory | Basis | Exposure |
|---|---|---|
| **Negligence** | Advised a technique that was unsafe, or failed to warn of a known hazard | The core risk. Damages for a shooting injury or wrongful death |
| **Failure to warn** | No adequate disclosure of known limits | Compounding rather than alternative |
| **Product liability / design defect** | The advice mechanism is itself defective | Depends on how advice is framed |
| **Licensure / practice of a profession** | Coaching may be construed as regulated instruction in some jurisdictions | **Unresolved — jurisdiction-specific** |
| **Statutory duties** | Varies by state; some impose specific duties on firearm instructors | **Unresolved** |

**The aggravating factor is specific and severe: the injury is caused by a firearm.** Courts
and juries treat firearm injuries differently from most product-liability injuries, and the
per-injury damages are high. A single incident endangers the developer personally, not just
the product.

## 2. The hard problem: the advice may be wrong and the app cannot know

From `completed/shot-group-taxonomy/`:

> Every chart pattern maps to **two or three unrelated causes**. **Not one pattern is
> unambiguous.**

> **I found no study that validates any specific pattern-position → fault mapping.** That cell
> is not empty by accident. It is the finding.

**This is the liability problem in one sentence.** A disclaimer does not cure advice that is
more likely than not to be wrong, when the consequence of being wrong is a gunshot.

And there is a worse variant. From the same task:

> `centreOfImpact` returns the **mean of the shots taken**… For that offset to imply a fault it
> must be **larger than the sampling noise of the centre**, which depends on group size and
> shot count, and **is not computed by `dispersion.ts`**.

**So the app would be applying a threshold that does not exist, to a statistic whose noise
level the codebase does not compute.** On a small group, the centre of impact can drift
substantially with no change in technique. An app that reads that drift as a fault will
**regularly tell a competent shooter they are doing something wrong**, and the shooter may
act on it at the next range.

## 3. Why "educational, consult an instructor" is probably not sufficient

The brief asks directly. My assessment, stated plainly:

**It is weak here, and weaker than in most software domains.** Reasons:

1. **The user cannot verify the disclaimer.** A disclaimer informs a party who might
   otherwise rely. Here the user may follow the advice *instead of* seeking instruction,
   because the app felt like instruction.
2. **The advice is specific and actionable.** "Download a newer browser" is not a safety
   instruction. "Your trigger pull is jerking — try this instead" is.
3. **The domain has an established professional standard** the app does not meet. Coaching
   apps are not held to it, but a fact finder comparing the app's basis to a certified
   instructor's will find the app's is absent.
4. **Assumption of risk does not reach this.** A shooter may assume risk of *shooting*, not
   of following a specific technical instruction from a piece of software.
5. **It does not cure a design defect.** If the mechanism is systematically wrong, better
   wording does not fix the mechanism.

**What would be stronger than a disclaimer:** not giving fault-level advice at all. The
defensible product describes the group and stops there (`06-`).

## 4. What established shooting apps carry — and do not cover

**Limitation found:** `not stated`. I did not retrieve the terms of service or liability
terms of specific commercial shooting apps; several sites returned HTTP 403/404. **I am not
going to generalise about their disclaimers from memory.**

What can be said from first principles about what a disclaimer **cannot** cover, regardless
of wording:

- Gross negligence or intentional misconduct.
- A design defect that the vendor knew about and shipped anyway.
- Statutory duties that a disclaimer cannot waive.
- Licensure, in jurisdictions where it applies.

**A liability disclaimer is a contractual limit between the parties. It is not a defence to
negligence, and it does not remove regulatory exposure.**

## 5. Required mitigations, in order of force

1. **Do not give fault-level advice.** This is the only mitigation that actually addresses the
   finding. Everything below is secondary.
2. **Never state a fault as a fact.** Use hypothesis framing throughout — which
   `shot-group-taxonomy` already established as the correct register.
3. **Never report group size as a measure of skill.** Two sources contradict that reading.
4. **Require handedness and dominance as input**, and refuse to interpret without them
   (`02-` §4). Getting handedness wrong inverts the advice.
5. **Show the measurement's uncertainty alongside the measurement.** If the group is near the
   0.251 in floor (`01-` §2), say the number cannot support a conclusion.
6. **Abort rather than guess.** If calibration fails, decline.
7. **Prominent, non-dismissible safety notice** — not a click-through, not buried.
8. **Get a lawyer to review before launch**, specifically on negligence and on whether the
   feature is licensable in the target jurisdictions. **This is the one item that must not be
   skipped.**

## 6. The question I could not answer

**Is providing shooting technique advice licensable, restricted, or unregulated in a given US
jurisdiction? EMPTY — `not stated`.** I did not establish this and it is jurisdiction-specific
enough that it needs a lawyer, not an agent.

**It is listed as an open question rather than assumed benign.** Assuming "it's just an app"
is precisely the assumption that produces a liability event.
That is a foreseeable, repeated, mechanically-caused instance of bad advice. It is much worse
legally than an occasional error, because it is systematic.