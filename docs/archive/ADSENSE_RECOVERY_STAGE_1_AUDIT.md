# AdSense Recovery — Stage 1 Forensic Audit

Audit date: September 18, 2026
Scope: current production-equivalent source tree, live crawl rendering, Planner 2.0 calculations and workflows, indexed page set, content differentiation, sourcing, repository/deployment baseline, and AdSense readiness.
Change rule: this stage makes no production code, URL, canonical, consent, Cloudflare, AdSense, or `ads.txt` change.

## Executive conclusion

The site is not thin by word count and Planner 2.0 is a genuine working product. The current rejection is also not an `ads.txt`, ownership, or basic indexing problem. AdSense reports `ads.txt: Authorized` and gives the site-level reason `Low value content`.

The strongest weaknesses are:

1. The homepage source still contains the complete hidden V1 calculator underneath Planner 2.0. A crawler can extract the V1 and V2 interfaces together, including multiple primary headings, conflicting instructions, and old calculator content.
2. The ten guides are substantial but look like one production template repeated ten times: similar hero, author block, three-point summary, tables, FAQ, checklist, tool CTA, and related-guide ending.
3. Most examples are fictional and eight of ten articles have no external sources. There is little first-hand evidence such as original screenshots, documented user tests, real workflow observations, field interviews, or independently collected data.
4. Search demand is still weak. The latest reviewed GSC data showed 3 clicks from 1.48K impressions, 0.2% CTR, and average position 44.7. This is not a Google threshold, but it is weak evidence of the “strong and loyal user base” and audience interest described in AdSense guidance.
5. Several planner details can reduce confidence even though the core math works: hard-coded dollar formatting, an `Other` expense category that has no budget row, a global “Lowest true cost” card that compares unrelated vendor categories, tax applied to every entered charge, and historical payments that can remain after replacing a selected vendor.

The correct response is a focused product-and-evidence rebuild, not another cosmetic rewrite or immediate resubmission on September 24.

## Baseline and rollback record

- Local audit tree: commit `15f30ff`, tree `25dadb62135bdc94d33b4f8d2c0eb6e54010b580`.
- GitHub `main`: merge commit `e91ace6` (`Improve search visibility and guide new Planner users (#15)`), with the same tree hash as the local audit tree.
- This confirms the audited source content is aligned with the latest GitHub main tree even though the local `origin/main` tracking reference has not been fetched since August 19.
- Existing rollback tags include `pre-planner-2-2026-08-17`, `pre-planner-2-safety-release-2026-08-19`, and `pre-backup-preview-2026-08-19`.
- Before Stage 2 production work, fetch the current remote state, branch from `e91ace6`, and create a new pre-recovery rollback tag. Do not build Stage 2 directly on the old local `main` pointer.

Repository hygiene notes:

- `style.css` is reported modified because of line-ending normalization; no textual change appeared in the audit diff.
- `tmp/` is untracked and contains about 59 MB across 1,042 files, including browser profiles and test artifacts.
- There is no `.gitignore`, so temporary test data can easily contaminate later status checks or commits.
- `README.md` still says the sitemap has 15 clean URLs, while the current sitemap has 16 after `/contact` was added.

## Technical and functional verification

Passed:

- `script.js` and `planner2.js` JavaScript syntax checks.
- No duplicate HTML IDs across the 16 HTML pages.
- All JSON-LD blocks parse successfully.
- `robots.txt` allows crawling and points to the sitemap.
- The sitemap contains the intended clean URLs.
- Fresh-user quick start: $40,000, 100 guests, and $130 catering per guest saved correctly; progress moved from 0/6 to 2/6.
- Vendor true-cost arithmetic: $3,000 package + $600 extras + 10% tax = $3,960.
- Two same-category quotes can be compared.
- Selecting a second Photography quote displays the required replacement confirmation and keeps only one selected quote in the category.
- Only the selected vendor is offered in the payment suggestions.
- A $1,000 payment changed correctly between due-soon, paid, and unpaid; paid and still-payable totals returned to the right values.
- A 50-guest scenario at $130 per guest produced a $6,500 catering estimate and the expected projected total/headroom.
- Vendor CSV and Excel export actions completed and reported success in the local browser test.
- Existing source contains a print/PDF report path, versioned backup format, backup preview, and restore validation. These were already tested in earlier release stages and were not destructively repeated against production in this audit.

Important findings:

### P0 — Hidden V1 remains crawlable in the homepage source

`index.html` contains Planner 2.0 followed by the full V1 calculator and V1 content. `planner2.js` adds `planner2-active`, and CSS hides V1 only after JavaScript runs.

The live crawler rendering extracted:

