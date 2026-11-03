# NOTES — for the planner and the review agent

## 1. `tasking:check` cannot verify ANY completed task. This blocks the whole swarm.

`npm run tasking:check` fails, and `npm run verify` therefore exits 1, **because of a bug in
the gate — not because of any task's output.** All five completed tasks are reported
identically:

```
x tasking/completed/ballistics-oracles/     has no manifest in pending/
x tasking/completed/cartridge-dimensions/   has no manifest in pending/
x tasking/completed/exterior-ballistics/    has no manifest in pending/
x tasking/completed/interior-ballistics/    has no manifest in pending/
x tasking/completed/trademark-clearance/    has no manifest in pending/

tasking  FAILED
```

**Every one of those folders does contain a `task.json`.** Verified directly:

```
ballistics-oracles: manifest=True
cartridge-dimensions: manifest=True
exterior-ballistics: manifest=True
interior-ballistics: manifest=True
trademark-clearance: manifest=True
```

### Cause

`scripts/gates/check-tasking.mjs` builds its manifest map from **`pending/` only** (line 62),
then resolves every `completed/` task against that same map (line 161):

```js
const manifest = tasks.get(id);
if (!manifest) {
  fail(`tasking/completed/${id}/ has no manifest in pending/, so its declared outputs `
     + 'cannot be verified.');
}
```

Claiming a task means **moving it out of `pending/`**. So the act of claiming a task is
precisely what makes its manifest unfindable. The gate therefore fails for every task that
has actually been done, and passes only for tasks nobody has started.

`in-progress/` is not read at all:

```
gate sees manifests from pending/ only: ammoseek-coverage, brand-rename, cartridge-dimensions,
  code-audit, docs-audit, handgun-coaching-feasibility, shot-group-taxonomy, ui-research
in-progress/ tasks the gate IGNORES: exterior-ballistics
```

### Why it matters more than a normal red gate

This is the exact defect the new protocol was written to eliminate. The old gate could not
see `completed/` output because the folder was gitignored. The replacement gate cannot verify
`completed/` output because it only remembers `pending/`. **The check that exists to make
"done" a checkable claim is itself unable to check a done task** — so the swarm cannot reach
a green `verify` at all once two agents finish, which has already happened.

### Suggested fix (NOT applied — `scripts/` was outside this task's write-set)

Populate the manifest map from `pending/`, `in-progress/` **and** `completed/`. Reading
`in-progress/` needs no `.gitignore` change (it is ignored for git, but the gate reads the
filesystem). Roughly:

```js
for (const root of [PENDING, IN_PROGRESS, COMPLETED]) {
  for (const dir of taskFolders(root)) { /* load task.json into `tasks` */ }
}
```

**Claiming this fix is worth doing before more tasks are dispatched**, since it will keep
toggling as agents move folders. I did not touch it — another agent's file, and
`.clinerules` §1 says report, do not fix.

## 2. Other observations

- **Stale baseline number.** `AGENTS.md` records "exit 0, 235 passing". Measured today:
  **215** core, plus 7 (encoding) and 13 (bullet suites). Worth correcting in `AGENTS.md`,
  which asks to be updated when a baseline it states changes.
- **`tasking/pending/` was not edited**, per the one rule. The `**Model:**` line in
  `BRIEF.md` therefore still reads `[record on start]`; the model actually used is recorded
  in this task's `REPORT.md` instead.
- **The T6 brief's Definition of Done is written for the old layout.** It says
  "`git status --porcelain` shows changes ONLY under `tasking/completed/T6/`". The folder is
  now `tasking/completed/exterior-ballistics/`, and output is git-tracked, so that clause no
  longer describes reality. Other briefs in `pending/` may share it.

## 3. A factual error in this task's own REPORT.md, found and corrected

An earlier teammate run finished *after* this task was delivered, ending on a message reading
"I need to correct the D02/D03 dataset lists I abbreviated inaccurately" — it was interrupted
before saving anything. That warning turned out to be **correct**, and checking it found a real
error in the delivered report.

**What was wrong.** `REPORT.md` grouped the 21 failing datasets by which oracle clause broke
them, and two rows were wrong:

| Row | Claimed | Actual, from the table |
|---|---|---|
| D02, D03, D20 | "no stated uncertainty" (part 2) | D02 and D03 carry `stated_uncertainty = **yes**` — they fail **part 1 only**. D20 is `unverified` on both. |
| 12-row list | included D10 and D18 under "no uncertainty" | D10 is `unverified`; D18 fails part 1, not part 2. |

**Why it matters, not just for tidiness.** D02 and D03 are the two datasets carrying most of
the usable measured data in the whole survey, and the report's framing implied they had no
error bar. They **do** — they fail only because the papers never publish the atmospheric
values. A reviewer acting on the wrong grouping would have discarded two good papers for the
wrong reason, and would have missed the single most consequential open question in the task:
**if T2 rules that a stated measurement method suffices, D02 and D03 both flip to ORACLE.**

**Fixed.** The grouping is now derived from the verdict table **by column name** rather than
by prose, and §3.1 of `REPORT.md` prints all 22 rows' raw test cells so the grouping can be
checked without re-running anything. The correction is stated in the report itself rather than
silently applied.

**Worth noting as a process point:** the correction came from an agent that had already
"completed" and whose work was believed lost. Had its final message not been preserved, a known
factual error would have shipped. The lesson matches `tasking/README.md`'s own argument — a
result that only exists in a chat window is a result that does not exist.