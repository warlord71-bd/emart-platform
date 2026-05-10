# Week 2 SEO Completion Plan

Recorded: 2026-05-10

This is the current handoff anchor for Week 2 SEO completion. Do not infer a different active plan from older broad checklists or completed session logs.

## What Week 2 SEO means now

Use these sources together:

- `apps/web/TASKS.md`, section `Week 2 SEO Completion Plan` — active checklist.
- `workspace/SEO_TODO.md` — baseline SEO policy/checklist; some items are historical or already completed.
- `workspace/docs/gsc-final-indexing-action-plan.md` — GSC manual cleanup playbook.
- `workspace/audit/active/product-seo-audit-summary-20260509-205659.txt` — latest product SEO audit totals; read-only audit, no DB writes made.
- `workspace/audit/active/pa-origin-gap-dry-run-20260508.csv` — current `pa_origin` gap dry-run.

## Active Week 2 scope

- GSC final cleanup: stale/junk URL removals only, keep only `https://e-mart.com.bd/sitemap.xml`, request indexing for selected valid canonical URLs.
- Merchant Center follow-up: inspect/reprocess `gla_2611` after product `2611` was restored to `/shop/innisfree-super-volcanic-pore-clay-mask-100ml`.
- Product SEO audit triage from the 2026-05-09 report: metadata, SKU, brand, image, price, thin description, merchant-schema readiness. Create dry-run/review outputs before Woo mutations.
- `pa_origin` gap close: 21 Emart Combo/Exclusive rows remain intentionally skipped unless owner says otherwise; 21 inferred-brand rows need `product_brand` first, then `pa_origin`.
- `pa_concern` assignment: dry-run/mapping review first.
- Korean Beauty duplicate category decision before taxonomy/code/data changes.
- GA4 DebugView manual check for `headless_migration_404`.

## Do not mix into this plan

- Free LLM pool setup.
- Exonhost to Contabo migration.
- Mobile app release/build/signing work.
- UI redesign or homepage/header/footer/mobile navigation work.
- Broad WooCommerce mutations without dry-run/review.

## Already completed Week 2 technical blockers

- Robots/sitemap canonical cleanup and query-param redirects verified live on 2026-05-06.
- Merchant Center Googlebot/Googlebot-image crawl access fixed and live-verified on 2026-05-06.
- Empty category noindex deployed and live-verified on 2026-05-08.
- Blog/content `/product/` to `/shop/` link cleanup completed on 2026-05-08.
- Tracking-token/broken-path URL policy recorded on 2026-05-10.
