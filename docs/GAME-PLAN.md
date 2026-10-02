# GAME PLAN — 2 October 2026

The single place to look. Replaces reading weeks of chat history to work out
what has been done and what comes next.

**Do not read the older planning docs for direction.** `TASK-LIST.md`,
`PARALLEL-WORK-PLAN.md` and `TASK-D1` predate this file and are superseded where
they conflict. Keep them for history.

---

## 1. Where we actually are

| | |
|---|---|
| Baseline | `npm run verify` exits 0 |
| Verification | Every stage green. Do not quote a stage count here; `docs:check` fails on a stale one. |
| CI | **green on `ubuntu-latest`** — first run 2 Oct 2026 |
| Branch | `feat/v0.1.0-consolidated`, 52+ commits, clean tree |
| Tags | `v0.1.0-consolidated`, `v0.1.1-audit`, `v0.2.0-oracle`, `v0.3.0-ci-green` |
| `main` | **untouched**, 326 files and 26 commits awaiting review |

---

## 2. What the site is

> A **research and tooling site**. We aggregate data, we aggregate genuine reviews
> of available products, and we present the result with links to where the user can
> buy. We earn a commission on some links, which is disclosed.
>
> We are also, eventually, a seller of our own merch (Phase 9 — gated on traffic).

**It is two products, not one.** This is the most important structural fact about
the site and the easiest to lose.

| | **Side 1: store-bought** | **Side 2: reloading** |
|---|---|---|
| Question | What ammo for what purpose, where to find it, best price | How do I make my own, and what does that save |
| Evidence | **Third-party reviews**, with conditions | **Manufacturer load data**, first-party |
| Reviews needed? | Yes — the core of the product | **No** |
| Data held | **zero** loaded-ammunition products | 345 cartridge pressures, 169 powders, 120 bullets, 22 burn-rate positions |
| Work | Build the catalogue (Phase A) | Present it (Phase C) |
| Member feature | Price and restock alerts | **Save own recipes and results** |

**The harder half of the site is the one we already have most of the raw material
for.** Phase A looked like the blocker for everything; it is the blocker for Side 1
only.
---

## 3. What we have actually built

Not planned. Built, tested, and running.

### Infrastructure that did not exist before

| Thing | Why it matters |
|---|---|
| `oracle:check` | Compares 153 G1/G7 drag points against 744 independently sourced reference rows. **Before this, that data was read by nothing** — three ballistics defects had shipped behind self-written tests that shared the implementation's assumptions. |
| `ci:check` | Fails if any gate in `verify` is absent from CI. Added because **three gates were missing from CI entirely** and CI had never run. |
| `audit-advisories` | Fails on new high/critical advisories, reports known ones with a recorded reason. Added because `npm audit` **cannot pass** (no patched `node-forge` exists) and a permanently red step teaches everyone to ignore the exit code. |
| `verify-stage-count` rule in `docs:check` | A doc quoting the wrong stage count now fails. Added because ten documents quoted it wrong and no two agreed. |
| `regulations:check` | Every governing rule carries a retrievable citation, an ISO retrieval date, and a quotable text. Thirteen rows covering the GCA ammunition definition, 922(g), the FTC review rules, and the payment-processor question. Lists unverified rows out loud rather than hiding them. |
| `tasks:check` | Fails on overlapping write-sets between runnable tasks. Found four real collisions in already-written work. |
| `.clinerules`, ledger, task files | Multi-agent coordination that assumes nothing about safety. |

### Correctness and compliance work

- Removed 8 unsourced retailer ratings, "Verified" claims, superlative badges and a
  fabricated savings figure. `claims:check` blocks their return.
- Moved the affiliate disclosure above the retailer links, in the same viewport.
- Repaired a CSP check that **passed against a policy blocking the entire site**,
  and proved the repair by negative test.
- Fixed a Windows deadlock in that check (`spawn`, `closeAllConnections`).
- Fixed the deploy path (`wrangler.toml` pointed at a non-existent directory).
- Fixed a data-integrity bug where `.38 S&W` SAAMI and Lyman figures silently
  dropped each other because the primary key ignored the unit.

### Research and design

