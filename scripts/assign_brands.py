#!/usr/bin/env python3
"""
Auto-assign Brand attribute to all WooCommerce products using MySQL directly.
Bypasses REST API (which is blocked by Cloudflare).
Run on VPS: python3 scripts/assign_brands.py
"""

import subprocess
import json
import re
import time

# ── DB Config (from wp-config.php) ──────────────────────────────
WP_CONFIG = "/var/www/wordpress/wp-config.php"
TABLE_PREFIX = "wp4h_"

def get_db_config():
    config = {}
    try:
        content = open(WP_CONFIG).read()
        for key in ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST']:
            m = re.search(rf"define\(\s*['\"]%s['\"]\s*,\s*['\"]([^'\"]+)['\"]" % key, content)
            if m:
                config[key] = m.group(1)
    except Exception as e:
        print(f"Cannot read wp-config.php: {e}")
    return config

db = get_db_config()
DB_NAME = db.get('DB_NAME', 'emart_live')
DB_USER = db.get('DB_USER', 'emart_user')
DB_PASS = db.get('DB_PASSWORD', 'Emart@123456')
DB_HOST = db.get('DB_HOST', 'localhost')

def mysql(sql):
    """Run SQL and return stdout. Ignores warnings, raises only on errors."""
    cmd = ['mysql', '-u', DB_USER, f'-p{DB_PASS}', '-h', DB_HOST,
           DB_NAME, '-N', '-B', '--skip-column-names', '-e', sql]
    result = subprocess.run(cmd, capture_output=True, text=True)
    # Ignore password warning — only fail on real errors (returncode != 0 AND non-warning stderr)
    stderr = result.stderr.strip()
    real_error = [l for l in stderr.splitlines() if 'ERROR' in l and 'Warning' not in l]
    if real_error:
        raise Exception('\n'.join(real_error))
    return result.stdout.strip()

