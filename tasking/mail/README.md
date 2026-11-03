# Agent mail — asynchronous coordination without a human in the loop

Each agent has its own mailbox. **One writer per file, always.** That single rule is
what makes this safe, and it is not negotiable — see "Why not one shared file" below.

```
tasking/mail/
  inbox/<agent-id>.md               YOU write this. ONLY you. Taskmaster reads it.
  outbox/taskmaster/<agent-id>.md   Taskmaster writes this. ONLY it. You read it.
  bulletin/<agent-id>.md            YOU append reusable findings here.
  archive/<agent-id>/               CLOSED agent. Read it; do not write it.
```

Your agent ID is your worktree directory name — you are in
`C:/Users/Justin/.cline/worktrees/<agent-id>/ApexProject`, so your ID is `<agent-id>`.
The taskmaster's ID is `taskmaster`. If you cannot find a worktree directory, yours
is `main`.

---

## Provision your mailbox first

```bash
npm run mail:init -- <your-id>
```

Creates `inbox/<your-id>.md` and `bulletin/<your-id>.md` from template. **Idempotent** —
run it even if the files look present.

This step exists because on 2 Oct an agent discovered mid-session that its inbox did not
exist, and its findings went nowhere. An agent with no inbox is an agent whose work
nobody reads. The cost of running it twice is zero; the cost of skipping it is silence.

## Read the archived mail

`tasking/mail/archive/<agent-id>/` holds the mail of **closed** agents, verbatim.

**Read it.** It is not dead weight — dc408's archived mailbox is the only surviving
record that it found a broken task table, which was then fixed. Archived mail is
excluded from `check-mail`, so it cannot fail your build, but it is still evidence and
often still relevant.

Archiving is a separate, deliberate act:

```bash
npm run mail:retire -- <agent-id>     # move a closed agent's mail out of the live tree
npm run mail:status                   # who is live, who is archived
```

Nothing is deleted. Files are copied verbatim into `archive/<id>/` with a dated banner
recording the retirement, and only then removed from the live tree.

---

## The four messages

Append to your own inbox file. Append-only — never rewrite or delete an earlier
message, because the taskmaster reads the whole file to reconstruct what happened and
when. Your inbox is a ledger, not a status field.

```markdown
<!-- 2026-10-02T14:31:00Z | AGENT 4880a | START -->
**Task:** cartridge-dimensions
**Claimed by moving:** tasking/pending/cartridge-dimensions -> tasking/in-progress/
**Expected outputs:** 4 files, 3 of them CSV
**Reading:** task.json, BRIEF.md, data/reference/README.md
```

```markdown
<!-- ... | AGENT 4880a | STOP -->
**Task:** cartridge-dimensions
**Status:** complete          # complete | blocked | partial
**Written:** 4/4 files, 162 KB
**Moved to:** tasking/completed/cartridge-dimensions/
**tasking:check:** passes
**Key finding:** 229 rows transcribed; 61 dims still empty, listed in REPORT.md §3
**Unresolved:** SAAMI source unreachable for 4 calibers — see NOTES.md
```

```markdown
<!-- ... | AGENT 4880a | BLOCKED -->
**Task:** cartridge-dimensions
**Blocked on:** SAAMI is 403 for automated requests
**Tried:** direct fetch, 2 mirrors, web archive
**I am NOT going to:** guess the missing 4 values
**Decision needed from:** taskmaster — accept gaps, or authorise a paid source?
```

```markdown
<!-- ... | AGENT 4880a | QUESTION -->
**Task:** cartridge-dimensions
**Q:** T4's 138 KB CSV writes to data/, but my write-set says completed/ only.
**Why it matters:** if I write to data/ I break isolation; if I don't, the work
isn't where the schema needs it.
**My reading:** stage it, let review merge.
**Confirm?:** yes/no
```

Every message starts with the HTML-comment header. `check-mail` parses it, and a
message without a valid header is rejected — that is how a half-written message
gets noticed instead of silently misread as an old one.

---

## When to send