- `Wedding Budget Financial Report` as the first H1,
- the Planner 2.0 workspace,
- old V1 budget allocation, expense history, smart tips, and spending progress,
- old “How to use” instructions and the old $40,000 example.

Human visitors normally see V2, but the source sends mixed product signals to non-visual crawlers. Stage 2 should remove V1 markup and `script.js` from the production homepage after preserving any still-needed migration behavior inside Planner 2.0. Existing `weddingBudgetPlanner2.v1` data must remain untouched.

### P1 — Planner accounting and clarity gaps

- Currency is always displayed with `$`, while site copy says users may enter any currency. Either support a saved currency choice or state clearly that the interface is USD-only.
- `Other` can be selected for expenses and vendors, but `Other` is absent from `defaultCategories`. An `Other` expense reduces overall headroom but has no category budget/status row.
- “Lowest true cost” chooses the cheapest quote across every category. A decor quote and a venue quote are not comparable; the overview should compare within category or show a more meaningful next decision.
- Tax is applied to package price plus every extra. Real taxable bases vary. The UI should explain the assumption, support a fixed tax amount, or allow the user to identify the taxable subtotal.
- Replacing a selected vendor leaves historical payments linked to the old vendor. The warning is good, but overview paid totals can then exceed selected commitments. The product needs a clear cancelled/replaced/historical state rather than relying only on an alert.
- Payment, expense, and scenario removal is immediate. A short undo or confirmation would reduce accidental data loss.
- Stored Planner state relies on a versioned localStorage key but does not store an explicit schema version inside the state. Vendors, payments, and scenarios are only lightly normalized when restored.
- Quick start places the entire estimated guest count in `Others`. This is mathematically correct but can surprise a user who later opens the group breakdown.

### P1 — Runtime and maintenance resilience

- `lucide@latest` is unpinned.
- The large XLSX library loads on every planner visit, even when the user never exports Excel.
- Both dependencies come from third-party CDNs without a local fallback. Pin/self-host the icons and load XLSX only when Excel is requested.
- The site lacks a clean, automated regression suite for actual Planner 2.0 behavior. Existing export scripts mostly recreate sample workbooks instead of exercising the production functions directly.
- Sitemap `lastmod` values for About, Terms, and Contact do not match the last repository commits. Update dates only when a material public change is made; do not bump every page on every deployment.

## Content evidence audit

### What is already strong

- Ten guides contain about 1,100–1,700 main-content words each.
- Titles, descriptions, canonicals, internal links, responsive tables, Article schema, and FAQ schema are present.
- The average-cost article’s key figures were verified against The Knot’s current 2026 article and methodology: $34,200, 10,474 US couples, and weddings completed in 2025.
- The Zola description correctly identifies a planning survey of more than 6,000 couples and avoids treating it as a directly comparable completed-wedding total.
- Fictional figures are usually labeled clearly.
- Legal, tax, contract, accessibility, and safety limitations are usually stated.
- Articles connect to relevant Planner 2.0 sections.

### What still looks low-value or mass-produced

- Every article uses one Unsplash stock image; there are no original planner screenshots, annotated examples, charts generated from the tool, or photographed/observed materials.
- Eight of ten guides have zero external source links. Some do not need market statistics, but safety, accessibility, contract, consumer, and operational claims need a clearer evidence trail where applicable.
- All ten pages use nearly the same editorial shell and ending. Humanizer work improved sentence-level tone but did not change this collection-level pattern.
- Worked examples repeatedly use the same fictional $40,000 budget, categories, and Planner CTA. This creates consistency but not enough independent insight.
- The About page is honest, but authority currently rests mainly on being the tool builder. It does not yet show a public product methodology, testing history, correction log, or first-hand user research.
- The Contact page uses a Yahoo address. A domain address forwarded through Cloudflare Email Routing would provide a more coherent trust signal, though this is not a primary AdSense fix.
- Visible “Updated August 2026” labels are accurate for the large rebuild, but later dates should change only after genuine material review.

Google’s current guidance asks whether content provides original information, reporting, research, or analysis; demonstrates first-hand experience; has a clear primary purpose; and gives users a reason to bookmark or share it. The current collection is useful, but it does not yet answer those questions strongly enough compared with established wedding publishers.

Official references:

- AdSense page readiness: https://support.google.com/adsense/answer/7299563
- AdSense rejection/content guidance: https://support.google.com/adsense/answer/81904
- People-first content self-assessment: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Search Essentials: https://developers.google.com/search/docs/essentials

## Page-by-page decision matrix

