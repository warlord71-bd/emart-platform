"""
Build combined sourcing gap CSV from:
  1. /tmp/missing_in_emart.csv        — 454 products from emartwayskincare
  2. audit/skincarebd/not-on-emart.csv — 1,100 products from skincarebd

Steps:
  - Scrape skincarebd not-on-emart pages for image URL + price
  - Check white background on each image
  - Merge both lists, deduplicate by normalized name
  - Output: audit/skincarebd/sourcing-gap-combined.csv

Columns: name, source, product_url, image_url, white_bg, price, status
"""
import csv, json, re, time, io, urllib.request, os
from pathlib import Path
from PIL import Image

AUDIT   = Path('/root/emart-platform/audit/skincarebd')
DRY_RUN = os.environ.get('DRY_RUN') == '1'
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120'}

# ── Helpers ────────────────────────────────────────────────────────────────────
def normalize(name: str) -> str:
    """Lowercase, strip punctuation/spaces for deduplication."""
    return re.sub(r'[^a-z0-9]', '', name.lower())

def is_white_background(raw: bytes, threshold=232, coverage=0.87) -> bool:
    try:
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = img.size
        border = []
        step_w, step_h = max(1, w // 40), max(1, h // 40)
        for x in range(0, w, step_w):
            border += [img.getpixel((x, 0)), img.getpixel((x, h - 1))]
        for y in range(0, h, step_h):
            border += [img.getpixel((0, y)), img.getpixel((w - 1, y))]
        white = sum(1 for r, g, b in border if r > threshold and g > threshold and b > threshold)
        return (white / len(border)) >= coverage
    except:
        return False

def fetch(url: str, retries=2) -> bytes:
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            return urllib.request.urlopen(req, timeout=12).read()
        except Exception as e:
            if i == retries - 1:
                raise
            time.sleep(1)

def parse_skincarebd_page(html: str, url: str) -> dict:
    """Extract name, price, image from skincarebd product page."""
    result = {'name': '', 'price': '', 'image_url': '', 'url': url}

    # JSON-LD
    ld_blocks = re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.DOTALL)
    for b in ld_blocks:
        try:
            d = json.loads(b.strip())
            if isinstance(d, dict) and d.get('@type') == 'Product':
                result['name'] = d.get('name', '')
                imgs = d.get('image', [])
                result['image_url'] = imgs[0] if isinstance(imgs, list) and imgs else (imgs or '')
        except:
            pass

    # Price
    amounts = re.findall(r'<bdi>\s*<span[^>]*currencySymbol[^>]*>[^<]*</span>\s*([\d,\.]+)\s*</bdi>', html)
    prices = sorted(set(float(a.replace(',', '')) for a in amounts if float(a.replace(',', '')) > 0), reverse=True)
    if prices:
        result['price'] = str(prices[-1])  # lowest = sale/current price

    # Fallback image
    if not result['image_url']:
        og = re.search(r'property=["\']og:image["\'] content=["\']([^"\']+)["\']', html)
        if og:
            result['image_url'] = og.group(1)

    return result

# ── Load emartway missing (454) ────────────────────────────────────────────────
emartway_rows = []
with open('/tmp/missing_in_emart.csv') as f:
    for row in csv.DictReader(f):
        emartway_rows.append({
            'name':        row['name'].strip(),
            'source':      'emartwayskincare.com.bd',
            'product_url': f"https://www.emartwayskincare.com.bd/product/{normalize(row['name']).replace(' ', '-')}/",
            'image_url':   'manual_required',
            'white_bg':    'unknown',
            'price':       row.get('price', ''),
            'status':      'image_cdn_inaccessible',
        })

print(f'Emartway loaded: {len(emartway_rows)} products')

# ── Load skincarebd not-on-emart (1,100) and scrape images ───────────────────
skbd_progress_file = AUDIT / 'sourcing-gap-skbd-progress.json'
skbd_done = json.loads(skbd_progress_file.read_text()) if skbd_progress_file.exists() else {}

