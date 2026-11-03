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
const lines = before.split('\n');

// Only the CSP line is rewritten. The comment block above it explains what this
// policy forbids, and a whole-file replace would either corrupt that
// explanation or fail to match it.
//
// ONE LINE, ALWAYS.
//
// The policy is emitted as a single `Content-Security-Policy: ...` line rather
// than one directive per line. That is not a style choice - it is what makes
// Cloudflare apply the header at all.
//
// This generator previously emitted each directive on its own indented line,
// mirroring how a human reads a CSP. Pages parses `_headers` as literal
// `[name]: [value]` lines and has no concept of a folded value, so a
// `Content-Security-Policy:` with nothing after the colon, followed by
// continuation lines, was discarded. The policy shipped to production on
// 2 Oct 2026 and the site served with no CSP whatsoever: HTTP 200, correct
// HTML, zero protection, and no error anywhere. Confirmed on a live preview
// deployment - folded produced no header, single-line produced the header.
//
// `check-website-build.mjs` now fails the build if this value ever spans more
// than one line, so the regression cannot come back quietly.
const cspLine = /^(\s*)Content-Security-Policy\s*:(.*)$/;

const after = lines
  .map((line) => {
    const match = cspLine.exec(line);
    if (!match) return line;

    const indent = match[1];
    const rest = match[2].trim();

    // Split the existing value on ';' and drop the two hashes this script owns,
    // which are then re-inserted in the right directives. Everything else the
    // author wrote is preserved in order, so a hand-added directive is not
    // silently deleted by a rebuild.
    //
    // The canonical directive list is emitted wholesale below, so any directive
    // that IS on that list has to be dropped here first. Keeping them would
    // append a second copy on every run: the file grew on each invocation and
    // was no longer idempotent, which is the property that makes re-running the
    // generator safe to call unconditionally. Verified by running it twice and
    // comparing SHA-256.
    const CANONICAL = [
      'default-src',
      'script-src',
      'style-src',
      'font-src',
      'img-src',
      'connect-src',
      'base-uri',
      'form-action',
      'frame-ancestors',
      'object-src',
      'upgrade-insecure-requests',
    ];

    const kept = rest
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .filter((d) => !CANONICAL.some((name) => new RegExp(`^${name}\\b`).test(d)));

    const directives = [
      `default-src 'self'`,
      `script-src ${scriptHashes.join(' ')} 'strict-dynamic'`,
      // fonts.googleapis.com serves the Inter stylesheet the page links to.
      `style-src ${styleHashes.join(' ')} https://cdnjs.cloudflare.com https://fonts.googleapis.com`,
      `font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com`,
      `img-src 'self' data: https://cdnjs.cloudflare.com`,
      `connect-src 'self'`,
      `base-uri 'none'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `object-src 'none'`,
      `upgrade-insecure-requests`,
      ...kept,
    ];

    return `${indent}Content-Security-Policy: ${directives.join('; ')}`;
  })
  .join('\n');

const cspLines = after.split('\n').filter((l) => cspLine.test(l));
if (cspLines.length !== 1) {
  console.error(
    'the policy must occupy exactly one line; found ' + cspLines.length + '.',
  );
  process.exit(1);
}
if (/^\s*Content-Security-Policy\s*:\s*$/.test(cspLines[0])) {
  console.error('Content-Security-Policy has no value on its line.');
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