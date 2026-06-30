#!/usr/bin/env python3
"""
topical_authority_report.py — Regenerable topical authority coverage report.

Reads the site's content definitions and data files, groups pages by topic
cluster, checks for cross-type internal links, and outputs a coverage / gap
summary. Does NOT modify any files; read-only analysis.

Usage:
    python3 workspace/content-orchestrator/scripts/active/topical_authority_report.py [--json]

Outputs to stdout by default. Pass --json for machine-readable output.
"""

import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parents[4]  # emart-platform root
APP_SRC = ROOT / "apps" / "web" / "src"
LIB = APP_SRC / "lib"
DATA = APP_SRC / "data"
WORKSPACE = ROOT / "workspace"

# ── Content Inventory ──────────────────────────────────────────────────────

def count_ts_array_entries(filepath: Path, array_name: str) -> list[str]:
    """Extract slug values from a TypeScript const array definition."""
    if not filepath.exists():
        return []
    content = filepath.read_text()
    slugs = re.findall(r"slug:\s*['\"]([^'\"]+)['\"]", content)
    return slugs


def count_brand_editorial_entries(filepath: Path) -> list[str]:
    """Extract brand slugs that have editorial content."""
    if not filepath.exists():
        return []
    content = filepath.read_text()
    # Match top-level keys in the BRAND_EDITORIAL record (both quoted and unquoted)
    matches = re.findall(r"^\s+'?([a-z0-9-]+)'?:\s*\{", content, re.MULTILINE)
    # Filter out interface fields like about, links, faqs
    exclude = {"about", "links", "faqs", "label", "href"}
    return [m for m in matches if m not in exclude and len(m) > 2]


def count_origin_editorial(filepath: Path) -> list[str]:
    """Extract origin countries with editorial content."""
    if not filepath.exists():
        return []
    content = filepath.read_text()
    return re.findall(r"country:\s*'([^']+)'", content)


def count_json_entries(filepath: Path) -> int:
    """Count entries in a JSON array file."""
    if not filepath.exists():
        return 0
    try:
        data = json.loads(filepath.read_text())
        if isinstance(data, list):
            return len(data)
        if isinstance(data, dict) and "entries" in data:
            return len(data["entries"])
    except (json.JSONDecodeError, KeyError):
        pass
    return 0


