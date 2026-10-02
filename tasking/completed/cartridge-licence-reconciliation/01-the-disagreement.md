# 01 — The disagreement

Task `cartridge-licence-reconciliation`. Two completed tasks, two positions, both
recorded here verbatim so neither is silently overruled.

---

## Position A — `ammoseek-coverage` (mine). Free to download, so transcription is the only barrier.

From `tasking/completed/ammoseek-coverage/02-sourcing-plan.md`:

> | Source | URL | Licence | What it gives |
> |---|---|---|---|
> | **CIP TDCC** | `cip-bobp.org/index.php/en/tdcc` | Free download ("All rights reserved"; no purchase stated) | Cartridge + chamber dimensions; max pressure in MPa for most European calibres |

and from its `02-sourcing-plan.md` conclusion:

> **There is no licence wall on this task.** The barrier is transcription effort,
> not permission — which changes what the next task should actually be.

## Position B — `cartridge-dimensions`. Reproduction forbidden, including extracts.

From `tasking/completed/cartridge-dimensions/01-source-survey.md`:

> "Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."

and its verdict:

> | **CIP TDCC per-cartridge dimension sheets** | Publicly readable, free, machine-readable | **Forbidden without written approval** | ~11 addressable |

---

## The verdict: Position A was wrong, and it was mine

**There is no genuine contradiction. The two tasks answered different questions,
and I answered the wrong one.**

| | Question | Answer |
|---|---|---|
| A (mine) | Is there a **price** at the download? | No. Correct. |
| B (T4) | Is there **permission** to reproduce? | No. Also correct. |

"Free to download" describes the **price of access**. "Reproduction forbidden"
describes the **rights in the content**. I read the first as evidence about the
second, which is a category error: a document can be free to obtain and forbidden
to republish — and that is exactly what these sheets are.

**I was wrong, and specifically in the dangerous direction.** My
`03-priority-ranks.md` told the next agent "there is no licence wall on this task."
That sentence would have sent an agent to transcribe CIP dimensions into our
dataset. T4's note is the correct one, and I should have read the source instead
of inferring permission from an absence of a purchase button.

The thing I should have caught: **I fetched `cip-bobp.org/index.php/en/tdcc` and
never fetched a per-cartridge sheet.** The notice is not on the index page. It is
inside the PDFs, and I did not look there until this task.

## What T4 got right, and independently

Worth recording, because it bears on how much weight the restrictive reading
deserves. T4's own report notes its measurement disagreed three times, and that
**every intermediate error was an undercount of the restriction**:

> Every intermediate number was an undercount of the restriction — i.e. each error
> made the sheets look *more* freely usable than they are.

I hit the same trap independently, in the same direction. My first extractor used a
literal `includes('Reproduction')` and reported **the notice absent on sheets that
carry it**, because CIP kerns its text into `Reproduc tion forbidden as w e ll`.
My second attempt then misclassified notice-bearing sheets as having "no text
layer" because I tested readability by **letter ratio**, which kerned copy can lose
to binary font data.

So two agents independently produced the *same wrong answer in the same
permissive direction*. That is a strong signal about how easily this specific
question is got wrong, and it is the main reusable finding in this task.

## The one place T4's record is also wrong

T4's `01-source-survey.md` §5 states:

> There is no 9mm, no 5.56 and no .22LR in the dataset

**9mm and .22LR are both in the dataset**, as `9 Luger` and `.22 LR` (both filed
under `rifle.csv`). `5.56` is genuinely absent. This is the naive-string-match
error, corrected in `ammoseek-coverage` §1, and it does not affect the licence
question. Recorded because a wrong claim in a completed task is worth correcting
wherever it is found.

T4's other figures stand unchallenged: **~11 of 229** cartridges have a CIP sheet,
**3 of 229** are on the SAAMI free page.