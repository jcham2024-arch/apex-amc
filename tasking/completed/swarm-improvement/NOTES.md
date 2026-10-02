# NOTES — for the review agent and the planner

**From:** agent `ee247`, `swarm-improvement` rotation 1, 3 Oct 2026.

## 1. A false claim survives in a completed task I wrote

`tasking/completed/roadmap-synthesis/01-ranked-roadmap.md` states:

> "**Do nothing:** the site renders, and 9mm sits under the wrong heading for every
> visitor."

**That is false.** `apps/website/src/main.js` contains no occurrence of `cartridge`,
`family` or `pistol` — measured, 0 matches. The app never renders cartridge families, so
no visitor sees a wrong heading.

**The underlying data defect is real and still open:** `9 Luger` (line 149) and `.22 LR`
(line 12) in `data/seeds/cartridge_specs/rifle.csv` both carry `family=rifle`.

**I did not correct it.** One writer per file, and `roadmap-synthesis` is a completed
task. **This is for review to decide.** Agent `4880a` raised the same correction in its
bulletin; two agents have now independently found it and neither could fix it, which is
the argument for review rather than for agents.

## 2. `.clinerules` §13 does not exist

`tasking/in-progress/swarm-improvement/BRIEF.md` step 1 says:

> "Read `.clinerules` — §10 swarm, §11 mail, §12 proposals, **§13 this slot**."

The file has **sections 0–12 only** (measured: last heading is `## 12. The swarm refills
its own queue`). §13 is not present.

The §13 content is inferable from the standing-slot section in `tasking/review/HISTORY.md`
and the `prohibits[]` array, so nothing was blocked. **Reported, not repaired** — per
`.clinerules` §10.1, a Sub-Agent does not edit the brief or the rules file.

## 3. The rotation trap is real, but the brief's fix for it breaks the gate

**The brief told me to datestamp:**

> "`mv tasking/in-progress/swarm-improvement tasking/completed/swarm-improvement-$(date +%Y%m%d)`"
> — `BRIEF.md` §"When you finish", step 1

I did exactly that, to `swarm-improvement-20261003`. **`npm run tasking:check` failed:**

```
x tasking/completed/swarm-improvement-20261003/task.json declares id "swarm-improvement"
  but lives in a folder named "swarm-improvement-20261003". The folder name is the lock,
  so the two must agree.
x ... has no manifest in pending/, so its declared outputs cannot be verified.
```

**The brief and the gate cannot both be obeyed.** The gate's rule is the load-bearing one
— *"the folder name is the lock, so the two must agree"* — and it is right: the rest of the
framework matches a folder by name.

**Resolution: renamed to `completed/swarm-improvement/`.** Gate then reported
`tasking verified`, 99 declared outputs.

**The collision the brief warns about did not exist** — rotation 1, so the plain name was
free. The datestamp advice is right for rotation 2 onward, **wrong for rotation 1**, and
nothing in the brief says which rotation you are on.

**Rotation 2's agent faces an unsolvable version of this**: the plain name is now taken
by my completed folder, and the datestamped name fails the gate. **There is currently no
correct destination for rotation 2.** This is a real, unresolved conflict between two
binding documents, and it needs the owner to reconcile them — see the proposal.

## 4. The standing slot — restocked, and correctly detected as busy

After my move, `npm run tasking:restock` reported:

```
restock: swarm-improvement is queued or in progress; nothing to do.
```

**Another agent had already claimed rotation 2** — `tasking/in-progress/swarm-improvement/`
existed and was being written to (it held a `NOTES.md` on my second check). **The script
was correct**: its doc comment is explicit that busy means "pending or in-progress only",
and one genuinely was.

**The mechanism working, not the `HISTORY.md` restock-busy regression returning.** That
regression was a *completed* rotation counting as busy; here the slot is legitimately
claimed. I nearly mis-recorded it, and checked before writing it down.

**I did not touch rotation 2.** I did not restock by hand and did not edit the restock
script, per `prohibits[]`.

**A real trap, recorded because it will bite:** moving a file inside
`tasking/in-progress/<task>/` and then moving the whole folder to `completed/` **can lose
the edit** — mine did, once, during the rename. The lesson is to normalise line endings and
verify file contents *after* the final move, not before.

## 4. What I did not do

- **Did not build an index.** `FINDINGS.md` is proposed, not written. It needs an owner
  decision on *where it lives* (`completed/` root is not write-set-clean), so writing one
  now would be a change in disguise.
- **Did not restock by hand.** Ran `npm run tasking:restock` only, per `prohibits[]`.
- **Did not propose telemetry** as research. Adding instrumentation changes how every
  agent behaves — that is `shape: change` and the owner's.
- **Did not survey all four dimensions.** Went deep on KNOWLEDGE, as instructed. The
  other three are untouched and each is a candidate for a later rotation.