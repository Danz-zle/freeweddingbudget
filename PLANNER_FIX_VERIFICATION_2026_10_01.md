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

## Scope and remaining release checks

No production settings, consent, ads.txt, canonical tags, sitemap, Cloudflare rules, article contents or production URLs changed. Existing unrelated style.css working-tree change was left out.

This verifies the two targeted fixes, not every planner function or device. Final release review should include mobile layout and an existing-plan/backup smoke test against a deployment preview. Saved PDF pagination remains a separate earlier review limitation.

Rollback: before deployment, the live site remains unchanged. After an approved merge, revert this fix commit rather than resetting user planner data. There is no storage schema migration to reverse; newly created budgets remain ordinary editable category values.
