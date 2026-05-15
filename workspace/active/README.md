# Active Working Folder

Everything currently in play lives here. One folder, four subfolders.  
Last updated: 2026-05-15

When a task finishes → move its folder/file to `workspace/audit/archive/` or `workspace/scripts/archive/`.  
When a new task starts → drop its files into the right subfolder here and add a row below.

---

## scripts/ — Active scripts

| Script | Type | What it does | Status |
|--------|------|-------------|--------|
| `product-seo-audit.php` | PHP read-only | Full product SEO audit (title, desc, image, schema) | Keep active — run before any data batch |
| `product-sku-audit-dry-run.php` | PHP read-only | Audit 119 products missing SKU | Blocked — awaiting owner SKU data |
| `audit-seo-index-bloat.sh` | Bash read-only | Checks for index bloat in sitemap/robots | Keep active — reusable |
| `emart-seo-backend-smoke.sh` | Bash read-only | Smoke test sitemap, robots, canonical, redirects | Keep active — run after deploys |
| `sync-local-to-vps.sh` | Bash deploy | Rsync local → VPS | Keep active — deploy utility |
| `audit-wrong-korea-origin-products.php` | PHP read-only | Checks for remaining wrong Korea origin | Keep until final audit passes |
| `pa-concern-skin-type-dry-run.php` | PHP read-only | Dry-run for concern/skin-type taxonomy | Keep as read-only check |
| `pa-ingredient-skintype-apply.php` | PHP mutator | Applied pa_ingredient + pa_skin_type (B1 done) | Archive after WH3 cleanup |
| `fix-wrong-korea-origin-products.php` | PHP mutator | Fixed wrong Korea origin (done) | Archive after WH3 cleanup |
| `product-image-brand-size-audit.mjs` | Node audit | Audits product image brand/size data | Fix output path (WH6) before reuse |

---

## audits/ — Active audit data

| Folder | What it contains | Next action |
|--------|-----------------|-------------|
| `gsc-404-report-20260512/` | GSC 404 URL export — Chart, Metadata, Table CSVs | Cross-ref with `data/404 redirect.xlsx` → add redirects to `next.config.js` |

---

## data/ — Owner-review data files

| File | What it is | Status |
|------|-----------|--------|
| `404 redirect.xlsx` | Planned redirect mappings for 404 URLs | Pair with `audits/gsc-404-report-20260512/Table.csv` |
| `manual-review-size-notmatched.csv` | 155 products where size didn't match — price decisions needed | Awaiting owner price decisions |
| `products-need-real-image.csv` | 16 products needing real product images | Awaiting owner image uploads |

---

## docs/ — Supporting reference docs

| File | What it covers |
|------|---------------|
| `theme-contract.md` | Canonical brand/UI token rules — read before any frontend styling work |
| `category-taxonomy-status.md` | Which categories are active, redirected, backend-only, or near-empty |
