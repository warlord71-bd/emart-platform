---
description: SEO health audit — live checks, regression detection, gap identification
---

# SEO Audit Workflow

## Prerequisites
- Read `workspace/SEO_MASTER.md` header for current state and known gaps
- Check recent SEO-related commits: `git log --oneline --grep=SEO -10`

## Step 1: Live response checks (parallel)
```bash
curl -sI https://e-mart.com.bd/                      # homepage headers
curl -s https://e-mart.com.bd/robots.txt              # robots directives
curl -s https://e-mart.com.bd/sitemap.xml | head -50  # sitemap health
curl -sI https://e-mart.com.bd/shop/cosrx-advanced-snail-96-mucin-power-essence-100ml  # sample PDP
curl -sI "https://e-mart.com.bd/product/test-redirect"  # legacy redirect
```

## Step 2: Regression checks
- Canonical headers present and correct (absolute URLs, `e-mart.com.bd`)
- No `x-powered-by: PHP` or WordPress technology headers leaking
- Robots.txt points to `/sitemap.xml` (Next.js, not WordPress)
- 301 redirects for legacy `/product-category/*` and `/tag/*`
- Query params (`add-to-cart`, `srsltid`, `orderby`) handled correctly
- Cache headers: `s-maxage` on collection/PDP pages

## Step 3: Schema/metadata spot check
- Sample PDP: JSON-LD Product schema present, price in BDT, availability correct
- Sample category: `generateMetadata` title/description present
- OG tags: absolute URLs, correct images

## Step 4: GSC/index health (if API available)
```bash
python3 workspace/seo-review/gsc_tracker.py status
```

## Step 5: Report
Flag regressions, new issues, and confirm known-good state. Reference SEO_MASTER.md section IDs.

## Reference
- URL policy registry: `workspace/seo/url-policy-registry.json`
- Technical control loop: `workspace/content-orchestrator/scripts/active/seo_technical_control_loop.py`
- Category taxonomy: `workspace/content-orchestrator/docs/specs/category-taxonomy-status.md`
