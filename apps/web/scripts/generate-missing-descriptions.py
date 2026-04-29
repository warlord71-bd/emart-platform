#!/usr/bin/env python3
"""
generate-missing-descriptions.py  (v2 — comprehensive)
Target: products imported in last 7 days with empty post_content.
Generates in one AI call (structured JSON):
  - description       → post_content (400-500w, h3+p)
  - ingredients       → _emart_ingredients meta (Ingredients tab)
  - how_to_use        → _emart_how_to_use meta (How to Use tab)
  - short_desc        → short_description (2-sentence paragraph)
  - tags              → product.tags (green keyword strip, 4 tags)
  - rank_math_title   → _rank_math_title
  - rank_math_desc    → _rank_math_description (155-160 chars)
  - focus_keyword     → _rank_math_focus_keyword
Model: llama-3.3-70b-versatile on Groq (free, high quality).
Resumable via /tmp/gen_missing_desc_progress.json.
"""

import requests
from requests.auth import HTTPBasicAuth
import time, json, re, os
from datetime import datetime, timedelta

# ── Credentials ────────────────────────────────────────────────────────────
WC_URL    = "https://e-mart.com.bd"
WC_KEY    = "ck_9d9fabaffcc52af85797a6887feb5a8da730b51f"
WC_SECRET = "cs_2551608b6d9f84841f8193eaffff2bfb120e659b"
TG_TOKEN  = "8705011508:AAGjcEGOjQ7inSa-chq9sJswEOo8XcJ9KXE"
TG_CHAT   = "6906852635"

def _load_groq_key():
    # Read from opencode config (preferred) or env
    try:
        cfg = json.load(open(os.path.expanduser("~/.config/opencode/opencode.json")))
        key = cfg.get("provider", {}).get("groq", {}).get("options", {}).get("apiKey", "")
        if key:
            return key
    except Exception:
        pass
    return os.environ.get("GROQ_API_KEY", "")

GROQ_KEY = _load_groq_key()

GROQ_URL      = "https://api.groq.com/openai/v1/chat/completions"
MODEL_MAIN    = "llama-3.3-70b-versatile"   # full content JSON
MODEL_FAST    = "llama-3.1-8b-instant"      # rank math meta

PROGRESS_FILE = "/tmp/gen_missing_desc_progress.json"

auth = HTTPBasicAuth(WC_KEY, WC_SECRET)

AI_RESIDUE = [
    "certainly", "absolutely", "furthermore", "moreover", "leverage",
    "comprehensive", "game-changer", "in conclusion", "in summary",
    "it's worth noting", "delve into", "tapestry", "vibrant", "bustling",
    "revolutionize", "groundbreaking", "cutting-edge", "seamlessly",
    "robust", "paradigm", "synergy", "i'd be happy to", "as an ai",
]

# ── Helpers ────────────────────────────────────────────────────────────────
def tg(msg):
    try:
        requests.post(f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
                      json={"chat_id": TG_CHAT, "text": msg[:4000]}, timeout=10)
    except Exception:
        pass

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {"done_ids": [], "failed_ids": []}

def save_progress(p):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(p, f)

def clean(text):
    for phrase in AI_RESIDUE:
        text = re.sub(re.escape(phrase), "", text, flags=re.IGNORECASE)
    return re.sub(r"  +", " ", text).strip()

def get_brand(product):
    for attr in product.get("attributes", []):
        if attr["name"].lower() == "brand" and attr.get("options"):
            return attr["options"][0]
    name = product.get("name", "").lower()
    known = {
        "cosrx": "COSRX", "laneige": "Laneige", "innisfree": "Innisfree",
        "some by mi": "Some By Mi", "tonymoly": "TonyMoly", "etude": "Etude House",
        "missha": "Missha", "cerave": "CeraVe", "neutrogena": "Neutrogena",
        "bioderma": "Bioderma", "rohto": "Rohto Mentholatum", "biore": "Biore",
        "shiseido": "Shiseido", "hada labo": "Hada Labo",
        "paula's choice": "Paula's Choice", "beauty of joseon": "Beauty of Joseon",
        "round lab": "Round Lab", "anua": "Anua", "iunik": "iUNIK",
        "klairs": "Klairs", "torriden": "Torriden", "skin1004": "Skin1004",
        "isntree": "Isntree", "numbuzin": "Numbuzin", "ma:nyo": "Ma:nyo",
        "dr.jart": "Dr.Jart+", "mediheal": "Mediheal", "heimish": "Heimish",
        "tiam": "Tiam", "mixsoon": "MIXSOON", "aplb": "APLB", "acwell": "Acwell",
        "axis-y": "Axis-Y", "the ordinary": "The Ordinary", "cetaphil": "Cetaphil",
        "nivea": "Nivea", "izeze": "IZEZE", "zeze": "ZEZE",
        "sungboon editor": "Sungboon Editor", "i'm from": "I'M FROM",
        "ryo": "RYO", "some by mi": "Some By Mi",
    }
    for key, val in known.items():
        if key in name:
            return val
    return ""

