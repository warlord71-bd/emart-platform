# Week 2 SEO Completion Plan

Recorded: 2026-05-10

This is the current handoff anchor for Week 2 SEO completion. Do not infer a different active plan from older broad checklists or completed session logs.

## 2026-05-12 GSC Reprioritization

Latest owner-provided GSC evidence:

- Indexed: 5.38K.
- Not indexed: 65.1K.
- Crawled currently not indexed: 40,609.
- Alternate page with proper canonical: 16,008.
- Not found 404: 3,075.
- Page with redirect: 2,564.
- Blocked by robots.txt: 2,291.
- Excluded by noindex: 182.
- Server error 5xx: 47.
- Duplicate without user-selected canonical: 31.
- Redirect error: 1.
- 403: 1.
- Indexed though blocked by robots.txt: 96.
- Sitemap `/sitemap.xml`: success, last read May 11, discovered pages 4,464.
- Performance last 3 months: 2.34K clicks, 79.1K impressions, CTR 3%, average position 7.5.
- Last 7 days trend improved, but 3-month impressions/clicks are still down.
- Top pages still include old `/product/*` URLs with clicks/impressions.
- Product snippets: 481 clicks / 17,867 impressions.
- Merchant listings: 0 clicks / 512 impressions.
- Merchant opportunities: about 3.65K approved/visible products, 42 not approved.

Interpretation rule:

- Some GSC issues may already be fixed live but still visible because Google is slow to recrawl and reprocess.
- Do not assume every GSC count is an active bug.
- Classify every sampled GSC issue as:
  - A. already fixed, waiting for Google
  - B. still live issue
  - C. intentionally excluded/noindex/blocked
  - D. old junk URL
  - E. important URL needing action

New priority order:

- P0 — Old `/product/*` URL migration audit and 301/canonical verification.
- P1 — Crawled currently not indexed URL sample classification.
- P2 — 404 and redirect cleanup for valuable URLs only.
- P3 — Indexed though blocked by robots.txt review.
- P4 — Sitemap submitted URLs vs indexed clean canonical URL validation.
- P5 — Merchant listings / Merchant Center follow-up.
- P6 — Product data SEO triage: metadata, SKU, brand, image, price, thin description, `pa_origin`, `pa_concern`.
- P7 — CTR improvement for high-impression product/category pages after Google recrawls latest title fix.
- P8 — GA4/Site Kit/Meta tracking review.
- Later — Ahrefs/Semrush, paid ads, backlinks, competitor campaigns.

Next action:

- Export GSC sample URLs for Crawled currently not indexed, Alternate canonical, 404, Page with redirect, Blocked by robots, and Indexed though blocked.
- Test samples live before changing code.
- For old `/product/*` URLs, verify 301 to `/shop/*`, final canonical, title, status, and sitemap presence.

2026-05-11 audit update:

- P0 old `/product/*` migration audit completed: sampled URLs 301 to clean `/shop/*`, final pages return 200, canonicals are clean `/shop/*`, pages are `index, follow`, clean `/shop/*` URLs are in sitemap, and old `/product/*` URLs are absent from sitemap. Classification: A — already fixed, waiting for Google. Report: `workspace/audit/active/p0-product-url-migration-audit-20260511.md`.
- P1 Crawled currently not indexed export classified from 1,035 GSC rows. Pattern counts: 409 root/query junk, 346 old `/product/*`, 113 current `/shop/*` product, 44 policy/static/other, 43 current `/brands/*`, 37 old `/product-tag/*`, 19 old `/product-category/*`, 12 `_next/static`, 6 current `/category/*`, 6 old `/product-brand/*`.
- P1 live-tested 106 representative URLs. Classification counts: A=61, D=43, E=2, B=0, C=0. Report: `workspace/audit/active/p1-crawled-not-indexed-classification-20260511.md`.
- P1 important URL owner-review candidates: `/shop/cosrx-advanced-snail-96-mucin-power-essence-30ml-mini` and `/brands/april-skin`.
- P1 possible technical follow-up: query/filter variants that survive as indexable `/shop?filter_brand=...` or `/shop?per_row=...`; inspect live samples before code changes.

Week 2 policy:

- Site health first: clean index, correct canonical/redirect behavior, sitemap accuracy, product schema, Merchant Center readiness, and product data quality.
- Do not start paid ads, Ahrefs/Semrush competitor work, backlink campaigns, or broad content campaigns in Week 2.
- Paid growth tools can be considered later only after GSC index cleanup and Merchant/Product data issues are stable.

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
- Product/brand title authority fix completed, deployed, and pushed as `f6ef19f`.
  - Product titles now use `{ProductName} Price in Bangladesh | Emart`.
  - Brand titles now use `{BrandName} Bangladesh | Authentic {BrandName} Products | Emart`.
- The Derma Co stale Korea/Korean/K-beauty visible copy and SEO meta cleanup completed in `c5d0259`.
  - 43 The Derma Co products checked.
  - 0 stale visible-copy matches remain.
  - 0 stale SEO meta matches remain.
  - `pa_origin=India` remains applied for 43 products.
