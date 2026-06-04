# Codex Task Brief — 2026-06-05

**Priority order: execute top to bottom. Do not start a lower item until the higher one is done or confirmed safe to run in parallel.**

---

## THINKING PATTERN UPDATE (read first)

The new decision framework for all work:

> **Impact by impression priority, not by category order.**

Before humanizing any product, ask: "Is this product getting Google impressions?" If not, it goes in the backlog. Start always with the products Google is already showing — those are the ones where content quality directly converts into clicks today.

Impression-priority brands (from GSC, 90-day data):
1. CeraVe (974 impressions)
2. Skin1004 (476 impressions)
3. Medicube (355 impressions)
4. Innisfree (273 impressions)
5. COSRX (172 impressions)
6. Neutrogena (89 imp), Isntree (43 imp), Hada Labo (34 imp)

These brands need deep, humanized product descriptions more urgently than any other category.

---

## TASK 1 — GMC Policy Violations (HIGHEST PRIORITY)

**Why:** Google Merchant Center has 127 disapproved products and 415 with warnings. Google Shopping results appear above organic AND above AI Overview. 15% of our catalog is blocked from our best discovery channel.

**Root causes found:**
| Reason | Count | Fix |
|---|---|---|
| Personalized advertising: personal hardships | 108 | Rewrite copy — remove language targeting skin problems as personal hardships |
| Healthcare and medicine: Prescription drugs | 216 | Remove any "prescription", "medicinal", "treats [condition]" language |
| Healthcare and medicine: misleading claims | 36 | Remove "repairs", "miracle", "clinically proven" without study citation |
| Personalized advertising: Identity and belief | ~50 | Foundation/shade products — likely unfixable, document as accepted |
| Product page unavailable | 27 | Find these products, check if live/404, fix or unpublish from GMC |
| Missing product price | 12 | Set price in WooCommerce for these products |

**Language rules for rewriting:**
- ❌ "for sensitive, problem-prone skin" → ✅ "formulated with centella asiatica and ceramides"
- ❌ "treats acne and skin problems" → ✅ "contains salicylic acid, a BHA exfoliant"
- ❌ "anti-aging miracle formula" → ✅ "contains retinol and peptides"
- ❌ "prescription-strength formula" → ✅ "concentrated formula with X% active"
- ❌ "repairs damaged skin barrier" → ✅ "supports skin barrier with ceramides"
- ✅ Ingredient-focused language is always safe
- ✅ Functional/how-it-works language is always safe
- ❌ Outcome language targeting personal conditions is not safe

**Steps:**
1. Pull the 127 disapproved product IDs from GMC using `/root/.gmc/sync.py` or API
2. For each: fetch current WooCommerce description
3. Rewrite using ingredient-focused language (use OpenRouter for batch rewriting)
4. Dry-run CSV → manual review sample → apply
5. Re-sync GMC: `python3 /root/.gmc/sync.py`
6. Check GMC status 24hrs later

**Do NOT touch:** pricing, URLs, product titles (unless title itself has the violation). Copy changes only.

---

## TASK 2 — Humanizer: Redirect to Impression-Priority Products

**Why:** Face cleanser humanizer is nearly done (185/218). But the products actually getting Google impressions are CeraVe, Skin1004, Medicube, Innisfree, COSRX — not face cleansers. Those 237 pages getting impressions with 0.44% CTR need better descriptions today.

**Action:**
1. Let face cleanser humanizer complete its current batch (185/218 — do not interrupt)
2. After completion: do NOT start next category alphabetically
3. Instead, run humanizer on the TOP IMPRESSION PRODUCTS:
   - Query: find all published products from brands: CeraVe, Skin1004, Medicube, Innisfree, COSRX
   - Filter: products without `_emart_humanized` meta flag
   - Prioritize: products with known GSC impressions first
   - Process in same dry-run → validate → apply flow as face cleansers
4. Keep 13-product holdout pattern per category
5. After top brands: continue to toner/mist as originally planned (S3 in TASKS.md)

**Reference:** `workspace/audit/active/gsc-query-map-2026-05-31.json` has per-product impression data.

---

## TASK 3 — Mobile App M0 (starts today 2026-06-05)

**Read first:** `workspace/docs/mobile-build-notes.md`

**Critical checks before build:**
1. Confirm no `WOOCOMMERCE_KEY` / `WOOCOMMERCE_SECRET` anywhere in `apps/mobile/`
2. Verify `/api/mobile/products`, `/api/mobile/cart`, `/api/checkout` all respond 200
3. Test COD order placement end-to-end on a device
4. Test bKash and Nagad payment link generation (confirm redirect URLs work)
5. Build signed AAB: `cd apps/mobile && ./gradlew bundleRelease` (or equivalent)
6. Upload to Play Store internal testing track

**Play Store listing (needed before submission):**
- Title: "Emart Skincare Bangladesh" (30 chars max)
- Short description: "Authentic Korean & global beauty. COD available." (80 chars max)
- Long description: 4000 chars — focus on authentic products, COD, BD-wide delivery, K-beauty, brands
- Screenshots: phone (1080×1920 min) showing: product listing, product detail, cart, checkout
- Feature graphic: 1024×500
- Content rating: complete questionnaire (beauty/cosmetics, no violence/adult)
- Privacy policy URL: `https://e-mart.com.bd/privacy-policy`