def get_content_inventory() -> dict:
    """Build the content inventory from source files."""
    inventory = {}

    # Concerns
    concern_slugs = count_ts_array_entries(LIB / "concerns.ts", "CONCERN_DEFINITIONS")
    inventory["concerns"] = {
        "count": len(concern_slugs),
        "slugs": concern_slugs,
        "route": "/concerns/[slug]",
    }

    # Ingredients
    ingredient_slugs = count_ts_array_entries(LIB / "ingredients.ts", "INGREDIENT_DEFINITIONS")
    inventory["ingredients"] = {
        "count": len(ingredient_slugs),
        "slugs": ingredient_slugs,
        "route": "/ingredients/[slug]",
    }

    # Best lists — count top-level definitions only (not nested product slugs)
    best_file = LIB / "best-definitions.ts"
    best_slugs = []
    if best_file.exists():
        content = best_file.read_text()
        # Match slugs that appear right after { in a BEST_DEFINITIONS entry
        # These have the pattern: {  slug: 'xxx', title:
        best_slugs = re.findall(r"{\s*\n?\s*slug:\s*'([^']+)',\s*\n?\s*title:", content)
    inventory["best"] = {
        "count": len(best_slugs),
        "slugs": best_slugs,
        "route": "/best/[slug]",
    }

    # Compare pages — uses 'pair' not 'slug'
    compare_file = LIB / "compare-definitions.ts"
    compare_slugs = []
    if compare_file.exists():
        content = compare_file.read_text()
        compare_slugs = re.findall(r"pair:\s*'([^']+)'", content)
    inventory["compare"] = {
        "count": len(compare_slugs),
        "slugs": compare_slugs,
        "route": "/compare/[pair]",
    }

    # Routine steps
    routine_slugs = count_ts_array_entries(LIB / "routine.ts", "ROUTINE_STEPS")
    inventory["routine"] = {
        "count": len(routine_slugs),
        "slugs": routine_slugs,
        "route": "/routine/[step]",
    }

    # Skin types
    skin_type_file = LIB / "skin-type-definitions.ts"
    if skin_type_file.exists():
        content = skin_type_file.read_text()
        # Filter to only top-level slug definitions (not relatedConcerns/relatedIngredients)
        st_slugs = []
        for m in re.finditer(r"{\s*slug:\s*'([^']+)',\s*name:", content):
            st_slugs.append(m.group(1))
        if not st_slugs:
            st_slugs = re.findall(r"slug:\s*'([^']+)'", content)
            # Deduplicate keeping order
            seen = set()
            unique = []
            for s in st_slugs:
                if s not in seen and len(s) < 30:  # rough filter
                    seen.add(s)
                    unique.append(s)
            st_slugs = unique[:10]
    else:
        st_slugs = []
    inventory["skin_types"] = {
        "count": len(st_slugs),
        "slugs": st_slugs,
        "route": "/skin-type/[slug]",
    }

    # Origins
    origin_slugs = count_ts_array_entries(LIB / "origin-navigation.ts", "ORIGIN_DEFINITIONS")
    if not origin_slugs:
        origin_nav = LIB / "origin-navigation.ts"
        if origin_nav.exists():
            content = origin_nav.read_text()
            origin_slugs = re.findall(r"country:\s*'([^']+)'", content)
    inventory["origins"] = {
        "count": len(origin_slugs),
        "slugs": origin_slugs,
        "route": "/origins/[country]",
    }

    # Brand editorial
    brand_editorial_slugs = count_brand_editorial_entries(LIB / "brandEditorial.ts")
    # Brand whitelist total
    brand_whitelist = LIB / "brandWhitelist.ts"
    total_brands = 0
    if brand_whitelist.exists():
        content = brand_whitelist.read_text()
        total_brands = len(re.findall(r"name:\s*'[^']+'", content))
    inventory["brands"] = {
        "count": total_brands,
        "editorial_count": len(brand_editorial_slugs),
        "editorial_slugs": brand_editorial_slugs,
        "route": "/brands/[slug]",
    }

    # Origin editorial
    origin_editorial_countries = count_origin_editorial(LIB / "origin-editorial.ts")
    inventory["origin_editorial"] = {
        "count": len(origin_editorial_countries),
        "countries": origin_editorial_countries,
    }

    # Concern/ingredient editorial content
    inventory["concern_content"] = {
        "count": count_json_entries(DATA / "concern-content.json"),
    }
    inventory["ingredient_content"] = {
        "count": count_json_entries(DATA / "ingredient-content.json"),
    }

    # Humanized PDPs
    registry = WORKSPACE / "humanizer" / "completed-content-registry.json"
    humanized = 0
    if registry.exists():
        try:
            data = json.loads(registry.read_text())
            humanized = data.get("total_completed", 0)
        except (json.JSONDecodeError, KeyError):
            pass
    inventory["humanized_pdps"] = {"count": humanized}

    return inventory


# ── Internal Link Detection ───────────────────────────────────────────────

CONTENT_TYPES = [
    "best", "compare", "concerns", "ingredients", "routine",
    "skin-type", "brands", "category", "origins", "blog", "shop",
]

LINK_PATTERNS = {ct: re.compile(rf'(?:href=["\']|href=\{{[`"\'])/{ct}/', re.IGNORECASE) for ct in CONTENT_TYPES}
LINK_PATTERN_CONTENT = re.compile(r"\[\[LINK:(/[^|]+)\|([^\]]+)\]\]")


