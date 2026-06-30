#!/usr/bin/env python3
"""
Publish Emart social images to Facebook and Instagram via Meta Graph API.

Dry-run is the default. Add --publish to actually post.

Required env values, usually in apps/web/.env.local or a private VPS env file:
  META_PAGE_ID
  META_PAGE_ACCESS_TOKEN
  META_IG_USER_ID              # required only for Instagram
  META_GRAPH_VERSION=v23.0     # optional

Examples:
  python3 workspace/content-orchestrator/scripts/active/social_publish.py \
    --platform facebook \
    --image workspace/content-orchestrator/generated-assets/emart-aestura-promo.png \
    --caption "Repair. Hydrate. Glow. Available at Emart."

  python3 workspace/content-orchestrator/scripts/active/social_publish.py \
    --platform both \
    --image-url https://e-mart.com.bd/path/to/image.png \
    --caption "Repair. Hydrate. Glow. Available at Emart." \
    --publish
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import ssl
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from uuid import uuid4


DEFAULT_ENV_FILES = (
    Path(__file__).resolve().parents[4] / "apps" / "web" / ".env.local",
    Path("apps/web/.env.local"),
    Path("/var/www/emart-platform/apps/web/.env.local"),
)


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_env(extra_env: str | None) -> None:
    for env_file in DEFAULT_ENV_FILES:
        load_env_file(env_file)
    if extra_env:
        load_env_file(Path(extra_env))


def graph_base() -> str:
    version = os.environ.get("META_GRAPH_VERSION", "v23.0").strip().lstrip("/")
    return f"https://graph.facebook.com/{version}"


def ssl_ctx() -> ssl.SSLContext:
    return ssl.create_default_context()


def post_form(endpoint: str, fields: dict[str, str]) -> dict:
    body = urllib.parse.urlencode(fields).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, context=ssl_ctx(), timeout=90) as resp:
        return json.loads(resp.read().decode("utf-8"))


def post_multipart(endpoint: str, fields: dict[str, str], file_field: str, file_path: Path) -> dict:
    boundary = f"----emart-{uuid4().hex}"
    chunks: list[bytes] = []

    for key, value in fields.items():
        chunks.append(f"--{boundary}\r\n".encode())
        chunks.append(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode())
        chunks.append(str(value).encode("utf-8"))
        chunks.append(b"\r\n")

    mime_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    chunks.append(f"--{boundary}\r\n".encode())
    chunks.append(
        (
            f'Content-Disposition: form-data; name="{file_field}"; '
            f'filename="{file_path.name}"\r\n'
            f"Content-Type: {mime_type}\r\n\r\n"
        ).encode()
    )
    chunks.append(file_path.read_bytes())
    chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())

    req = urllib.request.Request(
        endpoint,
        data=b"".join(chunks),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(req, context=ssl_ctx(), timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def require_env(keys: list[str]) -> list[str]:
    return [key for key in keys if not os.environ.get(key)]


def publish_facebook(args: argparse.Namespace) -> dict:
    page_id = os.environ["META_PAGE_ID"]
    token = os.environ["META_PAGE_ACCESS_TOKEN"]
    endpoint = f"{graph_base()}/{page_id}/photos"
    fields = {
        "caption": args.caption,
        "published": "true",
        "access_token": token,
    }
    if args.image_url:
        fields["url"] = args.image_url
        return post_form(endpoint, fields)

    image_path = Path(args.image)
    return post_multipart(endpoint, fields, "source", image_path)


def publish_instagram(args: argparse.Namespace) -> dict:
    ig_user_id = os.environ["META_IG_USER_ID"]
    token = os.environ["META_PAGE_ACCESS_TOKEN"]
    create_endpoint = f"{graph_base()}/{ig_user_id}/media"
    publish_endpoint = f"{graph_base()}/{ig_user_id}/media_publish"

    create_result = post_form(
        create_endpoint,
        {
            "image_url": args.image_url,
            "caption": args.caption,
            "access_token": token,
        },
    )
    creation_id = create_result.get("id")
    if not creation_id:
        raise RuntimeError(f"Instagram media container did not return id: {create_result}")

    publish_result = post_form(
        publish_endpoint,
        {
            "creation_id": creation_id,
            "access_token": token,
        },
    )
    return {"container": create_result, "publish": publish_result}


def dry_run(args: argparse.Namespace) -> int:
    platforms = selected_platforms(args.platform)
    required = ["META_PAGE_ID", "META_PAGE_ACCESS_TOKEN"]
    if "instagram" in platforms:
        required.append("META_IG_USER_ID")
    missing = require_env(required)

    print("DRY RUN - no post will be published")
    print(f"Platforms: {', '.join(platforms)}")
    print(f"Graph base: {graph_base()}")
    print(f"Caption: {args.caption}")
    print(f"Image path: {args.image or '-'}")
    print(f"Image URL: {args.image_url or '-'}")
    if missing:
        print(f"Missing env: {', '.join(missing)}")
    else:
        print("Required env: present")
    if "instagram" in platforms and not args.image_url:
        print("Instagram needs --image-url because Meta requires a public image URL.")
    print("Add --publish to actually post.")
    return 0


def selected_platforms(platform: str) -> list[str]:
    if platform == "both":
        return ["facebook", "instagram"]
    return [platform]


def validate_args(args: argparse.Namespace) -> None:
    if not args.image and not args.image_url:
        raise SystemExit("Provide --image for Facebook upload or --image-url for Facebook/Instagram.")
    if args.image and not Path(args.image).exists():
        raise SystemExit(f"Image not found: {args.image}")
    if args.platform in ("instagram", "both") and not args.image_url:
        raise SystemExit("Instagram publishing requires --image-url, a public HTTPS image URL.")
    if args.image_url and not args.image_url.startswith("https://"):
        raise SystemExit("--image-url must be a public HTTPS URL.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish Emart images to Facebook/Instagram.")
    parser.add_argument("--platform", choices=("facebook", "instagram", "both"), required=True)
    parser.add_argument("--image", help="Local image path. Facebook only.")
    parser.add_argument("--image-url", help="Public HTTPS image URL. Required for Instagram.")
    parser.add_argument("--caption", required=True)
    parser.add_argument("--env-file", help="Optional private env file with Meta publishing credentials.")
    parser.add_argument("--publish", action="store_true", help="Actually publish. Default is dry-run.")
    args = parser.parse_args()

    load_env(args.env_file)
    validate_args(args)

    if not args.publish:
        return dry_run(args)

    platforms = selected_platforms(args.platform)
    missing = require_env(["META_PAGE_ID", "META_PAGE_ACCESS_TOKEN"])
    if "instagram" in platforms:
        missing.extend(require_env(["META_IG_USER_ID"]))
    if missing:
        raise SystemExit(f"Missing env: {', '.join(sorted(set(missing)))}")

    results = {}
    if "facebook" in platforms:
        results["facebook"] = publish_facebook(args)
    if "instagram" in platforms:
        results["instagram"] = publish_instagram(args)

    print(json.dumps(results, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"Meta API error {exc.code}: {body}", file=sys.stderr)
        raise SystemExit(1)
