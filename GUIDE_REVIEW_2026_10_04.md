# Guide content review: October 4, 2026

## Status

Completed a local development pass over nine wedding guides and the guide index. This work is on the existing development branch and has not been published.

Each revised guide now leads with a brief checklist, a worked example, clear steps for using the relevant Planner 2.0 section, and optional expandable detail. Existing clean article URLs, canonical URLs, publication dates, worksheets, and source links are retained. The visible and structured modification dates for these nine revised pages are October 4, 2026. The vendor comparison pilot remains dated October 1, 2026.

## Main content corrections

- The budget guide explains that quick setup scales its starting amounts only for a fresh plan. Editing the budget later does not silently rescale the plan.
- The hidden-cost and catering guides distinguish illustrative tax examples from vendor or local tax rules. They explain that the planner applies one tax percentage to the complete entered subtotal.
- The guest-count guide says its projected headroom excludes unbooked category limits and only changes the catering estimate.
- The venue comparison labels its figures as listed subtotals where required items remain unconfirmed. Security at Venue A is still unconfirmed, and a tent allowance is not described as proof of safe shelter.
- The payment worksheet labels cumulative amounts as hypothetical if paid. Its scheduled status is not evidence that payments were made.
- The DIY guide calls out helper time and missing quote scope. The average-cost guide distinguishes studies by sample and planning stage and says those survey averages are not 2026 local prices.
- The timeline is described as an example sequence, not a deadline rule. Local marriage paperwork requirements are referred to the responsible local office.

No example amounts were changed except the venue worksheet's descriptive column labels. Calculations are checked in the automated tests.

## Source checks

The research-backed average-cost statements and safety/tax references were checked against these sources:

- The Knot, average wedding cost and 2026 Real Weddings Study: https://www.theknot.com/content/average-wedding-cost
- Zola, 2025 First Look Report: https://www.zola.com/expert-advice/2025-wedding-trends-zolas-first-look-report-data-deep-dive
- IRS, tip recordkeeping and reporting: https://www.irs.gov/businesses/small-businesses-self-employed/tip-recordkeeping-and-reporting
- USAGov, marriage certificate and license information: https://www.usa.gov/marriage-certificate
- U.S. Fire Administration, candle safety: https://www.usfa.fema.gov/prevention/home-fires/prevent-fires/candle/
- U.S. Consumer Product Safety Commission, extension-cord safety: https://www.cpsc.gov/s3fs-public/5032.pdf
- U.S. Department of Justice, ADA Title III primer and design standards: https://www.ada.gov/resources/title-iii-primer/ and https://www.ada.gov/law-and-regs/design-standards/2010-stds/
- Federal Trade Commission, keeping records in business disputes: https://consumer.ftc.gov/articles/solving-problems-business-returns-refunds-and-other-resolutions
- FEMA app information: https://www.ready.gov/fema-app

The timeline's FEMA link was not independently verified during the source review; it is presented as one possible alert source, not as a guarantee. Local rules vary. These guides give general information, not legal, tax, safety, or event-specific advice.

## Verification

- Automated planner, guide, and worksheet checks: 53 passed, 0 failed.
- Desktop: all nine article routes loaded; each primary button opened its intended planner section; expandable details opened.
- Mobile at a 375 px page width: all nine routes fit the viewport without horizontal page overflow. Tables remain within scrollable regions, and the checklist is not duplicated by an older mobile style.
- Preview hub: all ten article links and their displayed dates checked.
- `git diff --check`: passed.

The review checks HTML, planner navigation, and CSV formulas. It does not certify every legal or venue-specific requirement, and it cannot predict AdSense approval.
