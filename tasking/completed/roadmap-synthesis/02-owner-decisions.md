# 02 — Owner decisions

**Task:** roadmap-synthesis · **Agent:** dc408 · **Date:** 10 Feb 2026

Everything in `01-ranked-roadmap.md` that **no amount of research can settle.** Each
names the decision, who owns it, what it costs, and what happens if it is deferred.

**These are separated deliberately.** A task that ends with "the owner must decide" is
only useful if it says *what the decision is* — otherwise it is a shrug with a
citation.

---

## D1 — Purchase SAAMI Z299.x? (budget)

**The single highest-value decision in the set, and the least like a licence problem.**

**Evidence** — `tasking/completed/cartridge-licence-reconciliation/KNOWLEDGE.md`:

> "226 of 229 cartridges are blocked by **availability**. Three by nothing. None by
> permission alone."
>
> "**The headline is a budget line, not a legal one.** 226 of 229 cartridges need
> **SAAMI Z299.x purchased**."

`cartridge-dimensions/01-source-survey.md` records what the purchase would buy:

> "| **SAAMI Z299.x standards (text)** | Proprietary, sold | N/A — not obtained | 0 |"

**Cost:** a standards purchase. I have not looked up a price and will not guess one.

**Also note** what it does *not* buy — `opensource_resources.csv`, `saami-standards`:

> "SAAMI also states it cannot advise on propellant selection, charge weights or primer
> choice and directs handloaders to manuals and manufacturers, so it would not close
> the load-data gap even if bought."

**If deferred:** the six dimensional columns stay 0/229 permanently, and every
task needing case volume is blocked. That is not a background cost — it is the
geometric input to interior ballistics.

---

## D2 — Ask CIP for permission, or write to CIP? (legal + relationship)

**Evidence** — `tasking/completed/cartridge-licence-reconciliation/02-licence-terms.md`:

> "Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."

> "**Does not say** | Whether an extract means a copy of CIP's *table*, or individual
> dimensional *values* restated in our own column structure"

**The decision is whether to spend a message asking.** CIP's notice names approval as
the mechanism, so the question is answerable — it has simply never been asked.

**Cost:** one email. **The risk of asking is reputational, not financial** — CIP is a
standards body that other people also write to.

**If deferred:** ~11 cartridges stay unavailable. **Lower priority than D1**, because
those 11 are a subset of the 226 and D1 covers them.

**Do not do this before D1.** It is premature: paying for Z299 may make the CIP
question moot for most of those cartridges.

---

## D3 — Load-table licences: buy, scrape, or restrict to citation?

**Evidence** — `tasking/completed/interior-ballistics/KNOWLEDGE.md`:

> "3. **Load-table licences are a commercial decision, not an engineering one.**
>    Hornady sells its data. Whether we license, scrape-under-licence, or restrict the
>    feature to citation is an owner decision with legal exposure."

`interior-ballistics/KNOWLEDGE.md` licence table, verbatim:

> "| Hornady handbook / Load'n'Lube | Yes | **No** — sold at 99¢/cartridge or by
> subscription |"

**Three options, honestly stated:**

| Option | Cost | Yield |
|---|---|---|
| Licence the data | per-source cost, ongoing | legal, citable load observations |
| Scrape under licence | engineering time | **legal exposure** — not recommended |
| Restrict the feature to citation | none | honest; "we don't have this" |

**This gates the product's headline feature.** `interior-ballistics` concluded the
defensible product is *"nearest-neighbour interpolation over published tables with
EMPTY on an unresolvable match"*. **Every one of those tables is unlicensed.**

**Note the compounding:** `recipes` is empty, and per `interior-ballistics`:

> "**`recipes` is empty and is the real blocker.** Nothing above changes that. Every
> defensible load feature needs licensed, cited observations, and we hold none."

---

## D4 — Legal read on two specific questions

Both from `cartridge-licence-reconciliation/NOTES.md`:

**N1 — SAAMI's footer.** The free-drawings page carries
`© 2026 Sporting Arms and Ammunition Manufacturers' Institute, Inc. All rights reserved`,
yet `cartridge-dimensions` treated those drawings as usable because SAAMI publishes
them itself.

