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
import base64, csv, html as html_lib, json, re, time, io, subprocess, urllib.request, os
from pathlib import Path
from PIL import Image

AUDIT   = Path('/root/emart-platform/audit/skincarebd')
TMPDIR  = Path('/tmp/emart-new-imports')
TMPDIR.mkdir(exist_ok=True)
WP_PATH = '/var/www/wordpress'
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120'}

progress_file = AUDIT / 'product-import-progress.json'
done = json.loads(progress_file.read_text()) if progress_file.exists() else {}
RETRY_STATUSES = {'create_error'}

rows = list(csv.DictReader(open(AUDIT / 'sourcing-gap-import-ready.csv')))
print(f'Processing {len(rows)} candidates | Already done: {len(done)}\n')

# ── Emart category mapping from product name keywords ──────────────────────────
EMART_CAT_RULES = [
    (('sunscreen', 'sun screen', 'sun cream', 'suncream', 'sun stick', 'spf', 'uv protector'), 806),
    (('cream-to-foam', 'facial wash', 'face wash', 'cleanser', 'cleansing', 'foam', 'micellar'), 7984),
    (('shampoo',), 3549),
    (('conditioner',), 7985),
    (('hair mask', 'hair food', 'hair treatment'), 7979),
    (('hair oil', 'argan oil'), 3605),
    (('eye cream', 'eye serum', 'eye gel', 'eye butter'), 7989),
    (('lipstick', 'lip tint', 'tint'), 8022),
    (('lip balm', 'lip oil', 'lip treatment', 'lip care', 'lip'), 8023),
    (('sheet mask',), 957),
    (('sleeping mask', 'sleep mask'), 757),
    (('wash off mask', 'clay mask', 'mud mask'), 876),
    (('toner pad', 'toner pads'), 7995),
    (('toner', 'mist'), 7994),
    (('serum', 'ampoule', 'essence', 'retinol', 'arbutin', 'peptide', 'niacinamide'), 7996),
    (('foundation', 'cushion', 'bb cream', 'cc cream', 'primer', 'concealer'), 7980),
    (('body wash',), 7990),
    (('body lotion',), 7987),
    (('body oil',), 8027),
    (('body',), 8005),
    (('moisturizer', 'moisturiser', 'cream', 'lotion', 'gel'), 8941),
    (('hair',), 7141),
]
SKINCARE_CAT_ID = 748   # Skincare Essentials (fallback)

def get_category_id(name: str) -> list:
    name_lower = name.lower()
    for keywords, cat_id in EMART_CAT_RULES:
        if any(keyword in name_lower for keyword in keywords):
            return [cat_id]
    return [SKINCARE_CAT_ID]

def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    return urllib.request.urlopen(req, timeout=12).read()

def normalize_title(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', '', html_lib.unescape(value).lower())

def clean_text(value: str) -> str:
    text = value or ''
    for _ in range(3):
        decoded = html_lib.unescape(text)
        if decoded == text:
            break
        text = decoded
    return re.sub(r'\s+', ' ', text).strip()

def core_title(value: str) -> str:
    value = clean_text(value).lower()
    value = re.sub(r'spf\s*\d+\+*', ' ', value)
    value = re.sub(r'pa\s*\+*', ' ', value)
    value = re.sub(r'\bnew\s+version\b', ' ', value)
    value = re.sub(r'\bwith\s+packet\b|\bwithout\s+packet\b', ' ', value)
    return re.sub(r'[^a-z0-9]+', '', value)

def load_existing_titles() -> set:
    result = subprocess.run([
        'wp', f'--path={WP_PATH}', '--allow-root', 'db', 'query',
        "SELECT post_title FROM wp4h_posts WHERE post_type='product' AND post_status IN ('publish','draft','private')",
        '--skip-column-names',
    ], capture_output=True, text=True, timeout=120)
    return {normalize_title(line) for line in result.stdout.splitlines() if line.strip()}

existing_titles = load_existing_titles()
existing_core_titles = {core_title(title) for title in existing_titles if title}
print(f'Existing Woo product titles loaded: {len(existing_titles)}')

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

def clean_price(value: str) -> str:
    value = html_lib.unescape(value or '')
    match = re.search(r'[\d,]+(?:\.\d+)?', value)
    if not match:
        return ''
    amount = float(match.group(0).replace(',', ''))
    return str(int(amount)) if amount.is_integer() else str(amount)

def get_price_pair(html: str, fallback_price: str) -> tuple[str, str]:
    price_block = re.search(r'<p class=["\'][^"\']*\bprice\b[^"\']*["\'][^>]*>(.*?)</p>', html, re.DOTALL | re.IGNORECASE)
    if price_block:
        block = price_block.group(1)
        regular_match = re.search(r'<del[^>]*>(.*?)</del>', block, re.DOTALL | re.IGNORECASE)
        sale_match = re.search(r'<ins[^>]*>(.*?)</ins>', block, re.DOTALL | re.IGNORECASE)
        if regular_match and sale_match:
            regular = clean_price(regular_match.group(1))
            sale = clean_price(sale_match.group(1))
            if regular and sale:
                return regular, sale

        text_block = re.sub(r'<[^>]+>', ' ', block)
        amounts = [clean_price(amount) for amount in re.findall(r'৳\s*[\d,]+(?:\.\d+)?', html_lib.unescape(text_block))]
        amounts = [amount for amount in amounts if amount]
        if len(amounts) >= 2:
            return amounts[0], amounts[1]
        if len(amounts) == 1:
            return amounts[0], ''

    ld_blocks = re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.DOTALL)
    for b in ld_blocks:
        try:
            d = json.loads(b.strip())
            if isinstance(d, dict) and d.get('@type') == 'Product':
                offers = d.get('offers', {})
                if isinstance(offers, list): offers = offers[0]
                price = offers.get('price', '')
                if price:
                    return clean_price(str(price)), ''
        except: pass
    return clean_price(fallback_price), ''

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

