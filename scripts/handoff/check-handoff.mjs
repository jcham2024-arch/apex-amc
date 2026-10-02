// Guards the boundary between the data layer and the main app.
//
// WHAT THIS PROTECTS
// ------------------
// apps/website/index.html is the file Cloudflare actually serves. It is committed
// by hand and is self-contained: it carries its own markup, its own datasets and
// its own logic, and it references nothing under data/.
//
// Nothing used to stand between it and ~15 data scripts. The proof is that
// extract-website.mjs overwrote src/main.js, reverting its XSS hardening, and
// the only reason anyone noticed was that `npm run lint` happened to fail on an
// unrelated import. Meanwhile `npm run website:build` does not run at all
// (vite cannot resolve src/index.html), so no build would ever have noticed
// either. HANDOFF.md has the full account.
//
// THE CHECKS
// ----------
// Each is a Finding: a rule, a severity, and an explanation of the consequence.
// They are classes rather than a switch statement so a new rule is a new file-
// local class with one job, and so a rule can be tested by constructing it
// directly against a fixture string.
//
//   1. Integrity          index.html must match its recorded SHA-256
//   2. SelfContainment   the page must not reference data/ or a local .json/.csv
//   3. RemoteIntegrity   every remote script must carry SRI
//   4. NoRuntimeCompiler cdn.tailwindcss.com executes against the page
//   5. NoInlineHandlers  on*= attributes are forbidden by a nonce-based CSP
//   6. CspPresent         no Content-Security-Policy means no defence in depth
//
// WHY INTEGRITY IS A HASH AND NOT A REVIEW
// ---------------------------------------
// The point of the hash is that a change to the shipped file cannot be a side
// effect of unrelated work. It is a tripwire, not a code review. A reviewer
// reading a diff of index.html would have caught the extract-website.mjs
// incident; an agent changing data at 2am would not.
//
// ---------------------------------------------------------------------------
// ACKNOWLEDGES THE KNOWN FINDINGS, SO `verify` IS NOT RED ON DAY ONE
// ---------------------------------------------------------------------------
// The rules below report three real defects in apps/website/index.html: an
// unpinned cdn.tailwindcss.com, that same script having no SRI, and no
// Content-Security-Policy. They are genuine and worth fixing. But the site is
// hand-committed and has no working build, so nothing can be done about them
// from the data layer - and leaving `npm run verify` red would achieve exactly
// one thing: everyone learns to ignore the exit code.
//
// That is the failure this whole mechanism exists to prevent, introduced by the
// mechanism itself. So the known findings are recorded in
// data/handoff/known-findings.json (by scripts/handoff/handoff-baseline.mjs) and the
// checker is told about them. The result:
//
//   - the three known findings are reported as KNOWN, not as new breakage
//   - ANY fourth finding, or any unapproved change to the app, still FAILS
//
// It is a ratchet. It can shrink; it cannot be used to wave through something
// new. A missing baseline file means "nothing is known", so every finding is
// reported as new - the safe direction in which to fail.
//
// WHY SUPPLY-CHAIN CHECKS FAIL RATHER THAN WARN
// ---------------------------------------------
// A warning that is always present trains people to scroll past it. These are
// real, fixable defects in a file that serves real users, and the fix is a human
// decision recorded through `npm run handoff:accept`. Until then the honest
// signal is red, not yellow.
//
// THE RULES LIVE IN check-handoff-rules.mjs
// -----------------------------------------
// Two consumers need the same rules: this file, which reports them, and
// scripts/handoff/handoff-baseline.mjs, which records the pre-existing ones so they stop
// blocking. An earlier version duplicated them, and the copies disagreed at once
// - the baseline hashed a rule name, the checker hashed rule+message, nothing
// matched, and the ratchet quietly degraded into "always blocks". Three of the
// six defects fixed in the previous pass were this exact shape.
//
// This file is now only the runner: read the artefact, read the recorded state,
// run the shared rules, report. The logic is testable without touching disk.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { readJsonFile } from '../shared/encoding.mjs';
import { builtIndexFile as APP } from '../shared/data.mjs';
import {
  BLOCKER, KNOWN, Finding, Rule, rulesFor,
} from './check-handoff-rules.mjs';

const ROOT = resolve(import.meta.dirname, '..', '..');
const MANIFEST = resolve(ROOT, 'data/handoff/app-manifest.json');
const BASELINE = resolve(ROOT, 'data/handoff/known-findings.json');

const say = (s) => console.log(s);

/**
 * The shipped file must match the SHA-256 in the handoff manifest.
 *
 * This is the tripwire. It cannot tell whether a change was good, only whether
 * one happened - which is the whole point. A change to index.html that nobody
 * recorded is exactly the failure this arrangement exists to prevent, whether it
 * came from a data script overwriting it or from a hand edit that skipped review.
 *
 * It lives here rather than in the shared rules module because it is the one
 * check that is about the *process* rather than the page: it needs the manifest,
 * and a baseline has no business deciding what is approved.
 */
