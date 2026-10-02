# PARALLEL WORK PLAN — how to split this across agents

**Written 2 Oct 2026, after the compliance and consolidation passes.** Every task
below was re-verified against the tree before being written down, so no agent
should be sent to re-do one marked done.

This file exists because [`TASK-LIST.md`](TASK-LIST.md) and
[`DATA-TODO.md`](DATA-TODO.md) are organised by *priority*, which is the right
axis for a person working alone and the wrong axis for several agents at once.
Priority does not tell you which files two agents will fight over.

**Do not use [`TASK-LIST.md`](TASK-LIST.md) as a work queue.** It is dated 30 Sep,
its counts are stale, and at least three of its blockers are now resolved. Keep it
for the reasoning behind the ballistics decisions.

**If you are splitting this across several agents, use
[`PARALLEL-WORK-PLAN.md`](PARALLEL-WORK-PLAN.md) instead.** This file is organised
by priority; that one is organised by **exclusive write-set**, which is what
actually prevents two agents from clobbering each other.


**Each task ships a copy-pasteable prompt in
[`AGENT-PROMPTS.md`](AGENT-PROMPTS.md), and every prompt points at
[`CONVENTIONS.md`](CONVENTIONS.md)** — the binding OOP, comment, security and
negative-test rules. Send the prompt, not just this table.

---

## The rule that makes this work

Two agents collide when they write the same file. Not when they touch the same
*topic* — when they write the same *path*.

So every task below declares an **exclusive write-set**. If a path appears in only
one task, two agents can work simultaneously and neither will clobber the other.
If a task cannot avoid a shared path, it says so and is marked **serial**.

Read your task's write-set before starting. If you need a file that is not in
it, that is a bug in the plan — report it, do not edit it.

---

## The two shared surfaces

Almost every collision risk in this repo comes down to two paths.

### 1. `data/generated/**` — regenerated wholesale

`npm run data:build` rewrites **every** dataset's JSON and Markdown, not just the
one you changed. Two agents each add a row to different seed CSVs, both run
`data:build`, and git shows ~28 modified files each — neither of which can tell
whose change is whose.

**Rule: only one agent runs `npm run data:build` at a time.** Data-population
agents (§B) finish their CSV edits, then queue for the build. Or, cleaner:
**let the integrating agent run `data:build` once after all data work lands.**

Your own CSV edit does not require running it. `npm run seed:check` validates
the CSV against its manifest and does not write to `data/generated/`. Use that to
check your work.

### 2. `data/schema/*.sql` — migration numbering is global

Migrations are numbered, append-only, and every agent's `schema:check` run
replays the whole chain. Two agents adding migrations concurrently collide on
numbering and produce a chain neither tested.

**Rule: only one task adds a migration, and it finishes before another starts.**
See **A2**.

`data/schemas/*.yaml` (manifests) are *not* a shared surface — one per dataset,
so different tasks own different files. The collision there is a column change,
which touches manifest + CSV + row count together. Each such task owns that trio.

---

## Baseline every agent starts from

```bash
npm run verify     # must exit 0 before you start and after you finish
```

**Measured 2 Oct 2026: exit 0, 235 tests, 14 stages.**

Note the docs disagree with each other and with that number:
[`TASK-LIST.md`](TASK-LIST.md) says 9 stages, [`DATA-TODO.md`](DATA-TODO.md) says
10, `AGENTS.md` says 11 and "~215 tests", `README.md` says 215. All are stale.
Fixing that is **D1**, and it is a prerequisite for trusting any of these
documents.

---

# §A — Infrastructure and safety

Run these **first and in parallel**. Nothing else should start until A1 lands,
because A1 is what stops a regression reaching production.

## A1. CI oracle cross-check — **highest value in the whole plan**

