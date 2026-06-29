#!/usr/bin/env python3
"""Sync published Emart products → Qdrant vector DB.

Fetches products from WooCommerce, generates 768-dim embeddings
via sentence-transformers (CPU), and upserts into Qdrant.

Modes:
    python3 qdrant_product_sync.py                # incremental (only changed products)
    python3 qdrant_product_sync.py --full          # full re-sync (all products)
    python3 qdrant_product_sync.py --dry-run       # count only
"""

import argparse, json, os, sys, time, uuid, math, ssl
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode

QDRANT_URL = os.environ.get("QDRANT_URL", "http://127.0.0.1:6333").rstrip("/")
QDRANT_KEY = os.environ.get("QDRANT_API_KEY", "")
COLLECTION = os.environ.get("QDRANT_COLLECTION", "emart_products")
EMBED_MODEL = "all-mpnet-base-v2"  # 768-dim, matches existing data
BATCH_SIZE = 50  # WooCommerce API page size
UPSERT_BATCH = 64
STATE_FILE = Path("/root/emart-platform/workspace/seo-review/.qdrant_sync_state.json")

WC_KEY = os.environ.get("WC_CONSUMER_KEY", "")
WC_SECRET = os.environ.get("WC_CONSUMER_SECRET", "")

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE


def wc_get(endpoint, params=None):
    p = {"consumer_key": WC_KEY, "consumer_secret": WC_SECRET}
    if params:
        p.update(params)
    url = f"https://127.0.0.1/wp-json/wc/v3/{endpoint}?{urlencode(p)}"
    req = Request(url, headers={"Accept": "application/json", "Host": "e-mart.com.bd"})
    with urlopen(req, timeout=60, context=_ssl_ctx) as resp:
        return json.loads(resp.read())


def qdrant_req(method, path, body=None):
    url = f"{QDRANT_URL}{path}"
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, method=method, headers={
        "api-key": QDRANT_KEY,
        "Content-Type": "application/json",
    })
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def qdrant_scroll_product_ids():
    """Return product IDs currently stored in Qdrant, using payload scroll."""
    product_ids = set()
    offset = None
    while True:
        body = {"limit": 256, "with_payload": ["product_id"], "with_vector": False}
        if offset is not None:
            body["offset"] = offset
        data = qdrant_req("POST", f"/collections/{COLLECTION}/points/scroll", body)
        result = data.get("result", {})
        for point in result.get("points", []):
            payload = point.get("payload") or {}
            pid = payload.get("product_id")
            if pid is not None:
                product_ids.add(int(pid))
        offset = result.get("next_page_offset")
        if not offset:
            break
    return product_ids


def qdrant_delete_product_ids(product_ids):
    if not product_ids:
        return
    qdrant_req("POST", f"/collections/{COLLECTION}/points/delete", {
        "filter": {
            "should": [
                {"key": "product_id", "match": {"value": int(pid)}}
                for pid in sorted(product_ids)
            ]
        }
    })


def fetch_all_products():
    products = []
    page = 1
    while True:
        batch = wc_get("products", {
            "per_page": BATCH_SIZE, "page": page,
            "status": "publish", "type": "simple",
        })
        if not batch:
            break
        products.extend(batch)
        print(f"  fetched page {page}: {len(batch)} products (total: {len(products)})")
        if len(batch) < BATCH_SIZE:
            break
        page += 1
    return products


def build_embed_text(p):
    name = p.get("name", "")
    brand = ""
    origin = ""
    concerns = []
    categories = [c["name"] for c in p.get("categories", [])]
    for attr in p.get("attributes", []):
        slug = attr.get("slug", "")
        opts = attr.get("options", [])
        if slug == "pa_brand" and opts:
            brand = opts[0]
        elif slug == "pa_origin" and opts:
            origin = opts[0]
        elif slug == "pa_concern":
            concerns = opts
    desc_raw = p.get("short_description", "") or p.get("description", "")
    import re
    desc = re.sub(r"<[^>]+>", " ", desc_raw)[:300].strip()
    parts = [name]
    if brand:
        parts.append(f"Brand: {brand}")
    if categories:
        parts.append(f"Category: {', '.join(categories)}")
    if origin:
        parts.append(f"Origin: {origin}")
    if concerns:
        parts.append(f"Concerns: {', '.join(concerns)}")
    if desc:
        parts.append(desc)
    return " | ".join(parts)


