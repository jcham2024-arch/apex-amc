# BRIEF — Continuous code health - functionality, design, efficiency, commentary

**Task id:** `code-health` · **Priority:** standing — this slot is always available.
**It regenerates itself.** If you finish and nothing replaces it, you created the
exact failure it exists to prevent. Run `npm run tasking:restock`.

## Why this task exists

The owner asked for a standing improvement pass over the code itself, not a one-off refactor: functionality, design, efficiency, detailed commentary, and staying current with the practices that fit what this project actually is. They also said the OOP-factory request was only an example, and that a change which does not improve the code should not be made. So this slot's job is to find what genuinely improves the code and to decline, explicitly, what does not - a pass that can only find work is a pass that will eventually invent some.

## Before you start

1. Read `.clinerules` — §10 swarm, §11 mail, §12 proposals, §13 this slot.
2. Read your `task.json`. Every file in `required_outputs` must exist or it is not done.
3. Read `tasking/mail/bulletin/*.md` — do not research what another agent already found.
4. Read `tasking/review/HISTORY.md` — do not re-propose something already rejected there.
5. Claim it: `mv tasking/pending/code-health tasking/in-progress/`
6. Append START to your inbox.

## Scope

- FIRST read tasking/review/LESSONS.md, then tasking/review/FIX-BACKLOG.md, then every KNOWLEDGE.md in tasking/completed/. Do not re-raise a settled finding, and do not re-open one that was REJECTED without new evidence - the backlog records why each was rejected so it stops being re-raised every few weeks.
- Pick ONE dimension per rotation and go deep. Functionality (does it do the right thing), design (is the structure right), efficiency (is it doing avoidable work), commentary (does it explain WHY rather than restate the code). A shallow sweep of all four finds less than one real finding.
- For FUNCTIONALITY, hunt the defects that have actually happened in this repo, because they recur: a loop silently truncated by a missing brace, a const declared below the loop that calls it, a gate that reads files when it should check deployed output, and a write path that parses CSV naively. Three of the four were found by agents, not by gates.
- For EFFICIENCY, measure before claiming. An unmeasured performance claim is an opinion with a number attached. State what you measured, on what input, and what the result was - including when the answer is that there is no problem here.
- FOR COMMENTARY: the bar is that a comment explains WHY a non-obvious decision was made. Flag comments that restate the code, comments that are now wrong, and - the pattern that has cost this repo repeatedly - comments describing a GUARANTEE, which is a hypothesis nothing enforces. The CSP defect was every gate passing because every gate read the file while production served no policy at all.
- FOR BEST PRACTICES: cite a source for every one. Node docs, MDN, or a named standard - not recollection. A practice asserted from memory is cargo-cult, and cargo-cult is how a codebase ends up with a factory wrapping a pure function because someone said OOP was better. If you cannot source it, either drop it or record it as a question, not a recommendation.
- State plainly what you examined and found HEALTHY. A pass that reports only problems gives no evidence about the rest, and 'I checked X and it is fine' is a result.
- End with proposals for anything worth changing, each citing the file and quoting the evidence.

## Do not

- Do not edit the application. Produce findings, diffs and proposals; a human applies them. Same rule as every other research task.
- Do not recommend a pattern because it is fashionable. The owner said it directly: if a change does not improve the code, do not do it. Applying OOP to a deliberately functional module is a regression with extra indirection, and saying so is part of the deliverable.
- Do not re-run a negative test you have already run. It is queued as its own task; check pending/ first.
- Do not weaken, disable or reorder a gate to make something pass. A red gate is information.
- Do not treat a metric as a verdict. Fewer lines, more classes, or more abstraction are not improvements by themselves - only a stated problem being measurably better is.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-finding.md`
- `02-verified-clean.md`
- `03-sourced-practices.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and unresolved issues in `NOTES.md`.

## When you finish — the important part

1. Move your work to `tasking/completed/code-health`. **Check first whether that folder
   already exists** — if it does, this is rotation 2 or later, and you must not
   overwrite the previous rotation.

   The rule: **the folder name must equal the `id` in your `task.json`.**
   `npm run tasking:check` enforces it, because the folder name is the lock and
   everything else in the framework matches a folder by name. **Do NOT datestamp the
   folder.** An earlier version of this brief said to, and it was wrong on both counts:
   it fails the gate on rotation 1, and it violates the id rule on every rotation. A
   rotation-1 agent followed it, hit both errors, and recorded the analysis in
   NOTES.md §3 — which is where the correct rule below comes from.

   So: if `completed/code-health` is free, use it. If it is taken, do not rename and do not
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
