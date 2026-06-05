# Mobile M0 Release Readiness — 2026-06-05

Codex continued Mobile M0 on 2026-06-05.

Completed locally:

- Preserved existing dirty release bump/assets: `apps/mobile` version `1.1.1`, Android `versionCode` `21`, updated adaptive/notification icons.
- Removed stale direct WooCommerce credential guidance from `apps/mobile/.env.example`; mobile config is BFF-only via `EXPO_PUBLIC_EMART_API_URL`.
- Verified no WooCommerce consumer keys, secrets, direct `/wp-json/wc/v3`, or IP Woo URLs remain in `apps/mobile`.
- Aligned mobile displayed shipping policy with live Woo policy: Dhaka fee `৳70`, free shipping threshold `৳3,000`.
- Fixed mobile checkout success handling to accept the live `/api/checkout` response shape (`{ success, order }`), so local order history and success navigation receive the Woo order ID.
- Added explicit `apps/mobile/metro.config.js` extending `expo/metro-config`; `npx expo-doctor` now passes 18/18 checks.

Verification:

- `npm ls --depth=0` passed in `apps/mobile`.
- `npx expo config --type public` passed and showed Expo SDK 52, app version `1.1.1`, Android package `com.emartbd.app`, versionCode `21`, target/compile SDK 35.
- Live BFF checks: `/api/mobile/products?per_page=1` 200, `/api/mobile/categories?per_page=1` 200, `/api/checkout` OPTIONS 204.
- `npx expo export --platform android --output-dir /tmp/emart-mobile-export` passed.
- `npx expo-doctor` passed 18/18 after adding Metro config.

Open gaps:

- `/api/mobile/cart` and `/api/mobile/payment` return 404 on live; current app uses local cart state and manual bKash/Nagad transaction IDs through `/api/checkout`.
- No real device checkout test was run in this session.
- No EAS production AAB or Play Store upload was run; needs EAS/Play credentials and preferably a device smoke test first.