**START — before you touch anything.** After claiming the folder, before your first
real edit. This is how the taskmaster learns who is busy and can route questions
instead of dispatching two agents onto the same write-set.

**STOP — after `tasking:check` passes, before you go idle.** Do not send STOP and
then keep editing; the taskmaster may already be reviewing.

**BLOCKED — the moment you would otherwise guess.** This is the important one. If
you are tempted to invent a value to get unstuck, send BLOCKED instead and state
plainly what you will not do. Blocking early is cheap. A plausible invented number is
expensive, because it is indistinguishable from a real one forever after.

**BLOCKED means report and move on — it does not mean stop.** Send it, then claim the
next available task and keep working. You do not wait for a reply; the taskmaster may be
mid-turn, and you are not the last line of defence. Everything you produce is reviewed
before it reaches the main project, so a concern you have documented is not a reason to
go idle. If you finish a task with gaps and write down exactly what is missing, that is
a **successful** task.

**RETRACTION — withdrawing something you yourself wrote earlier.** Name the message and
say why. Do NOT edit or delete the earlier message: that destroys the ledger. This
exists because an agent that has to withdraw its own finding, and cannot, is pushed
toward rewriting history. Both directions are allowed, for any message you sent
yourself.

**QUESTION — only if STOP cannot express it.** Prefer folding a question into STOP.

Then claim the next available task. Do not wait for a reply. The only two things that
genuinely stop you are the task folder being gone (another agent has it) and `pending/`
being empty — report **"queue empty"** and stop, which is a correct result.

---

## Reading your outbox

Check it at the start of every task and whenever you finish one:

```bash
cat tasking/mail/outbox/taskmaster/<agent-id>.md
```

Most messages there will be `ACK` or `NOTE` and need no action. Two are not:

```markdown
<!-- ... | TASKMASTER | REDIRECT -->
**Change of plan.** Write your CSV to completed/<task>/staged/ instead of data/.
Reason: review will merge it, and you are not the agent that decides that.
```

```markdown
<!-- ... | TASKMASTER | COLLISION -->
**Stop.** You and 552f4 are both writing data/generated/json/cartridge_specs.json.
Write to your own completed/ folder and let review arbitrate. Do not merge.
---

## Why not one shared file

A shared `MESSAGES.md` where everyone appends looks simpler and is wrong. Appending is
read-modify-write: two agents reading the file, both appending, and the second write
discards the first agent's message entirely. Not a formatting glitch — the message is
gone, and there is no record that it existed.

That is the same failure this repo already hit twice: concurrent edits to `pending/`
once, and a shared claim queue would reproduce it by construction. One file per agent
means no two writers ever touch the same bytes, so the race cannot happen. It costs
a folder of small files and removes an entire class of silent data loss.

The same reasoning chose a folder move over a status flag for claiming. **A manifest
or a flag you rewrite is a race waiting to happen. A move is atomic. A file only you
write is safe.**

---

## Taskmaster behaviour

Polls every inbox at the start of each turn. On a START it checks the write-set
against other active agents and sends REDIRECT on collision. On a BLOCKED it decides
— the only thing it may overrule is your judgement, never your refusal to guess. On
a STOP it verifies against the filesystem before believing it, and replies `ACK` with
the count of files it confirmed.

**A STOP claiming `complete` with missing outputs is a defect, not a rounding error.**
`check-mail` fails the build on it, because "finished" and "said I finished" being
different things is precisely how twelve tasks vanished with nothing on disk.

---

## Cooperative work

Workers do not message each other. That would make every agent a router, and N agents
needing pairwise channels is N² files to reason about. Instead: **workers report to
the taskmaster, and the taskmaster routes.** One hop, one writer per file, and the
coordination logic lives in exactly one agent.

The taskmaster also holds the only copy of cross-task knowledge. When agent A
discovers something that matters to B, it goes to the taskmaster, who restates it in
B's outbox in B's terms. A's phrasing leaks context B never needed; the taskmaster
writes the version B can act on.

## The bulletin — a group message box

`tasking/mail/bulletin/<agent-id>.md` — **one file per agent, everyone reads all of
them.** You write only yours; you read all of theirs. That is a group board without
a group *file*, which is the whole trick: a single shared `BULLETIN.md` would be
read-modify-write and lose messages exactly like a shared claim queue.

Use it for things that help everyone:

- **A finding worth reusing.** "SAAMI returns 403 to any automated client; use the
  web archive." Saves the next agent an hour.
- **A trap.** "Whoever runs `npm run verify` on Windows: the CRLF warnings are noise,
  but `cmd /v:on /c` is needed to read exit codes."
- **A question with no owner.** Someone may answer it.
- **A disagreement.** Say it here rather than discovering later that two briefs
  assumed opposite things.

The bulletin is read-everyone, write-one, **append-only**, and is NOT a task
channel. If something must be acted on, it is a proposal (below) or a BLOCKED
message — not a bulletin note. A board that acts on its own contents is a queue
that cannot be reasoned about.

---

## Proposals — how the swarm refills its own queue

> **Every agent proposes follow-up work when it finishes a task. Proposals must cite
> evidence. Only research-shaped proposals may run unattended.**

This is the mechanism that replaces asking "what next?". A completed task almost
always names its own successor — `interior-ballistics` concluded that the achievable
product is an interpolation engine over published load data. That conclusion is
evidence for a task. Losing it because the session ended is the failure this fixes.

Write **one file per proposal**, named `tasking/mail/proposals/<slug>.md`. One writer
per file, because the filename is unique — two agents cannot collide on it, so
proposals need no lock and no routing.

```markdown
---
proposal: load-data-interpolation
title: Load-data interpolation engine over published tables
derived_from: tasking/completed/interior-ballistics/05-feasibility-verdict.md
evidence: "The achievable goal is an interpolation engine over published load
  data, with mandatory EMPTY on an unresolvable match."
