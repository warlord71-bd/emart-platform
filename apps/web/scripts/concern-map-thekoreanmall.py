"""
Concern mapper: thekoreanmall.com slug → Emart concern category.

Phase 1: Scrape thekoreanmall concern subcat pages → slug list per concern
Phase 2: Match slugs to Emart products → assign WC concern category
Phase 3: Keyword-rule fallback for products not on thekoreanmall

Emart concern category IDs:
  7999 = Acne & Blemish Care
  8001 = Anti-Aging & Repair
  8003 = Dryness & Hydration
  8002 = Pores & Oil Control
  8017 = Melasma
  8016 = Spot Treatment
"""
import json, re, time, subprocess, urllib.request, os
from pathlib import Path
from collections import defaultdict

AUDIT   = Path('/root/emart-platform/audit')
WP_PATH = '/var/www/wordpress'
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120'}

# ── Emart concern category mapping ────────────────────────────────────────────
CONCERN_CATS = {
    'acne':     7999,  # Acne & Blemish Care
    'aging':    8001,  # Anti-Aging & Repair
    'dryness':  8003,  # Dryness & Hydration
    'pores':    8002,  # Pores & Oil Control
    'melasma':  8017,  # Melasma
    'spot':     8016,  # Spot Treatment
}

# thekoreanmall subcats → Emart concern key
TKM_CONCERN_MAP = {
    'acne-and-scars':        'acne',
    'acne-prone':            'acne',
    'spot-treatment':        'spot',
    'pores-and-blackheads':  'pores',
    'anti-ageing':           'aging',
    'wrinkle':               'aging',
    'damage-skin':           'aging',
    'damaged-skin':          'aging',
    'dryness':               'dryness',
    'hydration':             'dryness',
    'hyperpigmentation':     'melasma',
    'brightening':           'melasma',
}

# Keyword rules for non-TKM products (product name + short desc)
KEYWORD_RULES = [
    ('acne',   ['acne', 'blemish', 'pimple', 'breakout', 'salicylic', 'benzoyl', 'tea tree', 'centella', 'cica', 'BHA', 'zinc', 'anti-blemish', 'clear skin', 'spot', 'blackhead']),
    ('spot',   ['spot treatment', 'spot corrector', 'spot gel', 'spot serum', 'targeted treatment']),
    ('aging',  ['anti-aging', 'anti-ageing', 'retinol', 'retinoid', 'peptide', 'collagen', 'firming', 'wrinkle', 'fine line', 'lifting', 'resurfacing', 'renewal', 'repair', 'EGF', 'bakuchiol', 'ginseng']),
    ('pores',  ['pore', 'blackhead', 'sebum', 'oil control', 'mattif', 'T-zone', 'BHA', 'AHA', 'exfoliat']),
    ('melasma',['melasma', 'brightening', 'whitening', 'dark spot', 'pigment', 'hyperpigment', 'vitamin C', 'niacinamide', 'kojic', 'arbutin', 'tranexamic', 'azelaic', 'glutathione']),
    ('dryness',['hydrat', 'moistur', 'dry skin', 'hyaluronic', 'ceramide', 'barrier', 'soothing', 'calming', 'dehydrat', 'plump', 'water', 'hydro']),
]

def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    return urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='ignore')

def extract_slugs_from_tkm_page(html: str) -> list:
    """Extract product slugs from thekoreanmall listing page."""
    # Product links pattern: /product/some-slug
    slugs = re.findall(r'/product/([a-z0-9][a-z0-9\-]+[a-z0-9])', html)
    return list(set(slugs))

def get_all_pages(subcat: str) -> list:
    """Get all product slugs from a thekoreanmall concern subcat (all pages)."""
    base_url = f'https://www.thekoreanmall.com/products?subcat={subcat}'
    slugs = []
    page = 1
    while True:
        url = f'{base_url}&page={page}' if page > 1 else base_url
        try:
            html = fetch(url)
            page_slugs = extract_slugs_from_tkm_page(html)
            if not page_slugs or page > 20:
                break
            new_slugs = [s for s in page_slugs if s not in slugs]
            if not new_slugs:
                break
            slugs.extend(new_slugs)
            print(f'    Page {page}: +{len(new_slugs)} slugs (total: {len(slugs)})')
            page += 1
            time.sleep(0.4)
        except Exception as e:
            print(f'    Error page {page}: {e}')
            break
    return slugs

# ── Phase 1: Scrape TKM concern pages ────────────────────────────────────────
progress_file = AUDIT / 'tkm-concern-progress.json'
tkm_map = json.loads(progress_file.read_text()) if progress_file.exists() else {}
# tkm_map: {slug: concern_key}

for subcat, concern_key in TKM_CONCERN_MAP.items():
    if f'_done_{subcat}' in tkm_map:
        print(f'[SKIP] {subcat} (already scraped)')
        continue
    print(f'\n[SCRAPING] {subcat} → {concern_key}')
    slugs = get_all_pages(subcat)
    print(f'  Total: {len(slugs)} products')
    for slug in slugs:
        if slug not in tkm_map:
            tkm_map[slug] = concern_key
    tkm_map[f'_done_{subcat}'] = True
    progress_file.write_text(json.dumps(tkm_map))
    time.sleep(0.5)

# Clean internal markers
slug_concern = {k: v for k, v in tkm_map.items() if not k.startswith('_done_')}
print(f'\nTKM slug→concern map: {len(slug_concern)} unique slugs')