**Why:** [`TASK-LIST.md`](TASK-LIST.md) records that the solver shipped **three
real ballistics defects** while 161 tests passed. The tests agreed with the
implementation because both were wrong the same way. `data/reference/` exists as
an independent oracle and **nothing runs it in CI**.

This is the single highest-leverage task here. Without it, every data agent in §B
is shipping unverified physics.

| | |
|---|---|
| **Write-set** | `.github/workflows/verify.yml`, a new gate under `scripts/gates/`, a new test under `scripts/tests/` |
| **Reads** | `data/reference/**`, `packages/ballistics-core/src/**` |
| **Do not touch** | `data/schema/011_community_layer.sql` |
| **Done when** | A failing oracle comparison fails `npm run verify`, demonstrated by injecting a deliberately wrong value and showing exit 1 |

`scripts/extract/crosscheck-pressures.mjs` already exists — check whether it is
reusable rather than writing a second oracle.

## A2. Migration for the bullet-diameter split — **serial, blocks B1**

**Why:** B1 needs a schema migration, and migrations are the shared surface
described above.

**This is the one task that must finish before any other migration is added.**

| | |
|---|---|
| **Write-set** | `data/schema/` (one new numbered file), `docs/DATA-MODEL.md` |
| **Done when** | `npm run schema:check` passes with the migration applied, and its stated purpose is the diameter split |

## A3. Front-door check for `npm run website:csp:browser`

**Why:** the browser CSP check has never executed on `ubuntu-latest`. It was
skipped locally for weeks and turned out to be (a) not running at all and (b)
passing vacuously when it did — both fixed 2 Oct. Confirming it on the real
runner closes the last unknown in the CI chain.

| | |
|---|---|
| **Write-set** | `.github/workflows/verify.yml` only |
| **Blocks** | §C — do not trust the security work until this runs |
| **Done when** | A push to a review branch shows the step running and passing on `ubuntu-latest` |

---

# §B — Data population

**Fully parallel with §A and §C**, because each task owns a different seed file
or directory. Read the `data/generated/**` rule above first.

## B1. Bullet diameter split

**Why:** `bullets.diameter_in` holds calibre **designations** — it reads `0.264`
for a 6.5 mm bullet, whose real diameter is `0.256 in`. Any drag or
sectional-density calculation reading that column is silently wrong. This is a
live correctness defect, not a tidiness issue.

| | |
|---|---|
| **Write-set** | `data/seeds/bullets/*.csv`, `data/schemas/bullets.yaml`, migration from **A2**, `data/generated/**` (own datasets only) |
| **Needs first** | **A2** |
| **Do not** | Populate `bullet_dia_in` from a guess. NULL means "not known". A blank is a visible gap; a wrong value is a silent lie. |

## B2. `.45 ACP` and `.357 SIG` maximum pressures

**Why:** these chambers are dimensionally near-identical to 9 mm, so picking the
wrong figure is a chambering error. Confirmed for 9 mm, 9 mm+P, .40 S&W, 10 mm,
.38 Spl and .357 Mag; **not** these two.

| | |
|---|---|
| **Write-set** | `data/seeds/cartridge_specs/pistol.csv` only |
| **Source** | CIP TDCC and SAAMI Z299.3. `data/published/saami-z299.3-2022-centerfire-pistol-revolver.pdf` is on disk and unread |
| **Cross-reference only** | `docs/OPEN-SOURCE-LANDSCAPE.md` §2.3 — its contents are transcribed from SAAMI/CIP, so it is not a primary source |
| **Gotcha** | SAAMI and CIP disagree materially (.357 Mag is 35,000 vs 44,000 psi). Record both in their own columns. Never average them. |

## B3. Load-recipe decision — **longest lead time, start first**

**Why:** `recipes` is empty. Every feature that justifies the project depends on
it. This is a content/licensing problem, not an engineering one, and no code
fixes it.

The recommended shape already exists — **cite, do not reproduce**
(`docs/ROADMAP.md` §1, `docs/TODO.md` §0.1a). Recording the decision is the task;
populating the CSV follows.

