import requests
from requests.auth import HTTPBasicAuth
import time
import json
import re
import os
import hashlib

WC_URL = "https://e-mart.com.bd"
WC_KEY = "ck_9d9fabaffcc52af85797a6887feb5a8da730b51f"
WC_SECRET = "cs_2551608b6d9f84841f8193eaffff2bfb120e659b"
OR_KEY = "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"
TG_TOKEN = "8705011508:AAGjcEGOjQ7inSa-chq9sJswEOo8XcJ9KXE"
TG_CHAT = "6906852635"

auth = HTTPBasicAuth(WC_KEY, WC_SECRET)
BATCH = 20
SCORE_THRESHOLD = 50
PROGRESS_FILE = "/tmp/phase2_progress.json"

AI_RESIDUE = [
    "certainly","absolutely","furthermore","moreover","leverage",
    "comprehensive","game-changer","in conclusion","in summary",
    "it's worth noting","delve into","tapestry","vibrant","bustling",
    "revolutionize","groundbreaking","cutting-edge","state-of-the-art",
    "seamlessly","robust","paradigm","synergy","stakeholder",
    "i'd be happy to","as an ai","please note that","it is worth",
    "needless to say","as mentioned","in today's world"
]

HUMAN_OPENERS = [
    "সত্যি বলতে, এই পণ্যটা নিয়ে আমরা বেশ impressed।",
    "E-Mart BD-তে এই পণ্যটা আনার পেছনে একটা গল্প আছে।",
    "Korean skincare-এর অনেক পণ্য test করার পর এটা আমাদের catalog-এ এসেছে।",
    "Dhaka-র গরম আর আর্দ্র আবহাওয়ায় ত্বকের যত্ন নেওয়া সহজ না।",
    "কিছু পণ্য আছে যেগুলো একবার ব্যবহার করলে ছাড়তে মন চায় না।",
    "আমাদের একজন customer প্রথম এই পণ্যটার কথা বলেছিলেন।",
    "E-Mart team এই পণ্যটা personally test করেছে।",
    "বাংলাদেশের আবহাওয়া আর ত্বকের কথা মাথায় রেখেই এটা আনা হয়েছে।",
]

def tg(msg):
    try:
        requests.post(f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
            json={"chat_id": TG_CHAT, "text": msg[:4000]}, timeout=10)
    except: pass

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
    text = re.sub(r'  +', ' ', text)
    return text.strip()

def score_description(desc):
    if not desc or len(desc.strip()) < 50:
        return 0
    score = 0
    text = re.sub('<[^<]+?>', '', desc).lower()
    wc = len(text.split())
    if wc >= 300: score += 25
    elif wc >= 150: score += 15
    elif wc >= 80: score += 8
    bd_kw = ['bangladesh','dhaka','emart','authentic','অথেনটিক','বাংলাদেশ','ঢাকা','cod','delivery']
    score += min(20, sum(3 for k in bd_kw if k in text))
    bangla = len(re.findall(r'[\u0980-\u09FF]', desc))
    if bangla > 200: score += 15
    elif bangla > 100: score += 10
    elif bangla > 30: score += 5
    if '<h3' in desc or '<h2' in desc: score += 8
    if '<p>' in desc or '<p ' in desc: score += 7
    if 'faq' in text or 'প্রশ্ন' in text: score += 5
    info_kw = ['ingredient','how to use','ব্যবহার','উপাদান']
    score += min(20, sum(3 for k in info_kw if k in text))
    return min(100, score)

