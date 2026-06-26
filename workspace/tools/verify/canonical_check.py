#!/usr/bin/env python3
"""Check canonical tags on /shop/[slug] pages are self-referential (read-only)."""

import subprocess
import re
import sys

SAMPLE_SIZE = 50
SITE_URL = "https://e-mart.com.bd"

def get_slugs():
    result = subprocess.run(
        ["mysql", "-u", "root", "emart_live", "-N", "-e",
         f"SELECT post_name FROM wp4h_posts WHERE post_type='product' AND post_status='publish' ORDER BY RAND() LIMIT {SAMPLE_SIZE};"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"MySQL error: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    return [s.strip() for s in result.stdout.strip().split("\n") if s.strip()]

def get_canonical(slug):
    result = subprocess.run(
        ["curl", "-s", "-H", "Host: e-mart.com.bd",
         f"http://localhost:3000/shop/{slug}"],
        capture_output=True, text=True, timeout=15
    )
    html = result.stdout
    match = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', html)
    if not match:
        match = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', html)
    return match.group(1) if match else None

def main():
    slugs = get_slugs()
    print(f"Checking canonical tags on {len(slugs)} /shop/ pages...\n")
    print(f"{'SLUG':<65} {'CANONICAL':<70} {'RESULT'}")
    print("-" * 145)

    flags = []
    for slug in slugs:
        expected = f"{SITE_URL}/shop/{slug}"
        try:
            canonical = get_canonical(slug)
        except subprocess.TimeoutExpired:
            canonical = "TIMEOUT"

        if canonical is None:
            verdict = "FLAG"
            canonical_display = "(missing)"
            flags.append((slug, canonical_display, "missing canonical"))
        elif canonical == expected:
            verdict = "PASS"
            canonical_display = canonical
        else:
            verdict = "FLAG"
            canonical_display = canonical
            flags.append((slug, canonical_display, "not self-referential"))

        print(f"{slug:<65} {canonical_display:<70} {verdict}")

    print(f"\n{'='*145}")
    print(f"Total: {len(slugs)} | PASS: {len(slugs) - len(flags)} | FLAG: {len(flags)}")
    if flags:
        print(f"\nFLAGGED ({len(flags)}):")
        for slug, canon, reason in flags:
            print(f"  /shop/{slug} → {canon} ({reason})")

if __name__ == "__main__":
    main()
