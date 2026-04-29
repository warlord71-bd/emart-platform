#!/usr/bin/env python3
"""
generate-missing-descriptions.py
Target: products imported in the last 7 days with empty post_content (<80 chars).
Generates: full description, short_description, rank math title/desc/keyword.
Models: DeepSeek (description) + Gemini Flash (rank math meta).
Updates via WooCommerce REST API. Fully resumable.
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

MODEL_DESC = "google/gemini-2.0-flash-exp:free"
MODEL_META = "google/gemini-2.0-flash-exp:free"
PROGRESS_FILE = "/tmp/gen_missing_desc_progress.json"

auth = HTTPBasicAuth(WC_KEY, WC_SECRET)

AI_RESIDUE = [
    "certainly", "absolutely", "furthermore", "moreover", "leverage",
    "comprehensive", "game-changer", "in conclusion", "in summary",
    "it's worth noting", "delve into", "tapestry", "vibrant", "bustling",
    "revolutionize", "groundbreaking", "cutting-edge", "state-of-the-art",
    "seamlessly", "robust", "paradigm", "synergy", "stakeholder",
    "i'd be happy to", "as an ai", "please note that",
]

# ── OpenRouter key ─────────────────────────────────────────────────────────
def load_or_key():
    try:
        for line in open("/root/.env"):
            if "OPENROUTER_API_KEY=" in line:
                val = line.split("=", 1)[1].strip()
                # deduplicate if key was accidentally doubled in the file
                parts = [p for p in val.split("sk-or-v1-") if p]
                return "sk-or-v1-" + parts[0] if parts else val
    except Exception:
        pass
    return os.environ.get("OPENROUTER_API_KEY", "")

OR_KEY = load_or_key()

# ── Helpers ────────────────────────────────────────────────────────────────
def tg(msg):
    try:
        requests.post(
            f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
            json={"chat_id": TG_CHAT, "text": msg[:4000]}, timeout=10,
        )
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

def remove_ai_residue(text):
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
        "missha": "Missha", "the face shop": "The Face Shop", "skinfood": "Skinfood",
        "cerave": "CeraVe", "neutrogena": "Neutrogena", "bioderma": "Bioderma",
        "rohto": "Rohto Mentholatum", "biore": "Biore", "shiseido": "Shiseido",
        "hada labo": "Hada Labo", "paula's choice": "Paula's Choice",
        "beauty of joseon": "Beauty of Joseon", "round lab": "Round Lab",
        "anua": "Anua", "iunik": "iUNIK", "klairs": "Klairs",
        "torriden": "Torriden", "skin1004": "Skin1004", "isntree": "Isntree",
        "numbuzin": "Numbuzin", "ma:nyo": "Ma:nyo", "dr.jart": "Dr.Jart+",
        "mediheal": "Mediheal", "heimish": "Heimish", "tiam": "Tiam",
        "mixsoon": "MIXSOON", "aplb": "APLB", "acwell": "Acwell",
        "axis-y": "Axis-Y", "the ordinary": "The Ordinary", "cetaphil": "Cetaphil",
        "nivea": "Nivea", "izeze": "IZEZE", "zeze": "ZEZE",
        "sungboon editor": "Sungboon Editor", "i'm from": "I'M FROM",
        "mixsoon": "MIXSOON", "ryo": "RYO", "iunik": "iUNIK",
    }
    for key, val in known.items():
        if key in name:
            return val
    return ""

def get_origin(brand):
    b = brand.lower()
    if any(x in b for x in ["rohto", "mentholatum", "biore", "shiseido", "hada labo", "fancl", "curel", "ryo"]):
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

# ── AI calls ───────────────────────────────────────────────────────────────
def ai_call(prompt, model, max_tokens, temp):
    headers = {
        "Authorization": f"Bearer {OR_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temp,
        "frequency_penalty": 0.5,
    }
    for attempt in range(3):
        try:
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers, json=payload, timeout=90,
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            if attempt < 2:
                time.sleep(5 * (attempt + 1))
            else:
                raise

def generate_description(product):
    name    = product.get("name", "")
    brand   = get_brand(product)
    origin  = get_origin(brand)
    cats    = ", ".join(c["name"] for c in product.get("categories", []))
    specs   = extract_specs(product)
    price   = product.get("price", "")
    spec_str = ", ".join(f"{k}: {v}" for k, v in specs.items()) or "N/A"

    prompt = f"""You are a skincare expert writing product descriptions for Emart (e-mart.com.bd), Bangladesh's #1 authentic K-beauty & international beauty store.

Write a detailed product description in **English only**, HTML tags only (h3, p). No markdown, no preamble.

Product: {name}
Brand: {brand or "Unknown"}
Origin: {origin}
Categories: {cats}
Specs: {spec_str}
Price: ৳{price}