> "**I did not resolve this**, because settling it requires legal interpretation and
> the brief prohibits legal advice."
>
> "**This is the one place the permissive reading survives**, and I am flagging it
> rather than settling it with an assertion."

**Governs 3 of 229 cartridges — and the principle.** If publisher-published but
marked reserved is not clearance, no free source exists for anything.

**N2 — CIP's extract boundary.** Where does "extracts" end and restated fact begin?

**One lawyer, two questions.** Both are short and specific. This is the cheapest high-
leverage legal spend available.

---

## D5 — Delete `tasking/completed/T5/`, and fix the KNOWLEDGE.md gap?

**Evidence** — `cartridge-licence-reconciliation/NOTES.md` N5:

> "It has no `task.json`, so it should be invisible to `tasking:check` — but it is
> untracked and would be swept into any `git add -A`."

**That prediction has come true.** Current gate output:

```
x tasking/completed/T5/BRIEF.md is missing.
x tasking/completed/T5/task.json is missing.
x tasking/completed/T5/ has no manifest in pending/ ...
```

**Three of four current failures are one stale folder.** Verified a strict subset of
`interior-ballistics`: all 6 filenames present there, 56,154 bytes.

**The decision:** delete it, or give it a manifest? **It is not a task**, so deletion
is right. **I did not delete it** — it is outside my write-set, and `.clinerules` §1
says report rather than repair.

**The durable half:** should `KNOWLEDGE.md` be mandatory? **Only 6 of 11 tasks
produced one.** A task can complete with every declared output present and contribute
nothing another agent can find.

---

## D6 — `roadmap-synthesis`'s own brief is wrong in two ways

Reported per `.clinerules` §10.1 — **reported, not repaired.**

**N6 — the grounding source is a blocked task.** Brief line 4:

> "**Grounded in:** `tasking/pending/brand-rename/BRIEF.md`"

`brand-rename` is a **blocked task in `pending/`**, not a completed source.
`task.json` says `tasking/completed/code-audit/KNOWLEDGE.md`. **The manifest is
authoritative** (the gate checks it); the brief's line is stale. A brief that names a
task which can never produce findings is a defect in brief generation.

**N7 — the premise went stale before the task could be claimed.** Brief:

> "Ten tasks completed and the queue is empty."

**Measured: 12 completed directories (11 real), and 8 tasks in `pending/` when I
claimed this one.**

**The lesson generalises past this task:** a synthesis task materialised on an empty
queue goes stale before an agent can claim it, because claiming is a folder move that
competes with the taskmaster's own materialisation. **Either regenerate it after the
wave drains, or stop asserting queue state in a brief.**

---

## D7 — TypeScript 7, `LICENSE`, `CONTRIBUTING.md` (from `AGENTS.md`, unchanged)

Carried forward for completeness; not findings from this swarm:

| Item | Blocker |
|---|---|
| **TypeScript 7** | `typescript-eslint` caps at `<6.1.0`. Prototype in a **separate worktree** |
| **`LICENSE`** | Owner decision. Repo is private, so nothing forces one — but default is **all rights reserved** |
| **`CONTRIBUTING.md`** | Owner decision |
| **D1 provisioning** | Needs owner credentials; `wrangler.toml` still has a placeholder `database_id` |

**The licence one has teeth.** `LICENSE` being absent means nobody may reuse the
domain physics or the drag tables — which is most of the value in this repository.

---

## Summary

| # | Decision | Cost | Blocks | Urgency |
|---|---|---|---|---|
| **D1** | Buy SAAMI Z299.x | budget | **226 cartridges**, all interior ballistics | **highest** |
| **D3** | Load-table licences | budget/legal | the product's headline feature | **highest** |
| **D5** | Delete `T5/`; mandate `KNOWLEDGE.md` | minutes | **a red gate, for everyone** | **now** |
| **D4** | One lawyer, two questions | small | 3 cartridges + a precedent | medium |
| **D2** | Ask CIP | one email | ~11 cartridges | after D1 |
| **D6** | Fix brief generation | small | future briefs | low |
| **D7** | Licence, TS7, D1 provisioning | — | reuse and deployment | low |

**Three of these are cheap and unblocked: D5, D6, D7.** D1 and D3 are the two that
determine whether this project has a load feature at all, and both are budget lines
that no agent can fund.