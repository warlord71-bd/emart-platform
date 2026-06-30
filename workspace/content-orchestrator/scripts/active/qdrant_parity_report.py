#!/usr/bin/env python3
"""Qdrant ↔ WooCommerce ↔ Sitemap parity report (QDR-DRIFT).

Read-only: compares product IDs and URLs across Qdrant, WooCommerce (published),
and the live sitemap to find orphans, missing entries, and drift.

Usage:
    python3 qdrant_parity_report.py              # summary report
    python3 qdrant_parity_report.py --verbose     # include per-product detail
    python3 qdrant_parity_report.py --output FILE # write JSON report
"""

import argparse, json, os, re, ssl, sys, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from xml.etree import ElementTree

QDRANT_URL = os.environ.get("QDRANT_URL", "http://127.0.0.1:6333").rstrip("/")
QDRANT_KEY = os.environ.get("QDRANT_API_KEY", "")
COLLECTION = os.environ.get("QDRANT_COLLECTION", "emart_products")
SITE_URL = "https://e-mart.com.bd"

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE

WC_KEY = os.environ.get("WC_CONSUMER_KEY", "")
WC_SECRET = os.environ.get("WC_CONSUMER_SECRET", "")

if not WC_KEY:
    env_path = Path(__file__).resolve().parents[4] / "apps" / "web" / ".env.local"
    if not env_path.exists():
        env_path = Path("/var/www/emart-platform/apps/web/.env.local")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("WC_CONSUMER_KEY="):
                WC_KEY = line.split("=", 1)[1].strip().strip('"')
            elif line.startswith("WC_CONSUMER_SECRET="):
                WC_SECRET = line.split("=", 1)[1].strip().strip('"')


def wc_get(endpoint, params=None):
    p = {"consumer_key": WC_KEY, "consumer_secret": WC_SECRET}
    if params:
        p.update(params)
    url = f"https://127.0.0.1/wp-json/wc/v3/{endpoint}?{urlencode(p)}"
    req = Request(url, headers={"Accept": "application/json", "Host": "e-mart.com.bd"})
    with urlopen(req, timeout=60, context=_ssl_ctx) as resp:
        total = resp.headers.get("X-WP-Total", "0")
        return json.loads(resp.read()), int(total)


def qdrant_scroll():
    """Scroll all product IDs from Qdrant."""
    ids = set()
    slugs = {}
    offset = None
    while True:
        body = {"limit": 100, "with_payload": ["slug", "product_id"]}
        if offset is not None:
            body["offset"] = offset
        url = f"{QDRANT_URL}/collections/{COLLECTION}/points/scroll"
        data = json.dumps(body).encode()
        req = Request(url, data=data, method="POST", headers={
            "api-key": QDRANT_KEY, "Content-Type": "application/json"})
        with urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())["result"]
        for pt in result["points"]:
            payload = pt.get("payload", {})
            pid = payload.get("product_id") or pt.get("id")
            if isinstance(pid, (int, float)):
                pid = int(pid)
            ids.add(pid)
            slug = payload.get("slug", "")
            if slug:
                slugs[pid] = slug
        offset = result.get("next_page_offset")
        if offset is None:
            break
    return ids, slugs


def wc_published_ids():
    """Fetch all published product IDs from WooCommerce."""
    ids = set()
    slugs = {}
    page = 1
    while True:
        products, total = wc_get("products", {"per_page": 100, "page": page, "status": "publish"})
        if not products:
            break
        for p in products:
            ids.add(p["id"])
            slugs[p["id"]] = p.get("slug", "")
        page += 1
        if len(ids) >= total:
            break
        time.sleep(0.3)
    return ids, slugs, total


def sitemap_slugs():
    """Parse product slugs from live sitemap."""
    slugs = set()
    url = f"{SITE_URL}/sitemap.xml"
    req = Request(url, headers={"User-Agent": "EmarkParity/1.0"})
    with urlopen(req, timeout=30) as resp:
        xml = resp.read()
    root = ElementTree.fromstring(xml)
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    for loc in root.findall(".//s:loc", ns):
        text = loc.text or ""
        m = re.match(rf"{re.escape(SITE_URL)}/shop/([^?#]+?)/?$", text)
        if m:
            slugs.add(m.group(1))
    return slugs


