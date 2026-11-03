# Building a Top-of-the-Line Agentic Swarm

Research date: 2026-10-02 · Sources: 646 Exa results across 8 subagents + ~55 arXiv abstracts screened directly

---

## 0. The Thesis in One Paragraph

The evidence does **not** support "more agents." It supports **a small number of well-chosen roles, jointly evolved as a system, with architecture-task alignment verified empirically per task.** The single most load-bearing finding is that agent count is the one variable the scaling literature most consistently shows to be saturating or harmful, while *handoff quality* — preserving task-critical information across a boundary — beats adding agents outright. A swarm is a context-distribution system, not a smarter architecture.

---

## 1. The Central Disagreement (Read This First)

The most important thing in this research is not a technique. It's that **two production practitioners with skin in the game publicly contradict each other**, and both are right.

| | [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) | [Cognition](https://cognition.com/blog/multi-agents-working) |
|---|---|---|
| Claim | Multi-agent is "a vital way to scale performance" — **+90.2%** over single-agent Opus 4 on internal eval | Walden Yan: "Don't Build Multi-Agents" — Swarm/AutoGen concepts are "the wrong way"; decisions become "too dispersed and context isn't able to be shared thoroughly enough" |
| Evidence | Shipped Research feature, published own costs | Devin in production |
| Outcome | — | **Partially reversed April 2026**: works when "writes stay single-threaded and the additional agents contribute intelligence rather than actions" |

**They are not contradicting each other.** Three independent analyses converge on the same separating variable:

- [dreaming.press](https://dreaming.press/posts/multi-agent-vs-single-agent.html) — **read-heavy vs write-heavy**
- [Signal](https://agenticlab.sunilprakash.com/signal/003-multi-agent-decision-variable/) — **decomposability**
- Cognition's version — **shared mutable state**

> Multi-agent wins on loosely-coupled read/search work where sub-results just aggregate. It loses on tightly-coupled write work where every decision depends on the others. That is a testable property, not a vibe.

---

## 2. The Scaling Law (The Most Decision-Relevant Finding)

[A Science of Scaling Agent Systems](https://arxiv.org/abs/2512.08296) (Google DeepMind et al., 260 configs, 6 benchmarks, 5 architectures, 3 LLM families):

- Cross-validated **R²=0.373**; predicts best architecture for **87%** of held-out configs
- **+80.8% on decomposable financial reasoning → −70.0% on sequential planning**
- **Capability-saturation effect:** coordination yields diminishing returns once single-agent baselines pass a threshold
- Tool-heavy tasks incur MAS overhead outright

**Implication:** gains are task-shape-dependent and *transient* — likely converging toward zero as frontier models absorb the capability. Nobody has projected this forward.

---

## 3. Architecture Topologies

| Pattern | Who coordinates | Strength | Failure mode | Source |
|---|---|---|---|---|
| **Orchestrator–worker** | Lead plans, spawns isolated subs, synthesizes | Breadth-first search; subs act as context compression | Duplicated work; lead blocks on all; **~15× token cost** | [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) |
| **Tiered router → cheap models** | Non-LLM classifier (<10ms) routes to cheapest sufficient tier | Bounded lookups stop being billed at orchestrator rates | Misrouting; classifier drift | [getnadir](https://getnadir.com/blog/multi-agent-orchestration-15x-token-cost/) |
| **Supervisor / router-hub** | Central router reads shared state, picks one specialist | Simplest; state persistence is the real control point | Router collapses at scale; single point of failure | [agentengineering](https://agentengineering.org/articles/supervisor-router-and-planner-executor-patterns/) |
| **Three-layer hierarchy** (governance/execution/compliance) | Governance allocates; compliance gates output | **+102.73% accuracy AND −74.52% tokens** vs flat | Layer count explodes latency | [OrgAgent](https://arxiv.org/abs/2604.01020) |
| **Dynamic DAG planner–executor** | Planner emits dependency graph, executors run topologically | Global upfront plan beats reactive | Plans built on partial view of problem | [arXiv 2607.27942](https://arxiv.org/abs/2607.27942) |
| **Graph-as-workflow, typed handoffs** | Typed edges carry messages; router picks representation | Natural-language handoff eats 40–60% of budget; typed edges **compress 3.2×, higher accuracy** | Graph-only regresses on some tasks | [EMNLP 2026](https://arxiv.org/abs/2608.25277) |
| **Adaptive topology routing** | Bandit/meta-router picks topology per task | **12–23%** gain over any static topology | Orchestration can't beat a weak model below capability threshold | [arXiv 2602.16873](https://arxiv.org/abs/2602.16873) |
| **Multi-agent debate** | Agents critique each other | Wins **only when heterogeneous AND structured** | Homogeneous debate: **2.1–3.4× tokens for equal-or-lower accuracy** | [Bertalanič & Fortuna 2026](https://www.bing.com/search?q=multi-agent+debate+sycophancy+consensus+collapse) |
| **Market / contract-net** | Agents bid on tasks | Strong in theory (AgentLance beats centralized) | **Unfundamented**: agents can't self-report success probability or cost well enough to bid | [MarketBench](https://www.bing.com/search?q=MarketBench+LLM+agents+bidding+self-report) |

**Blueprint takeaway:** hierarchical shell (tiered, role-routed, cache-aware) over an explicitly-governed shared artifact store, with a deterministic write path and only genuinely independent subtasks fanned out. Markets and debate are research-stage primitives whose preconditions the benchmarks say are not yet met.

**Load-bearing caveat:** all circulating HumanEval / SWE-bench / tokens-per-line numbers in framework marketing are **self-reported by each framework**. Cross-topology comparison is unreliable except where the measuring paper is named.

---

## 4. Failure Modes (The Adversarial View)

| Failure mode | Why it happens | Symptom | Mitigation | Source |
|---|---|---|---|---|
| **Multiplicative reliability decay** | Chained non-determinism compounds as `p^N` | At 95%/agent: 2 agents ≈90%, 5 ≈77%, **8 ≈66%**. No crash, just quiet quality loss | 30+ deterministic checks at seams; anything with a knowable answer should be code | [benjsmin](https://benjsmin.com/en/blog/why-multi-agent-systems-fail-in-production) |
| **Correlated error amplification / premise laundering** | One agent's hallucination becomes the planner's premise; the critic ratifies it *because* it's presented as the plan | Confidently wrong, internally consistent output. Every agent "succeeded" | Validate at every boundary; never let downstream treat upstream prose as ground truth | [benjsmin](https://benjsmin.com/en/blog/why-multi-agent-systems-fail-in-production) |
| **Duplicate/conflicting writes** | No write-ownership primitive; last-writer-wins | Same row written 3×, reported **success**, no exception. Customer got the wrong version at 2:14am | Explicit ownership + idempotency keys; single-threaded writes | [marklaursen](https://marklaursen.com/blog/why-i-stopped-using-multi-agent-frameworks) |
| **Context collapse at handoff** | Handoff compresses conversation to a summary; negative constraints dropped | Orchestrator asks for info already given; specialist answers a different question | Inject state at kickoff; two-tier tool loading (small core always present, long tail behind search) | [respan](https://www.respan.ai/blog/from-five-agents-to-one-loop) |
| **Summary collapse — boundary markers stripped** | Compression preserves operational facts, destroys metadata governing their use | Boundary survival σ 0.80 free-text → **0.57 at 25-word budget**, while fact survival stays at ceiling | Carry typed handoff record: intent, constraints, state-changed, authority, evidence | arXiv governed shared memory |
| **Instruction bleed** | Worker inherits parent's stylistic/system constraints | Worker told to emit JSON plan starts hedging instead | Strict isolation for independent workers | [LangChain](https://www.langchain.com/blog/organizing-context-in-a-multi-agent-harness) |
| **Coordination overhead quadratic in steps** | Every agent must reason about others' state | Latency blowup, no quality gain | Orchestration ≠ intelligence; spend budget on context, not chatter | Google DeepMind / Nature MI |
| **Runaway fan-out** | Agents recruit agents | Real reports: **41 verifiers**, then **102 agents, then 415**; one 9-handoff loop burned 47k tokens / $6.20 to complete zero bookings | Hard concurrency caps; explicit budgets | [systima](https://systima.ai/blog/subagent-tax) |
| **Transitive/conjunctive prompt injection** | Injected content propagates through the handoff chain; receiver can't distinguish attacker content from trusted peer output | Injection **exfiltrates despite surface defenses**; two individually-benign components become harmful when routed together | Per-agent token scoping; authz outside the model; label by trust level | [Framing Gap](https://arxiv.org/abs/2608.27092), [Conjunctive](https://arxiv.org/abs/2604.16543) |

**"Unbounded multi-agent" is the real failure.** The prescriptive counter-practice is *not* "one agent" — it is single-threaded writes, hard token/loop caps, deterministic validation at every seam, and durable checkpoints. Laursen's replacement wasn't a single agent; it was **three well-scoped agents coordinated by explicit code instead of seven framework-orchestrated ones**.

---

## 5. Context & Memory Engineering (Usually the Actual Bottleneck)

| Technique | Solves | How | When | Source |
|---|---|---|---|---|
| **Scoped subagent context** | Parent pollution, fan-out cost, instruction bleed | Child spawns with empty message array. Gets: task brief + global constraints (budget/deadline/forbidden) + handle to artifact store. Returns bounded summary + handle | Default for workers/reviewers | [LangChain](https://www.langchain.com/blog/organizing-context-in-a-multi-agent-harness) |
| **Forked subagent** | Isolated subs redundantly re-gather context | `mode: "fork"` propagates parent state; trailing tool call excised; branch collapses into one tool result. Cheaper — hits prompt cache | Memory-extraction agents; **not** parallel researchers (duplicates history N times) | [LangChain](https://www.langchain.com/blog/organizing-context-in-a-multi-agent-harness) |
| **Condensed-result protocol** | Parent drowning in scratchwork | Sub explores 10k+ tokens, returns 1–2k condensed summary. Parent never sees intermediate tool calls | Breadth-first queries | [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) |
| **Output → filesystem/artifact store** | "Game of telephone" | Subs write structured artifacts externally, pass only lightweight references | Code, reports, charts, datasets | [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) |
| **Structured handoff object** | Summaries dropping the ask; re-litigating settled decisions | Typed schema: `task_id`, `from_agent`, `to_agent`, identifiers, decisions already made, constraints, open questions, confidence, provenance, authorization | Every inter-agent boundary | — |
| **Stale vs missing state** | Shared transcript holds pre-edit file versions with no ordering info | Named files read on demand, not a common append log. **Append-only ops for concurrent writers** — never reject under any interleaving; conflicts stay *visible* | Multi-writer tasks | [governed shared memory](https://arxiv.org/abs/2608.25277) |
| **Pinned constraints vs summarized everything else** | Truncation drops load-bearing early constraints | Hard truncation produces an agent that cheerfully violates a constraint it was explicitly given. Compaction: dynamic content last, preserve *why* | Long sessions | [LangChain](https://www.langchain.com/blog/organizing-context-in-a-multi-agent-harness) |
| **Context poisoning persistence** | Poisoned session state written to long-term memory and re-retrieved | "Long-running agentic reliability is a context hygiene problem dressed up as a model problem" | Systems with persistent memory | — |

**The strongest principle:** *independence is destroyed by sharing context.* "A verifier that sees the answer being verified is not a verifier." Same logic makes instruction bleed dangerous rather than merely wasteful.

---

## 6. Frameworks: Build vs Buy

| Framework | Core model | Excels at | Weaknesses | Source |
|---|---|---|---|---|
| **LangGraph 1.0/1.1** | Explicit state graph; supervisor or handoff/swarm | Control flow, checkpoint/resume, HITL interrupts, deep tracing; ~90M monthly downloads | Debugging is the cost: "the stack trace points to the framework, not your function." TypedDict is a typing fiction — state keys dropped silently. Graph-coupled code makes exit a rewrite | [langchain.com](https://www.langchain.com/blog/langchain-langgraph-1dot0) |
| **Raw SDK + hand-rolled loop** | Your own supervisor/router; cron or workflow engine on top | Full control, no abstraction tax, cheapest at small topology, portable | **You** own durability, retries, liveness, idempotency | [marklaursen](https://marklaursen.com/blog/why-i-stopped-using-multi-agent-frameworks), [blackmatter.vc](https://blackmatter.vc/lab/how-i-run-multi-agent-orchestration-without-a-platform) |
| **Anthropic Claude Agent SDK** | Spawns Claude Code binary as a **subprocess** | Best-in-class agent loop + context management | Subprocess/IPC invisible to HTTP tracing; observed 120s+ silent hangs at 8:48 idle; regresses across minor version bumps | [cognitivecommons](https://cognitivecommons.substack.com/p/when-agent-runtimes-become-a-liability) |
| **OpenAI Agents SDK** | Handoffs / agents-as-tools; guardrails in parallel | Few primitives, first-party tracing, resumable sandboxes | Least multi-agent evidence of the majors | vendor docs |
| **ADK / Semantic Kernel / AutoGen** | — | — | ⚠️ **AutoGen is maintenance-mode; `ag2-classic` effectively dead. Semantic Kernel + AutoGen merged into Microsoft Agent Framework 1.0.** Picking either for greenfield is a mistake | landscape sweep |

**The strongest consensus:** durability semantics are the real differentiator and **no agent framework supplies them to production standard** — which is why nearly every strong hand-rolled source reinstates Temporal or Hatchet anyway.

**Hitl durability is a storage problem:** human approval is the longest await (minutes to days). The pause persists but **the run does not** — on resume, nodes replay from the top. With an in-memory saver, a container recycle erases the pending approval *and the run*.

---

## 7. Interop & Protocols (as of Oct 2026)

| Protocol | Purpose | Maturity | Notes |
|---|---|---|---|
| **A2A v1.0.0** | agents↔agents | **Released 1.0.0**; 26k stars. Protobuf + JSON Schema; JSONRPC/gRPC/HTTP+REST bindings | Donated to LF Jun 2025; moved into **Agentic AI Foundation Aug 2026**. §5 now mandates functional equivalence across bindings. v1.0 replaced top-level `url`+`preferredTransport` with ordered `supportedInterfaces[]` |
| **MCP 2026-07-28** | agents↔tools/data | **Final spec Jul 28, 2026** — largest revision since launch. Now **stateless**: `initialize`/`initialized` and `Mcp-Session-Id` removed (SEP-2575) | Operationally huge: round-robin LB, `Mcp-Method` routing, cacheable `tools/list`. Roots/Sampling/Logging deprecated. 12-month min deprecation window |
| **AG-UI** | agent↔UI | Leads but **not yet a standard** — design for it, don't lock in | — |
| **AIP / Biscuit** | agent identity | **Pre-standard.** Bet on RFC 8693 token exchange + per-agent scoping now | — |

**Security consensus (converged and unglamorous):**
- Scope tokens **per agent, not per team** — each agent gets its own client ID scoped to its own tools
- RFC 8693 token exchange on sub-agent delegation so the orchestrator's token is exchanged for a narrower one
- Enforce authorization **outside the model** (OPA, Cedar) with an action gate between LLM output and execution — a simple allowlist costs an afternoon and dramatically reduces confused-deputy surface
- Log the full delegation chain as an `act` claim tree: "which human authorized which agent to do this"
- Agent Card content is attacker-reachable; `AgentCardSignature` exists but is opt-in

**Largest remaining gap:** there is **no standardized handoff primitive in either A2A or MCP**. Every team hand-rolls a versioned typed envelope.

---

## 8. Evaluation & Observability

| Tool | Category | What it gives you | Source |
|---|---|---|---|
| **MASEval** | benchmark | Treats the **whole agentic system** as the unit of analysis; varies topology/orchestration/error-handling holding task fixed. **Framework choice matters as much as model choice** | [arXiv 2603.08835](https://arxiv.org/abs/2603.08835) |
| **OrchBench** | benchmark | Deterministic **simulation** of orchestration plans with no worker agents. Validated **r=0.816** vs real executions at **1.3% of tokens, 10.3% of wall-clock** | [arXiv 2607.25656](https://ar5iv.labs.arxiv.org/html/2607.25656) |
| **OTel GenAI agent spans** | observability | Normative span taxonomy: `invoke_workflow`, `invoke_agent`, `invoke_agent_client`, `create_agent`, `plan`, `execute_tool`, `create_memory`/`search_memory`. Vendor-neutral, free | [gen-ai-agent-spans.md](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md) |
| **Chronicle** | testing | Records every non-deterministic boundary as immutable envelope; serves a chosen subset and runs the rest live — prod incident becomes a committed regression test | cut-point replay |
| **MAFBench** | benchmark | Controlled isolation of orchestration, memory architecture, planning interface, specialization, communication topology. Pinned deps, reproducibility artifacts | [github](https://github.com/CoDS-GCS/MAFBench) |

**Two findings that bear directly on "top of the line":**
1. MASEval: framework choice matters as much as model choice.
2. **OrchBench: preserving task-critical information across handoffs matters MORE than adding agents**, and parallelism returns diminish as coordination failures accumulate. A swarm is not self-justifying.

**Unsovled:**
- **Determinism is approximated, never achieved.** Replay stubs boundaries → you get regression safety on orchestration code, not the model. Inference isn't bitwise reproducible even at temperature 0.
- **Benchmark scores are design artifacts.** OrchBench's own ablation: remove the missing-transfer penalty and the strong-vs-weak planner gap collapses **0.247 → 0.011**. Check the ablation before believing any swarm number.
- **No field yet.** "Agent reliability engineering" has no standards body, no canonical definition, no shared curriculum.

---

## 9. Cost, Latency & Routing

| Observation | Impact | Detail | Source |
|---|---|---|---|
| Multi-agent token premium | **~4× vs chat; ~15× multi-agent** | Anthropic's shipped feature; Opus 4 lead + Sonnet 4 subs | [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) |
| Quality that justifies it | **+90.2%** vs single-agent Opus 4 | Token usage alone explained **80%** of variance; three factors 95% | same |
| Subagent fan-out tax | **2.6–5.9×** input tokens; **not faster on any timed task** | Worst case **513,000 vs 121,000** tokens for identical work | [systima](https://systima.ai/blog/subagent-tax) |
| Prompt caching | **41–80% cost reduction, 13–31% TTFT** | 500+ sessions, DeepResearch Bench, 3 providers. Caveat: naive full-context caching can *increase* latency | [PwC arXiv 2601.06007](https://arxiv.org/html/2601.06007) |
| Cache hit rate discipline | **85.8% hit → 77% input-cost cut** | $37,500 → ~$8,540/mo on 30B tokens. Badly ordered prompt hits only ~20% | [derivai](https://derivai.substack.com/p/prompt-caching-production-ai-agent-costs) |
| Model routing by role | **>85%** savings at 95% frontier quality, 14% traffic escalated | **Critical:** current harnesses default subagents to *inherit the parent's* (frontier) model | routing sweep |
| Real parallelism where work is independent | **2.5× faster, ~5× cheaper** (12min/$1.50 vs 29m50s/$7.71) | Speedup collapses **2.3–2.8× → ~1.1×** once independence runs out | measured harnesses |

**Biggest lever is cache hit rate, and it's architectural, not model-shaped.** Two swarm-specific hazards: fan-outs age out the orchestrator's cache and re-prime at premium write rates, and parallel cold spawns racing an identical cold prefix mean you buy that prefix several times over. **Stagger cold fan-outs. Pin subagent models explicitly.**

**Decision rule across every practitioner:** go multi-agent when subtasks are **independent**, the surface is large, value per task is high, and agents benefit from separated context or bounded tool catalogs. Stay single-agent when work is sequential, dependent, or cheap.

**Counterweight:** at fleet level, tokens may be only ~5% of cost — human review and engineering upkeep dominate. The largest cost lever may be **deleting agents** or demoting one a tier from acting to drafting.

---

## 10. The Research Frontier

| Work | Contribution | Finding |
|---|---|---|
| [Science of Scaling Agent Systems](https://arxiv.org/abs/2512.08296) | Predictive scaling model | +80.8% decomposable → −70.0% sequential. R²=0.373. 87% held-out accuracy |
| [MAST](https://arxiv.org/abs/2503.13657) | First MAS failure taxonomy, 1,600+ traces | 14 failure modes / 3 categories, κ=0.88. "Gains on popular benchmarks are often minimal" |
| [Darwin Gödel Machine](https://arxiv.org/abs/2505.22954) | Self-modifying agent with archive | SWE-bench **20% → 50%**; Polyglot 14.2% → 30.7% |
| [SICA](https://arxiv.org/abs/2504.15228) | Agent edits its own source | **+17% to +53%** SWE-bench Verified |
| [AlphaEvolve](https://arxiv.org/abs/2506.13131) | Evolutionary code search | 4×4 matmul in **48 scalar multiplications** — first Strassen improvement in **56 years** |
| AFlow | MCTS over agentic workflows | **4.55% of GPT-4o cost** — but this is a *search* result, not a *scaling* result |

**Replication caveats:** no formal retractions found, but uneven. AlphaEvolve's math validation co-authors an AlphaEvolve author, so it isn't the independent confirmation it appears to be. ADAS, GPTSwarm, MGM report **no headline numbers in their abstracts** — the gains may be real but aren't verifiable from the abstract, itself a signal about the field's reporting norms. Negative results are narrow-domain: "swarms don't scale" is supported in the **sequential-task regime specifically**, not universally.

---

## 11. The Blueprint

1. **Start with the decision variable, not the topology.** Classify the workload: read-heavy/decomposable → swarm may win. Write-heavy/sequential → single loop.
2. **Build the handoff envelope first.** Versioned, typed, validated at the boundary, rejecting incomplete handoffs early. Carries intent, constraints, evidence, open questions, authority. Secrets redacted.
3. **Govern the shared artifact store.** Explicitly. Four failure modes of ungoverned shared memory: unauthorized leakage, stale propagation, contradiction persistence, provenance collapse. Append-only writes for concurrent authors so conflicts stay visible.
4. **Single-thread all writes.** Extra agents contribute *intelligence*, not actions. This is the one practice both Anthropic and Cognition converged on.
5. **Scope context per agent, never shared.** Verifier isolation is the point. Fork for memory-extraction; isolate for parallel workers.
6. **Cache-aware by construction.** Dynamic content last, deterministic content pinned first. Stagger cold fan-outs. Pin subagent models explicitly — don't inherit.
7. **Route tiered and cache-aware.** Non-LLM classifier where possible; role-based routing inside the swarm.
8. **Debate only when heterogeneous and structured.** Homogeneous debate is 2.1–3.4× tokens for equal-or-lower accuracy.
9. **Ship OTel agent spans before anything else.** Free, vendor-neutral, covers orchestration structure not just model calls. Pin the version — it's still `Development`.
10. **Measure the whole system, not the model.** MASEval: framework/topology choice matters as much as model choice. OrchBench is the cheapest eval loop found.
11. **Budget per task, not per token.** Hard concurrency caps. 41-recruiter and 415-agent fan-outs are real reports.
12. **Cap the blast radius.** Idempotency keys the downstream honours; policy enforced outside the reasoning loop; earn the step from "propose" to "write broadly" via shadow-mode evidence.

---

## Source Quality Ledger

**Weighted highest:** Anthropic multi-agent post (built it, published own costs, first-party), Cognition (production, publicly updated position), Google DeepMind scaling paper, MAST (κ=0.88, 1,600+ traces), marklaursen (18 months, 3 frameworks, named incident at 2:14am), benjsmin (live pipeline, checkable arithmetic), PwC caching paper (multi-provider, named authors), OTel spec (normative).

**Discounted:** vendor framework comparisons (self-reported metrics, several with unsourced numbers), all SEO listicles (markaicode, devlifted, woyce, cellcog, levelop, differ.blog, suneltr, stacksandflows, dreaming.press, particula.tech, effloow, swarmsignal, turion.ai). Circular citations of the Anthropic 15× number with no architectural detail.

**Explicitly flagged as too weak to use:** the 17.2× error amplification figure and the 8–10 handoff cliff (vendor-published, no primary source located); the 12-factor "most founders roll their own stack" claim (unfalsifiable, uncorroborated).

**Note on tooling:** `web_search_exa` was not provisioned as a callable tool to several subagents. Most worked around it via the Exa REST API with the configured key; the papers workstream used the arXiv API directly. All followed the reference-file guidance. `sources_reviewed` reflects literal Exa calls only — the ~55 arXiv abstracts are counted separately above.