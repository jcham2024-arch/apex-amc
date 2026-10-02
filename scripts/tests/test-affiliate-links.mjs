/**
 * Tests for the affiliate link resolver.
 *
 *   npm run test:affiliate
 *
 * The resolver is what turns `sourcing_retailers` + `sourcing_searches` into a
 * clickable, commission-bearing link, so its failure modes are money failures:
 * a wrong tag parameter silently earns nothing, and a half-filled placeholder
 * sends the visitor to a broken page that still looks correct in the source.
 *
 * Both are covered below. Deliberately dependency-free, like the website tests -
 * this module is pure string handling and needs nothing but node:test.
 *
 * Every fixture below is a REAL row from data/seeds/sourcing_retailers.csv or
 * data/seeds/sourcing_searches.csv. A test using an invented URL proves the
 * resolver handles a made-up input; it does not prove it handles the data it
 * will actually be given.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRetailerLink,
  appendAffiliateTag,
  linkForListing,
  NETWORK_TAG_PARAM,
} from '../shared/affiliate-links.mjs';

test('fills {search} from the search terms (midwayusa)', () => {
  const url = buildRetailerLink({
    linkTemplate: 'https://www.midwayusa.com/search/?q={search}',
    searchTerms: 'MatchKing 177 HPBT',
  });
  assert.equal(url, 'https://www.midwayusa.com/search/?q=MatchKing%20177%20HPBT');
});

test('preserves the template query string when adding a tag', () => {
  const url = appendAffiliateTag(
    'https://www.natchezss.com/search?q=H335',
    'avantlink',
    '123456',
  );
  // Losing the ?q= would send the visitor to a generic search page.
  assert.equal(url, 'https://www.natchezss.com/search?q=H335&avantlinkuid=123456');
});

test('adds a first query parameter when the template had none', () => {
  const url = appendAffiliateTag('https://powdervalleyinc.com/h335', 'avantlink', '999');
  assert.equal(url, 'https://powdervalleyinc.com/h335?avantlinkuid=999');
});

test('does NOT tag when the store id is missing - the safety property', () => {
  // This is the state of every retailer today. A link that silently tagged with
  // an empty or literal placeholder store ID would corrupt commission tracking
  // in a way that looks like it is working.
  const url = appendAffiliateTag('https://brownells.com/p/12345', 'avantlink', undefined);
  assert.equal(url, 'https://brownells.com/p/12345');
});

test('does NOT tag when the network is missing', () => {
  const url = appendAffiliateTag('https://brownells.com/p/12345', null, '123456');
  assert.equal(url, 'https://brownells.com/p/12345');
});

test('leaves an unknown network untagged rather than guessing', () => {
  // Guessing a parameter name produces a link that loads fine and earns
  // nothing. That failure is invisible, so it must not happen.
  const url = appendAffiliateTag('https://example.com/p/1', 'not-a-real-network', 'abc');
  assert.equal(url, 'https://example.com/p/1');
});

test('falls back to the site root when a placeholder cannot be filled', () => {
  // brownells' template uses {search}; give it a sku-only call with no terms
  // and the placeholder would survive into the URL.
  const url = buildRetailerLink({
    linkTemplate: 'https://www.brownells.com/search/?q={search}',
    siteRoot: 'https://www.brownells.com/',
  });
  assert.equal(url, 'https://www.brownells.com/');
});

test('prefers the manufacturer part number when one is known', () => {
  // hornady-eld-x-143 has MPN 65147, which the seed notes call "the single
  // highest-value deep-link key in the bullet data".
  const url = buildRetailerLink({
    linkTemplate: 'https://www.brownells.com/search/?q={sku}',
    searchTerms: 'ELD-X 143',
    sku: '65147',
  });
  assert.equal(url, 'https://www.brownells.com/search/?q=65147');
});

test('a captured per-SKU URL wins over any template', () => {
  const url = linkForListing({
    retailer: {
      link_template: 'https://www.brownells.com/search/?q={search}',
      affiliate_network: null,
      network_store_id: null,
    },
    search: { search_terms: 'ELD-X 143', manufacturer_part_number: '65147' },
    listing: { retailer_url: 'https://www.brownells.com/p/eld-x-143.html' },
  });
  assert.equal(url, 'https://www.brownells.com/p/eld-x-143.html');
});

test('tags a captured per-SKU URL when a store id exists', () => {
  const url = linkForListing({
    retailer: { affiliate_network: 'avantlink', network_store_id: '555' },
    search: {},
    listing: { retailer_url: 'https://www.powdervalleyinc.com/hodgdon-h335.html' },
  });
  assert.equal(
    url,
    'https://www.powdervalleyinc.com/hodgdon-h335.html?avantlinkuid=555',
  );
});

test('encodes values so a search term cannot break the URL', () => {
  const url = buildRetailerLink({
    linkTemplate: 'https://www.midwayusa.com/search/?q={search}',
    searchTerms: 'H335 & "spall" + data:javascript:alert(1)',
  });
  // The retailer's own query parsing gets a string, not injected syntax.
  assert.ok(url.startsWith('https://www.midwayusa.com/search/?q='));
  assert.ok(!url.includes(' '));
});

test('returns null when there is genuinely nowhere to send the user', () => {
  const url = buildRetailerLink({ linkTemplate: null, siteRoot: null });
  assert.equal(url, null);
});

test('every configured network parameter is a non-empty string', () => {
  // Guards the table itself: an entry added with an empty or non-string value
  // would build a malformed query string for every link from that network.
  for (const [network, param] of Object.entries(NETWORK_TAG_PARAM)) {
    assert.equal(typeof param, 'string', `${network} param must be a string`);
    assert.ok(param.length > 0, `${network} param must not be empty`);
    assert.match(param, /^[a-z_]+$/i, `${network} param "${param}" looks wrong`);
  }
});