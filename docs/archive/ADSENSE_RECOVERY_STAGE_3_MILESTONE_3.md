# AdSense Recovery Stage 3: Milestone 3

Date: September 20, 2026
Branch: `adsense-recovery-stage3`
Starting point: Milestone 2 commit `7d123c0`

## Goal

Give the guest-count and hidden-cost guides separate, useful jobs that support Planner 2.0. Each guide now includes a reproducible example and a downloadable worksheet.

## What changed

- Rebuilt the guest-count example around visible per-guest calculations for 50 and 100 guests.
- Explained exactly what the Guests projection changes and what it keeps fixed.
- Added a downloadable guest-scenario CSV with inputs, subtotals, and the $8,000 difference.
- Added a three-step quote-audit workflow to the hidden-cost guide.
- Added a downloadable quote-audit CSV that maps each contract line to the correct Planner 2.0 field.
- Added a clear Planner 2.0 field map for vendor costs, payments, separate expenses, and contract notes.
- Updated the blog hub descriptions and modification labels for both guides.
- Added safe icon-library fallbacks to both updated articles.

## Important accounting correction

An older instruction could lead a user to put a required vendor fee in Actual expenses even when that fee was already included in a selected vendor commitment. That would count the same cost twice.

The guide now uses this rule:

- Required vendor charges belong in the vendor quote's true-cost fields.
- Deposits and balances belong in Payments.
- Actual expenses are only for costs not already represented by a selected vendor commitment or payment.

The visible FAQ and the structured FAQ now give the same guidance.

## Downloadable examples

The guest-scenario CSV contains:

- $130 for food and drinks per guest.
- $18 for place settings and rentals per guest.
- $12 for stationery and favors per guest.
- A $160 guest-linked cost per guest.
- Totals of $8,000 for 50 guests and $16,000 for 100 guests.
- An $8,000 difference between the two scenarios.

The quote-audit CSV contains ten common review lines, where to find each amount, and where to record it in Planner 2.0. It is a worksheet, not a list of market averages or universal fee rules.

## Fact verification

- IRS guidance confirms that required service charges and voluntary tips are not the same category.
- FTC consumer guidance supports keeping receipts, invoices, contracts, written notes, and copies when resolving problems with a business.
- The article states that local law and contract terms may differ.
- All prices, percentages, and quantities in the worked examples are labeled as fictional calculations.

## Verification

- Desktop layout tested at 1280 x 800.
- Mobile layout tested at 390 x 844.
- No horizontal overflow on the hub, guest guide, or hidden-cost guide.
- Guest guide contains four calculation cards and three exact projection steps.
- Hidden-cost guide contains three audit steps and four Planner field mappings.
- Both new CSV files return HTTP 200 with `text/csv` content.
- Guest CSV totals reproduce the $8,000 difference.
- Quote-audit CSV contains ten complete audit rows and the correct Actual expenses safeguard.
- Updated pages have one H1, valid JSON-LD, unique IDs, and valid local link targets.
- Public copy was checked with the Humanizer method. It uses direct wording, marks fictional examples, and avoids invented market claims.
- Visual checks passed for both new sections on desktop and mobile.
- Existing vendor and budget milestone checks still pass.

Local browser warnings were limited to third-party resources blocked by the isolated test environment. They did not come from the site code changed in this milestone.

## Deliberately unchanged

- Planner calculations and browser-storage schema.
- Canonical URLs and production URLs.
- `ads.txt`, `_headers`, `robots.txt`, `sitemap.xml`, and analytics consent.
- Cloudflare and AdSense settings.
- Production deployment.

## Next milestone

Review the remaining guide library page by page. Keep pages with a distinct user task, combine overlapping material, and repurpose weak pages before any production merge or new AdSense review.
