# Emart Task Board
Last updated: 2026-06-05
Freeze: 2026-05-22 → 2026-07-03 (structural/nav only — content, SEO, automation OK)
**[C]** Claude · **[X]** Codex · **[O]** Owner · **[A]** Auto/OpenClaw

---

## 🤖 RUNNING AUTONOMOUSLY (no action needed)

| PM2 Job | Schedule | What | Status |
|---|---|---|---|
| `emart-meta-gen` | Continuous | dry-run → validate → apply-reviewed → revalidate | ✅ cycle 42+, ~2,000 applied |
| `emart-checkout-monitor` | Every 15 min | 8-step checkout test, Telegram on failure | ✅ all 8 steps pass |
| `emart-presence` | Persistent | WebSocket presence server | ✅ 33d uptime |
| `emart-seo-autoscan` | Daily 07:00 BD | Blog SEO auto-fill | ⚠️ cron-mode, verify fires at 07:00 |
| Python crons | Various | site_health/daily_report/low_stock/competitor_prices | ✅ running |
| GMC sync | Every 6h | WooCommerce → Google Merchant Center | ✅ 3,503/3,639 approved |

**PM2 jobs showing "stopped" between cron runs is NORMAL — they exit after completing.**

---

## 🔴 URGENT — Codex (read CODEX-BRIEF-20260605.md)

### X1 — GMC Policy Violations `[X]` ← START HERE
- [x] Live GMC API pull mapped current disapprovals to Woo: `127` rows
- [x] Dry-run artifacts created:
  - `workspace/audit/active/gmc-policy-control-dryrun-2026-06-05.csv`
  - `workspace/audit/active/gmc-policy-copy-proposals-2026-06-05.jsonl`
- Classification: `23` copy-ready rows, `11` copy/title-risk review rows, `33` copy-policy rows needing manual sample because no rule-based change was found, `42` document/owner-decision rows, `5` data/asset rows.
- [x] Step 1 applied after owner approval: 9 substantive rule-based proposals wrote `post_content` only; backup/log saved in `workspace/audit/active/`.
- [x] Step 2 LLM rewrite dry-run generated for 44 products; owner sample file created.
- Next gate: owner reviews Step 2 sample/CSV before any apply batches; no GMC sync, title edit, price edit, URL action, or image action yet.
- Fix standard: rewrite product descriptions using ingredient-focused neutral language only.
- Full brief: `workspace/docs/CODEX-BRIEF-20260605.md` Task 1

### X2 — Humanizer: Redirect to Impression-Priority Brands `[X]`
- [x] Target CSV created: `workspace/audit/active/humanizer-impression-priority-targets-2026-06-05.csv`
- STOP: do not start toner/mist after face cleansers.
- START: humanize CeraVe, Skin1004, Medicube, Innisfree, COSRX products with GSC impressions first.
- Current list: `341` brand products; `30` ready after cleanser batch; `26` already humanized; `285` backlog/no GSC impressions.
- Gate: keep 13-product holdout and dry-run → validate → owner review → apply workflow.
- Reference: `workspace/audit/active/gsc-query-map-2026-05-31.json`
- Full brief: `workspace/docs/CODEX-BRIEF-20260605.md` Task 2

### X3 — Mobile App M0 `[O+X]` ← ON HOLD (owner instruction: do X1+X2 first)
- Build signed AAB → Play Store internal testing track
- Add in-app post-purchase review prompt (fastest path to aggregateRating)
- Add SSL Commerz as payment option (brief Task 5)
- Full brief: `workspace/docs/CODEX-BRIEF-20260605.md` Task 3

---

## 🟠 ACTIVE — Claude

### C1 — Sunscreen Category Copy `[C]`
- SEO_MASTER M7: expand /category/sunscreen intro to 3 H2 blocks
- Missing terms: broad-spectrum, reapply, outdoor, water-resistant, UVA/UVB
- Freeze-safe content edit, no code change

### C2 — ReviewsSection W4 `[C]`
- DEV_MASTER W4: remove `cache: 'no-store'` client refetch in ReviewsSection.tsx:70-93
- Small performance fix, reduces unnecessary API calls on every PDP load

---

## 🟡 ACTIVE — Owner actions needed

### O1 — GSC Manual Actions
- [ ] Re-submit sitemap: GSC → Sitemaps → remove + re-add `https://e-mart.com.bd/sitemap.xml`
- [ ] URL Inspection + request indexing: CeraVe night cream, Skin1004 centella ampoule, Medicube vitamin C (top impression pages)
- Only submit pages that are 200, canonical, indexable

