---
name: Brand audit/correction in-progress state (2026-04-25)
description: Where the brand-unification batch left off; which CSVs are source of truth; the safe code path for applying fixes
type: project
originSessionId: 897a3d49-6d5e-4da0-8802-309f793d8a47
---
A multi-pass brand-unification effort is in progress. The whitelist (`apps/web/src/lib/brandWhitelist.ts`, 273 brands / 335 aliases) is the canonical reference, and live WC `pa_brand` taxonomy terms are being progressively renamed to match it. As of 2026-04-25, rows 1–680 of the audit CSV are done; rows 681+ are not.

**2026-05-04 XLSX apply note:** User supplied the GitHub XLSX `coreect reset brands accretly from info via googl....xlsx`. Its 345 filled corrections were imported into `workspace/PROJECT_DATA/CURRENT_BRAND_CORRECTION_FILE.csv` / `workspace/audit/seo/brand-source-unification-20260503/manual-review.csv`; raw XLSX copies were archived to `/root/.attic-2026-05-04/emart-platform/brand-xlsx-upload/` and removed from Git. Backup: `workspace/audit/seo/brand-source-unification-20260503/manual-review.before-xlsx-import-20260504.csv`. Dry-run output: `workspace/audit/seo/brand-source-unification-20260503/xlsx-import-20260504-dry-run.csv` with 69 existing-term assignments and 276 term-create-needed product rows. Apply output: `workspace/audit/seo/brand-source-unification-20260503/xlsx-apply-20260504-185311/summary.txt`; 345 applied, 0 skipped, 134 unique `product_brand` terms created. `/brands` and 153 affected `/brands/{slug}` paths were revalidated; sample live checks for `/brands`, `/brands/jnh`, `/brands/purito-seoul`, and `/brands/korea-red-ginseng` returned 200.

**Source-of-truth CSVs (in `/root/emart-platform/audit/`):**
- `products-needs-correction-2026-04-25.csv` (1,010 rows) — narrow review file, user is editing rows 681+ for a follow-up pass.
- `products-full-review-2026-04-25.csv` (3,564 rows) — full audit superset.
- `processed/safe-brand-updates-2026-04-25.csv` (513 rows) — codex-confident rows from rows 1–680.
- `processed/unsafe-brand-updates-review-2026-04-25.csv` (497 rows) — needs human review before any apply.
- `processed/brand-backup-row-680-{dry-run,applied}-2026-04-25.csv` (460 rows) — codex's apply payload, still status=PENDING for every row, **do not run as-is** (its `old_product_attributes` JSON is stale relative to WC REST view).
- `processed/term-renames-applied-2026-04-25.csv` and `local-brand-fixes-2026-04-25.csv` — what I actually pushed.

**Why:** Per-product brand attribute writes (codex's apply-batch approach) introduce duplicate brand data because most products carry both a `pa_brand` taxonomy term AND a local "Brand" attribute. The taxonomy-term-rename path (`PUT /wp-json/wc/v3/products/attributes/1/terms/{term_id}`) renames once and propagates to every product under that term — far smaller blast radius. This is the correct path for brand-only unification.

**How to apply:**
- For new corrections, aggregate the CSV by current brand → desired canonical, then rename pa_brand TERMS (not products). Example pattern: `cat > /tmp/rename.mjs <<'EOF' ...` calling `PUT /wp-json/wc/v3/products/attributes/1/terms/{id}` with `{name, slug}`. After the run, restart pm2 (`pm2 restart emartweb`) to flush the brands-page cache.
- If the same target name already exists as a separate term (CONFLICT case): reassign each product's pa_brand attribute via `PUT /products/{id}` with new options, then DELETE the duplicate term.
- For NEITHER cases (no taxonomy term exists; only local "Brand" attribute carries the bad value): per-product `PUT /products/{id}` with the local attribute updated. Loop products via `GET /products?per_page=100&page=N` and filter for `attributes[].id === 0 && /brand/i.test(name)`.
- The 497-row "unsafe" set requires human review before any write — don't auto-apply.
- The TRUNCATED/UNKNOWN/SUSPICIOUS rows (~280 products with single-word `pa_brand` term values like "THE", "BEAUTY", "LA", "DR.", "BATH") are data corruption from a bad WC import. Whitelist-only fixes can't recover these — you need the user-edited CSV with the true brand for each.

**WC API auth:** `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET` in `/var/www/emart-platform/apps/web/.env.local` (HTTP Basic). pa_brand attribute id is `1`.
