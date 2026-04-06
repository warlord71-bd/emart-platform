import requests
from requests.auth import HTTPBasicAuth
import csv
import re
import time

WC_URL = "https://e-mart.com.bd"
WC_KEY = "ck_9d9fabaffcc52af85797a6887feb5a8da730b51f"
WC_SECRET = "cs_2551608b6d9f84841f8193eaffff2bfb120e659b"

auth = HTTPBasicAuth(WC_KEY, WC_SECRET)

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
    "loreal":"L'Oreal","nyx":"NYX","wet n wild":"Wet n Wild",
    "w7":"W7 Cosmetics","wishcare":"WishCare","yadah":"YADAH",
    "jumiso":"Jumiso","melano cc":"MELANO CC","yanagiya":"YANAGIYA",
    "dhc":"DHC","sk-ii":"SK-II","pyunkang yul":"Pyunkang Yul",
    "goodal":"Goodal","tocobo":"Tocobo","mixsoon":"Mixsoon",
    "haruharu":"Haruharu Wonder","rovectin":"Rovectin",
    "nacific":"Nacific","abib":"Abib","kaine":"KAINE",
    "ma:nyo":"Ma:nyo","dr.jart":"Dr.Jart+","sulwhasoo":"Sulwhasoo",
    "holika holika":"Holika Holika","nature republic":"Nature Republic",
    "banila co":"Banila Co","aromatica":"AROMATICA","medipeel":"MediPeel",
    "celimax":"Celimax","tiam":"TIAM","dr.forhair":"Dr.ForHair",
    "sebamed":"Sebamed","cetaphil":"Cetaphil","nivea":"Nivea",
    "dove":"Dove","vaseline":"Vaseline","garnier":"Garnier",
    "neutrogena":"Neutrogena","aveeno":"Aveeno","the ordinary":"The Ordinary",
    "the body shop":"The Body Shop","mac":"MAC","catrice":"Catrice",
    "imagic":"IMAGIC Cosmetics","bioaqua":"BIOAQUA","laikou":"LAIKOU",
    "youtheory":"Youtheory","wishcare":"WishCare","lion":"Lion",
    "3w clinic":"3W Clinic","mary & may":"Mary & May","vt cosmetics":"VT Cosmetics",
}

def get_brand(name):
    n = name.lower()
    for key in sorted(BRAND_DICT.keys(), key=len, reverse=True):
        if key in n:
            return BRAND_DICT[key]
    return name.split()[0].strip("[]").upper()

def score_desc(desc):
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
    if '<p>' in desc: score += 7
    if 'faq' in text or 'প্রশ্ন' in text: score += 5
    info_kw = ['ingredient','how to use','ব্যবহার','উপাদান']
    score += min(20, sum(3 for k in info_kw if k in text))
    return min(100, score)

def get_missing(p, score):
    issues = []
    desc = re.sub('<[^<]+?>', '', p.get('description', '')).lower()
    if score < 50: issues.append('low_desc_score')
    if not p.get('sku'): issues.append('no_sku')
    attrs = {a['name'].lower() for a in p.get('attributes', [])}
    if 'brand' not in attrs: issues.append('no_brand')
    meta_keys = [m['key'] for m in p.get('meta_data', [])]
    if '_rank_math_title' not in meta_keys: issues.append('no_rankmath_meta')
    if not any(k in meta_keys for k in ['_gtin','_wc_gla_gtin']): issues.append('no_gtin')
    if not p.get('upsell_ids'): issues.append('no_upsells')
    if not p.get('cross_sell_ids'): issues.append('no_crosssells')
    tab = next((m['value'] for m in p.get('meta_data',[]) if m['key']=='_woodmart_product_custom_tab_content'), '')
    if not tab or len(str(tab)) < 100: issues.append('no_ingredients_tab')
    return '|'.join(issues)

# Load all products
print("Loading products...")
all_products = []
page = 1
while True:
    try:
        r = requests.get(f"{WC_URL}/wp-json/wc/v3/products", auth=auth,
            params={"per_page": 100, "page": page, "status": "publish"}, timeout=30)
        if r.status_code != 200:
            break
        batch = r.json()
        if not batch:
            break
        all_products.extend(batch)
        print(f"  Page {page}: {len(all_products)} total")
        if len(batch) < 100:
            break
        page += 1
        time.sleep(0.5)
    except Exception as e:
        print(f"  Error page {page}: {e}")
        break

print(f"\nTotal: {len(all_products)} products")

# Write CSV
output = "/tmp/catalog_audit.csv"
with open(output, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['id','name','price','brand','sku','score','missing','category','url'])
    for p in all_products:
        pid = p['id']
        name = p['name']
        price = p.get('price', '')
        brand = get_brand(name)
        sku = p.get('sku', '')
        score = score_desc(p.get('description', ''))
        missing = get_missing(p, score)
        cat = p['categories'][0]['name'] if p.get('categories') else ''
        url = p.get('permalink', f"{WC_URL}/?p={pid}")
        writer.writerow([pid, name, price, brand, sku, score, missing, cat, url])

print(f"\nCSV saved: {output}")
print(f"Total: {len(all_products)}")

# Summary
import collections
all_missing = []
scores = []
for p in all_products:
    s = score_desc(p.get('description',''))
    scores.append(s)
    m = get_missing(p, s)
    all_missing.extend(m.split('|') if m else [])

counter = collections.Counter(all_missing)
print("\n--- SUMMARY ---")
print(f"Avg score: {sum(scores)/len(scores):.1f}")
print(f"Score < 50: {sum(1 for s in scores if s < 50)}")
print(f"Score >= 50: {sum(1 for s in scores if s >= 50)}")
print("\nMissing fields:")
for k, v in counter.most_common():
    print(f"  {k}: {v}")
