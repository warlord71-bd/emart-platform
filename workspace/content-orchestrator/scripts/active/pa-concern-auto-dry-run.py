#!/usr/bin/env python3
"""
pa_concern automated dry-run for currently unassigned products.

No DB writes. Produces a CSV with deterministic proposed pa_concern assignments.
Ambiguous products are left blank/SKIP.
"""

from __future__ import annotations

import csv
import re
import subprocess
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path


DB_USER = "emart_user"
DB_NAME = "emart_live"
PREFIX = "wp4h_"
OUT_DIR = Path("workspace/audit/active")


def get_db_password() -> str:
    conf = Path("/var/www/wordpress/wp-config.php").read_text()
    match = re.search(r"define\s*\(\s*'DB_PASSWORD'\s*,\s*'([^']*)'\s*\)", conf)
    if not match:
        raise RuntimeError("Could not read DB_PASSWORD from wp-config.php")
    return match.group(1)


DB_PASS = get_db_password()


def sql(query: str) -> list[list[str]]:
    result = subprocess.run(
        ["mysql", DB_NAME, f"-u{DB_USER}", f"-p{DB_PASS}", "--batch", "--silent", "-e", query],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr[:500])
    return [line.split("\t") for line in result.stdout.splitlines() if line.strip()]


VALID_CONCERNS = {
    "acne-blemish",
    "anti-aging-repair",
    "brightening",
    "dryness-hydration",
    "hyperpigmentation",
    "pores-blackheads",
    "sensitivity",
    "sunscreen",
    "wrinkle",
}

CAT_TO_CONCERN = {
    "sunscreen": ["sunscreen"],
    "spot-treatment": ["acne-blemish"],
    "face-cleansers": ["sensitivity"],
    "toners-mists": ["dryness-hydration"],
    "face-masks": ["dryness-hydration"],
    "wash-off-mask": ["dryness-hydration"],
    "soothing-gel": ["sensitivity"],
    "eye-care": ["wrinkle", "anti-aging-repair"],
    "night-cream": ["anti-aging-repair", "dryness-hydration"],
    "cream-moisturizer": ["dryness-hydration"],
    "body-lotion": ["dryness-hydration"],
    "body-wash": ["dryness-hydration"],
    "body-oil": ["dryness-hydration"],
    "hand-care": ["dryness-hydration"],
    "lip-balm-care": ["dryness-hydration"],
    "skincare-kit-set": ["dryness-hydration"],
}

INGREDIENT_TO_CONCERN = {
    "niacinamide": ["brightening", "pores-blackheads", "hyperpigmentation"],
    "vitamin-c": ["brightening", "hyperpigmentation"],
    "bha": ["acne-blemish", "pores-blackheads"],
    "aha": ["brightening", "acne-blemish"],
    "retinol": ["anti-aging-repair", "wrinkle", "acne-blemish"],
    "bakuchiol": ["anti-aging-repair", "wrinkle"],
    "peptide": ["anti-aging-repair", "wrinkle"],
    "collagen": ["anti-aging-repair", "dryness-hydration"],
    "hyaluronic-acid": ["dryness-hydration"],
    "ceramide": ["dryness-hydration", "sensitivity"],
    "centella": ["sensitivity", "acne-blemish"],
    "mugwort": ["sensitivity", "acne-blemish"],
    "tea-tree": ["acne-blemish"],
    "propolis": ["acne-blemish", "brightening"],
    "snail-mucin": ["anti-aging-repair", "dryness-hydration"],
    "ginseng": ["anti-aging-repair", "brightening"],
    "azelaic-acid": ["acne-blemish", "hyperpigmentation"],
    "vitamin-e": ["dryness-hydration", "anti-aging-repair"],
    "rice": ["brightening"],
    "rosemary": ["anti-aging-repair"],
    "bifida": ["anti-aging-repair", "sensitivity"],
    "egf": ["anti-aging-repair", "wrinkle"],
}

BRAND_TO_CONCERN = {
    "cosrx": ["acne-blemish"],
    "some-by-mi": ["acne-blemish"],
    "axis-y": ["brightening", "hyperpigmentation"],
    "the-ordinary": ["brightening", "pores-blackheads"],
    "cerave": ["dryness-hydration", "sensitivity"],
}

