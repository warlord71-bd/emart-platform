#!/usr/bin/env python3
"""
Hermes — Emart internal agent dashboard.

On-demand creative generation, content review, job monitoring, and manual triggers.
OpenClaw handles scheduled/cron work; Hermes adds the visual, interactive layer.

Run:  python3 app.py
      uvicorn app:app --host 127.0.0.1 --port 8078
Prod: pm2 start app.py --name emart-hermes --interpreter python3

Nginx: proxy_pass http://127.0.0.1:8078; (behind /hermes/ or subdomain)
"""
from __future__ import annotations

import asyncio, json, os, sqlite3, subprocess, sys, time, uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

ROOT = Path(__file__).resolve().parent.parent.parent
WORKSPACE = ROOT / "workspace"
HERMES = Path(__file__).resolve().parent
CONTENT_ORCHESTRATOR = WORKSPACE / "content-orchestrator"
SCRIPTS = CONTENT_ORCHESTRATOR / "scripts"
SOCIAL_ENGINE = CONTENT_ORCHESTRATOR / "social-engine"
VIDEO_ENGINE = CONTENT_ORCHESTRATOR / "video-engine"
DB_PATH = HERMES / "hermes.db"

app = FastAPI(title="Hermes — Emart Agent Dashboard", docs_url="/api/docs")
app.mount("/static", StaticFiles(directory=str(HERMES / "static")), name="static")
templates = Jinja2Templates(directory=str(HERMES / "templates"))

sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(WORKSPACE))
sys.path.insert(0, str(CONTENT_ORCHESTRATOR))

import content_pack  # noqa: E402


# ─── Database ────────────────────────────────────────────────────────────────

