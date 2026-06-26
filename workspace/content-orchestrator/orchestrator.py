#!/usr/bin/env python3
"""
Emart Content Orchestrator — the strategy brain above the generation engines.

It does NOT generate creative, post anything, or write Woo data. It decides WHAT to
make from demand signals, then DISPATCHES native job specs to the existing engines,
parked at the existing approval gates:

    themes.json (strategy)  →  demand resolvers (read-only signals)
        →  plan (content calendar)  →  dispatch (native job specs, dry-run)
        →  owner approval gate  →  existing engine publishes  →  ledger + measurement

Engines it routes to (all already built; this layer only wires them):
    social  → workspace/social-engine        (FB/IG campaign plan, approval-gated)
    video   → workspace/video-engine          (reel queue job, Telegram-approval-gated)
    blog    → workspace/docs blog generator   (draft-gated)
    seo     → category guides / ingredient / best (content-lifecycle gated)
    creative→ workspace/creative-engine        (appearance layer, called by social/video)

Subcommands:
    themes              show the strategy taxonomy
    plan                build a content calendar for a date window (dry-run)
    dispatch            emit native job specs for an approved plan (dry-run, staged)
    status              dashboard of plans/dispatch/gates

Safety: dry-run by default. --live-signals lets demand resolvers call read-only Woo/GSC.
Nothing here publishes or writes commerce data.
"""
from __future__ import annotations
import argparse, json, subprocess, sys, datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent
THEMES_FILE = ROOT / "themes.json"
PLANS_DIR = ROOT / "plans"
DISPATCH_DIR = ROOT / "dispatch"

SOCIAL_PERF = WORKSPACE / "social-engine" / "performance" / "latest.json"
GSC_STRIKING = WORKSPACE / "seo-review" / "striking-distance.json"
REVIEWS_FILE = WORKSPACE / "social-engine" / "performance" / "reviews-latest.json"
VIDEO_QUEUE = WORKSPACE / "video-engine" / "jobs" / "queue"
SOCIAL_CAMPAIGNS = WORKSPACE / "social-engine" / "campaigns"
LEDGER_HELPER = WORKSPACE / "ledgers" / "ledger_helper.py"
LEDGER_FILE = WORKSPACE / "ledgers" / "action-events.jsonl"
WEIGHTS_FILE = ROOT / "theme_weights.json"

try:
    import brain  # optional LLM layer (Hermes / OpenRouter free chain / OpenClaw)
except Exception:
    brain = None

try:
    import woo  # read-only Woo demand resolvers (reuses Social Engine client)
except Exception:
    woo = None


def _load_weights() -> dict:
    """Self-improving feedback: per-theme multipliers learned from outcomes (default 1.0)."""
    if WEIGHTS_FILE.exists():
        try:
            return json.loads(WEIGHTS_FILE.read_text()).get("weights", {})
        except Exception:
            return {}
    return {}


def _today() -> str:
    return dt.date.today().strftime("%Y-%m-%d")


def _load_themes() -> dict:
    return json.loads(THEMES_FILE.read_text())


# ---------------------------------------------------------------------------
# Demand resolvers — read-only. Each returns a list of candidate dicts:
#   {"product_id": int|None, "name": str, "slug": str, "topic": str|None,
#    "source": str, "signal_score": float|None}
# They degrade gracefully: if a live signal is unavailable they return placeholder
# candidates flagged source="placeholder" so the planner still runs end-to-end.
# ---------------------------------------------------------------------------

def _placeholder(theme: dict, n: int, why: str) -> list[dict]:
    return [
        {"product_id": None, "name": f"<{theme['id']} candidate {i+1}>",
         "slug": None, "topic": None, "source": "placeholder", "signal_score": None,
         "note": why}
        for i in range(n)
    ]


