# CODEX TASK: Continue Face Cleanser Product Description Humanization

**Script:** `workspace/docs/humanizer_face_cleansers.py` (production-ready, do not modify)  
**Guide:** `workspace/docs/CLAUDE-product-humanizer-guide.md`

---

## Step 0 — Check actual state before doing anything

The counts below may be stale. Run this first and use the live numbers:

```bash
cd /root/emart-platform

mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT
  COUNT(DISTINCT p.ID) as total,
  SUM(CASE WHEN pm_h.meta_value IS NOT NULL THEN 1 ELSE 0 END) as done,
  SUM(CASE WHEN pm_o.meta_value IS NOT NULL THEN 1 ELSE 0 END) as holdout,
  SUM(CASE WHEN CAST(IFNULL(pm_s.meta_value,0) AS UNSIGNED) > 20 THEN 1 ELSE 0 END) as high_sales
FROM wp4h_posts p
JOIN wp4h_term_relationships tr ON tr.object_id=p.ID
JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
JOIN wp4h_terms t ON t.term_id=tt.term_id
LEFT JOIN wp4h_postmeta pm_h ON pm_h.post_id=p.ID AND pm_h.meta_key='_emart_humanized'
LEFT JOIN wp4h_postmeta pm_o ON pm_o.post_id=p.ID AND pm_o.meta_key='_emart_holdout'
LEFT JOIN wp4h_postmeta pm_s ON pm_s.post_id=p.ID AND pm_s.meta_key='total_sales'
WHERE p.post_type='product' AND p.post_status='publish'
  AND tt.taxonomy='product_cat' AND t.slug='face-cleansers';" 2>/dev/null
```

Example state after the 2026-06-01 Codex smoke batch: full category total=218, non-holdout total=205, non-holdout done=36, holdout=13, high_sales=1 → **168 auto-eligible remaining**. Treat this line as advisory; the DB query above is the source of truth.

Also list any JSONL files with unread entries from previous sessions:

```bash
ls -la workspace/audit/active/face-cleansers-*.jsonl 2>/dev/null | grep -v rollback
```

If a JSONL file exists with unreviewed content, review it before running a new dry-run. Do not apply until the review command below reports zero issues.

---

## Required environment variables

**Do not hardcode credentials.** Set before running:

```bash
export EMART_DB_PASSWORD="..."          # ask owner if not already exported
export OPENROUTER_API_KEY="sk-or-v1-..." # emartseoblog key from openrouter.ai
```

Verify both are set:
```bash
echo "DB: $(test -n "$EMART_DB_PASSWORD" && echo SET || echo MISSING)"
echo "API: $(test -n "$OPENROUTER_API_KEY" && echo SET || echo MISSING)"
```

---

## Step 1 — Generate next batch (dry-run, no DB writes)

```bash
python3 workspace/docs/humanizer_face_cleansers.py --dry-run --limit 20
```

Output saved to: `workspace/audit/active/face-cleansers-YYYY-MM-DD.jsonl`

---

## Step 2 — Review JSONL before applying

The script's `--apply` command can read **all** `face-cleansers-*.jsonl` files (not just today's). In practice, it only loops over the current auto-eligible products from the DB, then searches JSONL files for each product. This is intentional — it allows dry-run one day, apply the next. Before applying, verify exactly which JSONL rows exist:

