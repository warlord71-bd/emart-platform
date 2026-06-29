from __future__ import annotations

import json
import math
import re
import statistics
import subprocess
from pathlib import Path
from typing import Any

try:
    from PIL import Image, ImageFilter, ImageOps
except Exception:  # pragma: no cover - social engine can still run without Pillow.
    Image = None
    ImageFilter = None
    ImageOps = None


THEME_REGISTRY: dict[str, dict[str, Any]] = {
    "emart-social-card-v1": {
        "status": "legacy",
        "single_hero_required": True,
        "allowed_categories": ["skincare", "sunscreen", "haircare", "cleanser", "serum", "cream", "mask"],
        "allowed_containers": ["bottle", "tube", "jar", "dropper", "box", "sachet", "general"],
    },
    "aqua_bubble_hero": {
        "status": "approved_candidate",
        "single_hero_required": True,
        "allowed_categories": ["cleanser", "serum", "cream", "skincare"],
        "allowed_containers": ["bottle", "tube", "jar", "dropper", "general"],
    },
    "soft_grid_concern": {
        "status": "approved_candidate",
        "single_hero_required": True,
        "allowed_categories": ["serum", "cream", "skincare", "sunscreen"],
        "allowed_containers": ["tube", "jar", "dropper", "bottle", "general"],
    },
    "clinical_note_card": {
        "status": "approved_candidate",
        "single_hero_required": True,
        "allowed_categories": ["serum", "haircare", "skincare", "cream"],
        "allowed_containers": ["dropper", "bottle", "tube", "jar", "general"],
    },
    "search_concern_card": {
        "status": "approved_candidate",
        "single_hero_required": True,
        "allowed_categories": ["serum", "cream", "sunscreen", "skincare"],
        "allowed_containers": ["dropper", "tube", "bottle", "jar", "general"],
    },
    "summer_spf_sky": {
        "status": "approved_candidate",
        "single_hero_required": True,
        "allowed_categories": ["sunscreen"],
        "allowed_containers": ["tube", "bottle", "stick", "jar", "general"],
    },
    "brand-fresh-product-base-v6-bilingual-price": {
        "status": "approved_candidate",
        "single_hero_required": True,
        "allowed_categories": ["skincare", "sunscreen", "cleanser", "serum", "cream", "mask"],
        "allowed_containers": ["bottle", "tube", "jar", "dropper", "general"],
    },
}

THEME_ALIASES = {
    "aqua-bubble-hero": "aqua_bubble_hero",
    "soft-grid-concern": "soft_grid_concern",
    "clinical-note-card": "clinical_note_card",
    "search-concern-card": "search_concern_card",
    "summer-spf-sky": "summer_spf_sky",
}

BLOCKING_VISIBLE_TEXT = [
    (r"\bnykaa\b", "competitor_or_reference_brand_visible"),
    (r"\bskintastic\b", "reference_campaign_brand_visible"),
    (r"\blorem\b", "placeholder_text_visible"),
    (r"\bipsum\b", "placeholder_text_visible"),
    (r"\bundefined\b", "placeholder_text_visible"),
    (r"\bnull\b", "placeholder_text_visible"),
    (r"\b(cures?|guarantees?|permanent)\s+(acne|spots?|whitening|hair\s+loss)\b", "high_risk_unsafe_claim_visible"),
    (r"\bremove\s+acne\b", "high_risk_unsafe_claim_visible"),
]

WARNING_VISIBLE_TEXT = [
    (r"\b(cured?|guaranteed|whitening)\b", "possible_unsafe_claim_visible"),
]


def normalize_theme(value: str | None) -> str:
    if not value:
        return "emart-social-card-v1"
    safe = value.strip().lower().replace(" ", "_")
    return THEME_ALIASES.get(safe, safe)


