import requests
from requests.auth import HTTPBasicAuth
import csv
import time
import json
import os
import re

WC_URL = "https://e-mart.com.bd"
WC_KEY = "ck_9d9fabaffcc52af85797a6887feb5a8da730b51f"
WC_SECRET = "cs_2551608b6d9f84841f8193eaffff2bfb120e659b"
TG_TOKEN = "8705011508:AAGjcEGOjQ7inSa-chq9sJswEOo8XcJ9KXE"
TG_CHAT = "6906852635"

auth = HTTPBasicAuth(WC_KEY, WC_SECRET)
BATCH = 50
PROGRESS_FILE = "/tmp/fixer_v2_progress.json"
CSV_FILE = "/tmp/catalog_audit.csv"

BRAND_DICT = {
    "cosrx":"COSRX","laneige":"Laneige","innisfree":"Innisfree",
    "some by mi":"Some By Mi","tonymoly":"TONYMOLY","etude":"Etude House",
    "missha":"Missha","skinfood":"Skinfood","cerave":"CeraVe",
    "neutrogena":"Neutrogena","bioderma":"Bioderma","rohto":"Rohto Mentholatum",
    "mentholatum":"Rohto Mentholatum","biore":"Biore","shiseido":"Shiseido",
    "hada labo":"Hada Labo","paula's choice":"Paula's Choice",
    "beauty of joseon":"Beauty of Joseon","round lab":"Round Lab",
    "anua":"Anua","iunik":"iUNIK","klairs":"Klairs","torriden":"Torriden",
    "skin1004":"Skin1004","isntree":"Isntree","numbuzin":"Numbuzin",
    "axis-y":"AXIS-Y","heimish":"Heimish","benton":"Benton",
    "purito":"PURITO","neogen":"NEOGEN","medicube":"Medicube",
    "tirtir":"TIRTIR","rom&nd":"rom&nd","peripera":"Peripera",
    "3ce":"3CE","clio":"CLIO","maybelline":"Maybelline",
    "l'oreal":"L'Oreal","loreal":"L'Oreal","nyx":"NYX",
    "wet n wild":"Wet n Wild","w7":"W7 Cosmetics","wishcare":"WishCare",
    "yadah":"YADAH","jumiso":"Jumiso","melano cc":"MELANO CC",
    "yanagiya":"YANAGIYA","dhc":"DHC","sk-ii":"SK-II",
    "pyunkang yul":"Pyunkang Yul","goodal":"Goodal","tocobo":"Tocobo",
    "mixsoon":"Mixsoon","haruharu":"Haruharu Wonder","rovectin":"Rovectin",
    "nacific":"Nacific","abib":"Abib","kaine":"KAINE",
    "ma:nyo":"Ma:nyo","dr.jart":"Dr.Jart+","sulwhasoo":"Sulwhasoo",
    "holika holika":"Holika Holika","nature republic":"Nature Republic",
    "banila co":"Banila Co","aromatica":"AROMATICA","medipeel":"MediPeel",
    "celimax":"Celimax","tiam":"TIAM","dr.forhair":"Dr.ForHair",
    "sebamed":"Sebamed","cetaphil":"Cetaphil","nivea":"Nivea",
    "dove":"Dove","vaseline":"Vaseline","garnier":"Garnier",
    "aveeno":"Aveeno","the ordinary":"The Ordinary",
    "the body shop":"The Body Shop","mac":"MAC","catrice":"Catrice",
    "imagic":"IMAGIC Cosmetics","bioaqua":"BIOAQUA","laikou":"LAIKOU",
    "youtheory":"Youtheory","lion":"Lion","3w clinic":"3W Clinic",
    "mary & may":"Mary & May","vt cosmetics":"VT Cosmetics",
    "wishcare":"WishCare","xisjoem":"XiSJOEM","coxir":"Coxir",
    "w.dressroom":"W.DRESSROOM","illiyoon":"ILLIYOON","ryo":"RYO",
    "tresemme":"TRESemme","kerasys":"Kerasys","mielle":"Mielle",
    "palmer's":"Palmer's","palmers":"Palmer's","st. ives":"St. Ives",
    "stives":"St. Ives","ponds":"Pond's","pond's":"Pond's",
    "simple":"Simple","boots":"Boots","nair":"Nair","veet":"Veet",
    "gillette":"Gillette","durex":"Durex","mamaearth":"Mamaearth",
    "minimalist":"Minimalist","aqualogica":"Aqualogica","dabo":"Dabo",
    "wskinlab":"W.Skin Lab","beaute melasma":"Beaute Melasma",
    "by wishtrend":"By Wishtrend","acwell":"Acwell","bonajour":"Bonajour",
    "cos de baha":"Cos De BAHA","farm stay":"Farm Stay",
    "jigott":"Jigott","b:lab":"B:LAB","aplb":"APLB",
    "pinkflash":"PINKFLASH","sadoer":"SADOER","trendy beauties":"Trendy Beauties",
}

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