def create_wc_product(name: str, regular_price: str, sale_price: str, cat_ids: list, img_path: str, slug_hint: str) -> dict:
    """Create WC product via WP-CLI and return {id, slug}."""
    cat_ids_php = '[' + ','.join(str(int(c)) for c in cat_ids) + ']'
    product_name_b64 = base64.b64encode(name.encode('utf-8')).decode('ascii')
    short_desc = f"<p>Buy {name} in Bangladesh. 100% authentic import. Dhaka 1-2 days delivery.</p>"
    short_desc_b64 = base64.b64encode(short_desc.encode('utf-8')).decode('ascii')
    regular_price_b64 = base64.b64encode(str(regular_price).encode('utf-8')).decode('ascii')
    sale_price_b64 = base64.b64encode(str(sale_price).encode('utf-8')).decode('ascii')

    php = f'''
global $wpdb;
$product_name = base64_decode("{product_name_b64}");
$short_desc = base64_decode("{short_desc_b64}");
$regular_price = base64_decode("{regular_price_b64}");
$sale_price = base64_decode("{sale_price_b64}");
$args = [
    "post_title"   => $product_name,
    "post_status"  => "publish",
    "post_type"    => "product",
    "post_excerpt" => $short_desc,
];
$pid = wp_insert_post($args);
if (is_wp_error($pid)) {{ echo "ERROR:" . $pid->get_error_message(); return; }}

// Set product type
wp_set_object_terms($pid, "simple", "product_type");

// Price
update_post_meta($pid, "_regular_price", $regular_price);
if ($sale_price !== "" && (float) $sale_price < (float) $regular_price) {{
    update_post_meta($pid, "_sale_price", $sale_price);
    update_post_meta($pid, "_price", $sale_price);
}} else {{
    delete_post_meta($pid, "_sale_price");
    update_post_meta($pid, "_price", $regular_price);
}}
update_post_meta($pid, "_stock_status", "instock");
update_post_meta($pid, "_manage_stock", "no");
update_post_meta($pid, "_visibility", "visible");

// Categories
$cat_ids = {cat_ids_php};
wp_set_post_terms($pid, $cat_ids, "product_cat");

// Get slug
$post = get_post($pid);
echo "OK:" . $pid . ":" . $post->post_name;
'''
    result = subprocess.run(['wp', f'--path={WP_PATH}', '--allow-root', 'eval', php],
                           capture_output=True, text=True, timeout=30)
    output = result.stdout.strip()
    if not output.startswith('OK:'):
        detail = (result.stderr or output or 'unknown WP-CLI error').strip().splitlines()[-1]
        print(f'  WP create failed: {detail[:180]}')
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
    name = clean_text(row.get('name', '').strip())
    img_url = row.get('image_url', '')
    price = row.get('price', '')
    source = row.get('source', '')

    slug = re.search(r'/product/([^/]+)', url)
    slug = slug.group(1) if slug else name[:40]

    normalized_name = normalize_title(name)
    normalized_core_name = core_title(name)
    if normalized_name in existing_titles or normalized_core_name in existing_core_titles:
        if done.get(slug, {}).get('status') == 'created':
            pass
        else:
            print(f'[{i+1}/{len(rows)}] ↷ DUP  {name[:55]}')
            done[slug] = {'status': 'duplicate_existing', 'name': name}
            skipped += 1
            continue

    if slug in done:
        status = done[slug].get('status', '')
        if status in RETRY_STATUSES:
            print(f'[{i+1}/{len(rows)}] ↻ RETRY {name[:55]}')
        else:
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
        regular_price, sale_price = get_price_pair(html, price)
        if not regular_price or float(regular_price or 0) < 100:
            regular_price = clean_price(price)
            sale_price = ''

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
        result = create_wc_product(name, regular_price, sale_price, cat_ids, img_path, slug)

        if img_path: Path(img_path).unlink(missing_ok=True)

        if result:
            price_note = f'৳{regular_price}' + (f'→৳{sale_price}' if sale_price else '')
            print(f'[{i+1}/{len(rows)}] ✓ NEW  ID={result["id"]} {price_note} {name[:45]}')
            done[slug] = {'status': 'created', 'wc_id': result['id'], 'name': name, 'regular_price': regular_price, 'sale_price': sale_price}
            existing_titles.add(normalized_name)
            existing_core_titles.add(normalized_core_name)
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