def _perf_top(n: int, live: bool = False) -> list[dict]:
    if not SOCIAL_PERF.exists():
        return []
    data = json.loads(SOCIAL_PERF.read_text())
    prods = data.get("products", {})
    scored = []
    for key, val in prods.items():
        score = val.get("score") if isinstance(val, dict) else val
        scored.append((key, float(score) if score is not None else 0.0))
    scored.sort(key=lambda x: x[1], reverse=True)
    out = []
    for key, score in scored[:n]:
        pid = int(key) if str(key).isdigit() else None
        slug = None if pid else str(key)
        # CO-3: resolve slug→id against live Woo so Social/Video jobs carry numeric IDs
        if live and pid is None and woo is not None:
            pid = woo.resolve_slug_id(slug)
        out.append({"product_id": pid, "name": str(key), "slug": slug,
                    "topic": None, "source": "performance_scores", "signal_score": score})
    return out


def _gsc_trending(n: int) -> list[dict]:
    if not GSC_STRIKING.exists():
        return []
    try:
        data = json.loads(GSC_STRIKING.read_text())
    except Exception:
        return []
    rows = data if isinstance(data, list) else data.get("pages", [])
    out = []
    for r in rows[:n]:
        out.append({"product_id": None, "name": r.get("query") or r.get("page", "trend"),
                    "slug": r.get("page"), "topic": r.get("query"),
                    "source": "gsc_striking_distance",
                    "signal_score": r.get("impressions")})
    return out


def _reviews(n: int) -> list[dict]:
    if not REVIEWS_FILE.exists():
        return []
    data = json.loads(REVIEWS_FILE.read_text())
    rows = data if isinstance(data, list) else data.get("reviews", [])
    out = []
    for r in rows[:n]:
        out.append({"product_id": r.get("product_id"), "name": r.get("product") or "review",
                    "slug": r.get("slug"), "topic": r.get("excerpt"),
                    "source": "judgeme", "signal_score": r.get("rating")})
    return out


# Map demand_signal id -> resolver. Resolvers that need live Woo/GSC are only
# attempted when --live-signals is set; otherwise they fall back to cached files
# or placeholders. This keeps the orchestrator runnable and freeze-safe by default.
def _live(fn, theme, n, live, why):
    """Run a live Woo resolver when --live-signals + woo client available; else placeholder."""
    if live and woo is not None:
        try:
            out = fn(n)
            if out:
                return out
        except Exception:
            pass
    return _placeholder(theme, n, why if not live else f"{why} (live returned none)")


DEMAND_RESOLVERS = {
    "performance_scores": lambda theme, n, live: _perf_top(n, live) or _placeholder(theme, n, "no performance/latest.json yet"),
    "gsc_trending":       lambda theme, n, live: _gsc_trending(n) or _placeholder(theme, n, "no striking-distance export yet"),
    "reviews_judgeme":    lambda theme, n, live: _reviews(n) or _placeholder(theme, n, "no reviews export yet"),
    "new_arrivals_woo_date": lambda theme, n, live: _live(woo.new_arrivals if woo else None, theme, n, live, "Woo orderby=date read-only"),
    "clearance_woo_sale":    lambda theme, n, live: _live(woo.clearance if woo else None, theme, n, live, "owner must enable Woo sale prices first"),
    "category_catalog":      lambda theme, n, live: _live((lambda k: woo.by_category(theme.get("category_filter", []), k)) if woo else None, theme, n, live, f"Woo category pick {theme.get('category_filter')}"),
    "concern_catalog":       lambda theme, n, live: _live(woo.by_concern if woo else None, theme, n, live, "pa_concern catalog pick"),
    "ingredients_catalog":   lambda theme, n, live: _placeholder(theme, n, "wire: pa_ingredient / ingredient pages"),
    "owner_manual":          lambda theme, n, live: _placeholder(theme, n, "owner defines prize/rules/dates"),
}


# ---------------------------------------------------------------------------
# Planner
# ---------------------------------------------------------------------------

def _theme_due(theme: dict, day_index: int) -> bool:
    """A theme is due on days where day_index % cadence_days == 0."""
    cad = max(1, int(theme.get("cadence_days", 1)))
    return day_index % cad == 0