| | |
|---|---|
| **Write-set** | `docs/DATA-MODEL.md` (decision), then `data/seeds/load_recipes.csv` + manifest, then a migration (**serial** — coordinate with A2) |
| **Rule** | Every row carries `source_id` **and** a page number. Never invent a charge weight. |
| **Note** | Finishes last, so begin before the short tasks finish. |

## B4. Bullet coverage — Hornady and Sierra

**Why:** 120 bullet rows total, and 109 are Berger. Hornady has 7, Sierra has 4.
Hornady XTP is absent entirely, which is conspicuous for a handloading site.

| | |
|---|---|
| **Write-set** | `data/seeds/bullets/hornady.csv`, `data/seeds/bullets/sierra.csv` |
| **Conflict with** | **B1** — B1 owns `bullets.yaml` and rewrites those CSVs. Do not run both at once |
| **First** | Read `docs/SOURCE-SURVEY.md`. It records which manufacturers publish usable tables and which publish nothing. No usable source is a legitimate "not started" — do not invent rows to fill a coverage cell. |

## B5. Powder geometry and burn-rate class

**Why:** `geometry` (single/double/triple base) is empty on all 169 rows and
drives load-density work plus `is_double_base` inference. `burn_rate_class` is
35% populated and drives the barrel-scaling exponent, currently `estimated`.

| | |
|---|---|
| **Write-set** | `data/seeds/powders/*.csv`, `data/schemas/powders.yaml` |
| **Source** | Manufacturer datasheets |
| **Gotcha** | Burn-rate **positions are not comparable across brands.** Do not merge Vihtavuori and Hodgdon onto one scale. |

---

# §C — Site, compliance, and affiliate

**Parallel with §B.** Different tree entirely.

## C1. YMYL trust signals — **needs an owner decision**

**Why:** this is the gap left open deliberately. The site displays reloading cost
data derived from powder charge weights, and there is **no author, no sources, no
"reviewed by", and no last-reviewed date** anywhere. Reasonable reviewers expect
those on safety-relevant how-to content.

Not a code task, and should not be assigned to an agent as one. An owner must
decide who is accountable for the content and whether they are qualified to be
named. An agent can then implement the decision.

| | |
|---|---|
| **Blocked on** | Owner decision. Do not start. |
| **Write-set** (once unblocked) | `apps/website/src/index.html`, plus a trust/attribution section |

## C2. Accessibility pass

**Why:** the compliance pass fixed 5 unlabelled inputs and added a skip link. The
remaining WCAG work needs judgement and ideally a screen-reader pass, which no
regex gate can certify.

| | |
|---|---|
| **Write-set** | `apps/website/src/index.html`, `apps/website/src/main.js` |
| **Constraint** | `npm run claims:check` enforces a floor — labelled inputs, skip link, one `<h1>`. Do not regress it |
| **Done when** | Keyboard-only traversal of the full page, plus one real screen-reader pass, recorded in the PR |

## C3. Affiliate network verification — **needs a human account**

**Why:** [`scripts/shared/affiliate-links.mjs`](../scripts/shared/affiliate-links.mjs)
carries conventional tag parameters (`avantlinkuid`, `irclickid`, `aovmt`, `aid`,
`cjevent`) whose provenance comment was corrected 2 Oct to stop claiming they
came from official documentation. They were **not** verified against primary
sources.

The failure is silent: a wrong parameter produces a link that loads perfectly and
earns nothing, discoverable only from a commission report months later.

| | |
|---|---|
| **Blocked on** | An approved affiliate account |
| **Write-set** | `scripts/shared/affiliate-links.mjs`, `scripts/tests/test-affiliate-links.mjs` |
| **Done when** | Each parameter confirmed in its network's dashboard, each with a test case |
| **Safety property** | Do not weaken this: tags are appended only when network **and** store ID are both present, so today's links are clean and untagged |

