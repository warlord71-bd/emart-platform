#!/usr/bin/env bash
set -euo pipefail

cd /root/emart-platform

BATCH_SIZE="${BATCH_SIZE:-3}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-180}"
SKIP_IDS="${SKIP_IDS:-3961 2782}"
DATE="$(date +%F)"
REPORT="workspace/audit/active/openclaw-face-cleansers-dryrun-${DATE}.log"

mkdir -p workspace/audit/active

export EMART_DB_PASSWORD="$(
  php -r '$s=file_get_contents("/var/www/wordpress/wp-config.php"); if (preg_match("/define\(\s*[\x27\"]DB_PASSWORD[\x27\"]\s*,\s*[\x27\"]([^\x27\"]*)[\x27\"]\s*\)/",$s,$m)) echo $m[1];'
)"
export OPENROUTER_API_KEY="$(
  php -r '$j=json_decode(file_get_contents("/root/.openclaw/credentials/openrouter_default.json"), true); echo $j["apiKey"] ?? "";'
)"

if [[ -z "${EMART_DB_PASSWORD}" || -z "${OPENROUTER_API_KEY}" ]]; then
  echo "Missing EMART_DB_PASSWORD or OPENROUTER_API_KEY" | tee -a "$REPORT"
  exit 1
fi

skip_sql=""
for id in $SKIP_IDS; do
  [[ "$id" =~ ^[0-9]+$ ]] || continue
  skip_sql+="${skip_sql:+,}${id}"
done

query="
SELECT p.ID
FROM wp4h_posts p
JOIN wp4h_term_relationships tr ON tr.object_id=p.ID
JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
JOIN wp4h_terms t ON t.term_id=tt.term_id
LEFT JOIN wp4h_postmeta pm_h ON pm_h.post_id=p.ID AND pm_h.meta_key='_emart_humanized'
LEFT JOIN wp4h_postmeta pm_o ON pm_o.post_id=p.ID AND pm_o.meta_key='_emart_holdout'
LEFT JOIN wp4h_postmeta pm_s ON pm_s.post_id=p.ID AND pm_s.meta_key='total_sales'
WHERE p.post_type='product' AND p.post_status='publish'
  AND tt.taxonomy='product_cat' AND t.slug='face-cleansers'
  AND pm_h.meta_value IS NULL
  AND pm_o.meta_value IS NULL
  AND CAST(IFNULL(pm_s.meta_value,0) AS UNSIGNED) <= 20
"
if [[ -n "$skip_sql" ]]; then
  query+=" AND p.ID NOT IN (${skip_sql})"
fi
query+=" ORDER BY CAST(IFNULL(pm_s.meta_value,0) AS UNSIGNED) DESC, p.ID ASC LIMIT ${BATCH_SIZE};"

mapfile -t ids < <(mysql -u emart_user -p"${EMART_DB_PASSWORD}" emart_live -N -e "$query" 2>/dev/null)

{
  echo "=== OpenClaw face-cleansers dry-run ${DATE} ==="
  echo "batch_size=${BATCH_SIZE} timeout=${TIMEOUT_SECONDS}s skip_ids=${SKIP_IDS}"
  echo "ids=${ids[*]:-none}"
} | tee -a "$REPORT"

if [[ "${#ids[@]}" -eq 0 ]]; then
  echo "No eligible products found." | tee -a "$REPORT"
  exit 0
fi

for id in "${ids[@]}"; do
  echo "===== DRY RUN post_id=${id} =====" | tee -a "$REPORT"
  if timeout "${TIMEOUT_SECONDS}" python3 workspace/docs/humanizer_face_cleansers.py --dry-run --post-id "$id" >>"$REPORT" 2>&1; then
    echo "===== OK post_id=${id} =====" | tee -a "$REPORT"
  else
    code=$?
    echo "===== FAILED_OR_TIMEOUT post_id=${id} code=${code} =====" | tee -a "$REPORT"
  fi
done

python3 - <<'PYEOF' | tee -a "$REPORT"
import glob, json, re

files = sorted(glob.glob("workspace/audit/active/face-cleansers-*.jsonl"), reverse=True)
files = [f for f in files if "rollback" not in f]
seen = {}
for fpath in files:
    rows_by_pid = {}
    for line in open(fpath):
        if not line.strip():
            continue
        d = json.loads(line)
        pid = d.get("post_id", 0)
        if pid:
            rows_by_pid[pid] = d
    for pid, d in rows_by_pid.items():
        if pid not in seen:
            seen[pid] = (fpath, d)

def strip_html(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h or "")).strip()

issues = 0
valid = 0
for pid, (_fpath, d) in sorted(seen.items()):
    if d.get("status") == "api_length_error":
        continue
    meta = (d.get("meta_desc") or "").strip()
    content = d.get("content_html") or ""
    plain = strip_html(content)
    errs = []
    if not (130 <= len(meta) <= 158): errs.append(f"meta len={len(meta)}")
    if meta.lower().startswith("buy "): errs.append("meta starts Buy")
    if "৳" in meta: errs.append("meta has ৳")
    if "emart" not in meta.lower(): errs.append("meta no Emart")
    if "bangladesh" not in meta.lower(): errs.append("meta no Bangladesh")
    if re.search(r"\b\d{3,5}\b", meta): errs.append("meta has number (price?)")
    required = ["Key Benefits","Key Ingredients","Best For","Not Recommended For","How to Use","Routine Fit"]
    missing = [s for s in required if s not in content]
    if missing: errs.append(f"missing sections: {missing}")
    before_first_h3 = re.split(r"<h3\b", content, maxsplit=1, flags=re.I)[0]
    if len(re.findall(r"<p\b[^>]*>", before_first_h3, re.I)) < 2:
        errs.append("fewer than 2 opening paragraph blocks before first h3")
    if sum(1 for c in plain if "ঀ" <= c <= "৿") > 5:
        errs.append("Bengali present")
    for bad in ["emart team verified","emart-verified","our tester","our team tested"]:
        if bad in plain.lower(): errs.append(f"fabricated claim: {bad}")
    score = d.get("seo_score")
    if score is not None and score < 80:
        errs.append(f"SEO score {score} < 80")
    if errs:
        issues += len(errs)
        print(f"ISSUE ID {pid}: {' | '.join(errs)}")
    else:
        valid += 1

print(f"VALIDATION_SUMMARY valid_rows={valid} issues={issues} status={'READY_TO_REVIEW' if issues == 0 else 'FIX_BEFORE_APPLY'}")
PYEOF

echo "Report: ${REPORT}"
