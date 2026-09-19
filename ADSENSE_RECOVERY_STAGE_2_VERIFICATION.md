# AdSense Recovery Stage 2 Verification

Verification date: September 18, 2026
Branch: `adsense-recovery-stage2`
Production baseline: GitHub `main` commit `e91ace6`
Rollback tag: `pre-adsense-recovery-stage2-2026-09-18`
Release state: local candidate only. Not pushed, merged, or deployed.

## Stage 2 outcome

Stage 2 removes the hidden Version 1 homepage source and leaves one visible, crawlable Planner 2.0 product. It also fixes the highest-confidence accounting and clarity issues found in the Stage 1 audit.

Implemented:

- Removed the old Version 1 homepage markup and its `script.js` runtime.
- Added a narrow `.gitignore` rule for local `tmp/` browser profiles, downloads, and test fixtures without deleting those files.
- Kept the existing `weddingBudgetPlanner2.v1` browser-storage key and Version 1 backup format so current Planner 2.0 data remains compatible.
- Moved the CSV, date-label, and Excel worksheet helpers that Planner 2.0 still needs into `planner2.js` before deleting `script.js`.
- Added an explicit state schema version and normalization for saved vendors, payments, expenses, guest counts, scenarios, categories, progress, and settings.
- Added a permanent `Other` budget row. It shows `Not set` when unused and `Over` when an unplanned Other expense exists.
- Added a saved display-currency choice for USD, EUR, GBP, AUD, CAD, NZD, SGD, MYR, TWD, and HKD. This changes display formatting only and does not convert amounts.
- Replaced the unrelated global lowest-vendor card with like-for-like comparisons inside each vendor category.
- Clarified that the tax rate applies to the package price and every entered extra.
- Added an alert when payments remain linked to a vendor that is no longer selected.
- Added confirmation before deleting a payment, expense, or guest scenario.
- Added an original calculation-method section, a reproducible fictional photography comparison, and a downloadable example CSV.
- Added currency to CSV, Excel, PDF, and backup-preview output.
- Fixed the worked-example table so it cannot widen the page on small screens.

## Protected items

No Stage 2 change was made to:

- `ads.txt`
- canonical URLs
- production URLs
- `robots.txt`
- `sitemap.xml`
- Cloudflare rules
- consent configuration
- AdSense account or publisher settings

## Static verification

Passed:

- `planner2.js` JavaScript syntax.
- 90 unique HTML IDs.
- All 3 JSON-LD blocks parse successfully.
- All 16 local `href` and `src` targets resolve in the source tree.
- The homepage has exactly one H1.
- No homepage reference to `script.js` remains.
- No legacy homepage markers remain for the Version 1 dashboard, old hero, countdown, or old financial-report heading.
- Git whitespace validation.
- Humanizer check of new public copy: no em dash, en dash, or curly quotation marks remain in the changed homepage and Planner copy.

## Browser workflow verification

The local production-equivalent site was tested in a clean browser workspace.

Passed:

- Fresh quick start with a 50,000 budget, 100 guests, and 125 catering per guest.
- Currency change to TWD and persistence after navigation.
- `Other` expense of 200, including a zero planned amount, negative availability, and `Over` status.
- Photography quote calculations: Silverline 4,374 and Willow 4,266.
- Same-category vendor replacement confirmation and one selected commitment after replacement.
- Overview comparison: Willow is 108 below the next Photography quote.
- Payment creation, mark paid, mark unpaid, paid total, and still-payable reconciliation.
- Guest scenario projection for 60 guests.
- Vendor CSV action.
- Seven-sheet Excel export action.
- PDF print report generation with the selected currency and current planner records.
- Planner backup download.
- Version 1 backup preview, restore, reload persistence, and restored currency, budget, vendor, expense, payment, guest, scenario, and progress values.
- No browser warnings or errors after the workflow tests.

## Older saved-data compatibility

The current normalization code was executed against an older Version 1 backup state that had no `settings` object and no `Other` category.

Passed:

- Upgraded to state schema 2.
- Defaulted display currency to USD.
- Injected `Other: 0` without changing the saved categories.
- Preserved the 27,500 total budget.
- Preserved 50 guests.
- Preserved the selected vendor.
- Recalculated the vendor true cost as 5,775 from the original fields.

The browser restore UI was separately tested with a Version 1 backup and passed. The no-settings compatibility check used the actual `planner2.js` normalization path in an isolated Node VM because the browser automation session could not reacquire a second temporary local file after the first restore test.

## Responsive verification

Passed at 390 x 844:

- Mobile brand and trust badges are visible.
- Seven planner navigation buttons and five information links remain available in the fixed bottom navigation.
- Method and worked-example cards use one column.
- No horizontal overflow after the table-containment fix.

Passed at 768 x 1024:

- Compact navigation, mobile identity, two-column summary cards, and one-column evidence cards render without horizontal overflow.

Passed at 1440 x 900:

- Desktop brand and sidebar render correctly.
- The complete sidebar fits without internal scrolling.
- Method and worked-example cards use two columns.
- No horizontal overflow.

## Rollback and release decision

The rollback point is the tag `pre-adsense-recovery-stage2-2026-09-18`, which points to the unchanged production baseline. The old calculator also remains available in Git history even though its duplicate live source has been removed from this candidate.

Stage 2 is suitable for local sign-off. It must not be pushed, merged, or deployed until the user gives explicit production approval.

Stage 3 should focus on distinct first-party evidence and content architecture. It should not repeat a cosmetic rewrite of all articles or trigger an immediate AdSense resubmission.

## Codex review follow-up

Follow-up date: September 20, 2026

A dedicated Codex review compared Stage 2 commit `3d14fc8` with production baseline `e91ace6`. No critical or high-risk regression was found. Two report-format inconsistencies were corrected:

- Excel Summary and Guest Plan sheets now apply currency formatting only to financial rows. Payment totals and guest counts remain ordinary numeric cells.
- The PDF budget table now shows an unused zero-value `Other` category as `Not set`, matching the workspace and Excel report.

Follow-up checks passed:

- JavaScript syntax and Git whitespace validation.
- An isolated test of the actual `appendSheet` helper confirmed that summary and guest-count cells do not receive currency formatting while budget and catering values do.
- Browser Excel export completed without a warning or error.
- Browser PDF generation showed `Other` as `Not set`.
- Browser console remained free of warnings and errors.

The follow-up remains local and has not been pushed, merged, or deployed.
