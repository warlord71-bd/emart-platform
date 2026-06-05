#!/usr/bin/env python3
"""
Impression-Priority Product Humanizer
======================================
Humanizes the top GSC-impression products that don't yet have humanized descriptions.
Products ordered by impression count: CeraVe(945) → Skin1004(422) → Medicube(355) → ...

WORKFLOW:
  1. DRY-RUN  — generate content, save to JSONL, no DB writes
  2. REVIEW   — inspect JSONL, fix if needed
  3. APPLY    — write to MySQL, flush cache

Usage:
  export OPENROUTER_API_KEY=sk-or-v1-...
  export EMART_DB_PASSWORD=Emart@123456

  # Dry-run first 5 products:
  python3 humanizer_impression_priority.py --dry-run --limit 5

  # Apply reviewed JSONL:
  python3 humanizer_impression_priority.py --apply

  # Single product:
  python3 humanizer_impression_priority.py --dry-run --post-id 50630
"""

from __future__ import annotations
import argparse, json, os, re, subprocess, sys, time
from datetime import datetime
from pathlib import Path
from bs4 import BeautifulSoup
from openai import OpenAI
import mysql.connector

# ── Config ──────────────────────────────────────────────────────────────────

API_KEY = os.environ.get("OPENROUTER_API_KEY","")
MODEL   = "deepseek/deepseek-v4-flash"
DB_CFG  = dict(host="localhost", database="emart_live",
               user="emart_user", password=os.environ.get("EMART_DB_PASSWORD",""))
PREFIX  = "wp4h_"
WP_PATH = "/var/www/wordpress"
DATE    = datetime.today().strftime("%Y-%m-%d")
AUDIT   = Path("workspace/humanizer/impression-priority/active")
JSONL   = AUDIT / f"impression-priority-{DATE}.jsonl"

# Impression-priority product IDs (ordered by GSC impressions desc)
PRIORITY_IDS = [50630,56975,58506,2611,2591,56117,53315,4064,58264,24437,50540,43841,57109]

# Holdout: 3 products not to humanize (for GSC measurement)
HOLDOUT = {2611, 2591, 4064}  # Innisfree clay mask, COSRX snail, innisfree green tea cream

DISCLAIMER = (
    '\n<aside class="product-disclaimer">'
    '\n<p><strong>Check on Delivery:</strong> Inspect the product carefully when you receive your order. '
    'Packaging can vary between batches while the product remains the same original item.</p>'
    '\n<p><strong>Storage:</strong> Store in a cool, dry place away from direct sunlight. '
    'Keep out of reach of children. Check expiry date on packaging before use.</p>'
    '\n<p><strong>Patch Test:</strong> If you have sensitive skin, apply a small amount to your '
    'inner wrist and wait 24 hours before full use. Stop use if irritation occurs.</p>'
    '\n</aside>'
)

# ── DB helpers ───────────────────────────────────────────────────────────────

def db_connect():
    return mysql.connector.connect(**DB_CFG, charset="utf8mb4")

def fetch_products(post_ids: list[int]) -> list[dict]:
    conn = db_connect()
    cur  = conn.cursor(dictionary=True)
    ph   = ",".join(["%s"] * len(post_ids))
    cur.execute(f"""
        SELECT p.ID AS post_id, p.post_title AS title, p.post_content AS content,
               p.post_excerpt AS excerpt,
               MAX(CASE WHEN pm.meta_key='_emart_humanized'        THEN pm.meta_value END) AS humanized,
               MAX(CASE WHEN pm.meta_key='_rank_math_focus_keyword' THEN pm.meta_value END) AS focus_kw
        FROM {PREFIX}posts p
        LEFT JOIN {PREFIX}postmeta pm ON pm.post_id = p.ID
        WHERE p.ID IN ({ph}) AND p.post_type='product' AND p.post_status='publish'
        GROUP BY p.ID
    """, post_ids)
    rows = cur.fetchall()
    conn.close()
    return rows

def get_brand(post_id: int) -> str:
    conn = db_connect()
    cur  = conn.cursor()
    cur.execute(f"""
        SELECT t.name FROM {PREFIX}terms t
        JOIN {PREFIX}term_taxonomy tt ON tt.term_id=t.term_id
        JOIN {PREFIX}term_relationships tr ON tr.term_taxonomy_id=tt.term_taxonomy_id
        WHERE tr.object_id=%s AND tt.taxonomy='product_brand' LIMIT 1
    """, (post_id,))
    r = cur.fetchone()
    conn.close()
    return r[0] if r else ""

def apply_to_db(post_id: int, content_html: str) -> bool:
    conn = db_connect()
    cur  = conn.cursor()
    try:
        cur.execute(f"UPDATE {PREFIX}posts SET post_content=%s WHERE ID=%s",
                    (content_html, post_id))
        cur.execute(f"INSERT INTO {PREFIX}postmeta(post_id,meta_key,meta_value) VALUES(%s,'_emart_humanized','1') "
                    f"ON DUPLICATE KEY UPDATE meta_value='1'", (post_id,))
        conn.commit()
        # Flush WP cache
        subprocess.run(["wp","--path="+WP_PATH,"--allow-root","cache","flush"],
                       capture_output=True)
        return True
    except Exception as e:
        conn.rollback()
        print(f"  DB error: {e}")
        return False
    finally:
        conn.close()

# ── LLM generation ───────────────────────────────────────────────────────────