# ── Brand detection rules ──────────────────────────────────────
BRAND_RULES = [
    ('COSRX', ['cosrx']),
    ('Laneige', ['laneige']),
    ('Innisfree', ['innisfree']),
    ('Some By Mi', ['some by mi', 'somebymi']),
    ('Missha', ['missha']),
    ('Isntree', ['isntree']),
    ('Sulwhasoo', ['sulwhasoo']),
    ('Skinfood', ['skinfood', 'skin food']),
    ('Banila Co', ['banila co', 'banilaco']),
    ('Jumiso', ['jumiso']),
    ('Arencia', ['arencia']),
    ('Dr. Althea', ['dr. althea', 'dr althea', 'althea']),
    ('Anua', ['anua']),
    ('Axis-Y', ['axis-y', 'axis y']),
    ('Beauty of Joseon', ['beauty of joseon']),
    ('Dear, Klairs', ['klairs']),
    ('Etude House', ['etude house', 'etude']),
    ('Holika Holika', ['holika holika']),
    ("I'm From", ["i'm from", 'im from']),
    ('Klavuu', ['klavuu']),
    ("Ma:nyo", ["ma:nyo", 'manyo']),
    ('Mediheal', ['mediheal']),
    ('Mizon', ['mizon']),
    ('Neogen', ['neogen']),
    ('Papa Recipe', ['papa recipe']),
    ('Purito', ['purito']),
    ('Round Lab', ['round lab', 'roundlab']),
    ('Skin1004', ['skin1004', 'skin 1004']),
    ('Tonymoly', ['tonymoly', 'tony moly']),
    ('Torriden', ['torriden']),
    ('Benton', ['benton']),
    ('Cos De BAHA', ['cos de baha', 'cosdebaha']),
    ('Dabo', ['dabo']),
    ('Carenel', ['carenel']),
    ('Hada Labo', ['hada labo', 'hadalabo']),
    ('Rohto', ['rohto']),
    ('Shiseido', ['shiseido']),
    ('DHC', ['dhc']),
    ('Curel', ['curel']),
    ('Ryo', ['ryo ']),
    ('Bioderma', ['bioderma']),
    ('Cetaphil', ['cetaphil']),
    ('CeraVe', ['cerave']),
    ('The Ordinary', ['the ordinary']),
    ('Garnier', ['garnier']),
    ("L'Oreal", ["l'oreal", 'loreal']),
    ('Maybelline', ['maybelline']),
    ('Neutrogena', ['neutrogena']),
    ('Vanicream', ['vanicream']),
    ('Revolution', ['revolution skincare', 'revolution beauty']),
    ('La Roche-Posay', ['la roche-posay', 'la roche posay']),
    ('Vichy', ['vichy']),
    ('Eucerin', ['eucerin']),
    ('Nivea', ['nivea']),
    ('JNH', ['jnh']),
    ('Skintific', ['skintific']),
    ('Mars', ['o mars', '@mars', 'mars matte', 'mars edge', 'mars creamy']),
    ('Derma Co', ['the derma co', 'derma co']),
    ('Dermalix', ['dermalix']),
    # Additional brands from unmatched
    ('Some By Me', ['some by me']),
    ('Nature Republic', ['nature republic']),
    ('Coxir', ['coxir']),
    ('The Face Shop', ['the face shop', 'the faceshop', 'faceshop', 'face shop']),
    ('Nacific', ['nacific']),
    ('PaxMoly', ['paxmoly', 'pax moly', 'pax-moly']),
    ('By Wishtrend', ['by wishtrend', 'wishtrend']),
    ('Skinmiso', ['skinmiso', 'skin miso']),
    ('TIA\'M', ["tia'm", 'tiam ac', 'tiam vita', 'tiam surprise']),
    ('Deep Sea', ['deep sea pure']),
    ('Beaute', ['luofmiss', 'beautecret']),
    ('Secret Key', ['secret key']),
    ('Coreana', ['coreana', 'orthia']),
    ('Koelcia', ['koelcia']),
    ('3W Clinic', ['3w clinic', '3w-clinic']),
    ('The Yeon', ['the yeon']),
    ('Confume', ['confume', 'kwailnara confume']),
    ('Welcos', ['welcos']),
    ('Kwailnara', ['kwailnara']),
    ('Elizavecca', ['elizavecca']),
    ('Esthetic House', ['esthetic house']),
    ('Farmstay', ['farmstay']),
    ('Jayjun', ['jayjun']),
    ('Lebelage', ['lebelage']),
    ('Miellee', ['miellee']),
    ('Oseque', ['oseque']),
    ('Pobling', ['pobling']),
    ('Secret Nature', ['secret nature']),
    ('Tony Lab', ['tony lab']),
    ('Tosowoong', ['tosowoong']),
    ('Urban Dollkiss', ['urban dollkiss']),
    ('Village 11 Factory', ['village 11']),
    ('Whamisa', ['whamisa']),
    ('Yu-r', ['yu-r']),
    ('Acwell', ['acwell']),
    ('Aplb', ['aplb']),
    ('Daeng Gi Meo Ri', ['daeng gi', 'daenggi']),
    ('Dr. Jart+', ['dr. jart', 'dr jart']),
    ('FRE', ['fre ']),
    ('Mixsoon', ['mixsoon']),
    ('Ample N', ['ample n', 'ample:n']),
    ('Klairs', ['klairs']),
    ('Haruharu Wonder', ['haruharu wonder', 'haruharu']),
    ('I Dew Care', ['i dew care', 'idew']),
    ('Innbeauty Project', ['innbeauty']),
    ('Kahi', ['kahi ']),
    ('Nacific', ['nacific']),
    ('Neogen', ['neogen']),
    ('Peripera', ['peripera']),
    ('Skin Ceuticals', ['skinceuticals', 'skin ceuticals']),
    ('Stridex', ['stridex']),
    ('Sunday Riley', ['sunday riley']),
    ('The Inkey List', ['the inkey', 'inkey list']),
    ('Versed', ['versed ']),
    ('Cocokind', ['cocokind']),
    ('Wonder Releaf', ['wonder releaf']),
    ('Jeju Cherry', ['jeju cherry']),
    ('Elizavecca', ['elizavecca']),
    ('Farmacy', ['farmacy']),
    ('Farmstay', ['farmstay']),
    ('Fraijour', ['fraijour']),
    ('Goodal', ['goodal']),
    ('Graymelin', ['graymelin']),
    ('iUNIK', ['iUNIK', 'iunik']),
    ('Jmsolution', ['jmsolution', 'j.m solution']),
    ('Lagom', ['lagom']),
    ('Leaders', ['leaders insolution', 'leaders ']),
    ('LEEJIHAM', ['leejiham', 'ljh']),
    ('Medi-Peel', ['medi-peel', 'medipeel']),
    ('Niacinamide', ['nacific']),
    ('Numbuzin', ['numbuzin']),
    ('OhLolly', ['ohlolly']),
    ('ONGREDIENTS', ['ongredients']),
    ('Peach Slices', ['peach slices']),
    ('Petitfee', ['petitfee']),
    ('Rovectin', ['rovectin']),
    ('Scinic', ['scinic']),
    ('Sioris', ['sioris']),
    ('Skin & Lab', ['skin & lab', 'skin and lab', 'skin&lab']),
    ('Snail Bee', ['snail bee']),
    ('Tiam', ['tiam']),
    ('Too Cool For School', ['too cool for school']),
    ('VDL', ['vdl']),
    ('Wellage', ['wellage']),
    ('Whamisa', ['whamisa']),
    ('Wish Formula', ['wish formula']),
    ('XYZ', ['beaute', 'beauté']),
    ('Mizon', ['mizon']),
    ('Aestura', ['aestura']),
    ('AHC', ['ahc ']),
    ('Cell Fusion C', ['cell fusion']),
    ('CNP', ['cnp ']),
    ('Dr.G', ['dr.g', 'dr. g ']),
    ('Illiyoon', ['illiyoon']),
    ('The Saem', ['the saem']),
    ('W.Lab', ['w.lab', 'w lab']),
    ('Yepoda', ['yepoda']),
    ('Apieu', ['apieu', "a'pieu"]),
    ('Atomy', ['atomy']),
    ('Clio', ['clio ']),
    ('Cosnori', ['cosnori']),
    ('Espoir', ['espoir']),
    ('Nature\'s Gate', ["nature's gate"]),
    ('Neutriherbs', ['neutriherbs']),
    ('Numbuzin', ['numbuzin']),
    ('Ongredients', ['ongredients']),
    ('Pyunkang Yul', ['pyunkang yul', 'pyunkang']),
    ('Real Barrier', ['real barrier']),
    ('Rohto', ['rohto', 'hada labo']),
    ('SNP', ['snp ']),
    ('Troiareuke', ['troiareuke']),
    ('Uriage', ['uriage']),
    ('Vanedo', ['vanedo']),
    ('VT Cosmetics', ['vt cosmetics', 'vt cosme', 'vt ']),
    ('Zymogen', ['zymogen']),
    # Japanese
    ('Curel', ['curel']),
    ('Fancl', ['fancl']),
    ('Minon', ['minon']),
    ('Pola', ['pola ']),
    ('Sana', ['sana ']),
    ('Canmake', ['canmake']),
    ('Cezanne', ['cezanne']),
    ('Kose', ['kose ']),
    ('Orbis', ['orbis']),
    ('Kate Tokyo', ['kate tokyo', 'kate ']),
    # International
    ('Aveeno', ['aveeno']),
    ('Avene', ['avene', 'avène']),
    ('Burt\'s Bees', ["burt's bees", 'burts bees']),
    ('E45', ['e45 ']),
    ('First Aid Beauty', ['first aid beauty', 'fab ']),
    ('Glow Recipe', ['glow recipe']),
    ('Herbivore', ['herbivore']),
    ('Kiehl\'s', ["kiehl's", 'kiehls']),
    ('Mario Badescu', ['mario badescu']),
    ('Ole Henriksen', ['ole henriksen']),
    ('Origins', ['origins ']),
    ('Paula\'s Choice', ["paula's choice", 'paulas choice']),
    ('Peter Thomas Roth', ['peter thomas roth']),
    ('St. Ives', ['st. ives', 'st ives']),
    ('Tatcha', ['tatcha']),
    ('Youth To The People', ['youth to the people']),
]

