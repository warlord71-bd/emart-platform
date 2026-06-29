---
name: project_wc_key_rotation_20260523
description: WooCommerce API key rotation and write-protection hardening — M1 completed 2026-05-25
metadata: 
  node_type: memory
  type: project
  originSessionId: af57b72d-7d82-49ee-8e6d-b9b8d3bd6b5a
---

## M1: Key rotation completed 2026-05-23 by Codex

Revoked: key_ids 4-15, 16, 19, 32 (`Mobile App Legacy Compatibility`). Survivors key_ids 2, 3, 26 confirmed already revoked per Claude audit 2026-05-25.

## WC write-protection hardening — completed 2026-05-25 by Claude

- New BFF API key created: key_id `34` (`Emart BFF Server 2026-05-25`, read_write, user 2648)
- `.env.local` on VPS updated with new key
- `woo-api-fix.php` mu-plugin rewritten: GET/HEAD bypass kept (reads open), POST/PUT/PATCH/DELETE require valid WC API key
- Verified: reads 200 no key, writes 401 no key, writes 200 with BFF key, live smoke 200

## Current live key state (2026-05-25)

Historical state then: key_id `33` (OpenClaw Agent, read-only) and key_id `34` (new BFF, read_write).

Current verified state (2026-06-29): live runtime BFF key is key_id `50` (`Emart BFF Live auto-recovered 2026-06-07 17:45`, read_write, user 2648). `.env.local` key suffix matches Woo `truncated_key=246ba71`; internal HTTPS Woo API smoke returned `HTTP 200`. Key_id 34 is historical, not current runtime.
All others revoked. n8n, OpenClaw, medimart can no longer write to WooCommerce without a dedicated key.

**Why:** Exposed keys from old mobile builds were a security risk; write access needed to be gated.
**How to apply:** Do not revert `woo-api-fix.php` to `__return_true`. Any new service needing WC write access must create its own key_id.

Report: `workspace/audit/active/wc-key-rotation-20260523.md`
