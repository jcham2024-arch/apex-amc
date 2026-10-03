# Derived values — how we produce a number we did not read off a datasheet

**Added 3 Oct 2026 by owner decision.** This is the rule that makes review-derived values
usable, and it is deliberately narrow.

## The decision

> "As long as we cite sources and explain our reasoning behind them somewhere, even if
> it's just in our data, then we can give that to our user."

So a **derived value** is allowed. A bare number is not.

## What this changes, and what it does not

`PRODUCT.md` says the project stores nothing and cites and links. That decision was about
**load data**, where copying quantities off a manufacturer's page is redistribution of
their content.

This document does not overturn that. It draws the line at a different place:

| | Verdict | Why |
|---|---|---|
| Load data, powder weights, pressure figures | **never stored.** Cite and link. | Redistribution of a technical table. Settled twice by the owner. |
| **A weight, a reliability score, a "commonly reported" note derived from reviews** | **allowed, with citation + derivation** | Our own analysis of publicly available commentary. Nobody's table is being copied. |
| Transcripts, article text, video content | **never stored.** Link only. | Someone else's copyright. |

The distinction is **whose words are these.** A load table is the publisher's data. "Owners
across six reviews consistently report the stiff trigger" is our finding.

## The three fields a derived row must carry

Every derived value ships with all three, or it is a fabrication:

```csv
slug,derived_field,value,source_url,source_date,derivation
```

- **`source_url`** — the specific video, forum thread or page. Not "YouTube".
- **`source_date`** — when it was said. A 2019 review of a discontinued product is
  history, not evidence.
- **`derivation`** — **how the number was reached, in a sentence or an arithmetic
  expression.**

The `derivation` field is the whole point. It makes the number auditable, which means a
reviewer can disagree with it. A number nobody can check is indistinguishable from one
somebody made up, and the difference only shows up later.

## Verified 3 Oct 2026 — the tools, and one trap they immediately exposed

Checked what is actually wired up rather than assuming, because a research brief that
names a tool nobody has is worse than one that names none.

**Available and confirmed working:**

| Tool | Use here |
|---|---|
| `firecrawl_search` | find videos, forums and review pages |
| `firecrawl_scrape` | full page, **including YouTube transcripts** |
| `firecrawl_crawl` / `map` | sweep a manufacturer's or retailer's doc site |
| `exa_search` | semantic search, better for "what do shooters complain about" than keywords |
| `firecrawl-research-papers` | PubMed / bioRxio / arXiv — for anything touching physiology or materials |

**YouTube transcripts do work.** `firecrawl_scrape` on a watch URL returns title, channel,
upload date, view count, description and the full transcript. That is more than enough to
do what the owner asked — read the video, form a view, cite it.

### The trap, found on the first real search

The top result for *"best range bags"* was a video that turned out to be:

- an **Amazon Associates affiliate** video — the description carries a
  `participants in the Amazon Services LLC Associates Program` disclosure,
- with **affiliate redirect links** for every product,
- and a **scripted intro**: *"Grab your top picks naturally through the links in the
  description below."*
- **1,112 views, 3 likes.**

It reads exactly like an independent review. It is not one. A ranking built from these
would be a ranking of who gets paid to link, presented to the user as "owners commonly
report".

**So, concretely, a video is disqualified as a source of a derived value when:**

1. The description contains an affiliate disclosure or affiliate redirect URLs.
2. The video ranks products rather than reporting use.
3. Views and likes are wildly divergent — low views with near-zero engagement means
   few real users, so "commonly reported" may be one person.

None of those are visible from a search result. All three are visible after a scrape, and
the scrape is cheap. **That is the argument for scraping before citing**, and it is why
`review-evidence-sources` exists as a task rather than as an assumption.

## Worked examples

**Good — auditable:**

```
# 6 of 9 reviews describe the stiff trigger; 2 mention the magazine button
# release as the cause; 1 calls it a non-issue. Weight 0.67 (6/9).
# Sources: youtu.be/AAA (2025-03-11), youtu.be/BBB (2024-11-02),
#          youtu.be/CCC (2025-01-20), +3 forum threads in 04-sources.md
derivation: count of independent reviews mentioning the fault / total reviews found
```

Note the empty case is *also* recorded. "2 of 9 reviews say the opposite" is data.

**Bad — a number with no reasoning:**

```
reliability,0.67          # where did this come from?
```

**Worse — an average of an average:**

```
"reviewers rated it 4.5/5, and it has 10,000 reviews, so 4.5 is reliable"
```

Star ratings are not a measurement. Their distribution is bimodal (people who love it or
hate it) and the mean of a bimodal distribution describes neither group. If a rating is
what you have, **record the distribution or nothing.**

## Where YouTube fits

YouTube is a genuinely good evidence source for this project, and specifically because
reviewers are **specific about failures** in a way manufacturer copy never is. "It rattled
after 200 rounds" is more useful to a buyer than a bullet page.

**We never store a transcript.** Transcripts are the creator's content. We store:

- the link and video id
- title, channel, publication date
- **what we concluded from it**, in our words, with the claim it supports

Transcripts are already gitignored under `archive/` — keep one locally to read, never
commit it. The citation points at the video, which is durable.

## The rule that overrides all of this

**Leave it EMPTY instead.**

An empty cell reads as "we do not know", which is true. A derived value with weak sources
reads as a fact, which is not. From `PRODUCT.md`:

> A fabricated price in a cost calculator is worse than no calculator.

The same applies here. A reliability score built from two reviews is a fabrication with a
citation attached, and the citation makes it *more* persuasive, not less.

**Minimum viable evidence: three independent sources**, or the field stays EMPTY. Three
is not a statistical threshold; it is the point below which "consistently reported" stops
meaning anything.

## Never, for any category

- **A charge weight**, powder constant, burn rate or chamber safety limit. Not derived,
  not averaged, not "from a review". See `interior-ballistics`.
- **A price scraped from a retailer.** `PRODUCT.md` §Retailer pricing — blocked, and
  retailer terms generally prohibit scraping. Cite and link, or use a lawful feed.
- **Anything copied verbatim** from a source. Summarise and cite; quoting at length is
  redistribution.

## Related

- [PRODUCT.md](PRODUCT.md) — the load-data decision this draws a line beside
- [../../mail/proposals/no-zero-defaults.md](../../mail/proposals/no-zero-defaults.md) —
  why a fabricated number is worse than an absent one
- [../../completed/interior-ballistics/KNOWLEDGE.md](../../completed/interior-ballistics/KNOWLEDGE.md)
  — the charge-weight prohibition