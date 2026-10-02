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