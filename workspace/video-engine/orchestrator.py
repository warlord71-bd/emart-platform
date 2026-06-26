#!/usr/bin/env python3
"""
Video orchestrator — the autonomous brain in front of worker.py.

Design (decided 2026-06-24): the engine is FULLY AUTONOMOUS up to a finished, QA'd draft,
then HARD-STOPS at a human-approval gate. Nothing is published without a human moving the job
into jobs/approved/ (via Telegram or the web review page — those just move a file).

File-queue lifecycle (priority by filename prefix `NN-`, lower = higher priority):

    jobs/queue/      jobs waiting to be built
    jobs/building/   one job in flight (crash-safe; reclaimed next tick)
    jobs/review/     built + QA'd, hosted URL ready — WAITING FOR HUMAN APPROVAL  (gate)
    jobs/approved/   human said yes  -> publish_approved.py posts it, then -> published/
    jobs/published/  done
    jobs/rejected/   human said no, or auto-failed hard QA

This file NEVER publishes and NEVER edits worker.py / meta_*. It only invokes the worker in
dry-run and moves job files. Run one tick per cron invocation:

    python3 orchestrator.py --tick        # build the single highest-priority queued job
    python3 orchestrator.py --status      # print pipeline counts (the CLI dashboard)
    python3 orchestrator.py --reclaim     # move stale jobs/building/* back to queue (crash recovery)

Auto-escalate to Codex (merit = QA fail): if the free image path produces a reel whose vision QA
verdict is FAIL, the orchestrator flips the job to `holding_request: true`, clears the render
stages, and requeues it. worker.py's existing idempotent codex_bridge handoff emits the Codex
work order and consumes the premium "model-holding-real-product" shot on the next tick. Codex is
only ever pulled in when quality actually demands it — autonomy is preserved.
"""
from __future__ import annotations
import argparse, fcntl, json, os, re, subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WORKER = ROOT / "worker.py"
JOBS = ROOT / "jobs"
QUEUE, BUILDING, REVIEW = JOBS / "queue", JOBS / "building", JOBS / "review"
APPROVED, PUBLISHED, REJECTED = JOBS / "approved", JOBS / "published", JOBS / "rejected"
DEAD_LETTER = JOBS / "dead-letter"
LANES = [QUEUE, BUILDING, REVIEW, APPROVED, PUBLISHED, REJECTED, DEAD_LETTER]
LOCK_FILE = ROOT / ".orchestrator.lock"
OPENCLAW_ENV = Path("/root/.openclaw/openclaw.env")
BUILDING_STALE_S = 60 * 60
ESCALATE_CLEAR = ("images", "reel", "qa", "store", "publish")
SILENCE_LUFS = -40.0
DEFAULT_QA = "master"
MAX_RETRIES = 3


class WorkerLock:
    """Exclusive flock — prevents overlapping orchestrator ticks."""
    def __init__(self):
        self._fd = None
    def __enter__(self):
        self._fd = open(LOCK_FILE, "w")
        try:
            fcntl.flock(self._fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            self._fd.close()
            print("[orchestrator] another tick is already running — skipping")
            sys.exit(0)
        self._fd.write(str(os.getpid()))
        self._fd.flush()
        return self
    def __exit__(self, *_):
        if self._fd:
            fcntl.flock(self._fd, fcntl.LOCK_UN)
            self._fd.close()


def ensure_dirs():
    for d in LANES:
        d.mkdir(parents=True, exist_ok=True)


def priority(p: Path) -> tuple[int, float]:
    m = re.match(r"(\d+)", p.name)
    return (int(m.group(1)) if m else 50, p.stat().st_mtime)


def load_tg_env() -> dict:
    env = {}
    if OPENCLAW_ENV.exists():
        for line in OPENCLAW_ENV.read_text().splitlines():
            line = line.strip()
            if line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def notify(text: str):
    """Outbound-only Telegram ping (reuses the bot OpenClaw already polls — no second poller)."""
    env = load_tg_env()
    tok, chat = env.get("TELEGRAM_BOT_TOKEN"), env.get("TELEGRAM_CHAT_ID")
    if not tok or not chat:
        return
    try:
        data = urllib.parse.urlencode({"chat_id": chat, "text": text,
                                       "disable_web_page_preview": "false"}).encode()
        urllib.request.urlopen(f"https://api.telegram.org/bot{tok}/sendMessage", data=data, timeout=15)
    except Exception as e:
        sys.stderr.write(f"[orchestrator] telegram notify failed: {e}\n")


def integrated_lufs(mp4: str) -> float:
    """API-free loudness probe (ffmpeg ebur128). Returns integrated LUFS, or -99 if unreadable.
    The cheap, always-available backstop that catches a silent reel even when vision QA is offline."""
    try:
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", mp4, "-af", "ebur128",
                            "-f", "null", "-"], capture_output=True, text=True, timeout=120)
        val = None
        for line in r.stderr.splitlines():
            line = line.strip()
            if line.startswith("I:") and "LUFS" in line:   # last "I:" wins = integrated
                try:
                    val = float(line.split()[1])
                except (ValueError, IndexError):
                    pass
        return val if val is not None else -99.0
    except Exception:
        return -99.0


def qa_summary(job: dict) -> str:
    qa = job.get("stages", {}).get("qa", {})
    hard = (qa.get("hard") or {}).get("status", "?")
    vis = qa.get("vision_status") or "—"
    score = qa.get("score")
    parts = [f"tech:{hard}", f"vision:{vis}"]
    if score is not None:
        parts.append(f"score:{score}")
    return " | ".join(parts)