def product_payload(p):
    brand = ""
    origin = ""
    for attr in p.get("attributes", []):
        if attr.get("slug") == "pa_brand" and attr.get("options"):
            brand = attr["options"][0]
        elif attr.get("slug") == "pa_origin" and attr.get("options"):
            origin = attr["options"][0]
    cats = [c["name"] for c in p.get("categories", [])]
    return {
        "product_id": p["id"],
        "name": p.get("name", ""),
        "slug": p.get("slug", ""),
        "sku": p.get("sku", ""),
        "brand": brand,
        "origin": origin,
        "category": ", ".join(cats),
        "price_bdt": float(p.get("price", 0) or 0),
        "regular_price_bdt": float(p.get("regular_price", 0) or 0),
        "stock_status": p.get("stock_status", ""),
        "image_url": (p.get("images", [{}])[0].get("src", "") if p.get("images") else ""),
        "permalink": p.get("permalink", ""),
        "updated_at": p.get("date_modified", ""),
    }


def deterministic_uuid(product_id):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"emart-product-{product_id}"))


def load_sync_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}

def save_sync_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))

def fetch_modified_since(since_iso: str):
    """Fetch only products modified after a given ISO timestamp."""
    products = []
    page = 1
    while True:
        batch = wc_get("products", {
            "per_page": BATCH_SIZE, "page": page,
            "status": "publish", "type": "simple",
            "modified_after": since_iso,
            "orderby": "modified", "order": "asc",
        })
        if not batch:
            break
        products.extend(batch)
        print(f"  fetched page {page}: {len(batch)} changed (total: {len(products)})")
        if len(batch) < BATCH_SIZE:
            break
        page += 1
    return products


def sync_window_start(last_sync_iso: str) -> str:
    """Rewind the incremental window slightly so second-level watermarks do not miss edits."""
    try:
        parsed = datetime.fromisoformat(last_sync_iso.replace("Z", "+00:00"))
        return (parsed - timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M:%S")
    except Exception:
        return last_sync_iso

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--full", action="store_true", help="Full re-sync instead of incremental")
    args = parser.parse_args()

    if not QDRANT_KEY:
        sys.exit("QDRANT_API_KEY not set")
    if not WC_KEY or not WC_SECRET:
        sys.exit("WC_CONSUMER_KEY / WC_CONSUMER_SECRET not set")

    state = load_sync_state()
    last_sync = state.get("last_sync_iso")
    sync_started_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")

    if args.full or not last_sync:
        mode = "full"
        print(f"[1/4] Full sync — fetching ALL published products...")
        products = fetch_all_products()
    else:
        mode = "incremental"
        since = sync_window_start(last_sync)
        print(f"[1/4] Incremental sync — products modified since {since} (stored watermark {last_sync})...")
        products = fetch_modified_since(since)

    print(f"  → {len(products)} products to sync ({mode})")

    if args.dry_run:
        print(f"[dry-run] Would sync {len(products)} products to qdrant:{COLLECTION}")
        return

    if len(products) == 0:
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
        save_sync_state({**state, "last_sync_iso": now_iso, "last_sync_mode": mode, "last_sync_count": 0})
        print("  No changes since last sync. Done.")
        return

    print(f"[2/4] Loading embedding model ({EMBED_MODEL})...")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(EMBED_MODEL)

    print(f"[3/4] Generating embeddings...")
    texts = [build_embed_text(p) for p in products]
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)

    existing = qdrant_req("GET", f"/collections/{COLLECTION}")
    if existing.get("status") != "ok":
        print(f"  Creating collection {COLLECTION}...")
        qdrant_req("PUT", f"/collections/{COLLECTION}", {
            "vectors": {"size": 768, "distance": "Cosine"},
            "on_disk_payload": True,
        })

    print(f"[4/4] Upserting {len(products)} products to qdrant...")
    for i in range(0, len(products), UPSERT_BATCH):
        batch_products = products[i:i + UPSERT_BATCH]
        batch_embeddings = embeddings[i:i + UPSERT_BATCH]
        points = []
        for p, emb in zip(batch_products, batch_embeddings):
            points.append({
                "id": deterministic_uuid(p["id"]),
                "vector": emb.tolist(),
                "payload": product_payload(p),
            })
        qdrant_req("PUT", f"/collections/{COLLECTION}/points", {"points": points})
        done = min(i + UPSERT_BATCH, len(products))
        print(f"  upserted {done}/{len(products)}")

    deleted_count = 0
    if mode == "full":
        print("[4b/4] Removing unpublished/deleted products from qdrant...")
        published_ids = {int(p["id"]) for p in products}
        existing_ids = qdrant_scroll_product_ids()
        stale_ids = existing_ids - published_ids
        qdrant_delete_product_ids(stale_ids)
        deleted_count = len(stale_ids)
        print(f"  deleted {deleted_count} stale points")

    final = qdrant_req("GET", f"/collections/{COLLECTION}")
    count = final["result"]["points_count"]

    save_sync_state({
        "last_sync_iso": sync_started_iso,
        "last_sync_mode": mode,
        "last_sync_count": len(products),
        "last_deleted_count": deleted_count,
        "total_in_qdrant": count,
    })
    print(f"\n✓ Sync complete ({mode}): {len(products)} synced, {count} total in qdrant:{COLLECTION}")


if __name__ == "__main__":
    main()
