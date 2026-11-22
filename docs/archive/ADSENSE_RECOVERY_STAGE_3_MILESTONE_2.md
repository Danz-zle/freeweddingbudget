# AdSense Recovery Stage 3: Milestone 2

Date: September 20, 2026  
Branch: `adsense-recovery-stage3`  
Starting point: Milestone 1 commit `27b1db9`

## Goal

Turn the main budget article into a first-party Planner 2.0 walkthrough instead of another general wedding budget article.

## What changed

- Added the four calculations used to explain category availability, overall uncommitted budget, payment progress, and category allocation.
- Added a plain-language ledger showing why planned amounts, commitments, payments, and other expenses must stay separate.
- Added a tested six-step path from fresh setup through report export and backup restore.
- Added a downloadable category CSV with two complete $40,000 examples.
- Updated the blog hub to identify the article as a tested walkthrough.
- Updated the article modification date because the page changed materially.
- Added a safe icon-library fallback to the article.

## Downloadable budget examples

The new CSV contains:

- The exact Planner 2.0 starting category values.
- A fictional reserve-first alternative that moves $5,000 into Other.
- A total row that confirms both examples equal $40,000.
- Notes about what to check in each category.

The reserve-first column is labeled as an example, not a recommended percentage or market rule.

## Milestone 1 correction

The vendor article and static vendor CSV already produced the correct true-cost totals. During this milestone, the individual fee, travel, add-on, and overtime rows were aligned with the planner's own downloadable example. The article, static CSV, and Planner 2.0 example now use the same inputs as well as the same totals.

## Verification

- Desktop layout tested at 1280 x 800.
- Mobile layout tested at 390 x 844.
- No horizontal overflow on the hub, vendor guide, or budget guide.
- Budget guide contains four calculation cards, four ledger rows, and six tested workflow steps.
- Both downloadable CSV files return HTTP 200 with `text/csv` content.
- Both budget columns total $40,000 and the reserve-first Other row equals $5,000.
- Vendor inputs reproduce $4,374 and $4,266 true costs with a $108 difference.
- Updated pages have one H1, valid JSON-LD, unique IDs, and valid local link targets.
- Public copy was checked with the Humanizer method. It uses direct wording, labels fictional examples, and avoids invented market claims.
- Visual checks passed for the formula cards and full tested path on desktop and mobile.
- `planner2.js` syntax and repository whitespace checks passed.

Local browser warnings were limited to third-party resources blocked by the isolated test environment. They did not come from the site code changed in this milestone.

## Deliberately unchanged

- Planner calculations and browser-storage schema.
- Canonical URLs and production URLs.
- `ads.txt`, `_headers`, `robots.txt`, `sitemap.xml`, and analytics consent.
- Cloudflare and AdSense settings.
- Production deployment.

## Next milestone

Rebuild the guest-count and hidden-cost guides so each has a distinct purpose, calculation trail, and useful download. After that, review the remaining article library for pages that should be kept, combined, or repurposed before any AdSense resubmission.
