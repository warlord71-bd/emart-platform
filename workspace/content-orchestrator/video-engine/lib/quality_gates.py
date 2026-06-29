#!/usr/bin/env python3
"""Shared content-quality gates for Emart reel jobs.

These checks run before expensive render work and again inside master QA. They are
intentionally deterministic: if a job contains wrong SPF claims or prompt
placeholder text, it should fail the same way every time.
"""
from __future__ import annotations

import re
from urllib.parse import unquote, urlparse


PLACEHOLDER_PATTERNS = [
    r"<=\s*\d+\s*words?",
    r"\b\d+\s*-\s*\d+\s+word spoken script\b",
    r"\b\d+\s*-\s*\d+\s+sentence platform caption\b",
    r"\bplatform caption\b",
    r"\bspoken script\b",
    r"\bvalid minified json\b",
    r'"\s*#tag\s*"',
    r"\.\.\.",
]

SUNSCREEN_CLAIM_PATTERNS = [
    r"\bdaily\s+spf\b",
    r"\bspf\s*\d*",
    r"\bpa\+{2,}",
    r"\buv\b",
    r"\bsun\s*care\b",
    r"সান\s*কেয়ার",
    r"সান\s*কেয়ার",
    r"ইউভি",
]

RETINOL_CLAIM_PATTERNS = [
    r"\bretinol\b",
    r"রেটিনল",
]

MEDICAL_CLAIM_PATTERNS = [
    r"\bcures?\b",
    r"\btreats?\b",
    r"\bheals?\b",
    r"\bremoves?\s+(acne|melasma|scar|spots?)\b",
    r"ব্রণ\s+সার",
    r"দাগ\s+দূর",
]

PRODUCT_CLASS_KEYWORDS = {
    "sunscreen": [
        "sunscreen", "sun screen", "suncream", "sun cream", "sun stick",
        "relief sun", "spf", "pa++++", "uv",
    ],
    "cleanser": [
        "cleanser", "cleansing", "face wash", "foam", "gel wash", "micellar",
    ],
    "retinol": ["retinol", "retinal", "retinoid"],
    "toner": ["toner", "mist", "skin toner"],
    "serum": ["serum", "ampoule", "essence", "niacinamide", "vitamin c", "alpha arbutin"],
    "moisturizer": [
        "moisturizer", "moisturiser", "cream", "lotion", "gel cream", "all in one cream",
        "barrier", "balm",
    ],
    "makeup": ["cushion", "foundation", "concealer", "lip", "tint", "blush", "mascara", "powder"],
    "mask": ["mask", "pack", "sleeping pack"],
}

STOP_TOKENS = {
    "the", "and", "with", "for", "skin", "skincare", "cream", "serum", "toner",
    "cleanser", "sunscreen", "spf", "ml", "gm", "all", "one", "advanced",
}


def _haystack(*parts: object) -> str:
    return " ".join(str(p or "") for p in parts).lower()


def _matches(patterns: list[str], text: str) -> list[str]:
    return [p for p in patterns if re.search(p, text, flags=re.I)]


def classify_product(product: str = "", category: str = "", category_slug: str = "") -> str:
    text = _haystack(product, category, category_slug).replace("-", " ")
    for cls, terms in PRODUCT_CLASS_KEYWORDS.items():
        if any(term in text for term in terms):
            return cls
    return "skincare"


def product_tokens(product: str) -> set[str]:
    raw = re.findall(r"[a-z0-9]+", (product or "").lower())
    return {t for t in raw if len(t) >= 4 and not t.isdigit() and t not in STOP_TOKENS}


def collect_job_text(job: dict, script: dict | None = None) -> str:
    parts: list[str] = [
        job.get("product", ""),
        job.get("headline", ""),
        job.get("caption", ""),
        job.get("product_card_badge", ""),
        job.get("product_card_bangla", ""),
        job.get("brand_card_bangla", ""),
    ]
    for card in job.get("list_cards") or []:
        parts.extend([card.get("kicker", ""), card.get("title", ""), card.get("footer", "")])
        parts.extend(card.get("bullets") or [])
    if script:
        parts.extend([
            script.get("hook", ""),
            script.get("cta", ""),
            script.get("caption", ""),
            script.get("voiceover", ""),
        ])
        parts.extend(script.get("benefits") or [])
        parts.extend(script.get("hashtags") or [])
    return _haystack(*parts)


