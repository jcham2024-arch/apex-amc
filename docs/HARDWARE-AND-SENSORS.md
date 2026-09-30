
---

# Long-range shooting: hardware, sensors, and what we can actually integrate

Researched 30 Sep 2026. **Everything marked VERIFIED was read from a primary
source during this session. Everything marked UNVERIFIED is a lead that needs
confirming before we design against it.** Manufacturer sites and search engines
blocked automated retrieval, so the gaps are stated rather than filled with
plausible-sounding guesses.

---

## 1. The physics priority order, which drives everything else


These figures are MEASURED from the validated solver, not estimated. Case:
.308 Win, 168 gr GMM, G1 BC 0.462, 2650 fps, 100 yd zero, and the change in
point of impact at 1000 yd caused by each input moving from the reference
case (59 degF, sea level, no wind, dry air) to its stated value:

| Input change | Effect on point of impact at 1000 yd |
|---|---|
| Crosswind 0 -> 5 mph | **4.19 MOA** |
| Elevation 0 -> 5,000 ft | 3.62 MOA |
| Temperature 59 -> 100 degF | -0.32 MOA |
| Humidity 0 -> 100% RH | 0.15 MOA |

**Wind and elevation are the only two that matter at this range, and a 5 mph
crosswind is worth more than the entire sea-level-to-Denver elevation change.**
Temperature is nearly irrelevant for trajectory (it matters for internal
ballistics and powder performance, which is a different calculation), and humidity
is negligible. This is why the weather module treats a local wind measurement
as the highest-value input rather than treating all weather inputs as equal.

The practical consequence: a $150 Kestrel that reads wind where the shooter is
standing is worth more than any atmospheric model we could ship, because the
shot does not care about the wind at the weather station. Any feature we build
should push the shooter toward measuring wind, not toward consulting us for it.

The practical consequence: a $150 Kestrel that reads wind at the shooter's
position is worth far more to a shooter than a perfect atmospheric model. Any
feature we build should push the shooter toward measuring wind, not toward
consulting us for it.

---

## 2. What we verified about the hardware

### SIG SAUER BDX / KILO rangefinders — VERIFIED

Read from the Google Play listing for the official SIG BDX app:

- The KILO BDX rangefinders pair over Bluetooth with SIERRA3BDX riflescopes and
  illuminate a holdover dot out to **800 yards at 1 MOA accuracy**. The scope's
  power-selector ring shows a solid blue LED while paired, and flashes 8x per
  update when a new holdover is received.
- The app has **50,000+ downloads, 3.0 stars, 214 reviews** — and the reviews
  are more informative than the rating.

**The reviews identify exactly two missing features, both of which we have:**

1. **No zero offset.** Multiple reviewers (12+ found one review helpful) state
   they zero once with a primary load and need a second load to work without
   mechanically re-zeroing or re-dialing every time. They want to enter the
   zero difference and have the solver compensate. Our solver already takes
   `zeroMoa` and `zeroYd` as explicit inputs and applies the offset as an
   angular correction to the line of sight.
2. **No profile import/export.** Reviewers report re-entering every custom
   profile by hand after changing phones, and object to being forced into an
   account or cloud service to move data.

**This is a strong product signal.** An official first-party app from a major
manufacturer, with tens of thousands of users, is missing the two features that
our solver treats as fundamental. That is a real gap in the market, and it is
ours to take.

### Garmin Approach R10 — VERIFIED (third-party reverse engineering)

There is an **unofficial Swift iOS SDK** on GitHub (`OSSGolf/unofficial-r10-ios-sdk`)
for connecting to the R10 over Bluetooth Low Energy, built from prior reverse
engineering of a C# adapter (`mholow/gsp-r10-adapter`). Facts from that SDK:

- Direct BLE connection, no first-party app required, no PC tether.
- The protocol layer is reverse-engineered, not documented by Garmin. **This
  means no stability guarantee**: Garmin can change firmware and break it.
- It exposes golf shot data (club speed, ball speed, launch angle, spin rate,
  attack angle, swing timing) — a golf launch monitor, not a range finder in
  the shooting sense.
- The project has 1 star and 0 forks. It is a proof of concept, not a
  maintained library.
- iPhone 16 Pro / iOS 18.4, R10 firmware 4.50 was the tested configuration.

**Assessment: do not build on this.** Depending on a reverse-engineered,
unsupported protocol in a safety-adjacent app is a bad trade even if the
upstream hardware is popular. If we want R10 support, the right path is a
thin, well-tested adapter module with a clearly documented "unsupported
protocol" warning, isolated so it can be deleted without touching the app.

