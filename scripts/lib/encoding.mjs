// Repair text that was UTF-8 encoded, then decoded as cp1252 and re-saved as
// UTF-8 - the classic mojibake, where an em dash (U+2014, bytes E2 80 94) turns
// into three glyphs: a-circumflex, euro sign, and a right double quote.
//
// NOTE: this file deliberately does NOT contain that artefact as a literal,
// even in a comment. A literal would make `tmp/scan.mjs` report this module as
// damaged forever. It is written here as a code-point sequence instead.
//
// WHY THIS IS NOT A BLANKET RE-DECODE
// ------------------------------------
// `Buffer.from(text, 'latin1').toString('utf8')` is the usual one-liner and it
// is wrong here for two reasons:
//
//   1. Node's 'latin1' is ISO-8859-1, which has NO mapping for U+20AC (€) or
//      U+201D ("). It truncates them, and the result contains replacement
//      characters. cp1252 maps 0x80-0x9F to those printable glyphs, which is
//      exactly what a mis-decoding produces.
//   2. The file may be MIXED - damaged sequences alongside correct characters
//      (this repo's README is: 86 damaged triples plus 5 genuine em-dashes).
//      Re-decoding the whole file corrupts the correct parts.
//
// So this module reverses only the byte sequences that are actually damaged,
// and leaves every other character byte-identical. That makes it safe on mixed
// input and safe to run twice.

// cp1252 differs from ISO-8859-1 only in 0x80-0x9F. This is the printable
// glyph each byte decodes to, which is what the mojibake is made of.
//
// The five C1 slots (0x81, 0x8D, 0x8F, 0x90, 0x9D) are UNASSIGNED in cp1252
// proper, but they are included here as the C1 control characters themselves,
// because that is what a real mis-decode produces. This matters: the right
// double quote U+201D encodes as E2 80 9D, so its mojibake is "â€" followed by
// an invisible U+009D. Leave these out and smart quotes silently fail to
// repair - which is the single most common mojibake case of all.
const CP1252_HIGH = {
  0x80: '\u20AC', 0x81: '\u0081', 0x82: '\u201A', 0x83: '\u0192',
  0x84: '\u201E', 0x85: '\u2026', 0x86: '\u2020', 0x87: '\u2021',
  0x88: '\u02C6', 0x89: '\u2030', 0x8A: '\u0160', 0x8B: '\u2039',
  0x8C: '\u0152', 0x8D: '\u008D', 0x8E: '\u017D', 0x8F: '\u008F',
  0x90: '\u0090', 0x91: '\u2018', 0x92: '\u2019', 0x93: '\u201C',
  0x94: '\u201D', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02DC', 0x99: '\u2122', 0x9A: '\u0161', 0x9B: '\u203A',
  0x9C: '\u0153', 0x9D: '\u009D', 0x9E: '\u017A', 0x9F: '\u0178',
};

// The same table, inverted: glyph -> byte. Built rather than hand-written so
// the two directions cannot disagree.
const BYTE_OF = new Map();
for (const [byte, glyph] of Object.entries(CP1252_HIGH)) BYTE_OF.set(glyph, Number(byte));

/** Encodes a JS string back to cp1252 bytes. Returns null if a char cannot be represented. */
export function toCp1252(text) {
  const out = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp < 0x80) { out.push(cp); continue; }              // ASCII is identity
    if (cp >= 0xA0 && cp <= 0xFF) { out.push(cp); continue; } // same as latin1
    const b = BYTE_OF.get(ch);
    if (b === undefined) return null;                       // not cp1252
    out.push(b);
  }
  return Buffer.from(out);
}

/**
 * Decodes cp1252 bytes to a JS string. Accepts a Buffer or a binary string,
 * so callers do not have to care which they have - the test fixture and the
 * repair path both hand this different things.
 */
export function fromCp1252(buf) {
  const bytes = typeof buf === 'string' ? Buffer.from(buf, 'latin1') : buf;
  let out = '';
  for (const b of bytes) {
    out += (b >= 0x80 && b <= 0x9f) ? (CP1252_HIGH[b] || String.fromCharCode(b)) : String.fromCharCode(b);
  }
  return out;
}

