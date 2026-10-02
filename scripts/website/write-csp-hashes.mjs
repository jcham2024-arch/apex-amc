#!/usr/bin/env node
// Rewrites the CSP hashes in dist/_headers from the built dist/index.html.
//
//   npm run website:build && npm run website:csp
//
// WHY THIS EXISTS
// ---------------
// The policy in _headers authorises the inline <script> and <style> blocks by
// SHA-256 hash. Those hashes are a property of the BUILD, not of the source: the
// bundler rewrites module boundaries and Tailwind class names, so the same
// source produces different bytes. Writing the hash by hand works right up to
// the moment any of them changes, and then the page goes blank with no build
// error - the single worst failure mode available.
//
// This was not hypothetical. On 1 Oct 2026 _headers shipped
// `script-src 'nonce-{RANDOM}'`, which no Cloudflare Pages feature substitutes.
// Chrome discarded it as an invalid source and blocked the inline script; the
// page rendered unstyled with roughly a third of its content missing. The
// scanner passed the whole time, because the header it read did contain a CSP
// directive and no `unsafe-*` keyword. `check-website-build.mjs` now recomputes
// these hashes and fails when they disagree.
//
// Deterministic by construction: same input bytes, same hash, no clock, no
// randomness. Re-running it on an unchanged build is a no-op, which is what
// makes it safe to call unconditionally.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { root } from '../shared/data.mjs';

const DIST = resolve(root, 'apps/website/dist');
const HTML = resolve(DIST, 'index.html');
const HEADERS = resolve(DIST, '_headers');

if (!existsSync(HTML)) {
  console.error('dist/index.html is missing. Run `npm run website:build` first.');
  process.exit(1);
}

const html = readFileSync(HTML, 'utf8');
const sha256 = (content) =>
  createHash('sha256').update(content, 'utf8').digest('base64');

/**
 * The inline blocks the policy must authorise.
 *
 * A <script src> or <link href> is not inline and needs no hash - it is a URL,
 * covered by the host allowlist. Only bodies count here.
 */
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)];

if (scripts.length === 0) {
  console.error('no inline <script> found in dist/index.html - refusing to guess.');
  process.exit(1);
}

const scriptHashes = scripts.map((m) => `'sha256-${sha256(m[1])}'`);
const styleHashes = styles.map((m) => `'sha256-${sha256(m[1])}'`);

if (!existsSync(HEADERS)) {
  console.error('dist/_headers is missing; cannot update the policy.');
  process.exit(1);
}

const before = readFileSync(HEADERS, 'utf8');

// Only directive lines are rewritten. The comment block above them discusses the
// keywords this policy forbids, and a whole-file replace would either corrupt
// that explanation or fail to match it.
const lines = before.split('\n');
let sawScript = false;
let sawStyle = false;

const after = lines
  .map((line) => {
    if (/^\s*script-src\s/.test(line)) {
      sawScript = true;
      // 'strict-dynamic' is a policy decision, not a build artefact, so it is
      // re-appended rather than regenerated.
      return `    script-src ${scriptHashes.join(' ')} 'strict-dynamic';`;
    }
    if (/^\s*style-src\s/.test(line)) {
      sawStyle = true;
      // fonts.googleapis.com serves the Inter stylesheet the page links to.
      return `    style-src ${styleHashes.join(' ')} https://cdnjs.cloudflare.com https://fonts.googleapis.com;`;
    }
    return line;
  })
  .join('\n');

if (!sawScript || !sawStyle) {
  console.error('no script-src / style-src directive found in dist/_headers.');
  process.exit(1);
}

if (after === before) {
  console.log('csp up to date, nothing rewritten');
  console.log(`  script-src ${scriptHashes.join(' ')}`);
  console.log(`  style-src  ${styleHashes.join(' ')}`);
  process.exit(0);
}

writeFileSync(HEADERS, after, 'utf8');
console.log('csp hashes written to dist/_headers');
console.log(`  script-src ${scriptHashes.join(' ')}`);
console.log(`  style-src  ${styleHashes.join(' ')}`);