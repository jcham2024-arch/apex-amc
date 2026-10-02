# Documentation index

Last updated 1 Oct 2026. Start here.

---

## Where the project stands

Measured, not remembered. Re-run `npm run verify` and `npm run coverage` before
trusting any figure.

| | |
|---|---|
| Tests | **235 passing** |
| `npm run verify` | **green, every stage** |
| Solver | agrees with an independent implementation to **1 fps** |
| Recipes | **zero** â€” the load feature has no data yet |

Three real ballistics defects were found and fixed on 30 Sep 2026, **all while
161 tests passed**. See `BALLISTICS-AUDIT.md` section 0 and
`OPEN-SOURCE-LANDSCAPE.md` 1.1b.

---

## Read these first

| Doc | What it is |
|---|---|
| **[../AGENTS.md](../AGENTS.md)** | **Baseline for any agent or contributor.** Governing rules, verified state, and the traps that have silently produced wrong behaviour here. |
| **[TASK-LIST.md](TASK-LIST.md)** | **THE PLAN for code and safety.** Blockers, priorities, done-when criteria, rules. |
| **[DATA-TODO.md](DATA-TODO.md)** | **THE PLAN for the data layer.** Row counts, coverage, integrity defects, and the unbuilt database path. |
| [SOURCES.md](SOURCES.md) | Every external figure we rely on, with provenance and retrieval dates. |
| [BALLISTICS-AUDIT.md](BALLISTICS-AUDIT.md) | Solver correctness. **Section 0 is the current state â€” read it before trusting any trajectory number.** |
| [OPEN-SOURCE-LANDSCAPE.md](OPEN-SOURCE-LANDSCAPE.md) | External implementations and datasets. **How three defects hid each other â€” 1.1b.** |
| [ORACLE-SOURCES.md](ORACLE-SOURCES.md) | Published hard data for cross-checking. Contains the authoritative McCoy drag table. |

## Architecture and data

| Doc | What it is |
|---|---|
| [**../ARCHITECTURE.md**](../ARCHITECTURE.md) | **The module map** â€” what is split, what deliberately is not, and the gate that proves the pieces still fit. |
| [**VARIABLES.md**](VARIABLES.md) | **Where every value lives.** The three tiers, which literals must never be hardcoded, and which must stay inline. |
| [**REVIEW.md**](REVIEW.md) | **Security and practice review (Oct 2026).** Open findings, outdated dependencies, and what *not* to change â€” including why OOP stays. |
| [**DEPENDABOT.md**](DEPENDABOT.md) | **Automated dependency updates.** What Dependabot is, how it is configured here, and why Expo is notify-only. |
| [DATA-MODEL.md](DATA-MODEL.md) | Schema overview and migration plan. |
| [SEED-DATA-GUIDE.md](SEED-DATA-GUIDE.md) | How to populate the data layer correctly. Provenance rules for the data agent. |
| [DATA-REPOSITORY.md](DATA-REPOSITORY.md) | How the data pipeline works end to end. Start at `data/README.md`. |
| [SOURCE-SURVEY.md](SOURCE-SURVEY.md) | What each manufacturer publishes, and what they do not. **Read before harvesting any product line.** |

## Domain reference

| Doc | What it is |
|---|---|
| [BRASS-AND-PRESSURE-CLASS.md](BRASS-AND-PRESSURE-CLASS.md) | Brass, +P/NATO, case capacity, SAAMI vs CIP. **The "stronger brass" correction lives here.** |
| [COMMUNITY-INTELLIGENCE.md](COMMUNITY-INTELLIGENCE.md) | Why the LLM over forums stops at extraction. **Where weighing begins is where we refuse.** |
| [EQUIPMENT.md](EQUIPMENT.md) | Scoping for the equipment section. Specification data, not opinions. |

## Hardware and product

| Doc | What it is |
|---|---|
| [HARDWARE-AND-SENSORS.md](HARDWARE-AND-SENSORS.md) | Rangefinders, weather meters, turrets. What integrates and what does not. |
| **[../SECURITY.md](../SECURITY.md)** | **Security findings in the shipped app**, their severity, and what fixes each one. |
| [COMMUNITY-AND-GROUP-BUY.md](COMMUNITY-AND-GROUP-BUY.md) | Pledge â†’ group closes â†’ shooter pays retailer. Why Apex never holds pooled funds. |
| [COMPETITIVE-LANDSCAPE.md](COMPETITIVE-LANDSCAPE.md) | Who we compete with, and where we can actually win. |

## Parked work

| Doc | What it is |
|---|---|
| [FUTURE-INTEGRATIONS.md](FUTURE-INTEGRATIONS.md) | LLM integration, errata monitoring, review aggregation. **Parked, not abandoned** â€” the reasoning and safety boundaries are preserved. |
| [**../AGENTS.md**](../AGENTS.md) | **Baseline for agents.** (Previously duplicated here as `AGENT-HANDOFF.md`; removed to stop the two copies drifting.) |
| [LANE-7-FORUM-AGENT.md](LANE-7-FORUM-AGENT.md) | **Ready-to-hand brief** for a model tasked with reading, mapping and linking forum threads. Self-contained. |

---

## The one rule that explains most of these documents

**Anything we display must be traceable to a cited source, or be labelled as an
estimate.** When a feature can only work if we invent a number, that feature has
become the wrong feature. This is why the load tool is a *published-load
reference* and not a load-design engine, why brass has no safety score, and why
forum data is a lead and never a citation.

The useful version of every feature here only reports facts we can cite and
links to the evidence. The unsafe version always synthesises a recommendation.