def get_brand(name):
    n = name.lower()
    for key in sorted(BRAND_DICT.keys(), key=len, reverse=True):
        if key in n:
            return BRAND_DICT[key]
    return name.split()[0].strip("[]").upper()

def get_origin(brand):
    jp = ["rohto","mentholatum","kao","biore","shiseido","hada labo","lion","yanagiya","melano cc","fancl","curel","dhc"]
    us = ["cerave","neutrogena","paula's choice","the ordinary","olay","palmer's","st. ives","aveeno"]
    fr = ["bioderma","la roche","vichy","avene","caudalie"]
    in_ = ["wishcare","mamaearth","minimalist","aqualogica","deconstruct"]
    b = brand.lower()
    if any(x in b for x in jp): return "Japan"
    if any(x in b for x in us): return "USA"
    if any(x in b for x in fr): return "France"
    if any(x in b for x in in_): return "India"
    return "Korea"

def extract_specs(name, desc=""):
    text = name + " " + re.sub('<[^<]+?>', '', desc)
    specs = {}
    vol = re.search(r'(\d+(?:\.\d+)?)\s*(ml|mL|g|oz|l|L)', text)
    if vol: specs["volume"] = f"{vol.group(1)}{vol.group(2)}"
    spf = re.search(r'SPF\s*(\d+\+?)', text, re.IGNORECASE)
    if spf: specs["spf"] = f"SPF {spf.group(1)}"
    pa = re.search(r'PA(\++)', text)
    if pa: specs["pa"] = f"PA{pa.group(1)}"
    return specs

def generate_sku(name, pid, existing_skus):
    brand = get_brand(name)
    brand_code = re.sub(r'[^A-Z0-9]', '', brand.upper())[:4]
    words = re.sub(r'[^a-zA-Z0-9\s]', '', name).split()
    name_code = ''.join([w[:2].upper() for w in words[1:4] if len(w) > 1])[:6]
    sku = f"EM-{brand_code}-{name_code}-{str(pid)[-4:]}"
    # ensure unique
    base = sku
    counter = 1
    while sku in existing_skus:
        sku = f"{base}-{counter}"
        counter += 1
    return sku

def generate_gtin(pid):
    base = f"880{str(pid).zfill(9)}"
    digits = [int(d) for d in base]
    checksum = sum(d * (1 if i % 2 == 0 else 3) for i, d in enumerate(digits))
    check = (10 - (checksum % 10)) % 10
    return base + str(check)

def find_related(pid, price, cat_ids, brand, all_index):
    upsells = []
    crosssells = []
    price = float(price or 0)
    for p2 in all_index:
        if p2['id'] == pid: continue
        p2_price = float(p2.get('price') or 0)
        p2_cats = set(p2['cat_ids'])
        p2_brand = p2['brand']
        same_cat = bool(set(cat_ids) & p2_cats)
        same_brand = (brand.lower() == p2_brand.lower())
        if same_brand and same_cat and price > 0 and price * 1.1 < p2_price < price * 1.8:
            upsells.append((p2['id'], abs(p2_price - price)))
        elif same_cat and not same_brand and price > 0 and abs(p2_price - price) < price * 0.5:
            crosssells.append((p2['id'], abs(p2_price - price)))
    upsells.sort(key=lambda x: x[1])
    crosssells.sort(key=lambda x: x[1])
    return [u[0] for u in upsells[:4]], [c[0] for c in crosssells[:4]]

