---
proposal: claims-gate-prose-scope
title: Extend claims:check to the prose corpus, not just the built site
derived_from: tasking/completed/gate-negative-tests/KNOWLEDGE.md
evidence: "It is the gate that bans charge-weight claims — the one class of value in this repo where a plausible wrong number injures someone. A charge weight written into `docs/ROADMAP.md` passes it. It enforces the ban only in the rendered site."
shape: change
priority: high
write_set:
  - tasking/completed/claims-gate-prose-scope/
required_outputs:
  - REPORT.md
  - KNOWLEDGE.md
---

## Why

`scripts/gates/check-claims.mjs` reads exactly one file:

```js
const html = readFileSync(builtIndexFile, 'utf8');
```

So the gate that exists to prevent the repo publishing a **charge weight** —
the single number class in this domain where a plausible wrong value injures
someone — enforces that ban **only in `apps/website/dist/index.html`**.

Observed on a throwaway copy: appending

> *"A standard .308 Win load is 45.0 gr of Federal Premium behind a 168gr
> bullet."*

to `docs/ROADMAP.md` produced `claims & compliance ok` and **exit 0**.

**This is `shape: change`, not `research`.** Extending a gate's scope changes
what every future agent is held to, and `docs/CONVENTIONS.md` treats prose
claims as binding. A human should decide whether the ban applies to the Markdown
corpus at all before a swarm starts enforcing it. Autonomously widening a
safety gate's scope would itself be an unreviewed policy change.

## Scope once approved

1. Extend `check-claims.mjs` to scan `docs/**/*.md`, `README.md`, `CHANGELOG.md`
   and the `tasking/` corpus for the banned claim types it already enumerates.
2. Add the **negative test that already exists and works**: a fixture containing a
   charge weight must fail. The vectors are in
   `tasking/completed/gate-negative-tests/01-negative-test-matrix.csv`.
3. Keep the built-HTML check — this is additive, not a replacement.

## Do not

- **Do not widen scope without a human.** That is why this is `shape: change`.
- **Do not add load data to test fixtures.** Use an obviously synthetic cartridge
  name so a fixture can never be mistaken for a reference value. The gate must
  detect the *shape* of a load claim, not validate it.
- **Do not weaken the existing HTML check** while adding prose coverage.

## The other three blind gates

Same task family, recorded so they are not lost. Each observed exiting 0:

| Gate | Blind to | Suggested fix |
|---|---|---|
| `audit:check` | the advisory file it is named for | read `docs/audit/*.md` and assert the inventory exists |
| `oracle:check` | losing measured-data rows | committed minimum-coverage floor; a shrinking oracle must fail |
| `regulations:check` | dead `source_url` values | separate scheduled link-check (network flakiness is why it belongs outside CI) |

Of these, **`oracle:check` is the one I would fix first**, because it is the only
one whose blindness is *silent in the normal case*: deleting measured data makes
the gate quieter and greener rather than red. That is the exact
`AGENTS.md` failure class — *"a check that passes while producing wrong output"* —
and a data-loss regression would sail through the whole pipeline.

## Not re-proposing

`tasking/completed/gate-negative-tests` already covers the *test vectors* for all
of these. This proposal is only about **wiring** them into gates, which the
earlier task was explicitly forbidden to do.