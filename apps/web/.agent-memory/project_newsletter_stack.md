---
name: Newsletter + MailPoet subscribe stack
description: How newsletter signup flows end-to-end — which endpoint, which form id, which mu-plugin, why captcha is off
type: project
originSessionId: 897a3d49-6d5e-4da0-8802-309f793d8a47
---
Newsletter signup flows from the Next.js footer tab to MailPoet via a deliberately custom path.

- **UI:** Email tab in `WhatsappSignupSection` (`apps/web/src/components/home/HomepageSections.tsx`), POST to `/api/newsletter/subscribe`.
- **Next.js route:** `apps/web/src/app/api/newsletter/subscribe/route.ts` — thin proxy, forwards `{email}` as JSON to `${NEXT_PUBLIC_SITE_URL}/wp-json/emart/v1/subscribe`.
- **WP mu-plugin:** `/var/www/wordpress/wp-content/mu-plugins/emart-newsletter.php` — public REST route that calls `\MailPoet\Subscribers\SubscriberActions::subscribe(['email' => $email], [3])` directly. Segment 3 = "Newsletter mailing list" (default MailPoet list).
- **MailPoet form id 1** ("Emart Newsletter Signup") also lands subscribers into segment 3 and is exposed as shortcode `[mailpoet_form id=1]`. Created 2026-04-24 via CLI.
- **Double opt-in is on**, so new subscribers land `status=unconfirmed` and get a confirmation email through the Brevo SMTP configured in MailPoet settings (`mta.host=smtp-relay.brevo.com:587`, `login=Emart.bdofficial@gmail.com`).

**Why:** MailPoet's public admin-ajax subscribe endpoint rejects server-to-server submits because (a) its honeypot expects an obfuscated field name only the rendered form JS knows, and (b) built-in captcha requires a session tied to the rendered form. The mu-plugin hits a lower-level PHP API that skips both. `captcha.type` is also set to `disabled` in MailPoet settings as part of this workaround.

**How to apply:**
- If the signup flow breaks, first curl-test the three layers in sequence: `POST /api/newsletter/subscribe` → `POST /wp-json/emart/v1/subscribe` → inspect `wp4h_mailpoet_subscribers` in DB.
- Don't "fix" the Next route to hit admin-ajax directly — it won't work.
- If spam becomes a problem: rate-limit the Next route (IP-based in edge middleware) and/or add a honeypot field in the Email tab form. Don't re-enable MailPoet's built-in captcha without also reverting the proxy path — they're incompatible.
- Other MailPoet automations and the WC transactional takeover (newsletter id=4, `use_mailpoet_editor=1`) are unrelated to this signup flow — they fire on their own WooCommerce/subscription triggers.