/**
 * Builds the mojibake lookup: for every character whose UTF-8 encoding is a
 * sequence of 2-3 bytes that all fall in cp1252's "high" range, the three
 * glyphs a cp1252 mis-decode produces. Maps that glyph string back to the
 * character.
 *
 * This is deliberately a FIXED-WIDTH table rather than a greedy scan. A greedy
 * run-maximising repair looks reasonable and is wrong: one character cp1252
 * cannot represent (U+009D, for instance, which is undefined in cp1252) breaks
 * the run, and a naive implementation then abandons the entire line - losing
 * the dozen characters on either side that were perfectly repairable. Fixed
 * triples are immune to that, because each is decided on its own.
 */
function buildTripleTable() {
  const table = new Map();
  for (let b0 = 0; ; b0++) {
    // 2-byte: 110xxxxx 10xxxxxx
    if (b0 >= 0xc2 && b0 <= 0xdf) {
      add(table, [b0, null], 1);
    } else if (b0 >= 0xe0 && b0 <= 0xef) {
      // 3-byte, excluding surrogates D800-DFFF which are never valid text.
      add(table, [b0, null], 2);
    } else if (b0 > 0xef) {
      break;
    }
  }
  return table;

  function add(t, prefix, need) {
    for (let b1 = 0x80; b1 <= 0xbf; b1++) {
      for (let b2 = (need === 2 ? 0x80 : 0); b2 <= 0xbf; b2++) {
        const bytes = need === 1 ? [prefix[0], b1] : [prefix[0], b1, b2];
        // Every byte must be one cp1252 produces a real glyph for.
        if (!bytes.every((b) => b >= 0x80 && b <= 0x9f ? CP1252_HIGH[b] !== undefined : true)) continue;
        const cp = decodeUtf8Strict(Buffer.from(bytes));
        if (cp === null) continue;
        const glyphs = bytes.map((b) => (b >= 0x80 && b <= 0x9f ? CP1252_HIGH[b] : String.fromCharCode(b))).join('');
        // Only keep it if it is NOT already the correct character, so we never
        // "repair" correct text into itself.
        if (glyphs !== cp) t.set(glyphs, cp);
      }
    }
  }
}

const TRIPLES = buildTripleTable();

/**
 * Repairs mojibake in `text`.
 *
 * Replaces only the exact glyph sequences a cp1252 mis-decode produces, using a
 * precomputed table. Everything else is passed through byte-identical, which is
 * what makes this safe on mixed input: a genuine em-dash in a damaged file is
 * left alone, because U+2014 is not itself a mojibake triple.
 *
 * @param {string} text
 * @returns {{text: string, repaired: number}} repaired = number of sequences changed
 */
export function repairMojibake(text) {
  const widths = [...new Set([...TRIPLES.keys()].map((k) => k.length))].sort((a, b) => b - a);
  let out = '';
  let repaired = 0;
  let i = 0;

  outer:
  while (i < text.length) {
    for (const w of widths) {
      if (i + w > text.length) continue;
      const slice = text.slice(i, i + w);
      const hit = TRIPLES.get(slice);
      if (hit !== undefined) {
        out += hit;
        repaired++;
        i += w;
        continue outer;
      }
    }
    out += text[i];
    i++;
  }

  return { text: out, repaired };
}

/**
 * Strict UTF-8 decode: returns null on ANY invalid sequence, unlike
 * Buffer.toString('utf8') which substitutes U+FFFD and would silently turn
 * corruption into a plausible-looking character.
 */
function decodeUtf8Strict(buf) {
  let out = '';
  let i = 0;
  while (i < buf.length) {
    const b0 = buf[i];
    let cp; let need;
    if (b0 < 0x80) { out += String.fromCharCode(b0); i++; continue; }
    else if ((b0 & 0xe0) === 0xc0) { cp = b0 & 0x1f; need = 1; }
    else if ((b0 & 0xf0) === 0xe0) { cp = b0 & 0x0f; need = 2; }
    else if ((b0 & 0xf8) === 0xf0) { cp = b0 & 0x07; need = 3; }
    else return null;

    if (i + need >= buf.length + 0 && i + need > buf.length - 1) return null;
    for (let k = 1; k <= need; k++) {
      const bk = buf[i + k];
      if (bk === undefined || (bk & 0xc0) !== 0x80) return null;
      cp = (cp << 6) | (bk & 0x3f);
    }
    // Reject overlong encodings and surrogates.
    if (need === 1 && cp < 0x80) return null;
    if (need === 2 && cp < 0x800) return null;
    if (need === 3 && cp < 0x10000) return null;
    if (cp > 0x10ffff) return null;
    if (cp >= 0xd800 && cp <= 0xdfff) return null;
    out += String.fromCodePoint(cp);
    i += need + 1;
  }
  return out;
}