### O2 — MailPoet Review Email
- [ ] Set up post-purchase automation: email 3 days after delivery
- [ ] Subject: "How was your [product name]? Leave a quick review"
- [ ] Links directly to product page with review form
- **This is the fastest path to aggregateRating (5 stars in Google snippets)**

### O3 — Meta CAPI Verification
- [ ] Place one COD test order
- [ ] Check Meta Events Manager: Purchase event shows value > 0 and currency = BDT
- [ ] If broken: escalate to Claude immediately

### O4 — 16 Product Images
- `workspace/audit/active/products-need-real-image.csv`
- Supply replacement images → Codex assigns in WooCommerce

### O5 — pa_concern Taxonomy
- 1,161 products still without concern assignment
- CSV: `workspace/audit/active/pa-concern-manual-review-20260521-174247.csv`
- Review APPROVE/SKIP column → Codex runs apply script

### O6 — Cloudflare Cache Rule
- Dashboard-only: add cache rule for `/shop` and `/category/*`
- Nginx already sets s-maxage correctly, this adds Cloudflare edge caching

---

## 🔵 BACKLOG (post-freeze July 3+)

- **LCP bundle fix**: 58 scripts/1,494ms evaluation. Bundle analysis + unused JS (125KB). Medium risk.
- **Blog content at scale**: 51 posts vs Shajgoj 5,904. YouTube companion posts + ingredient guides.
- **UCP/MCP commerce endpoint**: build when reviews > 200.
- **Critical CSS (critters)**: DEV_MASTER W6, eliminates render-blocking CSS.
- **Origin editorial content**: South Korea/Japan/USA exist, 20 others are bare grids.
- **GCP service account key rotation**: fingerprint `ce8b30ba`.
- **Korean Beauty taxonomy decision**: see `workspace/docs/category-taxonomy-status.md`.

---

## ✅ COMPLETED (2026-06-05 session)

- FAQPage JSON-LD added to 9 concern pages (was missing, ingredient pages already had it)
- Product schema description decoupled from meta: now uses full product.description (400-500c) when available
- agents.md created at /agents.md — AI agent discoverability (catalog, BFF, social channels)
- ARCHIVE_INDEX stale meta_gen entry corrected
- CODEX-BRIEF-20260605.md written with full task brief for Codex
- OpenClaw gateway fixed (doctor --fix), skincare-trends cron fixed (openrouter/auto), OpenRouter key fixed
- competitor_prices.py rewritten: full 3,639-product catalog vs EmartwayBD + SkincareBD
- Google Sheets webhook wired for competitor monitoring
- False-alarm alert emails fixed (health endpoint added to emart-newsletter.php)
- Facebook URL confirmed: facebook.com/emartbd.official | YouTube: @emartbd.official

## ✅ COMPLETED (earlier)

- Face cleanser humanizer (185/218, 13 holdout)
- Meta generator + validator pipeline live
- Checkout monitor PM2 confirmed working (all 8 steps pass)
- Third-party analytics deferral (GA4, Meta Pixel)
- WooCommerce BFF security (keys rotated, key_id 39 live)
- Cloudflare Googlebot unblock
- emart-rankmath-rest.php v1.1
- emart-seo-generator skill v2

---

## 📊 SITE STATE (2026-06-05)

| Metric | Value |
|---|---|
| Sitemap URLs | 4,225 |
| Products in GMC | 3,503 approved / 127 disapproved / 415 with issues |
| Meta descriptions filled | ~2,100+ (meta-gen running) |
| Reviews | 5 total — aggregateRating blocked |
| GSC impressions (90d) | 3,193 / 14 clicks / 0.44% CTR |
| LCP (mobile) | 5.8s (fail — post-freeze fix) |
| Checkout | ✅ All 8 steps pass |
| Live commit | 336c003 |

---

## 🔑 Key Rules

**WC API Key:** key_id `39` ("Emart BFF Live") in `.env.local`. Never delete without updating .env.local first.
**Freeze:** Structural/nav frozen until 2026-07-03. Content, data, new features, automation: OK.
**Deploy order:** Local build → commit → rsync → VPS build → pm2 restart → smoke test → push.
**Humanizer priority:** Always by GSC impression count, not category order.
