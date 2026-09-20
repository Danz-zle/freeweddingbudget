# AdSense Recovery Stage 3: Milestone 5

Date: September 21, 2026
Branch: `adsense-recovery-stage3`
Starting point: Milestone 4 commit `3395764`

## Goal

Give the catering and venue guides separate, reproducible worksheets that connect directly to Planner 2.0 without inventing missing quote details.

## Catering invoice worksheet

The catering guide now includes:

- A visible calculation for 100 guests at $85 each.
- A fictional 20% mandatory service charge.
- Six fictional vendor meals at $35 each.
- A verified $10,410 subtotal.
- Tax, rentals, delivery, gratuity, and overtime marked as unconfirmed.
- A downloadable CSV that maps known amounts to Planner 2.0 fields.
- An IRS source note explaining that required service charges and voluntary tips are different for U.S. federal tax purposes.

The page does not present $10,410 as the final invoice. The worksheet keeps missing lines visible until the user receives written amounts.

## Same-scope venue worksheet

The venue guide now includes:

- Three fictional venue options using the same event scope.
- Visible calculations for $4,000, $6,200, and $5,800 comparable totals.
- A downloadable CSV with package, staffing, cleanup, rentals, furniture, and weather-backup fields.
- Clear treatment of included items as $0 added cost inside the comparison, not as items with no value.
- Unconfirmed tax, access hours, catering rules, and contract terms in every row.
- An FTC source note for retaining contracts, invoices, receipts, and communication records.
- Existing U.S. ADA source guidance retained for accessibility review.

The worksheet demonstrates why Venue B's lower headline rental does not produce the lowest comparable total.

## Verification

- Desktop layout tested at 1280 x 800.
- Mobile layout tested at 390 x 844.
- No horizontal overflow on the blog hub or either updated guide.
- Catering guide contains four visible invoice calculation cards.
- Venue guide contains three visible comparison cards.
- Both new CSV files return HTTP 200 with `text/csv` content.
- Catering rows reproduce the $10,410 subtotal and preserve blank unconfirmed amounts.
- Venue rows reproduce all three comparable totals.
- Both pages have one H1, valid JSON-LD, unique IDs, and valid local link targets.
- Visible venue FAQs and structured venue FAQs use matching questions and answers.
- Public copy was checked with the Humanizer method. The revised text contains no em dash, en dash, curly quotation mark, or flagged stock AI phrase.
- Existing vendor, budget, guest, hidden-cost, upgrade, and DIY checks still pass.

Local browser warnings were limited to third-party resources blocked by the isolated test environment. They did not come from the site code changed in this milestone.

## Deliberately unchanged

- Planner calculations and browser-storage schema.
- Canonical URLs and production URLs.
- `ads.txt`, `_headers`, `robots.txt`, `sitemap.xml`, and analytics consent.
- Cloudflare and AdSense settings.
- Production deployment.

## Next milestone

Complete the two remaining evidence formats:

1. A dated payment-calendar download for the planning-timeline guide.
2. A transparent source-update method and reproducible interpretation table for the average-cost article.

After those two pages pass the same checks, perform the full Stage 3 sign-off across the entire guide library.
