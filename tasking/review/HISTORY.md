# Swarm history

A narrative record of what the swarm did and why. **Not state** - the folder tree is
state, and `tasking:check` reads it. This is the part that would otherwise be lost:
why a decision was made, what an agent refused to do, what the evidence was.

Append-only. Never edit an earlier entry to correct it; add a new one. `.clinerules`
§5 rule 7 asks for trap history, and this is where it lives.

---

## 2026-10-02 - Foundation

**The brand was changed to a placeholder.** `APEX AMMUNITION` is a live USPTO
registration (Reg. 5391055, IC 013, Apex Ammunition LLC) and `apexmunition.com` is an
operating storefront in the same category. `wrangler.toml` `name` was deliberately
left alone, because renaming it would not rename the deployed Cloudflare Pages
project and would break deploys.

**The CSP was found to have never been served.** `_headers` was folded across eleven
lines and split into three `/*` blocks; Cloudflare Pages parses `[name]: [value]` as
one line and starts a NEW block at each `/*`. Production served HTTP 200 with
correct HTML and no policy at all. Every gate had passed, because every gate read
the file rather than the deployed response. `check-website-build.mjs` now fails the
build on either form.

**`.clinerules` §1 stated a stale stage count.** Removed the number rather than
replacing it: a number in a rules file is trusted, and a wrong one is worse than none.
The count must be measured from `package.json`.

---

## 2026-10-02 - Inter-agent mail, and two bugs the new gate immediately caught

**Agents could not talk, and their work was invisible.** Four of five sessions ran
in separate git worktrees under `C:/Users/Justin/.cline/worktrees/`. Between them
they had written ~230 KB of real research into their own `tasking/completed/`, all
of it uncommitted. `git status` in the main tree showed nothing, because from
`C:/Cline` those paths do not exist. Hours passed before this was noticed.

So: `tasking/mail/`, one file per agent, one writer per file. Not a shared
append-only log - appending is read-modify-write, and two agents appending at once
means one message is silently destroyed with no trace. Verified by probe, same as
the `tasks.json` race. The same reasoning already chose a folder move over a status
flag; a file only one agent writes completes the pattern.

**`tasking:check` had been reading the wrong folder, and hiding a bug.** It looked
for manifests only in `pending/`, but a completed task carries its own manifest
because claiming is a folder move. So every finished task reported "no manifest" -
the exact "finished and abandoned are indistinguishable" failure the gate exists to
prevent, reproduced by its own lookup. Fixed to scan all three tiers; it now
verifies 28 declared outputs across 6 completed tasks.

**Two tasks were claimed twice.** `cartridge-dimensions` sat in both `pending/` and
`completed/`, byte-identical manifest - a copy, not the move. `ammoseek-coverage`
had a one-row CSV in `completed/` with no manifest while its brief sat in
`in-progress/`. Both would have meant two agents on one task. The gate now fails on
any id appearing in two tiers.

**`completed/` had six folders and `pending/` had twelve, which did not add up.**
Nothing had been lost - work had been moving between tiers the whole time - but the
counts never reconciled because the gate could not see the moves. Worth noting the
gate was only ever able to check `pending/`, which is the one folder whose contents
change last and are then frozen.

---

## 2026-10-02 - The swarm protocol was violated twice, and rebuilt

**First violation: concurrent edits to `pending/`.** Several agents edited task
briefs simultaneously. One brief was corrupted into a single collapsed line, another
was renamed out from under a third agent, and `tasks:check` went red on a dangling
path. Recoverable only because git had the prior state.

**Second violation, worse: finished work that did not exist.** Twelve tasks were
dispatched. All finished. None wrote anything to `completed/`, and nothing on disk
could distinguish finished from abandoned. Compounding it, `completed/` was
gitignored — so even written output would have evaporated when the session closed.

**Root cause, in both cases: the protocol was prose.** It described what to do but
never stated, per task, what must exist at the end. An agent that produced its answer
and stopped had satisfied every written instruction.

**The fix was to make the instruction data.** Each task is now a folder:

```
task.json   manifest - write-set, required outputs, prohibitions. Enforced by
            npm run tasking:check, which verifies every declared output exists.
BRIEF.md    context - what and why, in prose. No gate can enforce prose.
```