def cmd_plan(args):
    themes = _load_themes()
    weights = _load_weights()
    start = dt.date.fromisoformat(args.date) if args.date else dt.date.today()
    days = args.days
    only = set(args.themes.split(",")) if args.themes else None
    use_llm = getattr(args, "llm", False) and brain is not None and brain.available()

    plan = {
        "plan_id": f"PLAN-{start.strftime('%Y%m%d')}-{days}d",
        "generated": dt.datetime.now().isoformat(timespec="seconds"),
        "window": {"start": start.isoformat(), "days": days},
        "live_signals": args.live_signals,
        "themes_version": themes["version"],
        "items": [],
    }

    for d in range(days):
        day = start + dt.timedelta(days=d)
        for theme in themes["themes"]:
            if only and theme["id"] not in only:
                continue
            if not _theme_due(theme, d):
                continue
            base_n = int(theme.get("per_run", 1))
            w = float(weights.get(theme["id"], 1.0))
            n = max(1, round(base_n * w))  # self-improving: learned weight tunes volume
            resolver = DEMAND_RESOLVERS.get(theme["demand_signal"])
            candidates = resolver(theme, n, args.live_signals) if resolver else _placeholder(theme, n, "no resolver")
            for cand in candidates:
                item = _build_item(theme, day.isoformat(), cand)
                if w != 1.0:
                    item["learned_weight"] = round(w, 2)
                if use_llm:
                    a = brain.angle(item)
                    if a:
                        item["llm_angle"] = a
                plan["items"].append(item)

    PLANS_DIR.mkdir(parents=True, exist_ok=True)
    out = PLANS_DIR / f"{plan['plan_id']}.json"
    out.write_text(json.dumps(plan, ensure_ascii=False, indent=2))

    # Summary table to stdout
    by_theme = {}
    for it in plan["items"]:
        by_theme[it["theme"]] = by_theme.get(it["theme"], 0) + 1
    print(f"plan -> {out}")
    print(f"window {start} +{days}d · {len(plan['items'])} items "
          f"({'LIVE signals' if args.live_signals else 'cached/placeholder signals'})")
    for tid, c in sorted(by_theme.items(), key=lambda x: -x[1]):
        print(f"  {c:>3}  {tid}")
    real = sum(1 for it in plan["items"] if it["candidate"]["source"] != "placeholder")
    print(f"  {real}/{len(plan['items'])} items have real demand candidates "
          f"(rest are placeholders awaiting signal wiring)")
    return out


# ---------------------------------------------------------------------------
# Dispatcher — translate planned items into native engine job specs (dry-run, staged).
# Parks every job at its approval gate; never calls a live publisher.
# ---------------------------------------------------------------------------

def _social_job(item: dict, stamp: str) -> dict:
    cand = item["candidate"]
    return {
        "id": f"co-{item['theme']}-{stamp}",
        "name": f"{item['label']} — {item['date']}",
        "date": item["date"],
        "approval_status": "draft",  # gate: campaign-orchestration-contract
        "design_template": "emart-social-card-v1",
        "platforms": [c for c in item["channels"] if c in ("facebook", "instagram")],
        "items": [{
            "product_id": cand.get("product_id"),
            "name": cand.get("name"),
            "theme": item["theme"],
            "formats": [f for f in item["formats"] if f.startswith("post_")],
            "make_reel": item["generator"].startswith("video") or "video" in item["generator"],
        }],
        "_orchestrator": {"theme": item["theme"], "gate": "campaign", "metric": item["metric"],
                          "guard": item.get("guard"), "candidate_source": cand.get("source")},
    }


def _video_job(item: dict, stamp: str) -> dict:
    cand = item["candidate"]
    return {
        "id": f"co-{item['theme']}-{stamp}-reel",
        "tier_target": "free",
        "platforms": [c for c in item["channels"] if c in ("facebook", "instagram", "tiktok", "youtube")] or ["instagram"],
        "product": cand.get("name"),
        "product_id": cand.get("product_id"),
        "language": "bn",
        "status": "pending",  # gate: video-engine Telegram approval (publish_approved.py only)
        "_orchestrator": {"theme": item["theme"], "gate": "campaign", "metric": item["metric"],
                          "formats": item["formats"], "guard": item.get("guard"),
                          "candidate_source": cand.get("source")},
    }


