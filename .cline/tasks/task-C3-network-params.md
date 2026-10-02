# Task C3 - Verify affiliate network parameters

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

- `scripts/shared/affiliate-links.mjs`
- `scripts/tests/test-affiliate-links.mjs`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Do not weaken the no-tagging-without-store-id safety property.

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
You are working in C:\Cline\ApexProject, task **C3: verify affiliate network
parameters**.

BLOCKED ON: an approved affiliate account. Without dashboard access, STOP and
report. Do not guess.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md — §1 (never invent a value) applies to a parameter name
   exactly as it applies to a pressure
3. docs/AFFILIATE.md — the whole file
4. scripts/shared/affiliate-links.mjs — the NETWORK_TAG_PARAM table
5. scripts/tests/test-affiliate-links.mjs — the existing 13 tests
6. data/seeds/sourcing_retailers.csv — which retailers, which networks

BACKGROUND
NETWORK_TAG_PARAM holds avantlinkuid, irclickid, aovmt, aid, cjevent. On 2 Oct
2026 its comment was corrected to stop claiming the values came from official
documentation. They are the CONVENTIONAL names, NOT verified against primary
sources.

The failure is silent and expensive: a wrong parameter produces a URL that loads
perfectly, looks correct in every log and on every page, and earns nothing. You
would not discover it from the site — you would discover it from a commission
report months later, and by then the traffic is gone.

YOUR WRITE-SET:
  scripts/shared/affiliate-links.mjs
  scripts/tests/test-affiliate-links.mjs

DO NOT TOUCH: apps/**, data/seeds/**. If the finding changes docs/AFFILIATE.md,
REPORT that instead of editing it.

WHAT TO DO
For each network you hold an account with:
1. Open the dashboard. Most show a sample tagged link with the exact parameter
   key. Use that, not a search engine result.
2. Record what it says and the date you looked.
3. If it matches, say so. If not, correct the table and add a test case.
4. Update the provenance comment to state what you verified and when. Be precise
   about the difference between "the dashboard showed a sample link" and "I read
   the affiliate-parameter documentation" — different claims.

NETWORKS YOU DO NOT HOLD
Leave them as they are and mark them unverified in the comment. Do NOT delete
them: they document the convention, and the module already refuses to tag an
unknown network, so an unverified entry is inert.

DO NOT WEAKEN THE SAFETY PROPERTY
Tags are appended only when BOTH affiliate_network AND network_store_id are
present. Every retailer has network_store_id = NULL today, so every link is clean
and untagged. That is what stops a link being tagged with a placeholder ID. Keep
it. The test "does NOT tag when the store id is missing" matters most — do not
touch it.

THE MANDATORY NEGATIVE TEST
Confirm the existing negative tests still pass: `npm run test:affiliate` must
include, and pass, the three asserting NO tagging when the store id or network is
missing. Paste the run.

DONE WHEN
- each held network is verified (with date and source) or explicitly unverified
- the comment states provenance honestly, at the level actually established
- npm run test:affiliate exits 0 with all negative tests intact
- summary states per network: verified or unverified, the source, the date, and
  any value you changed
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
