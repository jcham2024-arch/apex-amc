# Task: shot-group-taxonomy - Shot-group diagnosis: research the fault taxonomy

**Status:** READY
**Blocked by:** none
**Workflow:** copy-out to `tasking/completed/shot-group-taxonomy/` - see [tasking/README.md](../README.md)
**Model:** [record on start - fresh instance of the default model]

> **RESEARCH ONLY. DO NOT WRITE COACHING ADVICE.**
>
> You are compiling what experienced instructors already teach. You are not
> inventing an interpretation, and you are not assessing anyone's shooting.

---

## 1. Isolation Boundaries

**Strict Read Paths** - read anything; you NEED:

- `packages/ballistics-core/src/dispersion.ts` - **already computes POI, dispersion,
  and flyers.** Read it first; your taxonomy must be expressible in its terms.
- `packages/ballistics-core/src/weather.ts` - for the wind/wording precedent
- `docs/CONVENTIONS.md` - binding, especially YMYL/trust material
- `data/seeds/regulations.csv` - binding internal method rules

**Strict Write Paths** - ONLY inside `tasking/completed/shot-group-taxonomy/`:

- `tasking/completed/shot-group-taxonomy/01-fault-taxonomy.md`
- `tasking/completed/shot-group-taxonomy/02-instructor-sources.md`
- `tasking/completed/shot-group-taxonomy/03-mapping-to-measurements.csv`
- `tasking/completed/shot-group-taxonomy/04-rebuttals-and-exceptions.md`
- `tasking/completed/shot-group-taxonomy/REPORT.md`

**Do not edit** `packages/`, `apps/`, `data/`, `scripts/`, or `package.json`.

---

## 2. Context Anchors

1. `.clinerules` - binding. §5 rule 1: **never invent a value; leave it EMPTY**
2. `docs/CONVENTIONS.md` - binding
3. `packages/ballistics-core/src/dispersion.ts` - the vocabulary this must map onto

### What already exists - do not rebuild it

`dispersion.ts` already computes, for a set of shots on a target:

- `centreOfImpact(shots)` - where the group is centred
- `dispersion(shots)` - spread, with the documented `n-1` correction
- `detectFlyer(shots)` - outlier rejection

It measures. **It does not diagnose.** There is no mapping from a POI offset or a
group shape to a shooter fault. That mapping is this task's output.

---

## 3. Execution Prompt

> Paste verbatim.

Compile the body of professional knowledge that maps a handgun shot pattern to its
likely causes, so that a future app could give useful feedback.

**Deliverable `01-fault-taxonomy.md`**

For each fault a working instructor would name: the name, the observable signature in
the group (which direction the POI shifts, how the shape changes), and **the
confidence level with which that direction implies that fault.** Note explicitly which
patterns have **many** causes and which are nearly unambiguous.

**Deliverable `02-instructor-sources.md`**

Cite every source with author/instructor name, credentials, and URL. Distinguish:

- professional instructors with a named, checkable track record
- firearms-industry training material (Aegis, NRA, FFL trainers, competition shooting)
- forum and social posts - usable as **corroboration only**, never as a primary source

We already know the canonical chart circulated widely is "Georgia 4-H Pistol Group
Analysis" and that "Aegis Academy pistol correction chart" exists. Find the
authoritative instructor sources behind this knowledge, not the reposts of it.

**Deliverable `03-mapping-to-measurements.csv`**

Columns: `pattern_signature`, `measurable_quantity`, `measure_source`,
`implied_fault`, `confidence`, `conflicting_causes`, `source`.

**Use the existing vocabulary.** The measurable quantities are: POI horizontal offset,
POI vertical offset, extreme spread, group width, group height, standard deviation in
each axis, aspect ratio, and flyer count. A pattern that cannot be expressed in those
terms does not belong in this file.

**Deliverable `04-rebuttals-and-exceptions.md`** - the part everyone skips and that
decides whether this feature is honest:

- **every** pattern that has a common alternative explanation, e.g. a canted gun
  producing an apparent vertical shift
- the effect of a crooked trigger pull, dominant eye, and poor sight alignment on the
  same observable
- where professional instructors **disagree with each other**
- what cannot be determined from a photo at all

---

## 4. What you must NOT do

**Do not write feedback phrased as a verdict about a person.** "Your trigger pull is
jerking" is a diagnosis presented as fact. "This pattern is consistent with X, and
also with Y; Z is a common cause" is a hypothesis. The distinction is the whole
safety case for this feature.

**Do not produce a confidence number you cannot source.** If the literature gives no
statistics, write `not stated`. A fabricated 87% is worse than a blank, because a
blank prompts the reader to be careful and a number does not.

**Do not treat group size as skill.** Large groups are usually grip, trigger, or
stance - rarely a marksmanship deficit. State this explicitly if the sources do.

---

## 5. Definition of Done

**Validation:**

- [ ] `git status --porcelain` shows changes ONLY under `tasking/completed/shot-group-taxonomy/`
- [ ] `npm run verify` still exits 0
- [ ] Every fault has at least one named, credentialed source
- [ ] Every measurable quantity in `03-*.csv` exists in `dispersion.ts`
- [ ] `04-*.md` is non-trivial - a file claiming there are no exceptions is a failed task

**Mandatory negative test:**

- [ ] Paste one pattern where you found **instructor disagreement**, quoted
- [ ] Paste one fault you could NOT source, left EMPTY
- [ ] Paste a self-check: no staged file phrases a diagnosis as a certainty

**Report:** `REPORT.md`, five-part summary from `.clinerules` §8. Item 4 must state
plainly how much of this idea is technically supportable from a photo, and where it
would produce confident nonsense.
