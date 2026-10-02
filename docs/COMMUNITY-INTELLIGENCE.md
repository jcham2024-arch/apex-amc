# Community intelligence: using an LLM over forum data, safely

Written 30 Sep 2026. This responds to a proposal: use an LLM to read reloading
forums, weigh opposing viewpoints, weight by poster strength, and compile a
better picture of real-world experience than a human could.

**The proposal is right about the problem and slightly wrong about which part
to automate.** This document separates those.

---

## 1. Where the proposal is right

The bottleneck is genuinely human attention. Reading thousands of threads,
identifying the recurring claims, and noticing when a view is contested is
months of work that does not scale. An LLM can do that triage in an hour.

More importantly, the current alternative — a human reading a sample and
summarising — has a bias we should name: **the loudest, most confident voice
becomes the remembered one.** Reading everything and weighting it properly is
strictly better than reading some of it and going on memory.

So: build it. The idea is sound.

---

## 2. Where it is wrong: "weigh the viewpoints" is the part to refuse

The proposal has the LLM do two jobs. Job one is fine. Job two is the problem.

| Job | Verdict |
|---|---|
| **Extraction** — read a thread, pull out the claims, identify what's disputed | **Do this.** Boring, repetitive, high-volume, verifiable |
| **Adjudication** — weigh the arguments and decide what experience shows | **Don't do this.** |

The reason is specific. **"Poster strength (posts, rank)" is not a measure of
shooting accuracy.** It measures participation. A highly-ranked account can be
repeating a load that damages guns. Thousands of posts is evidence of
enthusiasm, not evidence of correct results. Weighting by it means **popularity
becomes authority** — which is how a load-data site ends up confidently
surfacing a crowd-pleasing wrong answer.

Worse, once an LLM produces a weighted verdict, we get a number with no
provenance. Nobody can check the reasoning, the weights are undocumented, the
output is not reproducible, and it varies run to run. That is precisely the
failure mode the entire provenance system exists to prevent — and it would be
*harder* to audit than a human's notes, because it looks like analysis.

**The rule: an LLM may extract and organise. It may not weigh, score, or
conclude.** The conclusion is either made by a human editor or not made at all.

---

## 3. The safe design

### 3.1 Pipeline

```
forums → fetch (public, rate-limited, attributable)
       → LLM extracts structured claims      ← model does this
       → deduplicate + cluster by topic       ← deterministic code
       → store in community_observations      ← schema already exists
       → human editor reviews and sets status ← human does this
```

Every stage boundary is a place where the model stops. The model writes rows. It
does not decide their status, their confidence, or their agreement level.

### 3.2 What the model is allowed to emit

Per thread, structured rows and nothing else:

- the claim, quoted or closely paraphrased
- the cartridge / powder / bullet mentioned (free text, as now)
- the `source_url`, `source_forum`, `source_author`, `source_date`
- **what the poster claims to have measured, and what they merely assert**
- **whether the thread contains a disagreement, and on what point**

That last one is the valuable output, and it is a fact about the text rather
than a judgement about the world. "12 threads report X, 4 dispute it on grounds
of Y" is extractable and checkable. "X is probably right" is not.

### 3.3 What the model is never allowed to emit

- a confidence score it chose
- an `agreement_level` it chose
- a `safety_risk` rating it chose
- any synthesis sentence that reads as a conclusion
- any number presented as a setting

The existing CHECK constraints then act as a backstop: `confidence` 1-5,
`agreement_level` from the four permitted values, `safety_risk` low/medium/high.
The model's raw output lands in `status = 'unreviewed'` and **stays there until
a human moves it.** An unreviewed row is not displayed as an answer anywhere.

### 3.4 Poster strength — keep it, but as a display attribute

Not a weight in a model. Just a sortable, visible field, shown alongside the
claim so the reader can judge:

> *"Speer .45 cases run ~1% smaller than Winchester" — 6 threads, 2019-2026,
> lowest poster 340 posts, highest 2,100. Unreviewed. [links]*

