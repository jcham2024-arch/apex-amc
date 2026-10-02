# Member marketplace: what the statute actually says

Written 2 Oct 2026, after the owner proposed a member-to-member sales area in the
forum for brass, excess projectiles and used reloading equipment — with reloaded
ammunition excluded.

**The proposal is more dangerous than it looks, and not for the reason expected.**
Excluding reloaded ammunition is correct and necessary, but it is nowhere near
sufficient, because the statute does not draw the line where the proposal assumes
it does.

---

## The provision that decides it

**18 U.S.C. 921(a)(17)(A)** defines ammunition as:

> "ammunition or **cartridge cases, primers, bullets, or propellent powder**
> designed for use in any firearm."

Note what is inside that definition. **Empty cartridge cases. Primers. Loose
bullets.** Every one of the three categories proposed for the marketplace.

The intuitive assumption — "brass and bullets are components, not ammunition, so
they are outside the law" — is **wrong at the statutory level**. Under this
definition they *are* ammunition: brass is ammunition not yet assembled.

This is not a technicality deployed against the proposal. It is why the definition
reads that way: the point of 922(g) is to stop unlicensed people moving the
pieces that reloads are made from.

### What that makes unlawful

**18 U.S.C. 922(g)(1)** makes it unlawful to ship or transport in interstate or
foreign commerce any firearm or ammunition to a person who is not a licensed
dealer or manufacturer.

Two consequences, neither about reloaded ammunition:

1. **Brass and bullets crossing state lines is the federal crime, not the
   seller.** An unlicensed member mailing brass to another state is what 922(g)
   addresses. A purely local sale is a different question — but see 922(a)(1),
   which reaches "engaging in the business of... dealing in... ammunition."
2. **We would be publishing the classifieds.** A marketplace is not neutral
   infrastructure. It is a publication, and it creates the transactions.

### The aggravating factor nobody expects
---

## The recommendation

**Do not build a transaction marketplace.** Not because the members are the
problem — a reloader trading brass is a legitimate activity — but because:

1. **The allowed list is smaller than it appears.** Brass, bullets and primers are
   all ammunition under 921(a)(17)(A). What survives cleanly is genuinely
   non-ammunition and non-firearm: scales, presses, dies, case gauges, loading
   blocks, eye and ear protection, books.
2. **We cannot verify a listing before it publishes.** There is no pre-publication
   content review that is both meaningful and practical.
3. **Moderation after publication is not a defence.** The transaction has already
   happened.
4. **Our own gates are the wrong tool.** `claims:check` blocks unsubstantiated
   marketing claims. It cannot tell that a seller's box contains an 80% lower.
5. **This is a different business.** A classifieds board is a firearms-adjacent
   transaction venue, a categorically different compliance surface from a research
   site — and that difference is what makes the site's current position defensible.

---

## What is safer, and is genuinely useful

**A "want/wanted" board. No prices, no transactions, no contact details.**

That is meaningfully safer, but **it is not zero risk** and I would not claim
otherwise. It reduces the transaction surface; it does not remove it. A reader who
wants brass will arrange it privately either way, which means we take on the
moderation burden without removing the thing we cannot control.

Honest framing: *this reduces, but does not eliminate, the risk. It is not the
same as not doing it.*

### Controls that would be mandatory

| # | Control | Why |
| --- | --- | --- |
| M.1 | **No prices, no contact details, no payment** | Keeps it a bulletin board, not a venue |
| M.2 | **Hard-prohibited list in the terms**: loaded ammunition, powder, primers, any firearm, any frame or receiver including unfinished ones, anything requiring a background check | Follows from 921(a)(17)(A) and 921(a)(3)(B) |
| M.3 | **Age gate already required** | Phase 0.1 becomes a hard dependency, not a nicety |
| M.4 | **One-click report, reviewed daily** | A gate nobody reads daily is not moderation |
| M.5 | **Published terms: members trade at their own risk, we are not a party** | Necessary, and **not sufficient** |
| M.6 | **A gate: no listing publishes without terms acceptance** | Makes M.5 machine-enforced rather than a checkbox |

**A terms-of-service page is not a legal defence.** It shifts liability, and on
these facts it would not defeat it. It must not be written as though it were the
control that makes this acceptable.

---

## The honest recommendation

**Do not build this until a firearms-experienced attorney has reviewed it.**

Not because the members' intent is in question, but because:

- The allowed-item boundary is set by a statute whose scope most people —
  **including me, until this afternoon** — get wrong in the intuitive direction.
- Our exposure is on a research site whose entire value proposition is
  credibility. A prohibited listing is not a bug report; it ends the argument that
  we are careful.
- The feature is **entirely deferrable**. Nothing in the product depends on it.

If the answer is yes, build it as a bulletin board with no prices and no
transactions, behind a real age gate, with M.2 enforced mechanically. If it is
conditional, build nothing.

**What should not happen is shipping a transaction marketplace on the strength of
a terms page.** That is the specific outcome this document exists to prevent.

---

## What I got wrong, recorded because it is the same mistake twice

I previously wrote that physical-goods sales were "out of scope permanently" and
was corrected for over-confident prohibition. Now, having checked the statute for
the marketplace, the intuitive reading — "brass and bullets are not ammunition,
so it is fine" — was wrong in the direction that *increases* risk.

**Two errors from over-confident generalisation.** The lesson: for anything in
this vertical the statutory text outranks the intuitive reading, and "probably
fine" is a claim that must be sourced.

---

## Sources

- 18 U.S.C. 921(a)(17)(A) — definition of ammunition, including cartridge cases,
  primers, bullets and propellant powder.
- 18 U.S.C. 921(a)(3)(B) — a firearm includes the frame or receiver.
- 18 U.S.C. 922(a)(1) — engaging in the business of dealing in ammunition without
  a licence.
- 18 U.S.C. 922(g)(1) — shipping or transporting a firearm or ammunition in
  interstate or foreign commerce to an unlicensed person.
- 27 C.F.R. 478.11 — licensed dealers may not sell ammunition, cartridge casings
  or components for use in manufacturing, assembling or converting ammunition.

Retrieved 2 Oct 2026 from law.cornell.edu. **Not legal advice.**

An **80% lower or receiver** is "the frame or receiver of any such weapon" under
921(a)(3)(B), therefore a **firearm**, regardless of whether it is finished.

Used reloading equipment is the category most likely to sweep one of these in
casually. Someone lists "spare AR build components, used." Whether that is a
prohibited transfer depends entirely on what is in the box — and a marketplace
operator cannot determine that before the transaction happens.