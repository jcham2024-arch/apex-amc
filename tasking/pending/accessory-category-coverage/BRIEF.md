# BRIEF — Which accessory categories we have no data for at all

**Task id:** `accessory-category-coverage` · **Priority:** medium
**Grounded in:** `tasking/pending/range-bag-inventory-spec`

## Why this task exists

The owner named the domains: guns, gun parts, scopes, gun accessories, range
bags, range-bag contents, and where to get each. This task asks the question none of the
others will: **which of those do we have nothing on, and which gap matters most?**

A coverage matrix is worth more than another category, because it tells the task author
where to point the next hour.

**This is a research task.** You write only inside your own task folder.

## Before you start

1. Read `.clinerules` — especially §1 (the sandbox rule) and §10.6 (the roles).
2. Read `tasking/review/DERIVED-VALUES.md` — **binding on every number you produce.**
3. `npm run mail:init -- <your-id>` — your mailbox, or your findings go nowhere.
4. Read `tasking/pending/README.md` for the claiming procedure.
5. Claim it: `mv tasking/pending/accessory-category-coverage tasking/in-progress/`
6. Append a START message to your inbox.

## Do not

- **State a charge weight, powder constant, burn rate or chamber safety limit** for any
  cartridge. Not as an example, not in a footnote, not to show you know the rule.
- **Store a transcript or verbatim text** from any video or article. Link and cite;
  summarise in your own words. Transcripts are gitignored for exactly this reason.
- **Scrape retailer prices.** Cite and link instead; retailer terms generally prohibit it.
- **Fill a cell you cannot source.** EMPTY is a valid, correct answer.

## Definition of done

- `01-coverage-matrix.csv`
- `02-priority-gaps.md`
- `REPORT.md`

Plus **`HANDOVER.md`** — always, whatever happened. Status is `complete`, `partial`,
`stalled` or `blocked`. **`partial` with specific documented gaps is a SUCCESSFUL task.**
An empty folder with an explanation is not.

## Scope

- Build a **matrix**: category × what we hold today (rows from `data/seeds/`, columns for citation, price, dimensions, reviews).
- Identify **gaps**, ranked by how much a user would care.
- For the top gaps, say whether filling them is research or needs code — and name the task that would do it.
- Read `data/seeds/` to see what actually exists. Do not guess from the README.

## Extra rules for this task

Do not propose a task that duplicates existing work. Check `pending/`,
`in-progress/` and `completed/`, plus `tasking/review/HISTORY.md` for rejected ideas.

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
npm run quarantine -- put accessory-category-coverage
npm run role -- next
```

Work moves to `tasking/completed/_quarantine/{ID}/` with a `QUARANTINE.md` explaining
what broke and what you recommend. Then keep working. That is not stalling.
