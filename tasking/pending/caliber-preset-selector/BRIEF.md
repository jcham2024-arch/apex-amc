# BRIEF — A searchable caliber dropdown covering every cartridge we hold

**Task id:** `caliber-preset-selector` · **Priority:** highest
**Grounded in:** `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`

## Why this task exists

The owner asked for all caliber presets and said a dropdown beats a set of buttons. A dropdown over 229 cartridges is unusable without search, and search is where the alias problem lives: our names are abbreviated (9 Luger, .22 LR, .223) while users type what they know.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/ammoseek-coverage/KNOWLEDGE.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/caliber-preset-selector tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Specify the selector precisely: type-ahead matching, keyboard navigation, ARIA combobox semantics, and what happens on a cartridge with no data. That last one matters most - 6 dimensional columns are 0/229, so almost any selection lands on a mostly-empty record and the selector must not pretend otherwise.
- Define the UNKNOWN state before the known one, per ui-research: a blank reads as zero. Specify what shows when a cartridge has no dimensions, no powder data and no load data. This is the most important part of the task.
- Specify search across aliases WITHOUT merging distinct cartridges. Define what must not be merged and give real near-collisions from our own dataset, not invented ones.
- Say how the list stays current. It comes from data/seeds/cartridge_specs/*.csv and the family-defect audit is still in flight - state how the selector behaves while that is unresolved.
- Note the a11y trade-off: this replaces buttons, and a native <select> over 229 options has no search. Compare native select, custom combobox and datalist, and recommend one with reasons.

## Do not

- Do not edit apps/website/. Produce the specification.
- Do not normalise any stored cartridge name. That is a data migration and a human decision.
- Do not design the selector without specifying the empty state. A selector over mostly-empty records that looks fine with full data is the defect ui-research already found once.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-selector-spec.md`
- `02-search-and-alias-rules.md`
- `03-unknown-state.md`
- `04-a11y-options.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/caliber-preset-selector tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.

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
