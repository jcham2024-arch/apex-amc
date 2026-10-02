# 02 — Licence terms as published

Task `cartridge-licence-reconciliation`. What the published terms say, and where
they are ambiguous. **This is not legal advice.** It records text and locations so
a lawyer or CIP can be asked a precise question.

Every quote below was retrieved and verified by me on **2026-10-02**, not taken on
trust from the earlier task.

---

## 1. The notice, verbatim

Recovered from a CIP TDCC per-cartridge sheet, `tab-i/7-62-x-39-en.pdf`:

> "Reproduction forbidden as well as in the form of extracts without approval of
> C.I.P."

The sheet also references `Appendix CR 1` for proof-barrel dimensions and
tolerances immediately before the notice.

## 2. Where the notice does and does not appear

I downloaded 11 sheets from the `tdcc_public` index and classified each by whether
its text layer could be read at all.

| Result | Count | Sheets |
|---|---|---|
| **Notice present** | 6 | `5-45-x-39`, `6-x-47-atzl`, `408-chey-tac`, `416-a-tec`, `450-rigby`, `50-browning` |
| **Undetermined** (no recoverable text layer) | 5 | `416-barrett-250313`, `416-rigby-210225`, `45-blaser-220214`, `458-socom-210827`, `666t-220314` |
| **Text layer present, no notice** | **0** | — |

**The important line is the third one: zero.** No sheet I could read *lacked* the
notice. The 5 undetermined sheets are unreadable, not permissive — and reporting
"no notice found" on an unreadable sheet would be a false clearance, which is the
same error T4 and I both made in different forms.

Sample of 11 sheets, not a census of all 91 EN sheets. It is sufficient to
establish the terms on which CIP publishes; it is not a per-sheet legal audit.

## 3. The footer, on both CIP sites

> "© C.I.P - All rights reserved"

Present on `bobp.cip-bobp.org/en/tdcc_public` and on
`cip-bobp.org/index.php/en/tdcc`. **Neither page carries the per-sheet
reproduction notice.** The index page publishes a browsable table of calibres with
`PT max` pressure figures and no reproduction restriction at all.

That asymmetry is itself informative, and it is the strongest evidence for the
restrictive reading: **CIP permits unrestricted browsing and tabular listing of
pressure maxima, and reserves reproduction in extracts.** Read together with §1,
the plain reading is that *viewing and indexing are permitted; extracting
dimensions into your own published dataset is not.*

## 4. Where the terms are genuinely ambiguous

Four points I cannot resolve, and am not going to guess:

1. **What counts as an "extract"?** The phrase is undefined. Transcribing one
   dimension from one sheet is plainly covered. Transcribing 229 rows across 91
   sheets is plainly covered. Whether a *single* fact, cited to its sheet, is an
   "extract" is not stated. The conservative reading treats citation as the safe
   side.
2. **Does internal-only use count?** "Reproduction" is not defined as
   publication-only. Using the values in a private analysis file may still be
   reproduction. Not stated either way.
3. **Is there any non-commercial or research exception?** None appears on the
   sheets or the site. Unknown whether one exists off-page.
4. **Which document governs?** The Z299 Standards are proprietary and were not
   obtained, so I cannot say whether their terms differ from the free sheets'.

## 5. What I did NOT do

- **No CIP dimensional value is transcribed anywhere in this task's outputs.** The
  deliverable is permission, not data. The one verbatim CIP sentence quoted here is
  the licence notice itself, quoted to establish the licence position.
- **No legal conclusion is drawn.** Nothing above says "this is lawful" or "this
  is unlawful". It records what is published and what is unclear.

## 6. The precise question to put to CIP

If someone wants to pursue permission, this is the question that would resolve it —
drafted so it cannot be answered ambiguously:

> We wish to transcribe dimensional values (case length, head diameter, rim
> diameter, maximum COL) from the CIP TDCC per-cartridge sheets into a
> non-commercial, publicly accessible reference database, each row citing the
> source sheet, URL and revision date. We will not reproduce CIP drawings,
> tolerances as a normative standard, or the TDCC tables themselves.
>
> 1. Does this constitute reproduction "in the form of extracts" under the notice
>    on the sheets?
> 2. If so, is written approval available, and is there a fee or licence category
>    for non-commercial reference use?
> 3. Is citation of a value to its source sheet, without reproducing the sheet
>    layout or its tolerance tables, treated as reproduction?

Question 3 is the one that decides whether a citation-layer is viable, which is the
cheapest possible outcome. It should be asked first.

## 7. SAAMI, for contrast

`saami.org/technical-information/cartridge-chamber-drawings/` publishes free
downloads with no reproduction notice found on the page, and names 17 designs
(11 new, 6 revisions). **3 of our 229** are on it: `6.5 Grendel`, `44-40`,
`44 Rem Mag`. Two of those three are *revisions*, i.e. dimensional corrections not
yet folded into the published standard — exactly the case
`data/seeds/opensource_resources.csv` warns can silently invalidate a held figure.

The SAAMI free page is **narrower than "SAAMI free drawings" suggests**: it covers
what is *new*, not the common calibres, which live in the paid Z299 Standards.