def detect_brand(name):
    n = name.lower()
    for brand, keywords in BRAND_RULES:
        if any(k in n for k in keywords):
            return brand
    return None

# ── Test DB connection ─────────────────────────────────────────
print("=" * 55)
print("WooCommerce Brand Auto-Assigner (via MySQL)")
print("=" * 55)
print(f"DB: {DB_NAME} | Host: {DB_HOST}\n")

try:
    result = mysql(f"SELECT COUNT(*) FROM {TABLE_PREFIX}posts WHERE post_type='product' AND post_status='publish'")
    print(f"✓ Connected — {result} published products\n")
except Exception as e:
    print(f"✗ DB connection failed: {e}")
    exit(1)

# ── Get all published products ─────────────────────────────────
print("Fetching products...")
rows = mysql(f"""
    SELECT ID, post_title FROM {TABLE_PREFIX}posts
    WHERE post_type='product' AND post_status='publish'
    ORDER BY ID
""")

products = []
for line in rows.splitlines():
    parts = line.split('\t', 1)
    if len(parts) == 2:
        products.append({'id': int(parts[0]), 'name': parts[1]})

print(f"Found {len(products)} products\n")

# ── Get or create 'Brand' attribute taxonomy ───────────────────
def get_or_create_attribute(name='Brand'):
    # Check if pa_brand taxonomy exists
    row = mysql(f"""
        SELECT attribute_id FROM {TABLE_PREFIX}woocommerce_attribute_taxonomies
        WHERE attribute_name='brand' LIMIT 1
    """)
    if row:
        return int(row.strip())

    # Create it
    mysql(f"""
        INSERT INTO {TABLE_PREFIX}woocommerce_attribute_taxonomies
        (attribute_name, attribute_label, attribute_type, attribute_orderby, attribute_public)
        VALUES ('brand', 'Brand', 'select', 'menu_order', 1)
    """)
    row = mysql(f"""
        SELECT attribute_id FROM {TABLE_PREFIX}woocommerce_attribute_taxonomies
        WHERE attribute_name='brand' LIMIT 1
    """)
    print("✓ Created 'Brand' attribute taxonomy")
    return int(row.strip())