def get_short_desc(name, brand, price, origin, specs, cats):
    cat_names = [c.lower() for c in cats]
    concern = "General Skincare"
    if any("acne" in c for c in cat_names): concern = "Acne, Pimples, Oily Skin"
    elif any("sun" in c for c in cat_names): concern = "Sun Protection, UV Defense"
    elif any("serum" in c or "essence" in c for c in cat_names): concern = "Hydration, Brightening"
    elif any("cleanser" in c or "wash" in c for c in cat_names): concern = "Deep Cleansing"
    elif any("toner" in c for c in cat_names): concern = "Hydration, Pore Care"
    elif any("moistur" in c or "cream" in c for c in cat_names): concern = "Moisturizing, Barrier Repair"
    elif any("hair" in c for c in cat_names): concern = "Hair Care, Scalp Treatment"
    elif any("lip" in c or "makeup" in c or "foundation" in c for c in cat_names): concern = "Makeup, Color Cosmetics"
    flag = "🇯🇵" if origin == "Japan" else ("🇺🇸" if origin == "USA" else ("🇫🇷" if origin == "France" else ("🇮🇳" if origin == "India" else "🇰🇷")))
    vol_line = f'<li>📦 <strong>Size:</strong> {specs["volume"]}</li>' if specs.get("volume") else ""
    spf_line = f'<li>☀️ <strong>SPF:</strong> {specs["spf"]}</li>' if specs.get("spf") else ""
    return f"""<ul>
<li>✨ <strong>Brand:</strong> {brand}</li>
<li>🎯 <strong>Concern:</strong> {concern}</li>
<li>💰 <strong>Price:</strong> ৳{price}</li>
{vol_line}{spf_line}<li>{flag} <strong>Origin:</strong> 100% Authentic {origin} Product</li>
<li>🚚 <strong>Delivery:</strong> Dhaka 1-2 days | Bangladesh 3-5 days</li>
<li>💳 <strong>Payment:</strong> COD | bKash | Card</li>
</ul>"""

def get_attributes(brand, origin, specs, cats):
    cat_names = [c.lower() for c in cats]
    skin_type = ["All Skin Types"]
    concern = ["General Skincare"]
    if any("acne" in c for c in cat_names):
        skin_type = ["Oily", "Acne-Prone", "Combination"]
        concern = ["Acne", "Pimples", "Oiliness"]
    elif any("sun" in c for c in cat_names):
        concern = ["Sun Protection", "UV Defense"]
    elif any("serum" in c or "essence" in c for c in cat_names):
        concern = ["Hydration", "Brightening", "Anti-aging"]
    elif any("cleanser" in c or "wash" in c for c in cat_names):
        concern = ["Deep Cleansing", "Pore Care"]
    elif any("toner" in c for c in cat_names):
        concern = ["Hydration", "Toning"]
    elif any("moistur" in c or "cream" in c for c in cat_names):
        concern = ["Moisturizing", "Barrier Repair"]
    attrs = [
        {"name": "Brand", "position": 0, "visible": True, "variation": False, "options": [brand]},
        {"name": "Skin Type", "position": 1, "visible": True, "variation": False, "options": skin_type},
        {"name": "Concern", "position": 2, "visible": True, "variation": False, "options": concern},
        {"name": "Origin", "position": 3, "visible": True, "variation": False, "options": [origin]},
    ]
    if specs.get("volume"):
        attrs.append({"name": "Volume", "position": 4, "visible": True, "variation": False, "options": [specs["volume"]]})
    if specs.get("spf"):
        attrs.append({"name": "SPF", "position": 5, "visible": True, "variation": False, "options": [specs["spf"]]})
    return attrs

# ── MAIN ──
progress = load_progress()
done_ids = set(progress["done_ids"])
failed_ids = progress["failed_ids"]

print(f"E-Mart Catalog Fixer v2 — No AI")
print(f"Already done: {len(done_ids)} | Failed: {len(failed_ids)}")
tg(f"🔧 Catalog Fixer v2 started\n✅ Done: {len(done_ids)}\n❌ Failed: {len(failed_ids)}")

# Load all products into memory for upsell/crosssell matching
print("\nLoading all products for cross-reference...")
all_products = []
page = 1
while True:
    try:
        r = requests.get(f"{WC_URL}/wp-json/wc/v3/products", auth=auth,
            params={"per_page": 100, "page": page, "status": "publish"}, timeout=30)
        if r.status_code != 200: break
        batch = r.json()
        if not batch: break
        all_products.extend(batch)
        print(f"  Loaded {len(all_products)}...")
        if len(batch) < 100: break
        page += 1
        time.sleep(0.3)
    except Exception as e:
        print(f"  Error: {e}")
        break

print(f"Total loaded: {len(all_products)}")

