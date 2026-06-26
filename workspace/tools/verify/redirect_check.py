#!/usr/bin/env python3
"""Check legacy /product/[slug] → /shop/[slug] redirects (read-only)."""

import subprocess
import sys

SAMPLE_SIZE = 50

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

def check_redirect(slug):
    result = subprocess.run(
        ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code} %{redirect_url}",
         "-H", "Host: e-mart.com.bd", f"http://localhost:3000/product/{slug}"],
        capture_output=True, text=True, timeout=10
    )
    parts = result.stdout.strip().split(" ", 1)
    status = parts[0]
    target = parts[1] if len(parts) > 1 else ""
    return status, target

def main():
    slugs = get_slugs()
    print(f"Checking {len(slugs)} legacy /product/ redirects...\n")
    print(f"{'SLUG':<65} {'STATUS':>6}  {'TARGET':<60} {'RESULT'}")
    print("-" * 145)

    flags = []
    for slug in slugs:
        try:
            status, target = check_redirect(slug)
        except subprocess.TimeoutExpired:
            status, target = "TIMEOUT", ""

        # 301 and 308 are both permanent redirects (Next.js uses 308)
        is_permanent = status in ("301", "308")
        correct_target = f"/shop/{slug}" in target if target else False
        passed = is_permanent and correct_target
        verdict = "PASS" if passed else "FLAG"

        if not passed:
            flags.append((slug, status, target))

        print(f"{slug:<65} {status:>6}  {target:<60} {verdict}")

    print(f"\n{'='*145}")
    print(f"Total: {len(slugs)} | PASS: {len(slugs) - len(flags)} | FLAG: {len(flags)}")
    if flags:
        print(f"\nFLAGGED ({len(flags)}):")
        for slug, status, target in flags:
            print(f"  {slug} → {status} {target}")

if __name__ == "__main__":
    main()
