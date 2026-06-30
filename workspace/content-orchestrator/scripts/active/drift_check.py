#!/usr/bin/env python3
"""Read-only Local/VPS/origin drift report for Emart.

This intentionally treats /root/emart-platform as the source repo and
/var/www/emart-platform as the runtime deploy tree. Runtime git metadata is
advisory only; the deploy marker written by deploy.sh is the live revision
source after smoke tests pass.
"""

from __future__ import annotations

import argparse
import datetime as dt
import filecmp
import json
import re
import subprocess
from pathlib import Path


GENERATED_PREFIXES = (
    "apps/web/public/images/social/",
    "workspace/audit/archive/",
    "workspace/content-orchestrator/social-engine/history/",
    "workspace/content-orchestrator/social-engine/performance/",
    "workspace/content-orchestrator/social-engine/output/",
    "workspace/content-orchestrator/video-engine/jobs/",
    "workspace/content-orchestrator/video-engine/output/",
    "workspace/social-engine/history/",
)

DOC_PREFIXES = (
    "apps/web/.agent-memory/",
    "apps/web/SESSION-LOG.md",
    "workspace/TASKS.md",
    "workspace/audit/README.md",
    "workspace/audit/archive/README.md",
)

SOURCE_PREFIXES = (
    "apps/web/src/",
    "apps/web/next.config.js",
    "deploy.sh",
    "ecosystem.config.cjs",
    "workspace/content-orchestrator/scripts/active/",
    "workspace/content-orchestrator/video-engine/",
    "workspace/humanizer/engine/",
    "services/",
)

KEY_FILES = (
    "apps/web/next.config.js",
    "apps/web/src/lib/category-navigation.ts",
    "apps/web/src/lib/sitemapEntries.ts",
    "deploy.sh",
    "ecosystem.config.cjs",
    "workspace/humanizer/engine/humanizer_engine.py",
    "workspace/humanizer/engine/residue_lint.py",
    "workspace/humanizer/engine/run_detached.sh",
)


def run(args: list[str], cwd: Path | None = None, timeout: int = 15) -> tuple[int, str, str]:
    try:
        p = subprocess.run(
            args,
            cwd=str(cwd) if cwd else None,
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
        )
        return p.returncode, p.stdout.strip(), p.stderr.strip()
    except Exception as exc:  # pragma: no cover - defensive CLI guard
        return 99, "", str(exc)


def git(path: Path, *args: str) -> str:
    code, out, err = run(["git", "-C", str(path), *args])
    return out if code == 0 else f"ERROR: {err or out}"


def title(text: str) -> None:
    print(f"\n== {text} ==")


def parse_status(raw: str) -> list[str]:
    out: list[str] = []
    for line in raw.splitlines():
        if not line.strip() or line.startswith("## "):
            continue
        path = line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        out.append(path)
    return out


def bucket(path: str) -> str:
    if path.startswith(GENERATED_PREFIXES):
        return "generated/runtime"
    if path.startswith(DOC_PREFIXES):
        return "docs/memory"
    if path.startswith(SOURCE_PREFIXES):
        return "source"
    return "other"


def print_repo(label: str, path: Path) -> None:
    branch = git(path, "rev-parse", "--abbrev-ref", "HEAD")
    head = git(path, "rev-parse", "--short", "HEAD")
    status = git(path, "status", "--short", "--branch")
    first = status.splitlines()[0] if status else "status unavailable"
    print(f"{label}: {path}")
    print(f"  branch: {branch}")
    print(f"  head:   {head}")
    print(f"  status: {first}")


def print_deployed_rev(vps: Path) -> None:
    marker = vps / ".deployed-rev"
    if not marker.exists():
        print(f"deployed marker: missing ({marker})")
        return
    print(f"deployed marker: {marker}")
    for line in marker.read_text(errors="replace").splitlines():
        if line:
            print(f"  {line}")


def print_vps_dirty(vps: Path) -> int:
    raw = git(vps, "status", "--short")
    paths = parse_status(raw)
    counts: dict[str, int] = {}
    for path in paths:
        counts[bucket(path)] = counts.get(bucket(path), 0) + 1
    print(f"runtime dirty paths: {len(paths)}")
    for name in ("source", "docs/memory", "generated/runtime", "other"):
        print(f"  {name}: {counts.get(name, 0)}")
    source_like = [p for p in paths if bucket(p) == "source"]
    if source_like:
        print("  source-like examples:")
        for path in source_like[:20]:
            print(f"    {path}")
    if source_like:
        print("  note: runtime git dirt is informational; key source-file compare decides dangerous source drift")
    return 0


