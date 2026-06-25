#!/usr/bin/env python3
"""
Daily reel producer — autonomous product picker + spec writer.

Picks top products (by stock, newness, or GSC impressions), writes a reel spec per the
established standards (5-frame, brand cards, Bangla-phonetic voiceover, canonical model,
platform-split), and drops it into the queue. The orchestrator cron builds it, the bot
delivers it for owner approval. Nothing posts without a human tap.

Resource-aware: checks available RAM before enqueuing. Skips if the box is under pressure
(emartweb/emart-embed must never be starved).

Cron: run once daily at a quiet hour (e.g. 5 AM).
    0 5 * * * cd /root/emart-platform/workspace/video-engine && python3 daily_producer.py >> /tmp/emart-daily-producer.log 2>&1
"""
from __future__ import annotations
import json, subprocess, sys, urllib.request, re
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parent
QUEUE = ROOT / "jobs" / "queue"
ENQUEUE = ROOT / "enqueue.py"
CANONICAL_MODEL = ROOT / "personas" / "emart-model" / "clean-portrait.png"
HOLDING_DIR = ROOT / "codex-assets" / "holding"
API = "https://e-mart.com.bd/api/products"
MAX_REELS_PER_DAY = 2
MIN_FREE_MB = 1500


def check_ram() -> bool:
    try:
        with open("/proc/meminfo") as f:
            for line in f:
                if line.startswith("MemAvailable:"):
                    mb = int(line.split()[1]) // 1024
                    if mb < MIN_FREE_MB:
                        print(f"[producer] skipping — only {mb}MB free (need {MIN_FREE_MB}MB)")
                        return False
                    return True
    except Exception:
        pass
    return True


def already_queued_today() -> int:
    today = date.today().isoformat()
    count = 0
    for d in (QUEUE, ROOT / "jobs" / "building", ROOT / "jobs" / "review"):
        if d.exists():
            for f in d.glob("*.json"):
                try:
                    j = json.loads(f.read_text())
                    if today in j.get("id", ""):
                        count += 1
                except Exception:
                    pass
    return count


def fetch_top_products(n: int = 6) -> list[dict]:
    try:
        url = f"{API}?per_page={n * 2}"
        req = urllib.request.Request(url, headers={"User-Agent": "EmartVideoEngine/1.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read())
        products = data.get("products", [])
        # sort by stock sold (popularity proxy) descending, filter in-stock
        products = [p for p in products if p.get("stock_remaining", 0) > 0]
        products.sort(key=lambda p: p.get("stock_sold", 0), reverse=True)
        return products[:n]
    except Exception as e:
        print(f"[producer] API error: {e}")
        return []


def has_holding_image(product_name: str) -> str | None:
    slug = re.sub(r"[^a-z0-9]+", "-", product_name.lower()).strip("-")[:48]
    for f in HOLDING_DIR.glob("*__*.png"):
        if slug[:20] in f.stem:
            return str(f)
    return None


def bangla_phonetic(name: str) -> str:
    """Basic English product name → Bangla phonetic (covers common brands)."""
    MAP = {
        "cosrx": "কসআরএক্স", "snail": "স্নেইল", "mucin": "মিউসিন",
        "essence": "এসেন্স", "cream": "ক্রিম", "serum": "সিরাম",
        "cleanser": "ক্লিনজার", "toner": "টোনার", "sunscreen": "সানস্ক্রিন",
        "moisturizer": "ময়েশ্চারাইজার", "advanced": "অ্যাডভান্সড",
        "power": "পাওয়ার", "relief": "রিলিফ", "dr.": "ডক্টর",
        "althea": "আলথিয়া", "beauty": "বিউটি", "joseon": "জোসন",
        "niacinamide": "নায়াসিনামাইড", "hyaluronic": "হায়ালুরনিক",
        "vitamin": "ভিটামিন", "retinol": "রেটিনল", "cica": "সিকা",
        "panthenol": "প্যানথেনল", "emart": "ইমার্ট",
    }
    words = name.lower().split()
    return " ".join(MAP.get(w.strip("()"), w) for w in words)


def build_spec(product: dict) -> dict:
    pid = product["id"]
    name = product.get("name", "")
    price = str(product.get("price", product.get("sale_price", "")))
    original = str(product.get("original_price", ""))
    brand = product.get("brand", "")
    img = product.get("image", "")
    today = date.today().isoformat()
    jid = f"{today}-{re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')[:40]}"

    holding = has_holding_image(name)
    vo_name = bangla_phonetic(name)

    spec = {
        "id": jid,
        "platforms": ["facebook", "instagram"],
        "product": name,
        "product_id": pid,
        "price": price,
        "original_price": original,
        "language": "bn",
        "seconds": 4,
        "holding_images": [str(CANONICAL_MODEL)] if CANONICAL_MODEL.exists() else [],
        "holding_request": True,
        "generate_script": True,
        "list_cards": [{
            "kicker": f"কেন {brand or name.split()[0]}?",
            "title": "৬টি কারণ",
            "style": "numbered",
            "bullets": [
                f"{brand or name.split()[0]} — গভীর আর্দ্রতা",
                "ত্বক হয় নরম, কোমল ও উজ্জ্বল",
                "সব স্কিন টাইপে ব্যবহারযোগ্য",
                "হালকা ফর্মুলা — চিটচিটে নয়",
                "দাগ ও ব্রণের দাগ হালকা করে",
                "সকাল ও রাতে — দুইবেলা ব্যবহার",
            ],
            "footer": "e-mart.com.bd · ক্যাশ অন ডেলিভারি",
        }],
        "brand_card": True,
        "brand_card_bangla": f"অরিজিনাল {brand or name.split()[0]} এখন Emart-এ",
        "voiceover": True,
        "voice_gender": "female",
        "qa_provider": "local",
    }
    return spec


def main():
    if not check_ram():
        return

    existing = already_queued_today()
    if existing >= MAX_REELS_PER_DAY:
        print(f"[producer] already {existing} reels today (cap {MAX_REELS_PER_DAY}), skipping")
        return

    slots = MAX_REELS_PER_DAY - existing
    products = fetch_top_products(slots * 3)
    if not products:
        print("[producer] no products fetched")
        return

    built = 0
    for p in products:
        if built >= slots:
            break
        spec = build_spec(p)
        spec_path = ROOT / "jobs" / f"_auto_{spec['id']}.json"
        spec_path.parent.mkdir(parents=True, exist_ok=True)
        spec_path.write_text(json.dumps(spec, ensure_ascii=False, indent=2))
        r = subprocess.run([sys.executable, str(ENQUEUE), str(spec_path), "--priority", "30"],
                           capture_output=True, text=True, timeout=30)
        print(r.stdout.strip())
        spec_path.unlink(missing_ok=True)
        built += 1

    print(f"[producer] enqueued {built} reel(s) for {date.today()}")


if __name__ == "__main__":
    main()
