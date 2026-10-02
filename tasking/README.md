# Tasking

The hand-off area between this planning agent, reviewing agents, and any Sub-Agent
doing work. It exists because the most damaging class of defect in this repository has
been an agent editing a file nobody could see changed, or two agents editing one file
at once.

## The two directories

```
tasking/
  pending/      Task briefs. READY, waiting for an agent.
  completed/    Staged output. COPIES, under review, NOT project source.
```

### `pending/` - the briefs

One Markdown file per task, named `task-<ID>-<slug>.md`. These are **real
documentation**: `npm run docs:check` and `npm run lint` both process them, so a
brief containing a path that does not resolve fails the build before any agent
follows it. That is deliberate. A brief that sends an agent to a file that moved is
how work gets done against the wrong target.

### `completed/` - the staged copies

**This directory holds copies of main project files, never edits to them.**

A Sub-Agent working a brief copies the files it will change out of the main tree,
makes the changes in the copies, and saves them here. A reviewing agent then compares
them against the originals and merges the ones that are worth merging.

## Why copies rather than edits

Three reasons, and the first is the one that matters.

1. **Nothing merges by accident.** A merge is a separate, deliberate act by someone
   who has read the diff. An agent that edits `main` directly has already shipped,
   whether or not the change was reviewed.
2. **A review is a real diff.** `git diff` shows what changed in a working tree. A
   staged copy has no history, so the reviewer compares the pair explicitly. That is
   slower, and it is the point: it forces someone to look.
3. **A rejected task costs nothing.** This is the case that makes the model worth it.
   When a Sub-Agent's output is wrong, the main tree was never touched and there is
   nothing to revert.

## Rules for a Sub-Agent working a brief

**Do not edit any file in the main tree.** Not one, not "just a comment", not a
formatting fix. Not even a file you believe is unrelated. That is the entire rule and
everything below is detail.

1. Read the brief in `tasking/pending/`. Read the files it names in the main tree.
2. Make a folder in `tasking/completed/` named after the task ID.
3. **Copy** each file you will change into that folder, preserving its relative path
   from the repository root. `apps/website/src/main.js` becomes
   `tasking/completed/T2/apps/website/src/main.js`.
4. Make your changes **in the copy**.
5. Run your validation against the copy, and say in your report exactly which command
   you ran and what it printed.
6. Write `tasking/completed/<ID>/REPORT.md` - the five-part summary required by
   `.clinerules` §8.
7. Report the list of staged files.

**Preserve the relative path.** A reviewer must be able to tell where a staged file is
meant to land without asking. Flattening the tree destroys that.

**If your change is only additive and touches no main file** - pure research, for
example - you still write to `tasking/completed/<ID>/`, and no copies are needed. Do
not create an empty copy of a file you did not change.

## Why the gates ignore `tasking/completed/`

Both exclusions were measured, not assumed, and both were failures first.

`eslint .` linted a staged `.mjs` copy and failed with
`'unused' is assigned a value but never used`. `npm run docs:check` failed a staged
`.md` for CRLF line endings. Neither file was project code - both were copies of files
under review - so neither failure meant anything.

A staged copy may also be a deliberately partial intermediate state, or may be
mid-way through removing a defect. Either way, failing the build for it is wrong.
`tasking/pending/` is **not** excluded: those are real briefs and are checked.

In `scripts/gates/check-docs.mjs` the exclusion is the **bare directory name**
`'completed'`, not `'tasking/completed'`. `SKIP_DIRS` is compared against each entry's
own name as the walk recurses, so a path string can never match. The first attempt
used the full path and silently did nothing.

## What a reviewing agent does

1. List what the Sub-Agent staged: `git status` in `tasking/completed/`.
2. For each staged file, `git diff --no-index` it against the main-tree original.
   That shows the change as a reviewer should see it.
3. Decide **per file**: merge it, discard it, or send it back with a reason.
4. Merging is a real edit to the main tree. Run `npm run verify` afterwards.
5. Move the brief from `pending/` to `completed/` once fully merged, or delete the
   staged folder if the work was rejected. A rejected brief is worth recording, not
   deleting - `.clinerules` §5 rule 7 asks for trap history.

## Related

- `.clinerules` - binding, especially §1 isolation and §5 rule 10 (scratch goes in
  `tmp/`, not the repo root)
- `.cline/tasks/ledger.json` - the authoritative task ledger and write-set locks
- [pending/](pending/README.md) - the briefs currently available