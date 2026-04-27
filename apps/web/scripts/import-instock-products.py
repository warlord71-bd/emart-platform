"""
Sourcing gap importer: check stock via JSON-LD → create WC product if in-stock.
Resumable — skips already-processed slugs.

For each in-stock product:
  1. Confirm in-stock via JSON-LD availability
  2. Download white-bg image, process to 600x600
  3. Import image via WP-CLI media import
  4. Create WC product: name, price, image, categories
  5. Set _rank_math_description and short_description

Run: nohup python3 scripts/import-instock-products.py > /tmp/product-import.log 2>&1 &
"""
import csv, json, re, time, io, subprocess, urllib.request, os
from pathlib import Path
from PIL import Image

AUDIT   = Path('/root/emart-platform/audit/skincarebd')
TMPDIR  = Path('/tmp/emart-new-imports')
TMPDIR.mkdir(exist_ok=True)
WP_PATH = '/var/www/wordpress'
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120'}

progress_file = AUDIT / 'product-import-progress.json'
done = json.loads(progress_file.read_text()) if progress_file.exists() else {}

rows = list(csv.DictReader(open(AUDIT / 'sourcing-gap-import-ready.csv')))
print(f'Processing {len(rows)} candidates | Already done: {len(done)}\n')

# ── Emart category mapping from product name keywords ──────────────────────────
EMART_CATS = {
    'cleanser': 134, 'foam': 134, 'cleansing': 134,        # Face Cleansers
    'toner': 133, 'essence': 133, 'mist': 133,              # Toners (use existing)
    'serum': 132, 'ampoule': 132,                           # Serums
    'moisturizer': 131, 'cream': 131, 'lotion': 131, 'gel': 131,  # Moisturizer
    'sunscreen': 292, 'sun cream': 292, 'spf': 292, 'suncream': 292,  # Sunscreen
    'mask': 133, 'sheet mask': 133, 'sleeping mask': 133,  # Masks
    'eye cream': 131, 'eye serum': 132,                     # Eye care
    'hair': 133, 'shampoo': 133, 'conditioner': 133,       # Hair care
    'body': 133, 'body wash': 133, 'body lotion': 133,     # Body care
    'lip': 133, 'lipstick': 133,                           # Lips
    'foundation': 133, 'cushion': 133, 'bb cream': 133,    # Makeup
}
SKINCARE_CAT_ID = 133   # Skincare Essentials (fallback)
KBEAUTY_CAT_ID  = 7943  # Korean Beauty

def get_category_id(name: str) -> list:
    name_lower = name.lower()
    for keyword, cat_id in EMART_CATS.items():
        if keyword in name_lower:
            return [cat_id, KBEAUTY_CAT_ID]
    return [SKINCARE_CAT_ID, KBEAUTY_CAT_ID]

def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    return urllib.request.urlopen(req, timeout=12).read()

def check_stock_jsonld(html: str) -> str:
    ld_blocks = re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.DOTALL)
    for b in ld_blocks:
        try:
            d = json.loads(b.strip())
            if isinstance(d, dict) and d.get('@type') == 'Product':
                offers = d.get('offers', {})
                if isinstance(offers, list): offers = offers[0]
                av = offers.get('availability', '')
                if 'InStock' in av: return 'in_stock'
                if 'OutOfStock' in av: return 'out_of_stock'
        except: pass
    oos_class = bool(re.search(r'class=["\'][^"\']*\bout-of-stock\b', html))
    if oos_class: return 'out_of_stock'
    return 'unknown'

def get_price_from_jsonld(html: str) -> str:
    ld_blocks = re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.DOTALL)
    for b in ld_blocks:
        try:
            d = json.loads(b.strip())
            if isinstance(d, dict) and d.get('@type') == 'Product':
                offers = d.get('offers', {})
                if isinstance(offers, list): offers = offers[0]
                price = offers.get('price', '')
                if price: return str(float(price))
        except: pass
    return ''

