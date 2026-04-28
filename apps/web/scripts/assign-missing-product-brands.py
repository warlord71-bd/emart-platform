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
    whitelist_backed: bool = True


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
    action: str = "assign_existing_term"
    create_term_name: str = ""
    create_term_slug: str = ""


@dataclass
class ReferenceBrandHint:
    product_id: int
    brand_name: str
    source_label: str
    confidence: float


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


def wp_term_create(taxonomy: str, name: str, slug: str) -> int:
    proc = run_command(
        [
            "wp",
            f"--path={WP_PATH}",
            "--allow-root",
            "term",
            "create",
            taxonomy,
            name,
            f"--slug={slug}",
            "--porcelain",
        ]
    )
    return int(clean_text(proc.stdout))


def wp_term_delete(taxonomy: str, term_id: int) -> subprocess.CompletedProcess[str]:
    return run_command(
        [
            "wp",
            f"--path={WP_PATH}",
            "--allow-root",
            "term",
            "delete",
            taxonomy,
            str(term_id),
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


def sql_quote(value: object) -> str:
    return str(value).replace("\\", "\\\\").replace("'", "''")


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


def load_taxonomy_terms(taxonomy: str) -> List[Tuple[int, str, str, int]]:
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


def load_active_brand_terms(taxonomy: str) -> List[Tuple[int, str, str, int]]:
    return load_taxonomy_terms(taxonomy)


def build_active_brand_map(
    taxonomy: str,
) -> Tuple[Dict[str, ActiveBrandTerm], Dict[str, str], Dict[str, ActiveBrandTerm]]:
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
    direct_term_map: Dict[str, ActiveBrandTerm] = {}
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
            whitelist_backed=True,
        )
        for alias in clean_aliases:
            alias_to_canonical[alias] = brand.name
        alias_to_canonical[normalize_slug(term_slug).replace("-", " ")] = brand.name

    for term_id, term_name, term_slug, count in active_terms:
        existing = next(
            (term for term in active_map.values() if term.term_id == term_id),
            None,
        )
        term = existing or ActiveBrandTerm(
            canonical_name=term_name,
            term_id=term_id,
            term_name=term_name,
            term_slug=term_slug,
            count=count,
            aliases=sorted(
                {
                    normalize_phrase(term_name),
                    normalize_phrase(term_slug.replace("-", " ")),
                    normalize_slug(term_slug).replace("-", " "),
                }
            ),
            whitelist_backed=False,
        )
        direct_term_map[normalize_phrase(term_name)] = term
        direct_term_map[normalize_slug(term_slug).replace("-", " ")] = term

    return active_map, alias_to_canonical, direct_term_map


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


def find_active_term_by_name_or_slug(taxonomy: str, name: str, slug: str) -> Optional[Tuple[int, str, str, int]]:
    rows = wp_db_query(
        f"""
        SELECT t.term_id, t.name, t.slug, tt.count
        FROM wp4h_terms t
        JOIN wp4h_term_taxonomy tt ON tt.term_id = t.term_id
        WHERE tt.taxonomy = '{sql_quote(taxonomy)}'
          AND (LOWER(t.name) = LOWER('{sql_quote(name)}') OR LOWER(t.slug) = LOWER('{sql_quote(slug)}'))
        ORDER BY tt.count DESC, t.term_id ASC
        LIMIT 1
        """
    )
    if not rows or len(rows[0]) < 4:
        return None
    term_id, term_name, term_slug, count = rows[0][:4]
    return int(term_id), clean_text(term_name), clean_text(term_slug), int(count or 0)


def build_createable_brand_candidates(
    products: Sequence[ProductRecord],
    active_terms: Dict[str, ActiveBrandTerm],
    alias_to_canonical: Dict[str, str],
    direct_term_map: Dict[str, ActiveBrandTerm],
) -> Dict[str, SecondaryBrandTerm]:
    candidate_counts: Dict[Tuple[str, str], int] = {}
    candidate_terms: Dict[Tuple[str, str], SecondaryBrandTerm] = {}

    for product in products:
        for term in product.secondary_brand_terms:
            term_slug_key = normalize_slug(term.slug).replace("-", " ")
            term_name_key = normalize_phrase(term.name)
            canonical_name = alias_to_canonical.get(term_name_key) or alias_to_canonical.get(term_slug_key)
            if canonical_name and canonical_name in active_terms:
                continue
            if direct_term_map.get(term_name_key) or direct_term_map.get(term_slug_key):
                continue

            key = (term_name_key, term_slug_key)
            candidate_counts[key] = candidate_counts.get(key, 0) + 1
            candidate_terms[key] = term

    createable_by_alias: Dict[str, SecondaryBrandTerm] = {}
    for key, count in candidate_counts.items():
        if count < 2:
            continue
        term = candidate_terms[key]
        for alias in {
            normalize_phrase(term.name),
            normalize_phrase(term.slug.replace("-", " ")),
            normalize_slug(term.slug).replace("-", " "),
        }:
            if alias:
                createable_by_alias[alias] = term
    return createable_by_alias


def build_trusted_title_inference_terms(active_terms: Dict[str, ActiveBrandTerm]) -> Dict[str, ActiveBrandTerm]:
    product_brand_terms = load_taxonomy_terms("product_brand")
    trusted_secondary_aliases = set()
    for _, name, slug, _ in product_brand_terms:
        trusted_secondary_aliases.add(normalize_phrase(name))
        trusted_secondary_aliases.add(normalize_phrase(slug.replace("-", " ")))
        trusted_secondary_aliases.add(normalize_slug(slug).replace("-", " "))

    trusted_terms: Dict[str, ActiveBrandTerm] = {}
    for key, active in active_terms.items():
        aliases = {
            normalize_phrase(active.canonical_name),
            normalize_phrase(active.term_name),
            normalize_phrase(active.term_slug.replace("-", " ")),
            normalize_slug(active.term_slug).replace("-", " "),
        }
        product_brand_backed = bool(aliases & trusted_secondary_aliases)
        established_active_brand = active.count >= 5
        normalized_name = normalize_phrase(active.term_name)
        tokens = [token for token in normalized_name.split() if token and token not in {"of", "and", "the", "by", "s"}]
        suspicious_keywords = {
            "aha",
            "bha",
            "pha",
            "collagen",
            "glutathion",
            "glutathione",
            "hyluronic",
            "hyaluronic",
            "whitening",
            "brightening",
            "aqua",
            "cream",
            "serum",
            "toner",
            "mask",
            "soap",
            "sunstick",
            "sunstick",
            "sun",
            "melasma",
            "3d",
            "x",
        }
        contains_digits = any(char.isdigit() for char in normalized_name)
        suspicious_phrase = (
            not product_brand_backed
            and active.count < 5
            and (
                contains_digits
                or any(token in suspicious_keywords for token in tokens)
                or len(tokens) >= 4
            )
        )
        if not suspicious_phrase and (product_brand_backed or established_active_brand or active.whitelist_backed):
            trusted_terms[key] = active
    return trusted_terms


def score_product(
    product: ProductRecord,
    active_taxonomy: str,
    active_terms: Dict[str, ActiveBrandTerm],
    title_inference_terms: Dict[str, ActiveBrandTerm],
    alias_to_canonical: Dict[str, str],
    direct_term_map: Dict[str, ActiveBrandTerm],
    createable_brand_candidates: Dict[str, SecondaryBrandTerm],
    reference_hints: Optional[Dict[int, ReferenceBrandHint]] = None,
) -> Tuple[Optional[Proposal], str]:
    title_phrase = normalize_phrase(product.title)
    slug_phrase = normalize_phrase(product.slug.replace("-", " "))
    tags_phrase = " | ".join(normalize_phrase(tag) for tag in product.tags if tag)
    categories_phrase = " | ".join(normalize_phrase(cat) for cat in product.categories if cat)

    candidates: List[Tuple[float, str, str, ActiveBrandTerm]] = []
    saw_secondary_brand_without_active_term = False
    create_term_candidate: Optional[SecondaryBrandTerm] = None

    if reference_hints and product.product_id in reference_hints:
        hint = reference_hints[product.product_id]
        active = active_terms.get(hint.brand_name)
        if active:
            candidates.append((hint.confidence, hint.source_label, hint.brand_name, active))

    # Strongest evidence: another brand taxonomy already present on the product.
    for term in product.secondary_brand_terms:
        term_slug_key = normalize_slug(term.slug).replace("-", " ")
        term_name_key = normalize_phrase(term.name)
        canonical_name = alias_to_canonical.get(term_name_key) or alias_to_canonical.get(term_slug_key)
        if canonical_name and canonical_name in active_terms:
            active = active_terms[canonical_name]
            candidates.append((1.0, f"secondary_taxonomy:{term.taxonomy}", term.name, active))
            continue

        direct_active = direct_term_map.get(term_name_key) or direct_term_map.get(term_slug_key)
        if direct_active:
            candidates.append((0.995, f"secondary_taxonomy_direct:{term.taxonomy}", term.name, direct_active))
        else:
            saw_secondary_brand_without_active_term = True
            if create_term_candidate is None:
                create_term_candidate = term

    # Prefix match against title / slug for the live canonical term set.
    for active in title_inference_terms.values():
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
        for alias, secondary_term in sorted(createable_brand_candidates.items(), key=lambda item: len(item[0]), reverse=True):
            if not alias:
                continue
            if starts_with_phrase(title_phrase, alias) or starts_with_phrase(slug_phrase, alias):
                proposal = Proposal(
                    product_id=product.product_id,
                    status=product.status,
                    title=product.title,
                    slug=product.slug,
                    sku=product.sku,
                    taxonomy=active_taxonomy,
                    term_id=0,
                    term_name=secondary_term.name,
                    term_slug=normalize_slug(secondary_term.slug or secondary_term.name),
                    confidence=0.955,
                    source=f"title_prefix_create_active_term:{secondary_term.taxonomy}",
                    matched_alias=alias,
                    categories=" | ".join(product.categories),
                    tags=" | ".join(product.tags),
                    secondary_brand_terms=" | ".join(
                        f"{term.taxonomy}:{term.name}" for term in product.secondary_brand_terms
                    ),
                    action="create_term_then_assign",
                    create_term_name=secondary_term.name,
                    create_term_slug=normalize_slug(secondary_term.slug or secondary_term.name),
                )
                return proposal, "ok"

        if create_term_candidate:
            proposal = Proposal(
                product_id=product.product_id,
                status=product.status,
                title=product.title,
                slug=product.slug,
                sku=product.sku,
                taxonomy=active_taxonomy,
                term_id=0,
                term_name=create_term_candidate.name,
                term_slug=normalize_slug(create_term_candidate.slug or create_term_candidate.name),
                confidence=0.965,
                source=f"secondary_taxonomy_create_active_term:{create_term_candidate.taxonomy}",
                matched_alias=create_term_candidate.name,
                categories=" | ".join(product.categories),
                tags=" | ".join(product.tags),
                secondary_brand_terms=" | ".join(
                    f"{term.taxonomy}:{term.name}" for term in product.secondary_brand_terms
                ),
                action="create_term_then_assign",
                create_term_name=create_term_candidate.name,
                create_term_slug=normalize_slug(create_term_candidate.slug or create_term_candidate.name),
            )
            return proposal, "ok"
        if saw_secondary_brand_without_active_term:
            return None, "secondary_brand_missing_active_pa_brand_term"
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


def load_reference_hints(
    csv_paths: Sequence[Path],
    active_terms: Dict[str, ActiveBrandTerm],
    alias_to_canonical: Dict[str, str],
) -> Dict[int, ReferenceBrandHint]:
    hints: Dict[int, ReferenceBrandHint] = {}
    for csv_path in csv_paths:
        if not csv_path.exists():
            print(f"[WARN] reference CSV not found: {csv_path}")
            continue

        with csv_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                raw_product_id = clean_text(row.get("product_id", ""))
                if not raw_product_id.isdigit():
                    continue

                product_id = int(raw_product_id)
                candidates = [
                    clean_text(row.get("correct_brand", "")),
                    clean_text(row.get("corrected_brand", "")),
                    clean_text(row.get("edited_brand", "")),
                ]
                brand_value = next((value for value in candidates if value), "")
                if not brand_value:
                    continue

                canonical_name = (
                    alias_to_canonical.get(normalize_phrase(brand_value))
                    or alias_to_canonical.get(normalize_slug(brand_value).replace("-", " "))
                )
                if not canonical_name or canonical_name not in active_terms:
                    continue

                safe_flag = clean_text(row.get("safe", "")).lower()
                review_issue = clean_text(row.get("review_issue", ""))
                confidence = 0.985 if safe_flag == "true" else 0.955
                source_label = f"reference_csv:{csv_path.name}"
                if review_issue:
                    source_label = f"{source_label}:{review_issue}"

                existing = hints.get(product_id)
                if existing and existing.confidence >= confidence:
                    continue

                hints[product_id] = ReferenceBrandHint(
                    product_id=product_id,
                    brand_name=canonical_name,
                    source_label=source_label,
                    confidence=confidence,
                )
    return hints


def run_rollback(csv_path: Path) -> int:
    rows = list(csv.DictReader(csv_path.open("r", encoding="utf-8")))
    if not rows:
        print("Rollback CSV is empty.")
        return 0

    successes = 0
    failures = 0
    for row in rows:
        action = clean_text(row.get("action", "")) or "remove_assignment"
        taxonomy = row["taxonomy"]
        term_id = int(row["term_id"])
        try:
            if action == "delete_term_if_empty":
                wp_term_delete(taxonomy, term_id)
            else:
                product_id = int(row["product_id"])
                wp_post_term_remove(product_id, taxonomy, term_id)
            successes += 1
        except subprocess.CalledProcessError as exc:
            failures += 1
            product_id = clean_text(row.get("product_id", ""))
            print(
                f"[ROLLBACK FAIL] action={action} product={product_id or '-'} "
                f"taxonomy={taxonomy} term_id={term_id}: {exc.stderr.strip()}"
            )

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
    parser.add_argument(
        "--reference-csv",
        action="append",
        default=[],
        type=Path,
        help="Optional reviewed CSV reference file. Can be passed more than once.",
    )
    parser.add_argument(
        "--allow-create-active-terms",
        action="store_true",
        help="Allow creating missing active brand terms when a product already has a matching secondary brand taxonomy term.",
    )
    parser.add_argument(
        "--actions",
        default="",
        help="Optional comma-separated proposal actions to include, e.g. assign_existing_term or create_term_then_assign.",
    )
    args = parser.parse_args()

    if args.rollback_csv:
        return run_rollback(args.rollback_csv)

    detected_taxonomy, evidence_map = detect_brand_taxonomy()
    print(f"Detected active brand taxonomy: {detected_taxonomy}")

    active_terms, alias_to_canonical, direct_term_map = build_active_brand_map(detected_taxonomy)
    if not active_terms:
        print("No canonical live brand terms could be mapped from the detected taxonomy. Aborting.")
        return 1
    title_inference_terms = build_trusted_title_inference_terms(active_terms)

    reference_hints = load_reference_hints(args.reference_csv, active_terms, alias_to_canonical)
    if reference_hints:
        print(f"Loaded reference hints for {len(reference_hints)} products from {len(args.reference_csv)} CSV file(s)")

    statuses = [status.strip() for status in args.statuses.split(",") if status.strip()]
    missing_products = load_missing_products(detected_taxonomy, statuses)
    createable_brand_candidates = build_createable_brand_candidates(
        missing_products,
        active_terms,
        alias_to_canonical,
        direct_term_map,
    )
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
        proposal, status = score_product(
            product,
            detected_taxonomy,
            active_terms,
            title_inference_terms,
            alias_to_canonical,
            direct_term_map,
            createable_brand_candidates,
            reference_hints,
        )
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

    allowed_actions = {item.strip() for item in args.actions.split(",") if item.strip()}
    if allowed_actions:
        proposals = [proposal for proposal in proposals if proposal.action in allowed_actions]

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
            "action",
            "create_term_name",
            "create_term_slug",
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
    if allowed_actions:
        print(f"Action filter: {', '.join(sorted(allowed_actions))}")

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
    created_terms: Dict[Tuple[str, str], Tuple[int, str]] = {}
    for proposal in proposals:
        try:
            target_term_id = proposal.term_id
            if proposal.action == "create_term_then_assign":
                if not args.allow_create_active_terms:
                    apply_results.append(
                        {
                            "product_id": proposal.product_id,
                            "status": "skipped_create_not_allowed",
                            "taxonomy": proposal.taxonomy,
                            "term_id": "",
                            "term_name": proposal.create_term_name or proposal.term_name,
                            "confidence": proposal.confidence,
                            "source": proposal.source,
                            "title": proposal.title,
                            "error": "Run with --allow-create-active-terms to create missing active brand terms.",
                            "action": proposal.action,
                        }
                    )
                    continue

                create_key = (proposal.taxonomy, proposal.create_term_slug or proposal.term_slug)
                if create_key in created_terms:
                    target_term_id = created_terms[create_key][0]
                else:
                    existing_term = find_active_term_by_name_or_slug(
                        proposal.taxonomy,
                        proposal.create_term_name or proposal.term_name,
                        proposal.create_term_slug or proposal.term_slug,
                    )
                    if existing_term:
                        target_term_id = existing_term[0]
                    else:
                        target_term_id = wp_term_create(
                            proposal.taxonomy,
                            proposal.create_term_name or proposal.term_name,
                            proposal.create_term_slug or proposal.term_slug,
                        )
                        created_terms[create_key] = (
                            target_term_id,
                            proposal.create_term_name or proposal.term_name,
                        )
                        rollback_rows.append(
                            {
                                "action": "delete_term_if_empty",
                                "product_id": "",
                                "taxonomy": proposal.taxonomy,
                                "term_id": target_term_id,
                                "term_name": proposal.create_term_name or proposal.term_name,
                            }
                        )

            wp_post_term_set(proposal.product_id, proposal.taxonomy, target_term_id)
            apply_results.append(
                {
                    "product_id": proposal.product_id,
                    "status": "applied",
                    "taxonomy": proposal.taxonomy,
                    "term_id": target_term_id,
                    "term_name": proposal.create_term_name or proposal.term_name,
                    "confidence": proposal.confidence,
                    "source": proposal.source,
                    "title": proposal.title,
                    "error": "",
                    "action": proposal.action,
                }
            )
            rollback_rows.append(
                {
                    "action": "remove_assignment",
                    "product_id": proposal.product_id,
                    "taxonomy": proposal.taxonomy,
                    "term_id": target_term_id,
                    "term_name": proposal.create_term_name or proposal.term_name,
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
                    "action": proposal.action,
                }
            )

    write_csv(
        output_dir / "apply-results.csv",
        ["product_id", "status", "taxonomy", "term_id", "term_name", "confidence", "source", "title", "error", "action"],
        apply_results,
    )
    write_csv(
        output_dir / "rollback.csv",
        ["action", "product_id", "taxonomy", "term_id", "term_name"],
        rollback_rows,
    )

    applied = sum(1 for row in apply_results if row["status"] == "applied")
    failed = sum(1 for row in apply_results if row["status"] == "failed")
    print(f"Apply complete: applied={applied} failed={failed}")
    print(f"Rollback CSV: {output_dir / 'rollback.csv'}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
