#!/usr/bin/env python3
"""
Emart Reels approval bot — "see and approve" finished reels in Telegram.

WHY a dedicated bot: OpenClaw already long-polls the main Emart bot, and two pollers on one token
conflict (CLAUDE.md hard rule). This bot uses its OWN token, so it never touches OpenClaw and never
edits the fragile gateway config. It is the human-approval surface for the video pipeline.

Flow:
  * Watches jobs/review/ (reels that orchestrator.py built + QA'd and parked at the approval gate).
  * Sends each new one as a PLAYABLE video (by public URL) with inline buttons:
        [ ✅ Approve & Publish ]   [ ❌ Reject ]
  * On Approve  -> move review/ -> approved/, run publish_approved.py --live, report result.
  * On Reject   -> move review/ -> rejected/.
  Nothing publishes without the human tapping Approve. Daily cap still enforced by publish_approved.

Setup (one-time, by the owner):
  1. Talk to @BotFather, /newbot -> get the token.
  2. Put it in apps/web/.env.local as:   REELS_BOT_TOKEN=123456:ABC...
  3. Start the bot (PM2): pm2 start reels_bot.py --name emart-reels-bot --interpreter python3
  4. In Telegram, open your new bot and send /start once (the bot learns your chat_id).

State (offset, chat_id) is kept in jobs/.bot_state.json. Run:
  python3 reels_bot.py            # long-poll loop (PM2 runs this)
  python3 reels_bot.py --check    # one pass: send any new review reels, drain pending taps, exit
"""
from __future__ import annotations
import argparse, json, subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JOBS = ROOT / "jobs"
REVIEW, APPROVED, REJECTED = JOBS / "review", JOBS / "approved", JOBS / "rejected"
STATE = JOBS / ".bot_state.json"
PUBLISH = ROOT / "publish_approved.py"
SOCIAL_ENGINE = ROOT.parent / "social-engine" / "social_engine.py"
ENV_FILE = Path("/var/www/emart-platform/apps/web/.env.local")
ENV_FILE_LOCAL = ROOT.parent.parent / "apps" / "web" / ".env.local"


def token() -> str:
    for f in (ENV_FILE, ENV_FILE_LOCAL):
        if f.exists():
            for line in f.read_text().splitlines():
                line = line.strip()
                if line.startswith("REELS_BOT_TOKEN="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def load_state() -> dict:
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"offset": 0, "chat_id": None}


def save_state(s: dict):
    JOBS.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(s, indent=2))


def api(tok: str, method: str, **params):
    data = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None}).encode()
    url = f"https://api.telegram.org/bot{tok}/{method}"
    try:
        with urllib.request.urlopen(url, data=data, timeout=40) as r:
            return json.loads(r.read())
    except Exception as e:
        sys.stderr.write(f"[reels-bot] {method} failed: {e}\n")
        return {"ok": False, "error": str(e)}


def kb(stem: str) -> str:
    return json.dumps({"inline_keyboard": [[
        {"text": "✅ Approve & Publish", "callback_data": f"ap|{stem}"},
        {"text": "❌ Reject", "callback_data": f"rj|{stem}"},
    ]]})


def qa_line(job: dict) -> str:
    qa = job.get("stages", {}).get("qa", {})
    hard = (qa.get("hard") or {}).get("status", "?")
    return f"tech:{hard} | vision:{qa.get('vision_status') or '—'} | score:{qa.get('score','—')}"


def archive_done_jobs():
    if not SOCIAL_ENGINE.exists():
        return
    subprocess.run(
        [sys.executable, str(SOCIAL_ENGINE), "archive-done", "--video-jobs", str(JOBS), "--apply"],
        capture_output=True,
        text=True,
        timeout=120,
    )