```bash
python3 - << 'PYEOF'
import json, re, glob

files = sorted(glob.glob("workspace/audit/active/face-cleansers-*.jsonl"), reverse=True)
files = [f for f in files if 'rollback' not in f]
print(f"JSONL files that --apply will read: {files}\n")

seen = {}
for fpath in files:
    rows_by_pid = {}
    for line in open(fpath):
        d = json.loads(line)
        pid = d.get('post_id', 0)
        if pid:
            rows_by_pid[pid] = d   # match script behavior: last row wins within the same file
    for pid, d in rows_by_pid.items():
        if pid not in seen:         # newest file wins across files
            seen[pid] = (fpath, d)

print(f"Unique product IDs found in JSONL: {len(seen)}")
print("Note: --apply will still skip products that are already humanized, holdout, high-sales, or no longer eligible.\n")

def strip_html(h):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h or '')).strip()

issues = 0
for pid, (fpath, d) in sorted(seen.items()):
    if d.get('status') == 'api_length_error':
        print(f"  SKIP  {pid} — api_length_error: {d.get('title','')[:40]}")
        continue

    meta    = (d.get('meta_desc') or '').strip()
    content = d.get('content_html') or ''
    plain   = strip_html(content)

    errs = []
    # Meta checks
    if not (130 <= len(meta) <= 158):     errs.append(f"meta len={len(meta)}")
    if meta.lower().startswith('buy '):    errs.append("meta starts Buy")
    if '৳' in meta:                        errs.append("meta has ৳")
    if 'emart' not in meta.lower():        errs.append("meta no Emart")
    if 'bangladesh' not in meta.lower():   errs.append("meta no Bangladesh")
    # Product name repeated verbatim in meta (too long pattern).
    # Use a longer phrase so multi-word brands like "Some By Mi" do not false-positive.
    title_clean = re.sub(r'\b\d+\s*(ml|g|gm|oz)\b', '', d.get('title','').lower())
    title_words = re.findall(r'[a-z0-9%]+', title_clean)
    repeated_phrase = ' '.join(title_words[:7])
    if len(title_words) >= 7 and repeated_phrase in re.sub(r'[^a-z0-9%]+', ' ', meta.lower()):
        errs.append("meta repeats full product name")
    # No price numbers in meta
    if re.search(r'\b\d{3,5}\b', meta): errs.append("meta has number (price?)")
    # Content checks
    REQUIRED = ['Key Benefits','Key Ingredients','Best For','Not Recommended For','How to Use','Routine Fit']
    missing  = [s for s in REQUIRED if s not in content]
    if missing: errs.append(f"missing sections: {missing}")
    # Two opening paragraphs before the first <h3>
    before_first_h3 = re.split(r'<h3\b', content, maxsplit=1, flags=re.I)[0]
    paras = re.findall(r'<p\b[^>]*>', before_first_h3, re.I)
    if len(paras) < 2: errs.append("fewer than 2 opening paragraph blocks before first h3")
    # Bengali
    if sum(1 for c in plain if 'ঀ' <= c <= '৿') > 5: errs.append("Bengali present")
    # Hallucinations
    for bad in ['emart team verified','emart-verified','our tester','our team tested']:
        if bad in plain.lower(): errs.append(f"fabricated claim: {bad}")
    # SEO score threshold
    score = d.get('seo_score')
    if score is not None and score < 80: errs.append(f"SEO score {score} < 80")

    status = '✓' if not errs else '⚠ ' + ' | '.join(errs)
    issues += len(errs)
    print(f"  {status}  ID {pid} | {len(meta)}c | SEO:{d.get('seo_score','?')} | {meta[:70]}")

print(f"\nTotal issues: {issues} — {'READY TO APPLY' if issues==0 else 'FIX BEFORE APPLYING'}")
PYEOF
```

**Fix any issues directly in the JSONL file before applying.** Do NOT re-run dry-run — that regenerates content and loses manual fixes.

---

## Step 3 — Apply reviewed JSONL to DB

```bash
python3 workspace/docs/humanizer_face_cleansers.py --apply
```

The script:
- Reads matching rows from `face-cleansers-*.jsonl`; newest file wins across files, and the last row wins within the same file
- Skips: `_emart_holdout` products, `total_sales > 20` products, already-humanized products
- Writes per product: post_content, _rank_math_description, _emart_meta_description, _emart_how_to_use, _emart_ingredients (if thin), _rank_math_schema_data (brand), _rank_math_focus_keyword (from GSC), _structured_description (price sync), _emart_humanized (timestamp)
- Appends `<aside class="product-disclaimer">` block
- Saves rollback JSON before first write
- Flushes WP cache + revalidates Next.js `tag:products` at end

