# Third-Party JS Perf Pass - 2026-06-03

- Homepage third-party scripts are intentionally delayed after load/idle: GA4 about 3.5s, Meta Pixel about 4s, Google Merchant rating badge about 5s.
- GA4 config disables Google signals/ad personalization signals to reduce extra audience calls.
- CSP `img-src` includes `google.de` because GA can request `https://www.google.de/ads/ga-audiences...`; this fixed the Lighthouse console/CSP issue.
- MerchantVerse preload warning comes from Google's merchant widget iframe, not a site-authored preload. The widget remains enabled but delayed because Lighthouse measured the main-thread issue mostly in early analytics/JS, not this iframe.
- 2026-06-03 Lighthouse mobile baseline before pass: performance 57, TBT 2683ms, bootup 3554ms, main-thread 10423ms.
- Fresh post-deploy cache-busted run: performance 74, console errors 0, TBT 460ms, bootup 1898ms, main-thread 5186ms. One earlier post-deploy run scored 76 with TBT 108ms; treat Lighthouse as variable and compare diagnostics over single scores.
