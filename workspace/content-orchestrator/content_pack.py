#!/usr/bin/env python3
"""Canonical production pack for Emart static social + reel jobs.

This module is intentionally deterministic and free by default. It gives the
Content Orchestrator, daily reel producer, and Hermes one shared contract for
product source, image source, script, frames, QA, approval, and cost tier.
"""
from __future__ import annotations

import html
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
VIDEO_ENGINE = ROOT / "video-engine"
sys.path.insert(0, str(VIDEO_ENGINE / "lib"))

from quality_gates import classify_product, validate_job_spec, validate_script_payload  # noqa: E402

SCHEMA_VERSION = "content_pack/v1"
DEFAULT_DESIGN_TEMPLATE = "brand-fresh-product-base-v6-bilingual-price"


PRODUCT_TEMPLATES = {
    "sunscreen": {
        "badge": "Daily SPF",
        "bangla": "হালকা ফিনিশ · SPF50+ PA++++ · দৈনিক ব্যবহার",
        "title": "৫টি দ্রুত কারণ",
        "benefits": ["হালকা ফিল", "দৈনিক sun care", "রুটিনে সহজ"],
        "bullets": [
            "হালকা টেক্সচার, চিটচিটে নয়",
            "SPF50+ PA++++ দৈনিক সান কেয়ার",
            "স্কিনকেয়ারের মতো আরামদায়ক ফিনিশ",
            "সকালের রুটিনে সহজে ফিট করে",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
        "voice": "সকালের routine-এ lightweight sunscreen চাইলে {name} দেখতে পারেন। SPF support, comfortable finish, আর authentic product Emart থেকে cash on delivery-তে পাওয়া যায়।",
    },
    "cleanser": {
        "badge": "Gentle Cleanse",
        "bangla": "দৈনিক ক্লিনজ · পরিষ্কার ফিল · স্কিন-ফ্রেন্ডলি",
        "title": "৫টি ক্লিনজিং কারণ",
        "benefits": ["daily cleanse", "fresh feel", "রুটিনে সহজ"],
        "bullets": [
            "দিনের ধুলো-ময়লা পরিষ্কারে সহায়ক",
            "দৈনিক রুটিনে ব্যবহার সহজ",
            "স্কিনকে ফ্রেশ ফিল দেয়",
            "সকালে বা রাতে মানানসই",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
        "voice": "দিনের শেষে clean, fresh feel চাইলে {name} রুটিনে রাখতে পারেন। Gentle cleansing step হিসেবে সহজ, আর authentic product Emart থেকে cash on delivery-তে পাওয়া যায়।",
    },
    "retinol": {
        "badge": "Night Serum",
        "bangla": "রাতের রুটিন · নতুন হলে ২-৩ রাত · ধীরে শুরু",
        "title": "Retinol night checklist",
        "benefits": ["night routine", "slow start", "patch test"],
        "bullets": [
            "রাতে অল্প পরিমাণ ব্যবহার করুন",
            "নতুন হলে সপ্তাহে ২-৩ রাত",
            "আগে প্যাচ টেস্ট করে নিন",
            "চোখের চারপাশ এড়িয়ে লাগান",
            "দিনে sunscreen ব্যবহার করুন",
        ],
        "voice": "{name} night routine-এর জন্য। নতুন হলে ধীরে শুরু করুন, patch test করুন, আর দিনে sunscreen রাখুন। Authentic product Emart থেকে cash on delivery-তে পাওয়া যায়।",
    },
    "serum": {
        "badge": "Serum Pick",
        "bangla": "টার্গেটেড কেয়ার · হালকা লেয়ার · রুটিনে সহজ",
        "title": "৫টি serum reason",
        "benefits": ["targeted care", "light layer", "routine friendly"],
        "bullets": [
            "রুটিনে টার্গেটেড কেয়ার যোগ করে",
            "হালকা লেয়ার হিসেবে ব্যবহার সহজ",
            "ত্বককে আরামদায়ক ফিল দেয়",
            "ময়েশ্চারাইজারের আগে মানানসই",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
        "voice": "Targeted skincare step খুঁজলে {name} রুটিনে যোগ করতে পারেন। Lightweight serum layer হিসেবে সহজ, আর authentic product Emart থেকে cash on delivery-তে পাওয়া যায়।",
    },
    "toner": {
        "badge": "Toner Step",
        "bangla": "ফ্রেশ ফিল · রুটিন prep · দৈনিক ব্যবহার",
        "title": "৫টি toner reason",
        "benefits": ["fresh prep", "daily step", "light feel"],
        "bullets": [
            "ক্লিনজিংয়ের পর স্কিন prep করে",
            "হালকা ও ফ্রেশ ফিল দেয়",
            "পরের skincare step সহজ করে",
            "দৈনিক রুটিনে দ্রুত ব্যবহার",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
        "voice": "Cleanser-এর পর fresh prep step চাইলে {name} ব্যবহার করা যায়। Light feel, daily routine friendly, আর authentic product Emart থেকে cash on delivery-তে পাওয়া যায়।",
    },
    "moisturizer": {
        "badge": "Moisture Care",
        "bangla": "আর্দ্রতা সাপোর্ট · নরম ফিনিশ · দৈনিক ব্যবহার",
        "title": "৫টি moisture reason",
        "benefits": ["soft feel", "daily moisture", "comfort finish"],
        "bullets": [
            "ত্বককে নরম ও আরামদায়ক ফিল দেয়",
            "দৈনিক ময়েশ্চার রুটিনে সহজ",
            "চিটচিটে ভাব ছাড়া কমফোর্ট ফিনিশ",
            "সকাল বা রাতে ব্যবহারযোগ্য",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
        "voice": "Daily moisture support চাইলে {name} একটি সহজ routine pick। Skin-কে soft, comfortable feel দিতে সাহায্য করে, আর authentic product Emart থেকে cash on delivery-তে পাওয়া যায়।",
    },
    "makeup": {
        "badge": "Beauty Pick",
        "bangla": "ফিনিশ সুন্দর · সহজ ব্যবহার · daily glam",
        "title": "৫টি beauty reason",
        "benefits": ["easy glam", "neat finish", "daily beauty"],
        "bullets": [
            "দৈনিক makeup look-এ সহজ",
            "ফিনিশকে neat দেখাতে সহায়ক",
            "ব্যাগে রাখার মতো practical pick",
            "নিজের shade/need অনুযায়ী ব্যবহার",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
        "voice": "Daily beauty routine-এ practical pick চাইলে {name} দেখতে পারেন। নিজের shade বা need অনুযায়ী ব্যবহার করুন, আর authentic product Emart থেকে cash on delivery-তে পাওয়া যায়।",
    },
    "skincare": {
        "badge": "Daily Pick",
        "bangla": "দৈনিক রুটিন · স্কিন-ফ্রেন্ডলি · সহজ ব্যবহার",
        "title": "৫টি দ্রুত কারণ",
        "benefits": ["daily routine", "skin friendly", "easy pick"],
        "bullets": [
            "দৈনিক skincare রুটিনে সহজ",
            "ত্বককে আরামদায়ক ফিল দেয়",
            "প্রোডাক্ট টাইপ অনুযায়ী ব্যবহার করুন",
            "আগে প্যাচ টেস্ট করে নিন",
            "অরিজিনাল পণ্য, Emart থেকে",
        ],
        "voice": "Daily skincare routine-এ সহজ authentic pick চাইলে {name} দেখতে পারেন। Product type অনুযায়ী ব্যবহার করুন, patch test করুন, আর Emart থেকে cash on delivery-তে অর্ডার করুন।",
    },
}


def slugify(value: str, limit: int = 44) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", str(value or "").lower()).strip("-")
    return slug[:limit].strip("-") or "product"


def first_image(product: dict) -> str:
    if product.get("image"):
        return str(product.get("image") or "")
    if product.get("product_image"):
        return str(product.get("product_image") or "")
    images = product.get("images") or []
    if images and isinstance(images[0], dict):
        return str(images[0].get("src") or "")
    if images and isinstance(images[0], str):
        return images[0]
    return ""


def first_brand(product: dict) -> str:
    if product.get("brand"):
        return str(product.get("brand") or "")
    brands = product.get("brands") or []
    if brands and isinstance(brands[0], dict):
        return str(brands[0].get("name") or "")
    attrs = product.get("attributes") or []
    for attr in attrs:
        if str(attr.get("name", "")).lower() in {"brand", "pa_brand"} and attr.get("options"):
            return str(attr["options"][0])
    name = str(product.get("name") or "")
    return name.split()[0] if name else ""


def first_category(product: dict) -> tuple[str, str]:
    category = str(product.get("category") or "")
    slug = str(product.get("category_slug") or "")
    categories = product.get("categories") or []
    if categories and isinstance(categories[0], dict):
        category = category or str(categories[0].get("name") or "")
        slug = slug or str(categories[0].get("slug") or "")
    return html.unescape(category or "Skincare"), slug or "skincare"


def normalize_product(product: dict, *, source: str = "") -> dict:
    category, category_slug = first_category(product)
    name = html.unescape(str(product.get("name") or product.get("product") or product.get("title") or "Emart Skincare"))
    image = first_image(product)
    price = str(product.get("price") or product.get("sale_price") or "")
    original = str(product.get("original_price") or product.get("regular_price") or price)
    return {
        "product_id": product.get("product_id") or product.get("id"),
        "name": name,
        "slug": product.get("slug") or slugify(name, 80),
        "price": price,
        "regular_price": original,
        "sale_price": str(product.get("sale_price") or ""),
        "brand": html.unescape(first_brand(product)),
        "category": category,
        "category_slug": category_slug,
        "image": image,
        "product_class": classify_product(name, category, category_slug),
        "source": source or product.get("source") or product.get("candidate_source") or "unknown",
    }


def template_for(product: dict) -> dict:
    norm = normalize_product(product)
    cls = norm["product_class"]
    return {**PRODUCT_TEMPLATES.get(cls, PRODUCT_TEMPLATES["skincare"]), "class": cls}


def image_source(image: str, product_source: str = "") -> str:
    if not image:
        return "missing"
    scheme = urlparse(str(image)).scheme
    if scheme in {"http", "https"}:
        host = urlparse(str(image)).netloc.lower()
        return "woo_or_site_url" if "e-mart.com.bd" in host else "web_verified_required"
    return "local_cutout" if Path(str(image)).exists() else "local_reference_missing"


def build_script(product: dict) -> dict:
    norm = normalize_product(product)
    tpl = template_for(norm)
    name = norm["name"]
    caption = (
        f"{name} এখন Emart Skincare Bangladesh-এ available. "
        f"Original product, BDT {norm['price'] or 'current price'}, cash on delivery across Bangladesh."
    )
    script = {
        "hook": tpl["badge"],
        "benefits": tpl["benefits"][:3],
        "cta": "Shop at Emart",
        "caption": caption,
        "hashtags": ["#EmartSkincare", "#SkincareBD", "#KBeautyBangladesh"],
        "voiceover": tpl["voice"].format(name=name),
        "_provider": "content_pack_template",
        "_quality": {"schema": SCHEMA_VERSION, "product_class": tpl["class"]},
    }
    quality = validate_script_payload(script, product=name, category=norm["category"])
    script["_quality"].update(quality)
    return script


def build_content_pack(
    product: dict,
    *,
    pack_id: str,
    theme: str = "",
    formats: list[str] | None = None,
    platforms: list[str] | None = None,
    metric: str = "",
    guard: str | None = None,
    product_source: str = "",
    cost_tier: str = "free",
    approval_state: str = "draft",
    approval_gate: str = "owner_review_required",
) -> dict:
    norm = normalize_product(product, source=product_source)
    formats = formats or ["post_1x1", "post_4x5", "hero_vertical", "scene_value", "scene_brand_end"]
    platforms = platforms or ["facebook", "instagram"]
    visual_frames = ["product_hero", "value_card", "brand_card"]
    reel_like = any(f in formats for f in ("hero_vertical", "scene_value", "scene_brand_end"))
    if "model_holding_real_product" in formats or (reel_like and norm["image"]):
        visual_frames.insert(0, "model_holding_real_product")
    script = build_script(norm)
    return {
        "schema_version": SCHEMA_VERSION,
        "pack_id": pack_id,
        "theme": theme,
        "product": norm,
        "product_source": product_source or norm["source"],
        "image_source": image_source(norm["image"], product_source),
        "script": script,
        "visuals": {
            "formats": formats,
            "frames": visual_frames,
            "platforms": platforms,
            "safe_zone": "split_by_platform",
            "design_template": DEFAULT_DESIGN_TEMPLATE,
        },
        "qa": {
            "content_gate": True,
            "image_identity_gate": True,
            "voice_required": True,
            "master_qa": True,
            "owner_approval": "required",
        },
        "cost": {
            "tier": cost_tier,
            "default_cost_usd": 0.0,
            "escalate_only_if": "qa_fail_or_owner_approved",
        },
        "approval": {
            "state": approval_state,
            "gate": approval_gate,
        },
        "metric": metric,
        "guard": guard,
    }


def build_video_job(
    product: dict,
    *,
    job_id: str,
    theme: str = "",
    platforms: list[str] | None = None,
    formats: list[str] | None = None,
    metric: str = "",
    guard: str | None = None,
    product_source: str = "",
    holding_first: bool = True,
    approval_gate: str = "campaign",
) -> dict:
    pack = build_content_pack(
        product,
        pack_id=job_id,
        theme=theme,
        formats=formats,
        platforms=platforms,
        metric=metric,
        guard=guard,
        product_source=product_source,
        approval_gate=approval_gate,
    )
    p = pack["product"]
    tpl = template_for(p)
    brand = p["brand"] or p["name"].split()[0]
    has_image = bool(p["image"])
    job = {
        "id": job_id,
        "schema_version": SCHEMA_VERSION,
        "tier_target": pack["cost"]["tier"],
        "platforms": pack["visuals"]["platforms"],
        "product": p["name"],
        "product_id": p["product_id"],
        "price": p["price"],
        "original_price": p["regular_price"],
        "brand": p["brand"],
        "category": p["category"],
        "category_slug": p["category_slug"],
        "language": "bn",
        "seconds": 4.8,
        "product_card": True,
        "product_image": p["image"],
        "product_image_source": pack["image_source"],
        "product_class": tpl["class"],
        "product_card_badge": tpl["badge"],
        "product_card_bangla": tpl["bangla"],
        "caption_benefit_limit": 1,
        "holding_images": [],
        "holding_request": has_image,
        "holding_generation_mode": "real_product_composite" if has_image else "",
        "holding_first": bool(holding_first and has_image),
        "holding_label": "Original product",
        "holding_clean_asset": True,
        "model_fallback": False if has_image else True,
        "no_hallucination_product_layer": has_image,
        "script": pack["script"],
        "generate_script": False,
        "voice_required": True,
        "qa_block_on_vision": True,
        "list_cards": [{
            "kicker": f"কেন {brand}?",
            "title": tpl["title"],
            "style": "numbered",
            "bullets": tpl["bullets"],
            "footer": "ক্যাশ অন ডেলিভারি · সারা বাংলাদেশে",
        }],
        "brand_card": True,
        "brand_card_bangla": f"অরিজিনাল {brand} এখন Emart-এ",
        "voiceover": True,
        "voice_gender": "female",
        "qa_provider": "master",
        "approval": pack["approval"],
        "_content_pack": pack,
        "_orchestrator": {
            "theme": theme,
            "gate": approval_gate,
            "metric": metric,
            "guard": guard,
            "candidate_source": product_source or p["source"],
        },
        "status": "pending",
    }
    report = validate_job_spec(job, job["script"])
    job["_content_quality"] = report
    return job


def build_social_campaign_job(
    product: dict,
    *,
    campaign_id: str,
    name: str,
    date_value: str | None = None,
    theme: str = "",
    platforms: list[str] | None = None,
    formats: list[str] | None = None,
    metric: str = "",
    guard: str | None = None,
    product_source: str = "",
    make_reel: bool = False,
    approval_gate: str = "campaign",
) -> dict:
    pack = build_content_pack(
        product,
        pack_id=campaign_id,
        theme=theme,
        formats=formats or ["post_1x1", "post_4x5"],
        platforms=platforms or ["facebook", "instagram"],
        metric=metric,
        guard=guard,
        product_source=product_source,
        approval_gate=approval_gate,
    )
    p = pack["product"]
    return {
        "id": campaign_id,
        "schema_version": SCHEMA_VERSION,
        "name": name,
        "date": date_value or date.today().isoformat(),
        "approval_status": "draft",
        "design_template": DEFAULT_DESIGN_TEMPLATE,
        "platforms": pack["visuals"]["platforms"],
        "items": [{
            "product_id": p["product_id"],
            "name": p["name"],
            "theme": theme,
            "formats": [f for f in pack["visuals"]["formats"] if f.startswith("post_")],
            "make_reel": make_reel,
            "product_image": p["image"],
            "product_image_source": pack["image_source"],
            "script_brief": pack["script"],
        }],
        "_content_pack": pack,
        "_orchestrator": {"theme": theme, "gate": approval_gate, "metric": metric,
                          "guard": guard, "candidate_source": product_source or p["source"]},
    }
