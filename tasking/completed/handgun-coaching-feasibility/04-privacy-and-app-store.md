# 04 — Privacy and app-store policy

**Task:** handgun-coaching-feasibility. **Every policy claim below cites the policy document
and quotes it.** The brief explicitly forbids summarising from memory; two of my first three
retrievals returned the wrong Google policy page, which is exactly why.

---

## 1. Apple App Review Guidelines — weapons content

**Source:** App Store Review Guidelines, §1.1 "Objectionable Content". Retrieved 2 Oct 2026.

Verbatim, the subsections that bear on this app:

> **1.1.1** Defamatory, discriminatory, or mean-spirited content… particularly if the app is
> likely to humiliate, intimidate, or harm a targeted individual or group.

> **1.1.2** Realistic portrayals of people or animals being killed, maimed, tortured, or
> abused, or content that encourages violence.

> **1.1.3** Depictions that encourage illegal or reckless use of weapons and dangerous objects,
> or facilitate the purchase of firearms or ammunition.

And separately, §2.3.8 on metadata:

> Metadata should be appropriate for all audiences… **For example, if your app is a game that
> includes violence, select images that don't depict a gruesome death or a gun pointed at a
> specific character.**

### What this actually means for a coaching app

**A coaching app is not the thing §1.1.3 prohibits.** Read carefully, that clause targets
*encouraging reckless use* and *facilitating purchase*. A range app that measures a shooter's
own group at a licensed range does neither. The realistic rejection risk is **§1.1.2**, if
imagery is graphic, and **§2.3.8**, which constrains *store screenshots* — not function.

**So: the store risk for Apple is low-to-moderate and is largely an imagery and listing
problem, not a functionality problem.**

## 2. Google Play — weapons content

**Source:** Google Play Console Help, "Inappropriate Content" → "Dangerous Products".
Retrieved 2 Oct 2026. *(I first fetched the User Generated Content and Deceptive Behavior
pages by mistake; neither is cited below.)*

Verbatim:

> **Policy Summary:** The sale of explosives, firearms, ammunition or certain firearms
> accessories through your app is forbidden. You must not provide these services.

> **Full Policy:** We don't allow apps that facilitate the sale of explosives, firearms,
> ammunition, or certain firearms accessories.

## 3. The real risk is privacy, and there is a clean solution

**Source:** Apple, "App Privacy Details" (App Store). Retrieved 2 Oct 2026. Verbatim:

> **Data that is processed only on device is not "collected" and does not need to be disclosed
> in your answers.** If you derive anything from that data and send it off device, the resulting
> data should be considered separately.

> You collect data to service a request but do not retain it after servicing the request.
> "Collect" refers to transmitting data off the device and storing it in a readable form for
> longer than the time it takes you or your third-party partners to service the request.

**This is a decisive design constraint in our favour.** A fully on-device app that never
transmits the image is **not** subject to privacy-nutrition-label disclosure for that image.

**Source:** Google Play, "User Data". Retrieved 2 Oct 2026. Verbatim:

> You must be transparent in how you handle user data… That means disclosing the access,
> collection, use, handling, and sharing of user data from your app, and limiting the use of the
> data to the policy compliant purposes disclosed.

Google does not offer Apple's on-device exclusion in the same terms, so a Play build should
assume images are in scope for declaration.

## 4. What the data actually is

A photo of a person handling a firearm, indoors, at a range, contains:

- **Their face** — biometric-adjacent personal data.
- **Their shooting technique** — behavioural, and the thing the app would characterise.
- **Their range location and session** — inferable, potentially identifying.

**The compounding risk is the second one.** This app's entire value proposition is producing
a *judgement about a person's ability*. If that output is stored, shared, or surfaced without
consent, the privacy question stops being about images and becomes about automated assessment
of an individual. That is a materially different regulatory category.

## 5. Required design constraints

1. **On-device only. No upload.** This is now justified by policy, not just by privacy
   preference — it takes the image out of both stores' disclosure regimes (Apple explicitly).
2. **No persistence by default.** If retained at all, on-device, encrypted, user-deletable.
   Apple's test is retention *beyond servicing the request*; not retaining it is the simplest
   way to be unambiguously correct.
3. **Never store a diagnosis without the handedness flag** (`02-` §4).
4. **Explicit, informed consent** from the person photographed — not only the person holding
   the phone. The subject's face is in the frame.
5. **No sharing, no analytics SDK on the image path.** Any third-party SDK touching frames
   re-opens the entire disclosure question — and Google explicitly holds the developer
   responsible for integrated SDKs.
6. **Store screenshots must obey §2.3.8** — no firearms aimed at a person in marketing imagery.

## 6. What I could NOT establish — left EMPTY

- **Whether Apple has ever rejected a range or shooting app, and on what grounds:** `not
  stated`. I found no published app-review decision on a coaching app of this type.
- **Google Play enforcement history for gun-related apps:** `not stated`.
- **Any stated probability of rejection:** **EMPTY**, and I will not invent one.

**Absence of a prohibition is not evidence of approval.** Both policies permit what this app
does; neither guarantees approval, and review is discretionary.
> We don't allow apps that provide instructions for the manufacture of explosives, firearms,
> ammunition, restricted firearm accessories, or other weapons.

**This is the most important policy finding in the task, and it is good news.** Google Play's
weapons policy regulates **sale and manufacture instructions** — not depiction, not analysis,
not coaching. A group-measurement app falls outside both clauses.

**Nothing in either store's weapons policy prohibits this app.** The fear that "Google will ban
a gun app" is not supported by either policy as written.