#!/usr/bin/env node
// normalise-line-endings.mjs <dir-or-file> [...]
//
// WHY
//
// The editor tool writes CRLF on this Windows box, and `.gitattributes` declares
// `* text=auto eol=lf`. Git normalises on COMMIT, so the repository stays correct, but
// docs:check reads the WORKING TREE and fails on every file written that way.
//
// This hit the 15 recovered mail files earlier and then the five role files. Rather
// than fix them by hand each time, this normalises any path in place: BOM stripped,
// CRLF collapsed to LF, done at the byte level so no character can shift.
//
// Usage: node scripts/tools/normalise-line-endings.mjs tasking/roles scripts/gates
//
// Reports what it changed. Idempotent.

import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const TEXT = new Set(['.md', '.mjs', '.js', '.ts', '.json', '.csv', '.html', '.css', '.yml', '.yaml']);

function walk(p, out = []) {
  const abs = resolve(root, p);
  let s;
  try {
    s = statSync(abs);
  } catch {
    return out;
  }
  if (s.isDirectory()) {
    for (const e of readdirSync(abs)) {
      if (e === 'node_modules' || e === '.git' || e === 'dist') continue;
      walk(join(abs, e), out);
    }
  } else {
    const ext = abs.slice(abs.lastIndexOf('.'));
    if (TEXT.has(ext)) out.push(abs);
  }
  return out;
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.log('usage: normalise-line-endings.mjs <path> [...]');
  process.exit(0);
}

let fixed = 0;
let checked = 0;

for (const t of targets) {
  for (const f of walk(t)) {
    checked += 1;
    const b = readFileSync(f);
    let start = 0;
    if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) start = 3;

    let hasCrlf = false;
    for (let i = 0; i < b.length - 1; i += 1) {
      if (b[i] === 0x0d && b[i + 1] === 0x0a) {
        hasCrlf = true;
        break;
      }
    }
    if (start === 0 && !hasCrlf) continue;

    const body = b.slice(start).toString('utf8').replace(/\r\n/g, '\n');
    writeFileSync(f, body, 'utf8');
    fixed += 1;
    console.log(`  fixed: ${f.replace(`${root}\\`, '').replace(root, '.')}`);
  }
}

console.log(`normalise: ${fixed} of ${checked} file(s) changed`);