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

**Provision your mailbox:** `npm run mail:init -- <your-id>`. It is idempotent, so run it even if the file looks present. An agent with no inbox is an agent whose findings nobody reads. Archived mail from closed agents is in `tasking/mail/archive/` — worth reading before you rediscover their findings.
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

1. Move your work to `tasking/completed/swarm-improvement`. **Check first whether that folder
   already exists** — if it does, this is rotation 2 or later, and you must not
   overwrite the previous rotation.

   The rule: **the folder name must equal the `id` in your `task.json`.**
   `npm run tasking:check` enforces it, because the folder name is the lock and
   everything else in the framework matches a folder by name. **Do NOT datestamp the
   folder.** An earlier version of this brief said to, and it was wrong on both counts:
   it fails the gate on rotation 1, and it violates the id rule on every rotation. A
   rotation-1 agent followed it, hit both errors, and recorded the analysis in
   NOTES.md §3 — which is where the correct rule below comes from.

   So: if `completed/swarm-improvement` is free, use it. If it is taken, do not rename and do not
   merge — **append your findings to the existing outputs with a dated section and say
   in STOP that you were rotation N.** One folder per task id, permanently; history
   accumulates inside it rather than multiplying into id/folder mismatches.
2. Append STOP to your inbox with the real file count.
3. **Write proposals.** Every improvement you found but could not apply becomes a
   proposal file, citing the file and quoting it. A finding with no proposal never
   becomes work.
4. Append reusable findings to `tasking/mail/bulletin/<your-id>.md`.
5. **Run `npm run tasking:restock`.** If this slot is not back in `pending/`, the
   next agent to finish will find an empty queue.
6. Claim whatever else is in `pending/`.

## If you get stuck - read this before you stop

**You are working in a sandbox. Everything you write is reviewed before it reaches the
main project.** A concern is not a reason to stop.

Do **not** halt because:

- a file you want is outside your write-set - write it up in `NOTES.md`, work around it
- `npm run verify` is red - that is a shared gate; your completion is judged by
  `npm run tasking:check`, which is scoped to **your** declared outputs. Note the
  failure and keep working.
- a brief is wrong or contradicts another document - say so in your report. Fixing
  briefs is the planner's job, and reporting it is the whole contribution.
- a value is unknown - **leave it EMPTY.** An honest gap beats an invented number.

Do **not** halt when you finish with gaps. "I completed most of this and documented
exactly what is missing and why" is a **successful** task. An empty folder with an
explanation is not.

The only two things that stop you: the task folder is gone (someone else claimed it), or
`pending/` is empty - report **"queue empty"** and stop. Both are correct results.

Never weaken a gate and never run `handoff:accept`. Not for permission - those are
judgements about production, which is what the review step is for.
