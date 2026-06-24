#!/usr/bin/env python3
"""
Free persona library generator — builds a reusable set of consistent stills per AI persona.

Consistency trick (free, no reference-image API): a persona bible holds a VERBATIM identity
description + a FIXED seed. Every image uses the same identity words + same base seed, varying
only the scene words. Same seed + same identity → the same face; the scene change gives variety.
Generate candidates, keep the best — then the reel engine reuses those exact stills (perfect
consistency because it is literally the same image). $0 via Pollinations.

Usage:
  python3 persona_gen.py --persona dr-rumana [--variants 2] [--scenes portrait,explaining]
Outputs to personas/<id>/library/<scene>-<seed>.png
"""
from __future__ import annotations
import argparse, json, ssl, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PERSONAS = ROOT / "personas"
W = H = 1024


def ctx():
    c = ssl.create_default_context(); c.check_hostname = False; c.verify_mode = ssl.CERT_NONE
    return c


def gen(prompt: str, out: Path, seed: int):
    url = (f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}"
           f"?width={W}&height={H}&nologo=true&seed={seed}&model=flux")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx(), timeout=180) as r:
        out.write_bytes(r.read())


def build(persona_id: str, scenes: list[str] | None, variants: int):
    bible = json.loads((PERSONAS / persona_id / "bible.json").read_text())
    lib = PERSONAS / persona_id / "library"
    lib.mkdir(parents=True, exist_ok=True)
    base_seed = int(bible["seed"])
    identity = bible["identity"]
    neg = bible.get("negative", "no text, no watermark, no logo")
    want = scenes or list(bible["scenes"].keys())
    made = []
    for scene in want:
        scene_desc = bible["scenes"].get(scene)
        if not scene_desc:
            continue
        prompt = (f"{identity}, {scene_desc}, beauty campaign photography, commercial quality, "
                  f"photorealistic, {neg}")
        for v in range(max(1, variants)):
            seed = base_seed + v
            out = lib / f"{scene}-{seed}.png"
            try:
                gen(prompt, out, seed)
                made.append(str(out))
                print(f"  ok {out.name}")
            except Exception as e:
                print(f"  FAIL {scene} seed {seed}: {e}")
    return made


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--persona", required=True)
    ap.add_argument("--scenes", help="comma list; default all in bible")
    ap.add_argument("--variants", type=int, default=1)
    a = ap.parse_args()
    scenes = [s.strip() for s in a.scenes.split(",")] if a.scenes else None
    made = build(a.persona, scenes, a.variants)
    print(f"generated {len(made)} image(s) for {a.persona}")


if __name__ == "__main__":
    main()