- Competitor landscape (4 sites read live), feature-gap plan, open-source stack
  research, safety-content requirements.
- Ammunition comparison model and the ballistics-video source rules.
- Three UI mockups and a shared token sheet.
- Agent-craft reference: model selection, team leadership, prompt shape.

---

## 4. Issues that arose, and what they taught

Every one of these was found by running something, not by reading something.

| Issue | Lesson now written down |
|---|---|
| Team dispatch failed with `Unauthorized` on 5 separate attempts | Smoke-test the harness with one trivial task before writing any real prompt. |
| Committed scratch `.mjs` files **five times**, twice shipped to CI | `/*.mjs` now gitignored. Habit still mine to fix. |
| `insert_line` placed content wrongly **twice**, producing malformed output | Use single writes plus programmatic validation, never `insert_line` to append. |
| CI failed **six times** before green; every failure was invisible to a Windows-only run | Run CI early. The CRLF/SHA-256 defect could never have been caught locally. |
---

## 5. The punchlist

Ordered by dependency. Each row names its write-set so `tasks:check` can prove
nothing collides.

### Now — free, unblocked, no new infrastructure

| # | Task | Why first |
| --- | --- | --- |
| **1** | **Reload-vs-buy verdict block** (Phase 0.2 / C.2) | We already compute both numbers and never state the conclusion. Pure presentation, and it is the bridge between the two halves of the site. |
| **2** | **18+ age gate** (Phase 0.1) | Table stakes in this vertical; Hornady does it before the site loads. |
| **3** | **Non-affiliation notice at the top** (Phase 0.3) | All four competitors state it above the content; we have it footer-only. |
| **4** | **Cents-per-round as the primary unit** (Phase 0.4) | Every competitor quotes per-round. |
| **5** | **Price time-series migration** (Phase 1.1) | **Blocks everything about price.** `price_observations` is single-valued today. STRICTLY SERIAL. |

### Next

| # | Task | Dependency |
| --- | --- | --- |
| 6 | **Safety-access gate** — assert safety content is reachable logged-out | Write this **before accounts exist**, so the rule is enforced the moment they do. |
| 7 | **Ammunition product schema with purpose taxonomy** (Phase A.1) | Blocks all Side 1 work. STRICTLY SERIAL. |
| 8 | **Seed ~20 duty and defensive lines** (Phase A.2) | Needs 7. ~20 lines, not 1,000 SKUs. |
| 9 | **Accounts + saved searches** (Phase 2) | Needs 6. |
| 10 | **Price history UI with an honest empty state** (Phase 3) | Needs 5. |

### Later — each gated, not merely deferred

| Phase | Gate on |
|---|---|
| 4 — paid membership | Phase 3 proving retention. Never paywall safety content. |
| 7 — review aggregation | The 465.3 obligations: published monitoring procedure, FTC sample capability. |
| 8 — video review links | Side 1 only. Never presented as manufacturer load data. |
| 5 — community | Real demand. An empty forum reads as abandonment. |
| 5b — **member marketplace** | **Attorney review first.** See below. Not deferrable on judgement. |
| 9 — merch, then brass | **A traffic threshold, written down first.** Plus Stripe's answer on brass — ask in writing before building. |

### Never

- Powder and primer. Excluded-process explosives.
- **Anything the regulations table has not cleared.** `data/seeds/regulations.csv`
  is the authority. If a product or feature is not covered by a row with a
  retrievable citation, it is out of scope until it is.
- **A member-to-member transaction marketplace.** See below and
  `research-competitors/07-member-marketplace.md`.
- **Brass as merchandise.** The owner's decision after the statute was checked:
  stay away from anything with rules, and focus on easy merchandise. That is a
  decision made with the citation in hand, which is exactly how it should be
  made.
- **A member-to-member transaction marketplace.** 18 U.S.C. 921(a)(17)(A) defines
  ammunition as including "cartridge cases, primers, bullets, or propellent
  powder." Brass and loose bullets **are** ammunition under the GCA, so the
  intuitive "they are just components" reading is wrong in the direction that
  increases risk. An 80% lower is a firearm under 921(a)(3)(B). Full analysis in
  `research-competitors/07-member-marketplace.md`. A want/wanted board with no
  prices and no transactions is the safer variant, and is **not** risk-free —
  it reduces the surface without removing it.
