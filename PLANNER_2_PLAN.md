# Wedding Budget Planner 2.0

## Safety boundary

- Development branch: `feat/planner-2-workspace`
- Final candidate activation: Planner 2.0 opens directly on the homepage. Workspace sections use non-indexed hash links such as `/#vendors` and `/#payments`.
- Without that query parameter, the existing homepage, calculator, exports, content, and storage behavior are unchanged.
- New data uses `weddingBudgetPlanner2.v1`. Legacy `weddingBudgetDate` and `weddingBudgetLocation` keys are not modified by the new workspace.
- No changes are planned for `ads.txt`, canonical tags, public URLs, Cloudflare rules, consent, `robots.txt`, or `sitemap.xml`.

## Current audit

- Homepage: one long dashboard page combining hero, calculator, expense ledger, guest counter, guides, and reports.
- `script.js`: global in-memory state for categories, expenses, and guests; only date and location persist.
- `style.css`: shared across calculator, articles, print report, and responsive presentation; many article-specific and inline styles make global redesign risky.
- Exports: raw expense CSV, print/PDF report, and five-sheet XLSX workbook. They depend on the current global calculator state.
- Articles: ten detailed article pages plus the blog hub, using clean extensionless canonicals and consistent Article metadata. Content consolidation is intentionally deferred.

## Incremental delivery

1. **Milestone 1 — workspace foundation:** feature-flagged left sidebar, compact mobile navigation, overview rollups, vendor true-cost comparator, payment tracker, isolated versioned storage.
2. **Milestone 2 — budget bridge:** implemented as a non-destructive calculator snapshot with editable Planner 2.0 totals; committed, paid, actual, and uncommitted amounts stay separate to prevent double counting.
3. **Milestone 3 — guest scenarios:** implemented with an imported/current guest plan, saved comparisons, adjustable catering-per-guest assumptions, tracked cost per guest, projected totals, and budget headroom.
4. **Milestone 4 — reports:** implemented with focused vendor/payment CSV ledgers, a six-sheet Planner 2.0 Excel workbook, and an integrated print/PDF report while retaining Version 1 exports.
5. **Milestone 5 — content integration:** implemented as compact contextual guide links inside each workflow. Existing articles, clean URLs, metadata, and canonicals remain unchanged; article actions now open final Planner 2.0 hash sections.
6. **Core independence — actual expenses:** implemented as a native Planner 2.0 ledger with add, edit, remove, imported-source preservation, immediate Budget/Overview updates, dedicated CSV, an Excel Expenses sheet, and a PDF expense section.
7. **Release gate:** the final local candidate must pass storage, calculations, exports, clean routes, metadata, desktop, mobile, and print checks. Production merge/deploy still requires explicit approval.
