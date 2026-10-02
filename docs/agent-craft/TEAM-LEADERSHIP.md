# Team leadership notes

Written 2026-10-02. These are the corrections to how I ran the first team
attempt, derived from what actually went wrong. Kept short because a document
nobody reads cannot correct anybody.

## What I got wrong on the first attempt

**I spawned three teammates and immediately dispatched all three with no
verification that any of them could run.** All three returned the same error
within one second: an auth failure. I had spent a large, carefully specified
prompt budget on work that could not start.

**Lesson: prove the harness before writing the task.** One cheap round-trip
costs almost nothing. Discovering the harness is broken after three parallel
dispatches wastes the prompts and, worse, leaves the impression the team is
running when nothing is.

Now: spawn one, ask it to reply with one word, confirm it responds, then
dispatch the rest.

**I wrote the role prompts as if agents had capabilities they do not have.**
I gave a researcher web-search duties, which subagents cannot do, and I never
checked whether the teammate tool even supports it. See MODEL-SELECTION.md.

**I gave write-sets without checking the gate still passed after adding
them.** I did run `tasks:check`, but only after dispatching-adjacent changes.
The gate is cheap. Run it before dispatch, not after.

## The rules I am adopting

### 1. Smoke-test the harness first
Before any real dispatch: one teammate, one trivial task, confirm a real
response. Costs one round trip.

### 2. Match the mechanism to the task
- Subagent = read-only codebase questions. No web, no writes.
- Teammate (CLI) = anything that writes files or needs the web.
If a task needs neither, do it inline. Do not spawn an agent for a five-minute
lookup.

### 3. Verify capabilities, do not assume them
Before assigning a task that depends on a tool, confirm the tool is available to
that agent type. The docs are explicit about subagent limits. Read them before
dispatching, not after failing.

### 4. Give the agent the context it cannot derive
A teammate starts with a blank slate. It does not know this repo's history, its
traps, or why a rule exists. Point it at the file that carries that knowledge
(`.clinerules`, `docs/CONVENTIONS.md`, `AGENTS.md`) and tell it which
section governs the work. Do not paste the rules; link them.

### 5. Make the acceptance criteria executable
"Write good documentation" is not checkable. "Run `npm run verify` and confirm
exit 0" is. Every task gets a command that proves it worked. Our own history is
that a gate which cannot fail is worse than no gate, so the same standard
applies to the task I hand out.

### 6. Require the negative test
For any agent that adds a check, require proof the check fails when it should.
The CSP gate passed for weeks against a policy that blocked the whole site.
Every gate this project adds gets a broken-input run.

### 7. One writer per file, verified mechanically
`npm run tasks:check` enforces this. Do not bypass it, and do not trust a
hand-written plan to be collision-free. It found four real collisions in work
that was already written down.

### 8. Report blockers immediately, do not work around them silently
When something is blocked, say so and stop. Do not produce a plausible-looking
substitute. A fabricated number is worse than no number.

### 9. Keep the leader context small
Delegate whole areas, not steps. Re-read only the diff and the report, not the
whole file the agent already read.

## The single most important habit

**Do not claim something works without running it.** Not the harness, not the
gate, not the deploy. This project's entire defect history is a chain of
things that were believed done and were not. The fix is not more rules, it is
running the thing before reporting it done.
