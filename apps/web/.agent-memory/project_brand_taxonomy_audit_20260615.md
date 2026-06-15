---
name: brand_taxonomy_audit_20260615
description: Brand taxonomy/SEO audit and fixes applied 2026-06-15 (deployed e041df7)
metadata:
  type: project
---

Full audit of `wp-admin/edit-tags.php?taxonomy=product_brand` (405 terms) and `/brands` + `/brands/[slug]` meta/snippets/canonical/schema. Base architecture (Brand/BreadcrumbList/CollectionPage/ItemList JSON-LD, canonical, OG) is correct — verified on `/brands/cosrx`.

Fixes applied and deployed live (commit `e041df7`):
1. Removed stale `/shop` redirects + `REDIRECTED_BRAND_SLUGS` sitemap exclusions for Innsaei (7 products), Sadoer (18), Laxzin (7), Healthy Place (3) — these brands now have live inventory but were still redirected away from before. Now serve normal `/brands/[slug]` pages and appear in sitemap.
2. Removed broken redirect chain `/brands/dr-jart → /brands/dr-jart-plus` (target brand doesn't exist in WC, was 404ing). Also removed two unreachable dead `i-m-from`/`i'm-from → /brands/im-from` rules (shadowed by earlier correct rules → `/brands/i-am-from`).
3. Merged 3 pairs of duplicate `product_brand` WC terms (duplicate-content pages, same title/desc, different self-canonical):
   - B:Lab: `blab` (term 6911, 2 products) → `b-lab` (term 9456, now 5)
   - Beauty Formulas: `beauty-formulas-skin` (term 7595, 2) → `beauty-formulas` (term 9401, now 3)
   - Carenel: `carene` (term 9492, 1, typo slug) → `carenel` (term 7029, now 20)
   Old slugs now 301 → canonical slugs via `next.config.js`.
4. Deleted 9 zero-count "ghost" `product_brand` terms (Bath, Buy Retina Brand, Combo, Cow japan, Dr. Groot, `authentic-innsaei` dup, LG, Novale, Valentine).

**Not fixed (reported, not selected by owner):**
- ~17 brands where WP term display name differs in casing/punctuation from [[project_brand_audit_state|brandWhitelist]] canonical name (e.g. "Cosrx" vs "COSRX", "La Roche Posay" vs "La Roche-Posay") — shows in titles/schema, cosmetic only.
- Several more `/brands/<slug> → /shop` rules (valencia, absolute, tresemm, bath, house, lucido) in `next.config.js` are dead/unreachable — an earlier rule in the same array already redirects those same sources to specific brand pages. Zero live impact, pure dead code.
