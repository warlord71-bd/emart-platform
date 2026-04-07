#!/usr/bin/env python3
"""
Download real brand logos from Wikimedia Commons and other public sources.
Run on VPS: python3 scripts/download_brand_logos.py
"""

import os
import time
import urllib.request
import urllib.error

OUTPUT_DIR = "/var/www/emart-platform/apps/web/public/images/brands"
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; EmartBot/1.0)',
    'Accept': 'image/png,image/svg+xml,image/jpeg,image/*',
}

# Wikimedia Commons and other reliable public sources
BRAND_LOGOS = {
    'cosrx': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/COSRX_logo.svg/400px-COSRX_logo.svg.png',
    'laneige': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Laneige_logo.svg/400px-Laneige_logo.svg.png',
    'innisfree': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Innisfree_Logo.svg/400px-Innisfree_Logo.svg.png',
    'missha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/MISSHA_logo.svg/400px-MISSHA_logo.svg.png',
    'cetaphil': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Cetaphil_logo.svg/400px-Cetaphil_logo.svg.png',
    'cerave': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/CeraVe_logo.svg/400px-CeraVe_logo.svg.png',
    'maybelline': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Maybelline_logo.svg/400px-Maybelline_logo.svg.png',
    'garnier': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Garnier_logo.svg/400px-Garnier_logo.svg.png',
    'the-ordinary': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/The_Ordinary_logo.svg/400px-The_Ordinary_logo.svg.png',
    'bioderma': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Bioderma_logo.svg/400px-Bioderma_logo.svg.png',
    'sulwhasoo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Sulwhasoo_Logo.svg/400px-Sulwhasoo_Logo.svg.png',
    'hada-labo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Hada_Labo_logo.svg/400px-Hada_Labo_logo.svg.png',
    'skinfood': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Skinfood_logo.svg/400px-Skinfood_logo.svg.png',
    'la-roche-posay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/La_Roche-Posay_logo.svg/400px-La_Roche-Posay_logo.svg.png',
    'neutrogena': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Neutrogena_logo.svg/400px-Neutrogena_logo.svg.png',
    'olay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Olay_logo.svg/400px-Olay_logo.svg.png',
    'nivea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/NIVEA_logo.svg/400px-NIVEA_logo.svg.png',
    'shiseido': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Shiseido_logo.svg/400px-Shiseido_logo.svg.png',
    'sk-ii': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/SK-II_logo.svg/400px-SK-II_logo.svg.png',
    'loreal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/L%27Or%C3%A9al_logo.svg/400px-L%27Or%C3%A9al_logo.svg.png',
}

def download(url, dest):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
            if len(data) > 500:
                with open(dest, 'wb') as f:
                    f.write(data)
                return True
    except Exception as e:
        pass
    return False

print(f"Downloading brand logos to {OUTPUT_DIR}\n")
downloaded = []
skipped = []
failed = []

for slug, url in BRAND_LOGOS.items():
    # Check if real image already exists (not SVG placeholder)
    png_exists = os.path.exists(os.path.join(OUTPUT_DIR, f"{slug}.png"))
    jpg_exists = os.path.exists(os.path.join(OUTPUT_DIR, f"{slug}.jpg"))
    if png_exists or jpg_exists:
        print(f"SKIP {slug} (already have real image)")
        skipped.append(slug)
        continue

    dest = os.path.join(OUTPUT_DIR, f"{slug}.png")
    print(f"Downloading {slug}...", end=' ', flush=True)
    if download(url, dest):
        size = os.path.getsize(dest)
        print(f"✓ ({size/1024:.1f}KB)")
        downloaded.append(slug)
    else:
        print("✗ failed")
        failed.append(slug)
    time.sleep(0.5)

print(f"\n✅ Downloaded: {len(downloaded)}: {downloaded}")
print(f"⏭  Skipped:    {len(skipped)}")
print(f"✗  Failed:     {len(failed)}: {failed}")
print("\nFailed brands will use SVG text placeholders already in the directory.")
