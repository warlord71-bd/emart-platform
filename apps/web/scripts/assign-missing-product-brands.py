#!/usr/bin/env python3
"""
Safely assign missing product-brand taxonomy terms on E-mart.

Behavior:
- Detects the active product brand taxonomy from DB + code usage.
- Targets only products that have NO term in that active taxonomy.
- Proposes assignments conservatively from secondary brand taxonomies first,
  then from title/slug prefix matches against the live canonical brand set.
- Defaults to dry-run.
- Writes CSV / JSON logs before any apply.
- Supports rollback from the generated rollback CSV.

Usage:
  python3 apps/web/scripts/assign-missing-product-brands.py
  python3 apps/web/scripts/assign-missing-product-brands.py --limit 50
  python3 apps/web/scripts/assign-missing-product-brands.py --apply
  python3 apps/web/scripts/assign-missing-product-brands.py --rollback-csv audit/processed/brand-fill-.../rollback.csv
"""

from __future__ import annotations

import argparse
import csv
import html
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


REPO_ROOT = Path(__file__).resolve().parents[3]
WP_PATH = Path("/var/www/wordpress")
AUDIT_ROOT = REPO_ROOT / "audit" / "processed"
WHITELIST_PATH = REPO_ROOT / "apps" / "web" / "src" / "lib" / "brandWhitelist.ts"
CODE_REFERENCE_FILES = [
    REPO_ROOT / "apps" / "web" / "src" / "app" / "brands" / "page.tsx",
    REPO_ROOT / "apps" / "web" / "src" / "app" / "shop" / "page.tsx",
    REPO_ROOT / "apps" / "web" / "src" / "app" / "origins" / "page.tsx",
    REPO_ROOT / "apps" / "web" / "src" / "lib" / "woocommerce.ts",
    REPO_ROOT / "apps" / "web" / "src" / "components" / "product" / "ProductDetail.tsx",
]
KNOWN_BRAND_TAXONOMY_CANDIDATES = [
    "pa_brand",
    "product_brand",
    "pwb-brand",
    "yith_product_brand",
    "berocket_brand",
    "brand",
]
GENERIC_CONTAINS_ALIASES = {
    "dr",
    "the",
    "be",
    "wet",
    "clear",
    "absolute",
    "moist",
    "brand",
    "beauty",
    "skin",
}


@dataclass
class TaxonomyEvidence:
    taxonomy: str
    term_count: int = 0
    product_count: int = 0
    published_product_count: int = 0
    code_hits: int = 0
    wc_attribute_name: Optional[str] = None
    score: int = 0


@dataclass
class CanonicalBrand:
    name: str
    slugs: List[str]


@dataclass
class ActiveBrandTerm:
    canonical_name: str
    term_id: int
    term_name: str
    term_slug: str
    count: int
    aliases: List[str] = field(default_factory=list)


@dataclass
class SecondaryBrandTerm:
    taxonomy: str
    term_id: int
    name: str
    slug: str


@dataclass
class ProductRecord:
    product_id: int
    status: str
    title: str
    slug: str
    sku: str
    categories: List[str]
    tags: List[str]
    secondary_brand_terms: List[SecondaryBrandTerm]


@dataclass
class Proposal:
    product_id: int
    status: str
    title: str
    slug: str
    sku: str
    taxonomy: str
    term_id: int
    term_name: str
    term_slug: str
    confidence: float
    source: str
    matched_alias: str
    categories: str
    tags: str
    secondary_brand_terms: str


