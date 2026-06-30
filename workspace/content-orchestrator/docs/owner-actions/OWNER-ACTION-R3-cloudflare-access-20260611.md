# Owner Action — R3: Cloudflare Access for wp-login.php (2026-06-11)

**Why:** Audit finding H-06 — `https://e-mart.com.bd/wp-login.php` returns HTTP 200 publicly,
exposing the WordPress backend (the headless architecture says backend should never be
public-facing) and giving brute-force attackers a target. Decision made: gate it with
**Cloudflare Access** (Zero Trust email one-time-code) rather than an IP allowlist, so
access works from any location/IP without risk of self-lockout.

**Cannot be automated from the VPS** — this is configured entirely in the Cloudflare
dashboard (no Cloudflare API token is available on this server). Takes ~5 minutes.

---

## Steps

1. Go to **Cloudflare dashboard → Zero Trust** (left sidebar; if Zero Trust isn't set up
   yet, it'll prompt a one-time team-name setup — any name works, e.g. `emart-bd`).
2. **Access → Applications → Add an application → Self-hosted**.
3. Configure:
   - **Application name:** `Emart WP Admin`
   - **Session duration:** 24h (or your preference)
   - **Domain:** `e-mart.com.bd`
   - **Path:** `/wp-login.php*` — the trailing `*` matters because WordPress often adds
     query strings such as `?redirect_to=...&reauth=1`
   - Add a **second** path/application for `/wp-admin/*` so the whole admin area is
     covered, not just the login page.
4. **Add policy**:
   - **Policy name:** `Owner only`
   - **Action:** Allow
   - **Include rule:** Emails → add `hgc.bd71@gmail.com` (and any other admin emails
     that need wp-admin access)
5. **Save**.

## Verify

1. Open an incognito/private browser window.
2. Visit `https://e-mart.com.bd/wp-login.php`.
3. Expect: a **Cloudflare Access** page asking for your email, then a one-time code
   sent to that inbox. Enter the code → you land on the normal WordPress login form.
4. Confirm `https://e-mart.com.bd/wp-admin/` behaves the same.
5. Confirm the **storefront** (`https://e-mart.com.bd/`, `/shop`, a product page) is
   **unaffected** — Access only applies to the configured paths.
6. Confirm any automation that posts to WordPress (MailPoet webhooks, REST API calls
   from Next.js BFF, GMC/GLA plugin syncs) still works — these typically use
   `/wp-json/*`, which is **not** in scope for this Access rule and stays as-is
   (already 403-blocked from outside per existing config).

## If something goes wrong

- If you get locked out of wp-admin entirely: in the Cloudflare dashboard, go to
  **Zero Trust → Access → Applications**, open `Emart WP Admin`, and either fix the
  policy email or temporarily delete the application — this immediately removes the
  gate and restores normal (public) access to `/wp-login.php`.

## After this is done

Reply to Claude/Codex with "R3 done" (or update `workspace/TASKS.md` directly) so the
audit remediation tracker can be closed out and a final live recheck of
`curl -sI https://e-mart.com.bd/wp-login.php` can confirm it now returns a Cloudflare
Access challenge instead of a bare 200.

## 2026-06-11 recheck note

Owner attempted setup once, but live recheck still reached WordPress directly:
`/wp-login.php` returned HTTP 200 and `/wp-admin/` redirected to
`/wp-login.php?redirect_to=...&reauth=1`. If this happens again, check that the Access
application is enabled for domain `e-mart.com.bd` and has both paths exactly:
`/wp-login.php*` and `/wp-admin/*`.

Second attempt note: a broad/single-hostname Access setup protected `/wp-login.php` and
`/wp-admin/`, but also protected `/`, `/shop`, and PDPs, blocking the public storefront.
Owner deleted it and storefront recovered. Do not leave any Access application enabled
if it challenges the public storefront.

## Third attempt — corrected procedure (2026-06-11)

**Likely root cause of the second attempt**: an Access application for domain
`e-mart.com.bd` was created with the **Path field left blank or set to `/`**. Cloudflare
Access treats a blank/`/` path as "match everything under this hostname" — so it gated
the entire storefront, not just the two intended paths.

**Do this, in order:**

1. **Audit first**: Zero Trust → Access → Applications. List every app for
   `e-mart.com.bd`. Delete/disable any app whose Path is blank, `/`, or `/*` — there
   may be an orphaned app left over from the second attempt even though the owner
   "deleted it" (check for a duplicate). Confirm zero apps remain for this domain
   before proceeding.
2. **Create App A** — Self-hosted, name `Emart WP Login`:
   - Application Domain: `e-mart.com.bd`
   - **Path** (separate field from Domain — do not type the path into the Domain box):
     `/wp-login.php*`
3. **Create App B** — Self-hosted, name `Emart WP Admin`:
   - Application Domain: `e-mart.com.bd`
   - **Path**: `/wp-admin/*`
4. Both apps: policy `Owner only`, Action Allow, Include Emails → `hgc.bd71@gmail.com`.
   Do **not** create a third app or an app with no path.
5. **Verify in this exact order** (incognito):
   1. `https://e-mart.com.bd/` → 200, no Access challenge
   2. `https://e-mart.com.bd/shop` → 200, no Access challenge
   3. any PDP → 200, no Access challenge
   4. `https://e-mart.com.bd/wp-login.php` → Cloudflare Access email challenge
   5. `https://e-mart.com.bd/wp-admin/` → Cloudflare Access email challenge

If steps 1-3 show a challenge, there is still a stray catch-all app for `e-mart.com.bd`
with a blank/`/` path — find and fix/delete it before re-testing.
