# 01 — Ranked roadmap

**Task:** roadmap-synthesis · **Agent:** dc408 · **Date:** 10 Feb 2026

Ranking rule, from the brief: (a) does it unblock other work, (b) is it a defect that
produces **wrong output** rather than a visible failure, (c) how confident is the
evidence.

**Every candidate below carries the completed task that justifies it and a verbatim
quotation. A candidate with no quotation is not in this list.**

---

## Scope correction before the ranking

The brief says *"Ten tasks completed and the queue is empty."* **Both halves are
stale.** Measured at the time of writing:

- **12 directories** under `tasking/completed/`. One (`T5`) is a pre-swarm duplicate —
  verified a **strict subset** of `interior-ballistics` (all 6 filenames present
  there, 56,154 bytes). **Synthesised: 11 real tasks.**
- **8 tasks** were in `pending/` when I claimed this one, and the taskmaster
  materialised more during the session.

**Only 6 of 11 tasks produced a `KNOWLEDGE.md`:**

| Has `KNOWLEDGE.md` | Does not |
|---|---|
| `ammoseek-coverage`, `code-audit`, `interior-ballistics`, `shot-group-taxonomy`, `ui-research`, `cartridge-licence-reconciliation` | `ballistics-oracles`, `cartridge-dimensions`, `docs-audit`, `exterior-ballistics`, `trademark-clearance` |

**The brief's method — "read the KNOWLEDGE.md of ALL ten" — is impossible as
written.** For the five tasks without one I read their `REPORT.md` directly. **That
gap is itself finding R0 below.**

---

## R0 — Remove `tasking/completed/T5/` and make `KNOWLEDGE.md` mandatory

**Blocks:** every `tasking:check` run, for every agent. **Currently red.**

**Quotation** — `tasking/completed/cartridge-licence-reconciliation/NOTES.md` N5:

> "Untracked, in my worktree only. Six files from the **pre-swarm folder layout** …
> The same task is completed upstream as `tasking/completed/interior-ballistics/`."
>
> "It has no `task.json`, so it should be invisible to `tasking:check` — but it is
> untracked and would be swept into any `git add -A`."

That prediction has come true. Measured gate output:

```
x tasking/completed/T5/BRIEF.md is missing.
x tasking/completed/T5/task.json is missing.
x tasking/completed/T5/ has no manifest in pending/, so its declared outputs
  cannot be verified.
```

**Three of the four current failures are one stale folder.** It is not a task; it is
a duplicate. This is `shape: change` — deleting a folder is the owner's call, and
§12 forbids proposing protocol changes as research.

**The second half is the durable fix.** `KNOWLEDGE.md` is declared in
`task.json` by some tasks and not others, so the swarm's designated cross-task memory
is optional. **A task can complete with every declared output present and contribute
nothing another agent can find.** That is the same class of defect as
`code-audit`'s brace finding: green, and empty.

---

## R1 — `9 Luger` and `.22 LR` are filed `family=rifle`

**Produces wrong output, silently. It is the highest-value defect in the set.**

**Quotation** — `tasking/completed/ammoseek-coverage/KNOWLEDGE.md` §3:

> "`9 Luger` sits in `data/seeds/cartridge_specs/rifle.csv` with `family=rifle`. So
> does `.22 LR`. **A real defect, not yet fixed** — it was outside this task's
> write-set. Family drives presentation and filtering, so the most-searched cartridge
> on the index is currently in the wrong bucket."

Independently re-measured by me:

```
family distribution: { pistol: 16, rifle: 212, shotgun: 1 }
MISFILED: slug=22-lr   name=".22 LR"  family=rifle  file=rifle.csv
MISFILED: slug=9-luger name="9 Luger" family=rifle  file=rifle.csv
```

**212 of 229 cartridges are filed `rifle`.** This is a **wrong-output** defect: no gate
fails, no test fails, and a user filtering by handgun sees the two most-searched
handgun cartridges missing. `ui-research` names the related rendering trap:

> "A design that has no vocabulary for absence renders a blank cell, and a blank cell
> is read as `0`. **That is a silent data error**, and it is invisible to every test
> that checks for rendering failures."

