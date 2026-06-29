#!/usr/bin/env python3
"""Core Web Vitals monitor — runs Lighthouse on key pages and saves baselines.

Usage:
    python3 cwv_monitor.py              # Run all pages, save results
    python3 cwv_monitor.py --page /shop # Run single page
    python3 cwv_monitor.py --compare    # Compare latest vs previous run
    python3 cwv_monitor.py --summary    # Print latest scores only

Requires: npx lighthouse (Node.js)
Output: workspace/audit/cwv-history/cwv-YYYY-MM-DD.json
"""

import subprocess, json, sys, os, glob
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CWV_DIR = ROOT / "workspace" / "audit" / "cwv-history"
SITE = "https://e-mart.com.bd"

PAGES = [
    "/",
    "/shop",
    "/category/korean-beauty",
    "/category/sunscreen",
    "/brands",
    "/best",
    "/concerns/acne-blemish-care",
]

METRICS = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "speed-index",
    "interactive",
]

def run_lighthouse(url: str) -> dict | None:
    try:
        result = subprocess.run(
            [
                "npx", "lighthouse", url,
                "--output=json",
                "--only-categories=performance,seo,accessibility",
                "--chrome-flags=--headless --no-sandbox --disable-gpu",
                "--quiet",
            ],
            capture_output=True, text=True, timeout=120,
        )
        if result.returncode != 0:
            return None
        data = json.loads(result.stdout)
        lr = data.get("lighthouseResult", data)
        cats = lr.get("categories", {})
        audits = lr.get("audits", {})

        scores = {}
        for cat_name in ["performance", "seo", "accessibility"]:
            c = cats.get(cat_name, {})
            if c:
                scores[cat_name] = int(c.get("score", 0) * 100)

        for m in METRICS:
            a = audits.get(m, {})
            if a:
                scores[m] = {
                    "value": a.get("numericValue"),
                    "display": a.get("displayValue", ""),
                    "score": int(a.get("score", 0) * 100) if a.get("score") is not None else None,
                }

        return scores
    except Exception as e:
        print(f"  Error: {e}")
        return None


def run_all(pages: list[str]) -> dict:
    results = {}
    for page in pages:
        url = f"{SITE}{page}"
        print(f"Testing {url}...")
        scores = run_lighthouse(url)
        if scores:
            results[page] = scores
            perf = scores.get("performance", "?")
            lcp = scores.get("largest-contentful-paint", {}).get("display", "?")
            tbt = scores.get("total-blocking-time", {}).get("display", "?")
            print(f"  Perf: {perf} | LCP: {lcp} | TBT: {tbt}")
        else:
            print(f"  FAILED")
    return results


def save_results(results: dict):
    CWV_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d")
    out_path = CWV_DIR / f"cwv-{today}.json"
    data = {
        "date": today,
        "site": SITE,
        "lighthouse_version": "13.4.0",
        "strategy": "mobile",
        "pages": results,
    }
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\nSaved: {out_path}")
    return out_path


def compare():
    files = sorted(glob.glob(str(CWV_DIR / "cwv-*.json")))
    if len(files) < 2:
        print("Need at least 2 runs to compare.")
        return
    with open(files[-1]) as f:
        latest = json.load(f)
    with open(files[-2]) as f:
        prev = json.load(f)

    print(f"Comparing {Path(files[-2]).name} → {Path(files[-1]).name}\n")
    print(f"{'Page':<35} {'Perf':>6} {'LCP':>8} {'TBT':>8}")
    print("-" * 60)
    for page in latest.get("pages", {}):
        l = latest["pages"][page]
        p = prev.get("pages", {}).get(page, {})
        lp = l.get("performance", "?")
        pp = p.get("performance", "?")
        delta = ""
        if isinstance(lp, int) and isinstance(pp, int):
            d = lp - pp
            delta = f" ({'+' if d > 0 else ''}{d})"

        llcp = l.get("largest-contentful-paint", {}).get("display", "?")
        ltbt = l.get("total-blocking-time", {}).get("display", "?")
        print(f"{page:<35} {lp:>4}{delta:>6} {llcp:>8} {ltbt:>8}")


def summary():
    files = sorted(glob.glob(str(CWV_DIR / "cwv-*.json")))
    if not files:
        print("No CWV data yet. Run: python3 cwv_monitor.py")
        return
    with open(files[-1]) as f:
        data = json.load(f)
    print(f"CWV Scores — {data['date']} (mobile)\n")
    print(f"{'Page':<35} {'Perf':>5} {'SEO':>5} {'FCP':>8} {'LCP':>8} {'TBT':>8} {'CLS':>6}")
    print("-" * 80)
    for page, scores in data.get("pages", {}).items():
        perf = scores.get("performance", "?")
        seo = scores.get("seo", "?")
        fcp = scores.get("first-contentful-paint", {}).get("display", "?")
        lcp = scores.get("largest-contentful-paint", {}).get("display", "?")
        tbt = scores.get("total-blocking-time", {}).get("display", "?")
        cls_ = scores.get("cumulative-layout-shift", {}).get("display", "?")
        print(f"{page:<35} {perf:>5} {seo:>5} {fcp:>8} {lcp:>8} {tbt:>8} {cls_:>6}")


if __name__ == "__main__":
    args = sys.argv[1:]

    if "--compare" in args:
        compare()
    elif "--summary" in args:
        summary()
    elif "--page" in args:
        idx = args.index("--page")
        page = args[idx + 1] if idx + 1 < len(args) else "/"
        results = run_all([page])
        if results:
            save_results(results)
    else:
        results = run_all(PAGES)
        if results:
            save_results(results)
