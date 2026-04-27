"""
Check stock status of sourcing-gap-import-ready.csv products on skincarebd.com.
Removes out-of-stock items. Outputs: sourcing-gap-in-stock.csv

Checks for WooCommerce out-of-stock indicators in the product page HTML.
"""
import csv, re, time, urllib.request
from pathlib import Path

AUDIT   = Path('/root/emart-platform/audit/skincarebd')
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120'}
PROGRESS = AUDIT / 'stock-check-progress.json'

import json
done = json.loads(PROGRESS.read_text()) if PROGRESS.exists() else {}

rows = list(csv.DictReader(open(AUDIT / 'sourcing-gap-import-ready.csv')))
print(f'Checking stock for {len(rows)} products...\n')

results = []
in_stock = out_of_stock = errors = skipped = 0

def check_stock(url: str) -> str:
    """Returns 'in_stock', 'out_of_stock', or 'unknown'"""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        html = urllib.request.urlopen(req, timeout=12).read().decode('utf-8', errors='ignore')

        # WooCommerce out-of-stock signals
        if re.search(r'out.of.stock|Out of Stock|stock_status.*outofstock|outofstock|আউট অব স্টক|stock.*unavailable', html, re.IGNORECASE):
            return 'out_of_stock'
        # WooCommerce in-stock / add to cart signals
        if re.search(r'add.to.cart|add_to_cart|instock|in.stock|"availability":"InStock"', html, re.IGNORECASE):
            return 'in_stock'
        # If price exists but no cart button, likely out of stock
        if re.search(r'woocommerce-Price-amount', html):
            return 'in_stock'  # has price = likely purchasable
        return 'unknown'
    except Exception as e:
        return f'error: {str(e)[:60]}'

for i, row in enumerate(rows):
    slug = row.get('skbd_slug') or re.search(r'/product/([^/]+)', row.get('product_url','')).group(1) if re.search(r'/product/([^/]+)', row.get('product_url','')) else ''

    if not slug:
        # Emartway products — can't check stock, include by default
        row['stock_status'] = 'unknown_emartway'
        results.append(row)
        skipped += 1
        continue

    if slug in done:
        row['stock_status'] = done[slug]
        results.append(row)
        if done[slug] == 'in_stock': in_stock += 1
        elif done[slug] == 'out_of_stock': out_of_stock += 1
        else: skipped += 1
        continue

    url = row.get('product_url') or f'https://skincarebd.com/product/{slug}/'
    status = check_stock(url)
    done[slug] = status
    row['stock_status'] = status
    results.append(row)

    icon = '✓' if status == 'in_stock' else ('✗' if status == 'out_of_stock' else '?')
    print(f'[{i+1}/{len(rows)}] {icon} {slug[:55]:55s} {status}')

    if status == 'in_stock': in_stock += 1
    elif status == 'out_of_stock': out_of_stock += 1
    else: skipped += 1

    if (i+1) % 30 == 0:
        PROGRESS.write_text(json.dumps(done))

    time.sleep(0.3)

PROGRESS.write_text(json.dumps(done))

# Write in-stock only CSV
in_stock_rows = [r for r in results if r.get('stock_status') in ('in_stock', 'unknown_emartway', 'unknown')]
out_path = AUDIT / 'sourcing-gap-in-stock.csv'
fields = list(rows[0].keys()) + ['stock_status']
with open(out_path, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(in_stock_rows)

print(f'\n{"="*60}')
print(f'In stock:      {in_stock}')
print(f'Out of stock:  {out_of_stock} (excluded)')
print(f'Unknown:       {skipped}')
print(f'In-stock CSV:  {out_path}')
# Also copy to public
import shutil
shutil.copy(out_path, '/var/www/emart-platform/apps/web/public/audit/sourcing-gap-in-stock-2026-04-27.csv')
print(f'Public URL:    https://e-mart.com.bd/audit/sourcing-gap-in-stock-2026-04-27.csv')