def _content_brief(item: dict, stamp: str) -> dict:
    cand = item["candidate"]
    return {
        "brief_id": f"co-{item['theme']}-{stamp}",
        "type": item["generator"],
        "theme": item["theme"],
        "surface": item["surface"],
        "primary_topic": cand.get("topic") or cand.get("name"),
        "target_url": cand.get("slug"),
        "channels": item["channels"],
        "status": "proposed",  # gate: content-lifecycle-contract DEMAND→BRIEF
        "acceptance": "BRAND_GUIDE tone, no medical claims, internal links, FAQ schema where relevant",
        "guard": item.get("guard"),
        "metric": item["metric"],
        "candidate_source": cand.get("source"),
    }


def _ledger_add(item: dict, targets: list[str]) -> str | None:
    """CO-4: record a dispatched item in the action ledger so the learn loop can score it later.
    sub_category=theme id is the key the learn loop groups on. Best-effort; never blocks dispatch."""
    if not LEDGER_HELPER.exists():
        return None
    cand = item["candidate"]
    domain = "CONTENT" if ("blog" in item["generator"] or "seo" in item["generator"]) else "SOCIAL"
    cmd = [sys.executable, str(LEDGER_HELPER), "add",
           "--domain", domain, "--entity", "CAMPAIGN",
           "--entity-type", "product" if cand.get("product_id") else "campaign",
           "--sub-category", item["theme"],
           "--related", item["theme"],
           "--slug", str(cand.get("slug") or cand.get("name") or item["theme"])[:120],
           "--summary", f"{item['label']} dispatched ({cand.get('source')}) → {', '.join(targets)}"[:300],
           "--recommendation", f"Publish via {item['generator']} to {','.join(item['channels'])} (gate={item['gate']})"[:300],
           "--metric", item["metric"], "--evidence-source", "content-orchestrator",
           "--created-by", "content-orchestrator", "--blast-radius", "single-page"]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return r.stdout.strip().splitlines()[-1] if r.returncode == 0 and r.stdout.strip() else None
    except Exception:
        return None


def cmd_dispatch(args):
    plan_path = Path(args.plan)
    if not plan_path.exists():
        name = args.plan if args.plan.endswith(".json") else f"{args.plan}.json"
        plan_path = PLANS_DIR / name
    plan = json.loads(plan_path.read_text())
    stamp_base = plan["plan_id"]
    out_dir = DISPATCH_DIR / stamp_base
    (out_dir / "social").mkdir(parents=True, exist_ok=True)
    (out_dir / "video").mkdir(parents=True, exist_ok=True)
    (out_dir / "briefs").mkdir(parents=True, exist_ok=True)

    counts = {"social": 0, "video": 0, "brief": 0}
    manifest = []
    for i, item in enumerate(plan["items"]):
        stamp = f"{plan['window']['start'].replace('-','')}-{i:03d}"
        gen = item["generator"]
        targets = []
        if "social" in gen:
            p = out_dir / "social" / f"{stamp}-{item['theme']}.json"
            p.write_text(json.dumps(_social_job(item, stamp), ensure_ascii=False, indent=2))
            counts["social"] += 1
            targets.append(str(p.relative_to(ROOT)))
        if "video" in gen:
            p = out_dir / "video" / f"{stamp}-{item['theme']}.json"
            p.write_text(json.dumps(_video_job(item, stamp), ensure_ascii=False, indent=2))
            counts["video"] += 1
            targets.append(str(p.relative_to(ROOT)))
        if "blog" in gen or "seo" in gen:
            p = out_dir / "briefs" / f"{stamp}-{item['theme']}.json"
            p.write_text(json.dumps(_content_brief(item, stamp), ensure_ascii=False, indent=2))
            counts["brief"] += 1
            targets.append(str(p.relative_to(ROOT)))
        ledger_id = _ledger_add(item, targets) if getattr(args, "ledger", False) else None
        manifest.append({"theme": item["theme"], "date": item["date"], "gate": item["gate"],
                         "targets": targets, "candidate_source": item["candidate"]["source"],
                         "ledger_id": ledger_id})

    (out_dir / "MANIFEST.json").write_text(json.dumps({
        "plan_id": plan["plan_id"], "dispatched": dt.datetime.now().isoformat(timespec="seconds"),
        "dry_run": True, "counts": counts, "items": manifest,
        "next_steps": {
            "social": "review under social-engine plan workflow → owner approve → meta_schedule.js --publish",
            "video": "orchestrator.py --tick builds reel → reels_bot.py Telegram approve = only publisher",
            "briefs": "content-lifecycle-contract: brief → draft (blog_generator --draft) → QA → owner approve",
        },
    }, ensure_ascii=False, indent=2))

    print(f"dispatch -> {out_dir} (DRY-RUN, parked at gates)")
    print(f"  social campaign drafts: {counts['social']}")
    print(f"  video reel jobs (pending): {counts['video']}")
    print(f"  content/SEO briefs (proposed): {counts['brief']}")
    if getattr(args, "ledger", False):
        ledgered = sum(1 for m in manifest if m["ledger_id"])
        print(f"  ledger entries created: {ledgered}/{len(manifest)} (sub_category=theme → feeds learn loop)")
    print(f"  manifest: {out_dir / 'MANIFEST.json'}")
    print("  nothing published; nothing written to Woo. Each item awaits its owner gate.")
    return out_dir


