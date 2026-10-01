# Vendor quote guide pilot

Status: local preview only. No push, merge, deployment or AdSense request.

## Editorial changes

- Replaced the decorative image and repeated introductory workflows with a four-item checklist, the existing fictional comparison, and a direct Vendors action.
- Kept the detailed questions in six native expandable sections. They remain in the HTML and work without custom JavaScript.
- Applied the Humanizer draft/audit/revision process: removed repeated explanations, developer-facing test narration, dramatic headings and redundant calls to action. Did not invent customer stories, credentials, market prices or testimonials.
- Preserved all example amounts and the existing CSV. Clarified that 8% is an assumption, the category limit is an example, and the link does not import example records.
- Corrected the tax instruction to match the percentage-only field. It describes an effective-rate calculation and possible rounding rather than suggesting a nonexistent tax-amount input.
- Retained the one-selected-quote rule and payment-history warning; clarified that a planner selection does not cancel a real contract.
- Linked UK CMA cancellation guidance with a jurisdiction label, without making universal refund or deposit claims. Source checked: https://www.gov.uk/government/publications/cancelling-goods-or-services-guide-for-consumers/cancelling-goods-or-services
- Updated the visible revision date and Article dateModified to the genuine editing date, October 1, 2026. Removed the old FAQ JSON-LD rather than leave questions/answers out of sync. Article schema, original publication date, canonical and clean production URL remain.

## Verification

- All 12 existing planner regression tests and 4 new guide checks pass (16 total).
- New checks cover section order, local link targets/anchors, unique IDs, valid Article JSON, dates/canonical, and worked-example arithmetic against the existing CSV.
- Code reviewed for true-cost calculation, guide context routing, selected-vendor payment eligibility, replacement confirmation and historical payments.
- Browser checked at 1280 x 900 and 390 x 844. Document widths matched scroll widths: 1265 px desktop, 375 px mobile. No page-level horizontal overflow. The comparison has its own scrollable region.
- Opened the tax disclosure with the keyboard and verified its expanded state and readable phone-width layout.
- Followed the main action to /?guide=vendors#vendors: heading Vendors and the vendor-guide continuation message both appeared. Returned to the article and reset the temporary viewport.
- No console errors captured during the guide-to-planner check. Automated pointer input in the in-app browser was unreliable in earlier work, so keyboard activation was used.
- CSV values and the local asset were checked; file delivery was not retested in the in-app browser. This is not a new full legal review or a test on physical phones.

## Release boundary

Only this guide, its tests and this review note are added in this pilot. Existing planner fixes remain separate local commits. The pre-existing style.css working-tree change is untouched. Consent, AdSense configuration, ads.txt, canonicals, Cloudflare rules and production routes are unchanged.

Review this guide before applying the structure to the rest. Improved usefulness is the objective; this test does not predict AdSense approval or search traffic.