Requirements:
- 400–500 words
- 3–4 h3 sections: What is it, Key Benefits & Ingredients, How to Use, Why Buy from Emart
- Must mention: "100% authentic {origin} import", "Emart verified", "Dhaka 1-2 day delivery", "Cash on Delivery available"
- Mention specific ingredients or proven benefits based on the product name and category
- Include skin type suitability if inferable from the product name
- Warm and helpful tone — helpful for a Bangladesh shopper deciding to buy
- No AI filler phrases (certainly, absolutely, game-changer, revolutionize, etc.)
- Output HTML only — h3 and p tags, nothing else"""

    return remove_ai_residue(ai_call(prompt, MODEL_DESC, 2000, 0.9))

def generate_short_description(product):
    brand   = get_brand(product)
    origin  = get_origin(brand)
    specs   = extract_specs(product)
    cats    = product.get("categories", [])
    cat_name = cats[0]["name"] if cats else "Skincare"
    price   = product.get("price", "")
    vol     = specs.get("volume", "")

    rows = [
        f"<li><strong>Brand:</strong> {brand}</li>" if brand else "",
        f"<li><strong>Category:</strong> {cat_name}</li>",
        f"<li><strong>Size:</strong> {vol}</li>" if vol else "",
        f"<li><strong>Origin:</strong> {origin}</li>",
        f"<li><strong>Price:</strong> ৳{price}</li>" if price else "",
        "<li><strong>Delivery:</strong> Dhaka 1–2 days | Nationwide 3–5 days</li>",
        "<li><strong>Payment:</strong> COD | bKash | Nagad</li>",
        "<li><strong>Authenticity:</strong> 100% authentic — verified by Emart</li>",
    ]
    return "<ul>" + "".join(r for r in rows if r) + "</ul>"

def generate_rank_math_meta(product):
    name  = product.get("name", "")
    brand = get_brand(product)
    price = product.get("price", "")
    specs = extract_specs(product)
    vol   = specs.get("volume", "")

    prompt = f"""Generate SEO meta for a Bangladesh beauty product page. Return valid JSON only — no markdown, no explanation.

Product: {name}
Brand: {brand}
Price: ৳{price}
Volume: {vol}

JSON format exactly:
{{"title": "...", "description": "...", "focus_keyword": "..."}}

Rules:
- title: max 60 chars, include brand + short product name + "Bangladesh"
- description: 150–160 chars, include price, brand, CTA (Order now / COD available), mention authentic
- focus_keyword: buying-intent long-tail, e.g. "buy {name[:35].lower()} bangladesh price"
- Output JSON only, nothing else"""

    raw = ai_call(prompt, MODEL_META, 300, 0.2)
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group())
        except Exception:
            pass
    # Fallback
    title = f"{name[:50]} — Price in Bangladesh"
    desc  = f"Buy {name[:70]} in Bangladesh from Emart. 100% authentic. Dhaka 1-2 day delivery. COD available."
    return {
        "title": title[:60],
        "description": desc[:160],
        "focus_keyword": f"buy {name[:35].lower()} bangladesh",
    }

# ── WC update ──────────────────────────────────────────────────────────────
def update_product(pid, description, short_desc, meta):
    payload = {
        "description": description,
        "short_description": short_desc,
        "meta_data": [
            {"key": "_rank_math_title",         "value": meta["title"]},
            {"key": "_rank_math_description",   "value": meta["description"]},
            {"key": "_rank_math_focus_keyword", "value": meta["focus_keyword"]},
        ],
    }
    r = requests.put(
        f"{WC_URL}/wp-json/wc/v3/products/{pid}",
        json=payload, auth=auth, timeout=30,
    )
    return r.ok

# ── Fetch targets ──────────────────────────────────────────────────────────
def fetch_target_products():
    after = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT00:00:00")
    products = []
    page = 1
    while True:
        r = requests.get(
            f"{WC_URL}/wp-json/wc/v3/products",
            params={"after": after, "status": "publish", "per_page": 100, "page": page},
            auth=auth, timeout=30,
        )
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
    print(f"OpenRouter key: {'✓ set' if OR_KEY else '✗ MISSING — check /root/.env'}")
    if not OR_KEY:
        return

    print("Fetching target products (last 7 days, empty description)...")
    products = fetch_target_products()
    print(f"Found {len(products)} products needing descriptions")

    progress  = load_progress()
    done_ids  = set(progress["done_ids"])
    failed_ids = set(progress["failed_ids"])

    targets = [p for p in products if p["id"] not in done_ids]
    print(f"To process: {len(targets)}  |  Already done: {len(done_ids)}")
    tg(f"🚀 generate-missing-descriptions started\n{len(targets)} products to process")

    for i, product in enumerate(targets, 1):
        pid  = product["id"]
        name = product.get("name", "")
        print(f"\n[{i}/{len(targets)}] #{pid} — {name[:70]}")

        try:
            desc       = generate_description(product)
            time.sleep(4)
            short_desc = generate_short_description(product)
            meta       = generate_rank_math_meta(product)
            time.sleep(4)

            ok = update_product(pid, desc, short_desc, meta)
            if ok:
                done_ids.add(pid)
                progress["done_ids"] = list(done_ids)
                save_progress(progress)
                print(f"  ✓ {meta['title'][:60]}")
                if i % 10 == 0:
                    tg(f"✅ {i}/{len(targets)} done\nLast: {name[:60]}")
            else:
                failed_ids.add(pid)
                progress["failed_ids"] = list(failed_ids)
                save_progress(progress)
                print(f"  ✗ WC API update failed")

        except Exception as e:
            print(f"  ✗ Error: {e}")
            failed_ids.add(pid)
            progress["failed_ids"] = list(failed_ids)
            save_progress(progress)
            time.sleep(5)

        time.sleep(5)

    summary = f"🎉 Done! {len(done_ids)} updated, {len(failed_ids)} failed."
    if failed_ids:
        summary += f"\nFailed IDs: {sorted(failed_ids)}"
    tg(summary)
    print(f"\n{summary}")

if __name__ == "__main__":
    main()
