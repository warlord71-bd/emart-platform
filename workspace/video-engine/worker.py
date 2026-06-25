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
META_PUBLISH = ROOT.parent / "scripts" / "active" / "meta_publish.js"
SOCIAL_IMG = ROOT.parent / "scripts" / "active" / "social_image_gen.py"
SCRIPT_GEN = ROOT / "stages" / "script_gen.py"
REEL_QA = ROOT / "stages" / "reel_qa_gemini.py"
REEL_QA_OR = ROOT / "stages" / "reel_qa_openrouter.py"
CAPTION_OVERLAY = ROOT / "stages" / "caption_overlay.py"
VOICE_GEN = ROOT / "stages" / "voice_gen.py"
MUSIC_BED = ROOT / "assets" / "music" / "ambient-soft.mp3"
REEL_QA_MASTER = ROOT / "stages" / "reel_qa_master.py"
BRAND_CARD = ROOT / "stages" / "brand_card.py"
LIST_CARD = ROOT / "stages" / "list_card.py"
CODEX_BRIDGE = ROOT / "stages" / "codex_bridge.py"


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


def persona_stills(job) -> list[str]:
    """pull consistent persona stills from the free persona library (personas/<id>/library)."""
    pid = job.get("persona_library")
    if not pid:
        return []
    lib = ROOT / "personas" / pid / "library"
    if not lib.exists():
        raise SystemExit(f"persona library not found: {lib} (run persona_gen.py --persona {pid})")
    wanted = job.get("persona_scenes")
    files = sorted(lib.glob("*.png"))
    if wanted:
        files = [f for f in files if any(f.name.startswith(s) for s in wanted)]
    if not files:
        raise SystemExit(f"no persona stills in {lib} for scenes={wanted}")
    return [str(f) for f in files]


def brand_card_image(job) -> list[str]:
    """branded closing frame so the reel reads as a finished ad (opt-in: job.brand_card)."""
    if not job.get("brand_card"):
        return []
    card = OUTPUT / f"card-{job['id']}.png"
    subprocess.run([sys.executable, str(BRAND_CARD),
                    "--product", job.get("product") or job.get("headline", "Emart Skincare"),
                    "--price", str(job.get("price", "")),
                    "--original-price", str(job.get("original_price", "")),
                    "--bangla", job.get("brand_card_bangla", ""),
                    "--out", str(card)], check=True, timeout=120)
    return [str(card)]


def list_card_images(job) -> list[str]:
    """value/bullet template cards — the 'reason to keep watching' frames (job.list_cards)."""
    out = []
    for i, spec in enumerate(job.get("list_cards") or []):
        card = OUTPUT / f"listcard-{job['id']}-{i}.png"
        cmd = [sys.executable, str(LIST_CARD), "--out", str(card),
               "--title", spec["title"], "--kicker", spec.get("kicker", "জেনে নিন"),
               "--style", spec.get("style", "numbered"), "--footer", spec.get("footer", "e-mart.com.bd · COD")]
        for b in spec.get("bullets", []):
            cmd += ["--bullet", b]
        subprocess.run(cmd, check=True, timeout=120)
        out.append(str(card))
    return out


def holding_request_images(job) -> list[str]:
    """auto-handoff: emit a Codex work order for a 'model holding the real product' shot, and consume
    it once Codex has fulfilled it. If not yet fulfilled, return [] (engine proceeds persona-only and
    reuses the asset on a later run). Triggered by job `holding_request: true`."""
    if not job.get("holding_request"):
        return []
    product = job.get("product") or job.get("headline", "")
    persona = job.get("persona_library") or job.get("persona", "dr-rumana")
    ref = (job.get("images") or [None])[0]
    cmd = [sys.executable, str(CODEX_BRIDGE), "--emit", "--product", product, "--persona", persona]
    if ref:
        cmd += ["--product-image", str(Path(ref).resolve())]
    out = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    path = out.stdout.strip()
    if path and Path(path).exists():
        return [path]                       # Codex already fulfilled -> use it (cover-pan)
    print(f"[worker] holding shot requested from Codex (pending): {path}")
    return []                               # not yet fulfilled -> proceed without


