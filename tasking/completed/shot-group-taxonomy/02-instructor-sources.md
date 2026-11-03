# 02 — Instructor sources

**Task:** `shot-group-taxonomy`. Every source below was retrieved and read in this task; where
retrieval failed, that is recorded rather than glossed.

The brief asks for the **authoritative instructor sources behind this knowledge, not the
reposts of it.** The single most useful result of this task is that the two charts the brief
names by reputation are, between them, a repost and a polemic — and the polemic is by a
named instructor arguing the chart should not be used.

---

## Tier 1 — Professional instructors, named and credentialed

### Patrick Henry — Aegis Academy
- **Role:** instructor and staff author, Aegis Academy (Pala Shooting Range, CA).
- **URL:** https://aegisacademy.com/blogs/test-blog-post/pistol-correction-chart
- **Date:** 23 December 2013.
- **Retrieved:** yes, full text.
- **What he provides:** the vocabulary of named faults (thumbing, heeling, trigger finger
  placement, anticipation, jerking, grip pressure) and their described mechanisms.
- **What he provides that matters more:** an explicit, reasoned argument that **the POI→fault
  mapping should not be used to diagnose an individual shooter.** Direct quotes in
  `01-fault-taxonomy.md` §5. He is the source *against* the feature this research supports.
- **Credentials checkable:** Aegis Academy is a firearms training school; the page is under
  its "Staff Articles". I could not independently verify a certification or a competitive
  record beyond the byline — **that is left blank, not assumed.**

### W.H. Fuller — *Small-bore Target Shooting* (1963)
- **Role:** author; the text is an extract from his 1963 book.
- **URL:** http://rifleman.org.uk/Fuller_group_diagnosis.html
- **Publisher context:** UK Historic Arms Resource Centre, described as "probably one of the
  most comprehensive, carefully considered and researched pieces ever published on the subject."
- **Retrieved:** yes, full text.
- **What he provides:** the most rigorous statement of the **inference problem** — laws of
  chance, certainty vs indeterminacy vs probability, and the explicit statement that similar
  departures can be produced by rifle or ammunition faults rather than shooter faults.
- **Discipline:** **rifle, not handgun.** Recorded because the *epistemology* transfers; the
  pattern→fault mappings do not.
- **Credentials:** named author of a published book. No modern credential; left blank.

## Tier 2 — Industry / organisation training material

### Target Shooting Canada — "Pistol Group Analysis" (© 2003)
- **URL of origin:** https://targetshooting.ca (PDF at `/wp-content/uploads/2020/07/Pistol_Shot_Analysis.pdf`)
- **Date:** copyright 2003, per the document's own footer.
- **Retrieved:** yes — via the Georgia 4-H copy below, text extracted with this repo's own
  `npm run probe:pdf`.
- **What it provides:** the pattern→cause chart the brief describes as the canonical one
  circulated widely.
- **Author:** **not named.** The footer credits only "TargetShooting Canada Copyright - 2003".
  This is a material weakness: the most-copied artifact in this field has no attributable author.
- **Its own caveats, which are load-bearing and usually dropped in reposts:**
  - *"Group analysis allows you to determine what you are doing wrong in your shooting.
    Don't look at this as a negative exercise: this is an opportunity to diagnose a problem."*
  - *"**The following groups assume a right handed, right eye dominant shooter. For
    left-handed shooters, reverse the groups.**"*
  - *"Pay attention to your groups, not individual shots."*
  - *"Target and groupings are not to scale: use as examples for demonstration / educational
    purposes."*
## Tier 3 — Reposts. Corroboration only, never primary.

### Georgia 4-H "Pistol Group Analysis"
- **URL:** https://georgia4h.org/wp-content/uploads/2018/05/grp-analysis.pdf
- **Retrieved:** yes, full text extracted locally.
- **Status:** a **repost** of the Target Shooting Canada document. Its content matches the
  2003 original pattern-for-pattern, including the copyright footer and the dominant-eye
  caveat. **It adds no authority.** The brief names this as "the canonical chart"; on inspection
  the canonical document is the 2003 Target Shooting Canada one, and this is a copy.

### 4-H Shooting Sports — "Pistol Groups Analyzed"
- **URL:** https://4-hshootingsports.org/wp-content/uploads/2025/01/Pistol-Groups-Analyzed.pdf
- **Retrieved:** **failed to extract.** Downloaded (80,351 bytes) but the PDF stores text as
  hex-encoded runs; `probe:pdf` reports `Tj literals: 0`, `hex Tj: 0`, so this repo's probe
  cannot read it. Content unverified — **recorded as unverified, not cited as support.**

### Shooting Illustrated, TheGunZone, American Warrior Society, shooting-performance.com
- **Retrieval failed:** HTTP 404 / HTTP 403 on every attempt. **No content from these was
  used.** Recorded so nobody re-suggests them.

## Tier 3 — Peer-reviewed

### Jones LF, Classé J, Hester MH, Harris KM (1996)
- **Title:** "Association between eye dominance and training for rifle marksmanship:
  a pilot study."
- **Sample:** 308 military recruits, Fort Benning Army Base, Columbus, Georgia.
- **Retrieved:** yes — abstract in full, via the Exa publication record
  (https://exa.ai/library/publication/jxpz55gvvyq). PubMed record 9120204 requires cookies and
  would not render.
- **Findings:** uncrossed dominance scored significantly higher (p = .009); 86.1% of uncrossed
  vs 56.5% of crossed achieved qualification (p = .000).
- **Limits stated in the source:** it is a **pilot study**; it is **rifle**, not handgun; it
  measures **qualification score**, not POI offset direction.

## Tier 4 — Forum and social. Not used.

No forum or social post is cited anywhere in these deliverables. Per the brief these are
"corroboration only, never as a primary source" — and since every claim above is carried by a
named or citable source, no forum claim was needed. **Recorded so the omission is visible
rather than accidental.**

---

## The sourcing problem, stated plainly

**No source in this task supplies a statistic supporting any pattern-position → fault
mapping.** The chart supplies mechanism descriptions and no data; its author is unnamed; and
the one peer-reviewed paper measures something else. This is recorded as a finding in
`01-fault-taxonomy.md` §6 and `REPORT.md`, not smoothed over.