def get_brand(product):
    for attr in product.get("attributes", []):
        if attr["name"].lower() == "brand" and attr.get("options"):
            return attr["options"][0]
    name = product.get("name", "").lower()
    brands = {
        "cosrx":"COSRX","laneige":"Laneige","innisfree":"Innisfree",
        "some by mi":"Some By Mi","tonymoly":"TONYMOLY","etude":"Etude House",
        "missha":"Missha","cerave":"CeraVe","neutrogena":"Neutrogena",
        "bioderma":"Bioderma","rohto":"Rohto Mentholatum","biore":"Biore",
        "shiseido":"Shiseido","hada labo":"Hada Labo","paula's choice":"Paula's Choice",
        "beauty of joseon":"Beauty of Joseon","round lab":"Round Lab",
        "anua":"Anua","iunik":"iUNIK","klairs":"Klairs","torriden":"Torriden",
        "skin1004":"Skin1004","isntree":"Isntree","numbuzin":"Numbuzin",
        "axis-y":"AXIS-Y","heimish":"Heimish","benton":"Benton",
        "purito":"PURITO","neogen":"NEOGEN","medicube":"Medicube",
        "nivea":"Nivea","dove":"Dove","vaseline":"Vaseline","garnier":"Garnier",
        "maybelline":"Maybelline","the ordinary":"The Ordinary",
        "the body shop":"The Body Shop","mac":"MAC","celimax":"Celimax",
        "tirtir":"TIRTIR","goodal":"Goodal","mixsoon":"Mixsoon",
        "haruharu":"Haruharu Wonder","tocobo":"Tocobo","jumiso":"Jumiso",
        "melano cc":"MELANO CC","yanagiya":"YANAGIYA","dhc":"DHC",
    }
    for key in sorted(brands.keys(), key=len, reverse=True):
        if key in name:
            return brands[key]
    return product.get("name", "").split()[0].upper()

def get_origin(brand):
    jp = ["rohto","mentholatum","shiseido","hada labo","biore","yanagiya","melano cc","dhc","lion"]
    us = ["cerave","neutrogena","paula's choice","the ordinary","olay","palmer's"]
    fr = ["bioderma","la roche","vichy","avene"]
    ind = ["wishcare","mamaearth","minimalist"]
    b = brand.lower()
    if any(x in b for x in jp): return "Japan"
    if any(x in b for x in us): return "USA"
    if any(x in b for x in fr): return "France"
    if any(x in b for x in ind): return "India"
    return "Korea"

def extract_specs(product):
    text = product.get("name", "") + " " + re.sub('<[^<]+?>', '', product.get("description", ""))
    specs = {}
    vol = re.search(r'(\d+(?:\.\d+)?)\s*(ml|mL|g|oz)', text)
    if vol: specs["volume"] = f"{vol.group(1)}{vol.group(2)}"
    spf = re.search(r'SPF\s*(\d+\+?)', text, re.IGNORECASE)
    if spf: specs["spf"] = f"SPF {spf.group(1)}"
    return specs

def call_ai(model, prompt, max_tokens=1800, temp=0.85):
    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OR_KEY}", "Content-Type": "application/json"},
            json={"model": model, "messages": [{"role": "user", "content": prompt}],
                  "max_tokens": max_tokens, "temperature": temp, "frequency_penalty": 0.5},
            timeout=60)
        c = r.json()["choices"][0]["message"]["content"].strip()
        c = re.sub(r'^```(?:html|json)?\s*', '', c)
        c = re.sub(r'\s*```$', '', c)
        return c
    except Exception as e:
        print(f"    AI error: {e}")
        return None

def gen_description(product):
    import random
    name = product.get("name", "")
    price = str(product.get("price") or "0").split("-")[0]
    brand = get_brand(product)
    origin = get_origin(brand)
    cats = ", ".join([c["name"] for c in product.get("categories", [])])
    specs = extract_specs(product)
    specs_str = " | ".join([f"{k}:{v}" for k, v in specs.items()]) if specs else ""
    existing = re.sub('<[^<]+?>', '', product.get("description", ""))[:200]
    opener = random.choice(HUMAN_OPENERS)

    prompt = f"""You are Riya, a 28-year-old Bangladeshi skincare blogger writing for E-Mart BD in Dhaka.

Product: "{name}"
Brand: {brand} ({origin}) | Price: ৳{price}
{f"Specs: {specs_str}" if specs_str else ""}
Categories: {cats}
Existing info: {existing}

Start with: "{opener}"

Write a Google E-E-A-T optimized WooCommerce product description.

STRUCTURE (use these h3 headings):
1. Opening paragraph — personal experience + Bangladesh context
2. <h3>কেন এই পণ্য বেছে নেবেন?</h3> — 3 benefits as paragraphs
3. <h3>Key Ingredients</h3> — 3 ingredients with Bangla explanation
4. <h3>কীভাবে ব্যবহার করবেন</h3> — steps in paragraph form
5. <h3>সাধারণ জিজ্ঞাসা</h3> — 3 FAQ in Bangla Q&A format
6. Closing — authenticity + delivery + COD

STRICT RULES:
- 60% Bangla + 40% English naturally mixed
- 500-550 words | HTML only — h3+p tags | NO bullet points in main body
- Include: "E-Mart team personally verify করেছে"
- Include: "100% অথেনটিক | {origin} থেকে directly import"
- Include: "ঢাকায় ১-২ দিন | সারাদেশে ৩-৫ দিন | COD available"
- Dhaka humidity/pollution/heat context
- NEVER use: certainly, absolutely, furthermore, revolutionize, seamlessly, game-changer
- Warm human tone — like a friend recommending a product

Return ONLY clean HTML. No markdown. No explanation."""

    result = call_ai("deepseek/deepseek-chat", prompt, max_tokens=2000, temp=0.93)
    if result:
        result = remove_ai_residue(result)
        result = re.sub(r'^```html\s*', '', result.strip())
        result = re.sub(r'```\s*$', '', result.strip())
    return result