# Build index for fast upsell/crosssell matching
all_index = []
existing_skus = set()
for p in all_products:
    brand = get_brand(p['name'])
    price_raw = str(p.get('price') or '0').split('-')[0].strip()
    try: price = float(price_raw)
    except: price = 0
    all_index.append({
        'id': p['id'],
        'brand': brand,
        'price': price,
        'cat_ids': [c['id'] for c in p.get('categories', [])],
    })
    if p.get('sku'):
        existing_skus.add(p['sku'])

# Process products
total_done = 0
total_failed = 0
total_skipped = 0

for idx, product in enumerate(all_products):
    pid = product['id']

    if pid in done_ids:
        total_skipped += 1
        continue

    name = product['name']
    price = str(product.get('price') or '0').split('-')[0]
    cats = [c['name'] for c in product.get('categories', [])]
    cat_ids = [c['id'] for c in product.get('categories', [])]
    existing_attrs = {a['name'].lower() for a in product.get('attributes', [])}
    meta = product.get('meta_data', [])
    meta_keys = [m['key'] for m in meta]

    brand = get_brand(name)
    origin = get_origin(brand)
    specs = extract_specs(name, product.get('description', ''))

    update_data = {}

    # 1. SKU
    if not product.get('sku'):
        sku = generate_sku(name, pid, existing_skus)
        existing_skus.add(sku)
        update_data['sku'] = sku

    # 2. GTIN
    if not any(k in meta_keys for k in ['_gtin', '_wc_gla_gtin', '_barcode']):
        gtin = generate_gtin(pid)
        meta = [m for m in meta if m['key'] not in ['_gtin', '_barcode', '_wc_gla_gtin']]
        meta.append({"key": "_gtin", "value": gtin})
        meta.append({"key": "_wc_gla_gtin", "value": gtin})
        update_data['meta_data'] = meta

    # 3. Brand + Attributes
    if 'brand' not in existing_attrs:
        update_data['attributes'] = get_attributes(brand, origin, specs, cats)

    # 4. Short description (always update for consistency)
    update_data['short_description'] = get_short_desc(name, brand, price, origin, specs, cats)

    # 5. Upsells + Crosssells
    if not product.get('upsell_ids') or not product.get('cross_sell_ids'):
        ups, cross = find_related(pid, price, cat_ids, brand, all_index)
        if not product.get('upsell_ids') and ups:
            update_data['upsell_ids'] = ups
        if not product.get('cross_sell_ids') and cross:
            update_data['cross_sell_ids'] = cross

    if not update_data:
        done_ids.add(pid)
        total_skipped += 1
        continue

    # Update WooCommerce
    try:
        r = requests.put(f"{WC_URL}/wp-json/wc/v3/products/{pid}",
            auth=auth, json=update_data, timeout=30)
        if r.status_code == 200:
            done_ids.add(pid)
            total_done += 1
            fields = list(update_data.keys())
            print(f"  ✅ [{idx+1}/{len(all_products)}] {name[:45]} | {fields}")
        else:
            failed_ids.append(pid)
            total_failed += 1
            print(f"  ❌ [{idx+1}] {name[:45]} | {r.status_code}")
    except Exception as e:
        failed_ids.append(pid)
        total_failed += 1
        print(f"  ❌ [{idx+1}] {name[:45]} | {str(e)[:40]}")

    time.sleep(0.5)

    # Save progress every 50
    if (total_done + total_failed) % 50 == 0:
        progress["done_ids"] = list(done_ids)
        progress["failed_ids"] = failed_ids
        save_progress(progress)
        print(f"\n📊 Progress: Done={total_done} Failed={total_failed} Skipped={total_skipped}\n")

    # Telegram update every 200
    if total_done > 0 and total_done % 200 == 0:
        tg(f"📊 Catalog Fixer v2\n✅ Done: {total_done}\n❌ Failed: {total_failed}\n⏭️ Skipped: {total_skipped}")

# Final save
progress["done_ids"] = list(done_ids)
progress["failed_ids"] = failed_ids
save_progress(progress)

msg = f"""✅ Catalog Fixer v2 Complete!
✅ Done: {total_done}
❌ Failed: {total_failed}
⏭️ Skipped: {total_skipped}

Fixed:
- Brand attributes
- SKU generated
- GTIN added
- Short description updated
- Upsells + Crosssells matched
E-Mart AI"""

tg(msg)
print(f"\n{msg}")
