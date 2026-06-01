# Claude Code / Codex: Product Content Humanizer — Category-by-Category Guide

**Last updated:** 2026-06-01  
**Current state:** 40/3,640 products humanized | 213 holdout (do not touch) | 11 high-sales skip  
**Canonical script:** `workspace/docs/humanizer_face_cleansers.py` (face cleansers)  
**Spec:** `workspace/docs/CODEX-TASK-product-content-humanizer.md`

---

## Before starting any session

Run these 3 checks first. Do not skip.

```bash
# 1. Check current progress
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT t.slug, t.name, COUNT(DISTINCT p.ID) as total,
  SUM(CASE WHEN pm.meta_value IS NOT NULL THEN 1 ELSE 0 END) as done
FROM wp4h_posts p
JOIN wp4h_term_relationships tr ON tr.object_id=p.ID
JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
JOIN wp4h_terms t ON t.term_id=tt.term_id
LEFT JOIN wp4h_postmeta pm ON pm.post_id=p.ID AND pm.meta_key='_emart_humanized'
WHERE p.post_type='product' AND p.post_status='publish'
  AND tt.taxonomy='product_cat'
GROUP BY t.slug, t.name HAVING total >= 10 ORDER BY total DESC LIMIT 20;"

# 2. Check GSC query map exists (needed for focus keyword writes)
ls workspace/audit/active/gsc-query-map-*.json 2>/dev/null || echo "NO GSC MAP — run baseline_snapshot.py first"

# 3. Check rollback from last session
ls workspace/audit/active/*rollback*.json 2>/dev/null | tail -3
```

---

## Category priority order

Process in this order — highest SEO opportunity first:

| Priority | Category slug | Products | Why first |
|----------|--------------|----------|-----------|
| 1 | `face-cleansers` | 218 (38 done) | **IN PROGRESS** — 183 remaining |
| 2 | `serums-ampoules-essences` | 518 | High search volume, rich ingredient data |
| 3 | `sunscreen` | 315 | Seasonal peak demand, SPF = specific meta signal |
| 4 | `toners-mists` | 199 | High volume, ingredient-rich |
| 5 | `acne-blemish-care` | 461 | High intent searches |
| 6 | `shampoos` | 126 | Hair category separate pairing rules |
| 7 | `hair-care` | 221 | After shampoos — share sibling context |
| 8 | `body-lotion` | 87 | Simpler descriptions, fast to process |
| 9 | `makeup-cosmetics` | 387 | Different content rules (shade, finish, formula) |
| 10 | `sunscreen` | 315 | After main skincare categories |

---

## How to create a new category script

The face cleanser script is the template. For each new category:

### Step 1 — Copy and adapt the script

```bash
cp workspace/docs/humanizer_face_cleansers.py \
   workspace/docs/humanizer_{CATEGORY_SLUG}.py
```

Change these 4 things in the new script:

**A. Category slug** (line ~370):
```python
AND t.slug = 'face-cleansers'    # → change to new category slug
```

**B. JSONL output path** (line ~51):
```python
JSONL = AUDIT / f"face-cleansers-{DATE}.jsonl"   # → rename
```

**C. Category context in SYSTEM_PROMPT** — replace the face-cleanser-specific pairing and context block with the correct rules for the new category (see category rules below).

**D. `CLEANSER_TYPES` and `PAIRING_BY_TYPE`** — replace with product-type detection for the new category.

### Step 2 — Define category-specific pairing rules

Each category has different safe pairings. Never suggest:
- Hair products in face/skincare descriptions
- Face serums as pairings for body lotion
- SPF as the "only" pairing (always list what comes before SPF)

| Category | Safe pairings | Never suggest |
|----------|--------------|---------------|
| Serums/ampoules | moisturiser, SPF (morning), patch test note | Another serum with conflicting actives |
| Toners/mists | serum, moisturiser — apply before serum | Cleanser (comes before toner, not after) |
| Sunscreen | Apply as final morning step | Any other product "over" SPF |
| Shampoos | Conditioner (same line), hair mask | Face products, serums, SPF |
| Hair care | Shampoo, leave-in conditioner | Face products |
| Body lotion | Body wash (same line) | Face products, hair products |
| Makeup | Setting spray, makeup remover | Skincare actives |
| Makeup remover | Cleanser as follow-up (double cleanse) | Directly applying actives after |

### Step 3 — Test with 5 products (dry run)

```bash
EMART_DB_PASSWORD='...' \
OPENROUTER_API_KEY='sk-or-v1-...' \
python3 workspace/docs/humanizer_{CATEGORY}.py --dry-run --limit 5
```

**Check the output for:**
- [ ] All 8 sections present (Key Benefits, Key Ingredients, Best For, Not Recommended For, How to Use, Routine Fit + 2 paragraphs)
- [ ] Meta 130–158 chars with "Bangladesh" + "Emart" + buy/COD signal
- [ ] No Bengali text
- [ ] No fabricated concentrations or "Emart verified" claims
- [ ] Pairing suggestion uses correct product category language
- [ ] SEO score ≥ 85/100

### Step 4 — Review the JSONL

```bash
cat workspace/audit/active/{category}-YYYYMMDD.jsonl | python3 -c "
import sys, json
for line in sys.stdin:
    d = json.loads(line)
    print(f'ID {d[\"post_id\"]} | Score:{d.get(\"seo_score\",\"?\")} | {d[\"meta_desc\"][:80]}')
"
```

Look for:
- Any meta that repeats the full product name (should use brand only)
- Any meta over 158 chars
- Any "Emart verified" or "our team tested" claims
- Ingredients that look invented (not in the product title or DB)

### Step 5 — Apply reviewed JSONL