shape: research
priority: high
write_set:
  - tasking/completed/load-interpolation/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
---

## Why

...what the source task concluded, and what follows from it...

## Do not

...the prohibitions carried forward...
```

### The four rules

**1. Evidence is mandatory.** `derived_from` must be a real file that exists, and
`evidence` must quote it. A proposal with no source is a guess wearing a manifest,
and `check-proposals` rejects it. This is the load-bearing rule: without it,
autonomous task generation becomes confident fiction.

**2. `shape` is either `research` or `change`.** Only `research` runs unattended.
A `research` proposal's write-set must be inside `tasking/completed/<its own id>/`
— output only. **An autonomous swarm must never be able to modify the application.**
The agents can discover what needs changing and write it down; a human decides
whether it changes. `shape: change` proposals are held for you and never dispatched.

**3. Safety-critical work is never auto-generated.** Anything touching reloading
charge weights, powder constants, or pressure interpolation is barred from
`shape: research` regardless of how well evidenced it is. The interior-ballistics
report is explicit that the physics cannot be inferred; an agent generating
follow-ups from it must not produce a task that tries anyway.

**4. A proposal must not re-propose rejected work.** `tasking/review/HISTORY.md`
records rejections. If you find your proposal there, it was already decided — read
why before writing it again.

### Materialising

The taskmaster turns accepted proposals into `tasking/pending/<id>/` with a
`task.json` and `BRIEF.md`. Until then a proposal is only a file. The generator
never invents a task that has no proposal behind it — `check-proposals` fails the
build on any pending task with no matching proposal, so the queue can only ever
contain things someone actually argued for.

### Do not propose to fix the protocol

If your conclusion is "the swarm protocol is broken", that is a BLOCKED message to
the taskmaster, not a proposal. Protocol fixes change how every agent behaves, and
that is a decision for the owner.

---

## Related

- [../README.md](../README.md) — the four-tier protocol, binding
- [../../.clinerules](../../.clinerules) — §11 mail, §12 proposals
- [../review/README.md](../review/README.md) — what happens to your output next

**REDIRECT and COLLISION are binding and outrank your brief.** Your `task.json` was
written before these other agents existed; a collision is new information that the
manifest cannot contain. If a redirect contradicts your brief, follow the redirect
and say so in STOP — the brief needs fixing and that is a finding.