def container_hint(title: str) -> str:
    text = title.lower()
    if any(word in text for word in ("dropper", "serum", "ampoule", "essence")):
        return "dropper"
    if any(word in text for word in ("tube", "cream", "cleanser", "sunscreen", "gel-cream", "gel cream")):
        return "tube"
    if any(word in text for word in ("jar", "balm", "mask", "water gel")):
        return "jar"
    if any(word in text for word in ("bottle", "toner", "wash", "shampoo", "lotion")):
        return "bottle"
    if any(word in text for word in ("stick", "bar")):
        return "stick"
    return "general"


def category_hint(item: dict[str, Any]) -> str:
    text = " ".join(str(item.get(key, "")) for key in ("title", "slug", "angle", "creative_type")).lower()
    if any(word in text for word in ("spf", "sun", "sunscreen")):
        return "sunscreen"
    if any(word in text for word in ("hair", "shampoo", "conditioner", "scalp")):
        return "haircare"
    if any(word in text for word in ("cleanser", "cleansing", "face wash", "wash")):
        return "cleanser"
    if any(word in text for word in ("serum", "ampoule", "essence", "retinal", "niacinamide")):
        return "serum"
    if any(word in text for word in ("cream", "moistur", "balm", "gel")):
        return "cream"
    if "mask" in text:
        return "mask"
    return "skincare"


def average_hash(path: Path) -> str | None:
    if Image is None or ImageOps is None or not path.exists():
        return None
    with Image.open(path) as img:
        img = ImageOps.grayscale(img).resize((8, 8), Image.Resampling.LANCZOS)
        pixels = list(img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata())
    avg = sum(pixels) / len(pixels)
    bits = "".join("1" if pixel >= avg else "0" for pixel in pixels)
    return f"{int(bits, 2):016x}"


