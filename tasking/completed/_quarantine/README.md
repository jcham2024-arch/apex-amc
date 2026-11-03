# Quarantine — finished work that cannot be committed

**You are not stuck. Keep working.**

Put work here when you have *finished the task* but something about **committing it** is
wrong: a merge conflict you cannot resolve alone, a file another agent is holding, an
encoding fault, or a gate that fails for a reason you are not allowed to fix.

Then **claim the next task and carry on.** That is the entire point of this folder.

## When to use it

| Situation | Do this |
|---|---|
| Work is done, `git push` conflicts | quarantine, explain, take the next task |
| Work is done, a gate fails outside your write-set | quarantine, name the gate, take the next task |
| Work is done, you cannot merge without a decision | quarantine, name the decision, take the next task |
| You are **mid-task** and blocked | **do NOT quarantine.** Finish what you can, write a `HANDOVER.md` with `Status: partial` or `stalled`, and move the folder to `completed/` normally |
| You are **blocked with nothing finished** | `HANDOVER.md` with `Status: stalled`. See `WORKER.md` |

**The distinction that matters:** quarantine is for work that *finished and cannot be
landed*. `HANDOVER.md` is for work that *did not finish*. Using quarantine for
unfinished work hides the stall, which is the one thing you are trying to avoid.

## How to submit

```
tasking/completed/_quarantine/<task-id>/
  <all the output files you wrote>
  QUARANTINE.md      the required explanation — see the template below
```

`QUARANTINE.md` is **required**. A quarantined folder without one is worse than no
folder: the next person has the files and no idea what happened to them. The gate
`npm run quarantine:check` enforces this.

```markdown
# QUARANTINE — <task-id>

**Agent:** <your-id>   **Date:** <ISO-8601>
**Status:** complete | partial
**Commit attempted:** yes | no
**Task itself:** finished and correct — ONLY the commit is blocked

## What I produced
<the declared outputs, and whether each is what task.json asked for>

## What went wrong — the actual error
<verbatim. "merge conflict in data/seeds/x.csv", not "git problems".>

## Why I could not resolve it
<the specific thing you lack: a write-path, a decision, a file another agent holds>

## My recommendation
<what SHOULD happen, and who should do it. Be concrete enough to act on.>

## What I did NOT do, and why
<the tempting shortcuts you rejected — `git add -f`, editing another agent's file,
weakening a gate. Recording these is what stops the next person trying them.>

## Safe to land as-is?
yes | no | partially — <which files>
```

## The rules still apply inside quarantine

Quarantine changes **where the work waits**, not what is allowed:

- **Never** `git add -f` to force something past an ignore rule.
- **Never** weaken a gate so the commit succeeds.
- **Never** edit another agent's file to make your commit clean.
- **Never** delete the output. Quarantine exists to preserve it.
- A quarantined folder is **still yours** until you release it. Tell the taskmaster.

## Leaving quarantine

Someone — usually the taskmaster or the implementation agent — fixes the blocker and
moves the folder up:

```bash
mv tasking/completed/_quarantine/<task-id> tasking/completed/<task-id>
npm run tasking:check
```

If the work turns out to be unrecoverable, **do not delete it.** Write down why in
`QUARANTINE.md`, move it to `completed/` anyway, and let the reviewer judge. A
documented failure is a result; a vanished folder is a mystery.

## Check it

```bash
npm run quarantine:check   # every quarantined folder has a QUARANTINE.md
npm run quarantine:list    # what is waiting, and who owns it
```

This folder is **excluded from task counting** — it is a holding area, not a task tier.
It will never inflate the backlog, and `tasking:check` will not treat it as a finished
task. That exclusion is deliberate: without it, quarantined work silently inflated
`completed/` by one per stuck agent.