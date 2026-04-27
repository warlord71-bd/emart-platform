"""
Phase 1 scraper: fetch price + image from skincarebd.com for matched products.
Writes: audit/skincarebd/scraped.json
"""
import json, re, time, sys, urllib.request, urllib.error
from pathlib import Path

AUDIT = Path('/root/emart-platform/audit/skincarebd')
PROGRESS_FILE = AUDIT / 'scrape-progress.json'

with open(AUDIT / 'matched.json') as f:
    matched = json.load(f)

# Resume support
progress = {}
if PROGRESS_FILE.exists():
    with open(PROGRESS_FILE) as f:
        progress = json.load(f)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
}

def fetch(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as r:
                return r.read().decode('utf-8', errors='ignore')
        except Exception as e:
            if i == retries - 1:
                raise
            time.sleep(2)

def parse_product(html, url):
    result = {'url': url, 'regular_price': None, 'sale_price': None, 'image_url': None, 'name': None}

    # Name from JSON-LD
    ld_blocks = re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.DOTALL)
    for b in ld_blocks:
        try:
            d = json.loads(b.strip())
            if isinstance(d, dict) and d.get('@type') == 'Product':
                result['name'] = d.get('name', '')
                imgs = d.get('image', [])
                result['image_url'] = imgs[0] if isinstance(imgs, list) and imgs else (imgs if isinstance(imgs, str) else None)
        except:
            pass

    # Prices — WooCommerce renders: currency symbol + amount in <bdi> tags
    amounts = re.findall(r'<bdi>\s*<span[^>]*currencySymbol[^>]*>[^<]*</span>\s*([\d,\.]+)\s*</bdi>', html)
    prices = []
    for a in amounts:
        try:
            prices.append(float(a.replace(',', '')))
        except:
            pass
    prices = sorted(set(p for p in prices if p > 0))

    if len(prices) == 1:
        result['regular_price'] = prices[0]
    elif len(prices) >= 2:
        result['regular_price'] = max(prices)
        result['sale_price'] = min(prices)

    # Fallback image from og:image
    if not result['image_url']:
        og = re.search(r'property=["\']og:image["\'] content=["\']([^"\']+)["\']', html)
        if og:
            result['image_url'] = og.group(1)

    return result

total = len(matched)
scraped = list(progress.values())
done_slugs = set(progress.keys())

print(f'Total to scrape: {total} | Already done: {len(done_slugs)} | Remaining: {total - len(done_slugs)}')

for i, item in enumerate(matched):
    slug = item['skbd_slug']
    if slug in done_slugs:
        continue

    try:
        html = fetch(item['skbd_url'])
        data = parse_product(html, item['skbd_url'])
        data.update({
            'skbd_slug': slug,
            'emart_id': item['emart_id'],
            'emart_title': item['emart_title'],
        })
        progress[slug] = data
        scraped.append(data)

        reg = data['regular_price']
        sale = data['sale_price']
        img = '✓' if data['image_url'] else '✗'
        print(f'[{len(done_slugs)+1}/{total}] {slug[:50]:50s} reg=৳{reg} sale=৳{sale} img={img}')
        done_slugs.add(slug)

        # Save progress every 20
        if len(done_slugs) % 20 == 0:
            with open(PROGRESS_FILE, 'w') as f:
                json.dump(progress, f)

        time.sleep(0.4)  # ~2.5 req/s — polite

    except Exception as e:
        print(f'  ERROR {slug}: {e}')
        progress[slug] = {'skbd_slug': slug, 'emart_id': item['emart_id'],
                          'emart_title': item['emart_title'], 'error': str(e),
                          'url': item['skbd_url'], 'regular_price': None,
                          'sale_price': None, 'image_url': None}
        done_slugs.add(slug)

# Final save
with open(PROGRESS_FILE, 'w') as f:
    json.dump(progress, f)
with open(AUDIT / 'scraped.json', 'w') as f:
    json.dump(list(progress.values()), f, indent=2)

print(f'\nDone. {len([x for x in progress.values() if not x.get("error")])} OK, '
      f'{len([x for x in progress.values() if x.get("error")])} errors')
print(f'Output: {AUDIT}/scraped.json')