Claiming a task means **moving its folder out of `pending/`**. That move is the lock,
and it was chosen over a shared `tasks.json` queue for a measured reason: read-modify-
write on one shared file has no lock, and two agents claiming at once produces a lost
update where one task reverts to `pending` and a third agent takes it. The filesystem
cannot produce that failure.

**`completed/` no longer ignores research output.** A staged CODE copy is a proposal
and is ignored. Research output is the only durable record of what was learned and
there is nothing to merge it into. Verified with a probe: `REPORT.md`, `.md`, `.csv`
and `task.json` commit; `.ts` and `.mjs` do not.

---

## 2026-10-02 - Claiming a task makes it unverifiable (agent: cartridge-dimensions)

**The protocol as written cannot pass its own gate.** `README.md` says claim by
moving `pending/<task>` → `in-progress/<task>`, and move the finished folder to
`completed/<task>`. But `check-tasking.mjs` builds its manifest map **only from
`pending/`** (lines 62-122) and fails any `completed/` folder whose manifest it
cannot resolve:

```
x tasking/completed/cartridge-dimensions/ has no manifest in pending/, so its
  declared outputs cannot be verified. A finished task whose brief is missing
  is indistinguishable from an abandoned folder.
```

So the brief folder must **stay in `pending/`** for the work in `completed/` to be
verifiable. That is the opposite of what "the move is the lock" implies, and the two
instructions contradict each other. Confirmed independently: a throwaway folder
`completed/probe-test/` turned the gate red on its own.

**This is not one agent's problem — four agents hit it identically**
(`ballistics-oracles`, `cartridge-dimensions`, `interior-ballistics`,
`trademark-clearance`). One resolution, available to every agent, is to leave the
manifest in `pending/` and put only the *work* in `completed/`
(`git checkout -- tasking/pending/<task>/` restores it after the claim move).

**The apparent "undercount of `pending/`" was MY measurement error, not a defect.**
For a long stretch I reported that the gate printed `1 task(s) in pending/` while
8 valid manifests sat on disk, and I wrote that it was reproducible and "not a
race". **Both claims were wrong.** The cause: I was running the gate while other
agents were actively claiming tasks, and each claim is a folder `mv` out of
`pending/`. My five "consecutive runs" were five snapshots taken seconds apart
during a burst of claims. With the swarm quiet it reports correctly:

```
12 task(s) in pending/, 11 ready
6 task(s) in completed/, 28 declared output(s) verified
tasking verified          (exit 0)
```

**Why I got it wrong, and the trap worth recording.** Three things misled me in
sequence, and each is in this repo's own trap list:

1. **I instrumented a COPY placed under `tmp/`.** Its `import ... from
   '../shared/data.mjs'` resolved to `tmp/scripts/shared/data.mjs`, which does not
   exist. So my "probe" was measuring a *different module graph* than the gate and
   I trusted its output. **A probe must run with the real module paths.**
2. **I used `Set-Content` to create the probe**, which re-encoded the file and I
   then attributed its behaviour to the gate.
3. **I compared against PowerShell listings taken at a different instant** from the
   Node run. Two observations, two moments, one conclusion.

The actual fix was to patch **in place**, next to the original
(`scripts/gates/_probe_tasking.mjs`, same directory, so the relative import
resolves identically), hoist `taskFolders(PENDING)` into a named variable, and log
its length and members at the moment the loop consumes it. That showed the real
list, and the count was correct all along.

**The genuine, reproducible defect is the other one** — the manifest must remain
in `pending/` for `completed/` to verify — and that one *is* real and still stands.

**Consequence for the swarm:** `npm run verify` could not reach exit 0 while
agents were mid-flight, for reasons that had nothing to do with any agent's work.
It now passes `tasking:check`; `npm run lint` is currently red on
`scripts/gates/check-tasking.mjs` (3 unused-vars errors) from another task's
in-flight edit to that same file.

**Method note — this is the important part.** Seven attempts to explain the
undercount produced seven confident answers, and **every one was wrong**, including
the one I published to this file. Each was disproved by the next measurement. What
finally worked was not reasoning but *instrumenting the real code in its real
location*. Two of my intermediate measurements were mutually contradictory, and I
treated that as a mystery rather than as evidence that my *measurement setup* was
wrong — which is what it was. **When two measurements of the same thing disagree,
suspect the instrument before the system, and never publish a root cause you have
not reproduced.**