**A misfiled family is the same failure with a different mechanism.** It needs no new
gate — it needs the two rows moved and a check that `family` agrees with the cartridge.

---

## R2 — Make the dimensional-empty state a recorded decision, not a silent blank

**Unblocks** any future dimensional or interior-ballistics work. **Evidence:
high.**

**Quotation** — `tasking/completed/interior-ballistics/KNOWLEDGE.md`:

> "| Cartridge dimensions | **0 / 229** (`capacity_gr_h2o`, `case_length_max_in`) |
> Case volume — the geometric input — unknown |"
>
> "**These compound.** Even a complete powder database, which does not exist, would
> still lack the cartridge-side geometry. Any task proposing interior ballistics should
> be told that closing `cartridge-dimensions` is a prerequisite, not a parallel nicety."

`cartridge-licence-reconciliation` (mine) then resolved *why* it is empty. Quotation:

> "226 of 229 cartridges are blocked by **availability**. Three by nothing. None by
> permission alone."

**So the headline is a budget decision, not a legal one:** the remedy for 226 rows is
purchasing SAAMI Z299.x. For the remaining ~11 the remedy is a CIP approval request.
**No research task can close this.** See R8.

---

## R3 — Design the unknown state before the known one

**Quotation** — `tasking/completed/ui-research/KNOWLEDGE.md` §1:

> "**A numbers product's most important design decision is how it renders 'we do not
> know'.** This project's dominant data state is *absent*: six dimensional columns are
> 0/229 populated. A design that has no vocabulary for absence renders a blank cell,
> and a blank cell is read as `0`. **That is a silent data error**"

> "Corollary, specific to this repo: **an em-dash is not an adequate unknown marker.**
> `—` reads as zero to anyone scanning a column. The slot must carry a word."

**Cross-corroborated by an independent task.** `docs-audit/KNOWLEDGE` does not exist,
but `docs-audit/01-findings.md` reaches the same conclusion by a different route:

> "**Recommendation: delete the field, do not bump it.** Bumping re-stales at 20."

Both tasks say the same thing about different objects: **a value that must be kept
current by hand will silently go stale.** Here, a blank cell; there, a stored count.

**Unblocked by R2's answer:** once it is known that a blank means *"not ours to
publish"*, the UI can say so.

---

## R4 — Delete stored counts that must be maintained by hand

**Wrong output, and it is already stale in the file agents are told to trust.**

Two tasks found this **independently**, which is why it ranks here.

**Quotation** — `tasking/completed/code-audit/KNOWLEDGE.md`:

> "2. **`.cline/tasks/ledger.json` records `"stages": 14`.** Real count is 20 (19
>    before `mail:check` was added). That file is called *"the authoritative task
>    ledger"* by `tasking/README.md`. `.clinerules` resolved this exact problem by
>    **deleting** its count rather than replacing it."

**Quotation** — `tasking/completed/docs-audit/01-findings.md`:

> "declares **19** — the stalest count in the repo, in the file agents are told to
> trust."
>
> "Row count (989 → **1031**), CSV count (23 → **26**), manufacturers (50 → **58**),
> tests … `AGENTS.md` is the file every agent is told to read first."
>
> "Line 90 issues the rule 'Do not quote a stage count'; lines 94 and 295 then quote
> stage counts (15). **The document breaks its own rule.** Line 295's `15 stages` →
> **19**."

**Cheap, certain, and unblocked.** `code-audit` also found the ESLint equivalent:

> "`eslint.config.js` ignores `temp/**` … `temp/` does not exist … it silently tolerates
> a second scratch location that **`.clinerules` §5 rule 10 does not mention**"

---

## R5 — Fix the `process.cwd()` roots; one of them can produce a false green

**Quotation** — `tasking/completed/code-audit/KNOWLEDGE.md`:

> "**The one that actually bites:** `process.cwd()` rooting in 9 scripts, including
> `check-docs.mjs` — the gate that resolves every repository path in backticks. Run
> from the wrong directory it walks the wrong tree and can report a **false green**."

> "**The one that is a live trap:** `import-bullets.mjs` splits bullets CSVs on `,`
> while `shared/data.mjs` says of the same operation that it 'is not merely inelegant,
> it is wrong.' Currently latent (no bullet row has an embedded comma) but it is a
> **write** path"

