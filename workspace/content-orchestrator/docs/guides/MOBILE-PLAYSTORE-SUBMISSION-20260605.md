# Emart Mobile Play Store Audit + Submission Guide

Last updated: 2026-06-05

## Current Build Status

- App: `Emart Skincare Bangladesh` (slug: `emart-bd`, package: `com.emartbd.app`)
- Expo SDK: `52.0.0`
- App version: `1.1.1` (versionCode `24` — EAS remote auto-incremented)
- Android target SDK: `35`
- EAS account: `warlord71`
- **Latest build:** `5334f731-8d74-4b46-ab76-d034095d3127` — finished 2026-06-05 14:53 UTC
- **Submitted to:** Play Store internal track (draft) — submission `d7f519d6-f099-49c3-bcb8-89bad79c75b4`
- **Service account:** `emart-play-service-account@emart-2923b.iam.gserviceaccount.com` (granted Play Console access)

## Policy URLs

All live and indexed:

| Policy | URL |
|--------|-----|
| Privacy Policy | `https://e-mart.com.bd/privacy-policy` |
| Terms & Conditions | `https://e-mart.com.bd/terms-conditions` |
| Return & Refund Policy | `https://e-mart.com.bd/return-policy` |
| Shipping Policy | `https://e-mart.com.bd/shipping-policy` |

All four are in the web sitemap and linked from the web footer.  
All four are accessible from the mobile app Settings screen (Policies section).

## Key Policies Summary

### Shipping
- Dhaka: ৳70, 1–2 business days
- Outside Dhaka: ৳100, 3–5 business days
- Free shipping on orders over ৳3,000
- COD available nationwide

### Returns
- 7-day return window from delivery date
- Product must be new, unused, unopened, original seal/packaging intact
- ৳100 restocking fee
- Return courier cost: customer responsibility
- Refund processed within 5 days of inspection

### Payments
- Cash on Delivery (COD)
- bKash
- Nagad
- No card/SSLCommerz (do not claim in listing)

## Policy Audit

### Pass

- Target SDK is API 35, matching Google Play's current Android 15 submission requirement.
- No direct WooCommerce keys, consumer secrets, or direct `/wp-json/wc/v3` calls shipped in the app.
- Permissions are minimal: `NOTIFICATIONS` and `VIBRATE` only.
- No camera, microphone, contacts, location, SMS, call log, files/photos, or background permissions.
- Privacy Policy URL live: `https://e-mart.com.bd/privacy-policy`
- Terms & Conditions URL live: `https://e-mart.com.bd/terms-conditions`
- Return Policy URL live: `https://e-mart.com.bd/return-policy`
- Shipping Policy URL live: `https://e-mart.com.bd/shipping-policy`
- In-app Settings has a dedicated **Policies** section linking all four policies.
- In-app Support FAQ updated with accurate delivery, return, payment, and authenticity info.
- No ads SDK detected.
- No in-app purchases detected.
- No health/medical claims or regulated healthcare functionality in the app UI.
- Brand name in app footer corrected to "Emart Skincare Bangladesh".

### Needs Owner/Console Action

- Complete Play Console Data safety accurately. Do not mark "no data collected".
- Complete Content rating questionnaire.
- Complete Target audience: select adults/general shoppers, not children-directed.
- Add App access instructions if review needs login or checkout testing.
- Upload screenshots and feature graphic.
- Ensure Play Console privacy policy field is exactly `https://e-mart.com.bd/privacy-policy`.

### Risk Notes

- Push notifications are optional, but the app can request notification permission and can create/store an Expo push token locally. If backend token upload is not implemented yet, disclose only what is actually collected/transmitted. If future backend token upload is added, update Data safety.
- Google Sign-In fetches Google profile info: name, email, avatar. Disclose this as personal info collected for account management.
- Checkout collects name, email, phone, delivery address, order contents, and payment method/transaction ID for order processing.
- Local AsyncStorage stores cart, orders, language, auth session token, and notification preferences on device.

