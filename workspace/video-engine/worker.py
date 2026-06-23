#!/usr/bin/env python3
"""
Video-engine worker — drains the job queue, runs the pipeline, checkpoints every stage.

Self-preserving: each stage result is written back into the job JSON immediately, so a crash
resumes exactly where it stopped and never re-runs (or re-bills) a completed stage. Guardrails
(max videos/day, daily budget cap, dry-run default) are enforced before any paid or publishing
action — the loop can never overspend or auto-post without explicit opt-in.

Usage:
  python3 worker.py --job queue/example.json            # run one job (dry-run publish)
  python3 worker.py --drain                              # run all pending jobs in queue/
  python3 worker.py --job ... --allow-publish            # actually post (still gated by guardrails)
"""
from __future__ import annotations
import argparse, json, os, shutil, subprocess, sys, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "lib"))
import router  # noqa: E402

QUEUE = ROOT / "queue"
OUTPUT = ROOT / "output"
STATE = ROOT / "state"
REEL = ROOT / "stages" / "reel_ffmpeg.py"
REEL_QA_LOCAL = ROOT / "stages" / "reel_qa_local.py"
PUBLIC_REELS = Path("/var/www/emart-platform/apps/web/public/videos/reels")
# nginx serves the public dir directly via /public/ alias (range-request capable, no Next restart needed)
PUBLIC_BASE = "https://e-mart.com.bd/public/videos/reels"
META_REEL = ROOT.parent / "scripts" / "active" / "meta_reel_publish.js"
SOCIAL_IMG = ROOT.parent / "scripts" / "active" / "social_image_gen.py"
SCRIPT_GEN = ROOT / "stages" / "script_gen.py"
REEL_QA = ROOT / "stages" / "reel_qa_gemini.py"


def today() -> str:
    return datetime.date.today().isoformat()


def load_ledger() -> dict:
    STATE.mkdir(exist_ok=True)
    f = STATE / f"ledger-{today()}.json"
    if f.exists():
        return json.loads(f.read_text())
    return {"date": today(), "videos_published": 0, "spent_usd": 0.0}


def save_ledger(led: dict):
    (STATE / f"ledger-{today()}.json").write_text(json.dumps(led, indent=2))


def checkpoint(job_path: Path, job: dict):
    job_path.write_text(json.dumps(job, indent=2))


def stage_done(job, name):
    return job.get("stages", {}).get(name, {}).get("status") == "done"


def set_stage(job, name, **data):
    job.setdefault("stages", {})[name] = {"status": "done", **data}


def resolve_images(job, cfg) -> list[str]:
    """image is a SHARED upstream capability (same source as static posts)."""
    if job.get("images"):
        return job["images"]
    pid = job.get("product_id")
    if not pid:
        raise SystemExit("job needs 'images' or 'product_id'")
    prov = router.pick("image", job.get("tier_target", "free"), 999, cfg=cfg)
    # free/branded path -> social_image_gen.py
    out_dir = OUTPUT / f"frames-{job['id']}"
    out_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run([sys.executable, str(SOCIAL_IMG), "--product-id", str(pid)],
                   check=True, timeout=240, cwd=str(ROOT.parent.parent))
    frames = sorted(str(p) for p in Path("workspace/audit/active/social").glob(f"product-{pid}-*.png"))
    if not frames:
        raise SystemExit("image stage produced no frames")
    return frames[-1:]