**Bengali description note:** Add Bengali (বাংলা) Play Store description. BD users search Play Store in both languages. Short: "অথেনটিক কোরিয়ান ও গ্লোবাল বিউটি। ক্যাশ অন ডেলিভারি।"

**Post-publish — review collection:**
Add in-app review prompt after successful order delivery confirmation. This is the fastest path to the 200 reviews needed to trigger aggregateRating in Google Search snippets.

---

## TASK 4 — Facebook + YouTube Revenue Alignment

**Why:** Facebook and YouTube are Emart's primary current revenue channels — not organic search. Meta ads drive paid acquisition. WhatsApp closes sales. YouTube content builds brand authority. All technical work should serve these channels, not compete with them.

**Facebook (Meta Ads):**
- Meta Pixel is live and deferred (post-load/idle) ✅
- CAPI (`metaCapi.ts`) sends server-side Purchase events ✅
- The `value` (order total in BDT) and `currency: BDT` are correct ✅
- **Gap:** Verify Meta Events Manager shows Purchase events with value > 0 after a live order
- **Gap:** Check if ViewContent, AddToCart, InitiateCheckout events are firing in Pixel/CAPI
- **Action:** If any standard events are missing, add them to `MetaPixel.tsx` and `metaCapi.ts`
- **Standard events for Emart:** ViewContent (PDP), AddToCart, InitiateCheckout, Purchase
- These feed Meta's ad optimization algorithm — missing events = suboptimal ROAS

**Facebook Catalog (for Dynamic Product Ads):**
- GMC sync at `/root/.gmc/sync.py` also feeds the GMC/Facebook catalog via `emart-nextjs-product-urls.php`
- 127 GMC disapprovals may also affect Facebook Dynamic Product Ads
- **Action:** After GMC fix (Task 1), verify Facebook Catalog Manager shows products correctly
- **Action:** Check Facebook Business Suite → Commerce Manager → Catalog for disapproval reasons

**YouTube:**
- YouTube content drives top-of-funnel brand awareness and product discovery
- Blog posts + ingredient/concern pages are natural companion content for YouTube videos
- **YouTube channel:** https://www.youtube.com/@emartbd.official
- **Action (content strategy):** When Emart publishes YouTube videos about products/ingredients, publish a matching blog post linking to the relevant product and category pages
- This creates a signal loop: YouTube → website → purchase
- **Action (schema):** Add VideoObject JSON-LD to blog posts that embed YouTube videos
- **Not a code change** — content workflow decision for owner

---

## TASK 5 — SSL Commerz Integration Plan

**Why:** bKash and Nagad cover mobile money users. COD covers cash. SSL Commerz adds Visa/Mastercard card payments — important for urban BD customers and for Google/Meta Shopping where card payment is expected.

**Architecture:**
- SSLCommerz sandbox: test at `https://sandbox.sslcommerz.com`
- Production: `https://securepay.sslcommerz.com`
- Integration point: `/api/checkout` in `apps/web/src/app/api/checkout/`
- Mobile: add SSLCommerz option in BFF `/api/mobile/payment` or new `/api/mobile/payment/sslcommerz`

**Steps:**
1. Get SSLCommerz merchant account credentials (owner provides)
2. Add env vars: `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_LIVE`
3. Implement payment initiation endpoint: POST to SSLCommerz with order total + metadata
4. Implement IPN (Instant Payment Notification) handler: `/api/payment/sslcommerz/ipn`
5. Implement success/fail/cancel redirects
6. Update WooCommerce order status on successful payment
7. Test in sandbox with SSLCommerz test cards
8. Deploy behind feature flag initially

**Do NOT change:** checkout flow logic, COD/bKash/Nagad, order creation flow. Add SSLCommerz as an additional option only.

---

## WORKSPACE STATE (verify before starting)

```
Local:  /root/emart-platform
VPS:    /var/www/emart-platform
Git:    origin/main — check git log --oneline -5 before working
Freeze: structural/nav only until 2026-07-03 — content, data, new features OK
```

**Running jobs (do not interrupt):**
- `emart-meta-gen` (PM2 #19) — filling product meta descriptions, ~2,600 remaining
- `emart-presence` (PM2 #2) — WebSocket server
- `emartweb` (PM2 #10) — Next.js frontend

**Key files:**
- `workspace/TASKS.md` — task board
- `workspace/SEO_MASTER.md` — SEO rules
- `workspace/DEV_MASTER.md` — stack version locks (DO NOT UPDATE major versions)
- `apps/web/.agent-memory/MEMORY.md` — durable project memory
- `workspace/humanizer/face-cleansers/` — current humanizer (active)

**Security reminder:**
- Live BFF key: `key_id 39` in `.env.local` as `WOO_CONSUMER_KEY`
- Never commit `.env.local`
- Never expose WC keys in mobile bundle
- Never `git add -A` on VPS without reviewing staged list

---

## After Each Task

1. Update `workspace/TASKS.md`
2. Append to `apps/web/SESSION-LOG.md`
3. Follow deploy sequence: Local build → commit → rsync → VPS build → pm2 restart → smoke test → push
