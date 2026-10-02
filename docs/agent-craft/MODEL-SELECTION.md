# Model selection for agent teams

Written 2026-10-02 from Cline and OpenRouter documentation. Facts below are
sourced; anything not sourced is marked UNVERIFIED. Do not add a number here
without a link.

## The two hard constraints (these shape everything else)

**1. Subagents cannot do research.** They are read-only file agents. Per
https://docs.cline.bot/features/subagents they can read files, search code,
list directories, and run read-only commands. They **cannot** write files, use
the browser, access MCP servers, or **perform web searches**.

Consequence: any task needing the web must go to a *teammate*, not a subagent.
Our three research tasks (R1 competitors, R2 methods, R3 lessons) all needed
either the web or file writes. None were valid subagent work as written.

**2. Agent teams are CLI/SDK/Kanban only.** Per
https://docs.cline.bot/cli/agent-teams.md teams are "not applicable on VSCode
and JetBrains Extension for now."

## Free model reality

### Cline's own free tier
Per https://docs.cline.bot/getting-started/free-models.md:
- Rotating, limited-time promotions with a quota, not a permanent tier.
- **Not available through the Cline API** - IDE Extension and CLI only.
- "Free model usage may be used to help improve model performance and quality."
  Assume free-tier input may be used for training. Never put secrets or
  customer data into a free-model prompt.
- After quota: ClinePass ($9.99/mo, 2-5x rate limits on open coding models) or
  usage-billing.

### OpenRouter free models
Per https://openrouter.ai/collections/free-models the page states rankings are
by **tokens processed over 7 days**, and explicitly warns they "reflect
adoption, not model quality or benchmark performance."

**Do not treat that list as a quality ranking.** It is a popularity ranking.

Free models currently at the top of that usage list, with the vendor's own
claims, not independently verified by us:

| Model | Vendor claim | Context | License note |
| --- | --- | --- | --- |
| Space Bunny Alpha | strong coding, native multimodal, adjustable reasoning effort | 1M | **Stealth model.** Anonymous developer. Terms differ from normal OSS. |
| Nemotron 3 Ultra (free) | agent orchestration, coding agents, deep research, multi-step reasoning | 1M | NVIDIA open |
| Laguna S 2.1 (free) | 70.2% Terminal-Bench 2.1, 40.4% DeepSWE | 262K | OpenMDW-1.1 |
| Qwen3.8 27B (free) | coding, agent tasks, switchable thinking | 262K | Qwen open-weight |

Treat those benchmark numbers as vendor marketing until we reproduce them.
UNVERIFIED: we have not run any of these on our own tasks.

### Free router mechanics
Per https://openrouter.ai/docs/guides/routing/routers/free-router:
- `openrouter/free` picks a free model **at random** after filtering for your
  required capabilities. You do not control which.
- For a specific model, append `:free` to its ID.
- Stated limits: lower rate limits than paid, availability varies, latency is
  higher at peak.

**Random selection is disqualifying for us.** We need a named, reproducible
model per teammate so a failure can be attributed and a result reproduced.
Always pin the exact model ID.

## What each task type actually needs

From https://docs.cline.bot/cli/samples/model-orchestration.md, the documented
mapping is: cheap/fast models for summarization, expensive models for reasoning
and planning, and **"different models catch different issues, so
cross-validating solutions with multiple AI perspectives helps reduce blind
spots."**

That last point is the important one for this project. Three ballistics defects
shipped while 161 tests passed, because the tests and the implementation shared
one wrong assumption. A second model from a different training set is a partial
substitute for the independent oracle we do not yet have in CI.

| Task | Model class | Why |
| --- | --- | --- |
| Reading code, mapping a module | cheap fast | mechanical, no reasoning needed |
| Web research, fact extraction | mid, long context | breadth matters more than depth |
| Physics / numerical reasoning | strongest available | this is where being wrong is expensive |
| Reviewing someone else's work | **different model than the author** | the whole point is a second opinion |
| Final integration | strongest available | holds the write-set lock |

## The rule for model choice here

1. **Pin the exact model ID.** Never a router.
2. **Review with a different model than wrote.** Non-negotiable when the work
   is physics or compliance. A second pass by the same weights finds the same
   blind spots.
3. **Record the model in every report.** A result without a model attribution
   cannot be reproduced or trusted.
4. **Cheap model for cheap work, always.** Reviews of documentation do not need
   frontier reasoning. Spending it there is how the budget disappears before the
   physics work starts.
5. **Assume free-tier input may be retained.** No secrets, no affiliate
   credentials, no customer data.

## Open question

UNVERIFIED: actual free-model rate limits per account. The OpenRouter docs
describe limits qualitatively but do not publish numbers. Measure empirically
before planning throughput around them.
