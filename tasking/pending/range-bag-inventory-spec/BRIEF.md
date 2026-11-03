# BRIEF — What goes in a range bag, and what it weighs

**Task id:** `range-bag-inventory-spec` · **Priority:** high
**Grounded in:** `tasking/review/PRODUCT.md`

## Why this task exists

The site's third job is *where to buy the parts*. A range bag is where a
shooter discovers they need a third of what they thought, so the bag is both a purchase
and a checklist. Nobody has written down what a complete one contains, or what it weighs
empty.

**This is a research task.** You write only inside your own task folder.

## Before you start

1. Read `.clinerules` — especially §1 (the sandbox rule) and §10.6 (the roles).
2. Read `tasking/review/DERIVED-VALUES.md` — **binding on every number you produce.**
3. `npm run mail:init -- <your-id>` — your mailbox, or your findings go nowhere.
4. Read `tasking/pending/README.md` for the claiming procedure.
5. Claim it: `mv tasking/pending/range-bag-inventory-spec tasking/in-progress/`
6. Append a START message to your inbox.

## Do not

- **State a charge weight, powder constant, burn rate or chamber safety limit** for any
  cartridge. Not as an example, not in a footnote, not to show you know the rule.
- **Store a transcript or verbatim text** from any video or article. Link and cite;
  summarise in your own words. Transcripts are gitignored for exactly this reason.
- **Scrape retailer prices.** Cite and link instead; retailer terms generally prohibit it.
- **Fill a cell you cannot source.** EMPTY is a valid, correct answer.

## Definition of done

- `01-category-taxonomy.md`
- `02-item-list.csv`
- `03-typical-loadout-weight.csv`
- `04-sources.md`
- `REPORT.md`

Plus **`HANDOVER.md`** — always, whatever happened. Status is `complete`, `partial`,
`stalled` or `blocked`. **`partial` with specific documented gaps is a SUCCESSFUL task.**
An empty folder with an explanation is not.

## Scope

- Build a **category taxonomy** for range-bag contents: ammunition, magazines, eye and ear protection, targets, tools, cleaning, first aid, spares, storage.
- For each category, list the **items actually observed** in range-bag walkthrough videos and forum threads — not a manufacturer's "essentials" list.
- Estimate **typical loadout weight** per category, with the derivation shown.
- Record **what is deliberately left out** and why (weight, cost, or policy).

## YouTube as evidence

Range-bag walkthroughs are exactly the evidence this needs: a person showing what they actually carry, unprompted by marketing. Record the link, title, channel, date, and what you concluded. **Never store a transcript.**

## Tools — verified working, use these

Use `firecrawl_search` to find videos and forum threads, then `firecrawl_scrape` on each before you cite it — the scrape returns title, channel, upload date, views, description AND the full transcript. `exa_search` is better than keywords for "what do shooters complain about". **Scrape before citing, never cite a search snippet.** A snippet hides the affiliate disclosure.

## If you get stuck — read this before you stop

**You are working in a sandbox. Everything you write is reviewed before it reaches the main
project.** A concern is not a reason to stop working.

- A red gate → your completion is judged by `npm run tasking:check`, which is scoped to
  YOUR declared outputs. Note the failure in `NOTES.md` and keep working.
- A file outside your write-set → write it up in `NOTES.md`, work around it.
- An unknown value → **leave it EMPTY.** An honest gap beats an invented number.

Only two things stop you: your task folder is gone (someone else claimed it), or
`pending/` is empty. Report **"queue empty"** and stop — that is a correct result.

## If you finished but cannot commit

```bash
npm run quarantine -- put range-bag-inventory-spec
npm run role -- next
```

Work moves to `tasking/completed/_quarantine/{ID}/` with a `QUARANTINE.md` explaining
what broke and what you recommend. Then keep working. That is not stalling.
