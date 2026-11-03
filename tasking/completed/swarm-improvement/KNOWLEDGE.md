# KNOWLEDGE — swarm improvement, rotation 1

Task `swarm-improvement`. **Model:** default model, fresh instance.

---

## 1. The swarm writes one folder per task and never joins them

**Measured:** 108 `.md` files, **793,542 bytes**, **zero** index files.
One fact (`0/229 populated`) restated **70 times across 27 files**.

> **"An index-shaped proposal in the swarm, and two agents proposed the same thing
> without either being able to see the other's."**

`roadmap-synthesis` proposed `findings-ledger`. `unknown-state-design` independently
recorded the same fact 11 times in one file. **Both are duplicates of work nobody has
done.** Proposals live in a folder nothing reads before starting a task.

**The generalisable rule:** a per-agent write-set is correct — it is what makes
concurrency safe. **But the swarm is measured on recall, and nothing joins the
folders.** So the cost of not knowing is paid by reading everything: 794 KB per session,
forever.

## 2. Duplication is the index's failure mode, not sloppiness

70 copies of one fact is what "remember this" looks like when nothing can look anything
up. **And it is defensible** — a reader who opens `interior-ballistics/REPORT.md` should
not have to make a second hop to learn the dimensional gap exists.

**So the fix is additive: keep the restatements, add the lookup.** Do not propose
deleting anything, and never edit a completed task's files — one writer per file.

## 3. `KNOWLEDGE.md` is a naming convention, not a retrieval mechanism

13 of 19 tasks have one. The metric that matters is not the count — it is **whether an
agent working a problem can find the relevant finding in one step**, and that number is
**zero**.

`KNOWLEDGE.md` helps only an agent that already knows which folder to open, which is
precisely the agent that does not need it.

## 4. An impact claim is a measurement, not an inference

**I made this error in `roadmap-synthesis` and caught it here.** I wrote *"9mm sits
under the wrong heading for every visitor"* — inferred from a column name. Agent `4880a`
had already checked and contradicted it.

```
Select-String apps\website\src\main.js -Pattern 'cartridge|family|pistol'
  -> 0 matches
```

**The data defect is real; the visible impact is nil.** The rows are still `family=rifle`
and the app never renders families.

**Rule:** before claiming what a user sees, grep the rendering code. A correct data defect
with no rendering path is **latent**, and calling it visible overstates it.

## 5. `HISTORY.md` is the highest-value file in the framework

It records **why** a decision was made, what an agent refused to do, and what the evidence
was. It has caught real bugs twice before this task: the restock-busy bug (a completed
rotation counted as busy, so the slot never returned) and the `check-mail` parse bug.

**Reading it first is not ceremony.** `.clinerules` §10.4 tells agents to read their task,
not the repo — `HISTORY.md` is the exception that prevents re-proposing a rejected idea.

## 6. On adoption elsewhere: do not copy `KNOWLEDGE.md` on day one

The framework is genuinely portable — measured **2 mentions of "apex" across ~1,500
framework lines**. But it has two known breakages, both documented because they broke
here first:

1. **`KNOWLEDGE.md` as a required output** produces empty or duplicated files when the
   project is young. Adopt it at ~5 tasks, when the recall cost is visible.
2. **The standing slot needs `npm run tasking:restock`** at the end of every session that
   used it. Forget it and the swarm stops — which is the exact failure the slot exists to
   prevent.

**Total migration: ~1,512 measured lines, an afternoon, and one command per session.**

## 7. A trap that cost this rotation real time

**Estimating a line count instead of measuring it.** I wrote "~1,100 lines" for the
framework; the measured total is **1,512**. I had guessed the docs were larger than the
gates; it is the reverse.

The repo's own rule applies without exception — **`.clinerules` §1: measure, never quote
from memory.** It cost nothing here because I checked, but it is the same family as every
trap in the trap table: a plausible number stated without evidence.

## 8. The one thing I could not measure

**Idle turns.** The brief asks for agent-time accounting and there is no telemetry for
it. `HISTORY.md` gives one data point — *"Hours passed before this was noticed"* for the
worktree-visibility bug — and it is unquantified.

**This is itself the finding for dimension (b) SPEED:** the swarm has a known costliest
failure (an agent idle with an empty queue) and **no instrument that could detect it.**
Proposed as a separate `shape: change` note; implementing telemetry changes how every
agent behaves and is the owner's call.