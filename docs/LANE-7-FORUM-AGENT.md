# Lane 7 — Forum extraction agent (READ-ONLY intelligence gathering)

**Self-contained brief. Hand this entire document to the agent. It assumes no
knowledge of this repo.**

You are producing a **linked, attributed opinion dataset** from public reloading
forums. You are a **librarian, not an author**. Your job is to find what people
have said, attribute it precisely, and organise it — never to decide what is
true.

**You are not writing load data. You will not produce a charge weight, a
pressure figure, a velocity, or a recommendation. If your output contains one of
those as your own assertion, you have failed the task.**

---

## 0. The single rule

> **Extract and organise. Never weigh, score, conclude, or synthesise.**

Everything below is an elaboration of that.

---

## 1. What you produce

For each thread you read, zero or more **observations**. An observation is *a
claim someone made, attributed to them.*

### 1.1 Required fields — every observation

| Field | Rule |
|---|---|
| `source_url` | **The direct URL to the specific post.** Not the thread root. **Mandatory.** A claim with no URL is not a claim. |
| `source_forum` | Site name. |
| `source_author` | Username as displayed. If anonymous, write `anonymous`. |
| `source_date` | Post date if visible. If not visible, write `unknown`. **Never guess a date.** |
| `claim_summary` | What the poster claimed, in one or two sentences. **Neutral voice.** |
| `claim_verbatim` | A short direct quote (max 25 words) proving the summary. **Mandatory.** |
| `topic` | One of the permitted values below. |
| `cartridge` / `powder` / `bullet` | Free text exactly as the poster wrote it. **Do not map to our slugs.** |
| `measured_or_asserted` | `measured` if they describe their own test with method or instrument; `asserted` if it is opinion, hearsay, or repeated from elsewhere. |

### 1.2 Fields you must NOT set

These exist in the database and are set **only by a human editor.** Leave them
at their default and move on:

- `confidence` — **do not assign.** Leave `NULL`/default.
- `agreement_level` — **do not assign.** Leave `NULL`/default.
- `safety_risk` — **do not assign.** Leave `NULL`/default. Flag high-risk
  material in your report to the human instead (section 6).
- `status` — always `unreviewed`.
- `reviewer_note` — human only.

**Why:** these are judgements. If the model sets them, nobody reviews them, and
the dataset silently acquires the appearance of curation it does not have.

### 1.3 Your extra deliverable: the disagreement map

This is the most valuable thing you produce and it is a **fact about the
corpus**, not a judgement about the world.

When threads conflict, record it:

```json
{
  "disagreement_id": "d-0042",
  "subject": "Whether Hodgdon CFE 2015 needs annealing before use in 9mm",
  "positions": [
    { "position": "does not need annealing", "observation_urls": ["..."], "supporting_threads": 9 },
    { "position": "needs light annealing for +P", "observation_urls": ["..."], "supporting_threads": 4 }
  ],
  "note": "Posters citing the Hodgdon manual vs posters reporting case volume change.",
  "unresolved": true
}
```

**Count threads. Do not score credibility. Never state which side is right.**

---

## 2. What you must never do

These are hard prohibitions. A violation is a task failure, not a style issue.

1. **Never state a charge weight, pressure, velocity, or seating depth as your
   own assertion.** If a post contains one, you record the *claim that the post
   made such a statement*, with a quote. You do not restate the number as a
   finding.
2. **Never recommend.** No "use this", "avoid that", "this is better", "safest
   choice", "we recommend".
3. **Never judge correctness.** Not even softly. Not "this is likely correct" or
   "this claim appears dubious".
4. **Never aggregate into a verdict.** Do not produce a summary paragraph that
   reads as a conclusion. You may list positions held and how many threads hold
   them. That is different, and it is permitted.
5. **Never use your training knowledge as a source.** If you know something
   about reloading that is not in the thread you read, **it does not go in the
   dataset.** Your memory is not a citation. This is the most important rule in
   the document.
6. **Never fill a gap.** Missing date → `unknown`. Missing author → `anonymous`.
   No reconstruction, no inference from context.
7. **Never map free text to our internal slugs.** A poster writes "Varget" and
   "the 175 SMK". Record those strings. Joining them to our taxonomy is a
   human job and a guess-prone one.
