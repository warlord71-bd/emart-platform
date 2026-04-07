#!/usr/bin/env python3
"""
Auto-assign Brand attribute to all WooCommerce products based on product name.
Run on VPS: python3 scripts/assign_brands.py

Reads credentials from apps/web/.env.local
"""

import os
import re
import json
import time
import urllib.request
import urllib.parse
import urllib.error
import hmac
import hashlib
import base64

# ── Read .env.local ──────────────────────────────────────────────
ENV_FILE = "/var/www/emart-platform/apps/web/.env.local"
env = {}
if os.path.exists(ENV_FILE):
    for line in open(ENV_FILE):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()

# Always use localhost when running on VPS (Cloudflare blocks direct IP requests)
WOO_URL = 'http://127.0.0.1'
CK = env.get('WOO_CONSUMER_KEY', '')
CS = env.get('WOO_CONSUMER_SECRET', '')

if not CK or not CS:
    print("ERROR: Missing WOO_CONSUMER_KEY or WOO_CONSUMER_SECRET in .env.local")
    exit(1)

BASE = f"{WOO_URL}/wp-json/wc/v3"
AUTH = f"consumer_key={CK}&consumer_secret={CS}"

# ── Brand detection rules (order matters — more specific first) ──
BRAND_RULES = [
    # Korean brands
    ('COSRX', ['cosrx']),
    ('Laneige', ['laneige']),
    ('Innisfree', ['innisfree']),
    ('Some By Mi', ['some by mi', 'somebymi', 'some_by_mi']),
    ('Missha', ['missha']),
    ('Isntree', ['isntree', "isn't tree"]),
    ('Sulwhasoo', ['sulwhasoo']),
    ('Skinfood', ['skinfood', 'skin food']),
    ('Banila Co', ['banila co', 'banilaco']),
    ('Jumiso', ['jumiso']),
    ('Arencia', ['arencia']),
    ('Dr. Althea', ['dr. althea', 'dr althea', 'althea']),
    ('Anua', ['anua']),
    ('Axis-Y', ['axis-y', 'axis y']),
    ('Beauty of Joseon', ['beauty of joseon', 'joseon']),
    ('Dear, Klairs', ['klairs', 'dear klairs', 'dear, klairs']),
    ('Etude House', ['etude house', 'etude']),
    ('Holika Holika', ['holika holika', 'holika']),
    ('I\'m From', ["i'm from", 'im from']),
    ('Kiehl\'s', ["kiehl's", 'kiehls']),
    ('Klavuu', ['klavuu']),
    ('Ma:nyo', ["ma:nyo", 'manyo']),
    ('Mediheal', ['mediheal']),
    ('Mizon', ['mizon']),
    ('Neogen', ['neogen']),
    ('Papa Recipe', ['papa recipe']),
    ('Purito', ['purito']),
    ('Round Lab', ['round lab', 'roundlab']),
    ('Skin1004', ['skin1004', 'skin 1004']),
    ('Snp', ['snp']),
    ('Tonymoly', ['tonymoly', 'tony moly']),
    ('Torriden', ['torriden']),
    ('VT Cosmetics', ['vt cosmetics', 'vt cosme']),
    ('Whamisa', ['whamisa']),
    ('Benton', ['benton']),
    ('Belif', ['belif']),
    ('Caudalie', ['caudalie']),
    ('CNP', ['cnp']),
    ('Cos De BAHA', ['cos de baha', 'cosdebaha']),
    ('Dabo', ['dabo']),
    ('Carenel', ['carenel']),
    # Japanese brands
    ('Hada Labo', ['hada labo', 'hadalabo']),
    ('Rohto', ['rohto']),
    ('Shiseido', ['shiseido']),
    ('SK-II', ['sk-ii', 'sk ii', 'skii']),
    ('Kose', ['kose']),
    ('Kanebo', ['kanebo']),
    ('DHC', ['dhc']),
    ('Mentholatum', ['mentholatum']),
    ('Curel', ['curel']),
    ('Fancl', ['fancl']),
    ('Minon', ['minon']),
    ('Pola', ['pola']),
    ('Ryo', ['ryo']),
    # International brands
    ('Bioderma', ['bioderma']),
    ('Cetaphil', ['cetaphil']),
    ('CeraVe', ['cerave']),
    ('The Ordinary', ['the ordinary', 'theordinary']),
    ('Garnier', ['garnier']),
    ('L\'Oreal', ["l'oreal", 'loreal', "l'oréal"]),
    ('Maybelline', ['maybelline']),
    ('Neutrogena', ['neutrogena']),
    ('Simple', ['simple kindness', 'simple skin']),
    ('Vanicream', ['vanicream']),
    ('Revolution', ['revolution skincare', 'revolution beauty', 'makeup revolution']),
    ('Avene', ['avene', 'avène']),
    ('La Roche-Posay', ['la roche-posay', 'la roche posay', 'laroche']),
    ('Vichy', ['vichy']),
    ('Uriage', ['uriage']),
    ('Eucerin', ['eucerin']),
    ('Nivea', ['nivea']),
    ('Pond\'s', ["pond's", 'ponds']),
    ('Olay', ['olay']),
    ('Dove', ['dove beauty', 'dove cream']),
    ('JNH', ['jnh']),
    ('Skintific', ['skintific', '5x ceramide']),
    ('Mars', ['mars cosmetics', 'o mars', '@mars']),
    ('Dermalix', ['dermalix']),
    ('Derma', ['the derma co', 'derma co']),
]