skbd_items = []
with open(AUDIT / 'not-on-emart.csv') as f:
    for row in csv.DictReader(f):
        skbd_items.append({'slug': row['skbd_slug'], 'url': row['skbd_url']})

print(f'Skincarebd loaded: {len(skbd_items)} products to scrape')
print(f'Already scraped:   {len(skbd_done)}')
print()

skbd_results = {}

for i, item in enumerate(skbd_items):
    slug = item['slug']
    if slug in skbd_done:
        skbd_results[slug] = skbd_done[slug]
        continue

    try:
        html = fetch(item['url']).decode('utf-8', errors='ignore')
        parsed = parse_skincarebd_page(html, item['url'])

        white_bg = 'unknown'
        if parsed['image_url'] and not DRY_RUN:
            try:
                raw = fetch(parsed['image_url'])
                white_bg = 'yes' if is_white_background(raw) else 'no'
            except:
                white_bg = 'fetch_error'

        result = {
            'name':        parsed['name'] or slug.replace('-', ' ').title(),
            'source':      'skincarebd.com',
            'product_url': item['url'],
            'image_url':   parsed['image_url'],
            'white_bg':    white_bg,
            'price':       parsed['price'],
            'status':      'white_bg_ok' if white_bg == 'yes' else ('non_white_bg' if white_bg == 'no' else 'pending'),
        }
        skbd_results[slug] = result
        skbd_done[slug] = result

        icon = '✓' if white_bg == 'yes' else ('✗' if white_bg == 'no' else '?')
        print(f'[{i+1}/{len(skbd_items)}] {icon} {slug[:55]}')

        if (i + 1) % 30 == 0:
            skbd_progress_file.write_text(json.dumps(skbd_done))

        time.sleep(0.35)

    except Exception as e:
        result = {
            'name': slug.replace('-', ' ').title(), 'source': 'skincarebd.com',
            'product_url': item['url'], 'image_url': '', 'white_bg': 'error',
            'price': '', 'status': f'error: {e}',
        }
        skbd_results[slug] = result
        skbd_done[slug] = result
        print(f'[{i+1}] ERR {slug}: {e}')

skbd_progress_file.write_text(json.dumps(skbd_done))
print(f'\nSkincarebd scrape done: {len(skbd_results)} processed')

# ── Deduplicate between the two lists ────────────────────────────────────────
emartway_norms = {normalize(r['name']): r for r in emartway_rows}
all_rows = list(emartway_rows)
duplicates = 0

for slug, r in skbd_results.items():
    norm = normalize(r['name'])
    if norm in emartway_norms:
        # Skincarebd version has image data — prefer it, mark both sources
        existing = emartway_norms[norm]
        existing['source'] = 'both (skincarebd + emartway)'
        existing['image_url'] = r['image_url'] or existing['image_url']
        existing['white_bg']  = r['white_bg']
        existing['price']     = r['price'] or existing['price']
        existing['status']    = r['status']
        duplicates += 1
    else:
        all_rows.append(r)
        emartway_norms[norm] = r

# ── Write combined CSV ────────────────────────────────────────────────────────
out_path = AUDIT / 'sourcing-gap-combined.csv'
white_only = [r for r in all_rows if r['white_bg'] == 'yes' or r['source'].startswith('both')]
non_white  = [r for r in all_rows if r['white_bg'] == 'no']
no_image   = [r for r in all_rows if r['white_bg'] in ('unknown', 'error', 'fetch_error', 'pending') or r['image_url'] == 'manual_required']

# Sort: white-bg first, then non-white, then unknown
sorted_rows = white_only + non_white + no_image

with open(out_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['name','source','product_url','image_url','white_bg','price','status'])
    w.writeheader()
    w.writerows(sorted_rows)

print(f'\n{"="*60}')
print(f'Total unique products:  {len(all_rows)}')
print(f'Duplicates merged:      {duplicates}')
print(f'White-bg image (✓):     {len(white_only)}')
print(f'Non-white image (✗):    {len(non_white)}')
print(f'No image / manual:      {len(no_image)}')
print(f'\nOutput: {out_path}')
