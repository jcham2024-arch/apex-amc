/**
 * Tests for the website's safe-DOM helpers.
 *
 * `safeUrl` is the security boundary: it is the only thing standing between a
 * retailer URL from a CSV or a database and `javascript:` execution in the
 * visitor's browser. It had no tests, which is why it is the first thing
 * covered here.
 *
 * Run with: `npm run test:website`
 *
 * Deliberately dependency-free. `safeUrl` only needs a `URL` parser and a
 * `window.location.origin` to resolve against, so it is tested directly rather
 * than through a DOM emulator - installing jsdom for four pure functions would
 * add a large dev dependency and a second resolution of the DOM APIs to keep
 * in sync.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { safeUrl } from '../src/dom.js';

// `safeUrl` resolves relative URLs against `window.location.origin`. Provide the
// one global it touches, rather than a whole DOM.
globalThis.window = { location: { origin: 'https://apex-amc.com' } };

test('safeUrl accepts ordinary web URLs', () => {
  assert.equal(safeUrl('https://example.com/a'), 'https://example.com/a');
  assert.equal(safeUrl('http://example.com/b?c=1'), 'http://example.com/b?c=1');
  assert.equal(safeUrl('https://example.com:8443/d#e'), 'https://example.com:8443/d#e');
});

test('safeUrl rejects javascript: URLs', () => {
  // The payload below is the reason this function exists. It must never reach
  // an href.
  assert.equal(safeUrl('javascript:alert(1)'), null);
  assert.equal(safeUrl('JavaScript:alert(1)'), null);
  assert.equal(safeUrl('  javascript:alert(1)'), null);
});

test('safeUrl rejects data: and vbscript: URLs', () => {
  assert.equal(safeUrl('data:text/html;base64,PHNjcmlwdD4='), null);
  assert.equal(safeUrl('vbscript:msgbox(1)'), null);
});

test('safeUrl rejects other schemes', () => {
  assert.equal(safeUrl('file:///etc/passwd'), null);
  assert.equal(safeUrl('blob:https://example.com/x'), null);
});

test('safeUrl resolves a relative URL against the page origin', () => {
  assert.equal(safeUrl('/retailers'), 'https://apex-amc.com/retailers');
  assert.equal(safeUrl('about'), 'https://apex-amc.com/about');
});

test('safeUrl rejects non-strings instead of coercing them', () => {
  // Coercing here would mean safeUrl({toString(){return 'javascript:alert(1)'}})
  // returns a usable URL. Returning null is the safe failure.
  for (const bad of [null, undefined, 42, {}, [], true]) {
    assert.equal(safeUrl(bad), null, `expected null for ${JSON.stringify(bad) ?? typeof bad}`);
  }
});

test('safeUrl returns null for an unparseable URL', () => {
  assert.equal(safeUrl('http://'), null);
});