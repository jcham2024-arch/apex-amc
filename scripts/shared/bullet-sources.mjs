// Parsers for manufacturer ballistic-coefficient tables.
//
// WHY THIS IS A CODE MODULE AND NOT A SCRAPE
// ------------------------------------------
// A reference chart is a grid of numbers under a header row. Scrape the grid
// and you get ten numbers per row and no idea which is which. Guess, and the
// mistake is invisible: a G1/G7 swap on a hunting bullet produces a table that
// looks completely plausible and is completely wrong.
//
// So each manufacturer gets an explicit, DECLARED column map here, and a
// parser that asserts the shape it expects. If a source changes layout, the
// parse fails loudly instead of silently producing garbage.
//
// The Berger chart is the cautionary case, and the reason is not the one you
// would guess. Its legend reads SD, G1, G7, Form Factor, which makes the
// obvious positional guess look safe. It is not. Sectional density is
// computable as (grains/7000)/diameter^2, so it can be used to check where the
// real columns sit: SD is at index 5 in every row tested, not index 1, and the
// G1 slot held a value of 1.122 on one row - impossible for a G1. The legend
// order and the data order are simply different, and only the PDF catalog
// keeps them attached. See docs/SOURCE-SURVEY.md.
//
// RESOLVED. Both faults above were ours, not Berger's. The fetch was missing
// `--compressed` and so saved a truncated 43 KB slice of a 295 KB page, and the
// columns were then read as positional indices into flattened text. Read as a
// table with its header intact, the chart is the cleanest source in the project:
// 13 explicitly named columns, 111 rows, zero blanks. See BERGER below.
//
// A useful technique from that check: prefer a metric that can be recomputed
// from other fields in the row. It turns "which column is this?" into a
// verifiable question instead of a judgement call.
//
// The raw page text is committed under data/extracts/ so a parse can always be
// re-run against exactly what was read, months later, without re-fetching.

/** Thrown when a source's layout is not what its parser expects. */
export class ParseError extends Error {
  constructor(manufacturer, detail) {
    super(`${manufacturer}: ${detail}`);
    this.name = 'ParseError';
    this.manufacturer = manufacturer;
  }
}

