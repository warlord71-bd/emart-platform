#!/usr/bin/env python3
"""Rotating weekly SEO technical checks.

Runs a different check each day of the week to avoid hitting API rate limits
and spreading the monitoring load. Designed for crontab: `30 3 * * * python3 seo_rotating_check.py`

Schedule:
  Mon: CWV baselines (cwv_monitor.py)
  Tue: URL policy registry verification (seo_url_policy_registry.py)
  Wed: Qdrant parity check (qdrant_parity_report.py)
  Thu: SEO technical control loop classification (seo_technical_control_loop.py)
  Fri: Sitemap/robots verification
  Sat: Internal link spot check
  Sun: (rest — no check)
"""

import subprocess, sys, json, os
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
SCRIPTS = ROOT / "workspace" / "scripts" / "active"
SITE = "https://e-mart.com.bd"
LOG_DIR = ROOT / "workspace" / "audit" / "rotating-checks"

def log(msg: str):
    print(f"[{datetime.now():%H:%M:%S}] {msg}")

def save_result(check_name: str, result: dict):
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d")
    out = LOG_DIR / f"{check_name}-{today}.json"
    with open(out, "w") as f:
        json.dump(result, f, indent=2)
    log(f"Saved: {out}")

def run_cwv():
    log("Running CWV baselines...")
    r = subprocess.run(
        [sys.executable, str(SCRIPTS / "cwv_monitor.py")],
        capture_output=True, text=True, timeout=900,
    )
    return {"stdout": r.stdout[-2000:], "returncode": r.returncode}

def run_url_policy():
    log("Running URL policy registry verification...")
    script = SCRIPTS / "seo_url_policy_registry.py"
    if not script.exists():
        return {"error": "seo_url_policy_registry.py not found"}
    r = subprocess.run(
        [sys.executable, str(script)],
        capture_output=True, text=True, timeout=120,
    )
    return {"stdout": r.stdout[-2000:], "returncode": r.returncode}

def run_qdrant_parity():
    log("Running Qdrant parity check...")
    script = SCRIPTS / "qdrant_parity_report.py"
    if not script.exists():
        return {"error": "qdrant_parity_report.py not found"}
    r = subprocess.run(
        [sys.executable, str(script)],
        capture_output=True, text=True, timeout=300,
    )
    return {"stdout": r.stdout[-2000:], "returncode": r.returncode}

def run_control_loop():
    log("Running SEO technical control loop...")
    script = SCRIPTS / "seo_technical_control_loop.py"
    if not script.exists():
        return {"error": "seo_technical_control_loop.py not found"}
    r = subprocess.run(
        [sys.executable, str(script)],
        capture_output=True, text=True, timeout=300,
    )
    return {"stdout": r.stdout[-2000:], "returncode": r.returncode}

def run_sitemap_robots():
    log("Verifying sitemap and robots...")
    import urllib.request
    checks = {}
    for path in ["/sitemap.xml", "/robots.txt"]:
        try:
            req = urllib.request.Request(f"{SITE}{path}", headers={"User-Agent": "EmartSEOCheck/1.0"})
            resp = urllib.request.urlopen(req, timeout=15)
            status = resp.status
            body = resp.read().decode("utf-8", errors="replace")[:500]
            checks[path] = {"status": status, "preview": body}
        except Exception as e:
            checks[path] = {"error": str(e)}

    try:
        req = urllib.request.Request(f"{SITE}/sitemap.xml", headers={"User-Agent": "EmartSEOCheck/1.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        body = resp.read().decode("utf-8", errors="replace")
        url_count = body.count("<loc>")
        checks["sitemap_url_count"] = url_count
    except:
        pass

    return checks

def run_internal_link_spot():
    log("Spot-checking internal links on 3 random pages...")
    import urllib.request, random
    sample_pages = ["/", "/shop", "/brands", "/category/sunscreen", "/best"]
    picked = random.sample(sample_pages, min(3, len(sample_pages)))
    results = {}
    for page in picked:
        try:
            req = urllib.request.Request(f"{SITE}{page}", headers={"User-Agent": "EmartSEOCheck/1.0"})
            resp = urllib.request.urlopen(req, timeout=15)
            html = resp.read().decode("utf-8", errors="replace")
            import re
            internal = re.findall(r'href="(/[^"]*)"', html)
            unique = set(internal)
            results[page] = {
                "total_internal_links": len(internal),
                "unique_internal_links": len(unique),
                "sample": sorted(list(unique))[:20],
            }
        except Exception as e:
            results[page] = {"error": str(e)}
    return results


SCHEDULE = {
    0: ("cwv", run_cwv),
    1: ("url-policy", run_url_policy),
    2: ("qdrant-parity", run_qdrant_parity),
    3: ("control-loop", run_control_loop),
    4: ("sitemap-robots", run_sitemap_robots),
    5: ("internal-links", run_internal_link_spot),
    6: (None, None),
}


if __name__ == "__main__":
    day = datetime.now().weekday()
    check_name, check_fn = SCHEDULE.get(day, (None, None))

    if "--all" in sys.argv:
        for name, fn in SCHEDULE.values():
            if fn:
                result = fn()
                save_result(name, result)
        sys.exit(0)

    if "--check" in sys.argv:
        idx = sys.argv.index("--check")
        check_name = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else None
        for name, fn in SCHEDULE.values():
            if name == check_name and fn:
                result = fn()
                save_result(name, result)
                sys.exit(0)
        print(f"Unknown check: {check_name}")
        sys.exit(1)

    if check_fn is None:
        log(f"Day {day} (Sunday) — rest day, no check.")
        sys.exit(0)

    log(f"Day {day} — running {check_name}")
    result = check_fn()
    save_result(check_name, result)
    log("Done.")