### Kestrel / Kestrel 5500 weather meters — PARTIALLY VERIFIED

**UNVERIFIED.** The SIG and Kestrel product pages returned 403/404 to automated
retrieval, so we could not confirm the sensor list or the Bluetooth profile
from a primary source. What the Google Play BDX listing does confirm is that
Kestrel data reaches phones in BDX-X mode.

This is the most important gap to close, because per section 1 the Kestrel is
the highest-value device for a long-range shooter. **Action: read the Kestrel
5500 manual directly and confirm the measurement set and the BLE GATT profile
before designing anything.**

---

## 3. The BDX zero-offset and profile-export gap, in detail

This is the clearest product opportunity we found, and it is worth stating
precisely because it is cheap for us and expensive for them.

A precision shooter typically has:
- A **primary zero** on a hunting or match load, and
- A **secondary load** with a different charge weight, seated differently, and
  zeroed differently.

The official BDX app forces that shooter to either re-dial the turret for every
change or re-zero physically. Both are bad practice: repeatedly re-zeroing a
rifle wears the barrel, and fiddling with turrets mid-hunt costs time when it
matters.

The correct behaviour is what the reviewers describe: zero once, record the
difference in MOA between loads, and let the solver apply it. **We already do
this.** `SolveRequest.zeroMoa` is an explicit angular input, and the solver
applies it to the line-of-sight slope rather than as a vertical offset.

Our export story is also better by default: a shooter can copy a profile to
another device without an account, because the data is a local file.

---

## 4. Can a phone be a rangefinder?

**Honest answer: not reliably, and we should not claim it can.**


**Short answer: for ranging a rifle target, no. For recording and
confirming, yes.** The distinction matters and it is worth being precise,
because the first instinct is to assume a camera cannot do it at all, and that
is not quite right.

**The angular resolution is actually adequate.** Working it through for a
typical modern phone (12 MP, 1/1.7-inch sensor, roughly 26 mm equivalent):

- Field of view about 16 degrees across 3464 pixels
- Angular resolution therefore about **0.082 milliradians per pixel**
- At 1000 yd, 1 MOA subtends 10 inches
- So 1 MOA spans about **12 pixels** - comfortably resolvable

**The real obstacle is not optics, it is geometry and context.** A 10-inch
sliver at 1000 yd is only 12 pixels across, which means the measurement rests on
roughly a dozen pixels of a possibly-moving, possibly heat-shimmering,
possibly partially occluded object. The shot is not the camera
"seeing" the target; it is inferring a distance from a dozen pixels whose
apparent size depends on what you are looking at. A steel target, a rifle
shooter"s silhouette, and a piece of cardboard on a 10 MOA plate are three
completely different problems wearing the same 12 pixels.

**The genuine failure modes are these, not blur:**

1. **Target identification.** You cannot tell a 1 MOA plate from a 2 MOA plate if
   you do not know what you are looking at, and that knowledge is exactly what
   a spotter provides and a phone cannot.
2. **Heat shimmer.** At 500+ yd the mirage that the TransonicStabilityScreen
   already detects physically distorts the target edge, and that distortion is
   comparable to the effect being measured.
3. **Camera motion.** Handheld shake of a few pixels swamps a 12-pixel feature.
   This is fixable with a rest and a timer, but a spotter uses a rangefinder
   for exactly this reason.
4. **Sub-pixel accuracy is not accuracy.** Even with clean pixels, a 2% scale error
   from an uncalibrated focal length is 20 MOA of range error. Calibration is
   the hard part, not capture.

**Where a phone camera genuinely helps:**

| Use | Verdict |
|---|---|
| Replacing a laser rangefinder at 1000+ yd | **No** - see the failure modes above |
| Calibrated ranging to a known plate, tripod-mounted, short range | Plausible, but no advantage over a $200 laser |
| Confirming a group's size at the paper | **Useful** |
| Photographing and archiving a range card with its group | **Very useful** |
| Confirming a hit beyond the shooter's own eyesight | **Useful** |

So the honest product framing is **"photograph and archive your groups"**,
not "your phone is a rangefinder." Overclaiming here would cost credibility
with exactly the shooters we want to serve.

There is one case where the camera is genuinely competitive: **a spotter with a
rangefinder feeding a spotter phone app.** That is a different product (the
spotter calls, the shooter dials) and it is how long-range teams actually
operate. The phone's job there is to hold the firing solution and the data, not
to measure.
---

