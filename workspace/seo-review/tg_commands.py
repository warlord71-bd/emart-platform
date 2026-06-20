#!/usr/bin/env python3
"""
SEO pipeline command handler for Emart.

Two modes:
  1. CLI (called by OpenClaw agent or directly):
     python3 tg_commands.py report    — print formatted report to stdout
     python3 tg_commands.py top10     — print top 10 priority products
     python3 tg_commands.py trends    — print trend signals
     python3 tg_commands.py drops     — print position drops
     python3 tg_commands.py humanize  — print humanizer queue
     python3 tg_commands.py status    — print system health
     python3 tg_commands.py run       — trigger full pipeline, print result
     python3 tg_commands.py help      — list commands

  2. Telegram direct (standalone, for cron fallback):
     python3 tg_commands.py --tg report 6639867372
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

OUTPUT_DIR = Path("/root/emart-platform/workspace/seo-review")

# ── Command implementations (return text, no side effects) ────────────────────

def cmd_report() -> str:
    f = OUTPUT_DIR / "actions.json"
    if not f.exists():
        return "No report yet. Run: python3 workspace/seo-review/gsc_tracker.py full"
    a = json.loads(f.read_text())
    s = a.get("summary", {})
    lines = [
        f"📊 SEO Report — {a['generated']}",
        f"",
        f"Clicks: {s.get('total_clicks',0)} | Impressions: {s.get('total_impressions',0):,}",
        f"Pages in search: {s.get('pages_in_search',0)}",
        f"▲ {s.get('risers',0)} risers | ▼ {s.get('fallers',0)} fallers",
    ]
    if s.get('hot_trends'):
        lines.append(f"🔥 {s['hot_trends']} trending queries")

    if a.get("auto_executed"):
        lines.append(f"\n✅ AUTO-DONE:")
        for x in a["auto_executed"]:
            lines.append(f"  • {x}")

    if a.get("agent_tasks"):
        high = [t for t in a["agent_tasks"] if t["priority"] == "HIGH"]
        med = [t for t in a["agent_tasks"] if t["priority"] != "HIGH"]
        lines.append(f"\n🤖 AGENT TASKS ({len(a['agent_tasks'])}):")
        for t in high[:5]:
            name = t.get("slug", t.get("query", "?"))[:40]
            lines.append(f"  🔴 {t['type']}: {name}")
            lines.append(f"     WHY: {t['why'][:100]}")
            lines.append(f"     HOW: {t['how'][:100]}")
        if med:
            lines.append(f"  + {len(med)} medium priority tasks")

    if a.get("owner_tasks"):
        lines.append(f"\n👤 OWNER TASKS ({len(a['owner_tasks'])}):")
        for t in a["owner_tasks"]:
            lines.append(f"  {'⚡' if t['priority']=='HIGH' else '•'} [{t['priority']}] {t['type']}")
            lines.append(f"    DO: {t['action'][:100]}")
            lines.append(f"    WHY: {t['why'][:100]}")

    return "\n".join(lines)

def cmd_top10() -> str:
    f = OUTPUT_DIR / "priority-queue.json"
    if not f.exists():
        return "No data. Run pipeline first."
    q = json.loads(f.read_text())
    lines = [f"🏆 Top 10 SEO Priority — {q.get('generated','?')}", ""]
    for i, x in enumerate(q["priority_queue"][:10], 1):
        lines.append(f"{i}. {x['slug'][:45]}")
        lines.append(f"   Score:{x['opportunity_score']:.0f} | Pos:{x['position']:.1f} | Impr:{x['impressions']} | CTR:{x['ctr']*100:.1f}% | Clicks:{x['clicks']}")
        if x.get("top_queries"):
            top_q = x["top_queries"][0]["query"][:40]
            lines.append(f"   Top query: \"{top_q}\"")
        lines.append("")
    return "\n".join(lines)

def cmd_trends() -> str:
    f = OUTPUT_DIR / "search-trends.json"
    if not f.exists():
        return "No trend data. Run: python3 workspace/seo-review/gsc_tracker.py search-trends"
    st = json.loads(f.read_text())
    lines = [f"📈 Search Trends — {st.get('generated','?')}", ""]

    hot = st.get("hot_queries", [])
    cooling = st.get("cooling_queries", [])

    if hot:
        lines.append("🔥 HOT (rising interest — create content NOW):")
        for x in hot:
            lines.append(f"  • \"{x['query']}\" — {x['gsc_impressions']} impressions, pos {x['gsc_position']:.1f}")
        lines.append("")

    if cooling:
        lines.append("❄️ COOLING (falling interest — don't invest heavy effort):")
        for x in cooling:
            lines.append(f"  • \"{x['query']}\"")
        lines.append("")

    steady = [x for x in st.get("all_trends", []) if x.get("combined_signal") == "STEADY"]
    if steady:
        lines.append(f"➖ STEADY ({len(steady)} queries): stable interest, maintain current content")

    return "\n".join(lines)

def cmd_drops() -> str:
    f = OUTPUT_DIR / "position-trends.json"
    if not f.exists():
        return "No trend data yet. Need 2+ daily snapshots."
    t = json.loads(f.read_text())
    fallers = t.get("fallers", [])
    if not fallers:
        return "✅ No significant position drops today."
    lines = [f"⚠️ Position Drops (investigate these)", ""]
    for x in fallers[:10]:
        lines.append(f"▼ {x['slug'][:45]}")
        lines.append(f"  {x['position_prev']:.1f} → {x['position_now']:.1f} (dropped {abs(x['position_delta']):.1f} positions)")
        lines.append("")

    new = t.get("new_in_search", [])
    lost = t.get("dropped_from_search", [])
    lines.append(f"New in search: {len(new)} | Dropped from search: {len(lost)}")
    return "\n".join(lines)

def cmd_humanize() -> str:
    f = OUTPUT_DIR / "humanizer-queue.json"
    if not f.exists():
        return "No humanizer data."
    h = json.loads(f.read_text())
    lines = [
        f"📝 Humanizer Queue — {h.get('generated','?')}",
        f"Total needing work: {h.get('needs_humanization',0)}",
        f"Already done: {h.get('already_humanized',0)}",
        "",
        "Top 10 targets (highest priority = rewrite first):",
        "",
    ]
    for i, x in enumerate(h["queue"][:10], 1):
        hot = " 🔥 TRENDING" if x.get("has_hot_trend") else ""
        lines.append(f"{i}. {x['slug'][:45]}{hot}")
        lines.append(f"   Priority:{x['humanizer_priority']:.0f} | Pos:{x['position']:.1f} | Impr:{x['impressions']} | Tier:{x['content_tier']}")
        if x.get("top_queries"):
            lines.append(f"   Query: \"{x['top_queries'][0]['query'][:40]}\"")
        lines.append("")
    return "\n".join(lines)

def cmd_status() -> str:
    lines = [f"🔧 System Status — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", ""]

    # Site
    try:
        import urllib.request
        r = urllib.request.urlopen("https://e-mart.com.bd/", timeout=5)
        lines.append(f"🌐 Site: HTTP {r.status} ✅")
    except Exception as e:
        lines.append(f"🌐 Site: ❌ {e}")

    # PM2
    try:
        pm2 = subprocess.run(["pm2", "jlist"], capture_output=True, text=True, timeout=5)
        procs = json.loads(pm2.stdout)
        online = [p["name"] for p in procs if p.get("pm2_env", {}).get("status") == "online"]
        stopped = [p["name"] for p in procs if p.get("pm2_env", {}).get("status") != "online"]
        lines.append(f"⚙️ PM2: {len(online)} online, {len(stopped)} stopped")
        if stopped:
            lines.append(f"   Stopped: {', '.join(stopped[:5])}")
    except Exception:
        lines.append(f"⚙️ PM2: check failed")

    # GSC data freshness
    daily_dir = OUTPUT_DIR / "gsc-daily"
    if daily_dir.exists():
        files = sorted(daily_dir.glob("*.json"), reverse=True)
        if files:
            lines.append(f"📊 GSC latest: {files[0].stem} ({len(files)} snapshots)")

    # Cron check
    try:
        crons = subprocess.run(["crontab", "-l"], capture_output=True, text=True, timeout=3)
        if "gsc_tracker" in crons.stdout:
            lines.append(f"⏰ SEO cron: active (2:30 AM daily)")
        else:
            lines.append(f"⏰ SEO cron: NOT FOUND ❌")
    except Exception:
        pass

    # Actions summary
    af = OUTPUT_DIR / "actions.json"
    if af.exists():
        a = json.loads(af.read_text())
        lines.append(f"📋 Actions: {len(a.get('agent_tasks',[]))} agent + {len(a.get('owner_tasks',[]))} owner")

    return "\n".join(lines)

def cmd_run() -> str:
    try:
        result = subprocess.run(
            ["python3", "workspace/seo-review/gsc_tracker.py", "full"],
            capture_output=True, text=True, timeout=120,
            cwd="/root/emart-platform",
        )
        if result.returncode == 0:
            return f"✅ Pipeline complete.\n\n{result.stdout[-500:]}"
        else:
            return f"❌ Pipeline failed:\n{result.stderr[:500]}"
    except Exception as e:
        return f"❌ Error: {e}"

def cmd_help() -> str:
    return "\n".join([
        "📋 Emart SEO Bot Commands", "",
        "/report    — full daily SEO report with actions",
        "/top10     — top 10 priority products to fix",
        "/trends    — Google + YouTube search trends (HOT/COOLING)",
        "/drops     — products that lost ranking position",
        "/humanize  — top products needing content rewrite",
        "/status    — system health (site, PM2, cron, data freshness)",
        "/state     — full system state (agents, commits, pipelines)",
        "/run       — trigger fresh pipeline run now",
        "/help      — this message",
        "",
        "Reports run automatically at 2:30 AM daily.",
        "Results are sent to Telegram + saved in workspace/seo-review/",
    ])

def cmd_state() -> str:
    try:
        result = subprocess.run(
            ["python3", "workspace/seo-review/system_state.py"],
            capture_output=True, text=True, timeout=15,
            cwd="/root/emart-platform",
        )
        return result.stdout if result.returncode == 0 else f"Error: {result.stderr[:300]}"
    except Exception as e:
        return f"Error: {e}"

COMMANDS = {
    "report": cmd_report,
    "top10": cmd_top10,
    "trends": cmd_trends,
    "drops": cmd_drops,
    "humanize": cmd_humanize,
    "status": cmd_status,
    "state": cmd_state,
    "run": cmd_run,
    "help": cmd_help,
    "start": cmd_help,
}

# ── Telegram send helper ─────────────────────────────────────────────────────

def send_tg(chat_id: str, text: str):
    import urllib.request, urllib.parse
    token = _load_token()
    if not token:
        print("No bot token"); return
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = urllib.parse.urlencode({
            "chat_id": chat_id, "text": text[:4000],
            "parse_mode": "HTML", "disable_web_page_preview": "true",
        }).encode()
        urllib.request.urlopen(url, data, timeout=10)
    except Exception as e:
        print(f"Telegram send failed: {e}")

def _load_token():
    env_file = Path("/root/.openclaw/openclaw.env")
    if env_file.exists():
        for line in env_file.read_text().strip().split("\n"):
            if line.startswith("TELEGRAM_BOT_TOKEN="):
                return line.split("=", 1)[1].strip()
    return os.environ.get("TELEGRAM_BOT_TOKEN", "")

# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(cmd_help())
        sys.exit(0)

    # Mode: --tg <command> <chat_id> — send result to Telegram
    if sys.argv[1] == "--tg" and len(sys.argv) >= 3:
        command = sys.argv[2].lstrip("/")
        chat_id = sys.argv[3] if len(sys.argv) > 3 else "6639867372"
        if command in COMMANDS:
            result = COMMANDS[command]()
            send_tg(chat_id, result)
            print(f"Sent {command} to {chat_id}")
        else:
            send_tg(chat_id, f"Unknown command: {command}\n{cmd_help()}")
        sys.exit(0)

    # Mode: <command> — print to stdout (for OpenClaw agent or direct use)
    command = sys.argv[1].lstrip("/")
    if command in COMMANDS:
        print(COMMANDS[command]())
    else:
        print(f"Unknown command: {command}")
        print(cmd_help())
        sys.exit(1)
