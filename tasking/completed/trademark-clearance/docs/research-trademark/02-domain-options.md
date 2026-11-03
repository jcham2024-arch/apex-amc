# Domain options — top 5 candidates

Companion to [`01-name-clearance.md`](01-name-clearance.md). Research only; nothing
was registered, purchased or changed.

**Check performed:** 3 Oct 2026, via `Resolve-DnsName -Type A` from a Windows
workstation.

---

## 1. Method — read this before believing any row

DNS `A` records are **not** a reliable availability check. A **parked** domain still
resolves, to a parking IP, and looks available to anything that only asks "does it
resolve?". The classification used here is exactly the brief's:

| Classification | Meaning | Counts as available? |
|---|---|---|
| `NXDOMAIN` | The name does not exist in DNS. | **Strong signal — still confirm at a registrar** |
| `resolves` — real A record | A host is serving it. | **No.** It is taken. |
| `resolves` — parking IP (76.223.x.x, 162.255.x.x) | Registered, parked, for sale. | **No.** It is taken, and purchasable at a premium. |
| `no A record` | Exists but serves no IPv4. | **INCONCLUSIVE.** |

**No domain in this document is reported "available".** Every row carries its method
and a confidence level, and every `NXDOMAIN` still needs a registrar confirmation
before money moves. `NXDOMAIN` means *no one is using it right now*, which is
different from *it is yours to take* — someone can register a name at any moment, and
a domain with a live trademark claim attached can be bought and then used against you.

### Negative test on the method itself

Two names checked so the tool could not silently report "resolves" for everything:
`ballisticsapi.com` and `ammodata.com` both returned **NXDOMAIN**, while
`loadforge.com`, `loadwise.com` and `loadsense.com` all resolved to distinct real
hosts. **The resolver distinguishes registered from unregistered.**

---

## 2. Full DNS results for the candidate pool

| Domain | Method | A record | Classification | Confidence |
|---|---|---|---|---|
| `ballisticslab.com` | A query | 2.59.170.20 | resolves | high — taken |
| `ballisticslab.dev` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `ballisticslab.io` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `ballisticsapi.com` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `ballisticsapi.dev` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `ballisticsapi.io` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `powderlab.com` | A query | 54.243.117.197 | resolves | high — taken |
| `powderlab.dev` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `powderlab.io` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `trajectorylab.com` | A query | 74.208.236.191 | resolves | high — taken |
| `trajectorylab.dev` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `trajectorylab.io` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `loadsense.com` | A query | 108.167.181.191 | resolves | high — taken |
| `loadsense.dev` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `loadsense.io` | A query | 162.255.119.141 | **parking IP** (162.255.x.x) | high — taken, for sale |
| `loadgraph.com` | A query | 13.223.25.84 | resolves | high — taken |
| `loadgraph.dev` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `loadgraph.io` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `ballistify.com` | A query | 13.248.243.5 | resolves | high — taken |
| `loadworks.com` | A query | 3.33.152.147 | resolves | high — taken |
| `loadworks.dev` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `loadworks.io` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `loadwise.com` | A query | 52.20.84.62 | resolves | high — taken |
| `loadwise.dev` | A query | 104.21.11.32 | resolves | high — taken |
| `loadwise.io` | A query | 104.21.25.133 | resolves | high — taken |
| `caliberlab.com` | A query | 13.248.169.48 | resolves | high — taken |
| `ammoquery.com` | A query | 198.185.159.144 | resolves | high — taken |
| `ammodata.com` | A query | NXDOMAIN | **NXDOMAIN** | medium — confirm at registrar |
| `loadforge.com` | A query | 216.150.1.1 | resolves | high — taken |
| `loadforge.dev` | A query | 216.24.57.18 | resolves | high — taken |
| `loadforge.io` | A query | 103.224.212.141 | **parking IP** (103.224.212.141, a widely used parking block) | high — taken/parked |

Note `loadforge.app` is separately confirmed taken: it is the **live operating
competitor** at https://loadforge.app/.

---

## 3. Top 5 candidates, by domain position

Ranked on **both** trademark clearance and domain position, because a clean name with
no obtainable domain is not a usable answer.

| # | Candidate | Best domain position | Registry | Overall |
|---|---|---|---|---|
| **1** | **`ballisticsapi`** | **.com, .dev and .io all NXDOMAIN.** The only candidate with a clean **.com**. | 0 hits | **Best overall.** |
| **2** | **`powderlab`** | .dev and .io NXDOMAIN; .com taken | 0 hits | Strong, but .com costs money or is unavailable. |
| **3** | **`trajectorylab`** | .dev and .io NXDOMAIN; .com taken | 0 hits | Strong. Narrows perception to trajectories only. |
| **4** | **`ballisticslab`** | .dev and .io NXDOMAIN; .com taken | 0 hits | Strong. Broadest scope of the "lab" names. |
| **5** | **`ammodata`** | .com, .dev and .io all NXDOMAIN | 0 hits | **Domain is excellent, the name is not.** Occupied in the vertical by video-game mod data; generic. Listed only to record that the domain opportunity does not rescue a weak mark. |

**Caveat on `ballisticsapi`:** putting "API" in the product name is a real signal
that this is a developer product, which is the owner's stated intent. It also narrows
the brand — a consumer calculator directory is a poor fit under an "API" name. That
is a product decision, not a legal one, and the owner should make it deliberately.

**Every `.dev` and `.io` above is NXDOMAIN and therefore still unconfirmed.** Confirm
at a registrar before acting.

---

## 4. Domain age vs trademark rights — stated as fact, not as advice

**The owner states they held their domains for 10 years. That is recorded here as a
fact, and it does not change the trademark position.**

Domain age and trademark rights are separate systems answering separate questions.
A domain name is an **address**. A trademark is a **sign that identifies the source of
goods or services**. Owning `example.com` for ten years buys priority over that exact
string as an address, and nothing else: it does not create a trademark, it does not
give the right to stop anyone else using the word, and it does not protect the site in
another country where the brand may already be registered. Trademark rights instead
come from use in commerce, from federal registration, and from state common-law
protection — none of which a domain registration satisfies.

The three are distinct rights:

- **Copyright** protects *original expression* — the site's copy, code, images and
  design. It is automatic on authorship. It does not protect a name at all.
- **Trademark** protects *the name as a source identifier*. It is what is contested
  here, and the APEX AMMUNITION registration in IC 013 is the live example: an
  existing owner, in this product category, using this word.
- **Patent** protects *inventions* — a process, a machine, a composition of matter.
  The domain-physics solver in this project is the kind of thing that might be
  patentable, but a patent was never sought and a trademark decision neither requires
  nor creates one.

So owning the domain for 10 years does not weaken the trademark risk, and does not
strengthen a defence against it. Domain age and trademark age are simply different
clocks.

**This is not legal advice.** It describes what the registries do and do not confer.
**A qualified trademark attorney should review any actual brand change or filing**,
including a search outside the US register.

---

## 5. Limits of this check

- **US registry only** for trademarks; no EUIPO, UKIPO, CIPO or IP Australia search.
- **DNS only** for domains. No WHOIS, no registrar cart check, no purchase attempt,
  no trademark-claim search on the domain itself. A domain with an active trademark
  claim can be transferred in a UDRP-like proceeding.
- `NXDOMAIN` is a **point-in-time observation** from 3 Oct 2026. It is not a
  reservation, and it can change at any moment.
- `.app` was not part of the systematic sweep; `loadforge.app` was seen only because
  it is the live competitor. `.app` enforces HSTS, which is fine for an API-first
  product but is worth knowing before choosing it.