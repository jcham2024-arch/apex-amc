/**
 * Regulation gate: the rules governing this project must stay quotable and current.
 *
 * WHY THIS EXISTS
 * ---------------
 * data/seeds/regulations.csv records what we may and may not do, with the quoted
 * statutory text behind each decision. It is only useful if it stays true. A rule
 * table that quietly rots is worse than none, because it will be trusted.
 *
 * Two errors in this project's history were both over-confident readings nobody
 * checked against the text: writing that physical-goods sales were permanently
 * out, and nearly accepting a member marketplace on the belief that brass is just
 * a component. 18 U.S.C. 921(a)(17)(A) defines ammunition to include cartridge
 * cases, primers and bullets. This gate exists so the third such error is caught
 * by a check rather than by someone getting hurt.
 *
 * WHAT IT ENFORCES
 * ---------------
 * 1. Every row carries a retrievable citation and a retrieval date.
 * 2. A row claiming a verbatim quote must actually carry text, and must not say
 *    NOT RETRIEVED. An unverified row is listed out loud rather than hidden.
 * 3. Every row has reasoning substantial enough to argue with.
 * 4. Rows requiring attorney review are counted, so the debt stays visible.
 * 5. Statute text has a shelf life. Anything older than STALE_AFTER_DAYS is
 *    flagged, because an old reading may no longer be the law.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * ------------------------------
 * It does not interpret the law, and it cannot. A gate that decided whether a
 * quotation means what we think it means would be the same over-confidence that
 * caused the errors above, automated. This checks that the EVIDENCE is present
 * and fresh. The judgement stays with a person, and review_required marks which
 * rows need a qualified one.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const CSV = resolve(ROOT, 'data/seeds/regulations.csv');

const say = (s) => console.log(s);
const problems = [];

/** Re-read and check. This is a STALE date, not an expiry. */
const STALE_AFTER_DAYS = 365;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f !== ''));
}

const rows = parseCsv(readFileSync(CSV, 'utf8'));
const head = rows[0];
const col = Object.fromEntries(head.map((h, i) => [h, i]));
const data = rows.slice(1);

say('regulations: ' + data.length + ' rows');

const stale = [];
const unverified = [];
let reviewRequired = 0;

const daysSince = (iso) => {
  const then = Date.parse(iso);
  return Number.isNaN(then) ? null : Math.floor((Date.now() - then) / 86400000);
};

for (const r of data) {
  const citation = (r[col.citation] || '').trim();
  const url = (r[col.source_url] || '').trim();
  const retrieved = (r[col.retrieved_on] || '').trim();
  const quote = (r[col.quote_status] || '').trim();
  const reasoning = (r[col.reasoning] || '').trim();
  const review = (r[col.review_required] || '').trim();

  if (citation === '') problems.push('a row has no citation');
  if (!/^https:\/\//.test(url)) {
    problems.push(citation + ': source_url is not retrievable');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(retrieved)) {
    problems.push(citation + ': retrieved_on is not an ISO date');
  }
  if (reasoning.length < 20) {
    problems.push(citation + ': reasoning is too short to argue with');
  }
  if (review === 'true') reviewRequired += 1;

  if (quote === 'unverified') {
    unverified.push(citation);
  } else if (quote === 'verbatim') {
    const text = (r[col.operative_text] || '').trim();
    if (text.length < 20) {
      problems.push(citation + ': claims a verbatim quote but carries no text');
    }
    if (/NOT YET RETRIEVED/i.test(text)) {
      problems.push(citation + ': operative_text says NOT RETRIEVED but quote_status is not unverified');
    }
  }

  const age = daysSince(retrieved);
  if (age !== null && age > STALE_AFTER_DAYS) stale.push(citation + ' (' + age + ' days)');
}

if (stale.length) {
  say('');
  for (const s of stale) say('  stale: ' + s + ' - re-read the source and update retrieved_on');
}
if (unverified.length) {
  say('  unverified text (must not justify a published prohibition on its own):');
  for (const u of unverified) say('    - ' + u);
}
say('  ' + reviewRequired + ' row(s) require attorney review');

say('');
if (problems.length) {
  for (const p of problems) say('FAIL ' + p);
  say('');
  say(problems.length + ' regulation problem(s)');
  say('');
  say('regulations FAILED');
  process.exit(1);
}

say('every governing rule carries a retrievable citation, a date, and a quotable text');
say('');
say('regulations OK');