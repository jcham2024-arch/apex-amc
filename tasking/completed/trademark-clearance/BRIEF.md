# Task T1 - Trademark and brand-name clearance research

**Status:** READY
**Blocked by:** none
**Write-set lock:** `docs/research-trademark/` (new directory)
**Model:** [record on start - fresh instance of the default model]

> **THIS IS RESEARCH ONLY. IT CHANGES NO SOURCE AND NO BRAND.**
>
> The owner asked for a rename. That request is blocked on this task's findings,
> and the owner has NOT authorised any rename. Do not rename anything.

---

## 1. Isolation Boundaries

**Strict Read Paths** - you may read anything, you NEED:

- `wrangler.toml` - site identity, `SITE_ORIGIN`
- `package.json` - the `description` field is the current brand string
- `apps/website/src/index.html` - `<title>` and on-page brand text
- `apps/website/src/main.js` - footer / disclosure text
- `data/seeds/regulations.csv` - the house rule on copying other parties' claims
- `data/generated/json/opensource_resources.json` - the licence-verification pattern to copy

**Strict Write Paths** - the ONLY files you may create or modify:

- `tasking/completed/T1/` - your staged output folder, in full
- Inside it, the three deliverables named below

**You must NOT modify any file in the main project tree.** Read
[tasking/README.md](../README.md) before starting: you copy the files you change out
of the main tree, edit the copies, and save them under `tasking/completed/T1/`.
Nothing you write goes anywhere else.

> If a required change falls outside this list, **halt and report it**. See `.clinerules` §1.

**Shared files this task may touch:** NONE. Do not edit `package.json`, `wrangler.toml`,
`apps/`, `docs/`, or the ledger.

**Note:** the three deliverables are new research documents, so **no copies of main
files are needed** - you are adding files, not changing existing ones. Create them
directly under `tasking/completed/T1/` with their final paths preserved:
`tasking/completed/T1/docs/research-trademark/01-name-clearance.md`, and so on.

**Gate note:** your output is inside `tasking/completed/`, which `npm run lint` and
`npm run docs:check` deliberately ignore, so a defect in it cannot be caught by
running those gates. **Verify your own output by reading it back.** That asymmetry is
the reason this task insists on a review step rather than trusting the exit code.

---

## 2. Context Anchors - read in this order

1. `.clinerules` - binding, especially §1 isolation and §5 rule 1 (never invent a value)
2. `docs/CONVENTIONS.md` - binding
3. `AGENTS.md` - traps and boundaries
4. `data/seeds/regulations.csv` - the row documenting that competitor data may not be
   copied verbatim. The same discipline applies here: **record the registry result,
   do not paraphrase it into a conclusion you did not read.**

### Established findings - MEASURED, do not re-derive, do not contradict

Verified 2 Oct 2026 against the live USPTO search:

| Mark | Reg. No. | Status | Owner | Class |
|---|---|---|---|---|
| **APEX AMMUNITION** | 5391055 | **LIVE** (reg. 2018-01-30) | Apex Ammunition LLC (Mississippi, USA) | IC 013 - shotgun shells |
| APEXLOAD | - | **no exact-match registration found** | - | - |

`https://apexmunition.com/` is a **live operating storefront** selling ammunition, with
its own 18+ age gate. The current site title is
`Apex Ammunition & Components | Apex AMC Directory & Calculator`.

---

## 3. Execution Prompt

> Paste this section verbatim into the sub-agent.

You are doing trademark and brand-name research for a reloading-data website currently
named after a LIVE registered trademark in its own product category.

**Deliverable 1: `docs/research-trademark/01-name-clearance.md`** - for **at least 12**
candidate names:

1. Run a USPTO trademark search on the **exact string**. Record exact-match count,
   live/dead counts, and any hit in **IC 013** (ammunition) or **IC 009/042**
   (software/SaaS). IC 009/042 matters as much as 013 - this is ultimately software.
2. Web-search the string in the reloading/ballistics vertical. A competitor with the
   same name is a real problem even if unregistered.
3. Give a one-line verdict: **clear / caution / avoid**, with the reason.

**Candidate pool** (extend if better; do NOT use these as-is):

`ballisticslab` · `recipelab` · `ballisticsapi` · `caliberlab` · `ammodata` ·
`loadsmith` · `ammoquery` · `loadforge` · `loadsense` · `ballistify` · `loadgraph`

**Non-negotiable constraints:**

- **Never recommend a name containing "APEX".** It is the contested word.
- Do not treat "AMMUNITION" as a distinctive term. IC 013 is crowded; it adds no
  protection and adds risk.
- The owner wants the name to signal **scripting and possible LLM integration** -
  a calculator with an API, not a manufacturer. Say per candidate whether it supports that.
- A name that is trademark-clear but reads like an ammunition brand is still the
  wrong answer. Judge for THIS project.

**Deliverable 2: `02-domain-options.md`** - top 5 candidates, checking `.com`, `.dev`, `.io`.

**CRITICAL - methodology learned the hard way here:** DNS `A` records are NOT a
reliable availability check. A parked domain resolves to a parking IP and looks
available. State the method and a confidence level for every domain:

- `parked/for-sale` - resolves to a parking IP (76.223.x.x, 162.255.x.x)
- `resolves` - has a real A record
- `no A record` - **INCONCLUSIVE**, say so
- `NXDOMAIN` - strong availability signal; still confirm at a registrar

Never report "available" without NXDOMAIN or registrar confirmation.

**Also record, as fact:** the owner states they held their domains 10 years. In 2-3
sentences, explain why domain age and trademark rights are separate, and what owning a
domain does and does not confer. Cover copyright vs trademark vs patent. **Do not give
legal advice** - state what the registries show and recommend professional review.

**Deliverable 3: `README.md`** - directory index, following
`docs/research-competitors/README.md`.

---

## 4. Definition of Done

**Validation:**

- [ ] `npm run verify` exits 0 and you did not change it
- [ ] `git status --porcelain` shows ONLY files under `docs/research-trademark/`
- [ ] `npm run tasks:check` exits 0
- [ ] Every candidate has a recorded registry search, not a guess
- [ ] Every domain has its method stated with an explicit confidence level
- [ ] NO change to any brand string, `package.json`, or `wrangler.toml`

**Negative test:**

- [ ] Paste `git status --porcelain` output proving zero changes outside your write-set
- [ ] Paste one rejected candidate with the reason

**Report:** the five-part summary required by `.clinerules` §8. Item 4 (what you
believe is wrong) must state plainly whether the owner should rename, and the
residual risk if they do not.