```bash
EMART_DB_PASSWORD='...' \
OPENROUTER_API_KEY='sk-or-v1-...' \
python3 workspace/docs/humanizer_{CATEGORY}.py --apply
```

### Step 6 — Verify live on 3 URLs

```bash
# Get slugs of applied products
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT post_name FROM wp4h_posts WHERE ID IN (
  SELECT post_id FROM wp4h_postmeta
  WHERE meta_key='_emart_humanized'
  AND meta_value > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
) LIMIT 3;"
```

Check each live URL:
- Description has 8 sections with proper `<h3>` headings
- Key Benefits bullets use "Label — mechanism" format
- Disclaimer block present at bottom
- Meta description shows correctly in page source

---

## What the script writes per product (all categories)

Every apply writes these fields — no exceptions:

| Field | What it contains |
|-------|-----------------|
| `post_content` | 8-section description + disclaimer `<aside>` |
| `_rank_math_description` | 130–158 char meta |
| `_emart_meta_description` | Same as above (Next.js reads this first) |
| `_emart_how_to_use` | How to Use `<ol>` extracted from description |
| `_emart_ingredients` | Key Ingredients from description (if DB field was thin) |
| `_rank_math_schema_data` | Brand added to Product JSON-LD |
| `_rank_math_focus_keyword` | Top GSC query for that product URL |
| `_structured_description` | Price synced to current `_price` (GMC feed) |
| `_emart_humanized` | Timestamp — prevents re-runs |

---

## What to check after each batch

### Content quality checks

```bash
# Check for banned phrases in applied products
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT p.ID, LEFT(p.post_title,40) as title
FROM wp4h_posts p
WHERE p.post_type='product' AND p.post_status='publish'
  AND (post_content LIKE '%seamlessly%'
    OR post_content LIKE '%game-changer%'
    OR post_content LIKE '%Emart team%verified%'
    OR post_content LIKE '%u2014%'
    OR post_content REGEXP '[ঀ-৿]{10,}')
  AND ID IN (
    SELECT post_id FROM wp4h_postmeta
    WHERE meta_key='_emart_humanized'
    AND meta_value > DATE_SUB(NOW(), INTERVAL 1 DAY)
  )
LIMIT 10;"
```

### Meta quality checks

```bash
# Check metas for standard violations
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT p.ID, LEFT(p.post_title,30) as title,
  LENGTH(pm.meta_value) as len,
  CASE WHEN pm.meta_value LIKE 'Buy %' THEN 'starts-Buy'
       WHEN pm.meta_value LIKE '%৳%'   THEN 'has-price'
       WHEN LENGTH(pm.meta_value) > 158 THEN 'too-long'
       WHEN LENGTH(pm.meta_value) < 130 THEN 'too-short'
       WHEN pm.meta_value NOT LIKE '%Bangladesh%' THEN 'no-BD'
       ELSE 'OK' END as status
FROM wp4h_posts p
JOIN wp4h_postmeta pm ON pm.post_id=p.ID AND pm.meta_key='_emart_meta_description'
WHERE p.ID IN (
  SELECT post_id FROM wp4h_postmeta
  WHERE meta_key='_emart_humanized'
  AND meta_value > DATE_SUB(NOW(), INTERVAL 1 DAY)
)
HAVING status != 'OK' LIMIT 20;"
```

### Schema check

```bash
# Verify brand schema was written
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT COUNT(*) as has_brand_schema
FROM wp4h_postmeta
WHERE meta_key='_rank_math_schema_data'
  AND meta_value LIKE '%Brand%'
  AND post_id IN (
    SELECT post_id FROM wp4h_postmeta
    WHERE meta_key='_emart_humanized'
    AND meta_value > DATE_SUB(NOW(), INTERVAL 1 DAY)
  );"
```

---

## Mandatory rules for every category

**NEVER do these:**
- Do not change product slugs/URLs
- Do not touch `total_sales > 20` products without owner approval
- Do not apply without reviewing the JSONL first
- Do not skip the `--dry-run` step
- Do not run `--apply` without `EMART_DB_PASSWORD` set in env (will fail safely)
- Do not touch products with `_emart_holdout` meta (213 products — measurement control group)
- Do not suggest incompatible ingredient pairings (see incompatibility table in CODEX-TASK spec)

**ALWAYS do these:**
- Run `wp cache flush` after any batch of applies (script does this automatically)
- Check session log for what previous sessions did before starting
- Append to `SESSION-LOG.md` at end of session
- Save rollback JSON before first apply (script does this automatically)

---

## Incompatible ingredient pairs (never suggest these pairings)

| Product contains | Do NOT pair with |
|-----------------|-----------------|
| Vitamin C (any form) | AHA, BHA, PHA |
| Retinol / retinoids | AHA, BHA, Vitamin C |
| Benzoyl peroxide | Retinol, Vitamin C |
| Copper peptides | Vitamin C, AHA, BHA, PHA |
| AHA at high % | BHA or PHA same step |

---

## Session end checklist

```bash
# 1. Append to session log
cat >> /root/emart-platform/apps/web/SESSION-LOG.md << EOF

## $(date '+%Y-%m-%d') — Product Humanizer Session
- Categories processed: [list]
- Products applied: [N]
- Products failed: [N] (see workspace/audit/active/*)
- Rollback: workspace/audit/active/[category]-rollback-[date].json
- Next: [what category comes next]
EOF

# 2. Update TASKS.md
# 3. git commit + push
```

---

## Measurement — remeasure GSC at +4 weeks

```bash
EMART_DB_PASSWORD='...' python3 workspace/docs/baseline_snapshot.py \
  --mode=remeasure \
  --baseline=workspace/audit/active/baseline-snapshot-2026-05-31.json
```

Remeasure dates:
- **+4 weeks:** 2026-06-28
- **+8 weeks:** 2026-07-26