TITLE_RULES = [
    (["sunscreen", "sun cream", "sun serum", "sun stick", "sunblock", "sun block", "spf", "pa+", "uv "], ["sunscreen"]),
    (["acne", "blemish", "pimple", "ac collection", "spot patch", "ac clear", "anti acne"], ["acne-blemish"]),
    (["blackhead", "whitehead", "pore", "sebum", "oil control"], ["pores-blackheads"]),
    (["melasma", "hyperpigmentation"], ["hyperpigmentation"]),
    (["dark spot", "vitamin c", "vita c", "niacinamide", "bright", "brightening", "whitening", "glow", "radiance"], ["brightening"]),
    (["retinol", "retinal", "peptide", "collagen", "firming", "lifting", "anti-aging", "anti aging"], ["anti-aging-repair"]),
    (["wrinkle", "fine line", "eye cream", "eye serum", "eye patch", "dark circle", "under eye"], ["wrinkle"]),
    (["centella", "cica", "madecassoside", "mugwort", "heartleaf", "calming", "soothing", "sensitive"], ["sensitivity"]),
    (["hyaluronic", "hydrating", "hydration", "moisture", "moisturizing", "moisturising", "barrier", "ceramide", "lip balm", "body lotion", "hand cream"], ["dryness-hydration"]),
]

NON_SKIN_TITLE = [
    "false nail",
    "nail glue",
    "hair shampoo",
    "shampoo",
    "conditioner",
    "hair serum",
    "hair tonic",
    "hair oil",
    "scalp",
    "hair color",
    "foundation",
    "mascara",
    "eyeliner",
    "eyeshadow",
    "lipstick",
    "lip tint",
    "lip gloss",
    "blush",
    "highlighter",
    "setting powder",
    "perfume",
    "deodorant",
    "toothpaste",
    "diaper",
]

SKINCARE_CATS = {
    "sunscreen",
    "face-cleansers",
    "toners-mists",
    "serums-ampoules-essences",
    "face-masks",
    "wash-off-mask",
    "spot-treatment",
    "toner-pads",
    "night-cream",
    "cream-moisturizer",
    "eye-care",
    "soothing-gel",
    "skincare-kit-set",
    "makeup-remover",
    "body-lotion",
    "body-wash",
    "body-oil",
    "hand-care",
    "lip-balm-care",
}

NON_SKIN_CATS = {
    "shampoos",
    "hair-conditioners",
    "hair-treatments",
    "hair-oil",
    "hair-styling-products",
    "hair-colors",
    "foundation",
    "eyes",
    "mascara-eyeliner",
    "lipstick-tint",
    "face-makeup",
    "fragrances",
    "diapers-wipes",
    "beauty-supplements",
    "personal-hygiene",
}


def load_taxonomy_map(taxonomy: str) -> dict[int, list[str]]:
    rows = sql(
        f"""
        SELECT tr.object_id, t.slug
        FROM {PREFIX}term_relationships tr
        JOIN {PREFIX}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
        JOIN {PREFIX}terms t ON t.term_id = tt.term_id
        JOIN {PREFIX}posts p ON p.ID = tr.object_id
        WHERE tt.taxonomy = '{taxonomy}'
          AND p.post_status = 'publish'
          AND p.post_type = 'product'
        """
    )
    mapped: dict[int, list[str]] = defaultdict(list)
    for object_id, slug in rows:
        mapped[int(object_id)].append(slug)
    return mapped


def add(concerns: set[str], source_notes: list[str], values: list[str], source: str) -> None:
    valid = [value for value in values if value in VALID_CONCERNS]
    if not valid:
        return
    concerns.update(valid)
    source_notes.append(f"{source}:{'|'.join(valid)}")