def get_origin(brand):
    b = brand.lower()
    if any(x in b for x in ["rohto", "mentholatum", "biore", "shiseido", "hada labo", "ryo", "fancl"]):
        return "Japan"
    if any(x in b for x in ["cerave", "neutrogena", "paula's choice", "the ordinary", "cetaphil", "nivea"]):
        return "USA"
    if any(x in b for x in ["bioderma", "la roche", "vichy", "avene"]):
        return "France"
    return "Korea"

def extract_specs(product):
    name = product.get("name", "")
    specs = {}
    vol = re.search(r"(\d+(?:\.\d+)?)\s*(ml|mL|g|oz)", name)
    if vol:
        specs["volume"] = f"{vol.group(1)}{vol.group(2)}"
    spf = re.search(r"SPF\s*(\d+\+?)", name, re.IGNORECASE)
    if spf:
        specs["spf"] = f"SPF {spf.group(1)}"
    pa = re.search(r"PA(\++)", name)
    if pa:
        specs["pa"] = f"PA{pa.group(1)}"
    return specs

# ── AI call ────────────────────────────────────────────────────────────────
def groq_call(prompt, model, max_tokens, temp):
    headers = {"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temp,
    }
    for attempt in range(3):
        try:
            r = requests.post(GROQ_URL, headers=headers, json=payload, timeout=90)
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            if attempt < 2:
                time.sleep(6 * (attempt + 1))
            else:
                raise

# ── Content generation (single JSON call) ─────────────────────────────────
def generate_all_content(product):
    name    = product.get("name", "")
    brand   = get_brand(product)
    origin  = get_origin(brand)
    cats    = ", ".join(c["name"] for c in product.get("categories", []))
    specs   = extract_specs(product)
    spec_str = ", ".join(f"{k}: {v}" for k, v in specs.items()) or "N/A"
    price   = product.get("price", "")
    vol     = specs.get("volume", "")
    spf     = specs.get("spf", "")

    prompt = f"""You are writing product content for Emart (e-mart.com.bd), Bangladesh's #1 authentic K-beauty & international beauty store.

Generate complete product content. Return ONLY valid JSON — no markdown, no explanation, no code block.

Product: {name}
Brand: {brand or "Unknown"}
Origin: {origin}
Categories: {cats}
Specs: {spec_str}
Price (BDT): {price}

Return this exact JSON structure:
{{
  "description": "400-500 word HTML product description. Use h3 and p tags only. 3-4 sections: What is it, Key Benefits & Ingredients, How to Use, Why Buy from Emart. Must mention: 100% authentic {origin} import, Emart verified, Dhaka 1-2 day delivery, Cash on Delivery available. English only. No Bengali. Helpful and warm tone.",
  "ingredients": "HTML list of main active ingredients with one-line benefit for each. Use ul and li tags. If exact ingredients unknown, list typical key ingredients for this product type based on its name and category. Keep concise.",
  "how_to_use": "HTML numbered steps (ol and li tags) for using this product. 4-6 practical steps. Based on product type.",
  "short_desc": "2 plain-text sentences. First: Buy [name] in Bangladesh from Emart. 100% authentic {origin} import. Second: mention a key benefit + Dhaka delivery + COD. No Bengali characters.",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "seo_title": "max 60 chars, brand + product short name + Bangladesh",
  "seo_desc": "155-160 chars exactly. Include brand, key benefit, price if known, COD, authentic. End with CTA.",
  "focus_keyword": "buying-intent long-tail keyword like buy [product] Bangladesh price"
}}

For tags: 4 SEO buying-intent tags relevant to this product. Examples: "Korean Sunscreen Bangladesh", "Buy {brand} Bangladesh", "Authentic Skincare BD".
Output JSON only."""

    raw = groq_call(prompt, MODEL_MAIN, 2500, 0.7)

    # Extract JSON block
    m = re.search(r"\{[\s\S]*\}", raw)
    if not m:
        raise ValueError(f"No JSON in response: {raw[:200]}")

    data = json.loads(m.group())

    # Clean AI residue from text fields
    for key in ("description", "ingredients", "how_to_use"):
        if key in data and isinstance(data[key], str):
            data[key] = clean(data[key])

    # Ensure short_desc has no Bengali chars (would be filtered by frontend)
    short = data.get("short_desc", "")
    short = re.sub(r"[ঀ-৿৳]", "", short).strip()
    if not short:
        short = f"Buy {name} in Bangladesh from Emart. 100% authentic {origin} import, Dhaka 1-2 day delivery, COD available."
    data["short_desc"] = short

    # Validate tags
    tags = data.get("tags", [])
    if not isinstance(tags, list):
        tags = []
    data["tags"] = [str(t).strip() for t in tags if t][:4]

    # Fallback SEO fields
    if not data.get("seo_title"):
        data["seo_title"] = f"{name[:45]} — Price in Bangladesh"[:60]
    if not data.get("seo_desc"):
        data["seo_desc"] = f"Buy {name[:60]} in Bangladesh. 100% authentic. Dhaka 1-2 day delivery. COD available."[:160]
    if not data.get("focus_keyword"):
        data["focus_keyword"] = f"buy {name[:35].lower()} bangladesh"

    return data