def print_key_file_cmp(local: Path, vps: Path) -> int:
    mismatches = 0
    for rel in KEY_FILES:
        a = local / rel
        b = vps / rel
        if not a.exists() or not b.exists():
            print(f"  missing: {rel} local={a.exists()} runtime={b.exists()}")
            mismatches += 1
        elif not filecmp.cmp(a, b, shallow=False):
            print(f"  diff: {rel}")
            mismatches += 1
    if mismatches == 0:
        print("  key source files match between local and runtime")
    return mismatches


def print_pm2(today: dt.date) -> int:
    code, out, err = run(["pm2", "jlist"], timeout=20)
    if code != 0:
        print(f"pm2: unavailable ({err or out})")
        return 0
    try:
        rows = json.loads(out)
    except json.JSONDecodeError as exc:
        print(f"pm2: invalid JSON ({exc})")
        return 0

    critical = 0
    for proc in rows:
        name = proc.get("name", "")
        if "emart" not in name:
            continue
        env = proc.get("pm2_env", {})
        status = env.get("status", "?")
        cwd = env.get("pm_cwd") or env.get("cwd") or ""
        exec_path = env.get("pm_exec_path") or ""
        args = " ".join(env.get("args") or [])
        combined = " ".join([cwd, exec_path, args])
        tags = []
        if "/workspace/scripts/" in combined or "/workspace/video-engine" in combined:
            tags.append("legacy-path")
        if "/root/emart-platform" in combined:
            tags.append("root-source")
        if "/var/www/emart-platform" in combined:
            tags.append("runtime-source")
        for match in re.findall(r"20\d{6}", name + " " + args):
            try:
                date = dt.datetime.strptime(match, "%Y%m%d").date()
            except ValueError:
                continue
            if status == "online" and date < today:
                tags.append("expired-online")
                critical += 1
                break
        print(f"{name}: {status} | {cwd} | {exec_path} | {','.join(tags) or 'ok'}")
    return critical


def print_cron() -> int:
    code, out, err = run(["crontab", "-l"])
    if code != 0:
        print(f"crontab: unavailable ({err or out})")
        return 0
    legacy = []
    for line in out.splitlines():
        if "/workspace/scripts/" in line or "/workspace/video-engine" in line:
            legacy.append(line)
    if not legacy:
        print("cron legacy path refs: none")
        return 0
    print("cron legacy path refs:")
    for line in legacy:
        print(f"  {line}")
    return len(legacy)


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only Emart drift report")
    parser.add_argument("--local", default="/root/emart-platform")
    parser.add_argument("--runtime", default="/var/www/emart-platform")
    parser.add_argument("--fail-on-critical", action="store_true")
    args = parser.parse_args()

    local = Path(args.local)
    runtime = Path(args.runtime)
    today = dt.datetime.now().date()
    critical = 0

    title("Repos")
    print_repo("local source", local)
    print_repo("runtime tree", runtime)
    origin = git(local, "rev-parse", "--short", "origin/main")
    ahead = git(local, "rev-list", "--count", "origin/main..HEAD")
    behind = git(local, "rev-list", "--count", "HEAD..origin/main")
    print(f"origin/main: {origin}")
    print(f"local vs origin: ahead={ahead} behind={behind}")

    title("Deployed Revision")
    print_deployed_rev(runtime)

    title("Runtime Dirty Classification")
    critical += print_vps_dirty(runtime)

    title("Key Source File Compare")
    critical += print_key_file_cmp(local, runtime)

    title("PM2 Emart Processes")
    critical += print_pm2(today)

    title("Cron Legacy Path Check")
    critical += print_cron()

    title("Summary")
    if critical:
        print(f"critical drift signals: {critical}")
        print("review before deploy/restart; do not reset runtime blindly")
    else:
        print("critical drift signals: 0")
    return 2 if critical and args.fail_on_critical else 0


if __name__ == "__main__":
    raise SystemExit(main())
