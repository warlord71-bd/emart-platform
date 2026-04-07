#!/usr/bin/env python3
"""
Download real brand logos from official/Wikipedia sources.
Run on VPS: python3 scripts/download_brand_logos.py
"""

import os
import time
import urllib.request
import urllib.error

OUTPUT_DIR = "/var/www/emart-platform/apps/web/public/images/brands"
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
    'Accept': 'image/webp,image/png,image/svg+xml,image/*,*/*',
}

# Official logo sources for each brand
BRAND_LOGOS = {
    'cosrx': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/COSRX_logo.svg/320px-COSRX_logo.svg.png',
        'https://www.cosrx.com/cdn/shop/files/COSRX_Logo_Black.png',
    ],
    'laneige': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Laneige_logo.svg/320px-Laneige_logo.svg.png',
        'https://www.laneige.com/common/img/common/logo.png',
    ],
    'innisfree': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Innisfree_Logo.svg/320px-Innisfree_Logo.svg.png',
        'https://www.innisfree.com/images/en/common/logo.png',
    ],
    'some-by-mi': [
        'https://www.somebymi.com/skin/somebymi_en/img/layout/logo.png',
        'https://cdn.shopify.com/s/files/1/0565/3124/7001/files/somebymi_logo.png',
    ],
    'missha': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/MISSHA_logo.svg/320px-MISSHA_logo.svg.png',
        'https://www.misshaus.com/wp-content/uploads/2020/10/missha-logo.png',
    ],
    'the-ordinary': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/The_Ordinary_logo.svg/320px-The_Ordinary_logo.svg.png',
        'https://theordinary.com/on/demandware.static/Sites-deciem-US-Site/-/default/dw6f5d0b47/images/logo.svg',
    ],
    'cetaphil': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Cetaphil_logo.svg/320px-Cetaphil_logo.svg.png',
        'https://www.cetaphil.com/dw/image/v2/BBZJ_PRD/on/demandware.static/-/Library-Sites-CetaphilSharedLibrary/default/dw0a79e7c8/images/logo.png',
    ],
    'cerave': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/CeraVe_logo.svg/320px-CeraVe_logo.svg.png',
        'https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/cerave-logo.png',
    ],
    'maybelline': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Maybelline_logo.svg/320px-Maybelline_logo.svg.png',
        'https://www.maybelline.com/~/media/mny/us/brand-assets/mny-logo.png',
    ],
    'garnier': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Garnier_logo.svg/320px-Garnier_logo.svg.png',
        'https://www.garnier.com/~/media/project/loreal/brand-sites/garnier/americas/us/logos/garnier_logo.png',
    ],
    'bioderma': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Bioderma_logo.svg/320px-Bioderma_logo.svg.png',
        'https://www.bioderma.com/sites/default/files/styles/logo/public/2019-11/bioderma-logo.png',
    ],
    'isntree': [
        'https://www.isntree.com/web/product/extra/20220411130757_1lfFNnHy.jpg',
        'https://cdn.shopify.com/s/files/1/0565/isntree-logo.png',
    ],
    'jumiso': [
        'https://www.jumiso.com/web/upload/NNEditor/20220614/jumiso_logo.jpg',
        'https://cdn.jumiso.com/logo.png',
    ],
    'hada-labo': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Hada_Labo_logo.svg/320px-Hada_Labo_logo.svg.png',
        'https://www.hadalabo.co.jp/assets/img/common/logo.png',
    ],
    'banila-co': [
        'https://www.banila.co/en/img/common/logo.png',
        'https://cdn.shopify.com/s/files/banilaco-logo.png',
    ],
    'vanicream': [
        'https://www.vanicream.com/wp-content/themes/vanicream/images/vanicream-logo.svg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/vanicream_logo.svg/320px-vanicream_logo.svg.png',
    ],
    'skinfood': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Skinfood_logo.svg/320px-Skinfood_logo.svg.png',
        'https://www.skinfood.co.kr/eng/images/common/logo.png',
    ],
    'sulwhasoo': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Sulwhasoo_Logo.svg/320px-Sulwhasoo_Logo.svg.png',
        'https://www.sulwhasoo.com/content/dam/sulwhasoo/global/common/images/logo/sulwhasoo_logo.png',
    ],
    'revolution-skincare': [
        'https://www.revolutionbeauty.com/cdn/shop/files/revolution-logo.svg',
        'https://cdn.shopify.com/s/files/1/0270/revolution_logo.png',
    ],
}

def download(url, dest):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
            if len(data) > 1000:  # real image, not an error page
                with open(dest, 'wb') as f:
                    f.write(data)
                return True
    except Exception as e:
        pass
    return False

downloaded = []
failed = []

for brand_slug, urls in BRAND_LOGOS.items():
    # Skip if we already have a non-SVG real logo
    existing_files = [f for f in os.listdir(OUTPUT_DIR)
                      if f.startswith(brand_slug + '.') and not f.endswith('.svg')]
    if existing_files:
        print(f"SKIP {brand_slug} (already have {existing_files[0]})")
        continue

    print(f"Downloading {brand_slug}...", end=' ', flush=True)
    success = False
    for url in urls:
        ext = '.png'
        if '.svg' in url.split('?')[0]:
            ext = '.svg'
        dest = os.path.join(OUTPUT_DIR, f"{brand_slug}{ext}")
        if download(url, dest):
            print(f"✓ ({url[:50]}...)")
            downloaded.append(brand_slug)
            success = True
            break
        time.sleep(0.3)

    if not success:
        print(f"✗ all sources failed")
        failed.append(brand_slug)
    time.sleep(0.5)

print(f"\n✅ Downloaded: {len(downloaded)}: {downloaded}")
print(f"✗ Failed: {len(failed)}: {failed}")
print("\nFailed brands will use SVG placeholders already in the directory.")
