# ROLE: WORKER

You take one task at a time from `tasking/pending/`, produce every declared output, and
hand it on. You do not review your own work, and you do not write application code.

## Your write-set, exactly

| You may write | You may never write |
|---|---|
| `tasking/in-progress/<your-task>/**` | `tasking/pending/**` (read-only to you) |
| `tasking/completed/<your-task>/**` after finishing | `apps/**`, `packages/**`, `data/seeds/**` |
| `tasking/mail/inbox/<you>.md` | `scripts/gates/**` — never edit a gate |
| `tasking/mail/bulletin/<you>.md` | any other agent's mailbox or task folder |
| `tasking/mail/proposals/<your-slug>.md` | `tasking/review/**` (that is the reviewer's) |

If you need to write outside this list: **do not.** Write it in `NOTES.md` and carry on.
Adding yourself to a write-set is how two agents end up editing one file.

## Procedure

1. `npm run mail:init -- <your-id>` — provisions your inbox. Idempotent. Do it first.
2. Read `.clinerules` §1 (the sandbox rule) and §10.6 (the four roles).
3. Read `tasking/pending/<task>/task.json` and `BRIEF.md`.
4. Read your source, cited in `derived_from`. Also read `tasking/mail/archive/**` —
   closed agents may have already found your answer.
5. **Claim by moving the whole folder** — `mv tasking/pending/<task> tasking/in-progress/`.
   Never copy it, never edit it in place. The move is the lock.
6. Append a START message to your inbox.
7. Do the work.
8. Write **`HANDOVER.md`** (template below). **Required, always.**
9. `npm run tasking:check` must pass. Then move to `completed/`.
10. Append STOP. Write a proposal. Append to your bulletin.
11. `npm run tasking:restock`, then **claim the next task without waiting for a reply.**

## The rule that matters most: never stall

**Write the HANDOVER, claim the next task, keep going.**

You do not stop because:

- a gate is red → your completion is judged by `tasking:check`, which is scoped to *your*
  outputs. Note the failing gate verbatim in `NOTES.md` and continue.
- you need a file outside your write-set → document it. Work around it if you can.
- the brief is wrong or contradicts another doc → say so in your report. That is a
  finding, not a blocker.
- a value is unknown → **leave it EMPTY.** An honest gap beats an invented number.
- a decision needs a human → write `HANDOVER.md` with `Status: blocked`, name the
  decision and who owns it, then **move on to another task.**

Everything you write is reviewed before it reaches the main project. You are not the
last line of defence. Shipping something imperfect with an honest `NOTES.md` is
recoverable; shipping nothing because you were unsure is not.

**Only three things stop you:**

1. `tasking/pending/` is empty → report **"queue empty"** and stop. That is correct.
2. Your task folder is gone — another agent claimed it.
3. You are the implementation agent and nothing has been reviewed PASS.

## Finishing with gaps is SUCCESS

`Status: partial` with a specific list of what is missing and why is a **successful**
task. An empty folder with an explanation is a failed one. Do not sandbag the record to
look complete — the reviewer will open the files.

## `HANDOVER.md`

```markdown
# HANDOVER — <task-id>

**Status:** complete | partial | stalled | blocked
**Claimed:** <task id>   **Finished/abandoned:** <ISO-8601>
**Declared outputs written:** N/M — <list any missing>

## What I did
## What I found — the actual result, cited to a file and line
## What is NOT done, specifically
## Why I stopped            (omit only when Status is complete)
## What the next agent should do first
```

For `stalled` and `blocked`, "What is NOT done" and "Why I stopped" are the two most
important sections in the repository. The reviewer reads them first.

## Hard rules

- **Never state a charge weight** for any cartridge/projectile/powder combination, not
  even as an example. A plausible-looking wrong number here injures people.
- **Never weaken a gate.** An agent that can turn a red build green by editing the check
  has stopped the check being a check.
- **Never run `handoff:accept`.** It is a judgement about production.
- **Never write coaching advice** or assess a shooter.
- **Never edit `pending/`**, and never fix a brief you think is wrong.
- **Never `git add -A`.** Other agents are writing in this repo. Stage explicit paths.
- On Windows, write files with the editor tool or node — **not** PowerShell
  `Set-Content -Encoding UTF8`, which emits a BOM and CRLF and fails `docs:check`.
- Never `git reset --hard`, `git checkout .`, or `git clean`.

## Finishing

Move the folder, send STOP with the **real** file count, write the proposal, update the
bulletin, restock, claim the next task. Do not wait for a reply.