# BRIEF — Safe load ladder as published-data interpolation, with mandatory EMPTY

**Task id:** `load-ladder-interpolation-spec` · **Priority:** high
**Grounded in:** `tasking/completed/interior-ballistics/05-feasibility-verdict.md`

## Why this task exists

The owner wants a user to pick components they can buy and get a safe load ladder plus cost per round. The physics cannot do that: interior-ballistics established that no manufacturer publishes burn rate, pressure exponent or force curve for retail powder, and that fitting constants from published load data is DEGENERATE rather than merely noisy. But the same task concluded the achievable product IS an interpolation engine over published load tables with mandatory EMPTY on an unresolvable match - exactly what Berger and Hornady do by hand. This specifies that, safely. It remains blocked on licensed load data, which is the owner's decision.

## Before you start

1. Read `.clinerules` — especially §10 (the swarm), §11 (mail), §12 (proposals), §13 (the standing slot).
2. Read your `task.json`. Every file in `required_outputs` must exist or this task is not done.
3. Read your source: `tasking/completed/interior-ballistics/05-feasibility-verdict.md`. Your task is derived from it, not from your assumptions.
4. Read `tasking/mail/bulletin/*.md` and `tasking/mail/outbox/taskmaster/<your-id>.md`.
5. Claim it: `mv tasking/pending/load-ladder-interpolation-spec tasking/in-progress/`
6. Send a START message to your inbox. `npm run tasking:check` must pass before you send STOP.

## Scope

- Specify the MATCH KEYS: which published fields must agree for a row to be a candidate, and which have usable coverage across readable sources. Include which are likely absent - an unmatchable key is the most likely EMPTY trigger.
- Enumerate EMPTY conditions exhaustively: no powder match, no projectile match, single-source-only row, and any case where the answer would extrapolate beyond the matched envelope. EMPTY is a correctness property, not an error path, and must be a designed output rather than a blank that looks like a bug.
- Specify the RESOLVER'S REFUSAL, which interior-ballistics calls the single most important design requirement: a resolver that cannot say 'I am not sure this is the same thing' is unsafe by construction. The documented failure is Hornady's own handbook listing a misprinted powder for 6.5 PRC - one wrong name in a printed table, and a name-matching system carries identical risk with no erratum channel.
- Specify provenance for every returned value: a number must name its source row, and a number that cannot is EMPTY by definition.
- State the data dependency precisely. This cannot be built without licensed, citable load observations and we currently hold NONE. Name the owner decision required and what each option costs.
- Design how the ladder displays: the range, its source, and its date. A ladder presented as current fact when the underlying handbook is twelve years old is a claim we cannot substantiate.

## Do not

- Do NOT compute, interpolate, extrapolate or fit any charge weight, not even as an example or placeholder. This task produces a specification; producing a charge weight is out of scope and unsafe.
- Do not treat this as unblocked. It is blocked on a licensing decision recorded in FIX-BACKLOG.md item 10.
- Do not design a lookup that could return a confident answer it cannot source. Refusal is the feature.

## Definition of done

- `REPORT.md`
- `KNOWLEDGE.md`
- `01-match-keys.md`
- `02-empty-semantics.md`
- `03-resolver-refusal.md`
- `04-data-dependency.md`

```
npm run tasking:check     # every declared output must exist
npm run verify            # must exit 0
```

Plus, in `REPORT.md`: what you did, what you found, the reasoning, what you did NOT
do and why, and any unresolved issue in `NOTES.md`.

## When you finish

1. `mv tasking/in-progress/load-ladder-interpolation-spec tasking/completed/`
2. Append a STOP message to `tasking/mail/inbox/<your-id>.md` — declare the real file count, the gate is checked against disk.
3. **Write a proposal** at `tasking/mail/proposals/<your-slug>.md` for the most valuable follow-up you found. Cite a file and quote it. See `.clinerules` §12.
4. Append anything reusable to `tasking/mail/bulletin/<your-id>.md`.
5. Run `npm run tasking:restock`, then claim the next task. Do not wait for a reply.
