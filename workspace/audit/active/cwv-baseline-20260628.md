# Core Web Vitals Baseline — 2026-06-28

Source: Lighthouse 13.4.0 (mobile, headless Chrome, VPS-local)
All pages: **SEO 100/100** — no failing SEO audits on any route.

## Scores

| Page | Perf | FCP | LCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|
| `/` (Homepage) | **77** | 1.3s (98) | 3.0s (79) | 700ms (42) | 0 (100) | 1.7s (100) |
| `/shop` | **63** | 3.8s (27) | 6.9s (6) | 240ms (85) | 0 (100) | 3.9s (83) |
| `/category/korean-beauty` | **51** | 2.7s (60) | 6.0s (13) | 970ms (28) | 0.017 (100) | 3.7s (85) |
| PDP (`/shop/medicube-pdrn-...`) | **57** | 3.6s (33) | 6.6s (8) | 430ms (64) | 0 (100) | 3.7s (86) |
| `/brands` | **90** | 1.6s (94) | 2.0s (97) | 320ms (77) | 0.001 (100) | 4.1s (79) |

## Interpretation

### Strengths
- **SEO 100** on every sampled route — metadata, schema, canonicals, indexability all clean
- **CLS 0** — no layout shift anywhere; solid visual stability
- **Accessibility 100** on homepage (only 2 minor label-match items)
- `/brands` is the performance leader at 90 — lightweight text page

### Weaknesses (all LCP-driven)
- **LCP is the primary bottleneck** on product-listing pages: /shop 6.9s, /category 6.0s, PDP 6.6s
  - Root cause: product images + full product grid rendered server-side, large initial payload
  - Fix path: lazy-load below-fold product cards, optimize hero/product images, code-split PDP components
- **TBT varies widely**: /category 970ms (worst), homepage 700ms, others <500ms
  - Root cause: JS hydration of product grid + interactive components
- **FCP**: /shop 3.8s is the worst — likely SSR response time for full catalog page

### CWV Rating (Google thresholds)
| Metric | Good | Needs Improvement | Poor | Our worst |
|---|---|---|---|---|
| LCP | ≤2.5s | 2.5–4.0s | >4.0s | 6.9s (Poor) |
| FID/INP | ≤200ms | 200–500ms | >500ms | TBT proxy: 970ms |
| CLS | ≤0.1 | 0.1–0.25 | >0.25 | 0.017 (Good) |

**Summary:** CLS is excellent. LCP on product pages is Poor — the main CWV ranking signal gap. TBT on category pages exceeds the Good threshold. These are code-level optimizations best addressed post-freeze (2026-07-03+).

## Recommended Actions (post-freeze)
1. Lazy-load product cards below fold on /shop and /category pages
2. Optimize LCP image (product hero on PDP, first product card on listings)
3. Code-split PDP tabs/sections loaded below fold
4. Consider ISR/streaming for heavy category pages
5. Re-run baselines monthly to track regression/improvement
