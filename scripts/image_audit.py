#!/usr/bin/env python3
"""
Product Image Audit Script for Emart
-------------------------------------
1. Checks every product's image — does the file exist on VPS?
2. Detects name vs filename mismatches (brand/keyword not in filename)
3. Assigns Emart logo to products with no image
4. Saves full report to /tmp/image_audit_report.json

Run on VPS: python3 scripts/image_audit.py
"""

import subprocess, re, json, os, difflib
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────
WP_CONFIG    = "/var/www/wordpress/wp-config.php"
WP_UPLOADS   = "/var/www/wordpress/wp-content/uploads"
TABLE_PREFIX = "wp4h_"
REPORT_FILE  = "/tmp/image_audit_report.json"
# Emart logo — must exist in WP media library; script will search for it
EMART_LOGO_FILENAME = "emart-logo"  # partial match in attachment filename/guid

# ── DB Config ────────────────────────────────────────────────────────
def get_db_config():
    config = {}
    try:
        content = open(WP_CONFIG).read()
        for key in ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST']:
            m = re.search(r"define\s*\(\s*['\"]%s['\"]\s*,\s*['\"]([^'\"]+)['\"]" % key, content)
            if m:
                config[key] = m.group(1)
    except Exception as e:
        print(f"Cannot read wp-config.php: {e}")
    return config

db      = get_db_config()
DB_NAME = db.get('DB_NAME', 'emart_live')
DB_USER = db.get('DB_USER', 'emart_user')
DB_PASS = db.get('DB_PASSWORD', 'Emart@123456')
DB_HOST = db.get('DB_HOST', 'localhost')

def mysql(sql):
    cmd = ['mysql', '-u', DB_USER, f'-p{DB_PASS}', '-h', DB_HOST,
           DB_NAME, '-N', '-B', '--skip-column-names', '-e', sql]
    result = subprocess.run(cmd, capture_output=True, text=True)
    stderr = result.stderr.strip()
    errors = [l for l in stderr.splitlines() if 'ERROR' in l and 'Warning' not in l]
    if errors:
        raise Exception('\n'.join(errors))
    return result.stdout.strip()

# ── URL → local file path ─────────────────────────────────────────────
def url_to_path(url: str) -> str:
    """Convert any WordPress upload URL to local file path."""
    if not url:
        return ''
    # Strip domain — keep everything from /wp-content/uploads/
    m = re.search(r'/wp-content/uploads/(.+)', url)
    if m:
        return os.path.join(WP_UPLOADS, m.group(1))
    return ''

# ── Name similarity check ─────────────────────────────────────────────
STOPWORDS = {'the','a','an','and','or','for','of','in','with','by','to',
             'ml','g','mg','oz','set','kit','pack','pcs','piece','new',
             'korean','japanese','original','authentic','genuine','100'}

def name_to_words(text: str) -> set:
    words = re.sub(r'[^a-z0-9\s]', ' ', text.lower()).split()
    return {w for w in words if w not in STOPWORDS and len(w) > 1}

def filename_from_url(url: str) -> str:
    return Path(url).stem.lower().replace('-', ' ').replace('_', ' ') if url else ''

def match_score(product_name: str, image_url: str) -> float:
    """Returns 0.0–1.0: how well product name matches image filename."""
    if not image_url:
        return 0.0
    prod_words = name_to_words(product_name)
    file_words = name_to_words(filename_from_url(image_url))
    if not prod_words or not file_words:
        return 0.0
    overlap = prod_words & file_words
    return len(overlap) / min(len(prod_words), len(file_words))

# ── Find Emart logo attachment ────────────────────────────────────────
def get_emart_logo_id() -> int | None:
    rows = mysql(f"""
        SELECT ID FROM {TABLE_PREFIX}posts
        WHERE post_type='attachment'
          AND (post_name LIKE '%emart%' OR post_title LIKE '%emart%' OR guid LIKE '%emart%')
        ORDER BY ID DESC LIMIT 1
    """)
    if rows:
        try:
            return int(rows.strip())
        except:
            pass
    print("⚠️  Emart logo not found in media library.")
    print("    Upload emart-logo.png to WordPress media, then re-run.")
    return None

# ── Assign thumbnail to product ──────────────────────────────────────
def assign_thumbnail(product_id: int, attachment_id: int):
    mysql(f"""
        INSERT INTO {TABLE_PREFIX}postmeta (post_id, meta_key, meta_value)
        VALUES ({product_id}, '_thumbnail_id', '{attachment_id}')
        ON DUPLICATE KEY UPDATE meta_value='{attachment_id}'
    """)

