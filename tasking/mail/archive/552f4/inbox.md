> **ARCHIVED 2026-10-03T00:47:40Z.** Agent `552f4` is closed. This file is kept verbatim as the record of what it found and reported. It is no longer read by `check-mail`, so it can no longer fail the build - but it is still evidence.

# Inbox: 552f4

<!-- 2026-10-02T16:05:00Z | AGENT 552f4 | START -->
**Task:** handgun-coaching-feasibility
**Priority:** ready, unblocked. Claimed last turn (still held), finishing before taking new work.
**Model:** fresh instance of the default model.
**Note on this START being late:** I claimed this task in the previous turn and did not
finish it. §10.2 says take the next task without prompting; §1 says never strand a claim,
because a claimed folder is invisible to every other agent. So I completed my own task
before claiming anything new. `roadmap-synthesis` (priority: highest) was claimed by another
agent while I was reading the queue; I did not contest it.

**Headline finding, and it is the negative result the brief asked for:**
> Do not build the real-time coaching feature. The arithmetic says a phone photo resolves a
> 3.0in group but a 0.5in group only marginally, AND — the decisive point — the localisation
> error is dominated by the bullet hole itself, not by resolution. More megapixels buys
> nothing. Plus: the fault taxonomy does not exist in a form that can be applied
> (`completed/shot-group-taxonomy/`), and Google Play prohibits *sale/manufacture* of firearms
> while saying nothing about *depiction or analysis* — so the store risk is far lower than
> feared, and the technical risk is far higher.

**Written:** START appended after the work began, not before. Recorded rather than tidied.

<!-- 2026-10-02T16:40:00Z | AGENT 552f4 | STOP -->
**Task:** handgun-coaching-feasibility
**Status:** complete
**Written:** 8/8

Files on disk: **10**. The 8 declared outputs plus `BRIEF.md` and `task.json`, which travel
with the folder because claiming is a move. Counted by the gate, not by me.

**Verdict, first paragraph verbatim (the deliverable per §6):**
> Do not build the coaching feature. Build the measurement half. Specifically: do not build
> anything that tells a shooter what fault they have. The measurement half is buildable and
> worth doing — a phone photo resolves a 3.0-inch group comfortably at 21 ft, and both app
> stores' weapons policies turn out not to prohibit it. But the advice half cannot be built
> honestly... **more megapixels buys nothing**: the localisation error is dominated by the
> bullet hole itself — 0.251 inches at every resolution from 10 to 50 feet.

**Key findings:**
1. **131.6 ppi** at 21 ft / 48MP. The obvious calculation (1196 ppi) is **wrong by ~9×** — it
   assumes the target fills the frame; a phone would need a **572 mm** lens and has 26 mm.
2. **0.251 in measurement floor, invariant** from 10–50 ft and 12–108 MP. `group floor =
   1.125 × hole_diameter` — **ppi cancels out**. The accuracy ceiling is physics, not
   hardware, and cannot be bought out of.
3. **Neither store prohibits this app.** Google Play's weapons policy regulates *sale* and
   *manufacture instructions*; Apple §1.1.3 targets *reckless use* and *purchase facilitation*.
   Both quoted verbatim in `04-`.
4. **Apple's on-device privacy exclusion** ("Data that is processed only on device is not
   'collected'") makes never-upload the cheapest correct architecture.
5. **Handedness inverts the advice** if inferred rather than asked. The one correctness trap
   that produces a wrong instruction rather than a vague imprecision.

**No prototype built** (prohibited). No file written outside my task folder and `tmp/`.

**Isolation — one thing a reviewer must know.** `git status` shows `package.json`,
`scripts/gates/check-mail.mjs` modified and two untracked files in `scripts/tasking/`. **These
are not mine.** The `check-mail.mjs` diff credits agent `ee247` by name in its own comment, and
`tasking:restock` is their script. I never wrote to `scripts/` or `package.json` in any session.
Stated because "the gates only prove you stayed inside your folder" (§10.5) — and a reviewer
seeing those diffs should not attribute them to me.

**Two retractions I owe the record:**
- I initially wrote "no number invented" while a table in `01-` contained a figure I had not
  derived. Removed rather than kept; the same file now derives everything from `tmp/ppi.mjs`.
- I claimed privacy risk was the dominant concern. **The policy text shows the opposite:** the
  weapons policies permit this app, and privacy risk is *reduced* by on-device design. I
  corrected the direction rather than softening it.

**Proposed follow-up:** `tasking/mail/proposals/centre-standard-error.md`.

**Next:** claiming the next task from `pending/` per §10.2.

<!-- 2026-10-02T17:05:00Z | AGENT 552f4 | STOP -->
**Task:** unknown-state-design
**Status:** complete
**Written:** 4/4

Files on disk: **6** — the 4 declared outputs plus `BRIEF.md` and `task.json`, which travel with
the folder. Counted against disk, not asserted.

**Headline: the bug this task was commissioned to prevent is already live.**
`apps/website/src/main.js` has **7** occurrences of `|| 0` on user-supplied cost inputs. An
empty field becomes `0`, renders as `$0.000`, and break-even renders **"0 rounds to break even"**
— meaning *equipment is free* when it means *we do not know*. **Invisible to every rendering
test, because `$0.000` renders perfectly.**

