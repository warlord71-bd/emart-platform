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
    0 5 * * * cd /root/emart-platform/workspace/content-orchestrator/video-engine && python3 daily_producer.py >> /tmp/emart-daily-producer.log 2>&1
"""
from __future__ import annotations
import json, subprocess, sys, urllib.request, re
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "lib"))
from quality_gates import classify_product, validate_job_spec  # noqa: E402

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


PRODUCT_TEMPLATES = {
    "sunscreen": {
        "badge": "Daily SPF",
        "bangla": "হালকা ফিনিশ · SPF50+ PA++++ · দৈনিক ব্যবহার",
        "title": "৫টি দ্রুত কারণ",
        "bullets": [
            "হালকা টেক্সচার, চিটচিটে নয়",
            "SPF50+ PA++++ দৈনিক সান কেয়ার",
            "স্কিনকেয়ারের মতো আরামদায়ক ফিনিশ",
            "সকালের রুটিনে সহজে ফিট করে",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
    },
    "cleanser": {
        "badge": "Gentle Cleanse",
        "bangla": "দৈনিক ক্লিনজ · পরিষ্কার ফিল · স্কিন-ফ্রেন্ডলি",
        "title": "৫টি ক্লিনজিং কারণ",
        "bullets": [
            "দিনের ধুলো-ময়লা পরিষ্কারে সহায়ক",
            "দৈনিক রুটিনে ব্যবহার সহজ",
            "স্কিনকে ফ্রেশ ফিল দেয়",
            "সকালে বা রাতে মানানসই",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
    },
    "retinol": {
        "badge": "Night Serum",
        "bangla": "রাতের রুটিন · নতুন হলে ২-৩ রাত · ধীরে শুরু",
        "title": "Retinol night checklist",
        "bullets": [
            "রাতে অল্প পরিমাণ ব্যবহার করুন",
            "নতুন হলে সপ্তাহে ২-৩ রাত",
            "আগে প্যাচ টেস্ট করে নিন",
            "চোখের চারপাশ এড়িয়ে লাগান",
            "দিনে sunscreen ব্যবহার করুন",
        ],
    },
    "serum": {
        "badge": "Serum Pick",
        "bangla": "টার্গেটেড কেয়ার · হালকা লেয়ার · রুটিনে সহজ",
        "title": "৫টি serum reason",
        "bullets": [
            "রুটিনে টার্গেটেড কেয়ার যোগ করে",
            "হালকা লেয়ার হিসেবে ব্যবহার সহজ",
            "ত্বককে আরামদায়ক ফিল দেয়",
            "ময়েশ্চারাইজারের আগে মানানসই",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
    },
    "toner": {
        "badge": "Toner Step",
        "bangla": "ফ্রেশ ফিল · রুটিন prep · দৈনিক ব্যবহার",
        "title": "৫টি toner reason",
        "bullets": [
            "ক্লিনজিংয়ের পর স্কিন prep করে",
            "হালকা ও ফ্রেশ ফিল দেয়",
            "পরের skincare step সহজ করে",
            "দৈনিক রুটিনে দ্রুত ব্যবহার",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
    },
    "moisturizer": {
        "badge": "Moisture Care",
        "bangla": "আর্দ্রতা সাপোর্ট · নরম ফিনিশ · দৈনিক ব্যবহার",
        "title": "৫টি moisture reason",
        "bullets": [
            "ত্বককে নরম ও আরামদায়ক ফিল দেয়",
            "দৈনিক ময়েশ্চার রুটিনে সহজ",
            "চিটচিটে ভাব ছাড়া কমফোর্ট ফিনিশ",
            "সকাল বা রাতে ব্যবহারযোগ্য",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
    },
    "makeup": {
        "badge": "Beauty Pick",
        "bangla": "ফিনিশ সুন্দর · সহজ ব্যবহার · daily glam",
        "title": "৫টি beauty reason",
        "bullets": [
            "দৈনিক makeup look-এ সহজ",
            "ফিনিশকে neat দেখাতে সহায়ক",
            "ব্যাগে রাখার মতো practical pick",
            "নিজের shade/need অনুযায়ী ব্যবহার",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
    },
    "skincare": {
        "badge": "Daily Pick",
        "bangla": "দৈনিক রুটিন · স্কিন-ফ্রেন্ডলি · সহজ ব্যবহার",
        "title": "৫টি দ্রুত কারণ",
        "bullets": [
            "দৈনিক skincare রুটিনে সহজ",
            "ত্বককে আরামদায়ক ফিল দেয়",
            "প্রোডাক্ট টাইপ অনুযায়ী ব্যবহার করুন",
            "আগে প্যাচ টেস্ট করে নিন",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
    },
}


def template_for(product: dict) -> dict:
    cls = classify_product(
        product.get("name", ""),
        product.get("category", ""),
        product.get("category_slug", ""),
    )
    return PRODUCT_TEMPLATES.get(cls, PRODUCT_TEMPLATES["skincare"]) | {"class": cls}


def build_spec(product: dict) -> dict:
    pid = product["id"]
    name = product.get("name", "")
    price = str(product.get("price", product.get("sale_price", "")))
    original = str(product.get("original_price", ""))
    brand = product.get("brand", "")
    img = product.get("image", "")
    tpl = template_for(product)
    today = date.today().isoformat()
    jid = f"{today}-{re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')[:40]}"

    spec = {
        "id": jid,
        "platforms": ["facebook", "instagram"],
        "product": name,
        "product_id": pid,
        "price": price,
        "original_price": original,
        "language": "bn",
        "seconds": 4.8,
        "product_card": True,
        "product_image": img,
        "product_class": tpl["class"],
        "product_card_badge": tpl["badge"],
        "product_card_bangla": tpl["bangla"],
        "caption_benefit_limit": 1,
        "holding_images": [],
        "holding_request": bool(img),
        "holding_generation_mode": "real_product_composite" if img else "",
        "holding_first": bool(img),
        "holding_label": "Original product",
        "holding_clean_asset": True,
        "model_fallback": False if img else True,
        "no_hallucination_product_layer": bool(img),
        "generate_script": True,
        "voice_required": True,
        "qa_block_on_vision": True,
        "list_cards": [{
            "kicker": f"কেন {brand or name.split()[0]}?",
            "title": tpl["title"],
            "style": "numbered",
            "bullets": tpl["bullets"],
            "footer": "ক্যাশ অন ডেলিভারি · সারা বাংলাদেশে",
        }],
        "brand_card": True,
        "brand_card_bangla": f"অরিজিনাল {brand or name.split()[0]} এখন Emart-এ",
        "voiceover": True,
        "voice_gender": "female",
        "qa_provider": "master",
    }
    report = validate_job_spec(spec)
    if report["status"] == "fail":
        raise ValueError(f"producer built invalid spec for {name}: {report['errors']}")
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
        try:
            spec = build_spec(p)
        except ValueError as e:
            print(f"[producer] skipped invalid spec: {e}")
            continue
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
