#!/usr/bin/env python3
"""Sweep published product/category pages for accidental noindex (read-only)."""

import subprocess
import re
import sys

PRODUCT_SAMPLE = 50
SITE_URL = "https://e-mart.com.bd"

def get_product_slugs():
    result = subprocess.run(
        ["mysql", "-u", "root", "emart_live", "-N", "-e",
         f"SELECT post_name FROM wp4h_posts WHERE post_type='product' AND post_status='publish' ORDER BY RAND() LIMIT {PRODUCT_SAMPLE};"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"MySQL error: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return [f"/shop/{s.strip()}" for s in result.stdout.strip().split("\n") if s.strip()]

def get_category_urls():
    result = subprocess.run(
        ["curl", "-s", "-H", "Host: e-mart.com.bd", "http://localhost:3000/sitemap.xml"],
        capture_output=True, text=True, timeout=15
    )
    urls = re.findall(r'<loc>https://e-mart\.com\.bd(/category/[^<]+)</loc>', result.stdout)
    return urls

def check_page(path):
    result = subprocess.run(
        ["curl", "-s", "-D", "-", "-H", "Host: e-mart.com.bd",
         f"http://localhost:3000{path}"],
        capture_output=True, text=True, timeout=15
    )
    output = result.stdout
    headers, _, body = output.partition("\r\n\r\n")
    if not body:
        headers, _, body = output.partition("\n\n")

    x_robots = ""
    for line in headers.split("\n"):
        if line.lower().startswith("x-robots-tag:"):
            x_robots = line.split(":", 1)[1].strip()

    meta_match = re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']+)["\']', body)
    if not meta_match:
        meta_match = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']robots["\']', body)
    meta_robots = meta_match.group(1) if meta_match else ""

    return meta_robots, x_robots

def main():
    product_urls = get_product_slugs()
    category_urls = get_category_urls()
    all_urls = product_urls + category_urls

    print(f"Sweeping {len(product_urls)} product + {len(category_urls)} category pages for noindex...\n")
    print(f"{'URL':<75} {'META ROBOTS':<30} {'X-ROBOTS-TAG':<20} {'RESULT'}")
    print("-" * 155)

    flags = []
    for path in all_urls:
        try:
            meta_robots, x_robots = check_page(path)
        except subprocess.TimeoutExpired:
            meta_robots, x_robots = "TIMEOUT", ""

        combined = f"{meta_robots} {x_robots}".lower()
        has_noindex = "noindex" in combined
        verdict = "FLAG" if has_noindex else "PASS"

        if has_noindex:
            flags.append((path, meta_robots, x_robots))

        print(f"{path:<75} {meta_robots or '(none)':<30} {x_robots or '(none)':<20} {verdict}")

    print(f"\n{'='*155}")
    print(f"Total: {len(all_urls)} | PASS: {len(all_urls) - len(flags)} | FLAG: {len(flags)}")
    if flags:
        print(f"\nFLAGGED ({len(flags)}):")
        for path, meta, xr in flags:
            directive = f"meta={meta}" if meta else ""
            if xr:
                directive += f" x-robots={xr}"
            print(f"  {path} → {directive.strip()}")

if __name__ == "__main__":
    main()
