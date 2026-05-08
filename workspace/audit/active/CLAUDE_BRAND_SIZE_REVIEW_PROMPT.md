# Claude Prompt: Review skipped product brand + size rows only

## Source files

Use these files from `workspace/audit/active/`:

- `duplicate-products-brand-size-skipped.csv`
- `duplicate-products-brand-size-skipped_brand_size_review.csv`
- `duplicate-products-brand-size-apply-ready.csv`
- `duplicate-products-brand-size-manual-review.csv`
- `duplicate-products-brand-size-excluded-combos.csv`

## Main rule

Do **not** apply anything automatically.
Do **not** decide all rows yourself.
Do **not** delete, trash, merge, rename, change price, or change stock.

Owner wants to see everything first and approve manually.

## Context

Confirmed duplicate cleanup is already done. This task is only for skipped products where brand/size metadata needs review.

The skipped file is **not a delete list**.

Known site info:

- WordPress path: `/var/www/wordpress`
- DB: `emart_live`
- Prefix: `wp4h_`
- Product brand taxonomy: `product_brand`

## Your job

Create a review table only.

For each row, show:

- product_id
- product title
- current brand from live DB
- proposed brand from CSV
- current size/attribute/meta if available
- proposed size from CSV
- confidence
- source/reason
- action suggestion
- approve column blank for owner decision

Group rows as:

1. High confidence brand + size suggestions
2. Brand-only suggestions
3. Size-only suggestions
4. Manual review needed
5. Excluded combo/eMart combo/bundle/set rows

## Combo rule

Do not assign size for combo/eMart combo/bundle/set/value-pack products. Mark them as excluded unless owner gives approval.

## Output required

Create only review/dry-run report files, for example:

- `workspace/audit/active/brand-size-owner-approval-table-YYYYMMDD.csv`
- `workspace/audit/active/brand-size-review-summary-YYYYMMDD.md`

Do not create an apply script yet unless owner asks after reviewing the approval table.

## Final response to owner

Report only:

- source files found
- number of rows by group
- output report paths
- no changes applied

Again: no automatic apply, no deletion, no metadata update without owner approval.
