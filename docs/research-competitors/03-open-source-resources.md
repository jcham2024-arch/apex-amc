# Open-source and commercial resources

## Governed datasets

This research is now machine-readable rather than prose-only:

- **`data/seeds/opensource_resources.csv`** (7 rows) — the open-source inventory,
  with exact licence identifier, licence-verified flag, maintenance state,
  usefulness, adopt decision and the maintainer's own warning where one exists.
- **`data/seeds/competitor_coverage.csv`** (6 rows) — our measured coverage
  against AmmoSeek, observed 2026-10-02.
- **`data/seeds/regulations.csv`** (16 rows) — the rules governing what we may do,
  each with quoted operative text and a retrieval date.

Enforced by `npm run regulations:check`, which now also enforces the licence rule:
**a resource cannot be `adopt: true` unless its licence was actually read.** That
rule was documented in the schema and enforced nowhere until a negative test
proved the tamper passed silently — a rule written in prose and checked by
nothing. It is now a gate.

### What the open-source research actually concluded

**Adoptable:**
- `js-ballistics` (ISC) — TypeScript/WASM, matches our Workers runtime. The only
  candidate found that could ship in our actual deployment.
- `ammolytics/projectiles` and `ammolytics/cartridges` (MIT) — cartridge and
  projectile naming/dimensions, especially CIP and NATO designations we lack.
- SAAMI free cartridge drawings — primary evidence from the standards body.

**Not adoptable, and the reason is the interesting part:**
- `py-ballisticcalc` is the *better* solver but is LGPL-3.0 and Python with C
  extensions. **Licence and deployment, not quality, are what decide this.**
  Use it as an offline oracle, never as shipped code.
- `zen/grt_databases` is **CC0-1.0 — the most permissive licence available** — and
  its own README disclaims responsibility and states measurements must be
  verified. This is the clearest case in the dataset that **a permissive licence
  is not a quality signal.** It is also user-contributed load data from a chat
  forum, and our stated position is that reload recommendations come from
  manufacturer-published data, not crowdsourced numbers.

**The SAAMI finding worth acting on:** SAAMI states its dimensional and
performance characteristics apply equally to reloaded ammunition, so using them
is fine — but it explicitly *cannot* advise on propellant selection, charge
weights or primer selection, and directs handloaders to manuals and
manufacturers. So the standards would not have closed our load-data gap even if
we bought them. That is now recorded in `regulations.csv`, because it is the
kind of thing that would otherwise be re-researched from scratch.

**The status trap worth knowing:** SAAMI's free drawings page carries *newly
accepted but not yet incorporated* designs (21 Sharp, 25 Creedmoor, 7mm
Backcountry, 8.6 Blackout, 30 Super Carry) **and pending revisions to existing
drawings**. A dimensional correction not yet folded into the standard is exactly
what would silently invalidate a figure we already hold.

## Payments and subscriptions

### Recommendation: Stripe Billing + Checkout
- **Licence:** proprietary SDK, free to use with per-transaction fees. Not open
  source and not redistributable.
- **Why:** the only mature option that does not make us a merchant of record, so
  we keep control of tax obligations and refund handling. Best documentation and
  webhook tooling of the four.
- **Cost:** roughly 2.9% + 30c per successful US domestic card charge. UNVERIFIED
  to the cent - confirm at stripe.com/pricing before budgeting anything.
- **Fit:** good *today*. We sell membership in an informational site, a normal
  digital good, so no restricted-business problem yet.
- **Risk to record, and it is larger than it looks:** selling apparel is
  ordinary commerce and Stripe is fine with it. Selling anything
  ammunition-adjacent is a different question. Reloadable brass may be
  refused under a policy reading "ammunition components," even though empty
  cases are inert. That is a processor policy decision, not a legal one, and we
  cannot argue it.

  **Phase 9 plans merch and possibly brass.** Before any of that is built, ask
  Stripe in writing. If the answer is no, the alternatives are a different
  processor or a merchant of record that will accept it, and both cost more.
  UNVERIFIED until answered - this is the most likely reason Phase 9's brass half
  fails, and it is cheap to find out early.

  Powder and primer are never sold. That is a hard exclusion, not a phase.

### Merchant-of-record alternatives (higher fee, less admin)
- **Lemon Squeezy** - MoR, handles sales tax and VAT. Around 5% + 50c.
  Use only if tax registration becomes a burden.
- **Paddle** - MoR, similar, heavier integration.
- **Coinbase Commerce** - crypto only. Not recommended; adds friction, no gain.

**Recommendation:** Stripe first. Lemon Squeezy only if tax registration bites.
Do not add a second provider before the first is proven.

## Authentication and membership

| Option | Model | Cost | Verdict |
| --- | --- | --- | --- |
| **Supabase Auth** | Postgres + RLS, self-hostable | generous free tier | Best fit |
| **Clerk** | SaaS, prebuilt UI | free tier, paid above | Fastest DX |
| **Auth.js** | library, not a service | free | only if we stay in-stack |

### Why not roll our own
We would be reimplementing password hashing, email verification, rate limiting,
brute-force lockout, session rotation and account recovery. Every one is a
security liability. This is exactly the class of thing to buy rather than build.

**Compliance note that must survive this change:** adding accounts does NOT
change our safety posture. Safety information must never be gated behind a login
or a paid tier. See `04-safety-content.md`.

## Forums and community

| Option | Licence | Self-host | Verdict |
| --- | --- | --- | --- |
| **Flarum** | MIT | yes (PHP + MySQL) | Best technical fit; 16.4k stars |
| **Discourse** | GPL-2.0 | yes (Ruby + Postgres) | Powerful, heavy ops |
| **NodeBB** | GPL-3.0 | yes (Node) | Fits our stack, more setup |
| **GitHub Discussions** | free tier | no | Zero-ops fallback |
| **A subreddit** | free | no | Drive traffic; do not build on it |

### Recommendation: Flarum, but NOT now
Flarum is the right technical answer - MIT, self-hostable, lightweight. But it
needs PHP and MySQL, and our stack today is npm-workspaces, a static site, and
Cloudflare Pages/D1. Adding a PHP runtime is a real deployment change, not a
weekend task.

**Sequencing:** launch accounts first, community later, and only against genuine
demand. An empty forum is worse than no forum. Use GitHub Discussions meanwhile.

## Data visualisation and UI

| Need | Recommendation | Licence |
| --- | --- | --- |
| Charts and sparklines | Chart.js | MIT |
| Rich interactive charts | Apache ECharts | Apache-2.0 |
| Data tables | TanStack Table | MIT |
| Icons | Lucide | ISC |
| Markdown rendering | marked or unified | MIT |

Lucide over a heavy icon font: it matches the restrained tone and is
tree-shakeable. Both charting options are CSP-friendly, which matters because
our policy is hash-based and strict.

## Ballistics cross-checks

- **js-ballistics** (ISC) - independent implementation
- **pykonal / py_ballistics** - independent implementation
- **Open Ballistic Solver** - licence UNVERIFIED; check before use

These belong in the **cross-check** tier of our provenance model, never as
primary sources. Promoting one to primary would make our oracle circular - the
exact failure mode `docs/audit/` keeps finding.

## Licensing discipline for this repo

Everything adopted gets recorded with licence and version in a dependency
register. Our `provenance` system already does this for physical constants; it
should do the same for code. A licence we cannot state is a licence we do not
have the right to use.