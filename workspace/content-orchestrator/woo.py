#!/usr/bin/env python3
"""
woo.py — read-only Woo demand resolvers for the Content Orchestrator.

Reuses the Social Engine's tested read-only client (`woo_get`) so there is ONE Woo client and ONE
credential source. Never writes Woo. Every function degrades to [] on any error so the orchestrator
falls back to placeholders instead of crashing.
"""
from __future__ import annotations
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
_SE = _ROOT / "social-engine"
if str(_SE) not in sys.path:
    sys.path.insert(0, str(_SE))


def _woo_get(path: str):
    from social_engine.engine import woo_get  # imported lazily so module loads without creds
    return woo_get(path)


def available() -> bool:
    try:
        _woo_get("products?per_page=1&status=publish")
        return True
    except Exception:
        return False


def _norm(p: dict, source: str, score=None) -> dict:
    return {
        "product_id": p.get("id"),
        "name": p.get("name"),
        "slug": p.get("slug"),
        "topic": None,
        "source": source,
        "signal_score": score if score is not None else p.get("total_sales"),
    }


def _instock(n: int, extra: str, source: str) -> list[dict]:
    try:
        rows = _woo_get(f"products?per_page={n}&status=publish&stock_status=instock&{extra}")
        return [_norm(p, source) for p in rows][:n]
    except Exception:
        return []


def new_arrivals(n: int) -> list[dict]:
    return _instock(n, "orderby=date&order=desc", "woo_new_arrivals")


def clearance(n: int) -> list[dict]:
    # on_sale reflects real Woo sale prices only. Catalog sales were cleared 2026-05-08, so this is
    # normally empty until the owner enables sale prices — that is the correct, honest result.
    return _instock(n, "on_sale=true&orderby=date&order=desc", "woo_clearance")


def _category_id(slug: str):
    try:
        rows = _woo_get(f"products/categories?slug={slug}")
        return rows[0]["id"] if rows else None
    except Exception:
        return None


def by_category(slugs: list[str], n: int) -> list[dict]:
    for slug in slugs or []:
        cid = _category_id(slug)
        if cid:
            out = _instock(n, f"category={cid}&orderby=popularity", f"woo_cat_{slug}")
            if out:
                return out
    return []


def by_concern(n: int) -> list[dict]:
    # Resolve the pa_concern attribute, pick the first term that has products, fetch by it.
    try:
        attrs = _woo_get("products/attributes")
        aid = next((a["id"] for a in attrs if a.get("slug") in ("pa_concern", "concern")), None)
        if not aid:
            return []
        terms = _woo_get(f"products/attributes/{aid}/terms?orderby=count&order=desc&per_page=5")
        for t in terms:
            out = _instock(n, f"attribute=pa_concern&attribute_term={t['id']}&orderby=popularity",
                           f"woo_concern_{t.get('slug')}")
            for c in out:
                c["topic"] = t.get("name")
            if out:
                return out
        return []
    except Exception:
        return []


def resolve_slug_id(slug: str):
    """CO-3: turn a product slug into a numeric id (for perf-file candidates keyed by slug)."""
    if not slug:
        return None
    try:
        rows = _woo_get(f"products?slug={slug}&status=publish")
        return rows[0]["id"] if rows else None
    except Exception:
        return None
