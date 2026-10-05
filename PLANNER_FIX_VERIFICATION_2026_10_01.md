# Payment dates and quick-start verification

Branch: `fix/payment-dates-quick-start`, based on production commit `d73ce0a`.
Status: local implementation and scoped verification complete; not pushed, merged or deployed.

## Changes

- Payment status compares local calendar dates rather than rounding an elapsed interval. Yesterday is overdue immediately after local midnight; today through 14 days ahead is due soon. Paid overrides the date. Calendar arithmetic avoids daylight-saving-hour differences.
- Add-payment feedback uses the same status function as tables, overview and exports.
- Brand-new quick setup scales untouched default categories to the entered budget, to cents. It takes users to Budget with review incomplete. Repeat setup cannot replace an already-started plan; custom categories are not rescaled.
- A confirmation button completes category review. It is disabled when categories exceed the budget. Changing the total or a category requires review again, including on imported plans. The stored financial records and storage/backup schemas are unchanged.
- Category inputs accept cent amounts and have accessible labels. The planner asset URL is versioned for the change. Tests are excluded from hosted assets.

## Verification

`node --check planner2.js` passed. `node --test tests/planner-regressions.test.cjs` passed all 12 tests.

The dependency-free tests execute the actual helpers and handlers extracted from the production script. They cover local midnight, yesterday/today/14-day/15-day boundaries, paid status, daylight-saving dates, year and leap-year boundaries across Taipei, Los Angeles, London and Auckland; allocation rounding; fresh/repeated/invalid setup; over-budget confirmation; edits and imported/custom state preservation. They are not a substitute for full DOM/browser tests.

Browser checks on the local development origin:

1. USD 30,000 / 80 guests / USD 100 catering setup produced category limits totaling 30,000 (Venue 8,250; Catering 9,750; Photography 3,000; Decor 3,000; Entertainment 2,625; Attire 2,250; Transportation 1,125; Other 0).
2. Budget review remained incomplete (1/6 checklist, guest count only). Reducing total to 20,000 disabled confirmation. Returning it to 30,000 and confirming produced 2/6, retained after reload.
3. Added and selected Date regression venue, contract 5,000. Added three 1,000 payments due September 30, October 1, October 16. On October 1, statuses were overdue, due soon and scheduled respectively. Add-payment feedback agreed.
4. Mark paid showed paid; mark unpaid restored overdue. Reload preserved rows. Overview showed next due 1,000 overdue, one due-soon and one overdue payment, committed 5,000 and uncommitted 25,000 (payments not double-counted).
5. Final category input had step 0.01, accessible label, and valid value 8,250. Review control was visually inspected. No browser console errors were captured during these checks.
6. At a 390 x 844 viewport, Budget fields and the category review explanation/button were readable and within the page. The document client width and scroll width were both 375 px (no page-level horizontal overflow). Existing wide tables scroll horizontally within their cards. Payment badges and actions were visually checked at the right side of the payment table: overdue, due soon and scheduled remained readable. The viewport override was reset afterward. This is responsive desktop-browser testing, not a physical-phone test.
7. Reran the 12 automated regression tests after the mobile check: all passed. No browser permissions were changed.
8. User selected the September 30, 15:43:25 fictional test backup in the in-app browser on the local origin. Restore confirmation showed compatible version 1, total 30,000, 2 quotes/1 selected, 2 payments/1 paid, 1 expense, 60 guests, 1 scenario and checklist 6/6. Keyboard activation completed restoration; automated pointer clicks in that in-app tab did not advance either confirmation or navigation, while keyboard activation worked. No console errors were captured.
9. Reloaded before checking the restored records. Overview showed 30,000 total, 4,266 committed, 1,000 paid, 150 actual expenses, 25,584 uncommitted, next due 3,266 on October 4 and checklist 6/6. All eight category limits matched the source backup (8,000 / 9,000 / 4,500 / 2,000 / 2,000 / 2,000 / 1,000 / 1,500); no quick-start reallocation occurred. Expense Test marriage licence remained Other / 150. Silverline remained comparing at 4,374 and Willow selected at 4,266. Payment deposit remained paid / 1,000 / September 29; balance unpaid / 3,266 / October 4, due soon. Guest counts remained Family 35, Friends 25, others zero, rate 100; Test intimate 60 scenario showed projected total 10,416 and headroom 19,584.
10. Backup export showed the application's downloaded-success message, but the in-app browser did not expose a completed download file to automation. Therefore this pass confirms persisted UI records against the source backup, not a byte-for-byte re-export comparison or successful file delivery. Earlier production/Edge export checks are separate evidence, not proof of this local download.

## Scope and remaining release checks

No production settings, consent, ads.txt, canonical tags, sitemap, Cloudflare rules, article contents or production URLs changed. Existing unrelated style.css working-tree change was left out.

This verifies the two targeted fixes, not every planner function or device. Mobile layout and existing-plan/backup restoration have passed scoped local checks. The fix is ready for production-change review, not yet deployed. A deployed preview/production smoke check is required at its respective release stage. The in-app browser download-delivery limitation above and saved PDF pagination remain separate review limitations.

Rollback: before deployment, the live site remains unchanged. After an approved merge, revert this fix commit rather than resetting user planner data. There is no storage schema migration to reverse; newly created budgets remain ordinary editable category values.
