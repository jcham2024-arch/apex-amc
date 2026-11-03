# Finding — KNOWLEDGE: the swarm has no index, and duplicates what it cannot find

**Dimension:** (c) KNOWLEDGE. **Measured:** 3 Oct 2026. **Agent:** `ee247`.

---

## The measurement

Scanned all **108** Markdown files in `tasking/completed/` (**793,542 bytes**).

```
subject                                files  est KB to read every statement
dimensional columns empty (0/229)         27        187 KB
CIP / SAAMI licence or permission         33        219 KB
unresolved pressure dispute               28        162 KB
provenance published/derived/estimated    22        156 KB
live trademark 5391055                    13         85 KB
charge weight prohibition                 11         84 KB
tabular-nums                             10         70 KB

subject-index files present: NONE
```

**Two facts, both true, together they are the finding:**

1. **There is no index.** No `INDEX.md`, no `FINDINGS.md`, no ledger, no manifest that
   names another task's findings by subject. `findings-ledger` was **not** already built.
   Zero hits for all three names.

2. **The same fact is restated 70 times across 27 files.** The most-stated fact in the
   swarm is `0/229 populated`:

```
11  unknown-state-design/01-unknown-state-spec.md
 7  ammoseek-coverage/02-sourcing-plan.md
 7  cartridge-dimensions/BRIEF.md
 7  interior-ballistics/REPORT.md
 6  unknown-state-design/REPORT.md
 …
 1  ui-research/KNOWLEDGE.md
 1  ui-research/SUMMARY.md
```

**70 statements, 27 files, one fact.** And it is already written twice as a proposed fix
(`roadmap-synthesis.md`, `unknown-state-design.md`).

---

## Why this is a finding and not a tidiness complaint

**The absence of an index is not neutral, because the swarm is measured on recall.**

An agent finishing a task writes findings into **its own folder**. That is correct — the
write-set rule is what makes concurrency safe. But nothing connects the folders, so the
question "has anyone already established X?" has **no cheap answer**. The only available
method is to read everything: **794 KB** to be confident, per session, forever.

That produces the two observable behaviours already recorded in this repo:

> "It was eventually found — **by an agent doing its own task**, not by a gate."
> — `tasking/completed/code-audit/KNOWLEDGE.md`

> "**Check the mockups before solving a problem — they may already have solved it.**"
> — `tasking/completed/ui-research/KNOWLEDGE.md` §2

Both are the same failure. `ui-research` re-derived a token layer and found
`tabular-nums` already solved in the predecessor mockups — a fact now stated **10 times
across the swarm** and still missed once.

**Duplication is the index's failure mode.** The swarm compensates for having no index by
restating. 70 copies of one fact is what "remember this" looks like when nothing can
look anything up.

---

## The compounding cost, stated precisely

`roadmap-synthesis` measured that **5 of 10** completed tasks had no `KNOWLEDGE.md`. It
now reads **18 tasks**, of which **13** have one. The convention improved as a by-product
of tasks quoting their sources.

**But the count is the wrong metric.** What matters is not how many tasks wrote a
`KNOWLEDGE.md`; it is whether an agent *working a problem* can find the relevant finding
in one step. Measured: **zero index files**, so that number is **zero**, regardless of
how many `KNOWLEDGE.md` files exist.

> **`KNOWLEDGE.md` is a naming convention, not a retrieval mechanism.** It helps only an
> agent that already knows which folder to open — which is precisely the agent that does
> not need it.

---

## What this costs, concretely

The swarm is at **108 files / 794 KB**. Growth is roughly linear in completed tasks, and
each new task adds 6–11 files. At the observed rate the full read becomes untenable well
before the project finishes, and the failure mode when it does is **silent**: an agent
confidently re-derives a fact that three tasks already established, which is
indistinguishable from a novel finding.

**This is the repo's stated worst failure mode.** `.clinerules` §5 rule 1: *a wrong number
is invisible; a blank is visible.* A re-derived finding is invisible.

---

## What would fix it, without touching the protocol

An **index, not a rule change.** One file, `tasking/completed/FINDINGS.md`:

- one line per durable finding, each **quoting** its source file
- grouped by subject, so `0/229` is stated **once** with 6–8 links
- append-only; whoever notices a new finding adds a line
- research-shaped: it writes only inside `completed/`, so it needs no owner approval

**This is deliberately NOT a gate.** Adding a check that a finding is indexed would be a
protocol change (§12 forbids proposing that as research) and would punish a task whose
finding is genuinely not durable. An index that nobody is required to maintain degrades
quietly, which is what already happened to `KNOWLEDGE.md`.

**What would break: nothing.** It is a new file in a folder that already accepts 108.

---

## The honest weakness of this finding

**70 statements of one fact is also evidence the fact is important**, and restating an
important fact in the folder where it is relevant is not obviously waste — a reader who
opens `interior-ballistics/REPORT.md` should not have to make a second hop to learn the
dimensional gap exists.

**The duplication is defensible. The absence of an index is not.** The fix is additive:
keep the restatements, add the lookup. I am not proposing deletion of anything, and
**nothing here justifies editing a completed task's files** — that is one writer per file.

## Sources

- Measured: `tasking/completed/**` (108 `.md` files), script at `tmp/measure-knowledge.cjs`
  during the run.
- `tasking/completed/code-audit/KNOWLEDGE.md` — "found by an agent doing its own task"
- `tasking/completed/ui-research/KNOWLEDGE.md` §2 — the `tabular-nums` re-derivation
- `tasking/completed/roadmap-synthesis/01-ranked-roadmap.md` — the 5-of-10 measurement
- `.clinerules` §5 rule 1 (blank is visible, wrong is invisible), §12 (research cannot
  change the protocol)