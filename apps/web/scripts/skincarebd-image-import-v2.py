"""
Phase 2 v2: Download → white-bg check → EXIF strip → WP-CLI import as featured image.
Uses wp media import instead of REST API (avoids auth issues).

DRY_RUN=1 python3 skincarebd-image-import-v2.py   # preview only
python3 skincarebd-image-import-v2.py              # apply
"""
import json, os, io, time, subprocess, urllib.request, tempfile
from pathlib import Path
from PIL import Image

AUDIT   = Path('/root/emart-platform/audit/skincarebd')
TMPDIR  = Path('/tmp/emart-imgs')
TMPDIR.mkdir(exist_ok=True)
DRY_RUN = os.environ.get('DRY_RUN') == '1'
WP_PATH = '/var/www/wordpress'

progress_file = AUDIT / 'image-v2-progress.json'
done = json.loads(progress_file.read_text()) if progress_file.exists() else {}

with open(AUDIT / 'image-import.json') as f:
    items = json.load(f)

HEADERS = {'User-Agent': 'Mozilla/5.0 Chrome/120'}

def is_white_background(img: Image.Image, threshold=235, coverage=0.88) -> bool:
    rgb = img.convert('RGB')
    w, h = rgb.size
    border = []
    step = max(1, w // 40)
    for x in range(0, w, step):
        border.append(rgb.getpixel((x, 0)))
        border.append(rgb.getpixel((x, h - 1)))
    step = max(1, h // 40)
    for y in range(0, h, step):
        border.append(rgb.getpixel((0, y)))
        border.append(rgb.getpixel((w - 1, y)))
    white = sum(1 for r, g, b in border if r > threshold and g > threshold and b > threshold)
    return (white / len(border)) >= coverage

def process_image(raw: bytes) -> bytes:
    img = Image.open(io.BytesIO(raw)).convert('RGBA')
    canvas = Image.new('RGB', (600, 600), (255, 255, 255))
    img.thumbnail((580, 580), Image.LANCZOS)
    offset = ((600 - img.width) // 2, (600 - img.height) // 2)
    if img.mode == 'RGBA':
        canvas.paste(img, offset, img)
    else:
        canvas.paste(img.convert('RGB'), offset)
    out = io.BytesIO()
    canvas.save(out, format='JPEG', quality=88, optimize=True)
    return out.getvalue()

def wp_import(img_path: str, post_id: str, alt: str) -> bool:
    result = subprocess.run([
        'wp', '--path=' + WP_PATH, '--allow-root',
        'media', 'import', img_path,
        f'--post_id={post_id}',
        '--featured_image',
        f'--title={alt}',
        '--porcelain'
    ], capture_output=True, text=True, timeout=30)
    if result.returncode == 0:
        media_id = result.stdout.strip()
        # Set alt text
        subprocess.run([
            'wp', '--path=' + WP_PATH, '--allow-root',
            'post', 'meta', 'update', media_id, '_wp_attachment_image_alt', alt
        ], capture_output=True, timeout=15)
        return True
    return False

ok = skipped_bg = skipped_done = errors = 0
results = []

print(f'Processing {len(items)} images{"  [DRY RUN]" if DRY_RUN else ""}...\n')

for i, item in enumerate(items):
    eid   = str(item['emart_id'])
    url   = item['image_url']
    title = item['emart_title']
    slug  = item['skbd_slug']
    alt   = f"{title} Price in Bangladesh | Emart"

    if eid in done:
        skipped_done += 1
        continue

    try:
        req = urllib.request.Request(url, headers=HEADERS)
        raw = urllib.request.urlopen(req, timeout=15).read()

        img = Image.open(io.BytesIO(raw))
        if not is_white_background(img):
            print(f'[SKIP-BG]  {slug[:60]}')
            done[eid] = 'skipped_not_white'
            skipped_bg += 1
            results.append({'emart_id': eid, 'slug': slug, 'status': 'skipped_not_white'})
            time.sleep(0.15)
            continue

        cleaned = process_image(raw)
        tmp_path = str(TMPDIR / f'emart-{slug}.jpg')
        Path(tmp_path).write_bytes(cleaned)

        if DRY_RUN:
            print(f'[DRY-OK]   {slug[:60]:60s} ({len(cleaned)//1024}KB white-bg ✓)')
            done[eid] = 'dry_ok'
            ok += 1
            results.append({'emart_id': eid, 'slug': slug, 'status': 'dry_ok'})
        else:
            if wp_import(tmp_path, eid, alt):
                print(f'[IMPORTED] {slug[:55]:55s} → WC {eid}')
                done[eid] = 'imported'
                ok += 1
                results.append({'emart_id': eid, 'slug': slug, 'status': 'imported'})
            else:
                print(f'[WP-ERR]   {slug[:60]}')
                done[eid] = 'wp_error'
                errors += 1
                results.append({'emart_id': eid, 'slug': slug, 'status': 'wp_error'})

        Path(tmp_path).unlink(missing_ok=True)

        if (ok + errors) % 50 == 0:
            progress_file.write_text(json.dumps(done))
            print(f'  ── {ok} imported | {skipped_bg} non-white | {errors} errors ──')

        time.sleep(0.3)

    except Exception as e:
        print(f'[ERROR]    {slug}: {e}')
        done[eid] = f'error:{e}'
        errors += 1
        results.append({'emart_id': eid, 'slug': slug, 'status': 'error', 'error': str(e)})

progress_file.write_text(json.dumps(done))
mode = 'dry' if DRY_RUN else 'apply'
(AUDIT / f'image-v2-{mode}-results.json').write_text(json.dumps(results, indent=2))

print(f'\n{"="*60}')
print(f'Imported:      {ok}')
print(f'Non-white bg:  {skipped_bg} (skipped)')
print(f'Already done:  {skipped_done} (skipped)')
print(f'Errors:        {errors}')
if DRY_RUN:
    print('\nRe-run without DRY_RUN=1 to apply.')
