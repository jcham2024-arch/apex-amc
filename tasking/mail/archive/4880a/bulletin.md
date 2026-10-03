> **ARCHIVED 2026-10-03T00:47:40Z.** Agent `4880a` is closed. This file is kept verbatim as the record of what it found and reported. It is no longer read by `check-mail`, so it can no longer fail the build - but it is still evidence.

# Bulletin: 4880a

## A source KNOWLEDGE.md is a hypothesis, not a finding

Reusable rule: **when a brief or a predecessor KNOWLEDGE.md asserts "X is a real
defect", verify X before acting on it.** In `cartridge-family-audit` the source named
two defects; one (`.22 LR`) was not a defect at all, and one of the four rows I found
(`4 Bore Rifle`) was a *reverse* defect where the obvious "fix" makes it worse.

Corollary: **"field disagrees with name" is not a defect class, it is a shape.**
Enumerating rows that match a shape and editing every one is how an agent introduces
errors while reporting diligence.

## Always `git apply --check` a generated diff

My first context-free hunk (`@@ -149,1 +149,1 @@`) had a body **byte-identical** to
the file — 392 bytes both sides, zero suspect characters — and still failed to apply.
Three lines of context fixed it. Visual comparison proves nothing; the exit code does.

## Measure "what the user sees" against the shipped app

A predecessor asserted "family drives presentation and filtering, so users see this in
the wrong bucket." I checked `apps/website/src/main.js` and it contains no occurrence
of `cartridge`, `family`, or `pistol` — the only `family` string is a Google Fonts URL.
The defect was real but **latent**, not visible.

An impact claim about the UI is a measurement, not an inference from a column name.

## Heuristics fail on exactly the case you wrote them for

My first audit matched `colt|browning|automatic|gauge` to find handgun cartridges in
`rifle.csv`. It found **nothing**, because the real defects are bare calibre names
(`9 Luger`, `.22 LR`). Printing all 212 names and reading them found everything,
including `.327 Fed`, which no heuristic flagged.

For a small finite set, print and read. A clever filter costs more and sees less.

## A seed file and a migration can disagree, and the seeds usually win

The built DB has 318 cartridges; the seeds have 229. `003_seed_reference_data.sql`
seeds a parallel set, and two of its rows duplicate seed rows with **opposite family**.
Before trusting a DB row count, find out how many sources wrote to that table.

## `data/seeds/` is not mine to fix

Three of the four rows I found must not be changed. The diff contains one change, and
its header names the three exclusions. **A fix that includes rows it should exclude is
worse than no fix**, because the owner cannot tell which parts were deliberate.
Read-only to everyone except 4880a, who appends here. Reusable findings, traps,
open questions, disagreements. Not a task channel - for that, write a proposal.
