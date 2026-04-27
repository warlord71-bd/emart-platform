"""
Phase 2: Download skincarebd images, verify white background,
strip EXIF, upload to WooCommerce, set as product featured image.

Requirements: pip install Pillow requests
Run AFTER reviewing image-import.json.

DRY_RUN=1 python3 skincarebd-image-import.py   # preview only
python3 skincarebd-image-import.py              # apply
"""
import json, os, io, re, time, sys, tempfile, urllib.request
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print('Install Pillow: pip install Pillow'); sys.exit(1)

AUDIT    = Path('/root/emart-platform/audit/skincarebd')
DL_DIR   = AUDIT / 'images'
DL_DIR.mkdir(exist_ok=True)
DRY_RUN  = os.environ.get('DRY_RUN') == '1'

# Load env
env = {}
env_path = Path('/var/www/emart-platform/apps/web/.env.local')
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if '=' in line:
            k, _, v = line.partition('=')
            env[k.strip()] = v.strip()

WOO_URL    = env.get('NEXT_PUBLIC_WOO_URL', 'https://e-mart.com.bd')
WOO_KEY    = env.get('WOO_CONSUMER_KEY', '')
WOO_SECRET = env.get('WOO_CONSUMER_SECRET', '')

import base64, http.client
AUTH = base64.b64encode(f'{WOO_KEY}:{WOO_SECRET}'.encode()).decode()

HEADERS = {'User-Agent': 'Mozilla/5.0 Chrome/120', 'Authorization': f'Basic {AUTH}'}

def is_white_background(img: Image.Image, threshold=240, coverage=0.90) -> bool:
    """Check if ≥90% of border pixels are near-white."""
    rgb = img.convert('RGB')
    w, h = rgb.size
    border = []
    for x in range(w):
        border.append(rgb.getpixel((x, 0)))
        border.append(rgb.getpixel((x, h - 1)))
    for y in range(1, h - 1):
        border.append(rgb.getpixel((0, y)))
        border.append(rgb.getpixel((w - 1, y)))
    white_count = sum(1 for r, g, b in border if r > threshold and g > threshold and b > threshold)
    return (white_count / len(border)) >= coverage

def strip_exif_and_resize(img_bytes: bytes) -> bytes:
    """Strip EXIF, ensure RGB, resize to 600x600 on white canvas, return PNG bytes."""
    img = Image.open(io.BytesIO(img_bytes)).convert('RGBA')
    # White canvas 600x600
    canvas = Image.new('RGB', (600, 600), (255, 255, 255))
    img.thumbnail((580, 580), Image.LANCZOS)
    offset = ((600 - img.width) // 2, (600 - img.height) // 2)
    canvas.paste(img, offset, img if img.mode == 'RGBA' else None)
    out = io.BytesIO()
    canvas.save(out, format='JPEG', quality=90, optimize=True)
    return out.getvalue()

def upload_image_to_wc(img_bytes: bytes, filename: str, alt: str, product_id: str) -> bool:
    """Upload image to WP media and set as product image via WC REST API."""
    import urllib.request as ur
    # Step 1: Upload to WP media
    boundary = 'EmartImageBoundary'
    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f'Content-Type: image/jpeg\r\n\r\n'
    ).encode() + img_bytes + f'\r\n--{boundary}--\r\n'.encode()

    req = ur.Request(
        f'{WOO_URL}/wp-json/wp/v2/media',
        data=body,
        headers={
            'Authorization': f'Basic {AUTH}',
            'Content-Type': f'multipart/form-data; boundary={boundary}',
        },
        method='POST'
    )
    with ur.urlopen(req, timeout=30) as r:
        media = json.loads(r.read())
    media_id = media['id']

    # Set alt text
    alt_req = ur.Request(
        f'{WOO_URL}/wp-json/wp/v2/media/{media_id}',
        data=json.dumps({'alt_text': alt}).encode(),
        headers={'Authorization': f'Basic {AUTH}', 'Content-Type': 'application/json'},
        method='POST'
    )
    ur.urlopen(alt_req, timeout=15)

    # Step 2: Set as product image via WC REST API
    update_req = ur.Request(
        f'{WOO_URL}/wp-json/wc/v3/products/{product_id}',
        data=json.dumps({'images': [{'id': media_id, 'alt': alt, 'position': 0}]}).encode(),
        headers={'Authorization': f'Basic {AUTH}', 'Content-Type': 'application/json'},
        method='PUT'
    )
    ur.urlopen(update_req, timeout=30)
    return True

# ── Main ───────────────────────────────────────────────────────────────────────
with open(AUDIT / 'image-import.json') as f:
    items = json.load(f)

progress_file = AUDIT / 'image-progress.json'
done = {}
if progress_file.exists():
    done = json.loads(progress_file.read_text())

results = []
skipped_not_white = 0
skipped_error = 0

print(f'Processing {len(items)} images{"  [DRY RUN]" if DRY_RUN else ""}...\n')

for i, item in enumerate(items):
    eid    = item['emart_id']
    url    = item['image_url']
    title  = item['emart_title']
    slug   = item['skbd_slug']
    alt    = f"{title} Price in Bangladesh | Emart"

    if eid in done:
        continue

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 Chrome/120'})
        raw = urllib.request.urlopen(req, timeout=15).read()

        img = Image.open(io.BytesIO(raw))
        if not is_white_background(img):
            print(f'[SKIP-BG]  {slug[:55]}')
            done[eid] = 'skipped_not_white'
            skipped_not_white += 1
            results.append({'emart_id': eid, 'slug': slug, 'status': 'skipped_not_white'})
            time.sleep(0.2)
            continue

        cleaned = strip_exif_and_resize(raw)
        filename = f"emart-{slug}.jpg"

        if DRY_RUN:
            print(f'[DRY-OK]   {slug[:55]:55s} ({len(cleaned)//1024}KB white-bg ✓)')
            done[eid] = 'dry_run_ok'
            results.append({'emart_id': eid, 'slug': slug, 'status': 'dry_run_ok', 'size_kb': len(cleaned)//1024})
        else:
            upload_image_to_wc(cleaned, filename, alt, eid)
            print(f'[IMPORTED] {slug[:55]:55s} → WC ID {eid}')
            done[eid] = 'imported'
            results.append({'emart_id': eid, 'slug': slug, 'status': 'imported'})

        if i % 20 == 0:
            progress_file.write_text(json.dumps(done))

        time.sleep(0.5)

    except Exception as e:
        print(f'[ERROR]    {slug}: {e}')
        done[eid] = f'error: {e}'
        skipped_error += 1
        results.append({'emart_id': eid, 'slug': slug, 'status': 'error', 'error': str(e)})

progress_file.write_text(json.dumps(done))

out_file = AUDIT / f'image-import-{"dry-run" if DRY_RUN else "apply"}-results.json'
out_file.write_text(json.dumps(results, indent=2))

ok = len([r for r in results if r['status'] in ('imported','dry_run_ok')])
print(f'\nSummary: {ok} imported | {skipped_not_white} non-white skipped | {skipped_error} errors')
if DRY_RUN:
    print('Re-run without DRY_RUN=1 to apply.')
