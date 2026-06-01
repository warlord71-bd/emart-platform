# CODEX TASK: Continue Face Cleanser Product Description Humanization

**Date:** 2026-06-01  
**Priority:** HIGH — 183 face cleanser products still need descriptions  
**Script:** `workspace/docs/humanizer_face_cleansers.py` (production-ready, do not modify)

---

## Context

We have applied humanized product descriptions to 38 face cleansers out of 218.
183 remain. This task continues the batch processing.

The script is fully working and tested. Checkout is confirmed working.
GSC baseline was captured on 2026-05-31.

---

## Environment setup (run before anything else)

```bash
cd /root/emart-platform

# Verify environment
echo "DB: $(mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e 'SELECT 1;' 2>/dev/null | tail -1)"
echo "Key: $(test -n "$OPENROUTER_API_KEY" && echo SET || echo MISSING)"

# Check current progress
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT COUNT(*) as humanized
FROM wp4h_postmeta pm
JOIN wp4h_term_relationships tr ON tr.object_id=pm.post_id
JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
JOIN wp4h_terms t ON t.term_id=tt.term_id
WHERE pm.meta_key='_emart_humanized'
  AND tt.taxonomy='product_cat' AND t.slug='face-cleansers';" 2>/dev/null
```

Required env vars:
```bash
export EMART_DB_PASSWORD="Emart@123456"
export OPENROUTER_API_KEY="sk-or-v1-..."   # use emartseoblog key from OpenRouter
```

---

## Step 1 — Generate next batch (dry-run, no DB writes)

```bash
EMART_DB_PASSWORD="Emart@123456" \
OPENROUTER_API_KEY="sk-or-v1-..." \
python3 workspace/docs/humanizer_face_cleansers.py --dry-run --limit 20
```

This saves to: `workspace/audit/active/face-cleansers-YYYY-MM-DD.jsonl`

---

## Step 2 — Review the JSONL before applying

```bash
cat workspace/audit/active/face-cleansers-$(date +%Y-%m-%d).jsonl | python3 -c "
import sys, json, re
for line in sys.stdin:
    d = json.loads(line)
    if d.get('status') == 'api_length_error':
        print(f'SKIP: {d[\"title\"][:50]}')
        continue
    meta = d.get('meta_desc','')
    content = d.get('content_html','')
    # Quick checks
    ok_meta = 130 <= len(meta) <= 158 and 'emart' in meta.lower() and 'bangladesh' in meta.lower()
    ok_content = all(s in content for s in ['Key Benefits','Key Ingredients','Best For','Not Recommended For','How to Use','Routine Fit'])
    no_bengali = sum(1 for c in content if 'ঀ' <= c <= '৿') < 5
    no_hallucination = 'emart team' not in content.lower() and 'emart-verified' not in content.lower()
    status = '✓' if (ok_meta and ok_content and no_bengali and no_hallucination) else '⚠'
    print(f'{status} ID {d[\"post_id\"]} | SEO:{d.get(\"seo_score\",\"?\")} | {meta[:80]}')
"
```

**Before applying, check each entry for:**
- [ ] Meta 130–158 chars with Bangladesh + Emart + buy/COD signal
- [ ] All 6 sections present (Key Benefits, Key Ingredients, Best For, Not Recommended For, How to Use, Routine Fit)
- [ ] No Bengali text in content
- [ ] No fabricated claims ("Emart team verified", invented concentrations, "our tester")
- [ ] Pairing suggestion uses face skincare products only (not hair/body products)
- [ ] SEO score ≥ 80/100

**If any entry fails:** Edit it directly in the JSONL file before applying. Do NOT re-run dry-run — that would generate new content and lose your fixes.

---

## Step 3 — Apply reviewed JSONL to DB

```bash
EMART_DB_PASSWORD="Emart@123456" \
OPENROUTER_API_KEY="sk-or-v1-..." \
python3 workspace/docs/humanizer_face_cleansers.py --apply
```

The script:
- Reads only from the reviewed JSONL (never re-generates on apply)
- Writes 8 DB fields per product (post_content, meta, how_to_use, ingredients, schema, focus_keyword, structured_description, humanized timestamp)
- Appends disclaimer `<aside>` to every description
- Flushes WP cache every 25 products
- Revalidates Next.js `tag:products` after final flush
- Saves rollback JSON before first write

---

## Step 4 — Verify after apply

```bash
# Check no banned phrases or encoding bugs
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT p.ID, LEFT(p.post_title,40) as title
FROM wp4h_posts p
WHERE p.post_type='product' AND p.post_status='publish'
  AND (post_content LIKE '%u2014%' OR post_content REGEXP '[ঀ-৿]{10,}'
    OR post_content LIKE '%Emart team%verified%')
  AND ID IN (
    SELECT post_id FROM wp4h_postmeta
    WHERE meta_key='_emart_humanized'
    AND meta_value > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
  ) LIMIT 10;" 2>/dev/null

# Check meta quality
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT COUNT(*) as violations
FROM wp4h_postmeta pm
WHERE pm.meta_key='_emart_meta_description'
  AND pm.post_id IN (
    SELECT post_id FROM wp4h_postmeta
    WHERE meta_key='_emart_humanized'
    AND meta_value > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
  )
  AND (pm.meta_value LIKE 'Buy %' OR pm.meta_value LIKE '%৳%'
    OR LENGTH(pm.meta_value)>160 OR pm.meta_value NOT LIKE '%Bangladesh%');" 2>/dev/null
```

Zero rows in both = PASS. If violations found — fix them with `update_post_meta` via wp-cli before finishing.

---

## Step 5 — Verify 3 live URLs

```bash
# Get slugs of just-applied products
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT post_name FROM wp4h_posts WHERE ID IN (
  SELECT post_id FROM wp4h_postmeta
  WHERE meta_key='_emart_humanized'
  AND meta_value > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
) LIMIT 3;" 2>/dev/null

# For each slug, check live:
# https://e-mart.com.bd/shop/{slug}/
# Should show: 8 sections, disclaimer, correct meta, no Bengali
```

---

## Repeat until all 183 remaining face cleansers are done

Run batches of 20. After each batch: review → apply → verify. Repeat.

When `Face Cleansers: X total | 0 eligible` appears — all face cleansers are done.

---

## DO NOT touch

- Products with `_emart_holdout` meta (script already skips these — 213 products)
- Products with `total_sales > 20` (high-sales, need owner approval)
- Product slugs, prices, stock, categories
- Checkout/cart/payment logic
- Any product outside the `face-cleansers` category (use a separate script)

---

## After face cleansers complete — next category

See `workspace/docs/CLAUDE-product-humanizer-guide.md` for next steps.
Next priority: `serums-ampoules-essences` (518 products).

---

## Session end — always do this

```bash
# 1. Append to session log
cat >> /var/www/emart-platform/apps/web/SESSION-LOG.md << EOF

## $(date '+%Y-%m-%d') — Face Cleanser Humanizer Batch
- Applied: [N] products
- Failed: [N] (see workspace/audit/active/*.jsonl)
- Rollback: workspace/audit/active/face-cleansers-rollback-$(date +%Y-%m-%d).json
- Face cleansers progress: [done]/218
- Next: [continue face cleansers / start serums]
EOF

# 2. Commit and push
cd /root/emart-platform
git add workspace/ apps/web/SESSION-LOG.md
git commit -m "chore(log): face cleanser batch $(date +%Y-%m-%d)"
git push origin main
```
