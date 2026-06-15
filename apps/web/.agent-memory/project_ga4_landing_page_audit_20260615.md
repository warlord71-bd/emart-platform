---
name: ga4_landing_page_audit_20260615
description: Whole-site GA4 landing-page audit 2026-06-15 — /category 404s fixed (a0ac1a6), 96 PDP 404 redirect map awaiting review
metadata:
  type: project
---

GA4 "Landing page" report (1,439 unique paths, 4,816 sessions, 2026-05-19 to 2026-06-15) was audited against live routes.

**Fixed and deployed (`a0ac1a6`)**: 21 stale `/category/*` 404s (~48 sessions/4wk) — legacy nested WooCommerce category paths (`/category/parent/child`, unmatchable by Next's single-segment `[slug]` route) and old single/brand category slugs. All now 301 to the correct `/category/[slug]` or `/brands/[slug]`. Full list in `next.config.js` under the "Whole-site landing-page audit 2026-06-15" comment block.

**Awaiting owner review — NOT deployed**: 96 distinct `/shop/[slug]` PDP 404s (140 sessions/4wk). Root cause: products renamed/re-slugged (2026-05-29 size-correction workflow + humanizer work) without redirects. Candidate redirect map at `workspace/audit/active/pdp-404-redirect-map-20260615.csv`:
- 35 HIGH confidence (51 sessions) — near-exact slug match (dedup `-2` suffix, hyphen reorder, size-variant of same product). Safe to apply as 301s directly.
- 24 MEDIUM (30 sessions) — same product line, different variant/size. Needs quick eyeball review before applying.
- 37 LOW (59 sessions) — no good specific-product match; `fallback_target` column suggests `/brands/<brand>` (derived from slug brand-prefix) or `/shop`. Likely genuinely discontinued products.

[[brand_taxonomy_audit_20260615]] — the `/brands/*` portion of this audit was already clean (162 sessions, all 200), confirming that fix held.
