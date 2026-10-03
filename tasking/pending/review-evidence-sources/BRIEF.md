# BRIEF — Which video and forum sources are worth citing for gear

**Task id:** `review-evidence-sources` · **Priority:** medium
**Grounded in:** `tasking/review/DERIVED-VALUES.md`

## Why this task exists

The owner approved using videos as evidence for review-derived values. That
only works if we know which sources are worth citing, because the whole value rests on the
citation. **This task produces the source-quality rules the other research tasks depend
on.**

**This is a research task.** You write only inside your own task folder.

## Before you start

1. Read `.clinerules` — especially §1 (the sandbox rule) and §10.6 (the roles).
2. Read `tasking/review/DERIVED-VALUES.md` — **binding on every number you produce.**
3. `npm run mail:init -- <your-id>` — your mailbox, or your findings go nowhere.
4. Read `tasking/pending/README.md` for the claiming procedure.
5. Claim it: `mv tasking/pending/review-evidence-sources tasking/in-progress/`
6. Append a START message to your inbox.

## Do not

- **State a charge weight, powder constant, burn rate or chamber safety limit** for any
  cartridge. Not as an example, not in a footnote, not to show you know the rule.
- **Store a transcript or verbatim text** from any video or article. Link and cite;
  summarise in your own words. Transcripts are gitignored for exactly this reason.
- **Scrape retailer prices.** Cite and link instead; retailer terms generally prohibit it.
- **Fill a cell you cannot source.** EMPTY is a valid, correct answer.

## Definition of done

- `01-source-taxonomy.md`
- `02-channel-assessment.csv`
- `03-what-reviewers-notice-that-marketing-does-not.md`
- `REPORT.md`

Plus **`HANDOVER.md`** — always, whatever happened. Status is `complete`, `partial`,
`stalled` or `blocked`. **`partial` with specific documented gaps is a SUCCESSFUL task.**
An empty folder with an explanation is not.

## Scope

- Classify source **types**: long-form review, first-person range report, forum thread, comparison, sponsored review, aggregator.
- Assess specific **channels and forums** on evidence, not reputation.
- Record **what reviewers notice that manufacturer copy does not** — this is the specific value of video as a source.
- Identify **sponsored content**, and say how to tell. Undisclosed sponsorship is not automatically untrustworthy; it is undisclosed.
- Recommend which source types may support which kinds of derived field.

## Extra rules for this task

Do not name a channel reliable without **three independent data points**, or mark it
unknown. Do not fabricate view counts, dates or subscriber numbers. Do not assume a low
view count means low quality, or a high one means high quality.

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
npm run quarantine -- put review-evidence-sources
npm run role -- next
```

Work moves to `tasking/completed/_quarantine/{ID}/` with a `QUARANTINE.md` explaining
what broke and what you recommend. Then keep working. That is not stalling.
