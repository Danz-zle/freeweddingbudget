# Planner 2.0 release-readiness checklist

## Current decision

- Candidate branch: `feat/planner-2-workspace`
- Current state: final local cutover candidate passed the August 18, 2026 pre-production audit; not merged, pushed, or deployed.
- Production behavior remains unchanged until explicit approval.
- Rollback path remains the current Version 1 homepage and calculator.

## Verified candidate behavior

- Version 1 handoff imports the total budget, category plan, expense ledger, and guest counts without changing the Version 1 variables.
- Planner 2.0 has its own permanent actual-expense ledger with add, edit, cancel, remove, source labeling, and refresh persistence; it no longer depends on Version 1 for new expense entry.
- Re-import replaces the Planner 2.0 snapshot instead of duplicating expenses.
- Planner 2.0 data persists after refresh in `weddingBudgetPlanner2.v1`.
- Vendor true cost includes package price, required fees, travel, rentals/add-ons, likely overtime, and tax.
- Selecting a quote creates a commitment; payments are cash-flow records and are not added to contract cost again.
- Selected vendors appear as Payment-entry suggestions. Linked payments show contract, scheduled, paid, and still-payable amounts, with a warning when scheduled payments exceed the commitment. Unselecting a vendor removes it from new-payment suggestions without deleting payment history.
- Budget rows display Available, Watch, and Over at the intended thresholds.
- Payments display Scheduled, Due Soon, Overdue, and Paid states.
- Guest scenarios calculate catering, tracked cost per guest, projected total, and headroom using the documented replacement method.
- Overview totals agree with Budget, Vendors, Payments, and imported expenses.
- Overview uses restrained semantic states: green for healthy/completed, amber for watch/due soon, and red for overspend/overdue. It also flags completed payments that exceed selected commitments for review.
- All ten article routes resolve through clean URLs in the production-like local preview.
- All article planner actions open the relevant Overview, Budget, Vendors, Payments, or Guests view.
- All ten articles received a strict Humanizer pass that preserved factual claims, metadata, link targets, and Planner 2.0 instructions. A separate source review checked the current survey, IRS, FTC, USAGov, Ready.gov, and accessibility claims; the Zola sample wording and reference URL were corrected.
- Desktop navigation, 390px mobile navigation, keyboard-accessible guide links, and article mobile layouts were checked without horizontal overflow or browser errors.
- All 16 clean routes return HTTP 200. The same 16 pages passed desktop and 390px mobile overflow checks, with no browser console errors.
- Overview, Budget, Vendors, Payments, Guests, and Reports now respond to both initial hash URLs and same-tab hash changes. Versioned Planner 2.0 assets prevent an older cached script or stylesheet from masking release fixes.
- The blog, all ten articles, About, Privacy, Terms, and Contact use the shared Version 2 content shell. Remaining embedded Version 1 magenta article accents were replaced through the shared content stylesheet.
- The new Contact page is permanent and uses `/contact`. Its approved addition is the only new sitemap destination; existing sitemap URLs and canonical destinations were not changed.
- Vendor CSV, payment CSV, expense CSV, seven-sheet Excel, and integrated PDF are included. All three current CSV files and the seven-sheet workbook were freshly verified at file level; workbook values, sheet ranges, status labels, and formula-error scans passed. The integrated PDF layout was previously rendered and visually verified, and its current report generator includes the actual-expense section.

## Permanent release features

- Left-sidebar desktop workspace and compact mobile navigation.
- Overview, Budget, Vendors, Payments, Guests, and Reports.
- Versioned Planner 2.0 browser storage and safe legacy snapshot parsing.
- Available, Watch, and Over budget states.
- Native actual-expense entry, editing, removal, source tracking, and exports.
- True-cost vendor comparison and selected commitments.
- Payment schedule and status tracking without double counting.
- Guest scenarios, catering assumptions, projections, and headroom.
- Focused CSV exports, seven-sheet Excel workbook, integrated PDF report, and the existing Version 1 PDF pagination fix.
- Contextual guide cards and article workflows aligned to Planner 2.0.
- Existing domain, article URLs, canonicals, metadata, and indexed content structure.

## Final cutover behavior

- Planner 2.0 opens directly on the homepage without an activation query.
- Overview uses `/`; Budget, Vendors, Payments, Guests, and Reports use non-indexed hash links on the existing homepage.
- Temporary Stage labels, bridge controls, import controls, preview exits, and preview-only article URLs are removed.
- Existing `weddingBudgetPlanner2.v1` data always takes priority. A pending Version 1 transfer is imported only if no Planner 2.0 plan exists.
- Local preview infrastructure and test data remain outside the release files.

## Files and configuration that must remain untouched

- `ads.txt`
- Homepage and article canonical destinations unless an explicit URL decision is approved.
- Cloudflare redirects, rewrite rules, and caching rules.
- Consent configuration.
- AdSense publisher configuration.
- GSC ownership and sitemap submission.
- `robots.txt` and `sitemap.xml`, unless a later approved URL change requires an update.

Approved exception: the user approved a dedicated `/contact` page on August 17, 2026, so `sitemap.xml` now contains one new `/contact` entry. No existing sitemap destination was edited or removed.

## Cutover procedure

1. Create a recoverable production snapshot or tag from the current production commit.
2. Record the exact release commit and changed-file list.
3. Confirm the final homepage behavior and hash section links match the approved local candidate.
4. Confirm no temporary stage labels, preview exits, bridge controls, or preview-only URLs remain.
5. Keep the old calculator code available in the rollback commit; do not delete production history.
6. Run syntax, duplicate-ID, protected-file, storage, calculation, export, mobile, keyboard, clean-route, metadata, and print checks on the final build.
7. Review the final local candidate manually before merge.
8. Merge and deploy only after explicit approval.

## Post-deployment checks

- Homepage loads Planner 2.0 without a preview flag.
- Overview, Budget, Vendors, Payments, Guests, and Reports open directly on desktop and mobile.
- A new test plan saves and survives refresh.
- Vendor true cost, selection, payment status, guest scenarios, and all exports work on the live origin.
- Every article and article-to-planner action returns HTTP 200.
- Canonical tags, structured data, sitemap, robots, consent, analytics, AdSense script, and `ads.txt` remain correct.
- Browser console and network requests show no new application errors.

## Rollback procedure

1. Restore the recorded pre-release production commit or deployment.
2. Confirm the Version 1 homepage and calculator load normally.
3. Confirm clean article routes, canonicals, analytics, consent, AdSense, and `ads.txt` remain intact.
4. Do not delete `weddingBudgetPlanner2.v1`; retaining it allows a corrected Planner 2.0 release to recover test or early-user plans.
5. Diagnose on the feature branch and repeat the release gate before another deployment.

Recorded local rollback tag: `pre-planner-2-2026-08-17`, pointing to commit `e96d5501516ca7cc9dd202c502563f85a1031b38`.
