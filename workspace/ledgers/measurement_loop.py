#!/usr/bin/env python3
"""
Emart measurement loop: join GSC + GA4 baselines onto ledger entries,
evaluate post-change windows, and produce review reports.

Usage:
  python3 measurement_loop.py capture-baselines   # Attach 28d baselines to proposed/triaged entries
  python3 measurement_loop.py review              # Evaluate entries past their review window
  python3 measurement_loop.py report              # Print measurement status of all entries
"""
import argparse, json, sys, os, datetime as dt
from pathlib import Path

LEDGER = Path(__file__).parent / "action-events.jsonl"
REVIEW_MD = Path(__file__).parent / "outcome-review.md"

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "seo-review"))

def _now():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")

def _read_ledger():
    if not LEDGER.exists():
        return []
    return [json.loads(l) for l in LEDGER.read_text().splitlines() if l.strip()]

def _write_ledger(entries):
    LEDGER.write_text("\n".join(json.dumps(e, ensure_ascii=False) for e in entries) + "\n")

def _get_gsc_service():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    import httplib2
    from google_auth_httplib2 import AuthorizedHttp
    KEY_FILE = "/root/.gmc/service-account.json"
    SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
    creds = service_account.Credentials.from_service_account_file(KEY_FILE, scopes=SCOPES)
    return build("searchconsole", "v1", http=AuthorizedHttp(creds, httplib2.Http(timeout=60)), cache_discovery=False)

def _get_ga4_data():
    ga4_file = Path(__file__).resolve().parent.parent / "social-engine/performance/ga4-product-latest.jsonl"
    if not ga4_file.exists():
        return {}
    data = {}
    for line in ga4_file.read_text().splitlines():
        if line.strip():
            r = json.loads(line)
            data[r.get("path", "")] = r
    return data

def _fetch_gsc_page(svc, url, days=28):
    end = dt.date.today() - dt.timedelta(days=3)
    start = end - dt.timedelta(days=days)
    req = {
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "dimensions": ["page"],
        "dimensionFilterGroups": [{
            "filters": [{"dimension": "page", "operator": "equals", "expression": url}]
        }],
        "rowLimit": 1,
        "dataState": "all"
    }
    try:
        resp = svc.searchanalytics().query(siteUrl="sc-domain:e-mart.com.bd", body=req).execute()
        rows = resp.get("rows", [])
        if rows:
            r = rows[0]
            return {"clicks": r["clicks"], "impressions": r["impressions"], "ctr": round(r["ctr"], 4), "position": round(r["position"], 1)}
    except Exception as e:
        print(f"  GSC error for {url}: {e}", file=sys.stderr)
    return None

def cmd_capture_baselines(args):
    entries = _read_ledger()
    svc = _get_gsc_service()
    ga4 = _get_ga4_data()
    updated = 0

    for e in entries:
        if e["status"] not in ("proposed", "triaged"):
            continue
        m = e.get("measurement", {})
        baseline = m.get("baseline", {})
        if baseline.get("value"):
            continue

        url = e.get("entity", {}).get("canonical_url", "")
        path = url.replace("https://e-mart.com.bd", "") if url else ""
        if not url:
            continue

        gsc = _fetch_gsc_page(svc, url, days=28)
        ga4_row = ga4.get(path, {})

        baseline_data = {}
        if gsc:
            baseline_data["gsc"] = gsc
        if ga4_row:
            baseline_data["ga4"] = {
                "sessions": ga4_row.get("sessions"),
                "views": ga4_row.get("views"),
                "conversions": ga4_row.get("conversions")
            }

        if baseline_data:
            m["baseline"] = {
                "window": "28d",
                "value": baseline_data,
                "captured_at": _now(),
                "source": "gsc+ga4"
            }
            e["measurement"] = m
            e["updated_at"] = _now()
            updated += 1
            print(f"  Baseline captured: {e['id']} — GSC: {gsc}, GA4 sess: {ga4_row.get('sessions','?')}")

    _write_ledger(entries)
    print(f"\nBaselines captured: {updated}/{len([e for e in entries if e['status'] in ('proposed','triaged')])}")

