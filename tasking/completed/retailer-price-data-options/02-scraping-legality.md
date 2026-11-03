# 02 — Scraping legality

Task `retailer-price-data-options`. **Researched 3 Oct 2026.**

> **This is not legal advice.** It records what published sources say and what the case law
> holds, and marks plainly where the law is unsettled. `.clinerules` §5 rule 1 applies with
> full force: **where the sources do not settle a question, this document leaves it
> unsettled rather than resolving it.**

---

## 1. The strongest evidence, and it is not the law

**I did not fetch any retailer storefront to test whether scraping works.** Per
`prohibits[]`, that action is the thing being evaluated and doing it to find out would
repeat the mistake. I fetched only publishers' own robots.txt — a file whose entire
purpose is to be read by automated clients, so retrieving it is not scraping.

**`https://www.midwayusa.com/robots.txt`, verbatim:**

```
User-agent: *
Disallow: /sendPageToFriend*
Disallow: /charts
Disallow: /content/legacy
Disallow: /429.html
Disallow: /category/*
Disallow: /find*
Disallow: /ProductStatuses*
Disallow: /noresultspage*
Disallow: *-blemished
Disallow: /ltd/product*
Disallow: /s?*
Disallow: /log/*
Disallow: /account*
Disallow: /ordermanagement*
Disallow: /api/*
```

**Read that list against what a price scraper must do.** To get a price you need the
product or category listing: `/category/*` — disallowed. To find it, you search: `/s?*`
and `/find*` — disallowed. To check stock: `/ProductStatuses*` — disallowed. To get it
programmatically: `/api/*` — disallowed.

**Every path a price scraper requires is on this list.** Not "some paths" — the specific
ones. And note `/429.html` and `/ProductStatuses*`: the site has rate-limiting and status
endpoints, i.e. it has already considered automated access.

**This is a statement of the retailer's expressed wishes, and it is more probative than
any general legal analysis.** When a publisher has told you in machine-readable form what
it does not want, that is the finding.

---

## 2. The CFAA — what actually changed, and what did not

### Van Buren v. United States, 593 U.S. 374 (2021)

> **Holding:** "An individual 'exceeds authorized access' when he accesses a computer with
> authorization but then obtains information located in particular areas of the
> computer—such as files, folders, or databases—that are off-limits to him."

6–3, Barrett writing; Thomas and Roberts dissenting.

**What this means for scraping.** Before Van Buren, the government argued an "improper
purpose" could be "exceeds authorized access." **The Court rejected that.** The test is a
**gates-up-or-down** question — access to areas off-limits — not a **motivation**
question.

### hiQ Labs v. LinkedIn (9th Cir., 2019; vacated and remanded)

The Ninth Circuit had held that scraping *publicly available* data did not constitute
"access without authorization." Per the Van Buren summary: *"since hiQ's access to
LinkedIn's data was publicly available, Microsoft could not stop hiQ from collecting it
even at a massive scale beyond the capabilities of a human."*

**Then:** *"The Supreme Court vacated the ruling and instructed the Ninth Circuit to
review the case under the Van Buren decision."*

### The state of the law, stated honestly

| Question | Status |
|---|---|
| Is public web scraping a CFAA violation? | **Not settled at the Supreme Court level.** hiQ's specific holding was vacated. |
| Does Van Buren help a scraper? | **It narrows the CFAA's reach** — on the *gates* test, not on public pages. |
| Does ToS breach alone make scraping a CFAA crime? | **Van Buren cut against this** — the CFAA is not a contract-enforcement statute. |
| Does ToS breach create other liability? | **Possibly — but this is unsettled and I am not opining.** |

**The honest summary: the CFAA risk to a public-page scraper is LOWER after Van Buren
than most people assume, and higher in practice than that suggests, because of the two
things the statute clearly still covers — access to non-public areas, and circumvention of
technical access controls.**

**I am not going to resolve this.** It is contested, it is jurisdiction-specific, and
`.clinerules` §5 rule 1 says leave it blank.

---

## 3. The ToS question the brief specifically asked

> "State plainly whether a retailer can revoke permission for content we link to
> commercially."

**Plainly: yes — the retailer can revoke the permission it grants, for its own content,
and that does not depend on the CFAA.**

The mechanism is not the CFAA at all:

1. **We link to their site commercially.** That is a normal commercial relationship.
2. **They can change or withdraw what they permit.** That is the default state of any
   permission: it is revocable.
3. **Their ToS can prohibit automated access independent of any statute.** Whether
   breaching that contract is actionable against a non-party is jurisdiction-specific and
   **I am not opining on it.**

**But note the asymmetry, because it is the whole answer.** We already depend on these
retailers' permission in a way no legal analysis changes: **if we get on their bad side,
our affiliate relationships die, our links may stop earning, and they can stop serving
us** — or report us to the payment processor holding our money. That is a commercial
risk, and it is sufficient reason on its own.

---

## 4. What this means, stated without hedging where it is solid

**Solid:**

- **robots.txt at MidwayUSA disallows every path a price scraper needs.** Measured.
- **Van Buren narrowed the CFAA** to a gates-up-or-down test.
- **hiQ's public-scraping holding was vacated**, so it is not settled law.
- **ToS prohibition is not the same as CFAA liability**, and conflating them overstates
  the legal risk while understating the commercial one.

**Not solid, and therefore not relied on:**

- Whether a retailer can successfully sue a non-affiliate scraper for ToS breach.
- Whether any specific retailer would pursue it.
- Whether robots.txt alone creates any liability at all. **It generally does not — it is
  not a contract.** It is evidence of expressed intent, which is why it matters here.

**The conclusion that survives:** the CFAA question is genuinely unsettled and is **not the
deciding factor.** The deciding factors are the commercial ones, and they are not close.