**I did not fix it** — `apps/` is outside my write-set and the brief forbids editing it. It is
the top item in `REPORT.md` and in proposal `no-zero-defaults.md`.

**Key findings:**
1. **The brief's 0/229 claim is true but incomplete, and the incomplete part is worse.**
   `saami_max_psi` is **98/229**, `saami_max_cup` 82/229. **The dominant state is mixed, not
   empty** — a design handling only the fully-empty case renders `0` beside real numbers in the
   same column, which is *more* misleading, not less.
2. **The dimensional table does not exist yet.** No dimensional column appears in
   `apps/website/src/`. The live surface is a cost calculator — which is why finding 1 outranks
   the brief's framing.
3. **All four absences occur in this repo, and `cip_max_bar` is a licence restriction.** Rendering
   it "Not recorded" is *actively false*: we have the source and may not copy it. This is the
   strongest argument for four states.
4. **The mockups already solved part of it** — `_tokens.css` lines 136-138 define `--text-mute`
   and a `.empty` block, never ported. Checking first saved designing what exists.

**A self-correction worth recording:** I first wrote "six inputs, all `|| 0`" by enumerating the
cost lines. Counting gives **seven**. I corrected all three files rather than leaving a plausible
number in place — the same class of error this repo's rules exist to catch, and I only caught it
because I re-ran the count instead of trusting my own enumeration.

**Two proposals written and accepted** (`proposals:check` → 15 grounded, contained, safe):
- `centre-standard-error.md` — flagged as a probable **duplicate** of the already-queued
  `group-standard-error`.
- `no-zero-defaults.md` — the `|| 0` fix, `shape: change`.

**Isolation:** no changes by me under `packages/ data/ scripts/ apps/ package.json`.

<!-- 2026-10-02T17:10:00Z | AGENT 552f4 | START -->
**Task:** group-standard-error
**Priority:** medium, ready, unblocked. Claimed immediately after completing the previous task
(§10.2 — do not wait to be asked).
**Model:** fresh instance of the default model.

**Note on provenance:** this task is the materialised form of
`tasking/mail/proposals/centre-standard-error.md`, which I filed earlier this session from
`completed/handgun-coaching-feasibility/`. **My proposal and this brief are the same work.** I
flagged the possible duplication in my own proposal and am executing the queue's version rather
than re-proposing it. **The proposal should be closed as a duplicate** so the swarm does not
run it twice.

**Two independent sources agree this gap matters:**
- `completed/shot-group-taxonomy/KNOWLEDGE.md` §5 — "any threshold rule must be expressed in
  units of the group's own standard error, or it will fire on noise."
- `completed/handgun-coaching-feasibility/01-measurement-accuracy.md` §6 — same finding,
  reached from the vision side.

**Plan:** derive the standard error per axis, then **verify numerically against synthetic
groups with a known sigma** — the brief requires it and it is the difference between a
specification and an assertion. Label every derived quantity as derived, never published.

<!-- 2026-10-02T17:45:00Z | AGENT 552f4 | STOP -->
**Task:** group-standard-error
**Status:** complete
**Written:** 4/4

Files on disk: **6** — 4 declared outputs plus `BRIEF.md` and `task.json`.

**Result, verified not asserted:**
- `SE = sigma / sqrt(n)` per axis. **Empirical/predicted ratio 1.00 ± 0.008 for n=2..30**,
  20,000 trials each, **seeded RNG** so it reproduces rather than passing by luck.
- **Every input already exists** — `sigma.{x,y}` and `n` are returned by `dispersion()`.
  It is arithmetic on existing fields. `packages/` untouched (verified by `git status`).

**The finding that matters: the bias is in the DANGEROUS direction.**
`E[sigma_hat] < sigma` — **−20.3% at n=2, −12.0% at n=3**, decaying as `1/(4n)`. So a
threshold at `k*SE` is set **too low** and fires **too often**: a "2-sigma" rule fires
**18.4% at n=3 against a nominal 4.6%** — four times promised. This is the brief's "worse than
no threshold", quantified: not imprecise but **confidently wrong, most often, where it is least
trustworthy.**

**Derived shot count: n≈60, not n≈30, for the 10%-of-nominal criterion. A handgun string is
5–10 rounds, so at typical n a POI-offset threshold rule is not defensible.** No source states
any of this; it is labelled DERIVED throughout.

**Two corrections to my own work, both recorded in the files:**
1. **I interpolated n≈30, then measured it: 5.7%, not ~4.9%.** 24% over nominal, not 7%. The
   plausible-looking number was wrong — I re-measured rather than defending it.
2. **My verification script printed tables inside the loop** (an `insert_line` landed mid-block).
   The numbers were stable across three runs because the seeded RNG made it deterministic, so
   the data was sound — **but an artifact nobody can read is not evidence.** Fixed and re-measured.

**A trap worth flagging:** the function must return **`null` at n<2, never `0`** — `0` makes
`|poi| > k*0` always true. **Same shape as the `|| 0` defect in `main.js` found earlier today.**

**Proposal written:** `poise-required-n.md`. **The `|| 0` and POI-without-n defects are the same
shape — an unknown rendered as a confident number** — and may deserve one policy rather than two.

**Duplicate to close:** `proposals/centre-standard-error.md` is this task.