def _build_item(theme: dict, day: str, cand: dict) -> dict:
    return {
        "date": day,
        "theme": theme["id"],
        "label": theme["label"],
        "surface": theme["surface"],
        "intent": theme["intent"],
        "demand_signal": theme["demand_signal"],
        "candidate": cand,
        "formats": theme["formats"],
        "channels": theme["channels"],
        "generator": theme["generator"],
        "gate": theme["gate"],
        "metric": theme["metric"],
        "guard": theme.get("guard"),
        "status": "planned",
    }


def cmd_manual(args):
    """Owner-triggered one-off: inject a specific product/topic into a theme on demand.
    Bypasses cadence, never bypasses the approval gate. Produces a one-item plan + dispatch."""
    themes = _load_themes()
    theme = next((t for t in themes["themes"] if t["id"] == args.theme), None)
    if not theme:
        sys.exit(f"unknown theme '{args.theme}'. Run: orchestrator.py themes")

    cand = {
        "product_id": args.product_id,
        "name": args.name or (str(args.product_id) if args.product_id else args.topic or "manual"),
        "slug": args.slug,
        "topic": args.topic,
        "source": "manual_owner",
        "signal_score": None,
        "note": args.note,
    }
    day = args.date or _today()
    item = _build_item(theme, day, cand)
    if args.channels:
        item["channels"] = args.channels.split(",")
    if args.formats:
        item["formats"] = args.formats.split(",")
    if args.generator:
        item["generator"] = args.generator
    if getattr(args, "llm", False) and brain is not None and brain.available():
        a = brain.angle(item)
        if a:
            item["llm_angle"] = a
            print(f"  llm_angle: {a.get('hook') or a.get('angle')}")

    plan = {
        "plan_id": f"MANUAL-{day.replace('-','')}-{theme['id']}",
        "generated": dt.datetime.now().isoformat(timespec="seconds"),
        "window": {"start": day, "days": 1},
        "live_signals": False,
        "themes_version": themes["version"],
        "trigger": "manual_owner",
        "items": [item],
    }
    PLANS_DIR.mkdir(parents=True, exist_ok=True)
    plan_path = PLANS_DIR / f"{plan['plan_id']}.json"
    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2))
    print(f"manual plan -> {plan_path}")
    print(f"  theme={theme['id']} product={cand['name']} gate={theme['gate']} "
          f"channels={item['channels']}")
    if theme.get("guard"):
        print(f"  GUARD: {theme['guard']}")

    if args.no_dispatch:
        print("  (--no-dispatch: plan written, not dispatched)")
        return plan_path
    # dispatch this one-item plan immediately, still gated
    args.plan = plan["plan_id"]
    return cmd_dispatch(args)


