#!/usr/bin/env python3
"""
Approved-reel publisher — the ONLY component that posts to social, and only from jobs/approved/.

The human-approval gate is enforced structurally: a reel can only be here because a human moved it
into jobs/approved/ (via Telegram or the web review page). This script does NOT decide what to post;
it just drains what was approved, under the same guardrails the worker uses (daily cap), then calls
the unified publisher Codex shipped (scripts/active/meta_publish.js) — which is itself dry-run by
default and only sends with --publish.

Safety:
  * Dry-run by default. Prints what WOULD post. Add --live to actually call meta_publish --publish.
  * Daily cap (config/providers.json guardrails.max_videos_per_day) is enforced before posting.
  * On publish failure the job stays in approved/ (retried next run); success -> published/.

    python3 publish_approved.py            # dry-run: list approved reels + what would post
    python3 publish_approved.py --live     # actually publish each approved reel
"""
from __future__ import annotations
import argparse, datetime, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JOBS = ROOT / "jobs"
APPROVED, PUBLISHED = JOBS / "approved", JOBS / "published"
STATE = ROOT / "state"
CONFIG = ROOT / "config" / "providers.json"
META_PUBLISH = ROOT.parent / "scripts" / "active" / "meta_publish.js"


def today() -> str:
    return datetime.date.today().isoformat()


def guardrails() -> dict:
    if CONFIG.exists():
        return json.loads(CONFIG.read_text()).get("guardrails", {})
    return {"max_videos_per_day": 6}


def ledger() -> dict:
    f = STATE / f"ledger-{today()}.json"
    if f.exists():
        return json.loads(f.read_text())
    return {"date": today(), "videos_published": 0, "spent_usd": 0.0}


def save_ledger(led: dict):
    STATE.mkdir(exist_ok=True)
    (STATE / f"ledger-{today()}.json").write_text(json.dumps(led, indent=2))


def run(live: bool):
    APPROVED.mkdir(parents=True, exist_ok=True)
    PUBLISHED.mkdir(parents=True, exist_ok=True)
    jobs = sorted(APPROVED.glob("*.json"), key=lambda p: p.stat().st_mtime)
    if not jobs:
        print("[publish] no approved reels")
        return
    g = guardrails()
    cap = g.get("max_videos_per_day", 6)
    led = ledger()
    print(f"[publish] {len(jobs)} approved | published today {led['videos_published']}/{cap} | "
          f"mode={'LIVE' if live else 'DRY-RUN'}")

    for jp in jobs:
        job = json.loads(jp.read_text())
        jid = job.get("id", jp.stem)
        url = job.get("stages", {}).get("store", {}).get("url", "")
        if not url:
            print(f"[publish] {jid}: no hosted URL — skipping (not built?)")
            continue
        if led["videos_published"] >= cap:
            print(f"[publish] daily cap {cap} reached — stopping ({jid} stays approved)")
            break

        cmd = ["node", str(META_PUBLISH), "--job", str(jp.resolve())]
        if live:
            cmd.append("--publish")
        else:
            print(f"[publish] DRY-RUN would post {jid}: {url}")
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        sys.stdout.write(r.stdout.strip()[-600:] + "\n")
        if r.returncode != 0:
            sys.stderr.write(r.stderr.strip()[-600:] + "\n")
            print(f"[publish] {jid}: publish FAILED — staying in approved/ for retry")
            continue
        if live:
            job["status"] = "published"
            jp.write_text(json.dumps(job, indent=2))
            jp.rename(PUBLISHED / jp.name)
            led["videos_published"] += 1
            save_ledger(led)
            print(f"[publish] {jid} -> PUBLISHED")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--live", action="store_true", help="actually publish (default dry-run)")
    a = ap.parse_args()
    run(a.live)


if __name__ == "__main__":
    main()