def assign(title: str, cats: set[str], brands: set[str], ingredients: set[str], skin_types: set[str]) -> tuple[list[str], str, str, str]:
    title_l = title.lower()
    has_skin_cat = bool(cats & SKINCARE_CATS)
    has_only_non_skin_cat = bool(cats & NON_SKIN_CATS) and not has_skin_cat
    has_non_skin_title = any(token in title_l for token in NON_SKIN_TITLE)

    if has_only_non_skin_cat or (has_non_skin_title and not has_skin_cat):
        return [], "SKIP", "non-skin-or-makeup-hair", ""

    concerns: set[str] = set()
    notes: list[str] = []
    score = 0

    for cat in sorted(cats):
        if cat in CAT_TO_CONCERN:
            add(concerns, notes, CAT_TO_CONCERN[cat], f"category={cat}")
            score += 4

    for ingredient in sorted(ingredients):
        if ingredient in INGREDIENT_TO_CONCERN:
            add(concerns, notes, INGREDIENT_TO_CONCERN[ingredient], f"ingredient={ingredient}")
            score += 3

    for keywords, values in TITLE_RULES:
        matched = [kw for kw in keywords if kw in title_l]
        if matched:
            add(concerns, notes, values, f"title={matched[0]}")
            score += 2

    for brand in sorted(brands):
        if brand in BRAND_TO_CONCERN and (concerns or has_skin_cat):
            add(concerns, notes, BRAND_TO_CONCERN[brand], f"brand={brand}")
            score += 1

    if not concerns:
        if "dry" in skin_types:
            add(concerns, notes, ["dryness-hydration"], "skin_type=dry")
            score += 1
        elif "sensitive" in skin_types:
            add(concerns, notes, ["sensitivity"], "skin_type=sensitive")
            score += 1
        elif "acne-prone" in skin_types:
            add(concerns, notes, ["acne-blemish"], "skin_type=acne-prone")
            score += 1
        elif "oily" in skin_types:
            add(concerns, notes, ["pores-blackheads"], "skin_type=oily")
            score += 1

    if not concerns:
        return [], "SKIP", "ambiguous-no-clear-signal", ""

    if score >= 4:
        confidence = "HIGH"
    elif score >= 2:
        confidence = "MED"
    else:
        confidence = "LOW"

    return sorted(concerns), confidence, "", " + ".join(notes)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    csv_path = OUT_DIR / f"pa-concern-auto-dry-run-{stamp}.csv"
    summary_path = OUT_DIR / f"pa-concern-auto-dry-run-{stamp}-summary.txt"

    base_rows = sql(
        f"""
        SELECT p.ID, p.post_title
        FROM {PREFIX}posts p
        WHERE p.post_status = 'publish'
          AND p.post_type = 'product'
          AND p.ID NOT IN (
            SELECT DISTINCT tr2.object_id
            FROM {PREFIX}term_relationships tr2
            JOIN {PREFIX}term_taxonomy tt2 ON tt2.term_taxonomy_id = tr2.term_taxonomy_id
            WHERE tt2.taxonomy = 'pa_concern'
          )
        ORDER BY p.ID
        """
    )

    cat_map = load_taxonomy_map("product_cat")
    brand_map = load_taxonomy_map("product_brand")
    ingredient_map = load_taxonomy_map("pa_ingredient")
    skin_type_map = load_taxonomy_map("pa_skin_type")

    stats = Counter()
    concern_dist = Counter()
    rows = []

    for raw_id, title in base_rows:
        product_id = int(raw_id)
        cats = set(cat_map.get(product_id, []))
        brands = set(brand_map.get(product_id, []))
        ingredients = set(ingredient_map.get(product_id, []))
        skin_types = set(skin_type_map.get(product_id, []))
        concerns, confidence, skip_reason, notes = assign(title, cats, brands, ingredients, skin_types)

        if confidence == "SKIP":
            stats["skip"] += 1
            stats[f"skip_{skip_reason}"] += 1
        else:
            stats["assign"] += 1
            stats[f"assign_{confidence.lower()}"] += 1
            for concern in concerns:
                concern_dist[concern] += 1

        rows.append(
            {
                "product_id": product_id,
                "product_title": title,
                "cat_slugs": ",".join(sorted(cats)),
                "brand_slugs": ",".join(sorted(brands)),
                "ingredient_slugs": ",".join(sorted(ingredients)),
                "skin_type_slugs": ",".join(sorted(skin_types)),
                "proposed_concerns": "|".join(concerns),
                "confidence": confidence,
                "skip_reason": skip_reason,
                "evidence": notes,
                "apply_action": "APPLY" if confidence != "SKIP" else "SKIP",
            }
        )

    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    summary_lines = [
        "pa_concern Automated Dry-Run Summary",
        f"Generated: {stamp}",
        f"Products missing pa_concern processed: {len(rows)}",
        "",
        "Assignments:",
        f"  APPLY total: {stats['assign']}",
        f"  HIGH: {stats['assign_high']}",
        f"  MED: {stats['assign_med']}",
        f"  LOW: {stats['assign_low']}",
        "",
        "Skipped:",
        f"  SKIP total: {stats['skip']}",
        f"  non-skin/makeup/hair: {stats['skip_non-skin-or-makeup-hair']}",
        f"  ambiguous/no clear signal: {stats['skip_ambiguous-no-clear-signal']}",
        "",
        "Concern distribution:",
    ]
    for concern, count in concern_dist.most_common():
        summary_lines.append(f"  {concern}: {count}")
    summary_lines.extend(
        [
            "",
            f"CSV: {csv_path}",
            f"Summary: {summary_path}",
            "",
            "No DB writes performed.",
        ]
    )
    summary_path.write_text("\n".join(summary_lines) + "\n", encoding="utf-8")

    print("\n".join(summary_lines))


if __name__ == "__main__":
    main()