| Public page | Decision | Stage 2 direction |
|---|---|---|
| `/` | Keep + major structural improvement | Remove hidden V1 source, keep Planner 2.0 data, make one clear product/methodology story, fix accounting clarity gaps. |
| `/blog` | Keep + improve | Organize by real planning task and format, not a flat collection of similarly presented articles. Feature the strongest tool workflows and evidence. |
| `/blog-create-budget` | Keep as pillar | Turn into the primary end-to-end Planner walkthrough with original screenshots, formulas, sample export, and a clearly explained reserve method. |
| `/blog-vendor-quotes` | Keep as signature guide | Build around the unique true-cost comparator, an original same-scope worksheet, annotated screenshots, and tested replacement/payment behavior. |
| `/blog-catering-budget-guide` | Keep as search pillar | Strengthen the invoice-outward method, tax/service-charge assumptions, a downloadable checklist, and Planner guest/vendor workflows. This matches the strongest observed query opportunity. |
| `/blog-50-vs-100-guests` | Keep + improve | Add an original comparison chart and a reproducible Planner scenario walkthrough. Explain fixed, per-guest, and threshold costs with evidence. |
| `/blog-hidden-costs` | Keep but narrow | Make it a cross-category audit checklist with sourced consumer/tax notes; remove sections that merely repeat vendor and venue guides. |
| `/blog-venue-cost-checklist` | Keep + improve | Add an original venue comparison worksheet and clearer separation of venue, catering, access, weather, and contract evidence. |
| `/blog-planning-timeline` | Keep + improve | Rebuild around a payment calendar/cash-flow example and downloadable timeline rather than another general checklist. |
| `/blog-average-cost-2026` | Keep + maintain carefully | It has the strongest sourcing. Add a transparent update method and original interpretation/chart; review when the underlying source changes. |
| `/blog-spend-vs-save` | Merge/repurpose | Move generic priority advice into the main budget guide. Preserve this URL until an explicit decision, then repurpose it as a unique priority-trade-off worksheet or redirect it safely. |
| `/blog-diy-decor` | Keep only if made first-hand | Rebuild as a documented prototype/cost experiment with original evidence. If no first-hand material can be produced, merge the useful cost logic into hidden-cost/spend-save content later. |
| `/about` | Keep + strengthen | Add real development history, formula/methodology links, test standards, correction log, and what Dan personally built and verified—without inventing credentials. |
| `/contact` | Keep | It serves a valid support purpose. Consider a domain email; do not pad it for word count. |
| `/privacy` | Keep | No content change unless actual data practices change. |
| `/terms` | Keep | No content change unless functionality or legal terms change. |

No public page should be noindexed merely to hide a quality weakness. No current public URL should be removed in Stage 2 without an explicit redirect and preservation decision.

## Stage 2 implementation brief

Stage 2 should be a product-identity and evidence milestone, not a ten-article rewrite.

Recommended order:

1. Create a fresh recovery branch from GitHub main `e91ace6` and tag the current production baseline.
2. Add `.gitignore` rules for local test artifacts without deleting the user’s existing `tmp/` data.
3. Remove the hidden V1 homepage markup and V1 runtime from crawler-visible production source while preserving Planner 2.0 localStorage and backup compatibility.
4. Fix the highest-confidence planner clarity issues: `Other` category accounting, meaningful overview vendor insight, currency claim/behavior, and tax assumption wording.
5. Publish a first-party methodology section/page containing formulas, data boundaries, browser-storage explanation, supported workflows, tested browsers, and a short change log.
6. Create one original “complete plan” walkthrough with first-party Planner screenshots and downloadable sample output. Label the sample fictional; do not create fake testimonials or claim real-couple results.
7. Redesign the blog hub around distinct formats and workflows.
8. Do not resubmit AdSense at the end of Stage 2. Continue with the focused article and first-hand evidence stages, then allow the changed pages to be crawled and used.

## Stage 2 acceptance criteria

- One production-equivalent homepage product exists in the source; V1 is not merely CSS-hidden.
- Existing Planner 2.0 localStorage and backup files still restore correctly.
- Fresh user, returning user, vendor replacement, payment reconciliation, guest scenario, expense, CSV, Excel, PDF, backup, and restore tests pass.
- Homepage has one clear visible/crawlable primary identity and no contradictory legacy instructions.
- Original methodology and walkthrough evidence are visible without claiming credentials or customer outcomes that do not exist.
- No change to `ads.txt`, consent, Cloudflare routing, production canonicals, or clean URLs.
- Deployment remains reversible to GitHub main baseline `e91ace6`.

## AdSense timing decision

Do not request another review on September 24 merely because the throttle expires. The next review should follow the structural cleanup, evidence rebuild, focused content work, crawl confirmation, and a period of measurable genuine use. Google does not publish a traffic threshold, so readiness must be judged from the whole site and sustained signals—not a single daily visitor count.