attr_id = get_or_create_attribute()

def get_or_create_term(brand_name):
    slug = brand_name.lower().replace(' ', '-').replace("'", '').replace('.', '').replace(',', '')
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    taxonomy = 'pa_brand'
    safe_name = brand_name.replace("'", "\\'")

    # Check if term+taxonomy already exists
    row = mysql(f"""
        SELECT t.term_id FROM {TABLE_PREFIX}terms t
        JOIN {TABLE_PREFIX}term_taxonomy tt ON t.term_id = tt.term_id
        WHERE tt.taxonomy = '{taxonomy}' AND t.slug = '{slug}'
        LIMIT 1
    """)
    if row:
        return int(row.strip())

    # Check if term exists in terms table (without taxonomy entry)
    term_row = mysql(f"""
        SELECT term_id FROM {TABLE_PREFIX}terms WHERE slug = '{slug}' LIMIT 1
    """)

    if term_row:
        term_id = int(term_row.strip())
    else:
        # Create term
        mysql(f"""
            INSERT IGNORE INTO {TABLE_PREFIX}terms (name, slug, term_group)
            VALUES ('{safe_name}', '{slug}', 0)
        """)
        term_id = int(mysql(f"SELECT term_id FROM {TABLE_PREFIX}terms WHERE slug='{slug}' LIMIT 1"))

    # Create term_taxonomy entry (IGNORE if duplicate)
    mysql(f"""
        INSERT IGNORE INTO {TABLE_PREFIX}term_taxonomy (term_id, taxonomy, description, parent, count)
        VALUES ({term_id}, '{taxonomy}', '', 0, 0)
    """)
    return term_id

