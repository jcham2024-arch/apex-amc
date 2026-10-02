// `npm run affiliate:status` - where every retailer stands, and what to do next.
//
//   node scripts/data/affiliate-status.mjs
//
// WHAT IT ANSWERS
// ---------------
// "Which affiliate programs are we in, and what is the next thing to do?"
//
// It joins the three places the answer is split across, which is the whole point
// of the view: `affiliate_outreach` (what we did), `sourcing_retailers` (what
// the retailer has), and `manufacturers` (who they are). Any one of them alone
// gives a misleading answer.
//
// THE ROW THAT MATTERS MOST
// -------------------------
// "approved but no store id" - green in every column, and still earning nothing,
// because a link without a tag cannot be attributed. That state is invisible in
// either table alone, which is why the view exists.
//
// Rows with no outreach record are printed as "no outreach yet" rather than
// omitted, so the count of retailers nobody has contacted is always visible. A
// report that only lists what exists hides exactly the backlog it should show.

import { buildDatabase } from '../shared/load-database.mjs';

const { db, problems } = await buildDatabase();

const rows = db
  .prepare(
    // `affiliate_status` is exposed by the view as `recorded_program_status`:
    // the retailer column is one fact, and naming it that way keeps it from
    // being confused with `outreach_status`, which is ours.
    `SELECT retailer_slug, retailer_name, outreach_status, network,
            commission_rate_pct, cookie_window_days, terms_verified_on,
            network_store_id, recorded_program_status, next_step
       FROM affiliate_outreach_status
      ORDER BY
        CASE outreach_status
          WHEN 'approved' THEN 0 WHEN 'applied' THEN 1
          WHEN 'contacted' THEN 2 WHEN 'researched' THEN 3
          WHEN 'rejected' THEN 4 WHEN 'declined_contact' THEN 5
          ELSE 6 END,
        retailer_slug`,
  )
  .all();

// Retailers with no outreach row at all still have to appear, or the backlog
// is invisible. The LEFT JOIN from the retailer side is the honest direction.
const missing = db
  .prepare(
    `SELECT m.slug AS retailer_slug, m.name AS retailer_name
       FROM sourcing_retailers r
       JOIN manufacturers m ON m.id = r.manufacturer_id
       LEFT JOIN affiliate_outreach o ON o.retailer_id = r.id
      WHERE o.id IS NULL
      ORDER BY m.slug`,
  )
  .all();

const w = (s, n) => String(s ?? '').padEnd(n);

console.log('\naffiliate outreach status');
console.log('-'.repeat(78));

if (rows.length === 0 && missing.length === 0) {
  console.log('  no retailers in the sourcing directory yet');
}

for (const r of rows) {
  const rate =
    r.commission_rate_pct === null
      ? 'rate not looked up'
      : `${r.commission_rate_pct}%${r.cookie_window_days ? ` / ${r.cookie_window_days}d` : ''}`;
  console.log(`\n  ${r.retailer_name}  (${r.retailer_slug})`);
  console.log(`    outreach     ${r.outreach_status}`);
  console.log(`    network      ${w(r.network ?? 'unconfirmed', 22)} ${rate}`);
  console.log(`    store id     ${r.network_store_id ?? 'NONE - links will be untagged'}`);
  console.log(`    next         ${r.next_step}`);
  if (r.terms_verified_on) console.log(`    verified on  ${r.terms_verified_on}`);
}

if (missing.length) {
  console.log(`\n${'-'.repeat(78)}`);
  console.log(`  ${missing.length} retailer(s) with no outreach record at all:\n`);
  for (const m of missing) console.log(`    ${w(m.retailer_slug, 18)} ${m.retailer_name}`);
}

// The number that decides whether any of this is worth doing yet.
const approvedNoId = rows.filter(
  (r) => r.outreach_status === 'approved' && !r.network_store_id,
);
const tagging = rows.filter((r) => r.outreach_status === 'approved' && r.network_store_id);

console.log(`\n${'-'.repeat(78)}`);
console.log(`  ${rows.length} tracked, ${missing.length} untracked`);
console.log(`  ${tagging.length} approved AND tagging (earning)`);
console.log(`  ${approvedNoId.length} approved but NOT tagging (earning nothing)`);
if (problems.length) {
  console.log(`\n  ${problems.length} seed problem(s) - see npm run seed:check`);
}
console.log('');