def _db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def _init_db():
    with _db() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            params TEXT NOT NULL DEFAULT '{}',
            status TEXT NOT NULL DEFAULT 'queued',
            result TEXT DEFAULT NULL,
            output_path TEXT DEFAULT NULL,
            created_at TEXT NOT NULL,
            started_at TEXT DEFAULT NULL,
            finished_at TEXT DEFAULT NULL,
            error TEXT DEFAULT NULL
        )""")


_init_db()


# ─── Engine wrappers ─────────────────────────────────────────────────────────

ENGINES = {
    "creative": {
        "name": "Creative Engine",
        "desc": "Generate branded product images (1x1, 4x5, blog OG)",
        "params": ["product_id", "format", "badge"],
        "formats": ["post_1x1", "post_4x5", "blog_og_1200x630", "hero_vertical"],
    },
    "blog_hero": {
        "name": "Blog Hero Generator",
        "desc": "Generate 1200x630 branded blog featured images",
        "params": ["title", "product_id", "badge", "post_id"],
    },
    "orchestrator_plan": {
        "name": "Content Orchestrator — Plan",
        "desc": "Build a content calendar for today (dry-run)",
        "params": ["days", "themes"],
    },
    "orchestrator_status": {
        "name": "Content Orchestrator — Status",
        "desc": "Dashboard of plans and dispatches",
        "params": [],
    },
    "cwv_check": {
        "name": "CWV Monitor",
        "desc": "Run Core Web Vitals check on a page",
        "params": ["page"],
    },
    "topical_authority": {
        "name": "Topical Authority Report",
        "desc": "Regenerate the content topology and link gap report",
        "params": [],
    },
    "humanizer_status": {
        "name": "Humanizer Status",
        "desc": "Check PDP humanizer progress",
        "params": [],
    },
    "humanizer_run": {
        "name": "Humanizer — Run Batch",
        "desc": "Humanize N product descriptions using free OpenRouter models (detached)",
        "params": ["limit"],
    },
    "reel_pipeline": {
        "name": "🎬 Create Reel — Full Pipeline",
        "desc": "Enter product → build reel → preview here + Telegram → approve & publish from either",
        "params": ["product_id", "product_name", "platforms"],
    },
    "video_enqueue": {
        "name": "Video — Enqueue Reel",
        "desc": "Queue a product reel for build + Telegram approval",
        "params": ["product_id", "product_name", "platforms"],
    },
    "video_status": {
        "name": "Video — Pipeline Status",
        "desc": "Show video orchestrator queue, review, approved, published counts",
        "params": [],
    },
    "video_build": {
        "name": "Video — Build Now",
        "desc": "Run one orchestrator tick to build queued reels immediately",
        "params": [],
    },
    "social_plan": {
        "name": "Social — Create Campaign Plan",
        "desc": "Pick products and create a reviewable FB/IG campaign pack",
        "params": ["count", "theme"],
    },
    "social_pick": {
        "name": "Social — Pick Products",
        "desc": "Read-only product picker (avoids recent history)",
        "params": ["count"],
    },
    "blog_generate": {
        "name": "Blog — Generate Draft",
        "desc": "Generate a blog post draft (does NOT publish)",
        "params": ["topic"],
    },
    "gmc_sync": {
        "name": "GMC — Trigger Sync",
        "desc": "Run Google Merchant Center product feed sync",
        "params": [],
    },
    "gsc_tracker": {
        "name": "GSC — Striking Distance",
        "desc": "Show pages ranking 11-20 with highest impression potential",
        "params": [],
    },
    "seo_check": {
        "name": "SEO — Rotating Check",
        "desc": "Run today's scheduled SEO technical check",
        "params": [],
    },
    "revalidate": {
        "name": "Cache — Revalidate",
        "desc": "Revalidate Next.js ISR cache for a tag or path",
        "params": ["tag", "path"],
        "category": "ops",
    },
    "ai_ask": {
        "name": "AI Assistant — Ask",
        "desc": "Ask the LLM brain anything (content, SEO, quality review, planning)",
        "params": ["question", "context"],
        "category": "ai",
    },
    "ai_plan": {
        "name": "AI Assistant — Plan Steps",
        "desc": "Break a complex task into executable engine steps",
        "params": ["task"],
        "category": "ai",
    },
    "ai_write": {
        "name": "AI Assistant — Write Content",
        "desc": "Generate content (captions, descriptions, blog sections)",
        "params": ["prompt", "style"],
        "category": "ai",
    },
    "ai_review": {
        "name": "AI Assistant — Review Output",
        "desc": "Quality-check text for GMC safety, brand voice, claims",
        "params": ["check", "text"],
        "category": "ai",
    },
    "openclaw_health": {
        "name": "OpenClaw — Site Health",
        "desc": "Run site health check (HTTP, SSL, response time)",
        "params": [],
        "category": "ops",
    },
    "openclaw_report": {
        "name": "OpenClaw — Daily Report",
        "desc": "Generate daily business report (orders, revenue, traffic)",
        "params": [],
        "category": "ops",
    },
    "openclaw_stock": {
        "name": "OpenClaw — Low Stock Alert",
        "desc": "Check for low-stock products",
        "params": [],
        "category": "ops",
    },
    "openclaw_task": {
        "name": "OpenClaw — Send Task",
        "desc": "Send a complex task to OpenClaw's AI agent (DeepSeek/Gemini brain, memory, skills)",
        "params": ["task", "agent"],
        "category": "openclaw",
    },
    "openclaw_dashboard": {
        "name": "OpenClaw — Open Dashboard",
        "desc": "Open the full OpenClaw Control UI in a new tab",
        "params": [],
        "category": "openclaw",
        "link": "https://agent.e-mart.com.bd",
    },
    "openclaw_ad_gen": {
        "name": "OpenClaw — Ad Generator",
        "desc": "Generate multi-platform ad creative copy (Facebook, Instagram, Google)",
        "params": ["product", "platforms"],
        "category": "openclaw",
    },
    "openclaw_seo_report": {
        "name": "OpenClaw — SEO Report",
        "desc": "Full SEO pipeline report with rankings, gaps, and recommendations",
        "params": [],
        "category": "openclaw",
    },
    "openclaw_auto_publish": {
        "name": "OpenClaw — Auto Publisher",
        "desc": "Generate blog post → review → schedule → publish (full pipeline)",
        "params": ["topic"],
        "category": "openclaw",
    },
    "openclaw_competitor": {
        "name": "OpenClaw — Competitor Prices",
        "desc": "Run competitor price comparison and update Google Sheets",
        "params": [],
        "category": "openclaw",
    },
}

ENGINE_CATEGORIES = {
    "ai": {"label": "🧠 AI Quick Brain", "desc": "Fast answers, content writing, quality review — free models, instant response", "lane": "hermes"},
    "creative": {"label": "🎨 Creative Studio", "desc": "Product images, blog heroes — instant render", "lane": "hermes"},
    "content": {"label": "📝 Content Engine", "desc": "Blog drafts, humanizer, content planning", "lane": "hermes"},
    "social": {"label": "📱 Social & Video", "desc": "Reels, FB/IG campaigns, product picker", "lane": "hermes"},
    "seo": {"label": "🔍 SEO & Analytics", "desc": "CWV, GSC tracker, technical checks", "lane": "hermes"},
    "openclaw": {"label": "🐾 OpenClaw Agent", "desc": "Complex tasks — deep reasoning, multi-step workflows, ad generation, SEO analysis (DeepSeek/Gemini brain)", "lane": "openclaw"},
    "ops": {"label": "⚙️ Operations", "desc": "Site health, cache, GMC sync, stock alerts", "lane": "hermes"},
}

ENGINE_CATEGORY_MAP = {
    "ai_ask": "ai", "ai_plan": "ai", "ai_write": "ai", "ai_review": "ai",
    "creative": "creative", "blog_hero": "creative",
    "orchestrator_plan": "content", "orchestrator_status": "content",
    "humanizer_run": "content", "humanizer_status": "content",
    "blog_generate": "content", "topical_authority": "content",
    "reel_pipeline": "social", "video_enqueue": "social", "video_status": "social", "video_build": "social",
    "social_plan": "social", "social_pick": "social",
    "cwv_check": "seo", "gsc_tracker": "seo", "seo_check": "seo",
    "gmc_sync": "ops", "revalidate": "ops",
    "openclaw_health": "ops", "openclaw_report": "ops", "openclaw_stock": "ops",
    "openclaw_task": "openclaw", "openclaw_dashboard": "openclaw",
    "openclaw_ad_gen": "openclaw", "openclaw_seo_report": "openclaw",
    "openclaw_auto_publish": "openclaw", "openclaw_competitor": "openclaw",
}


def _run_engine(job_type: str, params: dict) -> dict:
    runners = {
        "creative": _run_creative,
        "blog_hero": _run_blog_hero,
        "orchestrator_plan": _run_orchestrator_plan,
        "orchestrator_status": lambda p: _run_orchestrator_status(),
        "cwv_check": _run_cwv,
        "topical_authority": lambda p: _run_topical_authority(),
        "humanizer_status": lambda p: _run_humanizer_status(),
        "humanizer_run": _run_humanizer_batch,
        "video_enqueue": _run_video_enqueue,
        "video_status": lambda p: _run_video_status(),
        "video_build": lambda p: _run_video_build(),
        "social_plan": _run_social_plan,
        "social_pick": _run_social_pick,
        "blog_generate": _run_blog_generate,
        "gmc_sync": lambda p: _run_gmc_sync(),
        "gsc_tracker": lambda p: _run_gsc_tracker(),
        "seo_check": lambda p: _run_seo_check(),
        "revalidate": _run_revalidate,
        "reel_pipeline": _run_reel_pipeline,
        "ai_ask": _run_ai_ask,
        "ai_plan": _run_ai_plan,
        "ai_write": _run_ai_write,
        "ai_review": _run_ai_review,
        "openclaw_health": lambda p: _run_openclaw("site_health"),
        "openclaw_report": lambda p: _run_openclaw("daily_report"),
        "openclaw_stock": lambda p: _run_openclaw("low_stock"),
        "openclaw_task": _run_openclaw_task,
        "openclaw_dashboard": lambda p: {"log": "Opening OpenClaw dashboard...", "redirect": "https://agent.e-mart.com.bd"},
        "openclaw_ad_gen": lambda p: _run_openclaw_agent(f"Use skill emart-ad-generator for product: {p.get('product','')}, platforms: {p.get('platforms','facebook,instagram')}", "emart"),
        "openclaw_seo_report": lambda p: _run_openclaw_agent("Use skill emart-seo-report, run /report", "emart"),
        "openclaw_auto_publish": lambda p: _run_openclaw_agent(f"Use skill emart-auto-publisher for topic: {p.get('topic','skincare guide')}", "emart"),
        "openclaw_competitor": lambda p: _run_openclaw_agent("Use skill emart-competitor-prices, run full comparison", "emart"),
    }
    fn = runners.get(job_type)
    if not fn:
        return {"error": f"Unknown engine: {job_type}"}
    return fn(params)


def _run_creative(params: dict) -> dict:
    product_id = int(params.get("product_id", 0))
    fmt = params.get("format", "post_1x1")
    badge = params.get("badge", "SHOP NOW")
    if not product_id:
        return {"error": "product_id required"}

    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    out = str(HERMES / "static" / "output" / f"creative-{product_id}-{fmt}-{ts}.png")
    Path(out).parent.mkdir(parents=True, exist_ok=True)

    r = subprocess.run(
        [sys.executable, str(SCRIPTS / "active" / "social_image_gen.py"),
         "--product-id", str(product_id), "--format", fmt, "--badge", badge, "--out", out],
        capture_output=True, text=True, timeout=120, cwd=str(ROOT),
    )
    if r.returncode != 0:
        return {"error": r.stderr[-500:] if r.stderr else "render failed"}
    return {"output_path": out, "preview": f"/static/output/{Path(out).name}"}


def _run_blog_hero(params: dict) -> dict:
    title = params.get("title", "")
    product_id = params.get("product_id", "")
    badge = params.get("badge", "")
    post_id = params.get("post_id", "")

    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    out = str(HERMES / "static" / "output" / f"blog-hero-{ts}.png")
    Path(out).parent.mkdir(parents=True, exist_ok=True)

    cmd = [sys.executable, str(SCRIPTS / "active" / "blog_hero_gen.py"),
           "--dry-run", "--out", out]
    if title:
        cmd += ["--title", title]
    if product_id:
        cmd += ["--product-id", str(product_id)]
    if badge:
        cmd += ["--badge", badge]
    if post_id:
        cmd += ["--post-id", str(post_id)]

    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120, cwd=str(ROOT))
    if r.returncode != 0:
        return {"error": r.stderr[-500:] if r.stderr else "render failed"}
    return {"output_path": out, "preview": f"/static/output/{Path(out).name}",
            "log": r.stdout[-1000:]}


def _run_orchestrator_plan(params: dict) -> dict:
    days = str(params.get("days", "1"))
    cmd = [sys.executable, str(CONTENT_ORCHESTRATOR / "orchestrator.py"),
           "plan", "--days", days, "--live-signals"]
    themes = params.get("themes", "")
    if themes:
        cmd += ["--themes", themes]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=60, cwd=str(ROOT))
    return {"log": r.stdout[-2000:], "error": r.stderr[-500:] if r.returncode != 0 else None}


def _run_orchestrator_status() -> dict:
    r = subprocess.run(
        [sys.executable, str(CONTENT_ORCHESTRATOR / "orchestrator.py"), "status"],
        capture_output=True, text=True, timeout=30, cwd=str(ROOT),
    )
    return {"log": r.stdout[-2000:]}


def _run_cwv(params: dict) -> dict:
    page = params.get("page", "/")
    r = subprocess.run(
        [sys.executable, str(SCRIPTS / "active" / "cwv_monitor.py"), "--page", page],
        capture_output=True, text=True, timeout=180, cwd=str(ROOT),
    )
    return {"log": r.stdout[-2000:], "error": r.stderr[-500:] if r.returncode != 0 else None}


def _run_topical_authority() -> dict:
    r = subprocess.run(
        [sys.executable, str(SCRIPTS / "active" / "topical_authority_report.py")],
        capture_output=True, text=True, timeout=60, cwd=str(ROOT),
    )
    return {"log": r.stdout[-2000:]}


def _run_humanizer_batch(params: dict) -> dict:
    limit = str(params.get("limit", "10"))
    r = subprocess.run(
        ["bash", str(WORKSPACE / "humanizer" / "engine" / "run_detached.sh"), limit],
        capture_output=True, text=True, timeout=30, cwd=str(ROOT),
    )
    return {"log": r.stdout[-1000:] + r.stderr[-500:]}


def _run_video_enqueue(params: dict) -> dict:
    product_id = params.get("product_id", "")
    name = params.get("product_name", "")
    platforms = params.get("platforms", "facebook,instagram")
    if not product_id:
        return {"error": "product_id required"}
    spec = _build_hermes_video_spec(product_id, name, platforms)
    spec_path = VIDEO_ENGINE / "jobs" / "_hermes-specs" / f"{spec['id']}.json"
    spec_path.parent.mkdir(parents=True, exist_ok=True)
    spec_path.write_text(json.dumps(spec, ensure_ascii=False, indent=2))
    r = subprocess.run(
        [sys.executable, str(VIDEO_ENGINE / "enqueue.py"), str(spec_path), "--priority", "20"],
        capture_output=True, text=True, timeout=30, cwd=str(VIDEO_ENGINE),
    )
    if r.returncode != 0:
        return {"error": r.stderr[-500:] if r.stderr else "enqueue failed", "log": r.stdout[-1000:]}
    return {"log": f"{r.stdout.strip()}\nProduct: {spec['product']}\nPlatforms: {platforms}\nSchema: {spec.get('schema_version')}\n\nNext orchestrator tick builds it → Telegram approval → publish."}


def _run_video_status() -> dict:
    jobs_dir = VIDEO_ENGINE / "jobs"
    counts = {}
    for d in ["queue", "building", "review", "approved", "published", "rejected", "dead-letter"]:
        p = jobs_dir / d
        counts[d] = len(list(p.glob("*.json"))) if p.exists() else 0
    r = subprocess.run(
        [sys.executable, str(VIDEO_ENGINE / "orchestrator.py"), "--status"],
        capture_output=True, text=True, timeout=30, cwd=str(VIDEO_ENGINE),
    )
    return {"log": r.stdout[-2000:] if r.stdout else json.dumps(counts, indent=2)}


def _run_video_build() -> dict:
    r = subprocess.run(
        [sys.executable, str(VIDEO_ENGINE / "orchestrator.py"), "--tick"],
        capture_output=True, text=True, timeout=300, cwd=str(VIDEO_ENGINE),
    )
    return {"log": r.stdout[-2000:], "error": r.stderr[-500:] if r.returncode != 0 else None}


def _run_social_plan(params: dict) -> dict:
    count = str(params.get("count", "6"))
    cmd = [sys.executable, str(SOCIAL_ENGINE / "social_engine.py"), "plan",
           "--count", count, "--dry-run"]
    theme = params.get("theme", "")
    if theme:
        cmd += ["--theme", theme]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=60, cwd=str(ROOT))
    return {"log": r.stdout[-2000:], "error": r.stderr[-500:] if r.returncode != 0 else None}


def _run_social_pick(params: dict) -> dict:
    count = str(params.get("count", "5"))
    r = subprocess.run(
        [sys.executable, str(SOCIAL_ENGINE / "social_engine.py"), "pick",
         "--count", count],
        capture_output=True, text=True, timeout=30, cwd=str(ROOT),
    )
    return {"log": r.stdout[-2000:]}


def _run_blog_generate(params: dict) -> dict:
    topic = params.get("topic", "")
    cmd = [sys.executable, "/root/.openclaw/workspace-emart/blog_generator.py", "--draft"]
    if topic:
        cmd += ["--topic", topic]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=180, cwd=str(ROOT))
    return {"log": r.stdout[-2000:], "error": r.stderr[-500:] if r.returncode != 0 else None}


def _run_gmc_sync() -> dict:
    r = subprocess.run(
        [sys.executable, "/root/.gmc/sync.py"],
        capture_output=True, text=True, timeout=300,
    )
    return {"log": r.stdout[-2000:], "error": r.stderr[-500:] if r.returncode != 0 else None}


def _run_gsc_tracker() -> dict:
    r = subprocess.run(
        [sys.executable, str(WORKSPACE / "seo-review" / "gsc_tracker.py"), "striking-distance"],
        capture_output=True, text=True, timeout=60, cwd=str(ROOT),
    )
    return {"log": r.stdout[-2000:]}


def _run_seo_check() -> dict:
    r = subprocess.run(
        [sys.executable, str(SCRIPTS / "active" / "seo_rotating_check.py")],
        capture_output=True, text=True, timeout=300, cwd=str(ROOT),
    )
    return {"log": r.stdout[-2000:]}


def _run_revalidate(params: dict) -> dict:
    import urllib.request
    tag = params.get("tag", "")
    path = params.get("path", "")
    results = []
    if tag:
        try:
            req = urllib.request.Request(
                f"https://e-mart.com.bd/api/revalidate?tag={tag}",
                headers={"x-revalidate-secret": os.environ.get("REVALIDATE_SECRET", "")},
            )
            resp = urllib.request.urlopen(req, timeout=10)
            results.append(f"Tag '{tag}': {resp.status}")
        except Exception as e:
            results.append(f"Tag '{tag}': {e}")
    if path:
        try:
            resp = urllib.request.urlopen(
                f"https://e-mart.com.bd/api/revalidate?path={path}", timeout=10)
            results.append(f"Path '{path}': {resp.status}")
        except Exception as e:
            results.append(f"Path '{path}': {e}")
    return {"log": "\n".join(results) if results else "Provide a tag or path to revalidate"}


def _run_ai_ask(params: dict) -> dict:
    from brain import ask, _call_llm, SYSTEM_PROMPT
    question = params.get("question", "")
    context = params.get("context", "")
    model = params.get("model") or None
    if not question:
        return {"error": "question required"}
    if model:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if context:
            messages.append({"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"})
        else:
            messages.append({"role": "user", "content": question})
        result = _call_llm(messages, model=model)
        return {"log": result or "Model unavailable", "model_used": model}
    return {"log": ask(question, context)}


def _run_ai_plan(params: dict) -> dict:
    from brain import plan_steps
    task = params.get("task", "")
    if not task:
        return {"error": "task required"}
    return {"log": plan_steps(task, list(ENGINES.keys()))}


def _run_ai_write(params: dict) -> dict:
    from brain import write_content, _call_llm, SYSTEM_PROMPT
    prompt = params.get("prompt", "")
    style = params.get("style", "Emart brand voice")
    model = params.get("model") or None
    if not prompt:
        return {"error": "prompt required"}
    if model:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + f"\n\nWrite in this style: {style}"},
            {"role": "user", "content": prompt},
        ]
        result = _call_llm(messages, max_tokens=1000, model=model)
        return {"log": result or "Model unavailable", "model_used": model}
    return {"log": write_content(prompt, style)}


def _run_ai_review(params: dict) -> dict:
    from brain import review_output, _call_llm, SYSTEM_PROMPT
    check = params.get("check", "GMC safety and brand voice")
    text = params.get("text", "")
    model = params.get("model") or None
    if not text:
        return {"error": "text required"}
    if model:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Review this output:\nCheck: {check}\n\nText:\n{text}"},
        ]
        result = _call_llm(messages, max_tokens=400, model=model)
        return {"log": result or "Model unavailable", "model_used": model}
    return {"log": review_output(check, text)}


def _run_reel_pipeline(params: dict) -> dict:
    """Full pipeline: enqueue → build → return preview URL for web/Telegram approval."""
    product_id = params.get("product_id", "")
    name = params.get("product_name", "")
    platforms = params.get("platforms", "facebook,instagram")
    if not product_id:
        return {"error": "product_id required"}

    vid_engine = VIDEO_ENGINE
    jobs_dir = vid_engine / "jobs"

    spec = _build_hermes_video_spec(product_id, name, platforms)
    spec_path = jobs_dir / "_hermes-specs" / f"{spec['id']}.json"
    spec_path.parent.mkdir(parents=True, exist_ok=True)
    spec_path.write_text(json.dumps(spec, ensure_ascii=False, indent=2))

    enq = subprocess.run(
        [sys.executable, str(vid_engine / "enqueue.py"), str(spec_path), "--priority", "20"],
        capture_output=True, text=True, timeout=30, cwd=str(vid_engine),
    )
    if enq.returncode != 0:
        return {"error": enq.stderr[-500:] if enq.stderr else "enqueue failed", "log": enq.stdout[-1000:]}

    log_lines = [f"✅ Queued: {enq.stdout.strip()}"]

    # Build immediately
    r = subprocess.run(
        [sys.executable, str(vid_engine / "orchestrator.py"), "--tick"],
        capture_output=True, text=True, timeout=300, cwd=str(vid_engine),
    )
    log_lines.append(f"🔨 Build: {r.stdout.strip()[-200:]}" if r.stdout else "🔨 Build triggered")
    if r.returncode != 0 and r.stderr:
        log_lines.append(f"⚠ {r.stderr.strip()[-200:]}")

    # Find the review job (our job should have moved queue→building→review)
    review_job = None
    review_stem = None
    for jp in sorted((jobs_dir / "review").glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            jd = json.loads(jp.read_text())
            if jd.get("product_id") == int(product_id):
                review_job = jd
                review_stem = jp.stem
                break
        except Exception:
            continue

    if review_job:
        video_url = review_job.get("stages", {}).get("store", {}).get("url", "")
        qa = review_job.get("stages", {}).get("qa", {})
        hard = qa.get("hard") or {}
        qa_score = qa.get("score") or hard.get("score") or "?"
        log_lines.append(f"🎬 Reel built! QA score: {qa_score}")
        return {
            "log": "\n".join(log_lines),
            "reel_preview": video_url,
            "reel_stem": review_stem,
            "reel_product": name or str(product_id),
            "reel_qa_score": qa_score,
        }
    else:
        # Check if still building
        building = list((jobs_dir / "building").glob(f"*{product_id}*"))
        if building:
            log_lines.append("⏳ Still building... Refresh this page in 1-2 minutes.")
        else:
            log_lines.append("⚠ Reel not found in review queue. Check Video Status.")
        return {"log": "\n".join(log_lines)}


def _build_hermes_video_spec(product_id: str, name: str, platforms: str) -> dict:
    product = {"id": int(product_id), "name": name or f"Product {product_id}"}
    try:
        import woo  # read-only resolver from Content Orchestrator
        detail = woo.product_by_id(product_id)
        if detail:
            product.update(detail)
    except Exception:
        pass
    return content_pack.build_video_job(
        product,
        job_id=f"hermes-{product_id}-{int(time.time())}",
        theme="hermes_manual",
        platforms=[p.strip() for p in platforms.split(",") if p.strip()],
        product_source="woo_product_detail" if product.get("image") else "hermes_manual",
    )


def _run_openclaw_task(params: dict) -> dict:
    task = params.get("task", "")
    agent = params.get("agent", "emart")
    if not task:
        return {"error": "task required"}
    return _run_openclaw_agent(task, agent)


def _run_openclaw_agent(message: str, agent: str = "emart") -> dict:
    try:
        r = subprocess.run(
            ["openclaw", "agent", "-m", message, "--agent", agent, "--json"],
            capture_output=True, text=True, timeout=120,
        )
        if r.returncode == 0 and r.stdout.strip():
            try:
                data = json.loads(r.stdout)
                reply = data.get("reply", data.get("message", data.get("content", r.stdout[:2000])))
                return {"log": reply if isinstance(reply, str) else json.dumps(reply, indent=2)[:2000]}
            except json.JSONDecodeError:
                return {"log": r.stdout[:2000]}
        return {"log": r.stdout[:2000] if r.stdout else "No response", "error": r.stderr[:500] if r.stderr else None}
    except subprocess.TimeoutExpired:
        return {"log": "OpenClaw is still processing. Check the OpenClaw dashboard for results.", "error": "Timeout — task sent but response took >2min"}
    except Exception as e:
        return {"error": str(e)}


def _run_openclaw(script_name: str) -> dict:
    script = Path(f"/root/.openclaw/workspace-emart/{script_name}.py")
    if not script.exists():
        return {"error": f"{script_name}.py not found"}
    r = subprocess.run(
        [sys.executable, str(script)],
        capture_output=True, text=True, timeout=120,
    )
    return {"log": r.stdout[-2000:], "error": r.stderr[-500:] if r.returncode != 0 else None}


def _run_humanizer_status() -> dict:
    registry = WORKSPACE / "humanizer" / "completed-content-registry.json"
    scores = WORKSPACE / "humanizer" / "engine" / "scores.jsonl"
    result = {}
    if registry.exists():
        d = json.loads(registry.read_text())
        result["completed"] = d.get("total_completed", len(d.get("entries", [])))
        result["generated"] = d.get("generated", "?")
    if scores.exists():
        lines = scores.read_text().strip().splitlines()
        result["total_scored"] = len(lines)
        if lines:
            last = json.loads(lines[-1])
            result["last_score"] = last.get("score")
            result["last_product_id"] = last.get("product_id")
    r = subprocess.run(["pgrep", "-af", "humaniz"], capture_output=True, text=True)
    result["running"] = bool(r.stdout.strip())
    return result


# ─── PM2 / System status ────────────────────────────────────────────────────

def _parse_crontab() -> list[dict]:
    try:
        r = subprocess.run(["crontab", "-l"], capture_output=True, text=True, timeout=5)
        crons = []
        for line in r.stdout.strip().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split(None, 5)
            if len(parts) >= 6:
                sched = " ".join(parts[:5])
                cmd = parts[5]
                name = cmd.split("/")[-1].split(".")[0].split(" ")[0]
                if "&&" in cmd:
                    name = cmd.split("&&")[-1].strip().split("/")[-1].split(".")[0].split(" ")[0]
                crons.append({"schedule": sched, "name": name, "cmd": cmd[:100]})
        return crons
    except Exception:
        return []


def _pm2_status() -> list[dict]:
    try:
        r = subprocess.run(["pm2", "jlist"], capture_output=True, text=True, timeout=10)
        if r.returncode == 0:
            procs = json.loads(r.stdout)
            return [{"name": p["name"], "status": p["pm2_env"]["status"],
                     "cpu": p.get("monit", {}).get("cpu", 0),
                     "mem": round(p.get("monit", {}).get("memory", 0) / 1024 / 1024, 1),
                     "uptime": p["pm2_env"].get("pm_uptime", 0)}
                    for p in procs]
    except Exception:
        pass
    return []


def _system_stats() -> dict:
    import shutil
    disk = shutil.disk_usage("/")
    try:
        with open("/proc/meminfo") as f:
            mem = {}
            for line in f:
                parts = line.split()
                if parts[0].rstrip(":") in ("MemTotal", "MemAvailable"):
                    mem[parts[0].rstrip(":")] = int(parts[1]) // 1024
    except Exception:
        mem = {}
    return {
        "disk_used_gb": round(disk.used / 1024**3, 1),
        "disk_total_gb": round(disk.total / 1024**3, 1),
        "disk_pct": round(disk.used / disk.total * 100, 1),
        "mem_total_mb": mem.get("MemTotal", 0),
        "mem_available_mb": mem.get("MemAvailable", 0),
    }


# ─── Job management ─────────────────────────────────────────────────────────

def create_job(job_type: str, params: dict) -> str:
    job_id = str(uuid.uuid4())[:8]
    with _db() as conn:
        conn.execute(
            "INSERT INTO jobs (id, type, params, status, created_at) VALUES (?, ?, ?, 'queued', ?)",
            (job_id, job_type, json.dumps(params), datetime.now().isoformat(timespec="seconds")),
        )
    return job_id


def run_job(job_id: str):
    with _db() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            return
        conn.execute("UPDATE jobs SET status='running', started_at=? WHERE id=?",
                     (datetime.now().isoformat(timespec="seconds"), job_id))
    try:
        result = _run_engine(row["type"], json.loads(row["params"]))
        with _db() as conn:
            conn.execute(
                "UPDATE jobs SET status='done', result=?, output_path=?, finished_at=? WHERE id=?",
                (json.dumps(result), result.get("output_path"),
                 datetime.now().isoformat(timespec="seconds"), job_id),
            )
    except Exception as e:
        with _db() as conn:
            conn.execute(
                "UPDATE jobs SET status='error', error=?, finished_at=? WHERE id=?",
                (str(e)[:500], datetime.now().isoformat(timespec="seconds"), job_id),
            )


def get_jobs(limit: int = 20) -> list[dict]:
    with _db() as conn:
        rows = conn.execute(
            "SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(r) for r in rows]


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(str(HERMES / "static" / "favicon.ico"))


@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    pm2 = _pm2_status()
    stats = _system_stats()
    jobs = get_jobs(10)
    grouped = {}
    for eid, eng in ENGINES.items():
        cat = ENGINE_CATEGORY_MAP.get(eid, "ops")
        grouped.setdefault(cat, []).append((eid, eng))
    crons = _parse_crontab()
    return templates.TemplateResponse(request, "dashboard.html", {
        "pm2": pm2, "stats": stats, "jobs": jobs, "crons": crons,
        "grouped_engines": grouped, "categories": ENGINE_CATEGORIES,
        "now": datetime.now().strftime("%Y-%m-%d %H:%M"),
    })


@app.post("/job/create")
async def job_create(request: Request, engine: str = Form(...)):
    form = await request.form()
    params = {k: v for k, v in form.items() if k != "engine" and v}
    job_id = create_job(engine, params)
    await asyncio.to_thread(run_job, job_id)
    return RedirectResponse(f"/job/{job_id}", status_code=303)


@app.get("/job/{job_id}", response_class=HTMLResponse)
async def job_detail(request: Request, job_id: str):
    with _db() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    if not row:
        raise HTTPException(404)
    job = dict(row)
    if job["result"]:
        job["result_parsed"] = json.loads(job["result"])
    else:
        job["result_parsed"] = None
    return templates.TemplateResponse(request, "job.html", {"job": job})


@app.get("/engine/{engine_type}", response_class=HTMLResponse)
async def engine_form(request: Request, engine_type: str):
    engine = ENGINES.get(engine_type)
    if not engine:
        raise HTTPException(404)
    return templates.TemplateResponse(request, "engine.html", {
        "engine_type": engine_type, "engine": engine,
    })


@app.post("/reel/approve/{stem}")
async def reel_approve(stem: str):
    vid_engine = VIDEO_ENGINE
    review = vid_engine / "jobs" / "review" / f"{stem}.json"
    approved = vid_engine / "jobs" / "approved"
    if not review.exists():
        raise HTTPException(404, "Reel not found or already handled")
    approved.mkdir(parents=True, exist_ok=True)
    review.rename(approved / review.name)
    publish_script = vid_engine / "publish_approved.py"

    def _publish():
        return subprocess.run(
            [sys.executable, str(publish_script), "--live"],
            capture_output=True, text=True, timeout=600,
        )

    r = await asyncio.to_thread(_publish)
    ok = "PUBLISHED" in (r.stdout or "") or not (approved / f"{stem}.json").exists()
    return JSONResponse({
        "status": "published" if ok else "approved_publish_pending",
        "log": r.stdout[-500:] if r.stdout else "",
        "error": r.stderr[-300:] if r.returncode != 0 else None,
    })


@app.post("/reel/reject/{stem}")
async def reel_reject(stem: str):
    vid_engine = VIDEO_ENGINE
    review = vid_engine / "jobs" / "review" / f"{stem}.json"
    rejected = vid_engine / "jobs" / "rejected"
    if not review.exists():
        raise HTTPException(404, "Reel not found or already handled")
    rejected.mkdir(parents=True, exist_ok=True)
    review.rename(rejected / review.name)
    return JSONResponse({"status": "rejected"})


@app.get("/api/reels/review")
async def api_reels_review():
    vid_engine = VIDEO_ENGINE
    review_dir = vid_engine / "jobs" / "review"
    reels = []
    if review_dir.exists():
        for jp in sorted(review_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
            try:
                jd = json.loads(jp.read_text())
                video_url = jd.get("stages", {}).get("store", {}).get("url", "")
                qa = jd.get("stages", {}).get("master_qa", {})
                reels.append({
                    "stem": jp.stem,
                    "product": jd.get("product", "?"),
                    "product_id": jd.get("product_id"),
                    "platforms": jd.get("platforms", []),
                    "video_url": video_url,
                    "qa_score": qa.get("score", "?"),
                    "status": jd.get("status", "review"),
                })
            except Exception:
                continue
    return reels


@app.get("/reels", response_class=HTMLResponse)
async def reels_review_page(request: Request):
    reels = await api_reels_review()
    return templates.TemplateResponse(request, "reels.html", {"reels": reels})


@app.get("/api/status")
async def api_status():
    return {
        "pm2": _pm2_status(),
        "system": _system_stats(),
        "jobs_recent": get_jobs(5),
        "humanizer": _run_humanizer_status(),
    }


@app.get("/api/jobs")
async def api_jobs(limit: int = 20):
    return get_jobs(limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8078)