That is honest and it gives the user what they actually wanted — the ability to
see who is saying it — without the model having an opinion.

---

## 4. The safety boundary, stated once

> **Community intelligence informs a shooter's search. It never populates the
> load table, and a consensus never touches a load number.**

The `community_observations` schema already enforces this: no foreign keys from
`bullets`, `powders`, `recipes` or `case_reuse_profiles` into community tables.
Provenance flows one way. `011_community_layer.sql` says so in its header —
*"the community layer is a lead, never a citation"* — and adds a build-failing
view for unflagged high-risk claims.

**I would not weaken any of that to build this feature.** The LLM makes the
community layer *more* useful; it never makes it authoritative.

### 4.1 The reason the boundary is load-bearing

A forum load typically has no stated test barrel and often no COAL — the two
fields our own schema marks NOT NULL because a load without them is
uninterpretable. And there is no errata channel: a forum typo is permanent and
uncorrectable, where the Hornady 6.5 PRC misprint was survivable only because
the publisher issued a correction.

So even a *perfect* consensus of forum data would be less safe than a single
cited manual row. Better aggregation does not change the evidence class.

---

## 5. "Everything needs references and the logic used"

This is the strongest requirement in the proposal and it maps exactly onto what
we already built. Nothing new is needed:

| Requirement | Existing mechanism |
|---|---|
| Every claim has a reference | `source_url NOT NULL` on `community_observations` |
| Which source class it is | `source_kind` on official tables; community layer separate by construction |
| The logic behind a conclusion | The `derived` / `estimated` tiers with `method` and `reasoning` fields |
| An estimate cannot masquerade as fact | `estimated` requires documented reasoning or throws `UnverifiedValueError` |
| Show only reviewed work | `status` + `idx_community_status` |

**The one addition worth making: a `review_note` on every accepted row, written
by the editor, explaining what they checked.** That makes the reasoning
auditable, which is what the user is asking for, and it makes a bad call
reversible by the next editor. The column already exists and is currently
optional; it should be mandatory for `status = 'accepted'`.

---

## 6. What we would actually ship, in order

1. **Extraction only.** Model pulls claims with URLs, authors, dates. Lands
   `unreviewed`.
2. **Disagreement mapping.** Show where the forums contradict each other. This
   is the highest-value output and it is a fact, not a judgement.
3. **Human review queue.** An editor works the queue, sets status, writes
   `review_note`.
4. **Display as attributed opinion**, never as fact, never inside a load result.
5. **Only then**, consider any synthesis — and it would be a written editorial
   piece, cited, by a human.

Steps 1-3 are where nearly all the value is, and steps 1-2 need no judgement
calls at all.

---

## 7. Open questions

- **Legal/ToS.** Scraping and republishing forum content has terms-of-service and
  fair-use dimensions that differ per site. The safe default is **link and quote
  minimally, never republish threads wholesale** — consistent with the
  manual-licensing position in SOURCES.md.
- **Cost and model choice.** Extraction over thousands of threads is a large
  batch job. If we run it, it runs on our infrastructure, not the user's key —
  which is exactly the operator-liability issue BYO-key avoids. Parked per
  ROADMAP 3.
- **Does a better map of opinion change any recommendation?** Honest answer:
  probably not, and that is fine. The value is in disclosure and debate, not in
  flipping our output.

---

## 8. Summary

| Proposal element | Verdict |
|---|---|
| Read forums at scale, which a human cannot | **Yes — this is the win** |
| Extract and structure claims with attribution | **Yes — verifiable, low risk** |
| Surface disagreements between posters | **Yes — a fact, not a judgement** |
| Show poster experience level | **Yes — as a display attribute, not a weight** |
| LLM weighs arguments and decides what is true | **No — unprovable, unreproducible, popularity as authority** |
| Feed the result into published recipes | **No — already correctly blocked in schema** |