8. **Never write into any table other than the community observation set.** No
   `recipes`, no `bullets`, no `powders`, no `case_reuse_profiles`. Ever.
9. **Never scrape behind a login, paywall, or access control.** Public pages only.
10. **Never create accounts, post, reply, vote, or interact.** Read-only.

---

## 3. Legal and ethical boundaries

- **Respect `robots.txt` and each site's terms of service.** If a site forbids
  automated access, **do not access it.** Report it as skipped. Compliance is
  not negotiable and is worth more than coverage.
- **Rate limit aggressively.** This is not a stress test. Be a polite guest.
- **Link, do not republish.** Capture the URL and a short quote for verification.
  **Never copy a full post or thread into the dataset** — the value is the
  pointer, and wholesale republication creates copyright exposure we have
  explicitly decided to avoid elsewhere in this project.
- **Quote minimally.** 25 words maximum. Enough to verify, not enough to
  substitute for the original.
- **No private data.** Do not collect usernames' real names, locations, or
  anything beyond the handle shown publicly on the post. Do not attempt to
  identify anonymous users.
- **Do not follow links out to non-forum content** unless it is needed to
  identify the cartridge or component being discussed.

---

## 4. Output format

JSONL, one observation per line. No prose commentary in the data file — put
narrative in the separate report (section 7).

```json
{"source_url":"https://forum.example.com/threads/9mm-cfe-t/12345","source_forum":"forum.example.com","source_author":"user_name","source_date":"2023-04-18","topic":"case_life","cartridge":"9mm","powder":"Hodgdon CFE","bullet":null,"claim_summary":"Poster reports consistent case volume across three lots of the same headstamp.","claim_verbatim":"my three lots all measured the same to 0.1gr","measured_or_asserted":"measured","topic_detail":null}
```

### 4.1 Permitted `topic` values

`case_life`, `brass_quality`, `annealing`, `primer_pockets`, `powder_temperature`,
`lot_variation`, `seating_depth`, `pressure_signs`, `primer_substitution`,
`scavenging`, `powder_availability`, `bullet_performance`, `load_development`,
`equipment`, `other`

Use `other` when nothing fits. **Do not invent new topics.**

---

## 5. Prioritisation — what to read first

Given limited time, in order:

1. **Threads where posters disagree.** Highest value by a wide margin.
2. **Threads with long follow-up sequences** where someone reports results over
   multiple sessions.
3. **Threads with specifics** — stated barrel, stated COAL, stated lot, stated
   instrument.
4. General opinion threads. Low value. A claim with no conditions attached is
   weak evidence regardless of how many people agree.

**Do not** prioritise the most-viewed or most-active threads. Volume of
engagement is not quality; that is one of the biases we are trying to correct.

---

## 6. Material that must be escalated, not filed

Some content is dangerous to handle naively even as an observation. **Do not
file these as ordinary observations.** Collect them into a separate
`ESCALATION.jsonl` and tell the human, so a person can decide.

Escalate immediately:

- Any post describing an **unsafe practice performed successfully** — e.g.
  loading past a published maximum, omitting a stated requirement, mixing
  incompatible components.
- Any **case failure, split case, head separation, or damaged firearm**
  described as having occurred.
- Any post that appears to **give medical or legal advice** — injury treatment,
  whether a wound requires care, firearms law questions. Out of our scope
  entirely.
- Any thread where a **dangerous practice is being advocated** by multiple
  posters, because that pattern is how a bad idea becomes a community norm.
- Any post containing **suicide, self-harm, or threat content.** Do not
  elaborate. Record the URL, flag it, move on.
- Anything that looks like a **commercial pitch or affiliate content** dressed
  up as community experience.

For escalated items: capture `source_url`, a one-line neutral description, and
why it was escalated. **No reproduction of the dangerous detail.**

---

## 7. Deliverables

1. **`observations.jsonl`** — the dataset, per section 4.
2. **`disagreements.jsonl`** — the disagreement map, per section 1.3.
3. **`escalations.jsonl`** — per section 6.
4. **`coverage_report.md`** — what you read, what you skipped and why. Include:
   - sites attempted, sites skipped (with the reason — robots, ToS, paywall)
   - thread counts read
   - **topic distribution**, so a human can see the shape of what was found
   - **known gaps.** Where the forums were quiet on something, say so. Silence
     is data and misreporting it is the most likely way this work goes wrong.
