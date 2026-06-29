# Codex Task: GMC Policy Fix — Full Logical Sequence
**Created: 2026-06-05 | Owner instruction: do this logically**

---

## Context

Google Merchant Center has 127 disapproved products — 15% of our catalog blocked from Google Shopping (the channel that appears above organic AND above AI Overview). Codex already did a dry-run (e82d802). This task applies the fixes in correct logical order.

**Do NOT run these steps out of order. Each has a gate.**

---

## Step 0 — Read Before Starting

```
Dry-run CSV:    workspace/audit/active/gmc-policy-control-dryrun-2026-06-05.csv
Proposals JSONL: workspace/audit/active/gmc-policy-copy-proposals-2026-06-05.jsonl
Script:         workspace/content-orchestrator/scripts/active/gmc_policy_control_dryrun.py
GMC sync:       python3 /root/.gmc/sync.py
```

**Never in this task:**
- No title changes
- No price changes
- No URL changes
- No image changes
- No GMC sync until ALL description fixes are written and reviewed
- No bulk Woo apply without dry-run CSV reviewed first

---

## Step 1 — Apply the 9 Substantive Rule-Based Proposals (SAFE)

**These 9 products have meaningful rule-based rewrites already in the JSONL. Apply them.**

Product IDs: `59769, 51496, 26366, 3185, 51898, 63287, 58027, 61998, 60687`

**How:**
1. Filter proposals JSONL for these 9 IDs with `action = copy_dry_run_ready_for_review`
2. Extract `proposed_content` for each
3. Write to WooCommerce `post_content` using `wp_update_post` (PHP) or Woo REST API
4. Write a dry-run CSV first showing wc_id | title | before_hash | after_hash | change_summary
5. Owner reviews dry-run CSV → approves → apply

**Gate:** Dry-run CSV generated → owner says apply → then apply.

**Note on ID 58027 (Mary&May Essence Mask):** Still has "restore" after rewrite — may still be flagged. Apply it but flag for re-check.

---

## Step 2 — LLM Rewrites for 44 Products Needing Full Rewrite

**These products need full description rewrites. Rule-based swaps were insufficient or not found.**

### Group A: 11 trivial proposals (irritation→discomfort only, won't fix policy)
Product IDs: `34069, 58018, 62592, 3822, 59015, 61765, 74088, 63377, 60156, 74879, 62899`

### Group B: 33 no-rule-change-found
Product IDs: `58451, 38333, 63909, 63573, 59204, 61984, 63933, 74275, 74285, 63583, 50830, 74522, 2738, 62162, 3067, 74955, 75273, 62644, 75465, 38062` + 13 more (see dry-run CSV)

**Total: 44 products needing full LLM rewrites**

**LLM rewrite rules (STRICT):**
```
Input: current WooCommerce product description (full HTML)
Output: rewritten description (same length ±20%, same HTML structure)

REMOVE all of these:
- Language targeting skin conditions as personal problems/hardships
  ("for sensitive, problem-prone skin", "suffering from", "skin issues", "skin problems")
- Prescription/medical claims ("prescription-strength", "treats", "cures", "heals", "medicinal")
- Unsupported clinical claims ("clinically proven", "dermatologist-tested" without citation)
- Outcome language ("anti-aging miracle", "repairs damaged", "restores youth")

REPLACE WITH:
- Ingredient-focused language ("contains centella asiatica", "formulated with ceramides")
- Functional language ("helps support", "works with the skin barrier", "provides hydration")
- Neutral descriptive language (describe what the product IS, not what condition it TREATS)

KEEP:
- Product name, brand, size, origin
- Price (if mentioned — though meta should not have price)
- Shipping/COD info
- Authentic/genuine references

NEVER INVENT: Do not add ingredient claims that are not in the original description.
```

**Execution:**
1. Pull each product's current `post_content` from WooCommerce DB
2. Send to OpenRouter (credentials at `/root/.openclaw/credentials/openrouter_default.json`)
   - Use `openrouter/deepseek/deepseek-v3.2` model (cost-effective for copy rewrites)
   - Temperature: 0.3 (factual, consistent)
   - Batch 5 products at a time with 10s delay between batches
3. Generate dry-run CSV: wc_id | title | original_300c | proposed_300c | violations_before | violations_after
4. Run policy validator on each proposed description (check for remaining risk terms)
5. Flag any that still contain risk terms → mark for manual review

**Gate:** Dry-run CSV generated → validate → owner reviews sample of 10 → approves → apply in batches of 10

---

## Step 3 — Document the Unfixable Products (NO WRITE NEEDED)

**These 15 products are foundation shades / skin-tone products. Google Shopping's "Identity and belief" policy blocks these by product TYPE, not by copy. No description rewrite will fix them.**

Product IDs: `74134, 74327, 60310, 60609, 62460, 51305, 74591, 60764, 74927, 61688, 75014, 59586, 92866, 35952, 74490`

**Action:** Write a note in `workspace/audit/active/gmc-identity-products-documented-20260605.md`:
- List these 15 products
- Note: unfixable in Google Shopping (skin-tone targeting = Identity policy)
- Note: still valid for direct sale on website, just cannot be in Shopping feed
- Option for owner: exclude these 15 from GMC sync to stop disapproval noise

---

## Step 4 — Handle Title-Risk Products (11 — OWNER MUST DECIDE)

Product IDs: `43762, 43757, 60760, 63855, 63901, 93109, 63849, 57059, 37165, 62034, 62040`

These have violations in the TITLE or slug (e.g., "anti-aging" in title). **Never change titles without owner approval** — titles affect URLs, SEO, and product recognition.

**Action:** Generate a review list showing current title + GMC violation reason. Present to owner. Do not change.

---

## Step 5 — Fix Data/Asset Issues (2 products)

Product IDs: `63749, 62576`

Likely missing price or broken image link. Check each:
1. Fetch product from WooCommerce — is price set?
2. Is image URL returning 200?
3. If price missing: flag to owner (do NOT set price)
4. If image broken: flag to owner with products-need-real-image.csv

---

## Step 6 — Mixed Manual Review (6 products)

Product IDs: `36262, 3274, 56108, 3753, 38292, 26194`

These need case-by-case human review. Generate a report with current description and violation reason. Present to owner as a separate short list.

---

## Step 7 — GMC Sync (LAST — only after all fixes applied)

```bash
python3 /root/.gmc/sync.py
```

Then check status:
```bash
python3 /root/.gmc/sync.py --status
```

Target: disapproved count drops from 127. The 42 unfixable products (15 identity + 11 title-risk + 6 mixed + others) will remain. Realistic target: ~60-70 fewer disapprovals after Steps 1+2.

---

## Expected Outcome

| Before | After (Steps 1+2) |
|---|---|
| 127 disapproved | ~55-70 disapproved |
| 415 with issues | ~300-350 with issues |
| 3,503 approved | ~3,569-3,575 approved |

The 15 identity products and 11 title-risk products remain — those need owner decisions.

---

## Workflow Reminder

```
Step 1: dry-run CSV → owner approves → apply 9 products
Step 2: LLM rewrite 44 products → dry-run CSV → validate → owner samples → apply
Step 3: document 15 identity products (no write)
Step 4: title-risk report for owner (no write)
Step 5: data/asset flag (no write)
Step 6: mixed manual report (no write)
Step 7: GMC sync
```

Total Woo writes: Steps 1+2 = max 53 product descriptions. Zero price/title/URL/image changes.
