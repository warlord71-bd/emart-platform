# Mobile ADB + Logic Pass — 2026-06-05

Codex installed `android-tools-adb` on the VPS and started the ADB daemon successfully.

Device status:

- `adb devices -l` shows no devices.
- `lsusb` shows only the VPS root hub.
- A phone connected to the user's local laptop is not visible to this remote VPS unless USB is forwarded or ADB-over-network is configured from that laptop.

Logic fixes completed:

- Product detail screen no longer conditionally returns before all hooks run when route params are missing.
- Mobile payment copy no longer advertises Card/SSLCommerz before that integration exists.
- Mobile review calls now send the stored JWT Bearer token.
- Next `/api/product-reviews` now accepts mobile JWT Bearer tokens by validating through WordPress `/wp-json/emart/v1/customer/me`, while keeping web cookie/NextAuth review auth intact.
- Guest mobile review UI now prompts sign-in instead of showing name/email fields that the backend does not accept.

Verification:

- Local `apps/web` build passed.
- VPS `apps/web` build passed, `emartweb` restarted.
- Live smoke: homepage 200, `/api/mobile/products?per_page=1` 200, `/api/product-reviews?productId=93315&includeReviews=0` 200, guest review POST 401.
- Mobile Android Expo export passed after the fixes.
- `npx expo-doctor` passed 18/18.
