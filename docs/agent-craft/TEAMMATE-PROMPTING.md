# Writing teammate prompts that work

Derived from the failed first team run and Cline's documentation. Each section
fixes a specific observed failure.

## The shape that works

A teammate prompt has five parts, in this order. The first three are what
prevents the failures we actually hit.

### 1. IDENTITY and standing rules (in the role prompt, at spawn)

Set once, applies to every task that agent gets. Keep it to hard constraints,
not prose.

    You are the <ROLE> on <PROJECT>. You are a fresh instance of the default model.

    STANDING RULES (never relax these):
    - WRITE-SET: you may create or edit ONLY <paths>. Everything else is read-only.
    - If you find a bug outside your write-set, REPORT it. Never fix it.
    - Never invent a number, citation, or claim. "Unverified" is a valid answer.
    - Cite evidence: file path + line number, or commit hash.
    - Before reporting done: run <COMMAND> and confirm exit <N>.

The write-set line is the one that matters most. It is the difference between a
teammate and a second process editing your files.

### 2. CAPABILITY TRUTH (does not belong in the task)

State what the agent can and cannot do. The first team run assigned web research
to a tool documented as unable to search the web.

    - You CAN: read files, search code, run commands, write inside your write-set.
    - You CANNOT: browse the web, use MCP servers, spawn nested agents.

If the tool cannot do it, say so in the prompt. Otherwise the agent will plan
around a capability it does not have and report a confident failure.

### 3. ORIENTATION (point, do not paste)

Do not inline the project rules. Tell the agent where they live:

    READ FIRST, IN THIS ORDER:
    - .clinerules                     project-wide rules
    - docs/CONVENTIONS.md section N   the conventions that govern this work
    - <the file that documents this area's known traps>

Link, do not paste. Pasted rules drift out of sync and cost prompt budget on
every dispatch.

### 4. THE TASK

    WHAT: <one sentence, concrete>
    DELIVERABLES: <exact file paths>
    CONSTRAINTS: <length limits, format, what is out of scope>
    ACCEPTANCE: <the command that proves it works>

Say "under 200 lines" and "split into multiple files if needed." Long documents
do not get read, and an unread document is a wasted agent run.

### 5. THE REPORT

    Return: what you did, what you found, what you could NOT verify,
    what you changed outside the write-set (should be nothing),
    and the exact commands you ran with their exit codes.

Asking for what they could not verify is deliberate. It is the section most
likely to be honest, and the one most likely to be skipped if not requested.

## Failure modes to design against

| Failure | Cause | Countermeasure |
| --- | --- | --- |
| Agent reports success, did nothing | No executable acceptance criterion | Require a command + exit code |
| Agent invents a citation | Prompt values thoroughness over honesty | "Unverified is a valid answer" in the prompt |
| Agent edits outside its lane | No write-set, or unenforced | Write-set in the role prompt + gate |
| Agent cannot do the task | Capability assumed, not checked | State the capability list |
| Agent restates the prompt at length | Asked for "a report" with no shape | Fixed report sections |
| Rules out of sync | Rules pasted into the prompt | Point at the file instead |
| Wasted run on a broken harness | Dispatched before smoke test | Smoke-test one agent first |

## A worked example, bad and good

**Bad** - what I dispatched first time:

    Research competitor sites and open-source resources.

Problems: no write-set, no deliverable paths, no acceptance criterion, no
capability statement, no "what if you cannot verify this", and it assumed web
access that may not exist. All three agents failed before starting.

**Good:**

    RESEARCH TASK R2 - Numerical cross-validation.

    WRITE-SET: create NEW files ONLY in docs/research-methods/.
    If you find a bug elsewhere, REPORT it; do not fix it.

    READ FIRST: .clinerules, then docs/CONVENTIONS.md section 3
    (provenance on every constant).

    WHAT: identify mathematically independent ways to compute each quantity
    packages/ballistics-core computes, so agreement becomes real evidence.

    DELIVERABLES: four files in docs/research-methods/, each under 200 lines,
    named 01- through 04- as specified below.

    CONSTRAINTS: cite every external claim with a URL or DOI. Never invent a
    coefficient or a citation. Write the actual formula, not the name of a
    method.

    ACCEPTANCE: npm run verify exits 0. Quote no stage count; it changes.

    RETURN: what you did, what you found, what you could NOT verify, any change
    outside your write-set (should be none), and every command with its exit code.

## Where these prompts live

Task-specific prompts are written per dispatch. Standing rules are in the role
prompt passed to `team_spawn_teammate`. Project rules stay in `.clinerules`
and `docs/CONVENTIONS.md` and are referenced, never copied.

The failure to avoid is a third copy drifting.