- Anything requiring a background check.
- Fabricated ratings, or a composite score synthesised from incomparable sources.
- Ranking retailers by commission paid.
- Ordering manufacturer data and independent testing without labels.

---

## 6. Standing constraints

Not advice. These are why several tasks are marked strict.

1. **Migrations are strictly serial.** One agent, one migration, at a time.
2. **`data/generated/**` has a single builder.** `npm run data:build` is a lock.
3. **Every new gate must be negative-tested.** A gate that cannot fail is worse
   than no gate, and this repository has the scar tissue to prove it.
4. **No claim without a source** — including a video, a comment, or a review.
5. **Terminal performance is not a property of the ammunition.** Expansion depends
   on barrel length, media and temperature. Every such claim names its conditions
   or is not displayed as a product fact.
6. **Never fabricate an answer.** "Unverified" is a correct result.

---

## 7. Open questions for the owner

1. **Stripe and brass** — ask in writing. Reloadable brass may be refused as
   "ammunition components" despite being inert. This decides Phase 9's brass half,
   and is the cheapest thing on this list that could change a plan.
2. **`main` is unmerged** — 26 commits and 326 files want review via a PR, which
   also exercises CI on `main`.
3. **Traffic threshold for Phase 9** — what number, written down before the store
   exists rather than judged mid-project?
4. **Purpose taxonomy** — controlled vocabulary we define, or free text? Affects
   A.1 and cannot change cheaply afterwards.
5. **Member marketplace** — needs a firearms-experienced attorney, not a
   decision from this conversation. The statute is wider than the proposal
   assumed. This is the one item on this list I would not act on without advice.

---

## 8. Where the detail lives

| Question | Read |
|---|---|
| What competitors have that we do not | `research-competitors/01-competitor-landscape.md` |
| What to build, in order, with write-sets | `research-competitors/02-feature-gaps.md` |
| Payments, auth, forums, charts | `research-competitors/03-open-source-resources.md` |
| Safety content a responsible site must surface | `research-competitors/04-safety-content.md` |
| Which videos to link, and why partnerships are unsafe | `research-competitors/05-ballistics-video-sources.md` |
| Ammunition comparison model, and what we may not conclude | `research-competitors/06-ammunition-comparison-model.md` |
| Member marketplace, and why the statute is wider than it looks | `research-competitors/07-member-marketplace.md` |
| What the UI should look like | `mockups/` |
| How to work with agents | `agent-craft/` |
| What broke and why, historically | `audit/2026-10-02-project-audit.md` |
| What each version changed | `versions/README.md` |

---

## 9. Honest assessment

The infrastructure is now genuinely good: verification runs on a real platform,
gates cannot drift from CI, and the physics is checked against data we did not
write. That is further along than most projects reach at this stage.

**What is not done is the product.** There is still no loaded-ammunition data, so
the store-bought side — half the site — cannot render. And no price history, so we
cannot answer the question users actually arrive with.

Both are buildable and neither is blocked on anything external. The gap between
"the plumbing is excellent" and "the site does something" is the remaining work,
and it starts with a verdict block we could have shipped weeks ago.

One caveat on all of the above: I am not a lawyer. The regulatory reasoning in
`research-competitors/04-safety-content.md` is my reading of the FTC rules, and
the §465.3 obligations in particular are worth a real attorney's review before
Phase 7 ships.
| The recorded handoff SHA-256 **could never match a Linux build** | Recorded from a CRLF working copy while git stores LF. |
| **Three gates were in `verify` but absent from CI** | Automated parity beats a hand-maintained list. |
| My new oracle gate silently compared nothing and exited 0 | Checked because I read the output rather than the exit code. The exact vacuous-gate failure this project exists to fix. |
| Over-corrected on retailer ratings, then on selling physical goods | Twice I wrote "never" when the answer was "with conditions." Both caught by the user. |

**The bridge between them is the reload-vs-buy verdict.** We compute both numbers
and never state the conclusion. That one block is what makes this one site.