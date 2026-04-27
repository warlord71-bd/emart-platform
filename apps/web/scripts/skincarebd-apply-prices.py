"""
Phase 3: Apply sale prices from skincarebd to Emart WooCommerce.
Only updates products where skbd sale price passed all sanity filters.

DRY_RUN=1 python3 skincarebd-apply-prices.py   # preview
python3 skincarebd-apply-prices.py              # apply
"""
import json, time, base64, urllib.request, urllib.error, os
from pathlib import Path

AUDIT   = Path('/root/emart-platform/audit/skincarebd')
DRY_RUN = os.environ.get('DRY_RUN') == '1'

env = {}
for line in Path('/var/www/emart-platform/apps/web/.env.local').read_text().splitlines():
    if '=' in line:
        k, _, v = line.partition('=')
        env[k.strip()] = v.strip()

WOO_URL    = 'https://e-mart.com.bd'  # always use canonical HTTPS domain for REST API
AUTH       = base64.b64encode(f'{env["WOO_CONSUMER_KEY"]}:{env["WOO_CONSUMER_SECRET"]}'.encode()).decode()
HEADERS    = {'Authorization': f'Basic {AUTH}', 'Content-Type': 'application/json'}

with open(AUDIT / 'price-update.json') as f:
    updates = json.load(f)

progress_file = AUDIT / 'price-apply-progress.json'
done = json.loads(progress_file.read_text()) if progress_file.exists() else {}

results = []
ok = skipped = errors = 0

print(f'Applying {len(updates)} price updates{"  [DRY RUN]" if DRY_RUN else ""}...\n')

for i, item in enumerate(updates):
    eid       = str(item['emart_id'])
    sale      = str(item['sale_price'])
    slug      = item['skbd_slug']

    if eid in done:
        skipped += 1
        continue

    if DRY_RUN:
        print(f'[DRY] ID {eid:6s} sale_price → ৳{sale}  ({slug[:45]})')
        done[eid] = 'dry_run'
        ok += 1
        continue

    try:
        req = urllib.request.Request(
            f'{WOO_URL}/wp-json/wc/v3/products/{eid}',
            data=json.dumps({'sale_price': sale}).encode(),
            headers=HEADERS,
            method='PUT'
        )
        with urllib.request.urlopen(req, timeout=20) as r:
            res = json.loads(r.read())
        actual_sale = res.get('sale_price', '?')
        print(f'[OK]  ID {eid:6s} sale_price → ৳{actual_sale}  ({slug[:40]})')
        done[eid] = f'set:{sale}'
        results.append({'id': eid, 'slug': slug, 'sale_price': sale, 'status': 'ok'})
        ok += 1

        if ok % 25 == 0:
            progress_file.write_text(json.dumps(done))
            print(f'  --- {ok}/{len(updates)} done ---')

        time.sleep(0.3)

    except Exception as e:
        print(f'[ERR] ID {eid}: {e}')
        done[eid] = f'error:{e}'
        results.append({'id': eid, 'slug': slug, 'status': 'error', 'error': str(e)})
        errors += 1

progress_file.write_text(json.dumps(done))

out = AUDIT / f'price-apply-{"dry" if DRY_RUN else "apply"}-results.json'
out.write_text(json.dumps(results, indent=2))

print(f'\nDone: {ok} updated | {skipped} skipped (already done) | {errors} errors')
if DRY_RUN:
    print('Re-run without DRY_RUN=1 to apply.')