def cmd_learn(args):
    """Self-improving loop: read outcome signals from the action ledger, score each theme, and write
    theme_weights.json (a per-theme volume multiplier the planner consumes). Owner-gated for cadence
    changes; soft per_run weighting is automatic. Advisory LLM reflection with --llm."""
    themes = _load_themes()
    theme_ids = {t["id"] for t in themes["themes"]}

    # gather ledger outcomes tagged to a theme (by sub_category / related_ids / id substring)
    entries = []
    if LEDGER_FILE.exists():
        for line in LEDGER_FILE.read_text().splitlines():
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except Exception:
                    pass

    POS = {"verified", "kept", "keep", "measured-keep", "improved", "active", "completed"}
    NEG = {"reverted", "revert", "degraded", "rejected", "abandoned"}

    stats = {}
    for tid in theme_ids:
        stats[tid] = {"theme": tid, "samples": 0, "positive": 0, "negative": 0}
    for e in entries:
        tags = {e.get("sub_category", "")} | set(e.get("related_ids", []) or [])
        eid = e.get("id", "")
        hit = next((tid for tid in theme_ids if tid in tags or tid in eid), None)
        if not hit:
            continue
        st = (e.get("status") or "").lower()
        outcome = (((e.get("measurement") or {}).get("decision")) or "").lower()
        stats[hit]["samples"] += 1
        if st in POS or outcome in POS:
            stats[hit]["positive"] += 1
        elif st in NEG or outcome in NEG:
            stats[hit]["negative"] += 1

    weights = {}
    for tid, s in stats.items():
        net = s["positive"] - s["negative"]
        w = max(0.5, min(2.0, 1.0 + 0.15 * net))  # clamp so no theme runs away
        weights[tid] = round(w, 2)

    out = {
        "version": dt.date.today().strftime("%Y-%m-%d"),
        "generated": dt.datetime.now().isoformat(timespec="seconds"),
        "basis": f"{sum(s['samples'] for s in stats.values())} themed ledger outcomes",
        "weights": weights,
        "stats": stats,
        "note": "per_run multiplier; cadence changes stay owner-gated. 1.0 = neutral (no outcome data yet).",
    }
    WEIGHTS_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"learn -> {WEIGHTS_FILE}")
    print(f"  basis: {out['basis']}")
    nontrivial = {k: v for k, v in weights.items() if v != 1.0}
    if nontrivial:
        for k, v in sorted(nontrivial.items(), key=lambda x: -x[1]):
            print(f"  {k:<18} weight {v}  (+{stats[k]['positive']}/-{stats[k]['negative']})")
    else:
        print("  all themes neutral (1.0) — no themed outcomes in the ledger yet; "
              "weights become real as dispatched items get ledger entries (CO-4).")

    if getattr(args, "llm", False):
        if brain is None or not brain.available():
            print("  --llm requested but LLM brain unavailable (no key/openai/network).")
        else:
            advice = brain.reflect(list(stats.values()))
            if advice:
                print("\n  LLM tuning advice (advisory, owner decides cadence):")
                for ln in advice.splitlines():
                    print(f"    {ln}")
    return WEIGHTS_FILE


def cmd_themes(args):
    themes = _load_themes()
    print(f"Content Orchestrator strategy taxonomy v{themes['version']} — {len(themes['themes'])} themes\n")
    print(f"  {'THEME':<18}{'SURFACE':<18}{'SIGNAL':<22}{'GEN':<14}{'GATE':<10}CADENCE")
    for t in themes["themes"]:
        print(f"  {t['id']:<18}{t['surface']:<18}{t['demand_signal']:<22}"
              f"{t['generator']:<14}{t['gate']:<10}{t['cadence_days']}d x{t['per_run']}")
    print("\nGates:")
    for k, v in themes["gates"].items():
        print(f"  {k:<10}{v}")


