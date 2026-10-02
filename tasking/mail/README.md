# Agent mail — asynchronous coordination without a human in the loop

Each agent has its own mailbox. **One writer per file, always.** That single rule is
what makes this safe, and it is not negotiable — see "Why not one shared file" below.

```
tasking/mail/
  inbox/<agent-id>.md               YOU write this. ONLY you. Taskmaster reads it.
  outbox/taskmaster/<agent-id>.md   Taskmaster writes this. ONLY it. You read it.
```

Your agent ID is your worktree directory name — you are in
`C:/Users/Justin/.cline/worktrees/<agent-id>/ApexProject`, so your ID is `<agent-id>`.
The taskmaster's ID is `taskmaster`. If you cannot find a worktree directory, yours
is `main`.

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

**QUESTION — only if STOP cannot express it.** Prefer folding a question into STOP.

Then go and claim the next available task. Do not wait for a reply; BLOCKED means
you have nothing to work on, and the taskmaster may be mid-turn.

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

## Related

- [../README.md](../README.md) — the four-tier protocol, binding
- [../../.clinerules](../../.clinerules) — §11 this protocol
- [../review/README.md](../review/README.md) — what happens to your output next
```

**REDIRECT and COLLISION are binding and outrank your brief.** Your `task.json` was
written before these other agents existed; a collision is new information that the
manifest cannot contain. If a redirect contradicts your brief, follow the redirect
and say so in STOP — the brief needs fixing and that is a finding.