class Integrity extends Rule {
  constructor(manifest) {
    super(
      'app-integrity',
      'The shipped file no longer matches its recorded SHA-256, so it changed '
      + 'without being accepted. Either an unapproved edit reached the deployed '
      + 'artefact, or the data layer wrote into the app. Run '
      + '`npm run handoff:accept` only if the change was intended.',
    );
    this.manifest = manifest;
  }

  /** SHA-256 of the exact bytes on disk, hex, lowercase. */
  static digestOf(bytes) {
    return createHash('sha256').update(bytes).digest('hex');
  }

  check(bytes) {
    if (!this.manifest || typeof this.manifest.sha256 !== 'string') {
      return [
        new Finding({
          rule: this.name,
          severity: 'warning',
          message: `no approved state recorded yet (expected ${MANIFEST.replace(ROOT + '\\', '')})`,
          consequence: this.consequence,
        }),
      ];
    }
    const actual = Integrity.digestOf(bytes);
    return actual === this.manifest.sha256
      ? []
      : [
        this.finding(
          `SHA-256 mismatch\n       expected ${this.manifest.sha256}\n       actual   ${actual}`,
        ),
      ];
  }
}

/** The approved state, or null when there is none yet. */
function readManifest() {
  if (!existsSync(MANIFEST)) return null;
  try {
    return readJsonFile(MANIFEST);
  } catch (err) {
    // A corrupt manifest is reported as a finding rather than thrown, so one
    // unreadable file cannot hide the other checks.
    return { __error: err.message };
  }
}

/**
 * Fingerprints already acknowledged as pre-existing.
 *
 * An absent or unreadable baseline yields an EMPTY set, so every finding blocks.
 * Deliberate: the safe direction in which to fail is "treat everything as new",
 * never "treat everything as known".
 */
function readKnown() {
  if (!existsSync(BASELINE)) return new Set();
  try {
    const b = readJsonFile(BASELINE);
    return new Set((b.known ?? []).map((k) => k.fp));
  } catch {
    return new Set();
  }
}

function main() {
  if (!existsSync(APP)) {
    say(`FAIL protected artefact missing: ${APP.replace(ROOT + '\\', '')}`);
    say('     The main app is the file Cloudflare serves. Its absence is not a');
    say('     data-layer problem and must not be "fixed" by a script writing one.');
    return 1;
  }

  const bytes = readFileSync(APP);
  const html = bytes.toString('utf8');
  const manifest = readManifest();

  // Integrity needs the manifest and the bytes; the content rules need the html.
  const findings = [
    ...new Integrity(manifest).check(bytes),
    ...rulesFor(html),
  ];

  // Acknowledge pre-existing findings AFTER collection, so `known` is a label
  // on a real finding rather than a reason one was never produced.
  const known = readKnown();
  for (const f of findings) f.acknowledgeIfKnown(known);

  // A manifest that exists but cannot be parsed is itself a blocker: silently
  // treating it as "no approved state" would disarm the tripwire.
  if (manifest?.__error) {
    findings.push(
      new Finding({
        rule: 'app-manifest',
        severity: BLOCKER,
        message: `handoff manifest is unreadable: ${manifest.__error}`,
        consequence:
          'An unreadable manifest means the tripwire is not armed. Fix or delete '
          + 'it, then run `npm run handoff:accept`.',
      }),
    );
  }

  const rel = APP.replace(ROOT + '\\', '');
  say('handoff: data layer -> main app');
  say(`  protected artefact  ${rel} (${bytes.length} bytes)`);
  say(
    `  approved state      ${manifest?.sha256 ? manifest.sha256.slice(0, 16) + '...' : 'NOT RECORDED'}`,
  );
  say('');

  const blockers = findings.filter((f) => f.blocks);
  const acknowledged = findings.filter((f) => f.severity === KNOWN);

  if (findings.length === 0) {
    say('  ok   the app is unchanged since it was accepted, self-contained, and');
    say('       carries the supply-chain and CSP defences');
    say('');
    say('handoff verified');
    return 0;
  }

  for (const f of findings) {
    const tag = f.blocks ? 'BLOCK' : f.severity === KNOWN ? 'known' : 'warn';
    say(`  ${tag.padEnd(5)}  ${f.rule}: ${f.message}`);
    say(`        why: ${f.consequence}`);
    say('');
  }

  if (acknowledged.length > 0) {
    say(
      `${acknowledged.length} pre-existing finding(s) recorded in`
      + ' data/handoff/known-findings.json.\n'
      + '        They are real and worth fixing; they no longer fail the build so'
      + ' that a permanently red verify\n        does not teach everyone to ignore'
      + ' the exit code. Any NEW finding still fails it.',
    );
    say('');
  }

  if (blockers.length === 0) {
    say('handoff verified');
    return 0;
  }

  say(
    `${blockers.length} blocker(s). Either the main app is not in a shippable`
    + '\nstate, or an unapproved change reached it. HANDOFF.md explains what each'
    + '\nrule protects and why the data layer may not fix any of them.',
  );
  say('');
  say('handoff FAILED');
  return 1;
}

process.exit(main());