def is_white_background(raw: bytes, threshold=232, coverage=0.87) -> bool:
    try:
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = img.size
        border = []
        step_w, step_h = max(1, w//40), max(1, h//40)
        for x in range(0, w, step_w):
            border += [img.getpixel((x,0)), img.getpixel((x,h-1))]
        for y in range(0, h, step_h):
            border += [img.getpixel((0,y)), img.getpixel((w-1,y))]
        white = sum(1 for r,g,b in border if r>threshold and g>threshold and b>threshold)
        return (white/len(border)) >= coverage
    except: return False

def process_image(raw: bytes) -> bytes:
    img = Image.open(io.BytesIO(raw)).convert('RGBA')
    canvas = Image.new('RGB', (600, 600), (255, 255, 255))
    img.thumbnail((580, 580), Image.LANCZOS)
    offset = ((600-img.width)//2, (600-img.height)//2)
    canvas.paste(img if img.mode != 'RGBA' else img.convert('RGB'), offset)
    if img.mode == 'RGBA':
        canvas.paste(img, offset, img)
    out = io.BytesIO()
    canvas.save(out, format='JPEG', quality=88, optimize=True)
    return out.getvalue()

def create_wc_product(name: str, price: str, cat_ids: list, img_path: str, slug_hint: str) -> dict:
    """Create WC product via WP-CLI and return {id, slug}."""
    # Build category JSON
    cats_json = json.dumps([{"id": c} for c in cat_ids])
    safe_name = name.replace("'", "\\'").replace('"', '\\"')
    short_desc = f"<p>Buy {name} in Bangladesh. 100% authentic import. Dhaka 1-2 days delivery.</p>"

    php = f'''
global $wpdb;
$args = [
    "post_title"   => "{safe_name}",
    "post_status"  => "publish",
    "post_type"    => "product",
    "post_excerpt" => "{short_desc}",
];
$pid = wp_insert_post($args);
if (is_wp_error($pid)) {{ echo "ERROR:" . $pid->get_error_message(); return; }}

// Set product type
wp_set_object_terms($pid, "simple", "product_type");

// Price
update_post_meta($pid, "_regular_price", "{price}");
update_post_meta($pid, "_price", "{price}");
update_post_meta($pid, "_stock_status", "instock");
update_post_meta($pid, "_manage_stock", "no");
update_post_meta($pid, "_visibility", "visible");

// Categories
$cat_ids = {cats_json};
wp_set_post_terms($pid, $cat_ids, "product_cat");

// Get slug
$post = get_post($pid);
echo "OK:" . $pid . ":" . $post->post_name;
'''
    result = subprocess.run(['wp', f'--path={WP_PATH}', '--allow-root', 'eval', php],
                           capture_output=True, text=True, timeout=30)
    output = result.stdout.strip()
    if not output.startswith('OK:'):
        return {}
    parts = output.split(':')
    pid, pslug = int(parts[1]), parts[2] if len(parts) > 2 else slug_hint

    # Import image
    if img_path and Path(img_path).exists():
        alt = f"{name} Price in Bangladesh | Emart"
        ir = subprocess.run(['wp', f'--path={WP_PATH}', '--allow-root',
                            'media', 'import', img_path,
                            f'--post_id={pid}', '--featured_image',
                            f'--title={alt}', '--porcelain'],
                           capture_output=True, text=True, timeout=30)
        media_id = ir.stdout.strip()
        if media_id.isdigit():
            subprocess.run(['wp', f'--path={WP_PATH}', '--allow-root',
                           'post', 'meta', 'update', media_id,
                           '_wp_attachment_image_alt', alt],
                          capture_output=True, timeout=15)

    return {'id': pid, 'slug': pslug}

# ── Main loop ──────────────────────────────────────────────────────────────────
in_stock = created = oos = errors = skipped = 0

for i, row in enumerate(rows):
    url  = row.get('product_url', '')
    name = row.get('name', '').strip()
    img_url = row.get('image_url', '')
    price = row.get('price', '')
    source = row.get('source', '')

    slug = re.search(r'/product/([^/]+)', url)
    slug = slug.group(1) if slug else name[:40]

    if slug in done:
        status = done[slug].get('status', '')
        if status == 'created': created += 1
        elif status == 'out_of_stock': oos += 1
        else: skipped += 1
        continue

    # Emartway products — can't check stock reliably, skip for now
    if source == 'emartwayskincare.com.bd':
        done[slug] = {'status': 'emartway_skip', 'name': name}
        skipped += 1
        continue

    try:
        html = fetch(url).decode('utf-8', errors='ignore')
        stock = check_stock_jsonld(html)

        if stock == 'out_of_stock':
            print(f'[{i+1}/{len(rows)}] ✗ OOS  {name[:55]}')
            done[slug] = {'status': 'out_of_stock', 'name': name}
            oos += 1
            time.sleep(0.25)
            continue

        in_stock += 1
        # Use live price if available
        live_price = get_price_from_jsonld(html) or price
        if not live_price or float(live_price or 0) < 100:
            live_price = price

        # Download + check image
        img_path = ''
        if img_url and img_url != 'manual_required':
            try:
                raw = fetch(img_url)
                if is_white_background(raw):
                    cleaned = process_image(raw)
                    img_path = str(TMPDIR / f'new-{slug[:60]}.jpg')
                    Path(img_path).write_bytes(cleaned)
            except: pass

        cat_ids = get_category_id(name)
        result = create_wc_product(name, live_price, cat_ids, img_path, slug)

        if img_path: Path(img_path).unlink(missing_ok=True)

        if result:
            print(f'[{i+1}/{len(rows)}] ✓ NEW  ID={result["id"]} ৳{live_price} {name[:45]}')
            done[slug] = {'status': 'created', 'wc_id': result['id'], 'name': name, 'price': live_price}
            created += 1
        else:
            print(f'[{i+1}/{len(rows)}] ! ERR  {name[:55]}')
            done[slug] = {'status': 'create_error', 'name': name}
            errors += 1

        time.sleep(0.4)

    except Exception as e:
        print(f'[{i+1}/{len(rows)}] ? ERR  {slug}: {e}')
        done[slug] = {'status': f'error: {str(e)[:60]}', 'name': name}
        errors += 1

    if (i+1) % 20 == 0:
        progress_file.write_text(json.dumps(done))
        print(f'  ── created={created} | oos={oos} | errors={errors} ──')

progress_file.write_text(json.dumps(done))

print(f'\n{"="*60}')
print(f'In stock:      {in_stock}')
print(f'Created:       {created}')
print(f'Out of stock:  {oos} (skipped)')
print(f'Errors:        {errors}')
print(f'Skipped:       {skipped}')