# ── WC update ──────────────────────────────────────────────────────────────
def update_product(pid, data):
    tags_payload = [{"name": t} for t in data.get("tags", [])]

    payload = {
        "description":       data["description"],
        "short_description": f"<p>{data['short_desc']}</p>",
        "tags":              tags_payload,
        "meta_data": [
            {"key": "_emart_ingredients",        "value": data.get("ingredients", "")},
            {"key": "_emart_how_to_use",         "value": data.get("how_to_use", "")},
            {"key": "_rank_math_title",          "value": data.get("seo_title", "")},
            {"key": "_rank_math_description",    "value": data.get("seo_desc", "")},
            {"key": "_rank_math_focus_keyword",  "value": data.get("focus_keyword", "")},
        ],
    }
    r = requests.put(f"{WC_URL}/wp-json/wc/v3/products/{pid}",
                     json=payload, auth=auth, timeout=30)
    return r.ok, r.status_code

# ── Fetch targets ──────────────────────────────────────────────────────────
def fetch_target_products():
    after = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT00:00:00")
    products = []
    page = 1
    while True:
        r = requests.get(f"{WC_URL}/wp-json/wc/v3/products",
                         params={"after": after, "status": "publish",
                                 "per_page": 100, "page": page},
                         auth=auth, timeout=30)
        if not r.ok:
            print(f"API error page {page}: {r.status_code}")
            break
        batch = r.json()
        if not batch:
            break
        for p in batch:
            plain = re.sub(r"<[^>]+>", "", p.get("description", "")).strip()
            if len(plain) < 80:
                products.append(p)
        if len(batch) < 100:
            break
        page += 1
        time.sleep(1)
    return products

# ── Main ───────────────────────────────────────────────────────────────────
def main():
    print("Fetching target products (last 7 days, empty description)...")
    products = fetch_target_products()
    print(f"Found {len(products)} products needing content")

    progress   = load_progress()
    done_ids   = set(progress["done_ids"])
    failed_ids = set(progress["failed_ids"])

    targets = [p for p in products if p["id"] not in done_ids]
    print(f"To process: {len(targets)}  |  Already done: {len(done_ids)}")
    tg(f"🚀 generate-missing-descriptions v2 started\n{len(targets)} products to process\nModel: {MODEL_MAIN}")

    for i, product in enumerate(targets, 1):
        pid  = product["id"]
        name = product.get("name", "")
        print(f"\n[{i}/{len(targets)}] #{pid} — {name[:70]}")

        try:
            data = generate_all_content(product)
            time.sleep(3)

            ok, status = update_product(pid, data)
            if ok:
                done_ids.add(pid)
                progress["done_ids"] = list(done_ids)
                save_progress(progress)
                print(f"  ✓ {data['seo_title'][:60]}")
                print(f"    tags: {data['tags']}")
                if i % 10 == 0:
                    tg(f"✅ {i}/{len(targets)} done\nLast: {name[:60]}")
            else:
                failed_ids.add(pid)
                progress["failed_ids"] = list(failed_ids)
                save_progress(progress)
                print(f"  ✗ WC API {status}")

        except json.JSONDecodeError as e:
            print(f"  ✗ JSON parse error: {e}")
            failed_ids.add(pid)
            progress["failed_ids"] = list(failed_ids)
            save_progress(progress)
            time.sleep(5)
        except Exception as e:
            print(f"  ✗ Error: {e}")
            failed_ids.add(pid)
            progress["failed_ids"] = list(failed_ids)
            save_progress(progress)
            time.sleep(5)

        time.sleep(4)

    summary = f"🎉 Done! {len(done_ids)} updated, {len(failed_ids)} failed."
    if failed_ids:
        summary += f"\nFailed IDs: {sorted(failed_ids)[:20]}"
    tg(summary)
    print(f"\n{summary}")

if __name__ == "__main__":
    main()