def scan_file_for_links(filepath: Path) -> dict[str, int]:
    """Count outgoing internal links to each content type in a file."""
    if not filepath.exists():
        return {}
    content = filepath.read_text()
    counts: dict[str, int] = {}
    for ct, pattern in LINK_PATTERNS.items():
        matches = pattern.findall(content)
        if matches:
            counts[ct] = len(matches)
    # Also check [[LINK:]] patterns
    for m in LINK_PATTERN_CONTENT.finditer(content):
        href = m.group(1)
        for ct in CONTENT_TYPES:
            if href.startswith(f"/{ct}/"):
                counts[ct] = counts.get(ct, 0) + 1
                break
    return counts


def build_link_matrix() -> dict[str, dict[str, int]]:
    """Build a matrix of internal links FROM each content type TO other types."""
    matrix: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    # Map source directories to content type names
    source_dirs = {
        "best": APP_SRC / "app" / "best",
        "compare": APP_SRC / "app" / "compare",
        "concerns": APP_SRC / "app" / "concerns",
        "ingredients": APP_SRC / "app" / "ingredients",
        "routine": APP_SRC / "app" / "routine",
        "skin-type": APP_SRC / "app" / "skin-type",
        "brands": APP_SRC / "app" / "brands",
        "category": APP_SRC / "app" / "category",
        "origins": APP_SRC / "app" / "origins",
        "blog": APP_SRC / "app" / "blog",
        "shop": APP_SRC / "app" / "shop",
    }

    for source_type, source_dir in source_dirs.items():
        if not source_dir.exists():
            continue
        for tsx_file in source_dir.rglob("*.tsx"):
            counts = scan_file_for_links(tsx_file)
            for target_type, count in counts.items():
                if target_type != source_type:
                    matrix[source_type][target_type] += count

    # Also scan data files for [[LINK:]] patterns
    for data_file in [DATA / "concern-content.json", DATA / "ingredient-content.json"]:
        if data_file.exists():
            source_type = "concerns" if "concern" in data_file.name else "ingredients"
            counts = scan_file_for_links(data_file)
            for target_type, count in counts.items():
                if target_type != source_type:
                    matrix[source_type][target_type] += count

    # Scan lib-level data files that contain cross-links
    lib_sources = {
        "brands": [LIB / "brandEditorial.ts"],
        "origins": [LIB / "origin-editorial.ts"],
        "skin-type": [LIB / "skin-type-definitions.ts"],
        "best": [LIB / "best-definitions.ts"],
        "compare": [LIB / "compare-definitions.ts"],
        "routine": [LIB / "routine.ts"],
    }
    for source_type, files in lib_sources.items():
        for lib_file in files:
            if lib_file.exists():
                counts = scan_file_for_links(lib_file)
                for target_type, count in counts.items():
                    if target_type != source_type:
                        matrix[source_type][target_type] += count

    return dict(matrix)


# ── Topic Clusters ────────────────────────────────────────────────────────