def reclaim_stale():
    ensure_dirs()
    now = time.time()
    moved = 0
    for j in BUILDING.glob("*.json"):
        if now - j.stat().st_mtime > BUILDING_STALE_S:
            j.rename(QUEUE / j.name)
            moved += 1
    if moved:
        print(f"[orchestrator] reclaimed {moved} stale building job(s)")
    return moved


def status():
    ensure_dirs()
    print("=== video pipeline ===")
    for d in LANES:
        files = sorted(p.name for p in d.glob("*.json"))
        print(f"{d.name:>10}: {len(files):>2}  {', '.join(files[:6])}{' …' if len(files) > 6 else ''}")


def tick():
    ensure_dirs()
    reclaim_stale()
    queued = sorted(QUEUE.glob("*.json"), key=priority)
    if not queued:
        print("[orchestrator] queue empty — nothing to build")
        return
    src = queued[0]
    job_path = BUILDING / src.name
    src.rename(job_path)
    print(f"[orchestrator] building {job_path.name} (priority {priority(job_path)[0]})")

    # force the full quality gate (loudness + multi-frame vision) unless the job explicitly overrides,
    # so dummy product / silent audio / bad frames are CAUGHT, not waved through on ffprobe alone.
    pre = json.loads(job_path.read_text())
    if not pre.get("qa_provider"):
        pre["qa_provider"] = DEFAULT_QA
        job_path.write_text(json.dumps(pre, indent=2))

    # run the existing engine in DRY-RUN (no --allow-publish). It builds reel + hosts URL + QA,
    # and stops at status 'ready' — it never posts. That 'ready' artifact IS the review draft.
    r = subprocess.run([sys.executable, str(WORKER), "--job", str(job_path)],
                       capture_output=True, text=True, timeout=900)
    sys.stdout.write(r.stdout[-1500:])
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-1500:])

    job = json.loads(job_path.read_text())
    qa = job.get("stages", {}).get("qa", {})
    vis = qa.get("vision_status")
    jid = job.get("id", job_path.stem)

    # loudness hard-gate (API-free): a silent/near-silent reel must NEVER reach review.
    mp4 = job.get("stages", {}).get("reel", {}).get("mp4")
    if mp4 and Path(mp4).exists():
        lufs = integrated_lufs(mp4)
        job.setdefault("stages", {}).setdefault("qa", {})["lufs"] = lufs
        if lufs < SILENCE_LUFS:
            job["status"] = "failed"
            job_path.write_text(json.dumps(job, indent=2))
            job_path.rename(REJECTED / job_path.name)
            notify(f"❌ Reel auto-failed (SILENT audio {lufs:.1f} LUFS): {jid}")
            print(f"[orchestrator] {jid} -> rejected (silent audio {lufs:.1f} LUFS)")
            return

    # hard failure (ffprobe / broken render) or opted-in vision block -> auto-reject, notify
    if job.get("status") == "failed":
        retries = job.get("_retry_count", 0)
        if retries < MAX_RETRIES:
            job["_retry_count"] = retries + 1
            job["status"] = "pending"
            job_path.write_text(json.dumps(job, indent=2))
            job_path.rename(QUEUE / job_path.name)
            print(f"[orchestrator] {jid} -> requeued (retry {retries + 1}/{MAX_RETRIES})")
            return
        job_path.rename(DEAD_LETTER / job_path.name)
        reason = qa.get("status_note") or qa.get("vision_issues") or "render/QA failure"
        notify(f"☠️ Reel dead-lettered (exhausted {MAX_RETRIES} retries): {jid}\n{reason}")
        print(f"[orchestrator] {jid} -> dead-letter ({reason})")
        return

    # merit-based Codex escalation: free image path produced a reel whose vision QA says FAIL.
    # Flip to the premium 'model-holding-real-product' Codex shot, clear render stages, requeue.
    free_path = not (job.get("holding_images") or job.get("_codex_escalated"))
    if vis == "fail" and free_path:
        job["holding_request"] = True
        job["_codex_escalated"] = True
        for s in ESCALATE_CLEAR:
            job.get("stages", {}).pop(s, None)
        job["status"] = "pending"
        (QUEUE / job_path.name).write_text(json.dumps(job, indent=2))
        job_path.unlink()
        notify(f"⤴️ Reel escalated to Codex premium image (free QA failed): {jid}")
        print(f"[orchestrator] {jid} -> requeued for Codex premium image")
        return

    # otherwise: finished draft -> HARD STOP at the human-approval gate
    job["status"] = "review"
    job_path.write_text(json.dumps(job, indent=2))
    job_path.rename(REVIEW / job_path.name)
    url = job.get("stages", {}).get("store", {}).get("url", "(no url)")
    notify(f"🎬 Reel ready for review: {jid}\nQA: {qa_summary(job)}\n▶ {url}\n"
           f"Approve in the review page or reply to this bot. Nothing posts until you approve.")
    print(f"[orchestrator] {jid} -> review (awaiting approval) | {url}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tick", action="store_true", help="build the highest-priority queued job")
    ap.add_argument("--status", action="store_true", help="print pipeline counts")
    ap.add_argument("--reclaim", action="store_true", help="requeue stale building jobs")
    a = ap.parse_args()
    if a.status:
        status()
    elif a.reclaim:
        reclaim_stale()
    elif a.tick:
        with WorkerLock():
            tick()
    else:
        ap.error("pass --tick / --status / --reclaim")


if __name__ == "__main__":
    main()