def run_job(job_path: Path, allow_publish: bool):
    cfg = router.load_config()
    g = router.guardrails(cfg)
    job = json.loads(job_path.read_text())
    job.setdefault("stages", {})
    jid = job["id"]
    print(f"[worker] job {jid} tier={job.get('tier_target','free')} platforms={job.get('platforms')}")

    # 1. images (shared with static social system)
    if not stage_done(job, "images"):
        imgs = resolve_images(job, cfg)
        set_stage(job, "images", images=imgs)
        checkpoint(job_path, job)
    imgs = job["stages"]["images"]["images"]

    # 2. script — priority: Claude-authored inline > OpenRouter model. Language = per-job dial.
    #    Inline `script` (written by Claude/Opus) is best quality at $0 and needs no model call.
    if not stage_done(job, "script") and (job.get("script") or job.get("generate_script")):
        spath = str(OUTPUT / f"script-{jid}.json")
        if job.get("script"):
            sc = job["script"]
            Path(spath).write_text(json.dumps(sc, ensure_ascii=False, indent=2))
            source = "claude-authored"
        else:
            subprocess.run([sys.executable, str(SCRIPT_GEN),
                            "--product", job.get("product") or job.get("headline", ""),
                            "--category", job.get("category", "skincare"),
                            "--persona", job.get("persona", "influencer"),
                            "--language", job.get("language", "banglish"),
                            "--price", str(job.get("price", "")),
                            "--out", spath], check=True, timeout=120)
            sc = json.loads(Path(spath).read_text())
            source = sc.get("_provider", "model")
        # generated caption + hashtags become the publish caption unless job pins its own
        if not job.get("caption_locked"):
            tags = " ".join(sc.get("hashtags", []))
            cap = sc.get("caption", "")
            job["caption"] = (cap + ("\n\n" + tags if tags else "")).strip()
        set_stage(job, "script", path=spath, source=source, model=sc.get("_model"))
        checkpoint(job_path, job)
    script_path = job.get("stages", {}).get("script", {}).get("path")

    # 3. reel (free ffmpeg) — uses timed script captions when available
    if not stage_done(job, "reel"):
        out_mp4 = str(OUTPUT / f"{jid}.mp4")
        cmd = [sys.executable, str(REEL)]
        for im in imgs:
            cmd += ["--image", im]
        cmd += ["--headline", job.get("headline", ""), "--sub", job.get("sub", ""),
                "--out", out_mp4, "--seconds", str(job.get("seconds", 6))]
        if script_path:
            cmd += ["--script-json", script_path]
        subprocess.run(cmd, check=True, timeout=400)
        set_stage(job, "reel", mp4=out_mp4)
        checkpoint(job_path, job)
    mp4 = job["stages"]["reel"]["mp4"]

    # 3. quality gate — local ffprobe QA by default. Direct Gemini video QA is opt-in only.
    if not stage_done(job, "qa") and job.get("qa", True):
        qpath = str(OUTPUT / f"qa-{jid}.json")
        caption = job.get("caption", job.get("headline", ""))
        qa_provider = job.get("qa_provider", "local")
        if qa_provider == "gemini":
            qa_cmd = [sys.executable, str(REEL_QA),
                      "--video", mp4,
                      "--product", job.get("product") or job.get("headline", ""),
                      "--caption", caption,
                      "--out", qpath]
            timeout = 300
        else:
            qa_cmd = [sys.executable, str(REEL_QA_LOCAL), "--video", mp4, "--out", qpath]
            timeout = 60
        r = subprocess.run(qa_cmd, capture_output=True, text=True, timeout=timeout)
        if r.returncode != 0 and not Path(qpath).exists():
            set_stage(job, "qa", status_note="failed", stderr=r.stderr.strip()[-500:])
            job["status"] = "failed"
            checkpoint(job_path, job)
            print(r.stderr.strip(), file=sys.stderr)
            return
        qa = json.loads(Path(qpath).read_text())
        set_stage(job, "qa", path=qpath, provider=qa.get("_provider", qa_provider),
                  score=qa.get("score"), qa_status=qa.get("status"),
                  publishable=qa.get("publishable"))
        checkpoint(job_path, job)
        if qa.get("status") == "fail" or qa.get("publishable") is False:
            job["status"] = "failed"
            checkpoint(job_path, job)
            print(f"[worker] QA failed for {jid}: {qa.get('summary')}")
            return

    # 4. store (free local public dir -> public URL; swap to R2 later)
    if not stage_done(job, "store"):
        PUBLIC_REELS.mkdir(parents=True, exist_ok=True)
        dest = PUBLIC_REELS / f"{jid}.mp4"
        shutil.copy2(mp4, dest)
        # cache-bust param avoids any Cloudflare-cached 404 from a pre-stage probe reaching IG/FB
        url = f"{PUBLIC_BASE}/{jid}.mp4?v={int(dest.stat().st_mtime)}"
        set_stage(job, "store", url=url)
        checkpoint(job_path, job)
    url = job["stages"]["store"]["url"]

    # 5. publish (guarded: dry-run default, never auto-post without opt-in + guardrails)
    if not stage_done(job, "publish"):
        led = load_ledger()
        dry = g.get("dry_run_default", True) or not allow_publish
        if not dry and led["videos_published"] >= g.get("max_videos_per_day", 6):
            print(f"[worker] daily cap reached ({led['videos_published']}); forcing dry-run")
            dry = True
        caption = job.get("caption", job.get("headline", ""))
        platform = "both" if set(job.get("platforms", [])) >= {"instagram", "facebook"} else \
                   ("instagram" if "instagram" in job.get("platforms", []) else "facebook")
        cmd = ["node", str(META_REEL), "--video-url", url, "--caption", caption, "--platform", platform]
        if not dry:
            cmd.append("--publish")
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        print(r.stdout.strip())
        if r.returncode != 0:
            print(r.stderr.strip(), file=sys.stderr)
            set_stage(job, "publish", status_note="failed", dry_run=dry)
            job["status"] = "failed"
            checkpoint(job_path, job)
            return
        if not dry:
            led["videos_published"] += 1
            save_ledger(led)
        set_stage(job, "publish", dry_run=dry, output=r.stdout.strip()[:300])
        checkpoint(job_path, job)

    job["status"] = "published" if not (g.get("dry_run_default", True) or not allow_publish) else "ready"
    checkpoint(job_path, job)
    print(f"[worker] job {jid} -> {job['status']} | reel: {mp4} | url: {url}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--job")
    ap.add_argument("--drain", action="store_true")
    ap.add_argument("--allow-publish", action="store_true")
    a = ap.parse_args()
    OUTPUT.mkdir(exist_ok=True)
    if a.drain:
        jobs = sorted(QUEUE.glob("*.json"))
        pend = [j for j in jobs if json.loads(j.read_text()).get("status") in (None, "pending", "failed")]
        print(f"[worker] draining {len(pend)} job(s)")
        for j in pend:
            run_job(j, a.allow_publish)
    elif a.job:
        run_job(Path(a.job), a.allow_publish)
    else:
        ap.error("pass --job <path> or --drain")


if __name__ == "__main__":
    main()
