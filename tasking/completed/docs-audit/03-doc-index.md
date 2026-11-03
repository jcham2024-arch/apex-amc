# Doc index — for someone who has never seen this repo

154 Markdown files. This is the reading order, what is authoritative, what is
historical, and **which document wins when two disagree** (a question no current
document answers).

---

## The one rule that resolves most conflicts

> **When two documents disagree, the one that names a command to check is right.**

Stated in `AGENTS.md` ("Scope boundary"). It is the correct precedence rule, and this
index applies it throughout. Where neither names a command, the conflict is unresolved
and flagged as such.

**Corollary:** when a document quotes a number and another *measures* it, **the
measurement wins**. `.clinerules` §1 says this in stronger form: *"Never quote a stage or
test count from memory, from a task brief, or from another document — those drift, and a
stale count in a rules file is worse than no count because agents trust it."*

---

## Tier 1 — read these first

| Document | Why |
|---|---|
| [`AGENTS.md`](../AGENTS.md) | The baseline: repo shape, rules, and the trap table. **The file `.clinerules` points every agent at.** |
| [`.clinerules`](../.clinerules) | **Binding** on isolation, on never inventing a value, and on the report format. Notably now carries *no* counts — which is why its figures are correct. |
| [`README.md`](../README.md) | Orientation and common commands. |
| [`docs/CONVENTIONS.md`](CONVENTIONS.md) | Binding conventions: quoting sources, provenance, encoding. |

## Tier 2 — authoritative reference

| Document | Authority |
|---|---|
| [`docs/DATA-MODEL.md`](DATA-MODEL.md) | The data model. |
| [`docs/BRASS-AND-PRESSURE-CLASS.md`](BRASS-AND-PRESSURE-CLASS.md) | **Read before touching pressure data.** SAAMI vs CIP. |
| [`docs/BALLISTICS-AUDIT.md`](BALLISTICS-AUDIT.md) | **Read before trusting any trajectory number.** Solver correctness. |
| [`docs/SEED-DATA-GUIDE.md`](SEED-DATA-GUIDE.md) | How to populate the data layer correctly. |
| [`docs/SOURCE-SURVEY.md`](SOURCE-SURVEY.md) | What each manufacturer does and does not publish. |
| [`data/schemas/*.yaml`](../data/schemas/) | Column contracts — the rules the loader enforces. |
| [`HANDOFF.md`](../HANDOFF.md) | The contract between the data layer and `apps/`. |
| [`SECURITY.md`](../SECURITY.md) | Every security finding and its severity. |
| [`data/README.md`](../data/README.md) | Data pipeline layout. |

## Tier 3 — current open work

| Document | Note |
|---|---|
| [`docs/DATA-TODO.md`](DATA-TODO.md) | **The live task list.** Supersedes `docs/TODO.md` as of 2 Oct 2026. |
| [`docs/TASK-LIST.md`](TASK-LIST.md) | Code/safety work. **Has stale stage counts** (see `01-findings.md` F-4). |
| [`ROADMAP.md`](../ROADMAP.md) | Direction. Stale test count (F-7). |
| `docs/reviews/2026-10-02-project-audit.md` | Last full audit. **Its resolution note is wrong** — see conflict 6. |

## Tier 4 — historical, do not act on

| Document | Status |
|---|---|
| [`CHANGELOG.md`](../CHANGELOG.md) | Point-in-time record. **Its stale counts are correct as history and must not be "fixed."** |
| [`docs/versions/README.md`](versions/README.md) | What each tag changed. |
| [`docs/TODO.md`](TODO.md) | **Superseded** by `docs/DATA-TODO.md`. Kept for provenance. |
| [`docs/PARALLEL-WORK-PLAN.md`](PARALLEL-WORK-PLAN.md) | **Describes a superseded protocol.** Recommend deletion — `01-findings.md` §7. |
| [`docs/lessons/`](lessons/) | Post-mortems. |

---

## Documents that contradict each other

| # | Conflict | Winner | Why |
|---|---|---|---|
| 1 | **Test count**: 215 (`AGENTS.md:59`, `ROADMAP.md:24`, `docs/TODO.md:198`) vs 235 (`README.md:161`, `AGENTS.md:29`, `docs/TASK-LIST.md:36`) | **235**, or "215 core suite" | Measured: `npm run test:all` → 215 + 7 + 13. `npm test` alone is only the core suite. |
| 2 | **Stage count**: 14 (`ledger.json`) · 15 (`PARALLEL-WORK-PLAN.md:295`, `README.md:57`) · 9 (`TASK-LIST.md:28,277`) · 19 (`ci:check`) | **19** | Measured: 19 `&&` segments in `package.json` `verify`; `npm run ci:check` confirms. |
| 3 | **Data rows**: 989 vs 1031 | **1031** | Measured: `npm run data:health` → `TOTAL 26 1031`. |
| 4 | **Manufacturers**: 50 vs 58 | **58** | Measured: `Import-Csv data/seeds/manufacturers.csv` → 58 rows. |
| 5 | **Task count**: 14 (`ledger.json` baseline) vs 25 (old briefs) vs 19 | **19** | Measured: `npm run tasks:check`. |
| 6 | **`2026-10-02-project-audit.md:49`** — "All live claims corrected to 15 stages / 235 tests" | **19 stages** | That resolution is itself stale. A completed audit's claims drift like anything else. |
| 7 | **Active task list**: `docs/TODO.md` vs `docs/DATA-TODO.md` | **`docs/DATA-TODO.md`** | Explicitly superseded 2 Oct 2026, per `AGENTS.md`. |

---

## The rename risk — documented nowhere in `docs/`

**This is the gap this audit most wants closed.**

The site is named after a **LIVE registered trademark in its own product category**:

| Mark | Reg. No. | Status | Owner | Class |
|---|---|---|---|---|
| **APEX AMMUNITION** | **5391055** | **LIVE** (reg. 2018-01-30) | Apex Ammunition LLC (Mississippi, USA) | **IC 013 — shotgun shells** |

`https://apexmunition.com/` is a live operating storefront with an 18+ age gate.

`grep` for `5391055` / `APEX AMMUNITION` across `docs/` returns **zero hits**. It appears
only in `tasking/`. A reader auditing `docs/` for open risk would not know to look.

**Where it should be recorded:** `docs/DATA-TODO.md` already carries the other open
legal blocker (the `recipes` gap). The brand risk belongs beside it.

**Research:** `tasking/completed/trademark-clearance/` — 17 candidate names cleared,
33 domains checked, recommendation `ballisticsapi`. **`brand-rename` is blocked on an
owner decision; no rename is authorised.**

---

## What the gates already protect

`npm run docs:check` currently passes and **enforces**: UTF-8 without BOM, LF line
endings, and **every `scripts/`…`docs/` path in backticks resolving to a real file**.
That last one is why the "unlinked" findings are about *navigation*, not broken paths —
nothing dangles.

What it does **not** catch, and what this audit had to do by hand: **numbers**. A stale
count is syntactically valid, resolves every path, and is wrong. That is the entire
class of defect in `01-findings.md`.

---

## Suggested addition to `docs/README.md`

1. A **Tier 0** entry: the trademark risk, linking `tasking/completed/trademark-clearance/`.
2. A link to [`tasking/`](../tasking/README.md) — the four-tier agent protocol is
   currently invisible from the documentation index.
3. Mark `docs/TODO.md` **superseded** in the index table, so it is not opened first.
4. Add `docs/lessons/` and `docs/research-methods/` to the index.
5. **A precedence rule**, quoted from `AGENTS.md`: *when two documents disagree, the one
   that names a command to check is right.*