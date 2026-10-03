# Available agent skills — what this project actually uses

Assessed 3 Oct 2026 by reading all 66 skills in `C:\Users\Justin\.agents\skills` (652
markdown files, 3.7 MB) and **testing** the ones that looked relevant rather than
assuming from their descriptions.

## Use these

### Firecrawl — 28 skills, and the tools are live

`FIRECRAWL_API_KEY` is set and the tools are wired. This is the most valuable thing in the
directory for this project.

| Skill | Use |
|---|---|
| `firecrawl_search` | find videos, forums, review pages |
| `firecrawl_scrape` | full page **including YouTube transcripts** — verified |
| `firecrawl_crawl` / `map` | sweep a manufacturer's documentation site |
| `firecrawl-deep-research` | a cited multi-source report, with a contrarian-views section |
| `firecrawl-shop` | product comparison shape — review signals, seller quality, spec match |
| `firecrawl-research-papers` | PubMed / bioRxio / arXiv, for physiology or materials |
| `exa-search` | semantic search; better than keywords for "what do shooters complain about" |

**Transcripts work.** Verified on a real query: `firecrawl_scrape` on a YouTube watch URL
returns title, channel, upload date, view count, likes, description and the full
transcript. That covers exactly what the owner asked for.

The `firecrawl-deep-research` deliverable shape is close to what our review tasks want, and
its **"Contrarian Views And Risks"** section is worth copying into our briefs — a research
report that only lists agreements has not been reviewed.

`firecrawl-shop`'s "Review Signals" concept maps onto `DERIVED-VALUES.md`, and its quality
bar already says *"note affiliate, sponsored, or unreliable sources when visible"* — which
is the trap we hit on the first real search.

### `review-team` — adopted, in part

A fleet of 11 specialist reviewers (correctness, security, architecture, conventions,
simplicity, UX, reliability, telemetry, testing, compatibility, documentation), each
blind to the others, each with a "stay in your lane" rule and a fixed output format.

Its discipline is better than what I wrote, and two ideas were adopted into
`tasking/roles/REVIEWER.md`:

- **Findings need a concrete failure mode.** `"the CSV is wrong"` is not a finding;
  `"row 47's `saami_max_psi` came from the wrong edition"` is.
- **Severity + location + issue + failure scenario + fix**, as a fixed format.

Its fleet pattern also independently arrived at something we already concluded: reviewers
must not see each other, or they converge and the independence is lost. That is why our
reviewer role forbids an agent reviewing its own work.

### `session-report` — later

Token/cache/subagent analytics from session transcripts. Useful for answering "why is the
swarm expensive", and it would show which agent type is eating the budget. Not wired yet;
no value until there are enough sessions to measure.

## Do not use these

**Wrong platform, wrong scale.** `cloudflare` (274 files), `workers-best-practices`,
`wrangler`, `durable-objects`, `agents-sdk`, `basin`, `k2`, `turnstile-spin`,
`nextjs-on-cloudflare`, `cloudflare-one` — this is a static `dist/index.html` on Pages with
Node scripts. There is no Worker to build.

**Wrong database.** `dsql`, `cosmosdb-best-practices`, `firestore-data`, `spanner-data`,
`oracledb`, `dataproc-skills`, `data-analyst` (ClickHouse) — the project uses SQLite via
`data/seeds/`.

**Wrong cloud.** `amplify-workflow`, `use-railway`, `amazon-location-service` — AWS and
Railway, neither in use.

**Useful in principle, irrelevant here.** `convex-design`, `mintlify`, `knowledge-catalog`,
`linear-sdk-scripting`, `frontend-design` (a taste guide, not a review), `math-olympiad`.

**Skip outright.** `attorney-assist` (connects the user to a LegalZoom attorney) and
`vibe-prospecting` (contact-data scraping) have nothing to do with this project.

### One worth keeping in reserve

`firecrawl-monitor` watches a page for changes on a schedule. That is the lawful form of
"is this price still current" — the thing `PRODUCT.md` says retailer pricing must be.
Worth revisiting when that question is unblocked, because **monitoring a page the owner
names is not scraping**.

## What I did not adopt, and why

- **`skill-creator`** — could generate project-specific skills, but our role files already
  serve that purpose and are gate-enforced. A generated skill would drift from
  `tasking/roles/` with nothing checking it.
- **Wrapping the swarm in `cline-sdk`** — 146 KB about building Cline agents. Our swarm is
  a shell-and-git system, not a Cline runtime, and it works. Rebuilding it on an SDK would
  replace a system that runs with an SDK that is not installed.
- **`firecrawl-agent`** (autonomous multi-site navigation) — powerful, but it is an
  unattended browser. For a research project where a wrong number hurts someone, doing the
  scraping step deliberately is worth the extra turns.

## The one that changed a rule

`firecrawl-shop`'s quality bar — *"note affiliate, sponsored, or unreliable sources when
visible"* — sent me back to the live data, and the **top result for "best range bags" is
an Amazon Associates affiliate video**: affiliate redirect links for every product, a
scripted "grab your top picks through the links below" intro, 1,112 views and 3 likes.

It reads exactly like an independent review. It is not one, and nothing in the search
result reveals it — only the scrape does. That is now a disqualifying criterion in
`tasking/review/DERIVED-VALUES.md` and a check the reviewer performs.

**A tool recommendation turned into a rule that would otherwise have been learned the
expensive way.**