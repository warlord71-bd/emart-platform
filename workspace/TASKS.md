# Emart Open Task Board

Last updated: 2026-06-02 — **6-WEEK STABILITY FREEZE ACTIVE**
Freeze period: 2026-05-22 → 2026-07-03. After that: reassess from GSC data.
**Rule:** Single priority board, tracked in git. Detail → `workspace/SEO_MASTER.md` · `workspace/DEV_MASTER.md`.
Only mark `[x]` when fully deployed + verified on live VPS.

**[C]** = Claude only | **[X]** = Codex only | **[O]** = Owner action | **[C+X]** = Concurrent

---

## ✅ ALWAYS OK — during freeze (no SEO risk)

- Add new products to WooCommerce — sitemap auto-updates, new URLs get crawled naturally
- Add product images — improves schema quality and CTR, never hurts
- Add blog posts — grows authority, zero structural risk
- Add/edit product descriptions, ingredients, how-to-use content
- Fix product prices, stock, SKU data
- Respond to customer/support issues

---

## 🔴 PHASE 0 — RIGHT NOW (live site impact)

### P0.1 — Nginx: restore `/wp-json/wp/v2/product` endpoint `[C]`
- [ ] Brand pages returning 403. `getProductIdsByBrand` calls `/wp-json/wp/v2/product` — accidentally blocked by today's security change.
- Fix: add `product` alongside `product_brand` in Nginx exception block.
- File: `/etc/nginx/sites-enabled/emart-nextjs`
- Root cause confirmed: `curl http://127.0.0.1/wp-json/wp/v2/product` → 403 | direct PHP → 200

### P0.2 — PM2: set `--max-old-space-size=1536` on emartweb `[C]`
- [ ] No explicit Node.js heap ceiling. Default heap, 92% utilization reported by PM2.
- Fix: update PM2 ecosystem or restart with `--node-args="--max-old-space-size=1536"`
- 633 restarts are deploy restarts (unstable_restarts=0), NOT crash loop — confirmed.

### P0.3 — GCP service account key rotation `[O]` 🔴 SECURITY
- [ ] Key `ce8b30ba` was shared in chat session. Must be rotated immediately.
- Action: Google Cloud Console → IAM → Service Accounts → emart-seo → Keys → Delete old → Create new
- Then: update `/root/.gmc/service-account.json` on VPS

---

## 🟡 PHASE 1 — Infrastructure Stability (this week)

*Correct sequence: P1.4 → P1.1 (cache tags first, then circuit breaker uses them)*

### P1.4 — Cache tag granularity `[C]`
- [ ] All 3,640 products share `'products'` cache tag in `woocommerce.ts:528`
- `revalidateTag('products')` currently flushes entire catalog at once
- Fix: add `product-${slug}` as second tag alongside `'products'`
- Do this BEFORE circuit breaker so stale fallback uses correct scope

### P1.1 — WooCommerce circuit breaker `[C]`
- [ ] `unstable_cache` returns `[]` on WooCommerce failure → blank product pages
- No stale ISR fallback, no retry, no backoff
- Fix: serve last cached value when API fails + log degraded state

### P1.3 — Sitemap parallel request throttle `[C]`
- [ ] `sitemapEntries.ts:307` — `Promise.all()` fires 37 simultaneous WooCommerce requests
- 3,640 products ÷ 100 per page = 37 concurrent fetches on sitemap generation
- Likely contributing to brand 403 bursts and Nginx 30s timeout risk
- Fix: replace `Promise.all` with chunked execution (max 5 concurrent)

### P1.5 — `getBrands` fallback backoff `[C]`
- [ ] `woocommerce.ts:886` — zero delay before public URL retry on ECONNRESET
- On internal failure: immediately retries public URL, both fail instantly
- Fix: add 500ms delay before fallback attempt

### P1.6 — DM_Sans font: add `preload: false` `[C]`
- [ ] `layout.tsx:27-35` — DM_Sans (body font) preloads by default, all others have `preload: false`
- Body font preload = potential FCP block + CLS risk
- Fix: add `preload: false` to DM_Sans config

### P1.7 — Disk cleanup `[C]`
- [ ] 73% of 96GB used (70GB used, 27GB free)
- Clear: old PM2 logs, stale build artifacts, audit archives
- Check: WordPress media duplicates, old `.next/` builds

---

## 🟢 PHASE 2 — SEO Schema Improvements (within freeze, additive only)

### P2.1 — Add `dateModified` + `datePublished` to Product JSON-LD `[C]`
- [ ] WooCommerce has `date_modified` but `product.ts:127-155` does not serialize it to schema
- AI crawlers and Google lose temporal freshness signals
- Fix: add `datePublished` (date_created) + `dateModified` (date_modified) to Product schema
- File: `apps/web/src/lib/seo/product.ts`