**I hit this exact trap one task later**, in `cartridge-licence-reconciliation`, and
recorded it in my bulletin:

> "Used `split(',')` on a quoted CSV -> emitted `" pressure columns)\""`. The exact
> hazard at `scripts/shared/data.mjs:117` and the exact duplication I reported in
> `code-audit/02-dupes.md`."

**A finding that survives one task and is then re-made by the next agent is not
documented well enough.** That is evidence for R5 rather than against it.

---

## R6 — Give the load resolver a designed refusal

**Quotation** — `tasking/completed/interior-ballistics/KNOWLEDGE.md`:

> "Hornady currently carries an unprompted safety notice: 'The 6.5 PRC entry in the
> 12th Edition Hornady Handbook … contains a misprinted powder… Using the misprinted
> powder could result in dangerously high pressures…'"
>
> "**A resolver that cannot say 'I am not sure this is the same thing' is unsafe by
> construction. The refusal must be a designed output, not an empty string that looks
> like a bug.**"

**Blocked by R2/R8** — there are no licensed load tables to interpolate yet.

---

## R7 — Do not build the shot-group diagnosis feature

**Quotation** — `tasking/completed/shot-group-taxonomy/KNOWLEDGE.md`:

> "**Do not build 'shot-group diagnosis' that names a shooter fault from a target
> photo.** … a named instructor … writes that the artifact this idea is built on is
> *'the most misused tool in the training industry'*"

> "**`centreOfImpact` returns the mean of the shots taken.** … Before any threshold
> rule fires (`poi.y > t ⇒ vertical fault`), `t` must be expressed in units of the
> group's **own standard error** — otherwise the rule fires on sampling noise.
> `dispersion.ts` does not compute that standard error today, and no source states a
> threshold. **This is the gap most likely to produce confident nonsense.**"

**This is a ranked roadmap entry as a negative.** Listed so it is not proposed twice.

---

## R8 — Two owner decisions, and no research can settle them

**Quotation** — `tasking/completed/cartridge-licence-reconciliation/NOTES.md`:

> "N1 — The SAAMI free-drawings permission question (OPEN, legal) … It governs **3 of
> 229 cartridges** — and, more importantly, the *principle*."
>
> "N2 — CIP extract boundary (OPEN, legal) … The notice forbids reproduction *'as well
> as in the form of extracts'*. Two readings … **I did not choose between these.**"

**Quotation** — `tasking/completed/interior-ballistics/KNOWLEDGE.md`:

> "3. **Load-table licences are a commercial decision, not an engineering one.**
>    Hornady sells its data. Whether we license, scrape-under-licence, or restrict the
>    feature to citation is an owner decision with legal exposure."

**And the budget one** — `cartridge-licence-reconciliation/KNOWLEDGE.md`:

> "**The headline is a budget line, not a legal one.** 226 of 229 cartridges need
> **SAAMI Z299.x purchased**."

---

## Ranked summary

| # | Candidate | Unblocks | Wrong-output? | Confidence | Owner? |
|---|---|---|---|---|---|
| **R0** | Remove `T5/`; make `KNOWLEDGE.md` mandatory | **every gate** | no — visible | **certain** | planner |
| **R1** | `9 Luger` + `.22 LR` filed `rifle` | filtering | **YES** | **certain** | no |
| **R2** | Record the dimensional-empty state | interior ballistics | no | **certain** | partly |
| **R3** | Design the unknown state | UI | **YES** | high | partly |
| **R4** | Delete hand-maintained counts | docs trust | **YES** | **certain** | no |
| **R5** | Fix `process.cwd()` roots; CSV on a write path | gates | **YES** (latent) | high | no |
| **R6** | Designed refusal in the resolver | load feature | no | high | no |
| **R7** | **Do not build** shot-group diagnosis | — | — | high | no |
| **R8** | Licence + budget decisions | R2, R6 | — | — | **owner** |

**Attentable without an owner: R1, R4, R5** — certain evidence, no decision needed.
**R0 first**, because it is currently breaking a gate for everyone.