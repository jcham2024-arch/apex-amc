# Task T3 - Brand rename and site re-identification

**Status:** BLOCKED - waiting on the owner to choose a name
**Blocked by:** T1
**Write-set lock:** `package.json` (claim in `ledger.json` before writing)
**Model:** [record on start]

> **DO NOT START THIS TASK.**
>
> It is registered so the write-set is reserved and visible, not because it is ready.
> Two things must be true first:
>
> 1. **T1 has reported.** You need its clearance data to choose a defensible name.
> 2. **The owner has chosen a specific name**, in writing, and has been told the
>    trademark position by a professional.
>
> Picking a name yourself, or guessing at one, defeats the entire purpose. If you are
> reading this as an assigned task, **stop and report that you are blocked.**

---

## 1. Isolation Boundaries

**Strict Read Paths** - read anything; you NEED:

- `docs/research-trademark/01-name-clearance.md` and `02-domain-options.md` (from T1)
- `wrangler.toml` - `name`, `database_name`, `SITE_ORIGIN`
- `package.json` - `name`, `description`, `repository.url`
- `apps/website/src/index.html` - `<title>`, meta description, footer
- `apps/website/src/main.js` - footer and disclosure strings
- `apps/website/src/data/*.js` - any brand string in the data modules
- `.github/workflows/verify.yml` - only to READ; do not edit

**Strict Write Paths** - the ONLY files you may modify:

- `package.json`
- `wrangler.toml`
- `apps/website/src/index.html`
- `apps/website/src/main.js`
- `docs/` (records of the decision only)

> If a required change falls outside this list, **halt and report it**. See `.clinerules` §1.

**Shared files this task may touch:** `package.json` - claim the lock in
`shared_path_locks` FIRST. If another task holds it, **halt**.

---

## 2. Context Anchors

1. `.clinerules` - binding
2. `docs/CONVENTIONS.md` - binding
3. `AGENTS.md` - traps and boundaries
4. `.cline/tasks/task-T1-trademark-clearance.md` - the evidence this depends on

**Provision your mailbox:** `npm run mail:init -- <your-id>`. It is idempotent, so run it even if the file looks present. An agent with no inbox is an agent whose findings nobody reads. Archived mail from closed agents is in `tasking/mail/archive/` — worth reading before you rediscover their findings.

### Established facts - MEASURED, do not re-derive

- **APEX AMMUNITION** is a LIVE USPTO registration, Reg. **5391055**, IC 013 (shotgun
  shells), owned by **Apex Ammunition LLC** (Mississippi, USA), basis 1(a).
- `https://apexmunition.com/` is a live operating ammunition storefront with an 18+ gate.
- The current site title is `Apex Ammunition & Components | Apex AMC Directory & Calculator`.
- `apexload.pro` is a competitor in a near-identical category. **No exact-match USPTO
  registration for "APEXLOAD" was found**, so it is an SEO/confusion risk rather than a
  registration risk.
- Owning a domain for 10 years confers **no** trademark rights. Copyright protects the
  code and data; it never protected the name.

---

## 3. Execution Prompt (only run once unblocked)

> Paste this section verbatim into the sub-agent.

The owner has chosen the new brand name: **[OWNER MUST FILL THIS IN]**

Apply it consistently and completely. A partial rename is worse than none - it leaves
the old mark on some pages and creates two brands.

**Checklist - every one of these is required:**

1. `package.json` - `name`, `description`. Note the `//license` block mentions the
   old name in prose; update it or leave it only if still accurate.
2. `wrangler.toml` - `name`. **`database_name` is NOT the brand** - do not change it
   unless the owner says so. `SITE_ORIGIN` must only change if the DOMAIN changes.
3. `apps/website/src/index.html` - `<title>`, `<meta name="description">`, `og:title`,
   `og:description`, any JSON-LD `name` field, and the footer.
4. `apps/website/src/main.js` - any brand string, including the affiliate disclosure.
5. Search the whole repo for the old string and report every remaining hit:
   `rg -i "<old-name>" --stats`

**Then, and only then:**

- `npm run website:build`
- `npm run handoff:accept -- --note="brand changed from X to Y; reason: <trademark clearance ref>"`
- `npm run verify` must exit 0

**Cloudflare - ASK THE OWNER FIRST.** Renaming the `wrangler.toml` `name` does NOT
rename the deployed Pages project, which still exists as `apex-amc`. Options:

- keep the Pages project name and only change the displayed brand (simplest, no risk)
- create a new Pages project (changes the `*.pages.dev` URL and breaks the custom domain
  binding until re-attached)
- rename via the Cloudflare dashboard (may not be supported)

**Do not run `wrangler pages project create` or delete anything without explicit
owner approval.** The site is live.

---

## 4. Definition of Done

**Validation:**

- [ ] `npm run verify` exits 0
- [ ] `npm run website:check` exits 0
- [ ] `npm run handoff:status` reports the new hash accepted
- [ ] `npm run tasks:check` exits 0
- [ ] `git status --porcelain` shows ONLY files in the write-set above
- [ ] Repo-wide search for the old name returns zero unexplained hits, and each
      remaining hit is listed with a reason

**Mandatory negative test:**

- [ ] Paste the repo-wide search output proving the old brand is gone from user-facing
      strings
- [ ] Paste `npm run website:build` output showing `index.html` regenerated, and
      confirm the new title in the built output
- [ ] Confirm `apps/website/dist/_headers` hashes were regenerated by `website:csp`
      and that `npm run website:csp:browser` still passes

**Docs:**

- [ ] Record the rename and its reason in `docs/` - the date, the name chosen, the
      clearance reference from T1, and who decided
- [ ] Do NOT claim the rename resolves any legal question. Record that professional
      review is still recommended

**Report:** the five-part summary required by `.clinerules` §8.

## If you get stuck - read this before you stop

**You are working in a sandbox. Everything you write is reviewed before it reaches the
main project.** A concern is not a reason to stop.

Do **not** halt because:

- a file you want is outside your write-set - write it up in `NOTES.md`, work around it
- `npm run verify` is red - that is a shared gate; your completion is judged by
  `npm run tasking:check`, which is scoped to **your** declared outputs. Note the
  failure and keep working.
- a brief is wrong or contradicts another document - say so in your report. Fixing
  briefs is the planner's job, and reporting it is the whole contribution.
- a value is unknown - **leave it EMPTY.** An honest gap beats an invented number.

Do **not** halt when you finish with gaps. "I completed most of this and documented
exactly what is missing and why" is a **successful** task. An empty folder with an
explanation is not.

The only two things that stop you: the task folder is gone (someone else claimed it), or
`pending/` is empty - report **"queue empty"** and stop. Both are correct results.

Never weaken a gate and never run `handoff:accept`. Not for permission - those are
judgements about production, which is what the review step is for.
