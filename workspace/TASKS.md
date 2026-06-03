# Emart Task Board
Last updated: 2026-06-04
Freeze: 2026-05-22 → 2026-07-03 (structural/nav only — content, SEO, automation OK)
**[C]** Claude · **[X]** Codex · **[O]** Owner · **[A]** Auto/OpenClaw

---

## 🤖 RUNNING AUTONOMOUSLY (no action needed)

| PM2 Job | Schedule | What |
|---|---|---|
| `emart-meta-gen` | Continuous | dry-run → validate → apply-reviewed → revalidate → repeat |
| `emart-seo-autoscan` | Daily 07:00 BD | Blog SEO auto-fill via `emart-seo-generator` OpenClaw skill |
| `emart-checkout-monitor` | Every 15 min | 8-step checkout test, instant Telegram on failure |
| `emart-competitor-prices` | Daily 08:00 BD | Yahoo search → competitor price → Google Sheets + Telegram |
| `emart-serp-checker` | Daily 07:00 BD | GSC position tracker, Telegram report |
| `emart-presence` | Persistent | WebSocket presence server |

---

## 🔴 URGENT — Mobile App (starts 2026-06-05)

### M0 — Mobile App: Internal Testing → Play Store `[O+C]`
- [ ] Internal testing audit: document all known bugs before build
- [ ] Verify all direct WooCommerce calls removed (M2 done — confirm no regressions)
- [ ] Rotate any WC API keys that were ever in mobile bundle
- [ ] Fix cart/checkout mobile flow (M4 — client wired, backend endpoint `/api/checkout` verify)
- [ ] Build signed APK/AAB for Play Store internal testing track
- [ ] Play Store listing: title, screenshots (phone + tablet), short/long description, content rating, privacy policy
- [ ] Submit to internal testing track → QA sign-off → promote to closed testing → open testing → production
- [ ] See `workspace/docs/mobile-build-notes.md` for build config details

---

## 🟡 ACTIVE — SEO / Content

### S1 — Meta Description Catalog `[A]` 🔄
- Auto-running: `emart-meta-gen` PM2 continuous loop
- ~2,642 products remaining when started → runs until 0
- Standard: 130-158c, 2-clause, no price, Bangladesh + Emart + COD
- Writes both `_emart_meta_description` + `_rank_math_description`
- Validator: `python3 workspace/docs/meta_validator.py --catalog`

### S2 — Face Cleanser Humanizer `[X]` 🔄
- **185/218 humanized** (180 regular + 5 mini)
- 21 regular remaining — Codex batch running
- 2 products removed from category (62869 body wash, 63929 toner)
- 1 bundle (63747) — skip flagged
- Holdout: 13 products → GSC measure 2026-07-26

### S3 — Next Humanizer Category: Toner/Mist `[X next]`
After face-cleansers complete:
1. `baseline_snapshot.py` for toner/mist
2. Copy `humanizer_face_cleansers.py` → `humanizer_toners.py`, update category/type maps
3. Maintain 13-product holdout group
4. Or use OpenClaw `emart-auto-publisher` if < 100 products

### S4 — Playwright MCP Active Scope `[C+A]`
Running:
- Checkout monitor (15-min) ✅
- Competitor price checker (daily) ✅
Next to build:
- Product page visual audit (top 50 PDPs)
- New-product SEO trigger (on publish → auto `emart-seo-generator`)
- Blog CTR loop (7-day post-publish → GSC check → rewrite if low)

### S5 — GSC / Cloudflare `[O]`
- [x] Googlebot unblocked (Bot Fight Mode OFF + WAF rule: `cf.client.bot` → skip all)
- [ ] Re-submit sitemap in GSC → Sitemaps → remove + re-add `https://e-mart.com.bd/sitemap.xml`
- [ ] Request indexing on top 20 products via GSC URL Inspection tool

### S6 — pa_concern taxonomy `[O pending]`
- Owner CSV review required before apply
- Dry-run CSVs in `workspace/audit/archive/`

