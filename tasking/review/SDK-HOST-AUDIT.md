# SDK host audit — `C:\Cline`, not this repository

Assessed 3 Oct 2026. Written because it is a **different audit in a different tree with a
different answer**, and conflating the two is easy — especially since one advisory
appears in both.

## The short version

**Nothing here is an exposure to this project's users, and nothing can be fixed from here.**
Both halves of that were verified rather than assumed.

## What was run

`C:\Cline` hosts `@cline/sdk` — the runtime the swarm's agents execute inside. It reports
**32 advisories, 14 high**. The two commands that matter:

```
npm audit fix
→ up to date, audited 328 packages in 1s
```

That "up to date" is the whole finding. `npm audit fix` can change **nothing**, because
every advisory sits in a transitive of `@cline/sdk` at a version the SDK pins, and the
versions that fix them are not versions the SDK permits. An `overrides` block would force
incompatible versions into the SDK's own dependency tree — trading a theoretical advisory
for a broken agent runtime, which is a strictly worse outcome.

Two advisories additionally have **no published fix at any version**:

- `@opentelemetry/core` — unbounded memory in W3C Baggage propagation, fixed at 2.8.0;
  nothing in the pinned chain can reach it.
- `node-forge` — advisory covers `*`, i.e. every version ever published.

## The four chains, and whether we reach them

Traced with `npm ls`, not inferred from the advisory text:

| Chain | Severity | Reachable from what we do? |
|---|---|---|
| `@cline/sdk` → `@cline/core` → `@cline/llms` → `@jerome-benoit/sap-ai-provider` → `@sap-ai-sdk/foundation-models` → `@sap-cloud-sdk/connectivity` → `jks-js` → **`node-forge`** | **high** | **No.** Only if a SAP AI model provider is configured. None is. |
| `@cline/llms` → `dify-ai-provider` → `@ai-sdk/provider-utils` → **`undici`** → `@fastify/busboy` | **high** | **No.** Only if Dify is configured. None is. |
| `@cline/llms` → `@langfuse/vercel-ai-sdk` → `ai` → `@ai-sdk/gateway` → `@ai-sdk/provider-utils` | moderate | No. Langfuse is a telemetry path, not enabled. |
| `@cline/llms` → `@opentelemetry/exporter-{logs,metrics,trace}-otlp-http` → **`@opentelemetry/core`** | moderate | Telemetry only, and unfixable at any level. |

**The one that looks alarming and is not:** `@fastify/busboy` is a **high** — Denial of
Service via a prototype-named multipart part header. It is reachable only through the Dify
provider, and this project uses no Dify configuration.

## The overlap worth knowing about

`node-forge` / `GHSA-86w9-cpqp-85rv` (RSA PKCS#1 v1.5 signature verification accepts extra
nested `DigestAlgorithm` elements) appears in **both** trees:

- here, via the SAP chain
- in ApexProject, via `expo → @expo/cli → @expo/code-signing-certificates`

Same flaw, two unrelated dependency graphs. In **both** cases the flaw needs an
attacker-controlled signature to matter — here, a certificate we never receive; in
ApexProject, an iOS code-signing certificate we generated ourselves. The ApexProject
instance is already recorded with that reasoning in
`data/security/known-advisories.json`, which is why `npm run audit:check` reports it
rather than failing on it.

## What would change this assessment

Configuring a **SAP AI**, **Dify**, or **Langfuse** provider. At that point the first two
chains stop being hypothetical, and the `undici` resource-consumption issue and the
`node-forge` signature issue become worth raising with whoever maintains the SDK. Until
then they are unreachable code in the dependency graph.

## Why this is a document and not a task

This tree has **no audit gate** — `npm run audit:check` lives in ApexProject and covers
only ApexProject. Adding one to `C:\Cline` would mean deciding what a permanently red
gate does to an agent runtime you use every day, which is a decision about the SDK host,
not about this project.

So it is written down instead: so the next person does not re-derive four dependency
chains from scratch, and so nobody later reads a 32-advisory audit report and concludes
something is on fire.

**Related:** [DERIVED-VALUES.md](DERIVED-VALUES.md) — unrelated, despite both documents
mentioning `node-forge`. They are linked because a reader who has seen one advisory will
plausibly assume the other covers it, and it does not.