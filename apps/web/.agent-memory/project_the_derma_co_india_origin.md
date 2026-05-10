# The Derma Co India Origin Correction

Date: 2026-05-10

The Derma Co is an Indian-origin brand for Emart catalog policy. Do not treat it as Korean, K-beauty, or Korea import.

Completed by Codex:

- Woo taxonomy audit found `product_brand=the-derma-co` on 43 published products.
- All 43 products now have taxonomy `pa_origin=India`.
- Stale custom product attribute `Origin=Korea` was removed from those 43 products.
- PDP/frontend origin selection now prefers taxonomy origin attributes over stale custom origin fields.
- Live sample PDP `/shop/the-derma-co-2-kojic-acid-face-serum-30ml` shows the origin chip as India.
- India origin listing includes The Derma Co products; South Korea origin checks should not show The Derma Co.

Reports and handoff:

- Dry-run CSV: `workspace/audit/active/the-derma-co-origin-correction-dry-run-20260510.csv`
- Apply CSV: `workspace/audit/active/the-derma-co-origin-correction-apply-20260510.csv`
- Script: `workspace/scripts/active/fix-the-derma-co-origin.php`
- Baidu Qianfan copy/meta instruction: `workspace/audit/active/baidu-qianfan-the-derma-co-meta-instructions-20260510.md`

Still pending for Baidu Qianfan / content agent:

- Product copy and SEO metadata may still contain stale phrases such as `100% authentic Korea import`.
- Review/update Woo fields including `short_description`, `_rank_math_description`, `_structured_description`, `_emart_product_faq`, and visible description text.
- Use dry-run/review CSV before applying content/meta mutations.