## Data Safety Answers

Use this as the Play Console Data safety form baseline.

### Data Collection

Answer: **Yes, this app collects user data.**

Data types:

- Personal info
  - Name
  - Email address
  - Phone number
  - Address
- Financial info
  - User payment info: only bKash/Nagad transaction ID/payment method notes; card details are not collected in the mobile app.
- App activity
  - App interactions / in-app search/cart/order interactions, if logged through server order APIs.
- App info and performance
  - Crash logs/diagnostics only if Expo/Play collects them for release diagnostics.
- Device or other IDs
  - Push notification token only if notification token is sent to backend in a future release. Current code stores token locally and has TODO for backend upload.

Purposes:

- Account management
- App functionality
- Order processing and delivery
- Customer support
- Fraud prevention/security
- Developer communications
- Marketing/promotions only for optional notifications or consented communications

### Data Sharing

Answer conservatively:

- Shared with courier/logistics partners: name, phone, delivery address, order details for delivery.
- Shared with payment processors/mobile payment partners where needed for payment/order support.
- Shared with Google only where user uses Google Sign-In or Play/Expo platform services.

Do **not** claim "no sharing" if courier/payment fulfillment data is used operationally.

### Security Practices

- Data encrypted in transit: **Yes**. App uses HTTPS API base URL.
- Users can request data deletion: **Yes**, via support email in privacy policy. Add/confirm a direct account deletion process in support workflow.
- Data is optional? Mixed:
  - Account login optional for browsing.
  - Checkout data required for order placement.
  - Notifications optional.

## Play Store Listing Copy

### App Name

`Emart Skincare Bangladesh`

If the Play Console app title limit blocks this, use:

`Emart BD`

### Short Description

`Authentic Korean & global beauty. COD available.`

### Long Description

Emart Skincare Bangladesh is an online beauty shopping app for authentic Korean, Japanese, and global skincare products in Bangladesh.

Shop popular skincare, sunscreen, cleansers, serums, moisturisers, masks, hair care, and beauty essentials with prices in BDT. Browse products, search by category, add items to cart, and place orders from your phone.

Why shop with Emart:

- Authentic Korean, Japanese, and global beauty products
- Cash on Delivery available
- bKash and Nagad merchant payment support
- Delivery across Bangladesh
- Product details, prices, images, ratings, and reviews
- English and Bangla app experience
- Customer support by phone, email, and WhatsApp

Emart is operated by HG Corporation in Dhaka, Bangladesh. We focus on genuine products, practical skincare shopping, and local support for Bangladeshi customers.

Privacy Policy: https://e-mart.com.bd/privacy-policy

### Bengali Short Description

`অথেনটিক কোরিয়ান ও গ্লোবাল বিউটি। ক্যাশ অন ডেলিভারি।`

### Bengali Long Description

Emart Skincare Bangladesh অ্যাপে আপনি অথেনটিক কোরিয়ান, জাপানি ও গ্লোবাল স্কিনকেয়ার পণ্য কিনতে পারবেন।

স্কিনকেয়ার, সানস্ক্রিন, ক্লেনজার, সিরাম, ময়েশ্চারাইজার, মাস্ক, হেয়ার কেয়ার ও বিউটি পণ্য ব্রাউজ করুন, কার্টে যোগ করুন এবং মোবাইল থেকেই অর্ডার করুন।

সুবিধা:

- অথেনটিক কোরিয়ান, জাপানি ও গ্লোবাল বিউটি পণ্য
- ক্যাশ অন ডেলিভারি
- বিকাশ ও নগদ merchant payment
- বাংলাদেশজুড়ে ডেলিভারি
- পণ্যের ছবি, দাম, বিবরণ, রেটিং ও রিভিউ
- বাংলা ও ইংরেজি সাপোর্ট
- ফোন, ইমেইল ও WhatsApp কাস্টমার সাপোর্ট