def validate_job_spec(job: dict, script: dict | None = None) -> dict:
    product = job.get("product") or job.get("headline") or ""
    product_class = classify_product(product, job.get("category", ""), job.get("category_slug", ""))
    text = collect_job_text(job, script)
    errors: list[str] = []
    warnings: list[str] = []

    sunscreen_hits = _matches(SUNSCREEN_CLAIM_PATTERNS, text)
    if sunscreen_hits and product_class != "sunscreen":
        errors.append(
            "non_sunscreen_has_sunscreen_claim:"
            + ",".join(sorted(set(sunscreen_hits)))
        )

    retinol_hits = _matches(RETINOL_CLAIM_PATTERNS, text)
    if retinol_hits and product_class not in ("retinol",):
        # Product names like "retinol serum" are fine; generic serum jobs should not inherit retinol claims.
        errors.append("non_retinol_has_retinol_claim:" + ",".join(sorted(set(retinol_hits))))

    medical_hits = _matches(MEDICAL_CLAIM_PATTERNS, text)
    if medical_hits:
        errors.append("unsafe_medical_claim:" + ",".join(sorted(set(medical_hits))))

    if job.get("product_card") and not (job.get("product_image") or job.get("product_image_url")):
        errors.append("product_card_missing_product_image")

    if job.get("holding_request") and job.get("holding_generation_mode") == "real_product_composite":
        if not (job.get("product_image") or job.get("product_image_url")):
            errors.append("real_product_holding_missing_product_image")
        if job.get("model_fallback") is not False:
            errors.append("real_product_holding_requires_model_fallback_false")
        if not job.get("no_hallucination_product_layer"):
            warnings.append("real_product_holding_missing_no_hallucination_flag")

    image = job.get("product_image") or job.get("product_image_url") or ""
    if image:
        image_name = unquote(urlparse(str(image)).path.split("/")[-1]).lower()
        tokens = product_tokens(product)
        if tokens and image_name and not any(t in image_name for t in tokens):
            warnings.append("product_image_filename_not_identity_proof")

    return {
        "status": "fail" if errors else ("warn" if warnings else "pass"),
        "product_class": product_class,
        "errors": errors,
        "warnings": warnings,
    }


def validate_script_payload(script: dict, product: str = "", category: str = "") -> dict:
    errors: list[str] = []
    warnings: list[str] = []
    required = ("hook", "benefits", "cta", "caption", "voiceover")
    missing = [k for k in required if not script.get(k)]
    if missing:
        errors.append("missing_script_keys:" + ",".join(missing))

    benefits = script.get("benefits")
    if not isinstance(benefits, list) or not benefits:
        errors.append("benefits_not_list")
    elif len([b for b in benefits if str(b).strip()]) < 2:
        errors.append("too_few_benefits")

    flat = _haystack(
        script.get("hook", ""),
        script.get("cta", ""),
        script.get("caption", ""),
        script.get("voiceover", ""),
        *(script.get("benefits") or []),
        *(script.get("hashtags") or []),
    )
    placeholder_hits = _matches(PLACEHOLDER_PATTERNS, flat)
    if placeholder_hits:
        errors.append("placeholder_text:" + ",".join(sorted(set(placeholder_hits))))

    if re.search(r"[\u4e00-\u9fff\u3040-\u30ff]", flat):
        errors.append("unexpected_cjk_characters")

    for field in ("hook", "cta"):
        words = re.findall(r"\S+", str(script.get(field, "")))
        if len(words) > 7:
            warnings.append(f"{field}_too_long:{len(words)}")

    voice_words = re.findall(r"\S+", str(script.get("voiceover", "")))
    if script.get("voiceover") and len(voice_words) < 10:
        errors.append(f"voiceover_too_short:{len(voice_words)}")

    tokens = product_tokens(product)
    grounding = _haystack(script.get("caption", ""), script.get("voiceover", ""), script.get("hook", ""))
    if tokens and not any(t in grounding for t in tokens):
        warnings.append("script_missing_product_token")

    job_like = {"product": product, "category": category}
    claim_report = validate_job_spec(job_like, script)
    errors.extend(claim_report.get("errors") or [])
    warnings.extend(claim_report.get("warnings") or [])

    return {
        "status": "fail" if errors else ("warn" if warnings else "pass"),
        "errors": list(dict.fromkeys(errors)),
        "warnings": list(dict.fromkeys(warnings)),
        "product_class": claim_report.get("product_class"),
    }


def assert_pass(report: dict, label: str = "quality gate") -> None:
    if report.get("status") == "fail":
        raise ValueError(f"{label} failed: {'; '.join(report.get('errors') or [])}")
