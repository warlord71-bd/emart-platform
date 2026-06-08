# Public Site URL Guard — 2026-06-08

`apps/web/src/lib/siteUrl.ts` intentionally rejects local hosts from `NEXT_PUBLIC_SITE_URL`.

If `NEXT_PUBLIC_SITE_URL` is accidentally set to `http://localhost:3000`, `http://127.0.0.1`, `http://0.0.0.0`, or `http://[::1]`, public URL generation falls back to `https://e-mart.com.bd`.

This protects SEO-facing canonical, Open Graph, sitemap/feed, and schema URL helpers from leaking localhost into rendered metadata during local or misconfigured builds.

Deployed in `1167bf4 fix(seo): prevent localhost public URLs`.

Follow-up on 2026-06-08: middleware cleanup redirects must also build destinations from the public domain. Google click URLs with `?srsltid=...` previously stripped the param using an internal cloned URL and could emit `Location: http://localhost:3000/...`. Use explicit public URL construction for middleware redirects, and keep cleanup redirect responses `Cache-Control: no-store, max-age=0` so Cloudflare does not cache tracking-param redirects.