---

## Step 4 — Verify after apply

```bash
# Check for encoding bugs, Bengali, or fabricated claims
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT p.ID, LEFT(p.post_title,40) as title
FROM wp4h_posts p
WHERE p.post_type='product' AND p.post_status='publish'
  AND (post_content LIKE '%u2014%'
    OR post_content REGEXP '[ঀ-৿]{10,}'
    OR post_content LIKE '%Emart team%verified%')
  AND ID IN (
    SELECT post_id FROM wp4h_postmeta
    WHERE meta_key='_emart_humanized'
    AND meta_value > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
  ) LIMIT 10;" 2>/dev/null

# Check meta violations
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
    OR LENGTH(pm.meta_value) > 158
    OR pm.meta_value NOT LIKE '%Bangladesh%'
    OR pm.meta_value NOT LIKE '%Emart%');" 2>/dev/null
```

Zero rows = PASS. Fix violations with `wp-cli eval update_post_meta(...)` before finishing.

---

## Step 5 — Check 3 live URLs

```bash
mysql -u emart_user -p"$EMART_DB_PASSWORD" emart_live -e "
SELECT post_name FROM wp4h_posts WHERE ID IN (
  SELECT post_id FROM wp4h_postmeta
  WHERE meta_key='_emart_humanized'
  AND meta_value > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
) LIMIT 3;" 2>/dev/null
```

For each slug, open `https://e-mart.com.bd/shop/{slug}/` and confirm:
- 8 sections render with `<h3>` headings and Tailwind prose styling
- Disclaimer block visible at bottom
- No Bengali text, no `u2014` literal characters
- Meta description in page source is 130–158 chars

---

## "Done" condition

`0 eligible` in the script output means all **auto-eligible** face cleansers are processed — that is, all products excluding `_emart_holdout` (13) and `total_sales > 20` (2). The 15 skipped products are intentional: holdout is the measurement control group, high-sales need owner review. Do not auto-process either group.

---

## DO NOT touch

- `_emart_holdout` products — measurement control group, never humanize
- `total_sales > 20` — needs owner approval first
- Product slugs, prices, stock, categories, images
- Any product outside `face-cleansers` (different script per category)
- `apps/web/src/` code — this is a data-only task

---

## Session end

This is a data-only task: DB writes happen on the live WooCommerce database, while Git only records the reviewed JSONL/rollback/session-log artifacts. No app build, rsync, PM2 restart, or frontend deploy is needed unless code was changed separately. Before pushing, verify the live site and at least 3 affected product URLs.

```bash
# 1. Write session log to LOCAL working tree (not VPS runtime path)
cat >> /root/emart-platform/apps/web/SESSION-LOG.md << EOF

## $(date '+%Y-%m-%d') — Face Cleanser Humanizer Batch
- Applied: [N] products
- Failed: [N] (see workspace/audit/active/face-cleansers-*.jsonl)
- Rollback: workspace/audit/active/face-cleansers-rollback-$(date +%Y-%m-%d).json
- Face cleansers: [done]/218 total (13 holdout + 2 high-sales excluded)
- Next: [continue face cleansers / move to serums-ampoules-essences]
EOF

# 2. Commit artifact/log updates from LOCAL
cd /root/emart-platform
git add workspace/ apps/web/SESSION-LOG.md
git commit -m "chore(log): face cleanser batch $(date +%Y-%m-%d) — [N] applied"

# 3. Smoke test live before pushing
curl -s -o /dev/null -w "%{http_code}" https://e-mart.com.bd/ | grep -q "200" && \
  echo "Smoke PASS — safe to push" || echo "Smoke FAIL — do NOT push"

# 4. Only push after smoke test passes
# git push origin main   # only after smoke test passes (see line above)
```
