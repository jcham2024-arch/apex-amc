# Task C2 - Accessibility pass

**Status:** BLOCKED
**Blocked by:** A3
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

- `apps/website/src/index.html`
- `apps/website/src/main.js`
- `apps/website/src/styles/theme.css`
- `scripts/gates/check-claims.mjs`
- `package.json`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Shares package.json with A3. Strictly after A3.

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
You are working in C:\Cline\ApexProject, task **C2: accessibility pass**.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §5 (security, which overlaps a11y here) and §4 (comments)
3. apps/website/src/dom.js — the reference for building DOM safely
4. apps/website/src/main.js — the calculator and retailer renderers
5. apps/website/src/index.html — current structure
6. scripts/gates/check-claims.mjs — the accessibility FLOOR already enforced
7. apps/website/src/styles/theme.css — the colour tokens

BACKGROUND
A compliance pass on 2 Oct 2026 fixed the objective failures: 5 inputs had visual
<span> text that is not a label (WCAG 4.1.2), there was no skip link despite a
sticky full-width nav (2.4.1), and there was no meta description. `claims:check`
now gates that floor. What remains needs judgement and a real screen-reader pass,
which no regex gate can certify.

YOUR WRITE-SET:
  apps/website/src/index.html
  apps/website/src/main.js
  apps/website/src/styles/theme.css
  scripts/gates/check-claims.mjs  (ONLY to strengthen the floor)

MUST RUN AFTER: `npm run website:build` then
`npm run handoff:accept -- --note="..."`
You are changing the main app deliberately. `handoff:status` inside verify will
otherwise fail you — that is the system working, not a bug.

SECURITY — NON-NEGOTIABLE
- Never build DOM with innerHTML. Use el(), icon(), safeUrl() from dom.js.
  apps/website/src/data/retailers.js is injected into the page; any new field you
  render from it must go through a DOM node. A single innerHTML reverts the XSS
  hardening that was put in deliberately.
- If you change a colour, verify the contrast ratio against its actual
  background. Do not eyeball it.
- The claim gate must keep passing. If you find a way to satisfy the gate without
  satisfying a real user, that is a bug in the gate — fix the gate.

WORK TO DO
- Keyboard: every interactive element reachable and visibly focused. Check focus
  is not clipped by the sticky header — a real and commonly missed failure.
- Contrast for text, icons, and the affiliate disclosure banner.
- Dynamic content (retailer grid, calculator output) must announce changes.
  Consider aria-live where output changes without a page load.
- Touch target sizes; the disclosure readable at 200% zoom.

THE MANDATORY NEGATIVE TEST
Break one thing deliberately — remove a label, or set focus styling to none — and
show the gate FAILS. Then restore it.

DONE WHEN
- npm run verify exits 0 INCLUDING claims:check and website:csp:browser
- keyboard-only traversal done and recorded
- ONE real screen-reader pass done and recorded
- `npm run handoff:accept` run with a --note
- summary states every issue found, every fix, what you could NOT verify without
  real assistive technology, and anything left
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