def main():
    parser = argparse.ArgumentParser(description="Qdrant parity report")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--output", type=str, help="Write JSON report to file")
    args = parser.parse_args()

    print("Fetching Qdrant points...")
    qdrant_ids, qdrant_slugs = qdrant_scroll()

    print("Fetching WooCommerce published products...")
    wc_ids, wc_slugs, wc_total = wc_published_ids()

    print("Fetching sitemap product URLs...")
    sitemap_product_slugs = sitemap_slugs()

    wc_slug_set = set(wc_slugs.values())

    in_qdrant_not_wc = qdrant_ids - wc_ids
    in_wc_not_qdrant = wc_ids - qdrant_ids
    in_both = wc_ids & qdrant_ids

    sitemap_not_wc = sitemap_product_slugs - wc_slug_set
    wc_not_sitemap = wc_slug_set - sitemap_product_slugs

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "counts": {
            "woocommerce_published": len(wc_ids),
            "wc_api_total_header": wc_total,
            "qdrant_points": len(qdrant_ids),
            "sitemap_product_urls": len(sitemap_product_slugs),
            "in_both_wc_qdrant": len(in_both),
        },
        "drift": {
            "in_qdrant_not_wc": sorted(in_qdrant_not_wc)[:50],
            "in_qdrant_not_wc_count": len(in_qdrant_not_wc),
            "in_wc_not_qdrant": sorted(in_wc_not_qdrant)[:50],
            "in_wc_not_qdrant_count": len(in_wc_not_qdrant),
            "in_sitemap_not_wc_slugs": sorted(sitemap_not_wc)[:20],
            "in_sitemap_not_wc_count": len(sitemap_not_wc),
            "in_wc_not_sitemap_count": len(wc_not_sitemap),
        },
        "parity_score": round(len(in_both) / max(len(wc_ids), 1) * 100, 1),
    }

    print(f"\n{'='*60}")
    print(f"QDRANT PARITY REPORT — {report['generated_at'][:10]}")
    print(f"{'='*60}")
    print(f"WooCommerce published : {len(wc_ids):>6}")
    print(f"Qdrant points         : {len(qdrant_ids):>6}")
    print(f"Sitemap product URLs  : {len(sitemap_product_slugs):>6}")
    print(f"In both WC+Qdrant     : {len(in_both):>6}")
    print(f"Parity score          : {report['parity_score']:>5.1f}%")
    print(f"{'='*60}")

    if in_qdrant_not_wc:
        print(f"\nOrphans in Qdrant (not in WC): {len(in_qdrant_not_wc)}")
        if args.verbose:
            for pid in sorted(in_qdrant_not_wc)[:20]:
                slug = qdrant_slugs.get(pid, "?")
                print(f"  {pid} — /shop/{slug}")

    if in_wc_not_qdrant:
        print(f"\nMissing from Qdrant (in WC): {len(in_wc_not_qdrant)}")
        if args.verbose:
            for pid in sorted(in_wc_not_qdrant)[:20]:
                slug = wc_slugs.get(pid, "?")
                print(f"  {pid} — /shop/{slug}")

    if sitemap_not_wc:
        print(f"\nSitemap slugs not in WC: {len(sitemap_not_wc)}")
        if args.verbose:
            for s in sorted(sitemap_not_wc)[:10]:
                print(f"  /shop/{s}")

    if wc_not_sitemap:
        print(f"\nWC slugs not in sitemap: {len(wc_not_sitemap)}")

    if not in_qdrant_not_wc and not in_wc_not_qdrant:
        print("\nPerfect parity — WC and Qdrant are fully aligned.")

    if args.output:
        Path(args.output).write_text(json.dumps(report, indent=2, ensure_ascii=False))
        print(f"\nJSON report written to {args.output}")


if __name__ == "__main__":
    main()
