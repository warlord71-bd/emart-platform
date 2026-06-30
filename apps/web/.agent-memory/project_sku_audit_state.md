# Product SKU Audit State

2026-05-08 Codex generated a read-only SKU audit/dry-run.

- Published Woo products checked: 3,640.
- Published products missing usable `_sku`: 119.
- Recoverable old SKUs from `_wp_old_slug` import placeholders for missing-SKU products: 0.
- Duplicate `_sku` meta-row products: 10, all duplicate rows had the same SKU value as the kept row.
- Review files:
  - `workspace/audit/active/product-missing-sku-dry-run-20260508-210540.csv`
  - `workspace/audit/active/product-duplicate-sku-meta-dry-run-20260508-210540.csv`
  - `workspace/audit/active/product-sku-audit-summary-20260508-210540.txt`
- Script:
  - `workspace/content-orchestrator/scripts/active/product-sku-audit-dry-run.php`

Do not apply SKU mutations without owner review/approval of the dry-run CSV. Recommended behavior: preserve every existing non-empty `_sku`; only fill missing `_sku`; optionally remove duplicate same-value `_sku` meta rows.
