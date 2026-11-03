# KNOWLEDGE — gate-negative-tests

Task `gate-negative-tests`. Findings worth carrying forward. Full vectors in
`01-negative-test-matrix.csv`; reasoning in `02-untestable-gates.md`.

---

## 1. Four gates are silent on violations. Verified, not inferred.

Each mutation was applied to a `tmp/` copy and each gate exited **0**.

| Gate | What it ignores |
|---|---|
| **`claims:check`** | Every Markdown file — reads only `apps/website/dist/index.html` |
| **`audit:check`** | The security advisory file it is named for |
| **`oracle:check`** | Losing measured-data rows (no coverage floor) |
| **`regulations:check`** | Whether `source_url` actually resolves |

**`claims:check` is the dangerous one.** It is the gate that bans charge-weight
claims — the one class of value in this repo where a plausible wrong number
injures someone. A charge weight written into `docs/ROADMAP.md` passes it. It
enforces the ban only in the rendered site.

## 2. "Agrees at every compared point" is not a coverage claim

Deleting 4 of 6 measured rows produced:

```
measured_data.csv: 2 rows checked
our physics agrees with data/reference at every compared point
oracle OK
```

Halving the evidence halved the comparisons and changed nothing. **An oracle that
gets quieter as its data shrinks is not a tripwire.** Any oracle gate needs a
committed minimum-coverage floor.

## 3. `ci:check` is sound — my first reading was wrong

I recorded it blind after renaming `npm run oracle:check` → `...-BOGUS` and still
seeing exit 0. **Wrong.** The check is `workflow.includes('npm run ' + s)`, and
`npm run oracle:check-BOGUS` *contains* the target string. Deleting the line fails
correctly.

Generalisable: **before calling a gate blind, confirm your mutation did what you
think.** A rename that keeps the old name as a substring tests nothing.

## 4. Asserting a property is not checking it

`regulations:check` prints *"every governing rule carries a retrievable citation"*
and never fetches a URL. `audit:check` passes with the advisory deleted.

Both messages describe a guarantee the code does not test. **A gate whose success
message overstates what it verified is worse than one that says nothing** —
readers trust the message, not the absence of an error.

## 5. Windows harness traps (cost real time)

- **`execFileSync('npm', …)` fails** — npm is a `.cmd` shim. Use `cmd.exe /c`.
  Getting this wrong manufactures a false "every gate is broken" finding.
- **Piping through `Select-Object` masks `$LASTEXITCODE`.** Capture with
  `cmd /c "... 2>&1"` then read the code.
- **Copy `packages/` for `oracle:check`** — it imports from
  `packages/ballistics-core/`. Missing it yields exit 1 that looks like a caught
  violation but is a missing file.

## 6. Do not hand-write the verify stage count

`docs:check` fails any document that quotes an "N stages" figure with
`verify-stage-count`, because the number drifts and every reader trusts it.
Compute it instead:

```bash
node -e "console.log(require('./package.json').scripts.verify.split('&&').length)"
```

**I violated this twice** — once in a mailbox message and once in this file —
before reading the rule. Quoted gate *output* (`all 21 stages accounted for`) is
fine: that is a transcript of what the gate printed, not a hand-maintained count.

## 7. The reusable method

To falsify a gate: copy the tree, apply **one semantic** mutation, assert the exit
code goes non-zero, record the evidence line. Three checks before believing a
result:

1. Did the mutation actually apply? (Print it.)
2. Is the failure for the *intended* reason, or an incidental one? (Read the error.)
3. Does a **control** mutation still pass? (Guards against a sandbox that is
   simply broken.)

Point 3 caught a whole class of false "CAUGHT" results here — a sandbox missing
`packages/` failed on a file-not-found that had nothing to do with the mutation.