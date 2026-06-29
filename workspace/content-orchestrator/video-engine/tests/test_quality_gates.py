#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "lib"))

from quality_gates import classify_product, validate_job_spec, validate_script_payload  # noqa: E402


def test_cosrx_cream_rejects_spf_copy():
    job = {
        "product": "CosRx Advanced Snail 92 All In One Cream 100g",
        "product_card": True,
        "product_image": "https://e-mart.com.bd/wp-content/uploads/advanced-snail-92.png",
        "product_card_badge": "Daily SPF",
        "product_card_bangla": "হালকা ফিনিশ · SPF50+ PA++++ · দৈনিক ব্যবহার",
        "list_cards": [{"bullets": ["SPF50+ PA++++ দৈনিক সান কেয়ার"]}],
    }
    report = validate_job_spec(job)
    assert report["status"] == "fail"
    assert any("non_sunscreen_has_sunscreen_claim" in e for e in report["errors"])


def test_sunscreen_allows_spf_copy():
    job = {
        "product": "Beauty of Joseon Relief Sun Rice + Probiotics SPF50+ PA++++",
        "product_card": True,
        "product_image": "https://e-mart.com.bd/wp-content/uploads/365.jpg",
        "product_card_badge": "Daily SPF",
        "list_cards": [{"bullets": ["SPF50+ PA++++ দৈনিক সান কেয়ার"]}],
    }
    assert validate_job_spec(job)["status"] in ("pass", "warn")


def test_retinol_daytime_sunscreen_instruction_is_allowed():
    job = {
        "product": "CeraVe Skin Renewing Retinol Serum 30ml",
        "product_card": True,
        "product_image": "https://e-mart.com.bd/wp-content/uploads/cerave-retinol-serum.jpg",
        "product_card_badge": "Night Serum",
        "list_cards": [{"bullets": ["দিনে sunscreen ব্যবহার করুন"]}],
    }
    assert validate_job_spec(job)["status"] in ("pass", "warn")


def test_placeholder_script_rejected():
    script = {
        "hook": "<=5 words",
        "benefits": ["<=5 words", "<=5 words", "<=5 words"],
        "cta": "<=5 words",
        "caption": "2-3 sentence platform caption",
        "hashtags": ["#tag", "..."],
        "voiceover": "30-40 word spoken script",
    }
    report = validate_script_payload(script, product="Beauty of Joseon Sunscreen SPF50+", category="sunscreen")
    assert report["status"] == "fail"
    assert any("placeholder_text" in e for e in report["errors"])


def test_product_classification():
    assert classify_product("CosRx Advanced Snail 92 All In One Cream 100g") == "moisturizer"
    assert classify_product("Beauty of Joseon Relief Sun SPF50+") == "sunscreen"
    assert classify_product("CeraVe Skin Renewing Retinol Serum 30ml") == "retinol"

