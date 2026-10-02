# Task C1 - YMYL trust signals

**Status:** BLOCKED (external - needs a human)
**Blocked by:** none
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

- `docs/ (one new brief)`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Produces a decision brief ONLY. Implementation is blocked.

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
You are working in C:\Cline\ApexProject, task **C1: YMYL trust signals**.

STOP AND READ THIS FIRST
This task is BLOCKED pending an owner decision. Do not begin implementation. Your
first job is to write up the decision that is needed, then stop.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. docs/AFFILIATE.md — the FTC section; the same reasoning applies to trust
4. apps/website/src/index.html — the current footer disclaimers
5. docs/SOURCES.md — how sources are cited elsewhere in this project

BACKGROUND
This is a YMYL site: it displays reloading cost data derived from powder charge
weights, on a page whose subject is ammunition. It has NO author, NO sources, NO
"reviewed by", and NO last-reviewed date anywhere. Reasonable reviewers — and
search engines applying E-E-A-T to safety content — expect those.

There is a footer safety disclaimer, and it is good. It is not the same thing: it
tells the reader to cross-reference a manual. It does not say who is responsible
for the content, or when it was last checked.

WHY IT IS NOT YOURS TO DECIDE
Naming an author is an accountability claim. You cannot invent a name,
qualifications, or a review date. Doing so would be a fabricated endorsement —
the exact defect just removed from the retailer directory (unsourced 4.9 star
ratings, "Verified" claims). It would be worse here, because the content is
safety-relevant.

WHAT TO PRODUCE
A short written brief for the owner containing:
1. What is missing today, with the current footer text quoted.
2. The options and the tradeoff of each:
   - named human author with stated reloading qualifications and a review date
   - organisational attribution with a contact and a "last reviewed" date
   - explicit "reference tool, not instruction" framing with no author
3. Your recommendation and why.
4. An implementation sketch for the chosen option: which files change, the markup,
   and how it would be gated so it cannot silently disappear.

YOUR WRITE-SET: a new document under docs/ describing the decision needed.
DO NOT TOUCH apps/website/** — that is the implementation, and it is blocked.

DONE WHEN
- the brief exists and names a specific decision with options
- you have NOT made the decision and have NOT edited any site file
- your summary states the options, your recommendation, and that you stopped
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
