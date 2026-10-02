/**
 * Turns a (search target, retailer) pair into a deep link.
 *
 * ## Why this module exists
 *
 * Commission does not require a price. It requires a click. Everything needed to
 * earn it already exists in `sourcing_retailers` and `sourcing_searches`:
 * `link_template` with `{search}` / `{sku}` placeholders, `affiliate_network`,
 * `network_store_id`, and `manufacturer_part_number` on the search target. What
 * did not exist was the code that joins them, which is why the finder could not
 * produce a link at all.
 *
 * Migration 013 is explicit that it stores "the three facts any tagging scheme
 * needs" and deliberately does "NOT append a tag, resolve a placeholder, or know
 * any network's query-string format into the database". This is that missing
 * piece, kept out of the database on purpose: the tag format is code, and code
 * belongs in code, so every network is one entry here rather than a column.
 *
 * ## The rule that makes this safe to run today
 *
 * A tag is appended ONLY when both `affiliate_network` and `network_store_id`
 * are present. Every retailer currently has `network_store_id = NULL`, so every
 * link produced today is clean and untagged. Filling in a store ID switches that
 * one retailer to tagged links automatically. There is no flag to forget to set
 * and no code path that can tag a link with a placeholder ID, which is the way
 * affiliate links get silently corrupted.
 *
 * ## What this deliberately does NOT do
 *
 * It fetches nothing. No price, no stock, no HTML. Network access is where ToS
 * and price-advertising exposure live; see `docs/AFFILIATE.md` for why price
 * display is a separate, feed-driven problem with its own legal constraints.
 * Keeping this module pure makes it trivially testable and impossible to get
 * wrong from a network standpoint.
 */

/**
 * Query-string key each network uses for the publisher's store ID.
 *
 * ## Provenance — read this before trusting an entry
 *
 * These are the CONVENTIONAL parameter names for each network. They were
 * checked against each network's general linking conventions on 2 Oct 2026, but
 * **not** against each network's own current affiliate-parameter documentation
 * at the specific account level. An earlier version of this comment claimed the
 * values came "from each network's own published affiliate-parameter
 * documentation". That was an overstatement: the names are correct as
 * conventions, but a network can rename a parameter, and some merchants
 * require a different key than the network default.
 *
 * This matters because the failure is silent. A wrong parameter name produces a
 * URL that loads perfectly, looks correct in every log and on every page, and
 * earns nothing. You would not find out from the site - you would find out from
 * a commission report months later.
 *
 * ## The rule that makes it safe anyway
 *
 * A tag is appended only when BOTH `affiliate_network` AND `network_store_id`
 * are present. Every retailer currently has `network_store_id = NULL`, so every
 * link this module produces today is clean and untagged. Nothing here is
 * load-bearing until a real store ID is filled in.
 *
 * **Therefore: confirm the parameter in your network dashboard when you are
 * approved, before the first tagged link goes live.** Most dashboards show a
 * sample link with the exact key. Add it here at that point, and add a test case
 * in `scripts/tests/test-affiliate-links.mjs`.
 *
 * To add a network: confirm the parameter against that network's docs, add the
 * entry, and add a test case.
 */
export const NETWORK_TAG_PARAM = {
  avantlink: 'avantlinkuid',
  impact: 'irclickid',
  flexoffers: 'aovmt',
  partnerize: 'aid',
  cj: 'cjevent',
};

/**
 * Build a deep link for one retailer.
 *
 * @param {object} args
 * @param {string} [args.linkTemplate] Retailer's template. Absent means we only
 *   know the homepage, so `null` is returned and the caller links the site root
 *   rather than pretending to have a product URL.
 * @param {string} [args.searchTerms] Fills `{search}`.
 * @param {string} [args.sku] Fills `{sku}`. Preferred over `{search}` when
 *   present: a manufacturer part number is an exact key, a search string is a
 *   fuzzy one.
 * @param {string} [args.affiliateNetwork]
 * @param {string} [args.networkStoreId]
 * @param {string} [args.siteRoot] Fallback when there is no template.
 * @returns {string|null} The URL, or null when no usable destination exists.
 */
export function buildRetailerLink({
  linkTemplate,
  searchTerms,
  sku,
  affiliateNetwork,
  networkStoreId,
  siteRoot,
} = {}) {
  let url = null;

  if (linkTemplate) {
    const skuTerm = sku ?? '';
    const searchTerm = searchTerms ?? '';
    url = linkTemplate
      .replace(/\{sku\}/g, encodeURIComponent(skuTerm))
      .replace(/\{search\}/g, encodeURIComponent(searchTerm));

    // An unresolved placeholder OR an empty value both mean we cannot build a
    // real search. `{sku}` would reach the retailer as literal text; `?q=` is an
    // empty search that silently returns nothing useful. Both are worse than
    // sending the visitor to the retailer root, which at least lands on a page
    // where they can search themselves.
    if (/\{(sku|search)\}/.test(url) || /[?&](q|search|query|sku|term)=(\?|&|$)/i.test(url)) {
      url = null;
    }
  }

  if (!url && siteRoot) url = siteRoot;
  if (!url) return null;

  return appendAffiliateTag(url, affiliateNetwork, networkStoreId);
}

/**
 * Append a network's publisher tag to an already-built URL.
 *
 * No-ops unless BOTH the network and the store ID are known - the safety
 * property described at the top of this file.
 */
export function appendAffiliateTag(url, affiliateNetwork, networkStoreId) {
  if (!url || !affiliateNetwork || !networkStoreId) return url;

  const param = NETWORK_TAG_PARAM[affiliateNetwork];
  // An unknown network is left untagged rather than guessed at. Add it to
  // NETWORK_TAG_PARAM once its documentation has been read.
  if (!param) return url;

  // Preserve any query string the template already had: retailer search URLs
  // nearly always do, and dropping it loses the search entirely.
  const [base, query = ''] = url.split('?');
  const tag = `${param}=${encodeURIComponent(networkStoreId)}`;
  return query ? `${base}?${query}&${tag}` : `${base}?${tag}`;
}

/**
 * Resolve a listing row from the database into a link.
 *
 * Separate from `buildRetailerLink` so the pure URL logic stays testable without
 * a database - this module takes plain objects throughout.
 */
export function linkForListing({ retailer, search, listing } = {}) {
  // A captured per-SKU URL beats any template: it is the exact product page.
  if (listing?.retailer_url) {
    return appendAffiliateTag(
      listing.retailer_url,
      retailer?.affiliate_network,
      retailer?.network_store_id,
    );
  }

  return buildRetailerLink({
    linkTemplate: retailer?.link_template,
    searchTerms: search?.search_terms,
    sku: listing?.retailer_sku || search?.manufacturer_part_number,
    affiliateNetwork: retailer?.affiliate_network,
    networkStoreId: retailer?.network_store_id,
    siteRoot: retailer?.source_url,
  });
}