## C4. Apply to the affiliate networks

**Why:** zero of eight retailers are applied to, so every link is untagged and
nothing earns. AvantLink is the dominant network in this category.

| | |
|---|---|
| **Blocked on** | Owner: needs a bank account, tax form, and a live site to point at |
| **Write-set** | `data/seeds/sourcing_retailers.csv` |
| **Rule** | `commission_rate_pct` stays NULL until read from the network's own directory. Ammunition eligibility varies by program; some exclude it entirely. |

---

# §D — Integration and governance

**Strictly serial.** Everything here touches shared surfaces or needs the others
finished. Run last, one agent, in this order.

## D1. Reconcile every stale count

`TASK-LIST.md` (9 stages), `DATA-TODO.md` (10), `AGENTS.md` (11, "~215 tests")
and `README.md` (215) all disagree with reality: **14 stages, 235 tests**. An
agent reading any of those to judge scope will mis-plan. This is why §A and §B
state their own measured numbers instead of citing the docs.

| | |
|---|---|
| **Write-set** | `AGENTS.md`, `README.md`, `HANDOFF.md`, `docs/TASK-LIST.md`, `docs/DATA-TODO.md` |

## D2. Logical commit split

**Why:** 195 changed files (156 tracked, 39 untracked) with no logical grouping.
One commit makes the history useless and makes any revert all-or-nothing.

Suggested order, each a commit that leaves `npm run verify` green:

1. Remote-history rescue (`archive/**`)
2. Deploy-path fix (`wrangler.toml` + the gate that enforces it)
3. CSP browser-check fix (`spawn`, `closeAllConnections`, real proof-of-execution)
4. Claims/compliance pass + `claims:check`
5. Pressure primary-key corrections + regenerated data
6. Docs and governance

| | |
|---|---|
| **Write-set** | Git index only. Do not edit files. |
| **Rule** | Each commit verified green before the next. Never `git add -A` across chunks. |

## D3. Push a review branch, confirm CI, then merge

| | |
|---|---|
| **Write-set** | Git only |
| **Blocked on** | D2, A3 |
| **Do not** | Push to `main` until the browser CSP check has actually run on the runner |

## D4. Cloudflare deploy

**Why:** `wrangler.toml` `database_id` is still
`REPLACE_WITH_YOUR_D1_DATABASE_ID`. **No deploy can succeed until that is a real
ID** — owner credentials, not a code change.

| | |
|---|---|
| **Blocked on** | Owner credentials, plus D3 |
| **Verify** | `pages_build_output_dir` is `apps/website/dist`, and `npm run website:check` asserts the deploy path matches the build output |

---

# §E — Deliberately not scheduled

Recorded so they are not mistaken for oversights. Each is either parked by
decision or blocked on a human.

| Item | Why not now |
|---|---|
| LLM assistant | Model must never produce a charge weight, pressure, or trajectory. `docs/FUTURE-INTEGRATIONS.md`, `docs/ROADMAP.md` §3 |
| Errata monitoring | Never auto-apply a correction — show and require acknowledgement. `docs/ROADMAP.md` §1.1b |
| Review aggregation | Count, link, attribute. **Never score.** `docs/COMMUNITY-INTELLIGENCE.md` |
| Price scraping | Usually a contract violation, not just a technical risk. Use a network product feed instead. `docs/AFFILIATE.md` |
| Community layer schema | `data/schema/011_community_layer.sql` is load-bearing. Do not weaken it. |
| Live pricing on the site | `price_observations` is empty and calculator defaults are hardcoded. Product-data work, not consolidation work. |

---

## What an agent should do if the plan is wrong

Report it in the summary. Do not edit a file outside your write-set to make
progress — that is precisely the failure mode this document exists to prevent.
`docs/TASK-LIST.md` rule 7 says the same thing; this file gives it teeth by
naming the paths.