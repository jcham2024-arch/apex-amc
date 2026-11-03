# Frontend design knowledge base

Research compiled October 2026, added from `C:\Cline\resources\tooling\webpage-design`.
Reference material and review checklists. **Not** a stylesheet, and not the source of
truth for how the website is built.

## Read this first

| File | Read it when |
|---|---|
| [`09-caveats-and-volatile-status.md`](09-caveats-and-volatile-status.md) | **Before trusting anything date-bearing in this folder.** |
| [`skills/ui-review-checklist.md`](skills/ui-review-checklist.md) | Reviewing or shipping any UI change |
| [`skills/SKILL.md`](skills/SKILL.md) | Orientation; how these files are meant to be used |

The nine numbered files are `docs/` content flattened one level, so the cross-references
in the source stayed true without rewriting its prose.

## What was deliberately NOT brought over

The source also shipped `assets/`: `tokens.css`, `reset.css`, `patterns.css` and
`starter.html`. **They are omitted, and adding them would be a mistake.**

`tokens.css` is a hand-rolled design-token layer built around `:root` custom properties —
**zero** occurrences of `@theme`, **zero** of `--color-*`, and it never mentions Tailwind.
The website is **Tailwind v4, compiled at build time**: `apps/website/src/styles/main.css`
begins with `@import "tailwindcss"`, a deliberate replacement for the CDN runtime compiler
that previously required `unsafe-eval`.

Dropping a parallel bespoke token system in beside that would create a second source of
truth for colour, spacing and typography that Tailwind knows nothing about, and the two
would drift on the first design change. `apps/website/src/styles/theme.css` is currently
55 lines of scrollbar chrome and bar widths, which is what it should stay: small.

Prior art also already exists at `tasking/completed/ui-research/03-modern-mockups/_tokens.css`
and `docs/mockups/_tokens.css`. This is duplication, not a gap.

## Why the docs are worth having even though the assets are not

`apps/website` already has accessibility, performance and layout notes. What it lacks is
anywhere that says **which** WCAG 2.2 criteria are new and which of them break real
designs — `05-accessibility.md` names the nine, and flags 2.5.8 Target Size (24×24 CSS px)
as the most common new failure.

More valuable is `09-caveats-and-volatile-status.md`. It corrects the widespread and wrong
claim that **APCA is the WCAG 3 contrast algorithm** — APCA was Exploratory, was pulled
from the July 2023 working draft, and as of the 8 April 2026 Editor's Draft the contrast
algorithm is still undetermined. It also preserves the three claims its own research got
wrong rather than deleting them.

That discipline — record the correction, keep the error visible, date it — is the part
worth borrowing. Anything here bearing a date should be re-verified after about six months.

## Rules for this folder

- This is **reference and review material**. Changing how the website looks is a change to
  `apps/website`, not to this folder.
- Do not add a second token system. If a token is needed, add it to the Tailwind theme in
  `apps/website/src/styles/main.css`.
- Where a claim is volatile, carry the date and the confidence level. If a claim turns out
  to be wrong, add the correction here; do not quietly edit the original.