### P2.2 — noindex for thin/private pages `[C]`
- [ ] `/track-order` and `/wishlist` have no noindex signal
- Not in robots.ts disallow, no X-Robots-Tag header from Nginx
- Fix: add `robots: { index: false, follow: false }` to page metadata
- Files: `apps/web/src/app/track-order/page.tsx`, `apps/web/src/app/wishlist/page.tsx`

---

## 🔵 PHASE 3 — Concurrent Content Generation (ongoing background)

*All Phase 3 tasks can run simultaneously. Claude and Codex work in parallel.*

### P3.1 — Face cleanser humanizer completion `[C]` 🔄
- [ ] 169/218 done. No humanizer background process running; PID 2184866 was stale/dead. Next batch must handle 28 validation-failed IDs plus remaining eligible products.
- After complete: move to toner/mist
- Holdout: 13 products — do NOT touch
- Remeasure: 2026-06-28 (+4w) and 2026-07-26 (+8w)

### P3.2 — Universal humanizer: extend for all remaining categories `[X]`
- [ ] **DO NOT rebuild** — extend `workspace/docs/humanizer_face_cleansers.py` with `--category` flag
- Add category-specific configs: PAIRING_RULES, SECTION_TEMPLATES, cleanser_type detection per category
- Correct category slugs and sizes:

| Slug | Products | Pairing logic |
|---|---|---|
| `toners-mists` | 199 | serum/essence after |
| `toner-pads` | 18 | serum after |
| `serums-ampoules-essences` | 518 | moisturizer after |
| `cream-moisturizer` | 27 | sunscreen after |
| `night-cream` | 15 | overnight, no sunscreen |
| `sunscreen` | 315 | last AM step |
| `soothing-gel` | 41 | before moisturizer |
| `face-masks` | 67 | essence/serum context |
| `eye-care` | 74 | before moisturizer |
| `acne-blemish-care` | 461 | varies by type |
| `body-lotion` | 87 | after shower damp skin |
| `body-wash` | 49 | body cleanse context |
| `makeup-remover` | 90 | first cleanse step |
| `shampoos` | 126 | scalp focus |

### P3.3 — Blog generation (ongoing) `[C]`
- [ ] 10 posts published. 53 topics queued. Continue blog_generator.py runs.
- Model: `deepseek/deepseek-v4-pro` | Authors: 2736, 2737, 2738
- Topics: GSC gaps + YouTube BD trends + curated
- Standard: Soko Glam quality, English + Bangla tips boxes

### P3.4 — Google News sitemap + NewsArticle schema `[C]`
- [ ] Build `/news-sitemap.xml` route at `apps/web/src/app/news-sitemap.xml/route.ts`
- Add `NewsArticle` JSON-LD to blog post pages
- Submit to Google News Publisher Center after deploy

### P3.5 — pa_concern apply `[X]`
- [ ] Waiting: owner reviews `workspace/audit/active/pa-concern-manual-review-20260521-174247.csv`
- Codex applies after owner marks APPROVE/SKIP per row

---

## 🧊 PHASE 4 — Post-Freeze (after 2026-07-03)

*Do not start until GSC data reviewed.*

| Item | Why deferred |
|---|---|
| Dynamic OG image per product (next/og) | Involves product page deploy — after freeze |
| VideoObject schema | Additive but needs product video audit first |
| Brand `sameAs` → Wikipedia/official | Knowledge Graph — post-freeze SEO |
| `output: 'standalone'` in next.config | Structural deploy change |
| Inventory procurement list (catalog-gap) | Business decision needed |
| New redirects | 72 rules in — let Google process |
| URL / slug changes | Resets crawl signals |
| Sitemap structure changes | 4,221 URLs indexed — let settle |
| New page types (compare, listicles, skin-type) | New URL patterns restart indexing |
| Atomic design upgrade | Branch-only future refactor |
| Contabo migration | Separate maintenance window |

---

## 🧊 FROZEN — SEO freeze rules

Google needs 6 weeks of signal stability after structural May work.

**Emergency exception:** Site down, checkout broken, security vulnerability, data loss, 500 errors on revenue pages → fix immediately, minimal scope, then stop.

**Freeze check:** Before any code change ask — "does this change a URL, redirect, sitemap, or navigation?" If yes → frozen until 2026-07-03.

---

## ✅ COMPLETED (this session 2026-06-02)

### Security & Auth
- [x] Nginx: block `/wp-json/wp/v2/` (posts, users, pages) — 403 returned
- [x] Nginx: allow `product_brand` taxonomy endpoint (headless brand pages)
- [x] Rate limiting: checkout (10r/m), auth/subscribe (5r/m), general API (60r/m)
- [x] Cookie `SameSite: strict` on login + verify-email routes
- [x] NEXTAUTH_SECRET: throws in production if not set
- [x] Newsletter email: RFC 5322 regex + 254-char limit
- [x] Checkout: quantity bounds 1–99 per item, max 50 line items
- [x] Checkout: idempotency_key (UUID-style, stored in Woo order meta)
- [x] Checkout: stock check before order creation (409 on out-of-stock)
- [x] Guest checkout: auto-send password reset to new customers
- [x] CSP: removed `unsafe-eval` from script-src

