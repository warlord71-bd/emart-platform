#!/usr/bin/env python3
"""Reconcile published product counts across MySQL, WC REST, Qdrant, sitemap (read-only)."""

import subprocess
import json
import re
import sys
import urllib.request
import ssl

SITE_URL = "https://e-mart.com.bd"

def count_mysql():
    result = subprocess.run(
        ["mysql", "-u", "root", "emart_live", "-N", "-e",
         "SELECT COUNT(*) FROM wp4h_posts WHERE post_type='product' AND post_status='publish';"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        return None, result.stderr.strip()
    return int(result.stdout.strip()), None

def count_wc_api():
    # HTTPS + -k (self-signed) + Host header to bypass Nginx HTTP→HTTPS redirect
    result = subprocess.run(
        ["curl", "-s", "-D", "-", "-o", "/dev/null", "-k",
         "-H", "Host: e-mart.com.bd",
         "https://127.0.0.1/wp-json/wc/v3/products?status=publish&per_page=1"
         "&consumer_key=ck_49cb0be7c05aa9b4e69dc7f62409fa7be246ba71"
         "&consumer_secret=cs_1b8bb1bf0d6972d4650c8d3e0b9f445a9cab7103"],
        capture_output=True, text=True, timeout=15
    )
    for line in result.stdout.split("\n"):
        if line.lower().startswith("x-wp-total:"):
            return int(line.split(":")[1].strip()), None
    return None, "WC API: X-WP-Total header not found"

def count_qdrant():
    result = subprocess.run(
        ["curl", "-s", "-H", "api-key: L6lRe2r7jmAMxFlNJrBBaDSWvv5Z1LvCZL6RmUvh8GM",
         "http://localhost:6333/collections/emart_products"],
        capture_output=True, text=True, timeout=10
    )
    try:
        data = json.loads(result.stdout)
        return int(data["result"]["points_count"]), None
    except (json.JSONDecodeError, KeyError) as e:
        return None, f"Qdrant error: {str(e)}"

def count_sitemap():
    result = subprocess.run(
        ["curl", "-s", "-H", "Host: e-mart.com.bd",
         "http://localhost:3000/sitemap.xml"],
        capture_output=True, text=True, timeout=15
    )
    urls = re.findall(r'<loc>https://e-mart\.com\.bd/shop/[^<]+</loc>', result.stdout)
    return len(urls), None

def main():
    print("Reconciling published product counts across 4 sources...\n")

    sources = {}
    mysql_count, mysql_err = count_mysql()
    sources["MySQL (emart_live)"] = (mysql_count, mysql_err)

    wc_count, wc_err = count_wc_api()
    sources["WC REST API"] = (wc_count, wc_err)

    qdrant_count, qdrant_err = count_qdrant()
    sources["Qdrant (emart_products)"] = (qdrant_count, qdrant_err)

    sitemap_count, sitemap_err = count_sitemap()
    sources["Sitemap (/shop/)"] = (sitemap_count, sitemap_err)

    print(f"{'SOURCE':<30} {'COUNT':>8}  {'STATUS'}")
    print("-" * 60)

    counts = set()
    errors = []
    for name, (count, err) in sources.items():
        if err:
            status = f"ERROR: {err}"
            errors.append(name)
        else:
            counts.add(count)
            status = "OK"
        print(f"{name:<30} {str(count) if count is not None else 'N/A':>8}  {status}")

    print(f"\n{'='*60}")
    if errors:
        print(f"Errors: {', '.join(errors)}")
    if len(counts) <= 1 and not errors:
        print("RESULT: ALL AGREE ✓")
    else:
        print(f"RESULT: DISAGREEMENT DETECTED — {len(counts)} distinct counts: {sorted(counts)}")
        print("FLAG: Sources do not agree on published product count.")

if __name__ == "__main__":
    main()
