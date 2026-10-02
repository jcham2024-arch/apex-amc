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

## 2026-10-02 - An agent found a bug in the gate that shipped minutes earlier

**`check-mail` rejected every legal message.** The "stray text" check split the
file on header boundaries and failed if any resulting chunk was non-empty — and the
non-empty chunk is the message BODY. Verified directly:

```
chunks after splitting on headers: ["", "\n**Task:** t\n**Status:** complete\n"]
```

So no agent could use the mailbox at all, and the error text blamed malformed
headers when the headers were fine. I had seen this warning twice while testing and
twice explained it away as noise from the seed files rather than reading what it
said.

Agent 4880a sent a QUESTION diagnosing it precisely - wrong chunk semantics, headers
located correctly, bodies never consumed, and a named fix. It also ran the test
against a throwaway inbox rather than editing a real mailbox, which is the isolation
rule working as intended. The load-bearing STOP check had passed throughout, which
is why the bug was invisible to the tests I ran.

**Second bug in the same gate, found by running my own reply through it:** the header
regex required an agent id after `TASKMASTER`, so every reply I wrote was malformed
by definition. Nothing had ever sent one before. Fixed by making the id optional for
taskmaster messages - the outbox directory already says who a reply is for.

**The correction 4880a filed matters more than the bug.** It retracted its own
earlier claim that `check-tasking.mjs` undercounted `pending/` and that it was "a
race, not a measurement error" - because its probe sat under `tmp/` with a broken
relative import, so it measured a different module graph than the real gate. The
manifest-lookup defect in that same report was real. A wrong finding retracted by
its author, with the reason, is the system working correctly.

**Precautionary:** the first safety-bar false positive was my own proposal, blocked
for containing the phrase "charge weight" in its own `## Do not` section. The scan
now excludes prohibitions before matching, so a gate that punishes honesty makes
honesty impossible.

---

## 2026-10-02 - The swarm refills its own queue

**Autonomous task generation, with three hard bars.** An agent finishing a task
writes `tasking/mail/proposals/<slug>.md` citing the file and quotation that
justify it. `check-proposals` enforces:

1. **`derived_from` must exist.** Ungrounded work never reaches `pending/`. This is
   the rule the whole scheme rests on - without it, generation is confident fiction
   with a plausible write-set.
2. **`shape: research` writes only inside its own `completed/` folder.** An
   autonomous swarm is structurally unable to modify the application. Agents can
   discover what needs changing; a human decides whether it changes.
3. **Safety-critical topics never run unattended** - charge weights, powder
   constants, burn rates, load synthesis - however well evidenced.

Plus: every new pending task needs a proposal behind it (pre-existing ones
grandfathered), and no proposal may collide with in-flight write-sets.

All three verified by probe, not asserted: a `packages/ballistics-core/src/`
write-set is refused, a burn-rate-fitting proposal is refused, and a proposal citing
a non-existent file is refused.

**The group box is a directory, not a file.** `tasking/mail/bulletin/<agent>.md` -
everyone reads all, one agent writes each. A shared `BULLETIN.md` would be
read-modify-write and lose notes exactly like the shared claim queue. It is not a
task channel: anything actionable is a proposal or a BLOCKED message, because a
board that acts on its own contents is a queue nobody can reason about.

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

**The lesson is the reusable part: when two measurements of the same thing
disagree, suspect the instrument first.** Seven confident answers, seven wrong
ones, and I published one of them before reproducing it.

---

## 2026-10-02 - check-mail.mjs rejects every legal message (agent: 4880a)

**The mailbox cannot be used.** `check-mail.mjs` tests a parsed message with:

```js
after.split(/<!--[\s\S]*?-->/).some((c) => c.trim())
```

`after` is the text from the first header onward. Splitting on headers yields
`[leading][body1][body2]`, so **every non-empty message body lands in a chunk that
fails the test.** The gate is satisfied only by a message with an empty body — the
exact opposite of its purpose.

Constructed proof, run against a throwaway inbox so no real message was disturbed:

| Content | Result |
|---|---|
| header only, no body | passes |
| the README's own minimal STOP (header + `**Task:** x`) | **fails** |
| one-line NOTE | **fails** |

The split finds the headers correctly. It simply never discards the bodies, so the
payload is misread as stray text. The error message ("a message was written but its
header is malformed") is **actively misleading** — the headers are fine.

The load-bearing check in that gate — a STOP claiming `complete` with a missing
output file — passed correctly. Only this parse check is broken.

**Fix shape:** parse into messages instead of testing chunk emptiness. Match every
header and treat the text between header *N* and header *N+1* as body *N*.

Note this is the *third* instance of the same family in this repo: a gate that
verifies structure but not the thing it claims to verify. Here it produced a
**false negative on the common case** — the opposite of the earlier gates, which
passed wrongly. Both directions waste agent turns.
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