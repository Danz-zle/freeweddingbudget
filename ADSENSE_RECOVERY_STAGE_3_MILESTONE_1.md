# AdSense Recovery Stage 3: Milestone 1

Date: September 20, 2026  
Branch: `adsense-recovery-stage3`  
Starting point: verified Stage 2 commit `04dfc2e`

## Goal

Begin the content evidence rebuild without changing Planner 2.0 logic or production behavior.

## What changed

- Reorganized the blog hub around four user decisions instead of presenting ten similar article cards first.
- Added a featured true-cost example that connects the guide hub to the vendor comparator.
- Rebuilt the vendor quote guide around the actual Planner 2.0 fields and tested workflow.
- Documented what selecting a quote changes in Budget and Payments.
- Added a downloadable CSV with the same fictional vendor example used in the planner.
- Updated the vendor guide's modification date because the article changed materially.
- Added a safe fallback so the two updated pages do not throw an error if the external icon library is unavailable.

## Evidence added

The vendor guide now shows:

- The exact true-cost formula used by Planner 2.0.
- An eight-row comparison for Silverline Photography and Willow Photo Studio.
- A verified $108 difference after both quotes use the same cost fields and 8% tax assumption.
- The tested compare, select, replace, and payment sequence.
- A CSV whose figures reproduce the article and planner example.

The examples are clearly described as fictional planning examples, not market prices or user results.

## Verification

- Desktop layout tested at 1280 x 800.
- Mobile layout tested at 390 x 844.
- No horizontal overflow on either updated page.
- Blog filters still show the expected vendor guide group.
- CSV returns HTTP 200 with `text/csv` content.
- CSV formulas reproduce the displayed tax and true-cost figures.
- Both pages have one H1, valid JSON-LD, unique IDs, and valid local link targets.
- Public copy was reviewed with the Humanizer method for direct language, factual limits, and repetitive AI-style patterns.
- `git diff --check` passed.

Local browser warnings were limited to third-party resources blocked by the isolated test environment, including Unsplash, AdSense, and the icon CDN. No local application error remained.

## Deliberately unchanged

- Planner calculations and localStorage schema.
- Canonical URLs and production URLs.
- `ads.txt`, `_headers`, `robots.txt`, and `sitemap.xml`.
- Cloudflare, analytics consent, and AdSense settings.
- Existing guide URLs.
- Production deployment.

## Next milestone

Turn the create-budget pillar into a first-party walkthrough with the planner's real category logic, reserve method, and report flow. Then review the guest-count and hidden-cost guides for distinct evidence before deciding which weaker articles should be merged or repurposed.