### SEO & Schema
- [x] Broken RSS feed links removed from layout.tsx
- [x] False `en-BD` hreflang removed from homepage
- [x] Product JSON-LD: FAQ price Q&A (EN+BN, schema-only, targets "price in Bangladesh")
- [x] Product JSON-LD: `speakable` schema (xpath: title, h1, meta description)
- [x] Product JSON-LD: `offers.description` "price in Bangladesh: ৳X"
- [x] Product JSON-LD: `restockingFee` corrected 0 → ৳100 (matches live policy)
- [x] BlogPosting: author `knowsAbout` array + `worksFor`
- [x] Article → BlogPosting schema type
- [x] Removed non-standard `keywords` property from Product JSON-LD

### GCR & GMC
- [x] Google Customer Reviews survey opt-in deployed (order-success page)
- [x] Merchant widget badge deployed (site-wide, lazyOnload)
- [x] GCR callback fixed: `renderOptIn` (was `renderGCROptIn`)
- [x] Return policy submitted to GMC (under 10-day review)
- [x] Duplicate "Emart Returns" policy deleted (kept "Standard for Bangladesh")

### Infrastructure
- [x] MySQL InnoDB buffer pool: 128MB → 1GB (full 425MB DB fits in RAM)
- [x] MySQL `innodb_flush_log_at_trx_commit=2`, `O_DIRECT` flush
- [x] Ollama stopped (freed 587MB swap pressure)
- [x] Nginx: wp/v2/product_brand exception added

### WordPress Authors (for blog E-E-A-T)
- [x] Dr. Sarah Khan (ID 2736) — dermatologist, K-beauty specialist
- [x] Dr. Nadia Islam (ID 2737) — cosmetic formulation expert
- [x] Emart Skincare Team (ID 2738) — product curation

---

## 👤 OWNER ACTIONS NEEDED

| Action | Priority | Unblocks |
|---|---|---|
| **Rotate GCP service account key `ce8b30ba`** | 🔴 Security | P0.3 |
| **Review pa_concern CSV** | 🟡 | P3.5 (Codex) |
| **Add GMC return service address** (Dhanmondi, 26/2 Central Road, Dhaka 1205) | 🟡 | Clears GMC Store Quality "Incomplete" |
| **Upload 16 product images** | 🟢 | Codex assigns to products |
| **GA4 DebugView test** | 🟢 | Confirm 404 event fires |
| **M3 mobile checkout smoke test** | 🟢 | Device needed |

---

## 📋 AUDITS STILL NEEDED

| Area | Status | Notes |
|---|---|---|
| Email deliverability (DKIM/SPF/DMARC) | ❌ Not done | MailPoet health check |
| Cloudflare WAF / bot fight mode | ⚠️ Partial | Cache rules done, WAF not checked |
| WordPress plugin conflicts (mu-plugins) | ❌ Not done | Interdependency audit |
| Backup / restore verification | ❌ Not done | No confirmed backup strategy |
| SSL cert auto-renew confirmation | ❌ Not done | Let's Encrypt timer check |
| WooCommerce slow query log | ⚠️ Partial | MySQL tuned, queries not profiled |
| Mobile app full flow (device) | ❌ Not done | Needs physical device |

---

## 🛑 PERMANENT DO NOT TOUCH

- Checkout / cart / payment / order logic
- `_sku`, `_price`, `_stock_quantity` WooCommerce meta
- `apps/web/src/app/api/checkout` (read-only audit OK, no edits)
- Customer data / order history
- `calculateLineItemsSubtotal` sequential pattern — intentional for transaction integrity

---

## AGENT RULES

- **Claude Code** → `apps/web` (Next.js, TypeScript, SEO, content, Nginx, PM2) — no direct WP DB writes
- **Codex** → `apps/mobile`, PHP mu-plugins, WP DB mutations, humanizer universal script — no Next.js UI files
- **Both** → Read `/root/CLAUDE.md` + `/root/emart-platform/CLAUDE.md` at session start
- **During freeze** → Only DO NOW tasks and ALWAYS OK items permitted
- **Freeze check** → Before any code change: "does this change a URL, redirect, sitemap, or navigation?" If yes — frozen until 2026-07-03
- **Dry-run rule** → Never bulk-mutate WooCommerce data without dry-run CSV reviewed by owner first
- **Sequence rule** → P0 → P1.4 → P1.1 → P1.3 → P1.5 → P1.6 → P2 → P3 (parallel) → P4
- **SEO detail** → `workspace/SEO_MASTER.md`
- **Dev detail** → `workspace/DEV_MASTER.md`
