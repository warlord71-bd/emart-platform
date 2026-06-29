#!/usr/bin/env python3
"""
Provider router — turns the tier dials in config/providers.json into a concrete choice per job.

pick(capability, tier_target, remaining_budget) returns the provider dict for the requested tier
if it is enabled and affordable, otherwise falls DOWN to the next cheaper enabled tier so a job
never hard-fails (the free tier is always enabled and $0). This is what makes free<->mid<->premium
swappable per job with zero code change.
"""
from __future__ import annotations
import json, os
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config" / "providers.json"
TIER_ORDER = ["premium", "mid", "free"]  # most→least expensive


def load_config(path: Path = CONFIG) -> dict:
    return json.loads(Path(path).read_text())


def _tier_chain(tier_target: str) -> list[str]:
    """tiers to try, from tier_target downward to free."""
    if tier_target not in TIER_ORDER:
        tier_target = "free"
    start = TIER_ORDER.index(tier_target)
    return TIER_ORDER[start:]  # e.g. premium -> [premium, mid, free]


def pick(capability: str, tier_target: str = "free", remaining_budget: float = 0.0,
         units: float = 1.0, cfg: dict | None = None) -> dict:
    cfg = cfg or load_config()
    caps = cfg["capabilities"].get(capability, {})
    for tier in _tier_chain(tier_target):
        # config may key tiers as free/mid/premium plus suffixed variants (mid_api etc.)
        for key, prov in caps.items():
            if key == "_doc" or not isinstance(prov, dict):
                continue
            if not key.startswith(tier):
                continue
            if not prov.get("enabled"):
                continue
            env = prov.get("env")
            if env and not os.environ.get(env):
                continue  # key missing -> can't use this tier
            cost = prov.get("cost_per", 0.0) * units
            if cost > 0 and cost > remaining_budget:
                continue  # over budget -> fall to cheaper tier
            return {"capability": capability, "tier": tier, "key": key,
                    "cost": cost, **prov}
    # guaranteed free fallback
    return {"capability": capability, "tier": "free", "key": "free",
            "provider": "none", "cost": 0.0, "enabled": True}


def guardrails(cfg: dict | None = None) -> dict:
    cfg = cfg or load_config()
    return cfg.get("guardrails", {})


if __name__ == "__main__":
    import sys
    cap = sys.argv[1] if len(sys.argv) > 1 else "image"
    tier = sys.argv[2] if len(sys.argv) > 2 else "free"
    print(json.dumps(pick(cap, tier, remaining_budget=10.0), indent=2))
