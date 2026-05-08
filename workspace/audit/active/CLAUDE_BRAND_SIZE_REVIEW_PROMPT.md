# Claude Prompt: Apply skipped product brand + size review safely

Use this prompt in Claude/Codex from the repository root after the review CSV files are present in `workspace/audit/active/`.

## Context

We already completed the confirmed duplicate audit and cleanup for `duplicate-products-brand-size-audit.csv`.

Now this task is for the skipped/manual metadata rows from:

- `workspace/audit/active/duplicate-products-brand-size-skipped.csv`
- `workspace/audit/active/duplicate-products-brand-size-apply-ready.csv`
- `workspace/audit/active/duplicate-products-brand-size-manual-review.csv`
- `workspace/audit/active/duplicate-products-brand-size-excluded-combos.csv`

The skipped file is **not a delete list**. It contains products that were skipped because brand or size could not be confidently normalized.

## Goal

Update product metadata only for safe rows:

1. Confirm/propose correct brand first.
2. Assign appropriate size only when confident.
3. Do **not** assign size for combo/eMart combo rows.
4. Do **not** delete, merge, trash, rename, or change price/stock.
5. Create a dry-run report first.
6. Apply only `duplicate-products-brand-size-apply-ready.csv` rows after dry run looks safe.
7. Keep `manual-review.csv` rows untouched.

## Safety rules

- Read product data from WordPress DB/WooCommerce on VPS, not public frontend scraping.
- Use `/var/www/wordpress/wp-config.php` for DB credentials.
- DB is `emart_live`, table prefix is `wp4h_`.
- Always use backups/logs.
- Do not permanently delete anything.
- Do not edit combo products, eMart combo products, bundles, sets, kits, or value packs unless a human approves.
- Do not guess a size if product title and official/source data are unclear.
- If there is a conflict between CSV and live product title, mark manual review.

## Recommended workflow

1. Verify files exist:

```bash
cd /root/emart-platform
ls -lah workspace/audit/active/duplicate-products-brand-size-*.csv
```

2. Create a dry-run PHP script in `workspace/scripts/active/apply-brand-size-review-dry-run.php` that:

- Reads `workspace/audit/active/duplicate-products-brand-size-apply-ready.csv`.
- Checks each product ID exists and is published.
- Checks the row is not combo/bundle/eMart combo.
- Confirms proposed brand and proposed size columns exist.
- Prints what would change:
  - product_id
  - current title
  - current brand taxonomy terms
  - proposed brand
  - current size/attribute/meta if available
  - proposed size
  - confidence
  - action
- Outputs dry-run CSV:
  - `workspace/audit/active/brand-size-apply-dry-run-YYYYMMDD-HHMMSS.csv`

3. Review dry-run summary:

- total rows read
- safe rows
- skipped rows
- brand changes
- size changes
- manual conflicts

4. Only after the dry run looks safe, create apply script:

`workspace/scripts/active/apply-brand-size-review.php`

It should update only safe apply-ready rows:

- Product brand taxonomy: `product_brand`
- Size metadata or product attribute, using existing site convention first.
- If site uses size only in title and no attribute/meta exists, do not invent a new taxonomy without checking existing implementation.
- Prefer existing WooCommerce product attribute if a size/volume/weight attribute already exists.

5. After apply, rerun duplicate audit:

```bash
cd /root/emart-platform/apps/web
php /tmp/emart-logical-duplicate-db.php
cat /root/emart-platform/workspace/audit/active/duplicate-products-brand-size-audit.json
```

6. Commit scripts and reports, not raw secrets:

```bash
cd /root/emart-platform
git status --short
git add workspace/scripts/active/apply-brand-size-review-dry-run.php \
        workspace/scripts/active/apply-brand-size-review.php \
        workspace/audit/active/brand-size-apply-dry-run-*.csv \
        workspace/audit/active/brand-size-apply-result-*.csv

git commit -m "audit: apply safe brand and size metadata review"
git push origin main
```

## Expected source files from ChatGPT review

The ChatGPT review split 446 skipped rows into:

- Apply-ready rows: 67
- Manual review rows: 343
- Excluded combo/eMart combo rows: 36

Use only the apply-ready CSV for automatic metadata updates.

## Final response required

After running, report:

- How many apply-ready rows were read.
- How many were updated.
- How many were skipped and why.
- Which metadata fields were changed.
- Path to result CSV.
- Whether duplicate audit count changed after rerun.

Do not claim success unless the result CSV and rerun audit confirm it.
