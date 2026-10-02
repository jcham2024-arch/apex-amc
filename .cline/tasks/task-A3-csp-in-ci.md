# Task A3 - Front-door the browser CSP check in CI

**Status:** BLOCKED
**Blocked by:** A1
**Shared-path lock needed:** `package.json`
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

- `.github/workflows/verify.yml`
- `package.json`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Shares .github/workflows/verify.yml and package.json with A1. Strictly after A1.

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
You are working in C:\Cline\ApexProject, task **A3: front-door the browser CSP
check in CI**.

READ FIRST:
1. AGENTS.md — the Traps table entries on execFileSync, server.close(), and
   proving a script ran
2. docs/CONVENTIONS.md
3. scripts/tests/check-csp-in-browser.mjs — the file this is about
4. .github/workflows/verify.yml
5. SECURITY.md

BACKGROUND
This check has NEVER run on ubuntu-latest. Locally it was skipped for weeks,
and when finally run it was two broken things at once: (a) not running at all,
because execFileSync with piped stdio deadlocks on Windows; (b) passing
VACUOUSLY, because it asserted on a string already in the static markup, so it
passed against a policy that blocked the entire site. Both fixed 2 Oct 2026.

YOUR WRITE-SET:
  .github/workflows/verify.yml
  package.json  (only if a script alias is genuinely missing)

READ-ONLY: scripts/tests/check-csp-in-browser.mjs, SECURITY.md, apps/website/**

WHAT TO DO
Ensure CI runs this step and that its failure cannot be skipped.
- The script exits 2 when no browser is found and 2 on timeout, loudly. On
  ubuntu-latest Chrome is preinstalled — confirm the step relies on that rather
  than assuming.
- A step that can exit 0 without having run is the exact failure this task
  exists to prevent. If the workflow can skip it, make it fail instead.
- Do NOT weaken assertions to get green. Wanting to relax the check is the
  signal that something is genuinely broken — report it.

THE MANDATORY NEGATIVE TEST
Copy dist/_headers, replace the script-src SHA-256 hash with a literal
nonce-{RANDOM}, run the check, show it FAILS with exit 1 and a message naming
the problem. Restore, show it passing. Paste all three runs.

Trap: "MidwayUSA" also appears inside the bundled JS data, so a naive string
replacement may silently not apply. Verify the file actually changed before
trusting the result — a negative test whose injection was eaten is worse than
none.

DONE WHEN
- the step is in verify.yml and cannot be silently skipped
- negative test run and observed failing; clean run passes
- summary includes all three runs verbatim
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
