# Emart Agent Entry Point

This short entry point applies to Codex, Claude, DeepSeek, GPT-style agents, and humans working on Emart Skincare Bangladesh. Keep it short; detailed policy lives in `CLAUDE.md`.

Read these in order:

1. `/root/CLAUDE.md` - universal VPS deploy law for every project.
2. `/root/emart-platform/CLAUDE.md` - Emart-specific context.
3. `/root/emart-platform/apps/web/.agent-memory/MEMORY.md` - shared durable agent memory.
4. `/var/www/emart-platform/apps/web/SESSION-LOG.md` - latest live-session history.

Current brand names:

- Short: Emart
- Full: Emart Skincare Bangladesh
- Live domain/URL: e-mart.com.bd

App surfaces:

- Web: `apps/web` Next.js frontend for public storefront and SEO.
- Mobile: `apps/mobile` Expo app (`emart-bd`) using secure API/BFF routes.
- Backend/source: WooCommerce/WordPress private data source only.

Core rule: edit on Local, sync to VPS, verify live, then push Repo last.

Default workflow:

- Use small scoped tasks only.
- Check local `git status` before editing.
- Verify first, then edit locally.
- Inspect only relevant files; avoid whole-repo scans unless required.
- Use low-token workflow: targeted `rg`/search, open only needed files, short summaries.
- Keep changes minimal and scoped to the requested task.

Protected areas:

- Do not redesign homepage, header, footer, layout, global UI, mobile navigation, checkout flow, or app UX unless explicitly asked.
- Do not touch checkout, cart, payment, order, customer, stock, price, Woo mutations, database logic, auth, app signing, app versioning, or release config unless explicitly asked.
- Do not expose WooCommerce/WordPress backend publicly.
- Do not add secrets, hardcoded API keys, or new dependencies without asking.
- For SEO, SKU, WooCommerce data, product data, schema, sitemap, redirects, Merchant Center, or mobile release work, do a read-only audit first.

Data and app invariants:

- Price: `regular_price` / stroked price is main/original price; sale/offer price is separate.
- SEO/schema: public SEO work belongs in `apps/web` Next.js frontend, not WordPress theme templates.
- Mobile: never ship WooCommerce consumer keys, secrets, tokens, or private API credentials inside the app bundle.
- Mobile app should use approved secure API/BFF routes, not direct public Woo credentials.

Brand and SEO wording:

- Current public wording wins over old notes: user-provided live evidence or live/search-facing output, then `apps/web` metadata/source, then current brand docs.
- Treat old decisions and session logs as historical unless confirmed current.
- Never infer the current tagline from one old note; exact-search old wording before and after edits, and ask if sources conflict.

SEO rules:

- Optimize for Google first, but do not build Google-only SEO hacks.
- Public SEO surface is `apps/web` Next.js only; never expose or canonicalize to WooCommerce/WordPress backend URLs.
- Every indexable public page must have one clean canonical URL based on `https://e-mart.com.bd`.
- Dynamic sitemap must use current live Woo/API data, include only canonical public URLs, and use accurate `lastmod` when available.
- `robots.ts` / `robots.txt` must allow important public pages and block private, duplicate, checkout, account, cart, order, internal API, and backend-like routes.
- Product pages should output Product + Offer JSON-LD from real visible product data: name, image, sku when valid, price, currency BDT, availability, brand, url, and reviews only when real.
- Product schema, page text, Merchant Center feed, and WooCommerce product data must match; never fake price, stock, rating, review, brand, or availability.
- Product pages should be the canonical public product truth for Google/Search/AI: visible facts, metadata, schema, Merchant Center data, and Woo source data must agree.
- Merchant listing schema is only for pages where customers can buy directly from Emart.
- Category, brand, concern, ingredient, and routine pages should be indexable only with useful unique content and real product listings.
- Empty, duplicate, thin, parameter, filter, sort, and search-result pages should be noindex or canonicalized/redirected as appropriate.
- For Google AI Overviews / AI Mode, use normal SEO: helpful text, internal links, crawlability, structured data matching visible content, fast mobile UX, and updated Merchant Center/Business Profile data.
- Do not add special AI markup, `llms.txt` promises, or hidden AI content.
- Use IndexNow only for added, updated, or deleted canonical URLs on supported engines; it supports discovery but does not guarantee indexing or ranking.
- Do not submit old unchanged URL dumps to IndexNow.
- For SEO changes, verify when possible with Search Console/Rich Results, Merchant Center, Bing Webmaster Tools, sitemap fetch, robots check, and live curl/status tests.
- No agent may promise Google ranking #1/#2 or guaranteed indexing; report measurable technical improvements only.

Relevant checks:

- Web: `cd apps/web && npm run lint` / `npm run build` / `npm run check:all` when needed.
- Mobile: `cd apps/mobile && npm run start` or Expo/Android checks only when mobile files changed.

Deploy law for web:

Local edit → local build/check → commit → rsync to VPS → VPS build → restart `emartweb` only if needed → live smoke test → push `origin main` last.

Deploy safety:

- Before web deploy, check git status on VPS.
- Do not overwrite dirty VPS files without reviewing.
- Never use `git reset --hard` on VPS without explicit approval.
- Never restart `emartweb` from unknown source state.
- If hotfix happened on VPS, reverse-sync VPS → Local before commit.
- Push `origin main` only after live smoke test passes.
- No live UI change or PM2 restart is needed for documentation-only tasks.

Mobile release safety:

- Do not build, submit, bump `versionCode` / `versionName`, change signing, or publish to Play Console unless explicitly asked.
- Before mobile release changes, audit `app.json`, `eas.json`, and Android config, then report first.
- Production mobile release must not use debug keystore.
- Do not change Android/iOS permissions, notifications, auth, checkout, or payment behavior without explicit approval.

Task prompt format:

```text
Task:
Context:
Scope:
Done when:
Output:
```

Final answer: max 8 lines unless the user asks for details. Include changed files, summary, checks run, deploy needed or not, and risk.

Workspace hygiene:

- Durable memory goes only in `apps/web/.agent-memory/`.
- Current user-review reports go in `workspace/audit/active/`.
- Completed generated reports go in `workspace/audit/archive/` or `/root/.attic-YYYY-MM-DD/emart-platform/`.
- Reusable scripts go in `workspace/scripts/active/`; one-off historical scripts go in `workspace/scripts/archive/`.
- Do not create root-level CSV, XLSX, JSON, or scratch Markdown files.
