# Dependabot — automated dependency updates

**What it is:** a service built into GitHub. You add a YAML file to
`.github/dependabot.yml` and GitHub opens pull requests when a dependency has a
new release — or a security advisory. You never have to remember to check.

## Why this matters here

This repository is exactly the case where it earns its keep:

- **13 verify stages** that nobody would otherwise remember to run after an
  upgrade. Dependabot's PRs are gated on `verify`, so a bad bump cannot merge.
- **TypeScript 7** (see `docs/REVIEW.md` P0-2) is blocked on
  `typescript-eslint` support. Dependabot will open the PR the moment that
  lands, so the upgrade stops being a manual chore.
- **Expo packages must move via `expo install`**, which respects the SDK pin.
  Dependabot does not know that, so those groups are configured to notify
  rather than auto-update. See the comments in the file.
- **Zero production dependencies** at the root. This is the part worth
  protecting, and dependabot groups exist to make the pull requests readable.

## Setup

1. Push the repository to GitHub (it is currently local-only).
2. `.github/dependabot.yml` is already written — it will take effect on push.
3. Optionally enable GitHub's **secret scanning** and **code scanning**
   (Settings → Code security). Both are free on public repos.

## ⚠ Do not run bare `npm update`

Learned the hard way on 1 Oct 2026. `npm update` downgraded
`node_modules/uuid` from **11.1.1 to 7.0.3**, reintroducing **11 moderate
vulnerabilities** that had been absent — the audit went from *0 found* to
*11 moderate* in one command.

Why: `npm update` re-resolves the whole tree and will move a transitive
dependency **backwards** to satisfy a peer's range. It is not "move everything
forward".

**Use Dependabot instead.** It reads the declared ranges, opens a PR per bump,
and CI shows the audit result before anything merges. That is the entire reason
it is configured.

If you must update locally:

```bash
npm outdated                 # look first
npm update <package>@<range> # one package, explicit range
npm audit --omit=dev         # prove you did not regress the tree
```

If the audit count ever jumps from 0, **stop and check the lockfile diff** before
committing. Recovering meant `git checkout package-lock.json && npm install
--package-lock-only && npm ci`.

## What it will and will not do

| Will | Will not |
|---|---|
| Open a PR for a new version | Merge anything — every PR waits for you |
| Open a PR immediately for a security advisory | Understand Expo's SDK pinning |
| Group related bumps into one readable PR | Fix code that must change to accept a bump |

That last row is the important one. Dependabot opens the door; `verify` decides.