def gen_rank_math_meta(product):
    name = product.get("name", "")
    brand = get_brand(product)
    price = str(product.get("price") or "0").split("-")[0]
    specs = extract_specs(product)
    vol = specs.get("volume", "")
    cat = product.get("categories", [{}])[0].get("name", "Skincare") if product.get("categories") else "Skincare"

    prompt = f"""Generate SEO metadata for a Bangladesh skincare e-commerce product.

Product: {name}
Brand: {brand} | Price: ৳{price} | Volume: {vol} | Category: {cat}

Return ONLY this JSON (no markdown, no explanation):
{{"title":"SEO title under 60 chars with brand+product+Bangladesh","description":"Meta description 150-160 chars with price+brand+buy CTA for Bangladesh customers","focus_keyword":"long-tail buying intent keyword in English"}}"""

    result = call_ai("google/gemini-2.5-flash-lite", prompt, max_tokens=300, temp=0.2)
    if not result:
        return None
    try:
        result = re.sub(r'^[^{]*', '', result)
        result = re.sub(r'[^}]*$', '', result)
        return json.loads(result)
    except:
        return None

def gen_faq_schema(product):
    name = product.get("name", "")
    brand = get_brand(product)
    price = str(product.get("price") or "0").split("-")[0]

    prompt = f"""3 FAQ for "{name}" by {brand} (৳{price}) sold in Bangladesh.
Real questions Bangladeshi customers ask before buying.
Return ONLY JSON array (no markdown):
[{{"q":"Bangla question?","a":"Bangla answer 2-3 sentences."}},{{"q":"Bangla question?","a":"Bangla answer."}},{{"q":"Bangla question?","a":"Bangla answer."}}]"""

    result = call_ai("deepseek/deepseek-chat", prompt, max_tokens=600, temp=0.6)
    if not result:
        return "", ""
    try:
        result = re.sub(r'^[^\[]*', '', result)
        result = re.sub(r'[^\]]*$', '', result)
        faqs = json.loads(result)
        schema = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": f["q"],
             "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
            for f in faqs]}
        faq_html = '<div class="emart-faq"><h3>সাধারণ জিজ্ঞাসা (FAQ)</h3>'
        for f in faqs:
            faq_html += f'<p><strong>❓ {f["q"]}</strong><br>✅ {f["a"]}</p>'
        faq_html += '</div>'
        faq_schema = f'<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>'
        return faq_html, faq_schema
    except:
        return "", ""

