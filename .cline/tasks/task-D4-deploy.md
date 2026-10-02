# Task D4 - Cloudflare deploy

**Status:** BLOCKED (external - needs a human)
**Blocked by:** D3
**Shared-path lock needed:** none
**Model:** fresh instance of the default model

> GENERATED FILE - DO NOT EDIT.
>
> The execution prompt below is extracted from
> [`docs/AGENT-PROMPTS.md`](../docs/AGENT-PROMPTS.md), which is the single
> source of truth. Edit the prompt there and run `npm run tasks:gen`.
> This file adds the machine-readable write-set that `npm run tasks:check` validates.

---

## 1. Isolation Boundaries

**Strict Write Paths** - the ONLY files you may create, modify, or delete:

- `(deploy commands only)`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** No deploy succeeds until database_id is real.

---

## 2. Context Anchors - read in this order

1. [`.clinerules`](../../.clinerules) - binding
2. [`docs/CONVENTIONS.md`](../../docs/CONVENTIONS.md) - binding
3. [`docs/PARALLEL-WORK-PLAN.md`](../../docs/PARALLEL-WORK-PLAN.md)
4. `AGENTS.md`

---

## 3. Execution Prompt

> Paste verbatim into the sub-agent.

```markdown
You are working in C:\Cline\ApexProject, task **D4: Cloudflare deploy**.

BLOCKED ON: owner credentials, and D3 merged. Do not deploy before both.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. wrangler.toml — read the comments; they explain why the path is what it is
4. docs/PARALLEL-WORK-PLAN.md §D4
5. docs/DATA-TODO.md §0.2c

BACKGROUND
wrangler.toml `database_id` is still REPLACE_WITH_YOUR_D1_DATABASE_ID. **No
deploy can succeed until that is a real ID.** That is owner credentials, not a
code change.

A PRIOR BUG WORTH KNOWING
`pages_build_output_dir` was "dist" — a root directory that does not exist and
never did. The build emits apps/website/dist/. That shape of mistake is the worst
kind: `wrangler pages deploy` on a missing output directory does not fail loudly,
it publishes nothing, and the site simply 404s with no error in the logs. It is
now corrected AND gated by npm run website:check, which asserts the deploy path
matches the real build output. Do not remove that assertion.

PRE-FLIGHT
1. `npm run verify` exits 0.
2. `npm run website:build` succeeds.
3. `npm run website:check` confirms the deploy path matches the build output.
4. `database_id` is a real ID, not the placeholder.
5. Confirm you are deploying to the intended environment. A production deploy is
   not reversible by re-running it.

VERIFY AFTER DEPLOYING
- the page loads, and it is the calculator — not a 404, not a directory listing
- the calculator computes
- the retailer directory renders
- fonts and styles load, and there are NO CSP violations in the console
- the affiliate disclosure is visible ABOVE the retailer grid

That last one is an FTC requirement, not a nicety. It is gated locally by
claims:check; confirm it survived the deploy.

YOUR WRITE-SET: deploy commands and owner credentials only.
DO NOT TOUCH file contents unless a deploy genuinely requires it — and if so,
stop and report first.

DONE WHEN
- the live site serves correctly and the console is clean
- you have pasted evidence of each pre-flight check
- summary states the deployment, the URL, each post-deploy verification with its
  result, and anything that did not behave as expected
```

---

## 4. Definition of Done

- [ ] `npm run verify` exits 0
- [ ] Mandatory negative test run and observed FAILING; output pasted verbatim
- [ ] `git status --porcelain` shows nothing outside section 1
- [ ] Documentation updated in the same change
- [ ] If the main app changed: `npm run website:build`, then
      `npm run handoff:accept -- --note="what changed and why"`
- [ ] Model used recorded here: fresh instance of the default model
- [ ] Five-part summary per [`.clinerules`](../../.clinerules) section 8,
      including what you found but did NOT touch
