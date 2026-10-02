// Affiliate retailer directory.
//
// WHY THERE IS NO `rating`, NO `badge`, AND NO `verified` FIELD
// -------------------------------------------------------------
// This file used to carry `rating: 4.9`, `badge: 'Top Choice for Reloaders'`,
// and every card rendered a gold star plus the literal text "Verified Shipping
// Partner" directly above a link we get paid for.
//
// That combination is the single highest-risk thing on the site, for reasons
// that have nothing to do with taste:
//
//  1. FTC Endorsement Guides (16 CFR 255.5): a material connection - here,
//     commission - must be disclosed. But disclosure only cures an endorsement;
//     it does not make an *unsupported* endorsement true. 16 CFR 255.2(b) also
//     requires the endorser not to make representations they cannot substantiate.
//  2. A bare "4.9" with no review count is a claim about a measurable
//     quantity. We have no reviews. Nobody has rated these retailers through us,
//     and no source for those numbers is recorded anywhere in this repository.
//     Displaying them is a fabricated endorsement, whether or not a label says
//     "affiliate".
//  3. Superlatives ("Top Choice", "#1", "Authority", "Leader") are comparative
//     advertising claims. Each requires substantiation we do not have and could
//     not honestly obtain, because we have not surveyed the market.
//  4. "Verified Shipping Partner" asserted that a verification happened. None
//     did. Nothing in the build or the data layer checks any retailer.
//
// The FTC's own guidance is that an affiliate relationship still requires the
// review to be honest: disclosure tells the reader who paid you, it does not
// license a claim you invented.
//
// WHAT IS HERE INSTEAD
// --------------------
// Only facts a reader could verify by visiting the retailer themselves:
// the retailer's own name, what they sell, and their own URL. `specialty`
// describes their catalogue, which is self-evident from their site and is not a
// comparative claim.
//
// If ratings are ever wanted, they have to be earned: collect real reviews from
// real users, store the count and the source alongside the score, and treat a
// missing count as disqualifying rather than cosmetic. That is a data-layer
// change with a schema behind it, not a field to fill in here.

export const RETAILERS = [
            {
                name: 'MidwayUSA',
                specialty: 'Reloading & Shooting Supplies',
                cat: ['reloading', 'components', 'bulk', 'optics'],
                description: 'Sells reloading presses, dies, bullets, brass, powder, and hunting gear.',
                link: 'https://www.midwayusa.com'
            },
            {
                name: 'Brownells',
                specialty: 'Gunsmithing & Ammo',
                cat: ['reloading', 'components', 'bulk'],
                description: 'Sells gun parts, reloading tools, factory ammunition, and optics.',
                link: 'https://www.brownells.com'
            },
            {
                name: 'Natchez Shooters Supplies',
                specialty: 'Powder, Primers & Optics',
                cat: ['components', 'reloading', 'optics'],
                description: 'Distributor carrying smokeless powders, primers, and bulk factory ammunition.',
                link: 'https://www.natchezss.com'
            },
            {
                name: 'Palmetto State Armory',
                specialty: 'Bulk Ammo & Firearms',
                cat: ['bulk', 'components'],
                description: 'Retailer and ammunition manufacturer offering bulk 9mm, 5.56, and AAC factory ammunition.',
                link: 'https://palmettostatearmory.com'
            },
            {
                name: 'Target Sports USA',
                specialty: 'Bulk Ammo',
                cat: ['bulk'],
                description: 'Specializes in bulk case sales of ammunition, including case-order shipping options.',
                link: 'https://www.targetsportsusa.com'
            },
            {
                name: 'Powder Valley',
                specialty: 'Powder & Primers',
                cat: ['components', 'reloading'],
                description: 'Supplier of smokeless powder, primers, and match bullets at wholesale quantities.',
                link: 'https://www.powdervalleyinc.com'
            },
            {
                name: 'OpticsPlanet',
                specialty: 'Optics & Tactical Gear',
                cat: ['optics', 'reloading'],
                description: 'Stores scopes, red dots, rangefinders, reloading presses, and shooting accessories.',
                link: 'https://www.opticsplanet.com'
            },
            {
                name: 'Primary Arms',
                specialty: 'Optics & Range Gear',
                cat: ['optics'],
                description: 'Carries ACSS reticle optics, tactical accessories, and shooting equipment.',
                link: 'https://www.primaryarms.com'
            }
        ];

        
export default RETAILERS;