def cmd_status(args):
    PLANS_DIR.mkdir(parents=True, exist_ok=True)
    DISPATCH_DIR.mkdir(parents=True, exist_ok=True)
    plans = sorted(PLANS_DIR.glob("*.json"))
    print(f"Content Orchestrator status — {_today()}\n")
    print(f"Plans ({len(plans)}):")
    for p in plans[-5:]:
        data = json.loads(p.read_text())
        print(f"  {p.stem:<24}{len(data['items'])} items  window {data['window']['start']} +{data['window']['days']}d")
    disp = sorted([d for d in DISPATCH_DIR.iterdir() if d.is_dir()])
    print(f"\nDispatch batches ({len(disp)}):")
    for d in disp[-5:]:
        mf = d / "MANIFEST.json"
        if mf.exists():
            m = json.loads(mf.read_text())
            c = m["counts"]
            print(f"  {d.name:<24}social={c['social']} video={c['video']} briefs={c['brief']} (dry-run, gated)")
    print("\nEngines this orchestrator routes to (all approval-gated):")
    print("  social → social-engine | video → video-engine (Telegram approve) | blog/seo → content-lifecycle gate")


def main():
    ap = argparse.ArgumentParser(description="Emart Content Orchestrator — strategy brain over the engines")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("themes", help="show strategy taxonomy")
    sp.set_defaults(func=cmd_themes)

    sp = sub.add_parser("plan", help="build a content calendar for a date window (dry-run)")
    sp.add_argument("--date", help="start date YYYY-MM-DD (default today)")
    sp.add_argument("--days", type=int, default=7)
    sp.add_argument("--themes", help="comma-separated theme ids to restrict to")
    sp.add_argument("--live-signals", action="store_true", help="allow read-only live Woo/GSC demand resolution")
    sp.add_argument("--llm", action="store_true", help="enrich each item with an LLM hook/caption/angle (Hermes/OpenRouter/OpenClaw)")
    sp.set_defaults(func=cmd_plan)

    sp = sub.add_parser("dispatch", help="emit native engine job specs for a plan (dry-run, staged at gates)")
    sp.add_argument("plan", help="plan id or path under plans/")
    sp.add_argument("--ledger", action="store_true", help="record each dispatched item in the action ledger (feeds learn loop)")
    sp.set_defaults(func=cmd_dispatch)

    sp = sub.add_parser("manual", help="owner-triggered one-off content for a specific product/topic (gated)")
    sp.add_argument("--theme", required=True, help="theme id from the taxonomy (see: orchestrator.py themes)")
    sp.add_argument("--product-id", type=int, help="Woo product id")
    sp.add_argument("--name", help="product/display name")
    sp.add_argument("--slug", help="product/page slug")
    sp.add_argument("--topic", help="topic/angle for blog/SEO/ingredient content")
    sp.add_argument("--channels", help="override channels, comma-separated")
    sp.add_argument("--formats", help="override formats, comma-separated")
    sp.add_argument("--generator", help="override generator routing, e.g. social+video")
    sp.add_argument("--date", help="target date YYYY-MM-DD (default today)")
    sp.add_argument("--note", help="free-text note carried into the job")
    sp.add_argument("--llm", action="store_true", help="enrich with an LLM hook/caption/angle")
    sp.add_argument("--live-signals", action="store_true", help="resolve product id/slug against read-only Woo")
    sp.add_argument("--ledger", action="store_true", help="record the dispatched item in the action ledger")
    sp.add_argument("--no-dispatch", action="store_true", help="write the plan only, don't emit job specs")
    sp.set_defaults(func=cmd_manual)

    sp = sub.add_parser("learn", help="self-improving loop: score themes from ledger outcomes → theme_weights.json")
    sp.add_argument("--llm", action="store_true", help="add advisory LLM tuning reflection")
    sp.set_defaults(func=cmd_learn)

    sp = sub.add_parser("status", help="dashboard of plans/dispatch")
    sp.set_defaults(func=cmd_status)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