def send_new_reviews(tok: str, st: dict):
    """post any review/ reel the owner hasn't seen yet (one video + buttons)."""
    chat = st.get("chat_id")
    if not chat:
        return  # waiting for /start to learn the chat_id
    REVIEW.mkdir(parents=True, exist_ok=True)
    for jp in sorted(REVIEW.glob("*.json")):
        job = json.loads(jp.read_text())
        if job.get("_tg_sent"):
            continue
        jid = job.get("id", jp.stem)
        url = job.get("stages", {}).get("store", {}).get("url", "")
        cap = (f"🎬 Reel ready for review: {jid}\n{qa_line(job)}\n"
               f"Approve = publishes it (gated by daily cap). Reject = discards.")
        res = api(tok, "sendVideo", chat_id=chat, video=url, caption=cap,
                  reply_markup=kb(jp.stem)) if url else {"ok": False}
        if not res.get("ok"):  # URL too big / unreachable -> fall back to a link + buttons
            res = api(tok, "sendMessage", chat_id=chat,
                      text=cap + (f"\n▶ {url}" if url else ""), reply_markup=kb(jp.stem))
        job["_tg_sent"] = True
        if res.get("ok"):
            job["_tg_msg_id"] = res["result"]["message_id"]
        jp.write_text(json.dumps(job, indent=2))


def handle_callback(tok: str, cq: dict):
    data = cq.get("data", "")
    cid = cq["id"]
    msg = cq.get("message", {})
    chat = msg.get("chat", {}).get("id")
    mid = msg.get("message_id")
    if "|" not in data:
        api(tok, "answerCallbackQuery", callback_query_id=cid); return
    action, stem = data.split("|", 1)
    jp = REVIEW / f"{stem}.json"
    if not jp.exists():
        api(tok, "answerCallbackQuery", callback_query_id=cid, text="Already handled.")
        return
    if action == "rj":
        REJECTED.mkdir(parents=True, exist_ok=True)
        jp.rename(REJECTED / jp.name)
        archive_done_jobs()
        api(tok, "answerCallbackQuery", callback_query_id=cid, text="Rejected ❌")
        api(tok, "editMessageReplyMarkup", chat_id=chat, message_id=mid,
            reply_markup=json.dumps({"inline_keyboard": [[{"text": "❌ Rejected", "callback_data": "x"}]]}))
        return
    # approve -> move to approved/, publish live, report
    APPROVED.mkdir(parents=True, exist_ok=True)
    dest = APPROVED / jp.name
    jp.rename(dest)
    api(tok, "answerCallbackQuery", callback_query_id=cid, text="Approved — publishing…")
    r = subprocess.run([sys.executable, str(PUBLISH), "--live"], capture_output=True, text=True, timeout=600)
    out = (r.stdout or "")[-300:]
    ok = "PUBLISHED" in out or dest.exists() is False  # publish_approved moves to published/ on success
    label = "✅ Published" if ok and r.returncode == 0 else "✅ Approved (publish pending/failed)"
    api(tok, "editMessageReplyMarkup", chat_id=chat, message_id=mid,
        reply_markup=json.dumps({"inline_keyboard": [[{"text": label, "callback_data": "x"}]]}))
    if r.returncode != 0:
        api(tok, "sendMessage", chat_id=chat, text=f"Publish issue for {stem}:\n{(r.stderr or '')[-300:]}")


def poll_once(tok: str, st: dict):
    send_new_reviews(tok, st)
    res = api(tok, "getUpdates", offset=st.get("offset", 0), timeout=25,
              allowed_updates=json.dumps(["message", "callback_query"]))
    if not res.get("ok"):
        return
    for upd in res["result"]:
        st["offset"] = upd["update_id"] + 1
        if "message" in upd:
            chat = upd["message"].get("chat", {}).get("id")
            if chat and st.get("chat_id") != chat:
                st["chat_id"] = chat
                api(tok, "sendMessage", chat_id=chat,
                    text="✅ Emart Reels bot linked. You'll get each finished reel here to approve before it posts.")
        elif "callback_query" in upd:
            handle_callback(tok, upd["callback_query"])
    save_state(st)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="one pass then exit (for cron); default = loop")
    a = ap.parse_args()
    tok = token()
    if not tok:
        sys.exit("REELS_BOT_TOKEN not set in apps/web/.env.local — see this file's header for setup.")
    st = load_state()
    if a.check:
        poll_once(tok, st); return
    print("[reels-bot] polling… (Ctrl-C to stop)")
    while True:
        try:
            poll_once(tok, st)
        except Exception as e:
            sys.stderr.write(f"[reels-bot] loop error: {e}\n")
            time.sleep(5)


if __name__ == "__main__":
    main()
