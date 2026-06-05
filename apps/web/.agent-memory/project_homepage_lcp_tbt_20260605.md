# Homepage LCP/TBT Perf Pass - 2026-06-05

Codex deployed `d8fb0ac perf(home): defer below-fold homepage sections`.

What changed:
- Split `OfferCollectionsRail` out of `HomepageSections` so the static above-fold/near-fold offer rail does not pull the full homepage section module into `/`.
- Added `HomepageDeferredSections` with `next/dynamic({ ssr: false })` plus near-viewport/idle activation for Flash Sale, product rails, concern/ingredient/routine sections, authenticity/brand/customer/blog/trust sections.
- Kept `HeroCarousel`, `MobileDiscovery`, `ShopByCategory`, and `OfferCollectionsRail` static.
- Verified GA4, Meta Pixel, and Google rating badge already defer through `lazyOnload` plus idle/load gates.

Measured results:
- Homepage First Load JS: `157 kB` -> `108 kB`.
- Lighthouse mobile fresh pre-patch: score `63`, LCP `4.0s`, TBT `1,000ms`, total bytes `1,321 KiB`.
- Lighthouse mobile post-deploy: score `97`, LCP `2.1s`, TBT `120ms`, total bytes `592 KiB`.
- LCP element remains `Shop by category` H2, but element render delay improved from about `1179ms` to `267ms`.

Reports:
- Pre-patch: `workspace/audit/active/lighthouse-home-mobile-20260605-fresh.report.report.json`
- Post-patch: `workspace/audit/active/lighthouse-home-mobile-20260605-post-defer.report.report.json`