def detect_brand(product_name):
    name_lower = product_name.lower()
    for brand, keywords in BRAND_RULES:
        if any(kw in name_lower for kw in keywords):
            return brand
    return None

def api_get(path, params=''):
    url = f"{BASE}{path}?{AUTH}&{params}" if params else f"{BASE}{path}?{AUTH}"
    req = urllib.request.Request(url, headers={'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read()[:200]}")
        return None
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

def api_put(path, data):
    body = json.dumps(data).encode()
    url = f"{BASE}{path}?{AUTH}"
    req = urllib.request.Request(url, data=body, method='PUT',
        headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read()
        print(f"  HTTP {e.code}: {body[:200]}")
        return None
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

def get_all_products():
    products = []
    page = 1
    while True:
        print(f"  Fetching page {page}...", end=' ', flush=True)
        data = api_get('/products', f'per_page=100&page={page}&status=publish')
        if not data:
            break
        products.extend(data)
        print(f"{len(data)} products")
        if len(data) < 100:
            break
        page += 1
        time.sleep(0.5)
    return products

def has_brand(product):
    for attr in product.get('attributes', []):
        if attr.get('name', '').lower() == 'brand':
            return bool(attr.get('options'))
    return False

def get_existing_brand(product):
    for attr in product.get('attributes', []):
        if attr.get('name', '').lower() == 'brand':
            opts = attr.get('options', [])
            return opts[0] if opts else None
    return None

print("=" * 60)
print("WooCommerce Brand Auto-Assigner")
print("=" * 60)
print(f"API: {BASE}")
print()

# Test connection
print("Testing API connection...")
test = api_get('/products', 'per_page=1')
if test is None:
    print("FAILED — check credentials")
    exit(1)
print("✓ Connected\n")

# Fetch all products
print("Fetching all products...")
products = get_all_products()
print(f"\nTotal: {len(products)} products\n")

# Stats
has_brand_count = sum(1 for p in products if has_brand(p))
needs_brand = [p for p in products if not has_brand(p)]
print(f"Already have brand: {has_brand_count}")
print(f"Need brand assigned: {len(needs_brand)}\n")

# Detect and assign
assigned = []
no_match = []
errors = []

for i, product in enumerate(needs_brand):
    name = product['name']
    brand = detect_brand(name)

    if not brand:
        no_match.append({'id': product['id'], 'name': name})
        print(f"[{i+1}/{len(needs_brand)}] NO MATCH: {name[:60]}")
        continue

    print(f"[{i+1}/{len(needs_brand)}] {brand}: {name[:50]}...", end=' ', flush=True)

    # Build updated attributes (keep existing, add/replace Brand)
    existing_attrs = [a for a in product.get('attributes', [])
                      if a.get('name', '').lower() != 'brand']
    new_attrs = existing_attrs + [{
        'name': 'Brand',
        'options': [brand],
        'visible': True,
    }]

    result = api_put(f"/products/{product['id']}", {'attributes': new_attrs})
    if result:
        print(f"✓")
        assigned.append({'id': product['id'], 'name': name, 'brand': brand})
    else:
        print(f"✗ FAILED")
        errors.append(product['id'])

    time.sleep(0.3)  # rate limit

print("\n" + "=" * 60)
print(f"✅ Assigned: {len(assigned)}")
print(f"❓ No match: {len(no_match)}")
print(f"✗  Errors:   {len(errors)}")

if no_match:
    print("\nProducts without brand (check manually):")
    for p in no_match[:20]:
        print(f"  [{p['id']}] {p['name'][:70]}")
    if len(no_match) > 20:
        print(f"  ... and {len(no_match)-20} more")

# Save report
report = {
    'assigned': assigned,
    'no_match': no_match,
    'errors': errors,
}
with open('/tmp/brand_assignment_report.json', 'w') as f:
    json.dump(report, f, indent=2, ensure_ascii=False)
print("\nReport saved: /tmp/brand_assignment_report.json")