def _strip(html: str) -> str:
    return BeautifulSoup(html or "", "html.parser").get_text(" ", strip=True)

def generate_description(product: dict, brand: str) -> dict | None:
    if not API_KEY:
        print("ERROR: OPENROUTER_API_KEY not set"); sys.exit(1)

    client = OpenAI(api_key=API_KEY, base_url="https://openrouter.ai/api/v1")
    title  = product["title"]
    orig   = _strip(product.get("content","") or "")[:1500]
    meta   = product.get("meta_desc","") or ""
    focus  = product.get("focus_kw","") or ""

    prompt = f"""You are writing an authentic, helpful product description for an ecommerce skincare store in Bangladesh.

Product: {title}
Brand: {brand}
Existing content: {orig}
Focus keyword: {focus}

Write a complete, detailed product description in HTML.

STRUCTURE (required H3 sections):
<p>[Opening paragraph — what this product is, who it's for, Bangladesh context]</p>

<h3>Key Benefits</h3>
<ul><li>3-5 specific, factual benefits based on ingredients</li></ul>

<h3>Key Ingredients</h3>
<ul><li>Main active ingredients with brief mechanism — ingredient-focused, not claim-based</li></ul>

<h3>Best For</h3>
<ul><li>Skin types and concerns this suits</li></ul>

<h3>Not Recommended For</h3>
<ul><li>Who should avoid or patch-test first</li></ul>

<h3>How to Use</h3>
<ol><li>Step-by-step application — specific amounts, timing, technique</li></ol>

<h3>Routine Fit</h3>
<p>[Where it fits in AM/PM routine, what to pair it with, Bangladesh climate tips]</p>

RULES:
- Write in clear English, factual tone, no marketing hype
- Use ingredient-focused language — describe WHAT it contains and HOW it works
- Never use: treats, cures, heals, prescription, clinically proven (without evidence), repairs, anti-aging miracle
- Include Bangladesh-relevant detail (humidity, climate, availability context)
- Total content: 600-900 words
- Do NOT include H1 or H2 tags
- Return ONLY the HTML, no markdown, no explanation

Return ONLY the HTML product description. No meta description, no explanation.
"""

    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role":"user","content":prompt}],
            temperature=0.4, max_tokens=2000
        )
        content = resp.choices[0].message.content.strip()

        # Append disclaimer
        content += DISCLAIMER

        return {"content_html": content}
    except Exception as e:
        print(f"  LLM error: {e}")
        return None

# ── CLI ───────────────────────────────────────────────────────────────────────

def cmd_dry_run(args):
    AUDIT.mkdir(parents=True, exist_ok=True)

    ids = PRIORITY_IDS if not args.post_id else [args.post_id]
    ids = [i for i in ids if i not in HOLDOUT]

    products = fetch_products(ids)
    products.sort(key=lambda p: PRIORITY_IDS.index(p["post_id"]) if p["post_id"] in PRIORITY_IDS else 999)

    # Skip already humanized
    todo = [p for p in products if not p.get("humanized")]
    if args.limit:
        todo = todo[:args.limit]

    print(f"Products to humanize: {len(todo)} (holdout: {len(HOLDOUT)})")

    results = []
    for i, product in enumerate(todo, 1):
        pid   = product["post_id"]
        brand = get_brand(pid)
        print(f"[{i}/{len(todo)}] {pid} — {product['title'][:55]} ({brand})")

        gen = generate_description(product, brand)
        if not gen:
            print("  SKIP — generation failed")
            continue

        row = {
            "post_id":      pid,
            "title":        product["title"],
            "brand":        brand,
            "content_html": gen["content_html"],
            "generated_at": datetime.utcnow().isoformat(),
        }
        results.append(row)
        with open(JSONL, "a") as f:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        print(f"  ✓ saved ({len(_strip(gen['content_html']))} chars, meta {len(gen['meta_desc'])}c)")
        time.sleep(2)

    print(f"\nDone. {len(results)} products → {JSONL}")
    print("Next: review JSONL, then run --apply")

def cmd_apply(args):
    if not JSONL.exists():
        print(f"ERROR: {JSONL} not found. Run --dry-run first."); sys.exit(1)

    rows = [json.loads(l) for l in open(JSONL) if l.strip()]
    if args.post_id:
        rows = [r for r in rows if r["post_id"] == args.post_id]

    print(f"Applying {len(rows)} products from {JSONL}")
    ok = fail = 0
    for row in rows:
        pid = row["post_id"]
        if apply_to_db(pid, row["content_html"]):
            print(f"  ✓ {pid} — {row['title'][:50]}")
            ok += 1
        else:
            print(f"  ✗ {pid} — failed")
            fail += 1
        time.sleep(0.5)

    print(f"\nApplied: {ok} | Failed: {fail}")
    if ok:
        # Revalidate Next.js ISR
        import subprocess
        subprocess.run(["curl","-s","-o","/dev/null",
                        "-H","x-revalidate-secret:"+os.environ.get("REVALIDATE_SECRET",""),
                        "https://e-mart.com.bd/api/revalidate?tag=products"], capture_output=True)
        print("ISR revalidated")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--apply",   action="store_true")
    ap.add_argument("--post-id", type=int)
    ap.add_argument("--limit",   type=int)
    args = ap.parse_args()

    if args.dry_run: cmd_dry_run(args)
    elif args.apply: cmd_apply(args)
    else:            ap.print_help()