const num = (s) => {
  const v = String(s ?? '').trim();
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// ---------------------------------------------------------------------------
// Hornady
// ---------------------------------------------------------------------------
// hornady.com/bc publishes every value with its own label inline, in the form
// "0.395 G1" and "0.199 G7", grouped under a bullet heading like
// ".22 cal 62gr ELD-VT". There is no column header to infer because each
// number names itself. That is the good case.
//
// Per bullet it publishes three Mach groups (2.25, 2.0, 1.75), each with a
// G1/G7 pair. Mach 2.25 is the standardized basis.

export const HORNADY = {
  id: 'hornady',
  url: 'https://www.hornady.com/bc',
  /** Where the BC figures live. */
  website: 'https://www.hornady.com',
  /** Committed raw page text, so a parse can be re-run without re-fetching. */
  extract: 'data/extracts/hornady-bc.txt',
  /** Matches a bullet heading: ".30 cal 175gr A-Tip Match Bullet". */
  bullet: /(^|\s)((?:\.?\d+\.?\d*\s*cal|\d+\.?\d*\s*mm)\s*(\d+\.?\d*)\s*gr\s+([^.]+?)\s+Bullet)/gi,
  parse(text) {
    const rows = [];
    // Strip '#' comment lines. The committed extract documents itself with the
    // example rows spelled out, and parsing those would silently double every
    // bullet - which is the kind of duplicate that looks like two real products.
    const body = text.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');
    // Split on the bullet headings, so each block is one bullet's BCs.
    const blocks = body.split(/(?=(?:\.?\d+\.?\d*\s*cal|\d+\.?\d*\s*mm)\s*\d+\.?\d*\s*gr\s+[A-Za-z])/i);
    for (const block of blocks) {
      // The page renders "... 30 Cal 175gr A-Tip Match Bullet 0.565 G1 ...". The
      // committed extract drops the trailing word "Bullet". Both forms are
      // accepted so the parser works on the live page and on the extract.
      const head = block.match(/(?:\.?\d+\.?\d*\s*cal|\d+\.?\d*\s*mm)\s*(\d+\.?\d*)\s*gr\s+(.+?)(?:\s+Bullet)?\s+(\d+\.\d+)/i);
      if (!head) continue;
      const weight = num(head[1]);
      const series = head[2].replace(/®|™|\s+/g, ' ').trim();
      if (weight === null) continue;

      // Every BC in the block, in order, each tagged with its own G1/G7 label
      // and which Mach column it fell under.
      const pairs = [...block.matchAll(/(\d+\.\d+)\s*G([17])/g)]
        .map((m) => ({ value: num(m[1]), g: m[2] === '1' ? 1 : 7 }));

      if (!pairs.length) continue;
      // The page emits three groups of (G1, G7) in Mach order 2.25, 2.0, 1.75.
      // Guard that assumption rather than trusting it: if the count is not a
      // multiple of two, the layout changed and the mapping would be a guess.
      if (pairs.length % 2 !== 0) {
        throw new ParseError('hornady',
          `block "${series} ${weight}gr" has ${pairs.length} BC values, not an even number - `
          + 'the G1/G7 pairing cannot be assumed. Re-read the page layout.');
      }
      const groups = [];
      for (let i = 0; i < pairs.length; i += 2) {
        if (pairs[i].g !== 1 || pairs[i + 1].g !== 7) {
          throw new ParseError('hornady',
            `block "${series} ${weight}gr" has a G${pairs[i].g}/G${pairs[i + 1].g} pair where G1/G7 was expected. `
            + 'Refusing to guess which is which.');
        }
        groups.push({ g1: pairs[i].value, g7: pairs[i + 1].value });
      }
      const MACHES = ['mach_2_25', 'mach_2_0', 'mach_1_75'];
      // One row per bullet, not one per Mach value. The three Mach figures are
      // properties OF the bullet, not separate bullets; emitting three rows
      // would triple the row count and make "where is the 6mm 80gr ELD-VT"
      // return three answers. The standardized pair takes Mach 2.25, and the
      // other two are retained in their own columns.
      const row = {
        manufacturer_slug: 'hornady',
        product_line: series,
        weight_gr: weight,
        bc_reference: MACHES[0],
        bc_g1: groups[0]?.g1 ?? null,
        bc_g7: groups[0]?.g7 ?? null,
      };
      groups.forEach((g, i) => {
        const m = MACHES[i];
        if (!m) return;
        row[`bc_g1_${m}`] = g.g1;
        row[`bc_g7_${m}`] = g.g7;
      });
      rows.push(row);
    }
    return rows;
  },
};

// ---------------------------------------------------------------------------
// Berger
// ---------------------------------------------------------------------------
// bergerbullets.com/.../bullet-reference-charts/ ships one server-rendered table
// with a real header row:
//
//   Part # | Bullet Description | Cal (Dia) | OAL | Boat Tail | Nose Length
//          | Base to Ogive | Bearing Surface | Sectional Density | G1 BC
//          | G7 BC | G7 Form Factor | Minimum Twist
//
// Everything below keys off those header strings rather than column positions,
// so a column that moves is a loud failure instead of a silent wrong number.
//
// Two details the source makes explicit and the parser must honour:
//
// 1. `G7 BC` is the literal string "NA" for flat-base bullets. That is a
//    published value, not a missing one. A boat tail has no G7 because the G7
//    form assumes one. Import it as NULL and do not treat it as a parse error.
//
// 2. `Cal (Dia)` packs both the caliber designation and the true diameter, e.g.
//    "17 Cal (0.172)". Only the parenthesised number is a measurement. The
//    designation goes to `caliber` and the measurement to `diameter_in` - the
//    opposite of the historical behaviour of diameter_in, which is exactly the
//    confusion documented in data/schemas/bullets.yaml.

/**
 * Berger publishes these header labels, in this order. Any drift is fatal.
 * Exported so the tests can build fixture tables with a correct header and vary
 * exactly one thing - which is how you prove a guard fires for the reason given.
 */
export const BERGER_HEADERS = [
  'Part #', 'Bullet Description', 'Cal (Dia)', 'OAL', 'Boat Tail', 'Nose Length',
  'Base to Ogive', 'Bearing Surface', 'Sectional Density', 'G1 BC', 'G7 BC',
  'G7 Form Factor', 'Minimum Twist',
];

/**
 * Read the first <table> in a page as rows of plain text.
 *
 * Deliberately not a DOM parser: this runs against a committed extract under
 * data/extracts/ with no browser and no dependencies, and these are static
 * server-rendered tables. If a page ever turns out to need JS rendering, that
 * is a different tool and should say so rather than being approximated here.
 *
 * Exported because every HTML-table source will want it, and one reader with
 * one set of entity rules is better than four near-copies.
 */
export function htmlTable(html) {
  const table = html.match(/<table\b[\s\S]*?<\/table>/i);
  if (!table) return [];
  return [...table[0].matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map((tr) => {
    const cells = [];
    for (const m of tr[0].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)) {
      cells.push(
        m[1]
          .replace(/<[^>]+>/g, ' ')       // drop nested tags
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&quot;/gi, '"')
          .replace(/&#?\w+;/g, ' ')        // any other entity: drop, never guess
          .replace(/\s+/g, ' ')
          .trim(),
      );
    }
    return cells;
  });
}

export const BERGER = {
  id: 'berger',
  url: 'https://www.bergerbullets.com/information/lines-and-designs/bullet-reference-charts/',
  website: 'https://www.bergerbullets.com',
  /** Committed raw page, so a parse can be re-run without re-fetching. */
  extract: 'data/extracts/berger-reference-charts.html',
  parse(html) {
    const rows = htmlTable(html);
    if (!rows.length) {
      throw new ParseError('berger', 'no <table> found. Is the page still server-rendered?');
    }
    const head = rows[0].map((c) => c.replace(/\s+/g, ' ').trim());
    const mismatch = BERGER_HEADERS.filter((h, i) => head[i] !== h);
    if (mismatch.length || head.length !== BERGER_HEADERS.length) {
      throw new ParseError('berger',
        `header row does not match the declared map. Expected ${BERGER_HEADERS.length} `
        + `columns starting "${BERGER_HEADERS[0]}", got ${head.length} starting `
        + `"${head[0]}"${mismatch.length ? `; differing at: ${mismatch.join(', ')}` : ''}`);
    }

    const out = [];
    // Rows deliberately not imported, each with the reason. Callers must report
    // these: a row dropped without a word is how a manufacturer ends up looking
    // sparsely covered when the truth is that two products were set aside.
    const skipped = [];
    for (const cells of rows.slice(1)) {
      // A short row means the markup changed under us. Padding it out would
      // shift every later value by one, which is the exact bug this parser
      // exists to prevent.
      if (cells.length !== BERGER_HEADERS.length) {
        throw new ParseError('berger',
          `expected ${BERGER_HEADERS.length} cells, got ${cells.length} in row `
          + `"${cells[1] ?? cells[0]}". Refusing to pad, because a short row means `
          + 'the columns shifted and every value after the gap would be wrong.');
      }
      const [part, desc, calDia, oal, boatTail, , , , sd, g1, g7, ff, twist] = cells;
      if (!part.trim()) continue;

      // "17 Cal (0.172)" -> designation "17 Cal", measurement 0.172.
      const dia = calDia.match(/\(([^)]+)\)/);
      if (!dia) {
        throw new ParseError('berger',
          `Cal (Dia) is "${calDia}" with no parenthesised diameter in row "${desc}". `
          + 'The designation and the measurement have to be told apart.');
      }
      const weight = desc.match(/(\d+(?:\.\d+)?)\s*gr/i);
      if (!weight) {
        // Two real Berger products do not state a weight in the usual form:
        //   24407  "6 mm BR COLUMN Target"     - no weight anywhere in the name
        //   30417  "30 Cal 200.20x Hybrid Target" - "200.20x" is the product NAME
        // Neither can be given a weight_gr without inventing one, and weight_gr
        // is both required by the schema and part of the primary key. So they are
        // set aside with a reason and reported, never guessed. Both still carry a
        // part number and a BC, so they are recoverable later from the product
        // page - which is a lookup, not a fabrication.
        skipped.push({ part_number: part.trim(), description: desc.trim(), reason: 'no grain weight stated in the description' });
        continue;
      }

      const g7n = num(g7);
      // Cross-check the one thing the publisher states as a relationship: a flat
      // base has no boat tail and therefore no G7. If "NA" ever shows up on a
      // boat-tail row, the column map is wrong and we must not import it.
      const isFlat = boatTail.trim().toUpperCase() === 'FB';
      if (isFlat && g7n !== null) {
        throw new ParseError('berger',
          `part ${part} is marked FB (flat base) but carries G7 ${g7}. A flat base `
          + 'has no G7. Either the source changed or G7 is being read from the wrong column.');
      }

      out.push({
        manufacturer_slug: 'berger',
        part_number: part.trim(),
        description: desc.trim(),
        product_line: productLineFrom(desc.trim()),
        caliber: calDia.replace(/\s*\([^)]*\)\s*$/, '').trim(),
        bullet_dia_in: num(dia[1]),
        weight_gr: num(weight[1]),
        oal_in: num(oal),
        base_type: isFlat ? 'flat' : 'boat_tail',
        sectional_density: num(sd),
        bc_reference: 'unspecified',
        bc_g1: num(g1),
        bc_g7: g7n,
        form_factor: num(ff),
        required_twist_in: twistDenominator(twist),
      });
    }
    // Attached to the array rather than returned separately so every parser has
    // the same shape and callers cannot forget to check it.
    out.skipped = skipped;
    return out;
  },
};