Privacy Policy: https://e-mart.com.bd/privacy-policy

## Store Assets Needed

- App icon: already configured, 1024x1024.
- Adaptive icon: already configured, 1024x1024.
- Feature graphic: **needed**, 1024x500 PNG/JPG.
- Phone screenshots: at least 2, recommended 6-8.
  - Home
  - Product listing/search
  - Product detail
  - Cart
  - Checkout
  - Order success
  - Account/support
- Optional 7-inch/10-inch tablet screenshots: only if targeting tablets. Current iOS tablet off; Android no tablet exclusion. Phone screenshots are enough for mobile-first release.

## Play Console — Current Status & Next Steps

### Already Done
- [x] Service account `emart-play-service-account@emart-2923b.iam.gserviceaccount.com` linked and granted Play Console access
- [x] Build `5334f731` (v1.1.1 versionCode 24) submitted to internal track as draft
- [x] EAS managed signing (Keystore `T2SEJYQ7h4`) confirmed

### Owner Must Complete in Play Console

**1. App content declarations** (Policy and programs > App content):
- Privacy Policy URL: `https://e-mart.com.bd/privacy-policy`
- Ads: No
- App access: if Google reviewer needs to test login/checkout, add test credentials or note "guest browsing available; checkout requires account registration"
- Data safety: fill using the answers in the Data Safety Answers section below
- Content rating: Shopping / ecommerce / beauty — no gambling, no violence, no adult content
- Target audience: Adults / general audience — NOT children-directed
- COVID/health: No
- Financial features: No (COD/bKash/Nagad are order payment methods, not financial products)

**2. Store listing** (Store presence > Main store listing):
- App name: `Emart Skincare Bangladesh`
- Short description: `Authentic Korean & global beauty. COD available.`
- Long description: use the copy in the "Play Store Listing Copy" section below
- Contact email: `support@e-mart.com.bd`
- Website: `https://e-mart.com.bd`
- Upload: feature graphic (1024×500), phone screenshots (6–8 recommended)

**3. Promote to production when ready**:
- Play Console > Internal testing > find the v1.1.1 draft release
- Roll out to internal testers first (add tester emails or Google Group)
- After internal QA passes, create a new production release (or promote)

### Future Builds (Next Version)

When the current settings fixes (Policy section in Settings, corrected FAQ, brand name fix) are ready to submit, bump to v1.1.2:

```bash
# In /root/emart-platform/apps/mobile
# EAS auto-increments versionCode; just update version string:
# app.json: "version": "1.1.2"
# Then:
cd /root/emart-platform/apps/mobile
eas build --platform android --profile production --non-interactive
# After build finishes:
eas submit --platform android --id <new-build-id> --non-interactive
```

### Internal Test Checklist

- [ ] Install from Play Store internal testing link
- [ ] Browse home, categories, product list
- [ ] Open product detail, add to cart
- [ ] Checkout COD (test order with owner approval)
- [ ] bKash/Nagad transaction ID entry
- [ ] Login, register, order history
- [ ] Review form requires sign-in
- [ ] Settings > Policies > all 4 links open correct pages
- [ ] Support screen WhatsApp, call, email all work
- [ ] Language toggle EN/BN works

## Fast Pre-Submission Commands

Run before building:

```bash
cd /root/emart-platform/apps/mobile
npx expo-doctor
npx expo export --platform android --output-dir /tmp/emart-mobile-export
```

Current known result on 2026-06-05:

- `expo-doctor`: 18/18 passed
- Android export: passed

## Do Not Submit If

- Privacy Policy URL returns 404 or does not mention Emart/HG Corporation.
- Data safety says "no data collected".
- App listing says Card/SSLCommerz before SSLCommerz is implemented.
- App contains WooCommerce keys or direct Woo REST credentials.
- Target SDK drops below 35.
- Internal testing build crashes on launch.