# Map topics to the content types and slugs that belong to them
TOPIC_CLUSTERS = {
    "Oily Skin / Oil Control": {
        "concerns": ["pores-oil-control"],
        "ingredients": ["niacinamide", "bha-salicylic-acid"],
        "best": ["sunscreen-oily-skin-bangladesh", "cleanser-oily-skin-bangladesh", "moisturiser-oily-skin-bangladesh"],
        "compare": ["cerave-vs-cosrx-cleanser", "cosrx-vs-beauty-of-joseon-sunscreen"],
        "skin_types": ["oily"],
        "routine": ["cleanser", "sunscreen", "moisturiser"],
    },
    "Acne / Blemish": {
        "concerns": ["acne-blemish-care"],
        "ingredients": ["bha-salicylic-acid", "centella", "snail-mucin", "niacinamide"],
        "skin_types": ["acne-prone"],
        "routine": ["cleanser", "treatment"],
    },
    "Brightening / Hyperpigmentation": {
        "concerns": ["brightening", "melasma"],
        "ingredients": ["vitamin-c", "niacinamide", "aha"],
        "compare": ["cosrx-snail-vs-beauty-of-joseon-serum"],
    },
    "Anti-Aging / Repair": {
        "concerns": ["anti-aging-repair"],
        "ingredients": ["retinol", "peptide", "ceramide", "collagen"],
        "skin_types": ["dry"],
    },
    "Hydration / Dry Skin / Barrier": {
        "concerns": ["dryness-hydration", "sensitivity"],
        "ingredients": ["hyaluronic-acid", "ceramide", "snail-mucin"],
        "skin_types": ["dry", "sensitive", "combination"],
        "routine": ["moisturiser", "toner"],
    },
    "Sun Protection": {
        "concerns": ["sunscreen"],
        "best": ["sunscreen-oily-skin-bangladesh"],
        "compare": ["cosrx-vs-beauty-of-joseon-sunscreen"],
        "routine": ["sunscreen"],
    },
    "Korean Beauty": {
        "origins": ["south-korea"],
        "ingredients": ["snail-mucin", "centella", "ginseng", "propolis", "mugwort"],
    },
    "Calming / Soothing": {
        "concerns": ["sensitivity"],
        "ingredients": ["centella", "mugwort", "propolis"],
        "skin_types": ["sensitive"],
    },
}


def evaluate_clusters(inventory: dict) -> list[dict]:
    """Evaluate each topic cluster for coverage and gaps."""
    results = []
    for topic, members in TOPIC_CLUSTERS.items():
        cluster = {"topic": topic, "pages": [], "gaps": []}
        for content_type, slugs in members.items():
            inv_key = content_type
            if inv_key in inventory:
                available = inventory[inv_key].get("slugs", [])
                for slug in slugs:
                    if slug in available:
                        cluster["pages"].append({"type": content_type, "slug": slug, "exists": True})
                    else:
                        cluster["pages"].append({"type": content_type, "slug": slug, "exists": False})
                        cluster["gaps"].append(f"Missing {content_type}/{slug}")
            else:
                for slug in slugs:
                    cluster["pages"].append({"type": content_type, "slug": slug, "exists": False})
                    cluster["gaps"].append(f"Missing {content_type}/{slug}")

        # Check for missing content types in the cluster
        present_types = set(m.get("type") for m in cluster["pages"] if m.get("exists"))
        all_editorial_types = {"concerns", "ingredients", "best", "compare", "routine", "skin_types"}
        missing = all_editorial_types - present_types - set(members.keys())
        # Only note missing types that make sense for the topic
        if "best" not in members:
            cluster["gaps"].append(f"No /best guide for '{topic}'")
        if "compare" not in members and topic not in ("Korean Beauty", "Calming / Soothing"):
            cluster["gaps"].append(f"No /compare page for '{topic}'")

        results.append(cluster)
    return results


# ── GSC Striking Distance ─────────────────────────────────────────────────

def load_striking_distance() -> list[dict]:
    """Load GSC striking-distance data if available."""
    sd_file = WORKSPACE / "seo-review" / "striking-distance.json"
    if not sd_file.exists():
        return []
    try:
        data = json.loads(sd_file.read_text())
        return data.get("pages", [])
    except (json.JSONDecodeError, KeyError):
        return []


def striking_distance_by_type(pages: list[dict]) -> dict[str, list[dict]]:
    """Group striking-distance pages by content type."""
    groups: dict[str, list[dict]] = defaultdict(list)
    for p in pages:
        path = p.get("path", "")
        parts = path.strip("/").split("/")
        prefix = parts[0] if parts else ""
        groups[prefix].append(p)
    return dict(groups)


# ── Report Generation ─────────────────────────────────────────────────────

