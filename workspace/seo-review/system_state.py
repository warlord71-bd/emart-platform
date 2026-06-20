#!/usr/bin/env python3
"""
Unified system state generator for Emart.

Writes a single JSON file that ANY agent, script, or cron can read
to know the full state of the platform.

Usage:
  python3 workspace/seo-review/system_state.py          # generate + print
  python3 workspace/seo-review/system_state.py --tg      # generate + send to Telegram

Reads from:
  - PM2 process list
  - GSC pipeline outputs (priority-queue, trends, actions)
  - Agent bus (who's working on what)
  - SESSION-LOG.md (recent agent activity)
  - git log (recent commits)
  - crontab (scheduled jobs)
  - WooCommerce (product/order counts)
  - Site health (HTTP check)

Writes to:
  workspace/seo-review/system-state.json
  /root/.openclaw/workspace-emart/system-state.json  (symlink)
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

STATE_FILE = Path("/root/emart-platform/workspace/seo-review/system-state.json")
OPENCLAW_LINK = Path("/root/.openclaw/workspace-emart/system-state.json")
AGENT_BUS = Path("/root/emart-platform/apps/web/.agent-memory/AGENT_BUS.md")
SESSION_LOG = Path("/root/emart-platform/apps/web/SESSION-LOG.md")
ACTIONS_FILE = Path("/root/emart-platform/workspace/seo-review/actions.json")
QUEUE_FILE = Path("/root/emart-platform/workspace/seo-review/priority-queue.json")
TRENDS_FILE = Path("/root/emart-platform/workspace/seo-review/search-trends.json")
TASKS_FILE = Path("/root/emart-platform/workspace/TASKS.md")

def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def _run(cmd, timeout=5):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip()
    except Exception:
        return ""

def get_site_health():
    try:
        import urllib.request
        req = urllib.request.Request(
            "https://e-mart.com.bd/",
            headers={
                "User-Agent": "Emart-System-State/1.0",
                "Accept": "text/html,application/xhtml+xml",
            },
        )
        r = urllib.request.urlopen(req, timeout=5)
        return {"status": r.status, "ok": True}
    except Exception as e:
        return {"status": 0, "ok": False, "error": str(e)[:80]}

def get_pm2():
    intentionally_stopped = {
        "emart-blog-generator",
        "emart-checkout-monitor",
        "emart-competitor-prices",
        "emart-revenue-health",
        "emart-seo-autoscan",
        "emart-meta-gen",
    }
    try:
        out = _run("pm2 jlist", timeout=5)
        procs = json.loads(out)
        stopped = [p["name"] for p in procs if p.get("pm2_env", {}).get("status") != "online"]
        return {
            "online": [p["name"] for p in procs if p.get("pm2_env", {}).get("status") == "online"],
            "stopped_expected": [name for name in stopped if name in intentionally_stopped],
            "stopped_unexpected": [name for name in stopped if name not in intentionally_stopped],
            "total": len(procs),
        }
    except Exception:
        return {"online": [], "stopped_expected": [], "stopped_unexpected": [], "total": 0}

def get_git_recent():
    out = _run("git -C /root/emart-platform log --oneline -10 --format='%h|%s|%an|%ar'")
    commits = []
    for line in out.split("\n"):
        if "|" in line:
            parts = line.split("|", 3)
            commits.append({
                "hash": parts[0], "message": parts[1],
                "author": parts[2] if len(parts) > 2 else "",
                "ago": parts[3] if len(parts) > 3 else "",
            })
    return commits

def get_crons():
    out = _run("crontab -l 2>/dev/null")
    jobs = []
    for line in out.split("\n"):
        line = line.strip()
        if line and not line.startswith("#"):
            jobs.append(line[:100])
    return jobs

def get_agent_bus():
    if not AGENT_BUS.exists():
        return {"active": [], "last_completed": []}
    text = AGENT_BUS.read_text()

    active = []
    last = []

    in_active = False
    in_last = False
    for line in text.split("\n"):
        if "ACTIVE WORK" in line:
            in_active = True; in_last = False; continue
        if "LAST COMPLETED" in line:
            in_active = False; in_last = True; continue
        if "CONFLICT ZONES" in line or "HOW TO USE" in line:
            in_active = False; in_last = False; continue

        if "|" in line and "---" not in line and "Agent" not in line and "(none)" not in line:
            cells = [c.strip() for c in line.split("|") if c.strip()]
            if cells and cells[0].lower() in {"agent", "owner", "status"}:
                continue
            if in_active and len(cells) >= 3:
                active.append({"agent": cells[0], "started": cells[1], "task": cells[2]})
            elif in_last and len(cells) >= 3:
                last.append({"agent": cells[0], "when": cells[1], "what": cells[2]})

    return {"active": active, "last_completed": last[:5]}

def get_session_log_recent():
    if not SESSION_LOG.exists():
        return []
    lines = SESSION_LOG.read_text().strip().split("\n")
    entries = []
    current = None
    for line in lines[-30:]:
        if line.startswith("## "):
            if current:
                entries.append(current)
            current = {"header": line[3:].strip(), "items": []}
        elif current and line.startswith("- "):
            current["items"].append(line[2:].strip()[:120])
    if current:
        entries.append(current)
    return entries[-5:]

def get_seo_pipeline():
    result = {}
    if ACTIONS_FILE.exists():
        a = json.loads(ACTIONS_FILE.read_text())
        result["actions"] = {
            "generated": a.get("generated"),
            "auto_done": len(a.get("auto_executed", [])),
            "agent_tasks": len(a.get("agent_tasks", [])),
            "owner_tasks": len(a.get("owner_tasks", [])),
        }
        result["summary"] = a.get("summary", {})

    if QUEUE_FILE.exists():
        q = json.loads(QUEUE_FILE.read_text())
        result["priority_top5"] = [
            {"slug": x["slug"][:40], "score": x["opportunity_score"], "position": x["position"]}
            for x in q.get("priority_queue", [])[:5]
        ]

    if TRENDS_FILE.exists():
        t = json.loads(TRENDS_FILE.read_text())
        result["hot_queries"] = [x["query"] for x in t.get("hot_queries", [])]
        result["cooling_queries"] = [x["query"] for x in t.get("cooling_queries", [])]

    # GSC snapshot freshness
    daily_dir = Path("/root/emart-platform/workspace/seo-review/gsc-daily")
    if daily_dir.exists():
        files = sorted(daily_dir.glob("*.json"), reverse=True)
        result["gsc_latest"] = files[0].stem if files else None
        result["gsc_snapshots"] = len(files)

    return result

def get_ai_plan_status():
    plan_file = Path("/root/emart-platform/workspace/AI_PLAN.md")
    if not plan_file.exists():
        return {}
    text = plan_file.read_text()
    phases = {}
    for m in re.finditer(r'### (PHASE \d+)[^\n]*\n\n\|[^\n]+\n\|[^\n]+\n((?:\|[^\n]+\n)*)', text):
        phase = m.group(1)
        rows = m.group(2)
        total = rows.count("|") // 6  # rough count
        phases[phase] = {"in_plan": True}
    return phases

def get_task_counts():
    if not TASKS_FILE.exists():
        return {}
    text = TASKS_FILE.read_text()
    return {
        "checked": text.count("- [x]"),
        "unchecked": text.count("- [ ]"),
        "open_markers": text.count("🔲"),
        "warn_markers": text.count("⚠️"),
    }

def main():
    state = {
        "generated": now_iso(),
        "site": get_site_health(),
        "pm2": get_pm2(),
        "agents": get_agent_bus(),
        "session_log": get_session_log_recent(),
        "git_recent": get_git_recent()[:5],
        "crons": get_crons(),
        "seo_pipeline": get_seo_pipeline(),
        "task_counts": get_task_counts(),
    }

    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False))

    # Symlink for OpenClaw
    if not OPENCLAW_LINK.exists():
        try:
            OPENCLAW_LINK.symlink_to(STATE_FILE)
        except Exception:
            pass

    # Print summary
    s = state
    pm = s["pm2"]
    seo = s.get("seo_pipeline", {})
    agents = s["agents"]
    tc = s.get("task_counts", {})

    print(f"🔧 SYSTEM STATE — {s['generated']}")
    print(f"")
    print(f"Site:     {'✅' if s['site']['ok'] else '❌'} HTTP {s['site'].get('status','?')}")
    print(
        f"PM2:      {len(pm['online'])} online, "
        f"{len(pm['stopped_unexpected'])} unexpected stopped, "
        f"{len(pm['stopped_expected'])} intentionally stopped"
    )
    print(f"GSC:      {seo.get('gsc_latest','none')} ({seo.get('gsc_snapshots',0)} snapshots)")
    print(f"Actions:  {seo.get('actions',{}).get('agent_tasks',0)} agent + {seo.get('actions',{}).get('owner_tasks',0)} owner")
    print(f"Tasks:    {tc.get('checked',0)} done, {tc.get('unchecked',0)} pending")
    print(f"")

    if agents["active"]:
        print(f"🔴 ACTIVE AGENTS:")
        for a in agents["active"]:
            print(f"  {a['agent']}: {a['task']}")
    else:
        print(f"No agents currently active")

    print(f"")
    print(f"Recent commits:")
    for c in s["git_recent"][:3]:
        print(f"  {c['hash']} {c['message'][:50]} ({c['author']}, {c['ago']})")

    # Telegram mode
    if "--tg" in sys.argv:
        tg_lines = [
            f"<b>🔧 System State — {s['generated'][:10]}</b>",
            f"Site: {'✅' if s['site']['ok'] else '❌'} | PM2: {len(pm['online'])} online / {len(pm['stopped_unexpected'])} unexpected stopped",
            f"GSC: {seo.get('gsc_latest','?')} | Tasks: {tc.get('unchecked',0)} pending",
        ]
        if agents["active"]:
            tg_lines.append(f"\n<b>🔴 Active:</b>")
            for a in agents["active"]:
                tg_lines.append(f"  {a['agent']}: {a['task'][:50]}")
        if agents["last_completed"]:
            tg_lines.append(f"\n<b>✅ Last done:</b>")
            for a in agents["last_completed"][:3]:
                tg_lines.append(f"  {a['agent']}: {a['what'][:50]}")

        text = "\n".join(tg_lines)

        env_file = Path("/root/.openclaw/openclaw.env")
        token = ""
        if env_file.exists():
            for line in env_file.read_text().split("\n"):
                if line.startswith("TELEGRAM_BOT_TOKEN="):
                    token = line.split("=", 1)[1].strip()

        if token:
            import urllib.request, urllib.parse
            for cid in ["6906852635", "6639867372"]:
                try:
                    data = urllib.parse.urlencode({
                        "chat_id": cid, "text": text,
                        "parse_mode": "HTML", "disable_web_page_preview": "true",
                    }).encode()
                    urllib.request.urlopen(
                        f"https://api.telegram.org/bot{token}/sendMessage",
                        data, timeout=10,
                    )
                except Exception:
                    pass
            print(f"\nTelegram sent")

if __name__ == "__main__":
    main()
