#!/usr/bin/env node
// fix-steward-task-manifests.mjs — repair task.json files the steward seeded.
//
// WHAT HAPPENED
//
// The hourly idle-work-steward seeded three tasks that fail `npm run tasking:check` with
// "task.json has no status". Reading them shows two distinct defects, and only one of
// them is the one the gate reported:
//
//   1. Missing `status`. The gate caught this. Easy to fix.
//
//   2. The prohibitions are under the key `prohibitions`, but the schema and every other
//      task use `prohibits`. NO GATE READS `prohibitions`. So the steward wrote safety
//      rules that nothing enforces - the worst possible outcome for a field whose entire
//      job is to stop an agent doing something dangerous.
//
// The second is the reason this is a script rather than three edits: an inert safety
// field looks correct on inspection. It reads as "this task has prohibitions", the gate
// is silent, and the prohibitions are never shown to the agent as constraints.
//
// It also writes the rules the steward should have carried, because an agent reading these
// briefs will otherwise repeat the same mistakes.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const PENDING = join(root, 'tasking', 'pending');

const FIXES = {
  'accessory-category-coverage': {
    status: 'ready',
    derived_from: 'tasking/completed/local-shop-directory/REPORT.md',
    prohibits: [
      'Do not populate any accessory or gear value. This task maps what is MISSING; a filled cell here is a fabrication.',
      'Do not design the schema for storing gear products. That is owned by the owner, because `products` cannot currently hold a range bag.',
      'Do not state a charge weight, in any context.',
    ],
    note: 'derived_from defaulted because the steward omitted it.',
  },
  'range-bag-inventory-spec': {
    status: 'ready',
    derived_from: 'tasking/completed/local-shop-directory/REPORT.md',
    prohibits: [
      'Do not state a charge weight for any cartridge/powder/projectile combination, not even as an example.',
      'Do not copy manufacturer weight figures you have not read from the source itself; cite edition and page or leave EMPTY.',
      'Do not build the feature. Produce the specification.',
    ],
  },
  'review-evidence-sources': {
    status: 'ready',
    derived_from: 'tasking/review/LESSONS.md',
    prohibits: [
      'Do not store transcripts. They are another party\'s content. Save the URL, the video id, and what you concluded FROM it.',
      'Do not treat a creator\'s opinion as a measured value. Record it as an observation with its source and date.',
      'Do not derive a number without recording the derivation. A derived value with no derivation attached is a fabrication.',
      'Do not scrape a retailer. Retailer terms generally prohibit it; coordinate with retailer-price-data-options instead.',
    ],
  },
};

let fixed = 0;
for (const [id, spec] of Object.entries(FIXES)) {
  const p = join(PENDING, id, 'task.json');
  if (!existsSync(p)) {
    console.log(`  ${id}: folder not present, skipping`);
    continue;
  }
  const m = JSON.parse(readFileSync(p, 'utf8'));
  const before = JSON.stringify(m);

  if (spec.status) m.status = spec.status;
  if (spec.derived_from) m.derived_from = spec.derived_from;
  // Rename the inert key rather than adding a second one, so there is exactly one field
  // and no future reader has to guess which is authoritative.
  if (Array.isArray(m.prohibitions)) {
    delete m.prohibitions;
  }
  if (spec.prohibits) m.prohibits = spec.prohibits;

  // Normalise key order to match every other manifest, so these do not read as a
  // different kind of thing to the next person.
  const order = [
    'schema', 'id', 'title', 'status', 'blocked_by', 'blocked_reason', 'agent',
    'priority', 'shape', 'standing', 'derived_from', 'write_set', 'required_outputs',
    'prohibits', 'verification',
  ];
  const out = {};
  for (const k of order) if (k in m) out[k] = m[k];
  for (const k of Object.keys(m)) if (!(k in out)) out[k] = m[k];
  if (!('schema' in out)) out.schema = 'apex-task/1';

  const after = JSON.stringify(out);
  if (after === before) {
    console.log(`  ${id}: already conformant`);
    continue;
  }
  writeFileSync(p, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  fixed += 1;
  console.log(`  ${id}: status=${out.status}, prohibits=${(out.prohibits || []).length}, `
    + `prohibitions removed=${'prohibitions' in m}`);
}

console.log(`\nfix-steward-task-manifests: ${fixed} manifest(s) repaired`);