def generate_report(as_json: bool = False):
    """Generate the full topical authority report."""
    inventory = get_content_inventory()
    link_matrix = build_link_matrix()
    clusters = evaluate_clusters(inventory)
    sd_pages = load_striking_distance()
    sd_by_type = striking_distance_by_type(sd_pages)

    if as_json:
        report = {
            "generated": "auto",
            "inventory": inventory,
            "link_matrix": link_matrix,
            "clusters": clusters,
            "striking_distance_by_type": {
                k: len(v) for k, v in sd_by_type.items()
            },
        }
        print(json.dumps(report, indent=2, default=str))
        return

    # Text report
    print("=" * 72)
    print("TOPICAL AUTHORITY REPORT — Emart Skincare Bangladesh")
    print("=" * 72)

    print("\n## CONTENT INVENTORY\n")
    for key, data in inventory.items():
        count = data.get("count", 0)
        extra = ""
        if "editorial_count" in data:
            extra = f" ({data['editorial_count']} with editorial)"
        print(f"  {key:25s}: {count:>5d}{extra}")

    print("\n## INTERNAL LINK MATRIX (FROM -> TO counts)\n")
    all_targets = set()
    for targets in link_matrix.values():
        all_targets.update(targets.keys())
    all_targets = sorted(all_targets)

    # Header
    header = f"  {'FROM':<15s}"
    for t in all_targets:
        header += f" {t:>12s}"
    print(header)
    print("  " + "-" * (15 + 13 * len(all_targets)))

    for source in sorted(link_matrix.keys()):
        row = f"  {source:<15s}"
        for target in all_targets:
            val = link_matrix[source].get(target, 0)
            cell = str(val) if val > 0 else "."
            row += f" {cell:>12s}"
        print(row)

    # Disconnected pairs
    print("\n## DISCONNECTED PAIRS (zero links in either direction)\n")
    editorial_types = ["best", "compare", "concerns", "ingredients", "routine", "skin-type", "brands", "origins", "blog"]
    disconnected = []
    for i, a in enumerate(editorial_types):
        for b in editorial_types[i + 1:]:
            a_to_b = link_matrix.get(a, {}).get(b, 0)
            b_to_a = link_matrix.get(b, {}).get(a, 0)
            if a_to_b == 0 and b_to_a == 0:
                disconnected.append(f"  {a} <-> {b}")
    for d in disconnected:
        print(d)

    print(f"\n  Total disconnected pairs: {len(disconnected)}")

    print("\n## TOPIC CLUSTER COVERAGE\n")
    for cluster in clusters:
        existing = sum(1 for p in cluster["pages"] if p.get("exists"))
        total = len(cluster["pages"])
        gap_count = len(cluster["gaps"])
        status = "COMPLETE" if gap_count == 0 else f"{gap_count} gaps"
        print(f"  {cluster['topic']:<35s}: {existing}/{total} pages present, {status}")
        for gap in cluster["gaps"]:
            print(f"    - {gap}")

    if sd_by_type:
        print("\n## STRIKING DISTANCE BY TYPE (pages at position 11-20)\n")
        for content_type, pages in sorted(sd_by_type.items(), key=lambda x: -len(x[1])):
            total_imp = sum(p.get("impressions", 0) for p in pages)
            print(f"  /{content_type:<20s}: {len(pages):>3d} pages, {total_imp:>5d} total impressions")

    print("\n## PRIORITY ACTIONS\n")
    # Identify highest-impact gaps
    print("  1. Blog internal links — 50+ posts with ZERO in-body cross-links")
    print("  2. Best/Compare → concern/ingredient/brand cross-links")
    print("  3. Concern/Ingredient → best/compare/blog cross-links")
    print("  4. PDP humanizer pipeline → concern/ingredient/routine links at scale")
    print("  5. New content: best lists for acne, brightening, anti-aging, sheet masks")
    print()


if __name__ == "__main__":
    json_mode = "--json" in sys.argv
    generate_report(as_json=json_mode)
