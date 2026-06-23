#!/usr/bin/env python3
"""Create non-destructive enhanced candidates for GMC undersized images."""

from __future__ import annotations

import argparse
import csv
import hashlib
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def enhance(source: Path, target: Path, min_edge: int = 1200) -> tuple[int, int]:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        width, height = image.size
        scale = max(1.0, min_edge / min(width, height))
        out_size = (round(width * scale), round(height * scale))
        image = image.resize(out_size, Image.Resampling.LANCZOS)
        # Conservative enhancement: retain packaging, colors, and printed text.
        image = ImageEnhance.Contrast(image).enhance(1.025)
        image = ImageEnhance.Color(image).enhance(1.015)
        image = image.filter(ImageFilter.UnsharpMask(radius=1.2, percent=115, threshold=3))
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "JPEG", quality=94, optimize=True, progressive=True, subsampling=0)
        return out_size


def contact_sheet(items: list[dict[str, str]], output: Path) -> None:
    tile = 420
    label_height = 56
    sheet = Image.new("RGB", (tile * 2, (tile + label_height) * len(items)), "white")
    from PIL import ImageDraw

    draw = ImageDraw.Draw(sheet)
    for index, item in enumerate(items):
        y = index * (tile + label_height)
        for column, key in enumerate(("source_path", "candidate_path")):
            with Image.open(item[key]) as opened:
                image = ImageOps.exif_transpose(opened).convert("RGB")
                image.thumbnail((tile - 16, tile - 16), Image.Resampling.LANCZOS)
                x = column * tile + (tile - image.width) // 2
                sheet.paste(image, (x, y + (tile - image.height) // 2))
        draw.text((8, y + tile + 4), f"BEFORE {item['woo_id']} {item['source_width']}x{item['source_height']}", fill="black")
        draw.text((tile + 8, y + tile + 4), f"AFTER {item['output_width']}x{item['output_height']}", fill="black")
        title = item["title"][:62]
        draw.text((8, y + tile + 25), title, fill="black")
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, "JPEG", quality=90, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("audit_csv", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sample-balanced", action="store_true")
    parser.add_argument("--min-edge", type=int, default=1200)
    args = parser.parse_args()

    with args.audit_csv.open(newline="", encoding="utf-8") as handle:
        rows = [row for row in csv.DictReader(handle) if row["classification"].startswith("upscale_")]

    if args.sample_balanced:
        good = [row for row in rows if row["classification"] == "upscale_good_source"][:6]
        weak = [row for row in rows if row["classification"] == "upscale_weak_source"][:6]
        rows = good + weak
    if args.limit:
        rows = rows[: args.limit]

    manifest: list[dict[str, str]] = []
    errors: list[dict[str, str]] = []
    for row in rows:
        source = Path(row["source_path"])
        if not source.is_file():
            errors.append({"woo_id": row["woo_id"], "source_path": str(source), "error": "missing_source"})
            continue
        target = args.output_dir / "candidates" / f"{row['woo_id']}-gmc-enhanced.jpg"
        try:
            output_width, output_height = enhance(source, target, args.min_edge)
        except Exception as exc:  # keep the batch resumable and reviewable
            errors.append({"woo_id": row["woo_id"], "source_path": str(source), "error": str(exc)})
            continue
        manifest.append({
            "woo_id": row["woo_id"],
            "title": row["title"],
            "attachment_id": row["attachment_id"],
            "source_path": str(source),
            "source_width": row["width"],
            "source_height": row["height"],
            "source_sha256": sha256(source),
            "candidate_path": str(target),
            "output_width": str(output_width),
            "output_height": str(output_height),
            "candidate_bytes": str(target.stat().st_size),
            "candidate_sha256": sha256(target),
            "classification": row["classification"],
            "review_action": "PENDING",
        })

    fields = list(manifest[0]) if manifest else []
    manifest_path = args.output_dir / "manifest.csv"
    args.output_dir.mkdir(parents=True, exist_ok=True)
    with manifest_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        if fields:
            writer.writeheader()
            writer.writerows(manifest)
    error_path = args.output_dir / "errors.csv"
    with error_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["woo_id", "source_path", "error"])
        writer.writeheader()
        writer.writerows(errors)
    if manifest and len(manifest) <= 24:
        contact_sheet(manifest, args.output_dir / "contact-sheet-before-after.jpg")
    print(f"prepared={len(manifest)}")
    print(f"errors={len(errors)}")
    print(f"manifest={manifest_path}")


if __name__ == "__main__":
    main()
