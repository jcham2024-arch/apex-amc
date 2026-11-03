# 02 — Gates I could not falsify, and gates that are blind

Task `gate-negative-tests`. The brief asks for both lists, and they are the same
list seen from two directions: a gate I could not break, and a gate that is not
checking what its name implies.

**Coverage: 11 of 21 verify stages were attacked. 10 were not.** What follows is
what I actually observed, with the harness artefact called out where it occurred.

---

## A. Four gates are BLIND — the mutation lands and they report OK

These are the real findings. Each mutation was applied to a throwaway copy and
each gate exited **0**.

### 1. `claims:check` — reads only the built site, not the docs

**Mutation:** appended to `docs/ROADMAP.md` —
*"A standard .308 Win load is 45.0 gr of Federal Premium behind a 168gr bullet."*

**Observed:** `claims & compliance   ok   5 claim types banned, 12 inputs
labelled, disclosure precedes retailer links` — **exit 0.**

**Why:** `scripts/gates/check-claims.mjs` reads exactly one file:

```js
const html = readFileSync(builtIndexFile, 'utf8');
```

The gate inspects `apps/website/dist/index.html` **only**. The repo's entire
Markdown corpus is unscanned.

**Why this matters more than the other three.** This is the gate that bans
charge-weight claims — the one output in this domain where a plausible wrong
number injures someone. It enforces that ban **in the rendered site**, and is
silent everywhere else the same claim can be written. A charge weight in
`ROADMAP.md` is invisible to it.

**Suggested vector (not applied — the brief forbids modifying a gate):** extend
the file list to include `docs/**/*.md` and `README.md`, and assert the ban holds
in prose as well as markup.

### 2. `audit:check` — a dependency scanner, not an advisory gate

**Mutation:** deleted `docs/audit/2026-10-02-project-audit.md`.

**Observed:** `no new high or critical advisory; 0 high/critical acknowledged` —
**exit 0.**

**Why:** `scripts/security/audit-advisories.mjs` wraps `npm audit`. It never
opens the advisory file. The name implies it polices the audit record; it does
not. Deleting the entire security audit is invisible to the gate named after it.

### 3. `oracle:check` — a weaker oracle passes

**Mutation:** reduced `data/reference/measured_data.csv` from 7 lines to 3,
deleting 4 measured points.

**Observed:** `measured_data.csv: 2 rows checked` followed by
`our physics agrees with data/reference at every compared point` — **exit 0.**

**Why:** the gate compares only the points that are present. Halving the evidence
halves the comparisons and the verdict is unchanged. **An oracle that degrades
gracefully is not a tripwire.** There is no minimum-row or minimum-coverage floor.

**Suggested vector:** assert a minimum number of measured points, and fail if the
count drops against a committed baseline. A shrinking oracle should be treated as
a finding, not a quieter pass.

### 4. `regulations:check` — no network verification

**Mutation:** replaced a `source_url` with `https://example.invalid/definitely-not-here`.

**Observed:** `regulations OK` — **exit 0.**

**Why:** the schema comment says the citation "Must be retrievable", and the gate
prints *"every governing rule carries a retrievable citation"*. Nothing fetches
the URL, so **retrievability is asserted, never checked.** A dead or moved statute
link — exactly what breaks when a legislature relocates a page — passes silently.

**Honest caveat:** checking URLs needs the network, so this gate would go flaky in
CI. That is a reason to make it a *separate, scheduled* check, not a reason to
leave the claim in the passing message.

---

## B. One gate that is correct but weakly specified

### `ci:check` — passes on a substring match

I first renamed `npm run oracle:check` to `npm run oracle:check-BOGUS` in the
workflow. The gate printed `all 21 stages accounted for` and **exited 0** —
which looked like blindness.

**It was my harness, not the gate.** The check is `workflow.includes('npm run ' + s)`,
and `npm run oracle:check-BOGUS` *contains* `npm run oracle:check`.

Deleting the line outright makes it fail correctly:

```
FAIL oracle:check is in npm run verify but not named in verify.yml
1 gate(s) would be skipped by CI.
ci FAILED   exit=1
```

**So `ci:check` is sound for its stated job.** The residual weakness is real but
minor: a stage renamed to a superstring would be read as present. Worth an
anchored regex; not worth calling the gate broken. I am recording this as a
**correction to my own first result**, because the initial reading was wrong and
the matrix would otherwise record a false positive.

---

## C. Ten stages never attacked

Not attempted, with reasons — this is the honest scope edge of the task.

| Stage | Why not attacked |
|---|---|
| `lint`, `typecheck:all`, `test:all` | Wrapper stages; the underlying tools have their own suites |
| `test:encoding`, `test:bullets` | Both have existing tests that already assert failure behaviour |
| `data:validate` | Only stage accepting an argument (`--check-drift`); needs a stale generated file to falsify |
| `handoff:status` | Needs an unaccepted `apps/` change; setting one up perturbs the tree other agents are using |
| `security:check`, `modules:check`, `website:check`, `check-tasks` | Broader; each needs its own sandbox and a distinct mutation |

**A gate not attacked is an untested gate.** That sentence is from the brief and
it is the correct reading: absence of a finding here is not evidence of soundness.