def run_command(cmd: Sequence[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(cmd),
        cwd=str(REPO_ROOT),
        check=check,
        capture_output=True,
        text=True,
    )


def wp_db_query(sql: str) -> List[List[str]]:
    proc = run_command(
        [
            "wp",
            f"--path={WP_PATH}",
            "--allow-root",
            "db",
            "query",
            sql,
            "--skip-column-names",
        ]
    )
    rows: List[List[str]] = []
    for line in proc.stdout.splitlines():
        if not line.strip():
            continue
        rows.append(line.split("\t"))
    return rows


def wp_post_term_set(product_id: int, taxonomy: str, term_id: int) -> subprocess.CompletedProcess[str]:
    return run_command(
        [
            "wp",
            f"--path={WP_PATH}",
            "--allow-root",
            "post",
            "term",
            "set",
            str(product_id),
            taxonomy,
            str(term_id),
            "--by=id",
        ]
    )


def wp_post_term_remove(product_id: int, taxonomy: str, term_id: int) -> subprocess.CompletedProcess[str]:
    return run_command(
        [
            "wp",
            f"--path={WP_PATH}",
            "--allow-root",
            "post",
            "term",
            "remove",
            str(product_id),
            taxonomy,
            str(term_id),
            "--by=id",
        ]
    )


def clean_text(value: object) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_phrase(value: object) -> str:
    text = clean_text(value).lower()
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_compact(value: object) -> str:
    return normalize_phrase(value).replace(" ", "")


def normalize_slug(value: object) -> str:
    text = clean_text(value).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def starts_with_phrase(text: str, phrase: str) -> bool:
    return text == phrase or text.startswith(phrase + " ")


def contains_phrase(text: str, phrase: str) -> bool:
    return phrase and re.search(rf"(^|\s){re.escape(phrase)}($|\s)", text) is not None


def parse_brand_whitelist(path: Path) -> List[CanonicalBrand]:
    source = path.read_text(encoding="utf-8")
    entry_re = re.compile(
        r"\{\s*name:\s*(?P<q1>['\"])(?P<name>(?:\\.|(?! (?P=q1)).)*) (?P=q1),\s*region:\s*(?P<q2>['\"])(?P<region>(?:\\.|(?! (?P=q2)).)*) (?P=q2),\s*slugs:\s*\[(?P<slugs>[^\]]*)\]\s*\}",
        re.VERBOSE,
    )
    slug_re = re.compile(r"(['\"])(?P<slug>(?:\\.|(?!\1).)*)\1")

    brands: List[CanonicalBrand] = []
    for match in entry_re.finditer(source):
        name = bytes(match.group("name"), "utf-8").decode("unicode_escape")
        slugs = [
            bytes(slug_match.group("slug"), "utf-8").decode("unicode_escape")
            for slug_match in slug_re.finditer(match.group("slugs"))
        ]
        if name and slugs:
            brands.append(CanonicalBrand(name=clean_text(name), slugs=[normalize_slug(s) for s in slugs if s]))
    return brands


def scan_code_hits(candidates: Iterable[str]) -> Dict[str, int]:
    file_text = "\n".join(
        path.read_text(encoding="utf-8", errors="ignore")
        for path in CODE_REFERENCE_FILES
        if path.exists()
    )
    hits: Dict[str, int] = {}
    for taxonomy in candidates:
        literal_pattern = re.compile(
            rf"(['\"`]){re.escape(taxonomy)}\1|\b{re.escape(taxonomy)}\b"
        )
        matches = literal_pattern.findall(file_text)
        score = len(matches)
        if taxonomy == "brand":
            quoted_only = re.compile(rf"(['\"`]){re.escape(taxonomy)}\1")
            score = len(quoted_only.findall(file_text))
        hits[taxonomy] = score
    return hits


def detect_brand_taxonomy() -> Tuple[str, Dict[str, TaxonomyEvidence]]:
    rows = wp_db_query(
        """
        SELECT taxonomy, COUNT(*) AS term_count
        FROM wp4h_term_taxonomy
        WHERE taxonomy LIKE '%brand%' OR taxonomy IN ('pa_brand','product_brand','pwb-brand','yith_product_brand','berocket_brand','brand')
        GROUP BY taxonomy
        """
    )
    product_rows = wp_db_query(
        """
        SELECT tt.taxonomy, COUNT(DISTINCT tr.object_id) AS product_count
        FROM wp4h_term_relationships tr
        JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
        JOIN wp4h_posts p ON p.ID = tr.object_id
        WHERE p.post_type='product' AND p.post_status IN ('publish','draft','private')
          AND (tt.taxonomy LIKE '%brand%' OR tt.taxonomy IN ('pa_brand','product_brand','pwb-brand','yith_product_brand','berocket_brand','brand'))
        GROUP BY tt.taxonomy
        """
    )
    published_rows = wp_db_query(
        """
        SELECT tt.taxonomy, COUNT(DISTINCT tr.object_id) AS published_product_count
        FROM wp4h_term_relationships tr
        JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
        JOIN wp4h_posts p ON p.ID = tr.object_id
        WHERE p.post_type='product' AND p.post_status='publish'
          AND (tt.taxonomy LIKE '%brand%' OR tt.taxonomy IN ('pa_brand','product_brand','pwb-brand','yith_product_brand','berocket_brand','brand'))
        GROUP BY tt.taxonomy
        """
    )
    attribute_rows = wp_db_query(
        """
        SELECT attribute_id, attribute_name
        FROM wp4h_woocommerce_attribute_taxonomies
        WHERE attribute_name LIKE '%brand%'
        """
    )

    candidates = {row[0] for row in rows if row and row[0]}
    candidates.update(KNOWN_BRAND_TAXONOMY_CANDIDATES)
    code_hits = scan_code_hits(candidates)

    evidence_map: Dict[str, TaxonomyEvidence] = {
        taxonomy: TaxonomyEvidence(taxonomy=taxonomy, code_hits=code_hits.get(taxonomy, 0))
        for taxonomy in candidates
    }

    for row in rows:
        if len(row) < 2:
            continue
        taxonomy, term_count = row[:2]
        evidence_map[taxonomy].term_count = int(term_count or 0)
    for row in product_rows:
        if len(row) < 2:
            continue
        taxonomy, product_count = row[:2]
        evidence_map[taxonomy].product_count = int(product_count or 0)
    for row in published_rows:
        if len(row) < 2:
            continue
        taxonomy, published_product_count = row[:2]
        evidence_map[taxonomy].published_product_count = int(published_product_count or 0)

    brand_attribute_taxonomies = {}
    for row in attribute_rows:
        if len(row) < 2:
            continue
        _, attribute_name = row[:2]
        brand_attribute_taxonomies[f"pa_{attribute_name}"] = attribute_name
    for taxonomy, attribute_name in brand_attribute_taxonomies.items():
        evidence_map.setdefault(taxonomy, TaxonomyEvidence(taxonomy=taxonomy))
        evidence_map[taxonomy].wc_attribute_name = attribute_name

    for taxonomy, evidence in evidence_map.items():
        score = 0
        if evidence.wc_attribute_name:
            score += 10000
        score += evidence.code_hits * 500
        score += evidence.published_product_count * 10
        score += evidence.product_count * 3
        score += evidence.term_count
        if taxonomy == "pa_brand":
            score += 100
        evidence.score = score

    ranked = sorted(
        evidence_map.values(),
        key=lambda item: (item.score, item.code_hits, item.published_product_count, item.term_count),
        reverse=True,
    )
    if not ranked or ranked[0].score <= 0:
        raise RuntimeError("Could not detect an active brand taxonomy")

    return ranked[0].taxonomy, evidence_map


def load_active_brand_terms(taxonomy: str) -> List[Tuple[int, str, str, int]]:
    rows = wp_db_query(
        f"""
        SELECT t.term_id, t.name, t.slug, tt.count
        FROM wp4h_terms t
        JOIN wp4h_term_taxonomy tt ON tt.term_id = t.term_id
        WHERE tt.taxonomy = '{taxonomy}'
        ORDER BY tt.count DESC, t.name ASC
        """
    )
    terms: List[Tuple[int, str, str, int]] = []
    for row in rows:
        if len(row) < 4:
            continue
        term_id, name, slug, count = row[:4]
        terms.append((int(term_id), clean_text(name), clean_text(slug), int(count or 0)))
    return terms


def build_active_brand_map(taxonomy: str) -> Tuple[Dict[str, ActiveBrandTerm], Dict[str, str]]:
    canonical_brands = parse_brand_whitelist(WHITELIST_PATH)
    active_terms = load_active_brand_terms(taxonomy)

    canonical_by_slug: Dict[str, CanonicalBrand] = {}
    canonical_by_phrase: Dict[str, CanonicalBrand] = {}
    for brand in canonical_brands:
        canonical_by_phrase[normalize_phrase(brand.name)] = brand
        for slug in brand.slugs:
            canonical_by_slug[normalize_slug(slug)] = brand
            canonical_by_phrase[normalize_phrase(slug.replace("-", " "))] = brand

    buckets: Dict[str, List[Tuple[int, str, str, int]]] = {}
    skipped_terms: Dict[str, str] = {}
    for term_id, term_name, term_slug, count in active_terms:
        matched_brand: Optional[CanonicalBrand] = None
        term_slug_key = normalize_slug(term_slug)
        term_phrase_key = normalize_phrase(term_name)
        if term_slug_key in canonical_by_slug:
            matched_brand = canonical_by_slug[term_slug_key]
        elif term_phrase_key in canonical_by_phrase:
            matched_brand = canonical_by_phrase[term_phrase_key]

        if not matched_brand:
            skipped_terms[str(term_id)] = term_name
            continue

        buckets.setdefault(matched_brand.name, []).append((term_id, term_name, term_slug, count))

    active_map: Dict[str, ActiveBrandTerm] = {}
    alias_to_canonical: Dict[str, str] = {}
    for brand in canonical_brands:
        options = buckets.get(brand.name)
        if not options:
            continue
        term_id, term_name, term_slug, count = sorted(options, key=lambda row: (row[3], -row[0]), reverse=True)[0]
        aliases = {normalize_phrase(brand.name), normalize_phrase(term_name), normalize_phrase(term_slug.replace("-", " "))}
        for slug in brand.slugs:
            aliases.add(normalize_phrase(slug.replace("-", " ")))
            aliases.add(normalize_phrase(slug))

        clean_aliases = sorted(alias for alias in aliases if alias)
        active_map[brand.name] = ActiveBrandTerm(
            canonical_name=brand.name,
            term_id=term_id,
            term_name=term_name,
            term_slug=term_slug,
            count=count,
            aliases=clean_aliases,
        )
        for alias in clean_aliases:
            alias_to_canonical[alias] = brand.name
        alias_to_canonical[normalize_slug(term_slug).replace("-", " ")] = brand.name

    return active_map, alias_to_canonical


def load_missing_products(active_taxonomy: str, statuses: Sequence[str]) -> List[ProductRecord]:
    status_sql = ",".join(f"'{status}'" for status in statuses)
    other_brand_taxonomies = [t for t in KNOWN_BRAND_TAXONOMY_CANDIDATES if t != active_taxonomy]
    other_brand_sql = ",".join(f"'{taxonomy}'" for taxonomy in other_brand_taxonomies)
    rows = wp_db_query(
        f"""
        SELECT
          p.ID,
          p.post_status,
          p.post_title,
          p.post_name,
          MAX(CASE WHEN pm.meta_key = '_sku' THEN pm.meta_value END) AS sku,
          GROUP_CONCAT(DISTINCT CASE WHEN tt.taxonomy='product_cat' THEN t.name END SEPARATOR '||') AS categories,
          GROUP_CONCAT(DISTINCT CASE WHEN tt.taxonomy='product_tag' THEN t.name END SEPARATOR '||') AS tags,
          GROUP_CONCAT(
            DISTINCT CASE
              WHEN tt.taxonomy IN ({other_brand_sql})
              THEN CONCAT(tt.taxonomy, '::', t.term_id, '::', t.name, '::', t.slug)
            END
            SEPARATOR '||'
          ) AS secondary_brand_terms
        FROM wp4h_posts p
        LEFT JOIN wp4h_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_sku'
        LEFT JOIN wp4h_term_relationships tr ON tr.object_id = p.ID
        LEFT JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
        LEFT JOIN wp4h_terms t ON t.term_id = tt.term_id
        WHERE p.post_type='product'
          AND p.post_status IN ({status_sql})
          AND NOT EXISTS (
            SELECT 1
            FROM wp4h_term_relationships trb
            JOIN wp4h_term_taxonomy ttb ON ttb.term_taxonomy_id = trb.term_taxonomy_id
            WHERE trb.object_id = p.ID
              AND ttb.taxonomy = '{active_taxonomy}'
          )
        GROUP BY p.ID, p.post_status, p.post_title, p.post_name
        ORDER BY p.ID DESC
        """
    )

    products: List[ProductRecord] = []
    for row in rows:
        product_id, status, title, slug, sku, categories, tags, secondary = (row + ["", "", "", ""])[:8]
        secondary_terms: List[SecondaryBrandTerm] = []
        for chunk in (secondary or "").split("||"):
            if not chunk:
                continue
            pieces = chunk.split("::", 3)
            if len(pieces) != 4:
                continue
            taxonomy, term_id, term_name, term_slug = pieces
            secondary_terms.append(
                SecondaryBrandTerm(
                    taxonomy=taxonomy,
                    term_id=int(term_id),
                    name=clean_text(term_name),
                    slug=clean_text(term_slug),
                )
            )
        products.append(
            ProductRecord(
                product_id=int(product_id),
                status=clean_text(status),
                title=clean_text(title),
                slug=clean_text(slug),
                sku=clean_text(sku),
                categories=[clean_text(item) for item in (categories or "").split("||") if item],
                tags=[clean_text(item) for item in (tags or "").split("||") if item],
                secondary_brand_terms=secondary_terms,
            )
        )
    return products


def score_product(
    product: ProductRecord,
    active_terms: Dict[str, ActiveBrandTerm],
    alias_to_canonical: Dict[str, str],
) -> Tuple[Optional[Proposal], str]:
    title_phrase = normalize_phrase(product.title)
    slug_phrase = normalize_phrase(product.slug.replace("-", " "))
    tags_phrase = " | ".join(normalize_phrase(tag) for tag in product.tags if tag)
    categories_phrase = " | ".join(normalize_phrase(cat) for cat in product.categories if cat)

    candidates: List[Tuple[float, str, str, ActiveBrandTerm]] = []

    # Strongest evidence: another brand taxonomy already present on the product.
    for term in product.secondary_brand_terms:
        term_slug_key = normalize_slug(term.slug).replace("-", " ")
        term_name_key = normalize_phrase(term.name)
        canonical_name = alias_to_canonical.get(term_name_key) or alias_to_canonical.get(term_slug_key)
        if canonical_name and canonical_name in active_terms:
            active = active_terms[canonical_name]
            candidates.append((1.0, f"secondary_taxonomy:{term.taxonomy}", term.name, active))

    # Prefix match against title / slug for the live canonical term set.
    for active in active_terms.values():
        for alias in sorted(active.aliases, key=len, reverse=True):
            if not alias:
                continue
            title_prefix = starts_with_phrase(title_phrase, alias)
            slug_prefix = starts_with_phrase(slug_phrase, alias)
            if title_prefix and slug_prefix:
                candidates.append((0.99, "title+slug_prefix", alias, active))
                continue
            if title_prefix:
                candidates.append((0.97, "title_prefix", alias, active))
                continue
            if slug_prefix:
                candidates.append((0.95, "slug_prefix", alias, active))
                continue

            # Lower-confidence backstop: exact phrase in title, supported by tags/categories.
            if alias in GENERIC_CONTAINS_ALIASES or len(alias) < 4:
                continue
            in_title = contains_phrase(title_phrase, alias)
            supported = contains_phrase(tags_phrase, alias) or contains_phrase(categories_phrase, alias)
            if in_title and supported:
                candidates.append((0.91, "title_contains+term_support", alias, active))

    if not candidates:
        return None, "no_confident_match"

    ranked = sorted(candidates, key=lambda item: (item[0], len(item[2]), item[3].count), reverse=True)
    top_score, top_source, top_alias, top_term = ranked[0]

    for score, _, _, term in ranked[1:]:
        if term.term_id != top_term.term_id and score >= top_score - 0.02:
            return None, "ambiguous_multiple_brand_candidates"

    if top_score < 0.95:
        return None, "below_confidence_threshold"

    proposal = Proposal(
        product_id=product.product_id,
        status=product.status,
        title=product.title,
        slug=product.slug,
        sku=product.sku,
        taxonomy="",
        term_id=top_term.term_id,
        term_name=top_term.term_name,
        term_slug=top_term.term_slug,
        confidence=top_score,
        source=top_source,
        matched_alias=top_alias,
        categories=" | ".join(product.categories),
        tags=" | ".join(product.tags),
        secondary_brand_terms=" | ".join(
            f"{term.taxonomy}:{term.name}" for term in product.secondary_brand_terms
        ),
    )
    return proposal, "ok"


def ensure_output_dir(prefix: str) -> Path:
    stamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    out_dir = AUDIT_ROOT / f"{prefix}-{stamp}"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


def write_csv(path: Path, fieldnames: Sequence[str], rows: Iterable[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_detection_report(path: Path, detected_taxonomy: str, evidence_map: Dict[str, TaxonomyEvidence]) -> None:
    payload = {
        "detected_taxonomy": detected_taxonomy,
        "ranked_candidates": [
            {
                "taxonomy": evidence.taxonomy,
                "term_count": evidence.term_count,
                "product_count": evidence.product_count,
                "published_product_count": evidence.published_product_count,
                "code_hits": evidence.code_hits,
                "wc_attribute_name": evidence.wc_attribute_name,
                "score": evidence.score,
            }
            for evidence in sorted(evidence_map.values(), key=lambda item: item.score, reverse=True)
        ],
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def run_rollback(csv_path: Path) -> int:
    rows = list(csv.DictReader(csv_path.open("r", encoding="utf-8")))
    if not rows:
        print("Rollback CSV is empty.")
        return 0

    successes = 0
    failures = 0
    for row in rows:
        product_id = int(row["product_id"])
        taxonomy = row["taxonomy"]
        term_id = int(row["term_id"])
        try:
            wp_post_term_remove(product_id, taxonomy, term_id)
            successes += 1
        except subprocess.CalledProcessError as exc:
            failures += 1
            print(f"[ROLLBACK FAIL] product={product_id} taxonomy={taxonomy} term_id={term_id}: {exc.stderr.strip()}")

    print(f"Rollback complete: removed={successes} failed={failures}")
    return 0 if failures == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Safely assign missing WooCommerce product brands.")
    parser.add_argument("--apply", action="store_true", help="Actually write missing brand assignments. Default is dry-run.")
    parser.add_argument("--limit", type=int, default=0, help="Only inspect the first N missing products.")
    parser.add_argument(
        "--statuses",
        default="publish",
        help="Comma-separated post statuses to inspect. Default: publish",
    )
    parser.add_argument(
        "--rollback-csv",
        type=Path,
        help="Rollback a previous apply using the generated rollback CSV.",
    )
    args = parser.parse_args()

    if args.rollback_csv:
        return run_rollback(args.rollback_csv)

    detected_taxonomy, evidence_map = detect_brand_taxonomy()
    print(f"Detected active brand taxonomy: {detected_taxonomy}")

    active_terms, alias_to_canonical = build_active_brand_map(detected_taxonomy)
    if not active_terms:
        print("No canonical live brand terms could be mapped from the detected taxonomy. Aborting.")
        return 1

    statuses = [status.strip() for status in args.statuses.split(",") if status.strip()]
    missing_products = load_missing_products(detected_taxonomy, statuses)
    if args.limit > 0:
        missing_products = missing_products[: args.limit]

    output_dir = ensure_output_dir("brand-fill")
    print(f"Output directory: {output_dir}")
    write_detection_report(output_dir / "taxonomy-detection.json", detected_taxonomy, evidence_map)

    missing_rows = [
        {
            "product_id": product.product_id,
            "status": product.status,
            "title": product.title,
            "slug": product.slug,
            "sku": product.sku,
            "categories": " | ".join(product.categories),
            "tags": " | ".join(product.tags),
            "secondary_brand_terms": " | ".join(
                f"{term.taxonomy}:{term.name}" for term in product.secondary_brand_terms
            ),
        }
        for product in missing_products
    ]
    write_csv(
        output_dir / "missing-products.csv",
        ["product_id", "status", "title", "slug", "sku", "categories", "tags", "secondary_brand_terms"],
        missing_rows,
    )

    proposals: List[Proposal] = []
    skipped_rows: List[dict] = []
    for product in missing_products:
        proposal, status = score_product(product, active_terms, alias_to_canonical)
        if proposal:
            proposal.taxonomy = detected_taxonomy
            proposals.append(proposal)
        else:
            skipped_rows.append(
                {
                    "product_id": product.product_id,
                    "status": product.status,
                    "title": product.title,
                    "slug": product.slug,
                    "sku": product.sku,
                    "skip_reason": status,
                    "categories": " | ".join(product.categories),
                    "tags": " | ".join(product.tags),
                    "secondary_brand_terms": " | ".join(
                        f"{term.taxonomy}:{term.name}" for term in product.secondary_brand_terms
                    ),
                }
            )

    write_csv(
        output_dir / "proposed-assignments.csv",
        [
            "product_id",
            "status",
            "title",
            "slug",
            "sku",
            "taxonomy",
            "term_id",
            "term_name",
            "term_slug",
            "confidence",
            "source",
            "matched_alias",
            "categories",
            "tags",
            "secondary_brand_terms",
        ],
        [proposal.__dict__ for proposal in proposals],
    )
    write_csv(
        output_dir / "skipped-products.csv",
        ["product_id", "status", "title", "slug", "sku", "skip_reason", "categories", "tags", "secondary_brand_terms"],
        skipped_rows,
    )

    print(
        f"Dry-run summary: missing={len(missing_products)} proposed={len(proposals)} skipped={len(skipped_rows)} "
        f"apply_mode={'yes' if args.apply else 'no'}"
    )

    for proposal in proposals[:25]:
        print(
            f"[PROPOSE] product={proposal.product_id} brand={proposal.term_name} "
            f"confidence={proposal.confidence:.2f} source={proposal.source} title={proposal.title}"
        )

    if not args.apply:
        print("Dry-run only. No WordPress data was changed.")
        return 0

    apply_results: List[dict] = []
    rollback_rows: List[dict] = []
    for proposal in proposals:
        try:
            wp_post_term_set(proposal.product_id, proposal.taxonomy, proposal.term_id)
            apply_results.append(
                {
                    "product_id": proposal.product_id,
                    "status": "applied",
                    "taxonomy": proposal.taxonomy,
                    "term_id": proposal.term_id,
                    "term_name": proposal.term_name,
                    "confidence": proposal.confidence,
                    "source": proposal.source,
                    "title": proposal.title,
                }
            )
            rollback_rows.append(
                {
                    "product_id": proposal.product_id,
                    "taxonomy": proposal.taxonomy,
                    "term_id": proposal.term_id,
                    "term_name": proposal.term_name,
                }
            )
        except subprocess.CalledProcessError as exc:
            apply_results.append(
                {
                    "product_id": proposal.product_id,
                    "status": "failed",
                    "taxonomy": proposal.taxonomy,
                    "term_id": proposal.term_id,
                    "term_name": proposal.term_name,
                    "confidence": proposal.confidence,
                    "source": proposal.source,
                    "title": proposal.title,
                    "error": exc.stderr.strip(),
                }
            )

    write_csv(
        output_dir / "apply-results.csv",
        ["product_id", "status", "taxonomy", "term_id", "term_name", "confidence", "source", "title", "error"],
        apply_results,
    )
    write_csv(
        output_dir / "rollback.csv",
        ["product_id", "taxonomy", "term_id", "term_name"],
        rollback_rows,
    )

    applied = sum(1 for row in apply_results if row["status"] == "applied")
    failed = sum(1 for row in apply_results if row["status"] == "failed")
    print(f"Apply complete: applied={applied} failed={failed}")
    print(f"Rollback CSV: {output_dir / 'rollback.csv'}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
