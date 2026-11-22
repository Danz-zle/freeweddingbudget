# AdSense Recovery Stage 3: Milestone 4

Date: September 21, 2026
Branch: `adsense-recovery-stage3`
Starting point: Milestone 3 commit `7a32879`

## Goal

Audit the six remaining guides and fix the two pages that still had the weakest individual purpose. Keep every clean URL while replacing generic advice with calculations and reusable worksheets.

## Library decision

| Guide | Decision | Distinct user task |
|---|---|---|
| Average wedding cost | Keep and strengthen next | Interpret survey figures and replace a national average with local evidence. |
| Catering budget | Keep and strengthen next | Build the expected invoice from menu price, required charges, and guest count. |
| Planning timeline | Keep and strengthen next | Turn commitments into a dated payment calendar. |
| Venue checklist | Keep and strengthen next | Compare venue offers on the same event scope. |
| Spend vs save | Repurposed in this milestone | Calculate the reserve effect of fixed and per-guest upgrades. |
| DIY decor | Repurposed in this milestone | Compare DIY, rental, and full-service options without omitting logistics or counting a cost twice. |

No article needs to be deleted, redirected, or hidden. The term overlap found in the audit comes mainly from shared Planner fields and budget language. Each URL now has, or has a defined path toward, a separate planning task.

## Upgrade worksheet

The spend-vs-save guide now includes:

- A $1,200 fixed upgrade.
- A $12-per-guest alternative at 50, 100, and 150 guests.
- A visible $3,000 starting reserve.
- The reserve remaining when no other line is reduced.
- The reduction needed elsewhere to keep the full reserve.
- A downloadable CSV with all six comparison rows.

The examples are fictional. The worksheet tells users to replace them with current quotes and not increase the spending ceiling merely to make an optional upgrade fit.

## DIY decor comparison

The DIY guide now includes:

- A visible calculation for the fictional $1,200 DIY total.
- Separate DIY, rental, and full-service rows in a downloadable CSV.
- An explicit exclusion for helper time because the example does not assign it an invented value.
- U.S. government source notes for candle, extension-cord, and accessible-route safety.
- A corrected Planner workflow that prevents double-counting.

The Planner rule is now clear: a conceptual DIY quote can remain unselected during comparison. If the user chooses DIY, the real purchases belong in Actual expenses. The user should not also select the conceptual $1,200 quote.

## Verification

- Desktop layout tested at 1280 x 800.
- Mobile layout tested at 390 x 844.
- No horizontal overflow on the hub or either updated guide.
- Upgrade guide contains four visible result cards.
- DIY guide contains four visible cost components.
- Both new CSV files return HTTP 200 with `text/csv` content.
- Six upgrade rows reproduce the displayed totals and reserve results.
- The four entered DIY components total $1,200.
- Rental and full-service totals remain separate because their internal breakdowns are not provided by the fictional examples.
- Both updated pages have one H1, valid JSON-LD, unique IDs, and valid local link targets.
- Visible FAQs and structured FAQs use matching questions and answers.
- Public copy was checked with the Humanizer method for direct wording, factual limits, and repeated AI-style patterns.
- Existing vendor, budget, guest, and hidden-cost checks still pass.

Local browser warnings were limited to third-party resources blocked by the isolated test environment. They did not come from the site code changed in this milestone.

## Deliberately unchanged

- Planner calculations and browser-storage schema.
- Canonical URLs and production URLs.
- `ads.txt`, `_headers`, `robots.txt`, `sitemap.xml`, and analytics consent.
- Cloudflare and AdSense settings.
- Production deployment.

## Next milestone

Strengthen the four remaining guides with separate evidence formats:

1. A catering invoice worksheet.
2. A same-scope venue comparison worksheet.
3. A dated payment-calendar download.
4. A transparent source-update method for the average-cost article.

These pages should be completed and tested before the full Stage 3 sign-off.
