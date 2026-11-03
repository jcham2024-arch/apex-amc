---
proposal: pdf-licence-probe
title: Build a reusable notice-detector for third-party PDF data sources
derived_from: tasking/completed/cartridge-licence-reconciliation/KNOWLEDGE.md
evidence: "Two agents independently got this wrong, in the same direction. T4 (`cartridge-dimensions`) and I (`ammoseek-coverage`) both concluded CIP was freely usable... Both of us then **undercounted the restriction** while trying to measure it"
shape: research
priority: high
write_set:
  - tasking/completed/pdf-licence-probe/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
  - 01-the-trap.md
  - 02-detector.md
  - 03-negative-test.md
---

## Why

Two agents, independently, concluded that CIP data was freely usable, and both
measured it in the direction that **underestimated the restriction**. I hit the
same kerning trap T4 had already documented, then invented a second one on top
(letter-ratio readability testing).

The notice on a CIP sheet reads literally as:

> Reproduction forbidden as well as in the form of extracts without approval of C.I.P.

and a naive `includes('Reproduction')` returns **false on a sheet that carries
it**, because the text extracts as `Reproduc tion forbidden as w e ll as in the
form of ex trac ts`.

That is the exact failure class this repo's `AGENTS.md` keeps cataloguing — *a
check that passes while producing wrong output* — except here the error is not
caught at all. Nothing goes red. The sheet simply reports as unlicensed and the
next agent transcribes it into the dataset.

**This is worth a task because the trap is general.** Every future source we
ingest is a PDF with its own font quirks: CIP, SAAMI, and every standards body
whose drawings we have not opened yet. The extractor that gets this right should
exist once, be tested with fixtures, and be reused.

## Scope

1. Reproduce the trap with **committed fixtures** — a kerned sheet and a
   font-blob sheet — not live network fetches, so the test is deterministic.
2. Build a `tmp/`-style extractor that (a) concatenates PDF text fragments with
   **no** separator, (b) decodes octal escapes, (c) tolerates intra-word kerning,
   and (d) classifies each document `NOTICE` / `UNDETERMINED` / `NONE` using a
   dictionary-word readability test rather than a letter ratio.
3. **Prove the negative direction.** The gate must fail when given a sheet whose
   notice is present but kerned away — the false "unrestricted" reading is the
   dangerous one and must be observed failing, not just assumed.
4. Apply it to the sources we already depend on and record which carry a notice:
   CIP TDCC, SAAMI drawings, and any others named in
   `data/seeds/opensource_resources.csv`.

## Do not

- **Do not give legal advice**, and do not state whether any use is lawful. Record
  published text and locations; that is the deliverable.
- **Do not transcribe a single dimension from any source under investigation.**
  Establishing permission is the task; populating the dataset is a separate one.
- **Do not treat `UNDETERMINED` as permissive.** An unreadable document is not an
  unrestricted one. That inversion is the whole bug.
- **Do not modify `scripts/gates/`.** This task produces a *specification and
  fixtures* inside its own `completed/` folder. Wiring it into a gate is a
  `shape: change` decision for a human.