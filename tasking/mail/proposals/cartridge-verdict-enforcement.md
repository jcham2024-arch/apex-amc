---
proposal: cartridge-verdict-enforcement
title: Make the licence verdict machine-enforced, so an empty dimensional cell is a decision and not a bug
derived_from: tasking/completed/cartridge-licence-reconciliation/KNOWLEDGE.md
evidence: "226 of 229 cartridges are blocked by **availability**. Three by nothing. None by permission alone, because CIP's ~11-sheet coverage was never independently confirmed and I declined to expand it — reading 91 sheets to classify coverage is pointless while the licence forbids the use."
shape: research
priority: high
write_set:
  - tasking/completed/cartridge-verdict-enforcement/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-scope.md
  - 02-negative-test.md
---

## Why this, and why now

The dimensional columns are **0 / 229 populated**, and that is currently
indistinguishable — to every gate and to every future agent — between three very
different states:

1. **Permission granted, work not done.** Someone should have done this.
2. **No permission.** Correctly EMPTY, permanently, unless CIP approves.
3. **No source exists.** Correctly EMPTY, but fixable by *buying the standard*.

`cartridge-dimensions` did the hard part and produced the answer. **Nothing in the
repository records it.** The verdict lives only in
`tasking/completed/cartridge-licence-reconciliation/03-per-cartridge-verdict.csv`,
which no gate reads and no schema references.

The concrete risk, stated plainly: **a future agent sees 0/229 and starts transcribing.**
That agent fetches CIP, extracts the PDF text, and produces exactly the dataset
`cartridge-dimensions` was built to prevent — because from `cartridge_specs` alone
there is nothing to stop them. `ammoseek-coverage` §7 is the proof this has already
happened once:

> **The barrier to this work is transcription effort, not permission.**

That sentence sent a different agent toward the work. It was wrong, and it was
believable because the dataset said nothing to contradict it.

## What the task would do

**Research only. No source file is modified. No dimension is transcribed.**

1. **`01-scope.md`** — determine the correct home for a per-cartridge permission
   verdict: a new governed CSV under `data/sources/`, or a column-level manifest.
   Check whether `data/schemas/*.yaml` supports a reference-valued column before
   proposing one, because a manifest that no loader enforces is a comment.
2. **`02-negative-test.md`** — build the negative test that is currently missing.
   **This is the deliverable that matters.** A gate that fails when a
   CIP-restricted dimension appears in the seed data, and passes when it does not.
   Following `.clinerules` §5 rule 2: *"Every gate needs a negative test, observed
   failing."*
3. **`REPORT.md`** — whether `03-per-cartridge-verdict.csv` should be promoted to
   governed data, quoted, or left as documentation.

## Explicitly out of scope

- **Transcribing any dimension.** Barred by this task's own prohibitions and by §12.
- **Deciding the legal questions.** NOTES.md N1 (SAAMI's footer) and N2 (CIP's extract
  boundary) are owner decisions. The gate should encode the *conservative* default
  until they are answered, and that default must be a named constant, not a literal
  scattered through a script.
- **`shape: change`.** If the finding is that the schema itself needs a permission
  column, that is `shape: change` and waits for the owner. Do not discover it and
  assume it.

## Why research and not change

The proposal is scoped to *deciding and evidencing* the enforcement, and to building
the negative test in a sandbox the reviewer can observe failing. It writes nothing
into `data/`, `scripts/` or `apps/`. If enforcement is approved, it is a second,
owner-approved task.

## Honest weakness

The conservative default keeps the columns empty. If SAAMI's free drawings turn out
to be clear to republish (N1), the default is wrong for 3 cartridges and someone must
change the constant. **That is the intended failure mode** — a wrong default that
fails visibly and costs nothing is better than a permissive default that produces
unlicensed data nobody notices.

Second weakness: this proposal derives from a task whose `tasking:check` run is
currently red for **other** agents' reasons. The `ui-research` missing output and the
stray `T5/` folder should be resolved first, or the new gate will be built on top of
a red baseline and its own failures will be ambiguous.