# AdSense Recovery Stage 3: Milestone 6

Date: September 21, 2026
Branch: `adsense-recovery-stage3`
Starting point: Milestone 5 commit `31ae2fe`

## Goal

Finish the last two Stage 3 evidence formats: a reproducible payment calendar and a transparent survey-source check.

## Payment-calendar guide

The planning-timeline guide now includes:

- A 12-row payment schedule for five fictional contracts.
- A verified $35,000 contract total.
- $7,875 paid at booking stages and $27,125 still due later.
- A visible check showing that the later payments equal 77.5% of the contract total.
- A downloadable CSV with payment stage, example timing, amount, cumulative paid, remaining contract balance, and planner status.
- A clear instruction to replace example timing with the dates in each signed contract.
- FAQ structured data aligned with the visible FAQ.
- USAGov and FTC references checked against their current pages.

## Average-cost source check

The average-cost guide now includes:

- The Knot's $34,200 completed-wedding average and its 10,474-couple survey population.
- Zola's $36,000 planning-survey figure and its population of more than 6,000 couples getting married in 2025.
- A warning that the $1,800 difference is not a direct measure of a market price change.
- A downloadable CSV that records publication date, population, wedding year, reported average, measurement type, and planning use.
- A visible source-review panel and updated September 2026 label.
- FAQ structured data aligned with the visible FAQ.

## Verification

- Desktop layout tested at 1280 x 800.
- Mobile layout tested at 390 x 844.
- No horizontal overflow on the blog hub or either updated guide.
- Payment guide contains four visible calculation cards.
- Average-cost guide contains three visible source cards.
- Both CSV files return HTTP 200 with `text/csv` content.
- Payment rows total $35,000, booking rows total $7,875, later rows total $27,125, and every final contract balance reaches $0.
- Source rows preserve the $34,200 and $36,000 figures and label the different survey methods.
- Both pages have one H1, valid JSON-LD, unique IDs, and valid local link targets.
- Public copy was checked with the Humanizer method. The revised text contains no em dash, en dash, curly quotation mark, or flagged stock AI phrase.
- All earlier Stage 3 structure and calculation checks still pass.

Browser warnings were limited to third-party resources blocked by the isolated test environment. They did not come from the site code changed in this milestone.

## Deliberately unchanged

- Planner calculations and browser-storage schema.
- Canonical URLs and production URLs.
- `ads.txt`, `_headers`, `robots.txt`, `sitemap.xml`, and analytics consent.
- Cloudflare and AdSense settings.
- Production deployment.

