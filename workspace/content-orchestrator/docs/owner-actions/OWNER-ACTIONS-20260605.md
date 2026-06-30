# Owner Actions — 2026-06-05
**These 4 tasks cannot be automated from the VPS. Each takes under 5 minutes.**

---

## Action 1 — MailPoet: Post-Purchase Review Email
**Why:** Review form is now open to all logged-in users. This email is the trigger that drives reviews → aggregateRating → star ratings in Google.

**Where:** WordPress Admin → MailPoet → Automations → Create new

**Steps:**
1. Go to `https://e-mart.com.bd/wp-admin/admin.php?page=mailpoet-automation`
2. Click **Create automation**
3. Choose **WooCommerce** trigger → **Order status changed**
4. Set: Status changes **to Completed**
5. Add a **Delay** step → **3 days**
6. Add a **Send email** step with:
   - Subject: `How was your order? Leave a quick review 🌟`
   - Body: See template below
7. **Activate** the automation

**Email body template:**
```
Hi {{subscriber.firstname | default:"there"}},

Thank you for your recent order from Emart Skincare Bangladesh!

We'd love to hear what you think. Your honest review helps other skincare lovers in Bangladesh choose the right products.

It takes just 2 minutes — and verified buyers get a special "Verified Purchase" badge on their review.

👉 Leave a review: {{woocommerce.order.product.url}}

Thank you for shopping with us!
— Emart Skincare Bangladesh
```

---

## Action 2 — Meta Events Manager: Verify CAPI Purchase
**Why:** If CAPI is broken, Meta's ad optimization algorithm is flying blind. This is a 2-minute check.

**Steps:**
1. Place a small **COD test order** at `https://e-mart.com.bd/checkout`
2. Go to `https://business.facebook.com/events_manager`
3. Select your pixel → **Test Events** tab
4. Look for a **Purchase** event with:
   - `value` > 0 (not null, not zero)
   - `currency` = BDT
5. If Purchase event shows correctly → ✅ done
6. If missing or `value = 0` → report back for fix

**Also check** that `InitiateCheckout` now appears when you visit the checkout page (we just added this today — it should show in Test Events within a few minutes).

---

## Action 3 — GSC: URL Inspection for Top Pages
**Why:** Sitemap was resubmitted today. Now request indexing for the specific pages getting impressions.

**Where:** `https://search.google.com/search-console/` → URL Inspection

**Pages to request indexing on (one by one, paste URL → Enter → Request Indexing):**
1. `https://e-mart.com.bd/shop/cerave-skin-renewing-night-cream-48g`
2. `https://e-mart.com.bd/shop/skin1004-madagascar-centella-tone-brightening-capsule-ampoule-100ml`
3. `https://e-mart.com.bd/shop/medicube-deep-vita-c-capsule-cream-55ml`
4. `https://e-mart.com.bd/shop/cosrx-advanced-snail-mucin-96-power-essence-100ml`
5. `https://e-mart.com.bd/shop/innisfree-super-volcanic-pore-clay-mask-100ml`
6. `https://e-mart.com.bd/ingredients/bha-salicylic-acid` (redirect just fixed)
7. `https://e-mart.com.bd/category/sunscreen` (new copy added today)

---

## Action 4 — Cloudflare: Cache Rule for /shop and /category
**Why:** Nginx sets `s-maxage` correctly but Cloudflare needs its own rule to cache at the edge.

**Where:** Cloudflare Dashboard → e-mart.com.bd → Caching → Cache Rules → Create rule

**Rule 1:**
- Name: `Shop and Category Pages`
- When: URI Path matches `/shop/*` OR URI Path matches `/category/*`
- Then: Cache eligibility → **Eligible for cache**
- Edge TTL: **1 hour** (override origin)
- Browser TTL: Use origin headers

**Rule 2:**
- Name: `Static Assets`
- Already handled by Nginx (immutable for `/_next/static/`)

---

## Status after your actions

| Action | Expected result |
|---|---|
| MailPoet review email | Reviews start arriving 3 days after completed orders |
| Meta CAPI verified | Ad optimization algorithm has full funnel data |
| GSC URL indexing | Targeted pages recrawled within 1-3 days |
| Cloudflare cache | TTFB drops for catalog pages at edge |
