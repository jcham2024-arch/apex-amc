# BRIEF — Improve the agentic swarm framework

**Task id:** `swarm-improvement` · **Priority:** standing — this slot is always available.
**It regenerates itself.** If you finish and nothing replaces it, you created the
exact failure it exists to prevent. Run `npm run tasking:restock`.

## Why this task exists

The primary goal is finishing ApexProject, but the framework built to do it is portable and will move to other projects. An agent that finishes and finds an empty queue is a swarm that has stopped: work completed, nothing generated, and the next thing needs the owner to ask. This slot exists so that never happens, and so that the framework keeps getting better while the project gets finished. It is the one task whose subject is HOW we work rather than WHAT we are building.

## Before you start

1. Read `.clinerules` — §10 swarm, §11 mail, §12 proposals, §13 this slot.
2. Read your `task.json`. Every file in `required_outputs` must exist or it is not done.
3. Read `tasking/mail/bulletin/*.md` — do not research what another agent already found.
4. Read `tasking/review/HISTORY.md` — do not re-propose something already rejected there.
5. Claim it: `mv tasking/pending/swarm-improvement tasking/in-progress/`
6. Append START to your inbox.

## Scope

- FIRST: read tasking/review/HISTORY.md in full, and tasking/mail/bulletin/*.md. Do not re-investigate something already recorded there or already proposed.
- Pick ONE dimension of the framework and go deep on it. Standing means recurring, not endless - a shallow survey of all dimensions helps less than one real finding.
- The four dimensions, roughly in order of value: (a) RELIABILITY - which failures can still happen that no gate catches, and what negative test would catch each; (b) SPEED - where agents lose time, measured rather than guessed; (c) KNOWLEDGE - what the swarm keeps losing between sessions, and what would make it durable; (d) PORTABILITY - what in this framework is specific to ApexProject and would break on another project.
- For PORTABILITY specifically, the framework is meant to move to other projects. Produce something that would actually travel: the minimal set of files and rules another repo needs, what must be renamed, and what is irreducibly ApexProject-specific. A portability note nobody can apply is not a deliverable.
- Look OUTSIDE this repo too. Read how other multi-agent systems handle task claiming, context economy, memory and evaluation. Cite sources. An approach already solved elsewhere should be adopted, not reinvented.
- Then MEASURE something. A claim about the swarm's behaviour is a hypothesis until it is counted. Counts agents' idle turns, duplicated work, gate false-positives, or proposals that sat unmaterialised.
- End with proposals. Every concrete improvement becomes a proposal file citing the file and quoting it. This task's output is knowledge; proposals are how knowledge becomes work.

## Do not

- Do not build ApexProject features here. The queue in pending/ exists for those. This task improves the framework or researches the framework's own problems, and touches neither the application nor the data.
- Do not change the protocol. A change to .clinerules, to tasking/README.md, or to a gate alters how every agent behaves, including agents on other projects. That is the owner's decision: write a proposal with shape: change and say what would break.
- Do not write a broad survey. Depth on one dimension, cited, beats coverage of all four. 'Consider using X' is not a finding; 'X does Y, we do Z because W, measured at N' is.
- Do not propose work that duplicates a task already in pending/ or in-progress/. Check first.
- Do not restock this slot yourself and do not edit the restock script. Run `npm run tasking:restock`; that is all.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-finding.md`
- `02-measurement.md`
- `03-portability-notes.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and unresolved issues in `NOTES.md`.

## When you finish — the important part

1. `mv tasking/in-progress/swarm-improvement tasking/completed/swarm-improvement-$(date +%Y%m%d)`
   **Note the suffix.** This slot rotates, so `completed/swarm-improvement` may already exist from a
   previous rotation and `mv` will fail with "Cannot create a file when that file already
   exists" — a real trap, hit while testing this. Datestamping keeps every rotation's
   output instead of overwriting or blocking on the previous one.
2. Append STOP to your inbox with the real file count.
3. **Write proposals.** Every improvement you found but could not apply becomes a
   proposal file, citing the file and quoting it. A finding with no proposal never
   becomes work.
4. Append reusable findings to `tasking/mail/bulletin/<your-id>.md`.
5. **Run `npm run tasking:restock`.** If this slot is not back in `pending/`, the
   next agent to finish will find an empty queue.
6. Claim whatever else is in `pending/`.
