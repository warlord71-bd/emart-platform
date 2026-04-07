#!/usr/bin/env python3
"""
Scrape brand logos from emartwayskincare.com.bd and save to brands directory.
Run on the VPS: python3 scripts/scrape_brand_logos.py
"""

import os
import re
import time
import urllib.request
import urllib.parse
import json
from html.parser import HTMLParser

OUTPUT_DIR = "/var/www/emart-platform/apps/web/public/images/brands"
SITE_URL = "https://emartwayskincare.com.bd"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
}

class ImageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'img':
            src = attrs.get('src', '') or attrs.get('data-src', '') or attrs.get('data-lazy-src', '')
            alt = attrs.get('alt', '')
            if src:
                self.images.append({'src': src, 'alt': alt})

def slugify(name):
    name = name.lower().strip()
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[\s_]+', '-', name)
    name = re.sub(r'-+', '-', name)
    return name.strip('-')

def fetch_url(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read()
    except Exception as e:
        print(f"  ERROR fetching {url}: {e}")
        return None

def is_brand_logo(src, alt):
    """Heuristic: brand logos are usually in /brands/, /logos/, or named after brands."""
    src_lower = src.lower()
    keywords = ['brand', 'logo', 'cosrx', 'laneige', 'innisfree', 'missha', 'some-by-mi',
                'somebymi', 'cetaphil', 'cerave', 'hada', 'ordinary', 'maybelline',
                'sulwhasoo', 'arencia', 'rohto', 'bioderma', 'isntree', 'simple',
                'banila', 'jumiso', 'pax-moly', 'revolution', 'garnier', 'vanicream',
                'beaute', 'jnh', 'skin-food', 'skinfood']
    return any(k in src_lower or k in alt.lower() for k in keywords)

def download_image(src, dest_path):
    if src.startswith('//'):
        src = 'https:' + src
    elif src.startswith('/'):
        src = SITE_URL + src
    elif not src.startswith('http'):
        src = SITE_URL + '/' + src

    data = fetch_url(src)
    if data and len(data) > 500:
        with open(dest_path, 'wb') as f:
            f.write(data)
        return True
    return False

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Scraping brand logos from {SITE_URL}")
    print(f"Output: {OUTPUT_DIR}\n")

    # Pages to scrape
    pages = [
        SITE_URL,
        SITE_URL + '/brands',
        SITE_URL + '/brand',
        SITE_URL + '/all-brands',
    ]

    found_images = {}

    for page_url in pages:
        print(f"Fetching: {page_url}")
        html = fetch_url(page_url)
        if not html:
            continue

        parser = ImageParser()
        try:
            parser.feed(html.decode('utf-8', errors='ignore'))
        except Exception:
            continue

        for img in parser.images:
            src = img['src']
            alt = img['alt'].strip()
            if is_brand_logo(src, alt):
                key = alt if alt else slugify(os.path.basename(src.split('?')[0]))
                if key and key not in found_images:
                    found_images[key] = src
                    print(f"  Found: {alt or 'unknown'} -> {src[:80]}")

        time.sleep(1)

    print(f"\nFound {len(found_images)} potential brand logos")
    print("Downloading...\n")

    downloaded = []
    skipped = []

    for name, src in found_images.items():
        slug = slugify(name)
        if not slug or len(slug) < 2:
            continue

        # Determine extension
        ext = os.path.splitext(src.split('?')[0])[1].lower()
        if ext not in ['.png', '.jpg', '.jpeg', '.svg', '.webp']:
            ext = '.png'

        dest = os.path.join(OUTPUT_DIR, f"{slug}{ext}")

        # Skip if already exists and is a good SVG we created
        if os.path.exists(dest.replace(ext, '.svg')):
            print(f"  SKIP (SVG exists): {slug}")
            skipped.append(slug)
            continue

        print(f"  Downloading {slug}{ext}...")
        if download_image(src, dest):
            downloaded.append({'slug': slug, 'name': name, 'file': f"{slug}{ext}"})
            print(f"  ✓ Saved {slug}{ext}")
        else:
            print(f"  ✗ Failed {slug}")
        time.sleep(0.5)

    # Save manifest
    manifest_path = os.path.join(OUTPUT_DIR, 'manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(downloaded, f, indent=2)

    print(f"\n✅ Downloaded: {len(downloaded)}")
    print(f"⏭  Skipped (SVG exists): {len(skipped)}")
    print(f"📄 Manifest: {manifest_path}")

    if downloaded:
        print("\nDownloaded brands:")
        for b in downloaded:
            print(f"  - {b['name']} -> /images/brands/{b['file']}")

if __name__ == '__main__':
    main()