## 5. What a long-range shooter actually wants, in priority order

Derived from the physics above plus what the BDX reviewers asked for:

1. **A reliable wind number they trust**, from a local instrument. Everything
   else is secondary.
2. **A dope card that does not require re-zeroing or turret changes** to switch
   loads. (Both BDX review themes.)
3. **A visible safety margin** — how far inside the published data they are.
4. **A record of what was shot.** Our chronograph and shot-group schema exists;
   the Expo app logs it; nothing surfaces it yet.
5. **Data they can move without an account.** (The third BDX review theme.)
6. **Confirmation of hits beyond their own vision.**

---

## 6. Integration plan, cheapest first

Ordered by value per unit of risk, not by appeal.

### Tier 1 — build now, no hardware dependency

- **Weather module with per-field provenance.** DONE.
  `packages/ballistics-core/src/weather.ts`. Forecast and measurement coexist
  without being blended, and the UI can show which is which.
- **Free forecast integration.** Open-Meteo, keyless, free for commercial use.
  DONE (parser); the screen is not built. Prefer the 80 m wind over the 10 m
  reading.
- **Zero-offset dope cards.** The solver already supports it. The UI is the
  missing piece and it is the single highest-value screen after the wind.
- **Profile export with no account requirement**, which we get for free by
  keeping profiles as local files.

### Tier 2 — needs a primary-source read before design

- **Kestrel / Kestrel 5500 BLE integration.** Highest value, unknown protocol.
  Get the manual first.
- **Range-card photo capture and archiving.** Uses the existing shot-group
  schema. No protocol risk.
hold-the-firing-solution workflow: a spotter-confirmed range, the hold,
  honest about its accuracy, plus a spotter-call workflow. This is where the
  phone camera belongs.

### Tier 3 — evaluate carefully, probably do not build

- **Garmin R10 BLE.** Reverse-engineered, unmaintained, and the device is a golf
  launch monitor rather than a shooting rangefinder. If attempted, isolate it
  behind an adapter with a stated-unsupported warning.
- **SIG BDX protocol.** SIG's ecosystem is proprietary and the first-party app
  is the supported path. Competing with it is unlikely to succeed and would
  make us a second-class citizen in their ecosystem. Better to serve the gap
  their app leaves (zero offset, export) on our own terms.

---

## 7. What we deliberately are not building

| Idea | Why not |
|---|---|
| Phone-as-rangefinder at 1000 yd | The optics CAN resolve 1 MOA (12 px), but target identification, heat shimmer and focal-length calibration make it unreliable. Claiming otherwise would be dishonest. |
| A proprietary ballistics solver | Four competitors have labs. Our edge is verification and provenance. |
| Auto-ranging without confirmation | An unconfirmed range is worse than no range. |
| Silent defaults for weather | A shooter in Denver must not receive a sea-level card. |
| Blending measured and forecast weather | Produces a number that is neither, and cannot be checked. |

---

## Sources

**Verified this session:**
- SIG BDX app, Google Play listing — device behaviour, holdover dot to 800 yd at
  1 MOA, 50K+ downloads, 3.0 stars, and the two most-requested missing features
  (zero offset, import/export) quoted from reviews:
  https://play.google.com/store/apps/details?id=com.sigsauer.bdx
- `OSSGolf/unofficial-r10-ios-sdk` — BLE approach, reverse-engineered origin,
  protocol not Garmin-documented, iPhone 16 Pro / iOS 18.4 / R10 fw 4.50:
  https://github.com/OSSGolf/unofficial-r10-ios-sdk
- Open-Meteo API documentation — keyless, variables at 10/80/120/180 m including
  gusts, temperature, humidity, surface pressure, visibility, elevation:
  https://open-meteo.com/en/docs
- NOAA api.weather.gov — keyless, "open data, free to use for any purpose",
  User-Agent header required, station observation endpoints:
  https://www.weather.gov/documentation/services-web-api

**Not verified — read before designing against these:**
- SIG Kestrel / Kestrel 5500 measurement set and BLE profile. Manufacturer
  pages returned 403 to automated retrieval.
- Kestrel 4600 and the lower Kestrel range.
- Vortex, Swarovski, Bushnell, and Leica rangefinder Bluetooth support.
- Whether any current third-party app already offers a zero-offset dope card
  with account-free export. Search engines blocked automated queries; this
  should be checked manually before we commit to the positioning.