def cmd_review(args):
    entries = _read_ledger()
    svc = _get_gsc_service()
    ga4 = _get_ga4_data()
    reviewable = []

    for e in entries:
        if e["status"] not in ("applied", "verified"):
            continue
        m = e.get("measurement", {})
        post = m.get("post_change", {})
        if post.get("value"):
            continue

        exec_info = e.get("execution", {})
        applied_at = exec_info.get("applied_at")
        if not applied_at:
            continue

        applied_date = dt.datetime.fromisoformat(applied_at).date()
        review_window = int(m.get("post_change", {}).get("window", "7d").replace("d",""))
        if (dt.date.today() - applied_date).days < review_window:
            print(f"  {e['id']}: applied {applied_at}, review window not reached yet ({review_window}d)")
            continue

        url = e.get("entity", {}).get("canonical_url", "")
        if not url:
            continue

        gsc = _fetch_gsc_page(svc, url, days=review_window)
        path = url.replace("https://e-mart.com.bd", "")
        ga4_row = ga4.get(path, {})

        post_data = {}
        if gsc:
            post_data["gsc"] = gsc
        if ga4_row:
            post_data["ga4"] = {"sessions": ga4_row.get("sessions"), "conversions": ga4_row.get("conversions")}

        if post_data:
            m["post_change"] = {
                "window": f"{review_window}d",
                "value": post_data,
                "captured_at": _now(),
                "source": "gsc+ga4"
            }
            baseline = m.get("baseline", {}).get("value", {})
            baseline_gsc = baseline.get("gsc", {})
            post_gsc = post_data.get("gsc", {})
            if baseline_gsc and post_gsc:
                ctr_delta = (post_gsc.get("ctr",0) - baseline_gsc.get("ctr",0))
                click_delta = (post_gsc.get("clicks",0) - baseline_gsc.get("clicks",0))
                if ctr_delta > 0.005:
                    m["decision"] = "keep"
                elif ctr_delta < -0.005:
                    m["decision"] = "needs_more_data"
                else:
                    m["decision"] = "inconclusive"
                print(f"  {e['id']}: CTR delta {ctr_delta:+.2%}, clicks delta {click_delta:+.0f} -> {m['decision']}")
            e["measurement"] = m
            e["updated_at"] = _now()
            reviewable.append(e)

    _write_ledger(entries)
    print(f"\nReviewed: {len(reviewable)}")

def cmd_report(args):
    entries = _read_ledger()
    lines = ["# Measurement Status Report", f"\nGenerated: {_now()}", ""]

    by_status = {}
    for e in entries:
        by_status.setdefault(e["status"], []).append(e)

    for status in ["proposed", "triaged", "approved", "applied", "verified", "measured", "closed"]:
        group = by_status.get(status, [])
        if not group:
            continue
        lines.append(f"## {status.upper()} ({len(group)})")
        lines.append("")
        for e in group:
            m = e.get("measurement", {})
            baseline = m.get("baseline", {}).get("value", {})
            post = m.get("post_change", {}).get("value", {})
            decision = m.get("decision", "—")
            slug = e.get("entity", {}).get("slug", "?")[:40]
            b_ctr = baseline.get("gsc", {}).get("ctr", "—")
            p_ctr = post.get("gsc", {}).get("ctr", "—")
            lines.append(f"- **{e['id']}** `{slug}` — baseline CTR: {b_ctr}, post CTR: {p_ctr}, decision: {decision}")
        lines.append("")

    report = "\n".join(lines)
    REVIEW_MD.write_text(report)
    print(report)

def main():
    p = argparse.ArgumentParser(description="Emart measurement loop")
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("capture-baselines")
    sub.add_parser("review")
    sub.add_parser("report")
    args = p.parse_args()
    if args.cmd == "capture-baselines":
        cmd_capture_baselines(args)
    elif args.cmd == "review":
        cmd_review(args)
    elif args.cmd == "report":
        cmd_report(args)
    else:
        p.print_help()

if __name__ == "__main__":
    main()