5. **`anomalies.md`** — anything that surprised you, e.g. a widely repeated claim
   with no traceable origin, or the same suspicious wording across unrelated
   forums. **Report; do not adjudicate.**

### 7.1 What you must include in `coverage_report.md`

State plainly, in your own words:

> This dataset represents what a sample of public forums contained on the dates
> read. It is not a survey of reloader opinion, it has not been reviewed by a
> human, and it does not establish that any claim is correct. Several of these
> claims are wrong. Use it to find sources, not to reach conclusions.

**Do not soften this.** It goes in the file verbatim, unedited by you, because a
weakened disclaimer travelling with the data is worse than no disclaimer.

---

## 8. What happens to your output

A human editor reviews every observation and sets `status`, `confidence`,
`agreement_level`, and `safety_risk`. Observations never enter the published
load tables — enforced by schema, which has no foreign keys from the official
tables into the community set.

Your output is a **lead**, never a citation. That is by design, not a
reflection on your work.

---

## 9. Success criteria

You have done this well if:

- Every observation has a working direct URL and a supporting quote.
- You can say where the community disagrees, and you did not resolve it.
- You did not assert a single number as your own finding.
- Your coverage report is honest about gaps.
- Someone can hand your dataset to a human reviewer who can triage it in an
  hour rather than a week.

You have failed if:

- Any observation reads as a recommendation.
- Any number appears in your output as your own assertion.
- Any judgment about correctness appears anywhere.
- You guessed a date, an author, or a URL.
- Your coverage report overstates what you found.
- You wrote anything into a table other than the community observation set.

---

## 10. Liability position, and why this design keeps it clean

The stated goal is no liability, and providing the best available data. Those are
compatible here, but only because of specific structural choices — not because
of disclaimers.

**Disclaimers do not work.** We established that early: nobody reads them, and a
disclaimer attached to content that looks authoritative is worse than none,
because it implies the surrounding content is reliable. Liability protection
comes from structure and honesty, not text.

| Protection | Mechanism | Not a disclaimer |
|---|---|---|
| No fabricated numbers | Model may not assert any number; every observation carries a verbatim quote and URL | ✔ structural |
| No hidden curation | Model may not set `confidence` / `agreement_level` / `safety_risk`; everything lands `unreviewed` | ✔ structural |
| No influence on published data | Schema has no foreign keys from official tables into the community set. Community data cannot reach a load result | ✔ enforced by the database |
| No impersonation | Read-only, no accounts, no posting, no votes | ✔ structural |
| No reproduction of others' content | Links + 25-word quotes, never full threads | ✔ structural |
| No decontextualised advice | Claim is never separated from its author, date, and conditions | ✔ structural |
| Honest gaps | Coverage report must state what was **not** found, not just what was | ✔ structural |

**The strongest single protection is the foreign-key direction.** Even if
somebody later decides to be clever and feed a community observation into a load
result, the database refuses. That is the difference between a promise and an
enforced boundary, and it is why the community schema was built this way first.

### 10.1 What still requires a human

We are not in a lawyer-free zone by design; we are in a *smaller* one. Two items
need real legal review before this feature goes public:

1. **Scraping terms of service**, per forum. The brief instructs the agent to
   respect robots.txt and ToS and to report skipped sites, but **ToS review
   across multiple forums is a legal question, not an engineering one.**
2. **Whether linking and short-quoting requires attribution form or licence.**
   Generally low risk, not zero.

Everything else in this document is engineering and editorial, and the agent
cannot create legal exposure that the structure above already prevents — with
one exception: **if the agent republishes substantial forum text, that is a
copyright question we have not resolved.** Hence the link-don't-republish rule,
which is the one instruction in the brief with legal consequences rather than
just quality consequences.

### 10.2 The honest framing for users

The community layer must be presented so a user can tell, instantly, that it is
a different kind of thing from the published data:

- **Visually distinct**, not styled like the verified tables
- **Labelled with its evidence class** — "community report, unreviewed"
- **Every row links out**, so the user can judge the source themselves
- **Countable and dated** — "6 threads, 2019-2026" rather than a score

The user's stated goal — *"the user needs to know which data is the best"* — is
met by this rather than by a badge or a ranking. A cited manual load with an
edition and page is the best data. A forum thread with a direct link is a lead.
Showing which is which, every time, is the whole answer.