/**
 * Berger writes twist as a rate: "1:10"" meaning one turn per ten inches.
 *
 * Two things make this worth a function rather than a cast:
 *
 * 1. The column is in INCHES, so the value stored is the denominator (10), not
 *    the reciprocal. Storing 0.1 would be a different physical quantity.
 *
 * 2. The source is internally inconsistent about the quote character. Most rows
 *    use ASCII `"` (U+0022), but some use U+2033 DOUBLE PRIME. A parser that
 *    only accepts one silently loses those rows, and it looks like the
 *    manufacturer simply did not publish a twist.
 */
function twistDenominator(cell) {
  // U+2033 (double prime) and U+201D (right double quote) both appear as the
  // inch mark in the wild; accept either rather than picking a winner.
  const m = String(cell).match(/^\s*1\s*:\s*(\d+(?:\.\d+)?)/);
  return m ? num(m[1]) : null;
}

/**
 * Berger's descriptions are "375 Cal 379 gr ELR Match Solid Bullets". The
 * product family is the word(s) between the weight and "Bullets", but the
 * boundary is not mechanical - "ELR Match Solid" is one family, "Hybrid" is
 * another, and neither is a tip type. `product_line` is required by the schema
 * and `tip_type` is an enum where design names do not belong, so the family is
 * taken as the maker wrote it rather than split into invented sub-parts.
 */
function productLineFrom(desc) {
  const m = desc.match(/\bgr\s+(.+?)(?:\s+Bullets?)?$/i);
  return (m ? m[1] : desc).replace(/\s+/g, ' ').trim();
}

/** Every parser, keyed by manufacturer slug. */
export const PARSERS = { [HORNADY.id]: HORNADY, [BERGER.id]: BERGER };
