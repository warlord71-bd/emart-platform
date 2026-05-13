---
name: project_category_taxonomy_status
description: WooCommerce category taxonomy status — which are redirected/deprecated vs active vs empty. Critical for any agent doing product assignment, SEO, filtering, or sitemap work.
metadata:
  type: project
---

WooCommerce category taxonomy was audited and locked 2026-05-13. Full reference: `workspace/docs/category-taxonomy-status.md`.

**Why:** Old concern categories had dirty data (hair/body products inside skincare concern categories). Using them for pa_concern assignment, frontend filters, or sitemap would spread the mess.

**REDIRECTED — 301 live in next.config.js, public URL dead:**
- `shop-by-concern` → `/concerns`
- `acne-blemish-care` → `/concerns/acne-blemish-care`
- `anti-aging-repair` → `/concerns/anti-aging-repair`
- `dryness-hydration` → `/concerns/dryness-hydration`
- `pores-oil-control` → `/concerns/pores-oil-control`
- `melasma` → `/concerns/melasma`
- `brightening`, `wrinkle`, `sensitivity` → matching `/concerns/*`
- `skincare-essentials` → `/shop`
- `k-beauty-j-beauty` → `/category/korean-beauty`
- `shooting-gel` → `/category/soothing-gel` (typo fix)

**BACKEND-ONLY GROUPING (no nav link, no SEO page):**
- `hair-personal-care`, `makeup-cosmetics`, `health-wellbeing`, `mother-baby-care`

**DO NOT assign pa_concern using these old category slugs as source.**
The WooCommerce backend records still exist and still drive PDP concern chips and shop concern filter — do not delete or reassign products away from them. Only the public URL is gone.

**How to apply:** Before any product category assignment, sitemap update, filter logic, or concern mapping — check this doc first. If a category is in the REDIRECTED list, it must not appear in any public URL, nav, sitemap entry, or filter source.

[[project_week2_seo_completion_plan]]
