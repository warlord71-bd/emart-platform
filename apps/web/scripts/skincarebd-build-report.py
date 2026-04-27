"""
Phase 1 final: After scraping completes, build:
  1. audit/skincarebd/match-report.csv     — matched products with prices + action plan
  2. audit/skincarebd/not-on-emart.csv     — skincarebd products not on Emart
  3. audit/skincarebd/price-update.json    — products where skbd price < emart price
  4. audit/skincarebd/image-import.json    — products with white-bg images to import

Run after skincarebd-scrape.py completes.
"""
import json, csv, re
from pathlib import Path

AUDIT = Path('/root/emart-platform/audit/skincarebd')

# ── Load scraped data ──────────────────────────────────────────────────────────
with open(AUDIT / 'scraped.json') as f:
    scraped = json.load(f)

# ── Load Emart prices from WooCommerce (written by wp eval below) ─────────────
emart_prices_path = AUDIT / 'emart-prices.json'
emart_prices = {}
if emart_prices_path.exists():
    with open(emart_prices_path) as f:
        emart_prices = {str(p['id']): p for p in json.load(f)}

# ── Load not-matched list ──────────────────────────────────────────────────────
with open(AUDIT / 'not-matched.json') as f:
    not_matched = json.load(f)

# ── Build match report CSV ────────────────────────────────────────────────────
price_updates = []
image_imports = []

with open(AUDIT / 'match-report.csv', 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['emart_id','emart_title','skbd_slug','skbd_name',
                'skbd_regular','skbd_sale','emart_regular','emart_sale',
                'price_action','image_url','image_action','error'])

    for item in scraped:
        eid = str(item.get('emart_id',''))
        ep = emart_prices.get(eid, {})
        e_reg = ep.get('regular_price', '')
        e_sale = ep.get('sale_price', '')

        s_reg = item.get('regular_price')
        s_sale = item.get('sale_price')
        err = item.get('error','')

        # Price action: only lower sale price
        # Sanity filters — skip prices that are clearly placeholder/error:
        #   1. Absolute minimum: sale < ৳400 (৳100-৳150 placeholder prices on skincarebd)
        #   2. Ratio minimum: sale < 40% of regular (>60% discount = clearance/error)
        price_action = 'skip'
        if not err and s_sale and s_reg:
            try:
                ratio = float(s_sale) / float(s_reg)
                if float(s_sale) < 400:
                    price_action = f'skip_placeholder (৳{s_sale} below ৳400 minimum)'
                elif ratio < 0.40:
                    price_action = f'skip_suspicious (৳{s_sale} is {ratio*100:.0f}% of reg ৳{s_reg})'
                elif e_sale and float(s_sale) < float(e_sale):
                    price_action = f'update_sale ৳{e_sale}→৳{s_sale}'
                    price_updates.append({'emart_id': eid, 'sale_price': s_sale,
                                          'skbd_slug': item['skbd_slug']})
                elif not e_sale and e_reg and float(s_sale) < float(e_reg):
                    price_action = f'set_sale ৳{s_sale} (emart has no sale)'
                    price_updates.append({'emart_id': eid, 'sale_price': s_sale,
                                          'skbd_slug': item['skbd_slug']})
            except: pass

        # Image action
        img_url = item.get('image_url','')
        img_action = 'check_whitebg' if img_url and not err else 'skip'
        if img_url and not err:
            image_imports.append({'emart_id': eid, 'image_url': img_url,
                                  'emart_title': item.get('emart_title',''),
                                  'skbd_slug': item['skbd_slug']})

        w.writerow([eid, item.get('emart_title',''), item.get('skbd_slug',''),
                    item.get('name',''), s_reg, s_sale, e_reg, e_sale,
                    price_action, img_url, img_action, err])

# ── Not-on-Emart CSV ──────────────────────────────────────────────────────────
with open(AUDIT / 'not-on-emart.csv', 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['skbd_slug','skbd_url'])
    for item in not_matched:
        w.writerow([item['slug'], item['url']])

# ── Save action lists ─────────────────────────────────────────────────────────
with open(AUDIT / 'price-update.json', 'w') as f:
    json.dump(price_updates, f, indent=2)
with open(AUDIT / 'image-import.json', 'w') as f:
    json.dump(image_imports, f, indent=2)

print(f'Match report:    {len(scraped)} products → {AUDIT}/match-report.csv')
print(f'Price updates:   {len(price_updates)} products where skbd sale < emart price')
print(f'Image imports:   {len(image_imports)} products with image to check/import')
print(f'Not on Emart:    {len(not_matched)} products → {AUDIT}/not-on-emart.csv')
