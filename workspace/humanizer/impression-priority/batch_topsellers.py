#!/usr/bin/env python3
"""
Top-seller batch humanizer (2026-06-23).
Generates + validates + applies long-form descriptions for a target ID list.
Reuses generate_description/fetch_products/get_brand/apply_to_db from the
impression-priority humanizer, adds GMC-safe post-processing + structure
validation, is resumable (skips already-humanized), and logs progress.

Usage:
  export OPENROUTER_API_KEY=...  EMART_DB_PASSWORD=...
  python3 batch_topsellers.py /tmp/topseller_need_ids.json
"""
import json, os, re, sys, time
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.dirname(__file__))
import humanizer_impression_priority as H

LOG   = Path(__file__).with_name("batch_topsellers_progress.log")
JSONL = Path(__file__).with_name(f"topsellers-{datetime.today().strftime('%Y-%m-%d')}.jsonl")
SKIP  = H.HOLDOUT | {4064}  # script GSC holdout — never touch

BANNED = ['treats','cures','heals','prescription','clinically proven',
          'anti-aging miracle','guaranteed','100% effective','permanently','miracle']
REPHRASE = [
    (r'prescription[- ]strength', 'professional-strength'),
    (r'prescription retinoids',   'professional-strength retinoids'),
    (r'\bprescription\b',         'professional-strength'),
    (r'\bclinically proven\b',    'formulated'),
    (r'\bmiracle\b',              'standout'),
    (r'\bpermanently\b',          'over time'),
    (r'\bguaranteed\b',           'designed'),
    (r'\b100% effective\b',       'effective'),
]

def gmc_safe(html: str) -> str:
    for pat, rep in REPHRASE:
        html = re.sub(pat, rep, html, flags=re.I)
    # Residue reduction: collapse spaced em/en-dashes ( — ) that trip the
    # >2.2/100w em-dash density gate. Only spaced separators are rewritten so
    # ranged/compound uses (e.g. "1–2 days") are preserved.
    html = re.sub(r'\s+[—–]\s+', ', ', html)
    return html

# 2026-07-01 content-standard gate (encodes the full humanizer audit standard):
# GMC-clean · >=4 H3 · >=1 list · 500-750 words · em-dash density <=2.2/100w.
def validate(html: str):
    text = BeautifulSoup(html, 'html.parser').get_text(' ', strip=True)
    words = len(text.split())
    h3 = html.count('<h3')
    has_list = ('<ul' in html) or ('<ol' in html)
    emdash = text.count('—') + text.count('–')
    dash_density = (emdash / words * 100) if words else 0
    leftover = [b for b in BANNED if re.search(r'\b'+re.escape(b), text, re.I)]
    if leftover:              return False, f"banned:{leftover}"
    if h3 < 4:                return False, f"only {h3} H3"
    if not has_list:          return False, "no <ul>/<ol> list"
    if words < 500:           return False, f"short:{words}w"
    if words > 780:           return False, f"long:{words}w"
    if dash_density > 2.2:    return False, f"emdash {dash_density:.1f}/100w"
    return True, f"{words}w/{h3}h3/{dash_density:.1f}dash"

def log(msg):
    line = f"{datetime.now().strftime('%H:%M:%S')} {msg}"
    print(line, flush=True)
    with open(LOG, "a") as f: f.write(line+"\n")

def main():
    ids = json.load(open(sys.argv[1]))
    ids = sorted(set(int(i) for i in ids if int(i) not in SKIP))
    log(f"=== batch start: {len(ids)} targets ===")

    applied = failed = skipped = 0
    for n, pid in enumerate(ids, 1):
        rows = H.fetch_products([pid])
        if not rows:
            log(f"[{n}/{len(ids)}] {pid} SKIP — not found"); skipped += 1; continue
        p = rows[0]
        if p.get("humanized"):
            skipped += 1; continue   # resumable: already done
        brand = H.get_brand(pid)
        gen = H.generate_description(p, brand)
        if not gen:
            log(f"[{n}/{len(ids)}] {pid} FAIL — generation"); failed += 1; time.sleep(2); continue
        html = gmc_safe(gen["content_html"])
        ok, why = validate(html)
        if not ok:
            log(f"[{n}/{len(ids)}] {pid} FLAG — {why} — {p['title'][:40]}"); failed += 1; time.sleep(2); continue
        with open(JSONL, "a") as f:
            f.write(json.dumps({"post_id":pid,"title":p["title"],"brand":brand,
                                "content_html":html,"generated_at":datetime.utcnow().isoformat()},
                               ensure_ascii=False)+"\n")
        if H.apply_to_db(pid, html):
            applied += 1
            log(f"[{n}/{len(ids)}] {pid} ✓ {why} — {p['title'][:40]}")
        else:
            failed += 1; log(f"[{n}/{len(ids)}] {pid} FAIL — db write")
        time.sleep(2)

    log(f"=== done: applied {applied} | failed/flagged {failed} | skipped {skipped} ===")

if __name__ == "__main__":
    main()
