# Workspace Script Retention Audit

Audit date: 2026-05-15
Branch: `claude/fix-product-origin-display-WIGNs`
Scope: `workspace/scripts/active` and related active audit/source file dependencies. No scripts were moved or edited in this audit.

## Summary

- Active scripts inspected: 23
- Keep active as reusable tools: 8
- Keep temporarily active: 2
- Keep only after path/default updates: 1
- Archive now: 12
- Hardcoded missing input files found: duplicate cleanup inputs, old image audit inputs, old `workspace/audit/seo` source paths
- Hardcoded secret values found: none. `fix-wrong-korea-origin-products.php` reads `NEXTJS_REVALIDATE_SECRET` from env only.

## Keep Active

| Script | Job type | Why keep | Notes |
|---|---|---|---|
| `README.md` | Workspace policy | Defines active-script rules | Keep. |
| `sync-local-to-vps.sh` | Deploy helper | Reusable Local to VPS sync helper | Not an audit script. Use only inside deploy law; it uses `rsync --delete`. |
| `emart-seo-backend-smoke.sh` | SEO/live smoke | Reusable public-route SEO smoke test | Keep. |
| `audit-seo-index-bloat.sh` | SEO audit | Reusable robots/sitemap/index-bloat live audit | Keep. |
| `product-seo-audit.php` | Product SEO audit | Reusable read-only Woo product SEO/schema/data audit | Keep. |
| `product-sku-audit-dry-run.php` | Product/SKU audit | Reusable read-only SKU gap/duplicate meta audit | Keep. |
| `pa-concern-skin-type-dry-run.php` | Taxonomy dry run | Current concern/skin-type/ingredient assignment audit | Keep. It depends on `/var/www/.../tkm-concern-progress.json`, which exists. |
| `audit-wrong-korea-origin-products.php` | Origin audit | Current read-only origin/brand/copy audit | Keep while wrong-origin work remains active. |

## Keep Temporarily, Then Archive

| Script | Job type | Why temporary | Archive trigger |
|---|---|---|---|
| `fix-wrong-korea-origin-products.php` | Origin/copy apply | Current active paired fixer for wrong Korea origin/copy issue; default is dry-run, apply requires `APPLY=1` | Archive after owner confirms the wrong-origin batch is closed and the latest audit returns clean. |
| `product-image-brand-size-audit.mjs` | Image audit | Still useful for future product image/brand/size audits | Before next use, update default output from old `workspace/audit/seo/...` to `workspace/audit/active/...` or require explicit `OUT=...`. |

## Archive Now

| Script | Reason |
|---|---|
| `apply-woocommerce-sale-price-clear.php` | Dangerous wrapper that forces `--apply` for sale-price clearing; not safe as active. |
| `clear-woocommerce-sale-prices.php` | Broad price mutation tool. Price logic is protected; archive unless a fresh approved price-reset task exists. |
| `fix-non-korean-korea-import-copy.php` | Completed 2026-05-14 per session log; keep historical only. |
| `assign-emart-combos-category.php` | One-off Woo category/brand mutator; hardcoded input CSV is missing. |
| `classify-brand-size-skipped.php` | One-off duplicate/brand-size classifier; hardcoded skipped CSV is missing. |
| `duplicate-deep-analysis.php` | One-off duplicate cleanup audit; hardcoded audit CSV is missing. |
| `duplicate-trash-dry-run.php` | One-off duplicate cleanup dry-run; hardcoded decision CSV is missing. |
| `duplicate-trash-apply.php` | One-off trash apply script; hardcoded dry-run CSV is missing and it mutates products. |
| `duplicate-swap-fix.php` | Hardcoded product restore/trash fixer for 8 IDs; unsafe to leave active. |
| `pa-origin-gap-dry-run.php` | Stale path points to archived `workspace/audit/seo/...`; superseded by current origin audits. |
| `build-open-image-review-audit.mjs` | Old 2026-05-03 image review pipeline; all default inputs point to archived/missing `workspace/audit/seo` paths. |
| `targeted-product-image-ocr.mjs` | Old OCR pipeline; default input/output point to archived/missing `workspace/audit/seo` paths. |
| `verify-deployment.sh` | Stale deploy verifier uses raw IP `http://5.189.188.229`; archive or rewrite before any future use. |

## Broken Or Stale Dependencies Found

| Dependency | Status | Affected scripts |
|---|---|---|
| `workspace/audit/active/duplicate-products-brand-size-audit.csv` | Missing | `duplicate-deep-analysis.php` |
| `workspace/audit/active/duplicate-products-brand-size-skipped.csv` | Missing | `classify-brand-size-skipped.php` |
| `workspace/audit/active/duplicate-products-brand-size-excluded-combos.csv` | Missing | `assign-emart-combos-category.php` |
| `workspace/audit/active/duplicate-products-keep-delete-decision.csv` | Missing | `duplicate-trash-dry-run.php` |
| `workspace/audit/active/duplicate-trash-dry-run-20260508.csv` | Missing | `duplicate-trash-apply.php` |
| `workspace/audit/seo/product-image-brand-size-20260503.csv` | Missing after SEO archive | `product-image-brand-size-audit.mjs`, `targeted-product-image-ocr.mjs`, `build-open-image-review-audit.mjs` |
| `workspace/audit/seo/brand-origin-20260505/corrected-brand-origin-normalized.csv` | Missing after SEO archive | `pa-origin-gap-dry-run.php` |
| `/var/www/emart-platform/workspace/audit/archive/tkm-concern-progress.json` | Found | `pa-concern-skin-type-dry-run.php` |

## Recommended Active Script Set After Cleanup

Keep only these in `workspace/scripts/active`:

- `README.md`
- `sync-local-to-vps.sh`
- `emart-seo-backend-smoke.sh`
- `audit-seo-index-bloat.sh`
- `product-seo-audit.php`
- `product-sku-audit-dry-run.php`
- `pa-concern-skin-type-dry-run.php`
- `audit-wrong-korea-origin-products.php`
- `fix-wrong-korea-origin-products.php` temporarily
- `product-image-brand-size-audit.mjs` after default output path is updated

## Recommended Archive Path

Move archive-now scripts to:

`workspace/scripts/archive/script-retention-cleanup-20260515/`

Add a `README.md` there explaining that these scripts are one-off, stale-input, completed, or mutating tools retained for historical reference only.

## Safety Rules For Future Scripts

- Active scripts must be reusable and have safe defaults.
- Mutating scripts should not stay active after their batch closes.
- Any script that writes Woo product/price/stock/order/customer/category/brand data must require an explicit apply flag and fresh owner approval.
- Hardcoded dated CSV inputs should be archived with the script after the batch is done.
- Active scripts should write reports to `workspace/audit/active/`, not recreate `workspace/audit/seo/`.
- Raw IP checks should not remain in active deploy/SEO scripts unless explicitly needed for a private infra test.