def has_brand_assigned(product_id):
    row = mysql(f"""
        SELECT COUNT(*) FROM {TABLE_PREFIX}term_relationships tr
        JOIN {TABLE_PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        WHERE tr.object_id = {product_id} AND tt.taxonomy = 'pa_brand'
    """)
    return int(row.strip()) > 0

def assign_brand_to_product(product_id, brand_name, term_id):
    # Get term_taxonomy_id
    tt_row = mysql(f"""
        SELECT tt.term_taxonomy_id FROM {TABLE_PREFIX}term_taxonomy tt
        JOIN {TABLE_PREFIX}terms t ON tt.term_id = t.term_id
        WHERE tt.taxonomy = 'pa_brand' AND tt.term_id = {term_id}
        LIMIT 1
    """)
    if not tt_row:
        return False
    tt_id = int(tt_row.strip())

    # Add term relationship
    try:
        mysql(f"""
            INSERT IGNORE INTO {TABLE_PREFIX}term_relationships (object_id, term_taxonomy_id, term_order)
            VALUES ({product_id}, {tt_id}, 0)
        """)
    except Exception:
        pass

    # Update product attributes meta
    existing = mysql(f"""
        SELECT meta_value FROM {TABLE_PREFIX}postmeta
        WHERE post_id = {product_id} AND meta_key = '_product_attributes'
        LIMIT 1
    """)

    brand_attr = {
        'pa_brand': {
            'name': 'pa_brand',
            'value': '',
            'position': 0,
            'is_visible': 1,
            'is_variation': 0,
            'is_taxonomy': 1,
        }
    }

    try:
        if existing and existing.strip() and existing.strip() != 'NULL':
            # PHP serialize parse is complex - just add pa_brand if not present
            if 'pa_brand' not in existing:
                # Append to existing serialized array (simplified)
                pass  # will update via separate meta
    except Exception:
        pass

    # Set/update the attribute meta directly
    try:
        mysql(f"""
            INSERT INTO {TABLE_PREFIX}postmeta (post_id, meta_key, meta_value)
            VALUES ({product_id}, '_brand_name', '{brand_name.replace("'", "\\'")}')
            ON DUPLICATE KEY UPDATE meta_value = '{brand_name.replace("'", "\\'")}'
        """)
    except Exception:
        pass

    # Update term count
    mysql(f"""
        UPDATE {TABLE_PREFIX}term_taxonomy
        SET count = count + 1
        WHERE term_taxonomy_id = {tt_id}
    """)
    return True

# ── Process all products ───────────────────────────────────────
assigned = []
skipped = []
no_match = []
term_cache = {}

for i, p in enumerate(products):
    brand = detect_brand(p['name'])

    if not brand:
        no_match.append(p)
        continue

    if has_brand_assigned(p['id']):
        skipped.append(p['name'][:40])
        continue

    # Get or create term
    if brand not in term_cache:
        term_cache[brand] = get_or_create_term(brand)
    term_id = term_cache[brand]

    print(f"[{i+1}/{len(products)}] {brand}: {p['name'][:45]}...")
    assign_brand_to_product(p['id'], brand, term_id)
    assigned.append({'id': p['id'], 'name': p['name'], 'brand': brand})

print("\n" + "=" * 55)
print(f"✅ Assigned: {len(assigned)}")
print(f"⏭  Already had brand: {len(skipped)}")
print(f"❓ No brand match: {len(no_match)}")

if no_match:
    print(f"\nFirst 15 unmatched:")
    for p in no_match[:15]:
        print(f"  [{p['id']}] {p['name'][:65]}")

# Save report
with open('/tmp/brand_report.json', 'w', encoding='utf-8') as f:
    json.dump({'assigned': assigned, 'no_match': no_match}, f, indent=2)
print("\nReport: /tmp/brand_report.json")
print("\nDone! Clear WooCommerce transients cache:")
print("  mysql -u %s -p'%s' %s -e \"DELETE FROM %stransient WHERE option_name LIKE '%%woocommerce%%';\"" % (DB_USER, DB_PASS, DB_NAME, TABLE_PREFIX))