---

## 🔵 BACKLOG (after mobile launch)

- `aggregateRating` in Product schema — enable when site gets more reviews
- Missing product images — `workspace/audit/active/products-need-real-image.csv`
- Korean Beauty taxonomy decision — `workspace/docs/category-taxonomy-status.md`
- GCP service account key rotation (fingerprint `ce8b30ba` — security)
- Cloudflare cache rules API setup (currently dashboard-only)

---

## 📱 MOBILE EMERGENCY NOTE — 2026-06-05

**Starting tomorrow: Mobile App Live Procedure**

Internal flow:
```
Fix known bugs → Build signed AAB → Upload to Play Store internal track
→ Internal QA (owner + 2-3 testers) → Fix bugs → Closed testing
→ 2 weeks → Open testing → 2 weeks → Production release
```

Key files:
- Build config: `workspace/docs/mobile-build-notes.md`
- API: all calls go through `https://e-mart.com.bd/api/mobile/*` (BFF layer)
- Auth: NextAuth sessions, no direct WC credentials in app bundle
- WC keys: confirm `key_id 34` (live BFF) is the only active key

Critical checks before build:
1. No `WOOCOMMERCE_KEY` / `WOOCOMMERCE_SECRET` in mobile code
2. `/api/mobile/products`, `/api/mobile/cart`, `/api/checkout` all respond 200
3. bKash + Nagad payment flows tested on staging device
4. COD order placement end-to-end tested

---

## ✅ COMPLETED (log)

- Face cleanser mini products (5) humanized with parent context
- Face cleanser consistency audit fixes (medical claims, h3 count, meta length)
- Meta generator + validator pipeline (`meta_generator.py`, `meta_validator.py`)
- Safe workflow: dry-run → validate → apply-reviewed → revalidate
- Checkout monitor (PM2 15-min cron) live
- Competitor price checker (Yahoo search + Google Sheets) live
- SERP/GSC position tracker live
- `emart-seo-generator` skill v2 (blog + product mode + auto-scan)
- `emart-auto-publisher` skill (LLM → WordPress → SEO → Playwright verify)
- Third-party analytics deferral (GA4, Meta Pixel → load/idle)
- WooCommerce BFF security (M1 + M2 done, keys rotated)
- Cloudflare Googlebot unblock (WAF rule + Bot Fight Mode off)
- Git state reconciled (VPS/Local/origin all at same commit)
- WP Application Password `openclaw-seo-gen` for Rank Math writes
- `emart-rankmath-rest.php` v1.1 (write endpoint for blog SEO)

---

## 📊 SITE ROUTE MAP (2026-06-04 baseline)

Total sitemap URLs: **4,224** across 26 route types.

| Route | Count | Meta | Notes |
|---|---|---|---|
| `/shop` | 3,640 | 🟡 meta-gen running | ~2,642 still need 130-158c metas |
| `/brands` | 387 | ✅ | Hardcoded in lib/ingredients.ts |
| `/blog` | 51 | ✅ | Rank Math fields — some missing focus_keyword |
| `/category` | 50 | ✅ | generateMetadata dynamic |
| `/origins` | 23 | ✅ | Dynamic |
| `/ingredients` | 16 | ✅ | Hardcoded metas |
| `/routine` | 11 | ✅ | All 200, proper metas confirmed |
| `/concerns` | 10 | ✅ | All 200, slugs correct (e.g. acne-blemish-care not acne) |
| `/skin-type` | 6 | Need verify | |
| Static pages | 16 | Need verify | /faq, /contact, /our-story etc |
| `/offers /best /compare` | 15 | Need verify | |

**Key SEO gaps by priority:**
1. 🔴 `/shop` metas — `emart-meta-gen` running, ~2,642 remaining
2. 🟡 `/skin-type` + static pages — not checked, likely missing metas
3. 🟡 `/blog` focus keywords — 32 posts missing `_rank_math_focus_keyword`
4. 🔵 Request indexing on top pages after meta-gen completes
