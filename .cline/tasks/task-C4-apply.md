# Task C4 - Apply to affiliate networks

**Status:** READY
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

- `data/seeds/sourcing_retailers.csv`

> If a required change falls outside this list, **halt and report it**. Do not
> "just add it". See [`.clinerules`](../../.clinerules) section 1.

**Lock protocol:** claim any shared path in `.cline/tasks/ledger.json` before
writing it. If another task already holds the lock, stop and report.

**Note:** Research and prepare only. Owner submits. commission_rate_pct stays NULL until read from the network.

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
You are working in C:\Cline\ApexProject, task **C4: apply to affiliate networks**.

BLOCKED ON THE OWNER. You cannot submit an application on someone's behalf: it
needs a bank account, a tax form, and a live site. Your job is to prepare
everything that does NOT require those, and hand the owner a precise checklist.

READ FIRST:
1. AGENTS.md
2. docs/CONVENTIONS.md
3. docs/AFFILIATE.md — the whole file, especially "What the network will check
   before approving you" and "Two things the seed data refuses to guess"
4. data/seeds/sourcing_retailers.csv
5. data/schema/016_affiliate_outreach.sql — the tracker table
6. `npm run affiliate:status` — current state

BACKGROUND
Zero of eight retailers are applied to. Every link the site emits is clean and
untagged, so nothing earns. AvantLink is the dominant network in this category.

WHAT WAS ACTUALLY WRONG WITH THE APPLICATION
The site used to display unsourced 4.9 star ratings, "Verified Shipping Partner",
"Verified Suppliers", superlative badges, and "30-60% Avg Handload Savings" — all
fabricated. That is precisely what network reviewers reject, and under
16 CFR 255.2(b) it was unsupportable regardless of disclosure. It was removed on
2 Oct 2026 and `npm run claims:check` now keeps it out. **Say this in the
application** — it is a strength, not a secret.

YOUR WRITE-SET:
  data/seeds/sourcing_retailers.csv  (network, rate, dates, application_url)
  the affiliate_outreach records for the retailers you prepare

DO NOT TOUCH: apps/**, scripts/shared/affiliate-links.mjs, any other seed CSV

RULES — THESE ARE THE POINT OF THE TASK
- `commission_rate_pct` STAYS NULL until read off the network's own directory. A
  blank rate gets looked up; a wrong one gets used.
- Record `terms_verified_on` for anything you fill in, so a stale number is
  visible as stale rather than presented as current.
- Ammunition eligibility varies: some programs exclude it, some pay a reduced
  rate, some exclude it during promotional windows. Record what the directory
  actually says.
- Brownells is listed on more than one network. Natchez migrated off AvantLink. A
  network taken from a stale third-party summary is a number that looks right and
  does nothing. Verify against the network's own directory.
- Fill in `pitch_notes` BEFORE the email is sent. Retailers approve outreach that
  argued a specific case; they decline "please add me to your list".

DELIVER
1. A per-retailer table: network, application URL, commission rate (or NULL),
   cookie window, terms_verified_on, ammunition eligibility.
2. `npm run affiliate:status` output showing the state.
3. A one-page checklist for the owner: what to click, what to provide, and the
   age-verification attestation most firearms programs require.

DONE WHEN
- every row you filled in has a source you can name and a date
- no guessed rate is recorded anywhere
- `npm run affiliate:status` reflects the research
- summary states per retailer: network, eligibility, what remains NULL and why,
  and the owner's remaining steps
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