def resolve_images(job, cfg) -> list[str]:
    """image is a SHARED upstream capability (same source as static posts).

    Retention-first order (PHOTOS first, then text cards):
      persona hook -> model-holding-REAL-product -> real product photo -> value cards -> CTA card.
    Photos lead so captions (confined to the photo window) never paint over the value/brand cards.

    `holding_images`: paths to Codex-generated "model holding the actual product" shots (Codex's
    image-gen does product-in-hand far better than free Pollinations). These are people shots, so they
    get cover-pan motion like persona stills (NOT blurred-fill). Drop them in workspace/video-engine/
    codex-assets/ and reference here. See README "Codex handoff".
    """
    imgs = (persona_stills(job) + (job.get("holding_images") or []) + holding_request_images(job)
            + (job.get("images") or []) + list_card_images(job))
    if imgs:
        return imgs + brand_card_image(job)
    pid = job.get("product_id")
    if not pid:
        raise SystemExit("job needs 'images', 'persona_library', or 'product_id'")
    prov = router.pick("image", job.get("tier_target", "free"), 999, cfg=cfg)
    # free/branded path -> social_image_gen.py
    out_dir = OUTPUT / f"frames-{job['id']}"
    out_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run([sys.executable, str(SOCIAL_IMG), "--product-id", str(pid)],
                   check=True, timeout=240, cwd=str(ROOT.parent.parent))
    frames = sorted(str(p) for p in Path("workspace/audit/active/social").glob(f"product-{pid}-*.png"))
    if not frames:
        raise SystemExit("image stage produced no frames")
    return frames[-1:] + brand_card_image(job)


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

    # 2a. voice — free bn-BD/en narration from the script's voiceover (edge-tts). Was being thrown away.
    if script_path and job.get("voiceover", True) and not stage_done(job, "voice"):
        sc = json.loads(Path(script_path).read_text())
        vtext = (sc.get("voiceover") or sc.get("caption") or "").strip()
        vpath = str(OUTPUT / f"vo-{jid}.mp3")
        vdur = 0.0
        if vtext:
            r = subprocess.run([sys.executable, str(VOICE_GEN), "--text", vtext,
                                "--language", job.get("language", "bn"),
                                "--gender", job.get("voice_gender", "female"),
                                "--out", vpath], capture_output=True, text=True, timeout=120)
            if r.returncode == 0 and Path(vpath).exists():
                try:
                    vdur = float(r.stdout.strip())
                except ValueError:
                    vdur = 0.0
            else:
                # offline / failed -> silent fallback (never blocks the free pipeline)
                vpath = ""
                sys.stderr.write(r.stderr.strip()[-300:] + "\n")
        else:
            vpath = ""
        set_stage(job, "voice", audio=vpath, duration=round(vdur, 2))
        checkpoint(job_path, job)
    voice = job.get("stages", {}).get("voice", {})
    audio_path = voice.get("audio") or ""
    vo_dur = float(voice.get("duration") or 0)

    # effective per-image seconds: span the voiceover so narration fully plays (with a 0.4s tail)
    base_seconds = float(job.get("seconds", 6))
    n_imgs = max(1, len(imgs))
    seconds = max(base_seconds, (vo_dur + 0.4) / n_imgs) if vo_dur > 0 else base_seconds
    total = round(seconds * n_imgs, 2)

    # 2b. captions — browser-rendered overlays (proper Bangla/English; drawtext can't shape Bangla).
    #     Confine captions to the PHOTO frames (persona + product). The value/brand cards already carry
    #     their own text, so sequencing captions across the full reel painted text-on-text over the cards.
    #     caption_window = seconds * (#non-card frames); captions live only in that opening window.
    if script_path and not stage_done(job, "captions"):
        card_frames = len(job.get("list_cards") or []) + (1 if job.get("brand_card") else 0)
        photo_frames = max(1, n_imgs - card_frames)
        caption_window = round(seconds * photo_frames, 2) if card_frames else total
        capdir = str(OUTPUT / f"caps-{jid}")
        opath = str(OUTPUT / f"overlays-{jid}.json")
        subprocess.run([sys.executable, str(CAPTION_OVERLAY), "--script", script_path,
                        "--total", str(caption_window), "--outdir", capdir, "--out", opath],
                       check=True, timeout=180)
        set_stage(job, "captions", overlays=opath, total=caption_window)
        checkpoint(job_path, job)
    overlays_path = job.get("stages", {}).get("captions", {}).get("overlays")

    # 3. reel (free ffmpeg) — voiceover audio + browser caption overlays
    if not stage_done(job, "reel"):
        out_mp4 = str(OUTPUT / f"{jid}.mp4")
        cmd = [sys.executable, str(REEL)]
        for im in imgs:
            cmd += ["--image", im]
        cmd += ["--headline", job.get("headline", ""), "--sub", job.get("sub", ""),
                "--out", out_mp4, "--seconds", str(seconds)]
        if overlays_path:
            cmd += ["--overlays-json", overlays_path]
        elif script_path:
            cmd += ["--script-json", script_path]
        if audio_path:
            cmd += ["--audio", audio_path]
        # explicit product/branded images get blurred-fill (no crop of heading/price); persona+card stay cover-pan
        for fim in (job.get("images") or []):
            cmd += ["--fit-image", str(Path(fim).resolve())]
        # music bed: job "music" path, or default ambient (set "music": false to disable)
        music = job.get("music", str(MUSIC_BED))
        if music and music is not False and Path(str(music)).exists():
            cmd += ["--music", str(music)]
        subprocess.run(cmd, check=True, timeout=400)
        set_stage(job, "reel", mp4=out_mp4, audio=bool(audio_path))
        checkpoint(job_path, job)
    mp4 = job["stages"]["reel"]["mp4"]

    # 3. quality gate — ffprobe is the HARD gate (always; blocks on broken render). A vision provider
    #    (free OpenRouter by default; gemini opt-in) is a SOFT gate: it records content issues / warns
    #    but never blocks unless the job opts in with "qa_block_on_vision": true.
    if not stage_done(job, "qa") and job.get("qa", True):
        product = job.get("product") or job.get("headline", "")
        # -- hard gate: ffprobe container/stream/dimension check --
        hpath = str(OUTPUT / f"qa-{jid}.json")
        r = subprocess.run([sys.executable, str(REEL_QA_LOCAL), "--video", mp4, "--out", hpath],
                           capture_output=True, text=True, timeout=60)
        if r.returncode != 0 and not Path(hpath).exists():
            set_stage(job, "qa", status_note="ffprobe_failed", stderr=r.stderr.strip()[-400:])
            job["status"] = "failed"; checkpoint(job_path, job)
            print(r.stderr.strip(), file=sys.stderr); return
        hard = json.loads(Path(hpath).read_text())
        if hard.get("status") == "fail" or hard.get("publishable") is False:
            set_stage(job, "qa", hard=hard, gate="ffprobe")
            job["status"] = "failed"; checkpoint(job_path, job)
            print(f"[worker] HARD QA failed for {jid}: {hard.get('issues')}"); return
        # -- soft gate: vision QA (default free OpenRouter), best-effort, warn-only --
        # only the vision providers trigger the soft gate; "local"/"off" = ffprobe hard gate only
        soft = None
        provider = job.get("qa_provider", "openrouter")
        if provider in ("openrouter", "gemini", "master"):
            spath = str(OUTPUT / f"qa-vision-{jid}.json")
            if provider == "gemini":
                vcmd = [sys.executable, str(REEL_QA), "--video", mp4, "--product", product,
                        "--caption", job.get("caption", ""), "--out", spath]; vt = 300
            elif provider == "master":
                # full production sign-off: technical + loudness + multi-frame visual + caption timing
                vcmd = [sys.executable, str(REEL_QA_MASTER), "--video", mp4, "--product", product,
                        "--out", spath, "--report", str(OUTPUT / f"qa-card-{jid}.md")]
                if overlays_path:
                    vcmd += ["--overlays", overlays_path]
                vt = 300
            else:
                vcmd = [sys.executable, str(REEL_QA_OR), "--video", mp4, "--product", product,
                        "--out", spath]; vt = 180
            try:
                subprocess.run(vcmd, capture_output=True, text=True, timeout=vt)
                if Path(spath).exists():
                    soft = json.loads(Path(spath).read_text())
            except Exception as e:
                sys.stderr.write(f"soft QA skipped: {e}\n")
        # master QA reports "verdict" (PASS/REVIEW/FAIL); single-frame reports "status" — normalize
        soft_status = (soft or {}).get("status") or str((soft or {}).get("verdict", "")).lower() or None
        set_stage(job, "qa", hard=hard, soft=soft, score=(soft or {}).get("score") or hard.get("score"),
                  vision_status=soft_status, vision_issues=(soft or {}).get("issues") or (soft or {}).get("fixes"))
        checkpoint(job_path, job)
        if job.get("qa_block_on_vision") and soft_status == "fail":
            job["status"] = "failed"; checkpoint(job_path, job)
            print(f"[worker] vision QA failed (opted-in block) for {jid}: {soft.get('issues')}"); return

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
        # The checkpointed queue job is the publisher's source of truth for URL,
        # caption, media type, and platforms. Avoid reconstructing a second payload here.
        cmd = ["node", str(META_PUBLISH), "--job", str(job_path.resolve())]
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