def hamming_hex(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()


def load_rejected_design_hashes(path: Path | None) -> list[dict[str, Any]]:
    if not path or not path.exists():
        return []
    try:
        data = json.loads(path.read_text())
    except Exception:
        return []
    return [row for row in data.get("images", []) if row.get("ahash")]


def append_rejected_design_hashes(path: Path, source: Path, image_paths: list[Path], reason: str) -> int:
    data = json.loads(path.read_text()) if path.exists() else {"images": []}
    existing = {row.get("ahash") for row in data.get("images", [])}
    added = 0
    for image_path in image_paths:
        ahash = average_hash(image_path)
        if not ahash or ahash in existing:
            continue
        data.setdefault("images", []).append({
            "ahash": ahash,
            "source": str(source),
            "path": str(image_path),
            "reason": reason,
        })
        existing.add(ahash)
        added += 1
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    return added


def edge_score(path: Path) -> float | None:
    if Image is None or ImageFilter is None or not path.exists():
        return None
    with Image.open(path) as img:
        img = ImageOps.grayscale(img).resize((360, 360), Image.Resampling.LANCZOS)
        edges = img.filter(ImageFilter.FIND_EDGES)
        values = list(edges.get_flattened_data() if hasattr(edges, "get_flattened_data") else edges.getdata())
    if not values:
        return None
    return round(statistics.pstdev(values), 2)


def ocr_text(path: Path) -> str:
    if not path.exists():
        return ""
    try:
        result = subprocess.run(
            ["tesseract", str(path), "stdout", "--psm", "6"],
            capture_output=True,
            text=True,
            timeout=12,
            check=False,
        )
    except Exception:
        return ""
    if result.returncode != 0:
        return ""
    return re.sub(r"\s+", " ", result.stdout).strip()


def visible_text_issues(text: str) -> list[str]:
    lowered = text.lower()
    issues: list[str] = []
    for pattern, code in BLOCKING_VISIBLE_TEXT + WARNING_VISIBLE_TEXT:
        if re.search(pattern, lowered) and code not in issues:
            issues.append(code)
    if "\ufffd" in text:
        issues.append("replacement_character_visible")
    if re.search(r"\b[a-z]{18,}\b", lowered):
        issues.append("possible_garbled_long_word")
    if len(re.findall(r"[|{}<>~^_]{2,}", text)) >= 2:
        issues.append("possible_ocr_garbled_text")
    return issues


def theme_issues(item: dict[str, Any]) -> tuple[list[str], list[str], str]:
    errors: list[str] = []
    warnings: list[str] = []
    theme = normalize_theme(
        item.get("creative_theme")
        or item.get("design_theme")
        or item.get("design_template_variant")
        or item.get("design_template")
    )
    rule = THEME_REGISTRY.get(theme)
    if not rule:
        warnings.append("unknown_design_theme")
        return errors, warnings, theme
    if rule.get("status") == "legacy":
        warnings.append("legacy_theme_needs_owner_approved_replacement")
    category = category_hint(item)
    if category not in rule.get("allowed_categories", []):
        warnings.append(f"theme_category_mismatch:{category}")
    container = container_hint(str(item.get("title", "")))
    if container not in rule.get("allowed_containers", []):
        warnings.append(f"theme_container_mismatch:{container}")
    if rule.get("single_hero_required") and item.get("creative_type") in {"collage", "bundle", "comparison"}:
        errors.append("single_hero_theme_used_for_multi_product_creative")
    return errors, warnings, theme


def inspect_asset(
    image_path: Path,
    item: dict[str, Any],
    platform: str,
    rejected_hashes: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    issues: list[str] = []
    warnings: list[str] = []
    blockers: list[str] = []
    rejected_hashes = rejected_hashes or []

    if Image is None:
        return {"status": "unavailable", "score": 0, "issues": ["pillow_unavailable"], "warnings": []}
    if not image_path.exists():
        return {"status": "fail", "score": 0, "issues": ["image_missing"], "warnings": [], "blockers": ["image_missing"]}

    theme_errors, theme_warnings, theme = theme_issues(item)
    issues.extend(theme_errors)
    warnings.extend(theme_warnings)
    blockers.extend(theme_errors)

    with Image.open(image_path) as img:
        width, height = img.size
        mode = img.mode
    if width < 900 or height < 900:
        blockers.append("image_resolution_too_low")
        issues.append(f"image_resolution_too_low:{width}x{height}")
    ratio = width / max(height, 1)
    if platform == "instagram" and not (0.78 <= ratio <= 0.82):
        warnings.append(f"instagram_aspect_not_4x5:{width}x{height}")
    if platform == "facebook" and not (0.97 <= ratio <= 1.03):
        warnings.append(f"facebook_aspect_not_square:{width}x{height}")
    if mode in {"1", "L", "P"}:
        warnings.append(f"limited_color_mode:{mode}")

    score_value = edge_score(image_path)
    if score_value is not None and score_value < 10:
        warnings.append(f"low_edge_detail_possible_blur:{score_value}")

    ahash = average_hash(image_path)
    if ahash:
        for row in rejected_hashes:
            distance = hamming_hex(ahash, row["ahash"])
            if distance <= 6:
                blockers.append("matches_rejected_design_memory")
                issues.append(f"matches_rejected_design_memory:{row.get('reason', 'owner rejected')}")
                break

    source = str(item.get("product_image_source") or item.get("asset_source") or "").lower()
    if "generated" in source and "cutout" not in source:
        warnings.append("generated_image_source_requires_manual_identity_review")
    if not item.get("product_image_source"):
        warnings.append("missing_product_image_source_metadata")

    text = ocr_text(image_path)
    text_issues = visible_text_issues(text)
    for code in text_issues:
        if code in {
            "competitor_or_reference_brand_visible",
            "reference_campaign_brand_visible",
            "placeholder_text_visible",
            "high_risk_unsafe_claim_visible",
        }:
            blockers.append(code)
            issues.append(code)
        else:
            warnings.append(code)

    score = 100
    score -= len(blockers) * 30
    score -= len(warnings) * 6
    score = max(0, min(100, score))
    return {
        "status": "fail" if blockers else ("warn" if warnings else "pass"),
        "score": score,
        "theme": theme,
        "dimensions": [width, height],
        "edge_score": score_value,
        "ocr_excerpt": text[:240],
        "issues": sorted(set(issues)),
        "warnings": sorted(set(warnings)),
        "blockers": sorted(set(blockers)),
        "_provider": "local-creative-qa",
    }