def get_thumbnail_id(product_id: int) -> int | None:
    row = mysql(f"""
        SELECT meta_value FROM {TABLE_PREFIX}postmeta
        WHERE post_id={product_id} AND meta_key='_thumbnail_id' LIMIT 1
    """)
    try:
        return int(row.strip()) if row.strip() else None
    except:
        return None

def get_attachment_info(att_id: int) -> dict | None:
    row = mysql(f"""
        SELECT ID, guid, post_title FROM {TABLE_PREFIX}posts
        WHERE ID={att_id} AND post_type='attachment' LIMIT 1
    """)
    if not row:
        return None
    parts = row.split('\t')
    return {'id': int(parts[0]), 'url': parts[1] if len(parts) > 1 else '',
            'title': parts[2] if len(parts) > 2 else ''}

# ── Main audit ────────────────────────────────────────────────────────
print("=" * 60)
print("Emart Product Image Auditor")
print("=" * 60)

# Get all published products
print("\nFetching products...")
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

emart_logo_id = get_emart_logo_id()
print(f"Emart logo attachment ID: {emart_logo_id}\n")

# ── Audit each product ────────────────────────────────────────────────
no_image         = []   # products with no thumbnail at all
missing_file     = []   # thumbnail set but file missing on disk
mismatch         = []   # file exists but name doesn't match well
ok               = []   # all good
assigned_logo    = []   # we assigned emart logo to them

for i, p in enumerate(products):
    pid   = p['id']
    pname = p['name']

    thumb_id = get_thumbnail_id(pid)

    if not thumb_id:
        # No thumbnail at all
        no_image.append({'id': pid, 'name': pname})
        if emart_logo_id:
            assign_thumbnail(pid, emart_logo_id)
            assigned_logo.append({'id': pid, 'name': pname})
        continue

    att = get_attachment_info(thumb_id)
    if not att:
        no_image.append({'id': pid, 'name': pname, 'note': f'orphan thumb_id={thumb_id}'})
        if emart_logo_id:
            assign_thumbnail(pid, emart_logo_id)
            assigned_logo.append({'id': pid, 'name': pname})
        continue

    url       = att['url']
    filepath  = url_to_path(url)
    file_exists = os.path.isfile(filepath) if filepath else False

    if not file_exists:
        missing_file.append({'id': pid, 'name': pname, 'url': url, 'expected_path': filepath})
        if emart_logo_id:
            assign_thumbnail(pid, emart_logo_id)
            assigned_logo.append({'id': pid, 'name': pname, 'was': url})
        continue

    score = match_score(pname, url)
    if score < 0.15:   # less than 15% keyword overlap → likely mismatch
        mismatch.append({'id': pid, 'name': pname, 'image_url': url,
                         'filename': filename_from_url(url), 'match_score': round(score, 2)})
    else:
        ok.append(pid)

    if (i + 1) % 200 == 0:
        print(f"  Progress: {i+1}/{len(products)} checked...")

# ── Summary ────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print(f"✅ OK (image matches name):  {len(ok)}")
print(f"🖼  No image (logo assigned): {len(assigned_logo)}")
print(f"❌ File missing on disk:     {len(missing_file)}")
print(f"⚠️  Possible mismatch:       {len(mismatch)}")
print("=" * 60)

if mismatch:
    print(f"\nTop 20 mismatches (sorted by lowest score):")
    for m in sorted(mismatch, key=lambda x: x['match_score'])[:20]:
        print(f"  [{m['id']}] {m['name'][:45]!r}")
        print(f"        image: {m['filename']}  (score={m['match_score']})")

if missing_file:
    print(f"\nFirst 10 missing files:")
    for m in missing_file[:10]:
        print(f"  [{m['id']}] {m['name'][:45]}")
        print(f"        path: {m['expected_path']}")

# ── Save full report ────────────────────────────────────────────────────
report = {
    'summary': {
        'total': len(products),
        'ok': len(ok),
        'no_image': len(no_image),
        'missing_file': len(missing_file),
        'mismatch': len(mismatch),
        'assigned_logo': len(assigned_logo),
    },
    'no_image':     no_image,
    'missing_file': missing_file,
    'mismatch':     sorted(mismatch, key=lambda x: x['match_score']),
    'assigned_logo': assigned_logo,
}
with open(REPORT_FILE, 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

print(f"\nFull report saved: {REPORT_FILE}")
print("\nNext steps:")
print("  1. Review mismatches in report — manually fix wrong images in WP Admin")
print("  2. For missing files — re-upload correct images in WP Admin")
print("  3. Run again after fixes — emart logo placeholders will be replaced")