# ── Phase 2: Match TKM slugs to Emart products ───────────────────────────────
print('\nLoading Emart products...')
result = subprocess.run([
    'wp', '--path=' + WP_PATH, '--allow-root', 'db', 'query',
    "SELECT ID, post_name, post_title, LEFT(post_excerpt,200), LEFT(post_content,300) FROM wp4h_posts WHERE post_type='product' AND post_status='publish'",
    '--skip-column-names'
], capture_output=True, text=True)

emart_products = []
for line in result.stdout.splitlines():
    parts = line.split('\t')
    if len(parts) >= 3:
        pid = parts[0].strip()
        slug = parts[1].strip()
        title = parts[2].strip()
        excerpt = parts[3].strip() if len(parts) > 3 else ''
        content = parts[4].strip() if len(parts) > 4 else ''
        emart_products.append((pid, slug, title, excerpt, content))
print(f'{len(emart_products)} products loaded')

# Load existing concern assignments to avoid overwriting
existing_result = subprocess.run([
    'wp', '--path=' + WP_PATH, '--allow-root', 'eval',
    '''
global $wpdb;
$rows = $wpdb->get_results("
    SELECT DISTINCT tr.object_id
    FROM {$wpdb->term_relationships} tr
    JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id=tt.term_taxonomy_id
    WHERE tt.taxonomy='product_cat' AND tt.term_id IN (7999,8001,8003,8002,8017,8016)
");
echo implode(",", array_column($rows, 'object_id')) . "\n";
'''
], capture_output=True, text=True)
already_assigned = set(existing_result.stdout.strip().split(',')) if existing_result.stdout.strip() else set()
print(f'Already have concern: {len(already_assigned)} products')

# Build assignment list
assignments = {}  # product_id → concern_category_id

for pid, slug, title, excerpt, content in emart_products:
    if str(pid) in already_assigned:
        continue  # already has a concern — skip

    text = f'{title} {excerpt} {content}'.lower()
    concern_id = None

    # TKM slug match (highest priority)
    if slug in slug_concern:
        concern_id = CONCERN_CATS[slug_concern[slug]]

    # Keyword fallback
    if not concern_id:
        for concern_key, keywords in KEYWORD_RULES:
            if any(kw.lower() in text for kw in keywords):
                concern_id = CONCERN_CATS[concern_key]
                break

    if concern_id:
        assignments[str(pid)] = concern_id

print(f'\nAssignments ready: {len(assignments)} products')
tkm_matched = sum(1 for pid, slug, *_ in emart_products
                  if slug in slug_concern and str(pid) not in already_assigned)
keyword_matched = len(assignments) - tkm_matched
print(f'  TKM slug match:    ~{tkm_matched}')
print(f'  Keyword rule:      ~{keyword_matched}')

# Save assignment plan
out_file = AUDIT / 'concern-assignments.json'
out_file.write_text(json.dumps(assignments))
print(f'\nAssignment plan saved: {out_file}')

# ── Phase 3: Apply to WordPress ──────────────────────────────────────────────
print('\nApplying concern categories to WordPress...')

# Write PHP to apply
php = '''
global $wpdb;
$assignments = json_decode(file_get_contents("/root/emart-platform/audit/concern-assignments.json"), true);
$applied = 0;
foreach ($assignments as $pid => $cat_id) {
    $terms = wp_get_post_terms((int)$pid, "product_cat", ["fields"=>"ids"]);
    if (!in_array($cat_id, $terms)) {
        wp_set_post_terms((int)$pid, array_merge($terms, [$cat_id]), "product_cat");
        $applied++;
    }
}
echo "Applied: $applied concern categories\n";
'''

apply_result = subprocess.run([
    'wp', '--path=' + WP_PATH, '--allow-root', 'eval', php
], capture_output=True, text=True, timeout=300)
print(apply_result.stdout.strip())
if apply_result.stderr:
    errs = [l for l in apply_result.stderr.splitlines() if 'Warning' not in l and l.strip()]
    if errs: print('Errors:', '\n'.join(errs[:5]))

# ── Final count ───────────────────────────────────────────────────────────────
final = subprocess.run([
    'wp', '--path=' + WP_PATH, '--allow-root', 'eval',
    '''
global $wpdb;
$cats = [7999=>"Acne & Blemish Care",8001=>"Anti-Aging & Repair",8003=>"Dryness & Hydration",8002=>"Pores & Oil Control",8017=>"Melasma",8016=>"Spot Treatment"];
foreach ($cats as $id => $name) {
    $count = $wpdb->get_var("SELECT COUNT(DISTINCT tr.object_id) FROM {$wpdb->term_relationships} tr JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id=tt.term_taxonomy_id WHERE tt.term_id=$id AND tt.taxonomy='product_cat'");
    echo "$name: $count\n";
}
$total = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='product' AND post_status='publish'");
$with = $wpdb->get_var("SELECT COUNT(DISTINCT tr.object_id) FROM {$wpdb->term_relationships} tr JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id=tt.term_taxonomy_id JOIN {$wpdb->posts} p ON tr.object_id=p.ID WHERE tt.term_id IN (7999,8001,8003,8002,8017,8016) AND p.post_type='product' AND p.post_status='publish'");
echo "\nTotal with concern: $with / $total\n";
'''
], capture_output=True, text=True)
print('\n=== Final concern counts ===')
print(final.stdout.strip())
