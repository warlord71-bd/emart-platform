---
description: Protected commerce data — never touch without explicit user request
---

NEVER touch without explicit user request:
- `checkout` · `cart` · `payment` · `order` · `customer data` · `stock` · `price` · `WooCommerce DB`

WC API key: key_id `50` (live BFF, write-gated by `woo-api-fix.php`). Key_ids 2/3/26/32 are revoked; key_id 34 is historical.
Never commit secrets. Keep `.env.local` on VPS/runtime only. Never `git add -A` without reviewing staged files.