def process_product(product):
    pid = product["id"]
    name = product.get("name", "")[:60]
    score = score_description(product.get("description", ""))
    brand = get_brand(product)
    print(f"  [{pid}] {name} | Score:{score}")

    update_data = {}
    meta = product.get("meta_data", [])

    # 1. AI Description — only if score < threshold
    if score < SCORE_THRESHOLD:
        print(f"    📝 Generating description...")
        new_desc = gen_description(product)
        if new_desc:
            faq_html, faq_schema = gen_faq_schema(product)
            if faq_html and faq_schema:
                new_desc += "\n" + faq_html + "\n" + faq_schema
            update_data["description"] = new_desc
            new_score = score_description(new_desc)
            print(f"    ✅ Description: {len(new_desc)} chars | New score: {new_score}")
        time.sleep(2)
    else:
        print(f"    ✓ Score OK — keeping description")

    # 2. Rank Math meta — all products
    print(f"    🔍 Generating Rank Math meta...")
    rm = gen_rank_math_meta(product)
    if rm:
        rm_keys = ["_rank_math_title", "_rank_math_description", "_rank_math_focus_keyword",
                   "_digital_source_type", "_structured_description"]
        meta = [m for m in meta if m["key"] not in rm_keys]
        meta.append({"key": "_rank_math_title", "value": rm.get("title", "")})
        meta.append({"key": "_rank_math_description", "value": rm.get("description", "")})
        meta.append({"key": "_rank_math_focus_keyword", "value": rm.get("focus_keyword", "")})
        meta.append({"key": "_digital_source_type", "value": "trained_algorithmic_media"})
        brand_val = get_brand(product)
        origin_val = get_origin(brand_val)
        price_val = str(product.get("price") or "0").split("-")[0]
        meta.append({"key": "_structured_description",
                     "value": f"{brand_val} product. Origin:{origin_val}. Price:BDT {price_val}. 100% authentic. E-Mart BD."})
        update_data["meta_data"] = meta
        print(f"    ✅ Meta: {rm.get('title', '')[:50]}")
    time.sleep(1)

    if not update_data:
        return True

    try:
        r = requests.put(f"{WC_URL}/wp-json/wc/v3/products/{pid}",
            auth=auth, json=update_data, timeout=30)
        if r.status_code == 200:
            print(f"    ✅ WC Updated!")
            return True
        else:
            print(f"    ❌ WC failed: {r.status_code}")
            return False
    except Exception as e:
        print(f"    ❌ Error: {e}")
        return False

def main():
    progress = load_progress()
    done_ids = set(progress["done_ids"])
    failed_ids = progress["failed_ids"]

    print("🚀 E-Mart Phase 2 — AI Description + Rank Math Meta")
    print(f"Already done: {len(done_ids)} | Failed: {len(failed_ids)}")
    tg(f"🚀 Phase 2 started\n✅ Done: {len(done_ids)}\n❌ Failed: {len(failed_ids)}")

    total_done = 0
    total_failed = 0
    total_skipped = 0

    page = 1
    while True:
        try:
            r = requests.get(f"{WC_URL}/wp-json/wc/v3/products", auth=auth,
                params={"per_page": BATCH, "page": page, "status": "publish"}, timeout=30)
            if r.status_code != 200:
                time.sleep(10)
                continue
            products = r.json()
        except Exception as e:
            print(f"  Page {page} error: {e}")
            time.sleep(10)
            continue

        if not products:
            break

        for product in products:
            pid = product["id"]
            if pid in done_ids:
                total_skipped += 1
                continue

            success = process_product(product)
            time.sleep(3)

            if success:
                done_ids.add(pid)
                total_done += 1
            else:
                failed_ids.append(pid)
                total_failed += 1

        progress["done_ids"] = list(done_ids)
        progress["failed_ids"] = failed_ids
        progress["last_page"] = page
        save_progress(progress)

        print(f"\n📊 Page {page} | Done:{total_done} | Failed:{total_failed} | Skipped:{total_skipped}\n")

        if total_done > 0 and total_done % 100 == 0:
            tg(f"📊 Phase 2 Progress\n✅ Done: {total_done}\n❌ Failed: {total_failed}\n⏭️ Skipped: {total_skipped}")

        page += 1
        time.sleep(2)

    msg = f"""✅ Phase 2 Complete!
✅ Done: {total_done}
❌ Failed: {total_failed}
⏭️ Skipped: {total_skipped}

Fixed:
- AI descriptions (score < {SCORE_THRESHOLD})
- Rank Math title + meta description
- Focus keywords
- FAQ Schema JSON-LD
- Digital source type label
E-Mart AI"""

    tg(msg)
    print(f"\n{msg}")

if __name__ == "__main__":
    main()
