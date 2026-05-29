# CLAUDE.md — Emart Platform · Atomic Design Upgrade (Home · PDP · URL/SEO)

You are operating on a **live, revenue-generating** storefront. Your prime directive: **upgrade the code into a proper atomic design system WITHOUT changing one pixel that customers currently see.** Structure changes; output does not. Any visual/UX change is separate, opt-in, and feature-flagged OFF.

---

## 0\. NON-NEGOTIABLES (read before touching anything)

1. **Never break the live build or the customer-facing UI.** If a change risks the rendered output, it goes behind a flag (see Phase B) — it does not ship by default.  
2. **Branch only.** Work on `feat/atomic-refactor`. Never commit to `main` or restart production PM2 without explicit instruction. Customers stay on the current build.  
3. **Phase A is a pure refactor.** Extracted components MUST render byte-identical HTML/CSS to the current page. Prove it (diff the rendered output / snapshot before & after).  
4. **Phase B (any visual or UX change) is gated** behind `NEXT_PUBLIC_FF_*` flags, default `false`. Nothing customer-visible changes until the owner flips a flag for themselves.  
5. **Do NOT strip BD conversion elements** — discount badges, brand chips, origin chips, category tags, "sold / left" counters, WhatsApp order, COD/trust signals all stay. BD market ≠ Western minimalism. Removing these is a regression, not a cleanup.  
6. **Discover before you assume.** Read the actual repo structure first; do not invent file paths or component names that don't exist. Map, then refactor.  
7. **Check the memory kit first:** read `/srv/hgc/memory-kit/DECISIONS.md` and `FILES-LOCKED.md`. Do not re-run completed work or touch locked files.  
8. **Execute Phase A end-to-end without stopping for clarification. Report final status only.** For Phase B, implement behind flags and report how to enable — do not enable.

---

## 1\. STACK & PATHS (verify against the repo; correct me if reality differs)

- Next.js 15 app: `/var/www/emart-platform/apps/web` — PM2 process `emartweb`, port 3000\.  
- Backend: WordPress \+ WooCommerce. WC API is **server-side only** (`WOO_CONSUMER_*`, `WOO_INTERNAL_URL=http://127.0.0.1`). Never expose with `NEXT_PUBLIC_`.  
- GraphQL: `wp-graphql` \+ `wp-graphql-rank-math` — used as a **DATA SOURCE ONLY**.  
- Repo: `warlord71-bd/emart-platform`.

---

## 2\. DESIGN TOKENS — Midnight Blossom (single source of truth)

The live theme is `data-theme="midnight-blossom"` / `mb-shell`. Tokens, not raw hex. If a tokens file exists, use it; if values are scattered, consolidate into one source that compiles to CSS variables (web). Mirror the same names into the RN app theme (`colors.js`).

- Colors: navy `#1B1B2F` (ink / dark surface), pink `#E8739E` (accent / soft CTA), gold `#D4A248` (premium / rating), success `#27AE60`, sale `#E74C3C`.  
- Fonts: **Playfair Display** (display/headings), **Jost** (body/UI), **Hind Siliguri** (Bangla). One display \+ one body \+ one Bangla face. No new fonts.  
- Spacing: 8-pt grid (multiples of 4/8). Radius scale consistent.  
- **Rule:** components consume tokens only — never hardcode a hex or px-off-grid value.

---

## 3\. ATOMIC HIERARCHY (target structure)

Reorganize into Brad-Frost layers. Co-locate styles, type the props, token-driven.

- **atoms/** — Button, Chip, Badge, Price, Rating, Input, Icon, Skeleton  
- **molecules/** — ProductCard, CategoryTile, StatTile, TrustItem, FilterChipRow, Breadcrumb, QtyStepper, FaqItem, ReviewCard  
- **organisms/** — Header, FooterMega, BottomTabBar, HamburgerDrawer, Hero, ProductGrid, PdpGallery, PdpBuyPanel, StickyBuyBar, TabbedDetails, ReviewsBlock, FaqBlock  
- **templates/** — HomeTemplate, PdpTemplate, CategoryTemplate  
- **pages/** — wire templates to data (Woo/GraphQL)

Each component: single responsibility, props-driven, no data fetching inside atoms/molecules (fetch at page/template level and pass down).

---

## 4\. THE 8 STANDARDS TO ENFORCE

1. Tokens, not stray values (see §2).  
2. One display \+ one body \+ one Bangla font; fixed type scale.  
3. 8-pt spacing grid everywhere.  
4. Atomic components, reused (one `ProductCard` for Home, Category, PDP "related").  
5. ≤ 2 control rows before content; one global nav \= bottom tab (thumb zone); contextual filters in a bottom sheet, not stacked sticky rows.  
6. Accessibility: tap targets ≥ 44px, text contrast ≥ 4.5:1 (WCAG 2.1 AA), semantic landmarks, one `<h1>` per page.  
7. BD conversion (PDP): above the mobile fold, in order — authenticity → price clarity → stock/delivery \+ COD → social proof. WhatsApp order is a first-class CTA.  
8. SEO/LLM legibility: semantic HTML \+ JSON-LD (Product, Offer, BreadcrumbList, FAQPage).

---

## 5\. URL / SEO RULES (do not regress organic traffic)

- **Do not change existing URLs or slugs.** Preserve all routes and the working `301` redirects on `/product-category/*`. Refactor renders the SAME paths.  
- **Canonicals are hardcoded in Next.js**: `/shop/[slug]` and `/category/[slug]`. **Ignore** Rank Math's `jsonLd.raw`, `canonicalUrl`, and brand outputs — they emit the wrong routes and the wrong brand ("eMart Skincare \- Bangladesh"). Never render them.  
- **Brand identity (locked):** short name **Emart**; full name **Emart Skincare Bangladesh**. Forbidden variants: EMart, E-Mart, E-Mart BD, eMart. Separator is the pipe `|`. Title formats — product: `{Name} Price in Bangladesh | Emart`; category: `{Name} — Shop Online | Emart Skincare Bangladesh`.  
- JSON-LD on PDP: Product \+ Offer (BDT price, availability, **per-brand country of origin — not defaulted to Korea**), BreadcrumbList, and FAQPage from the on-page FAQ.  
- **Landmine:** never use `og:type "product.item"` — it causes Next.js runtime errors.  
- Sitemap: submit via GSC manually; the curl ping is deprecated, do not use it.  
- `/bn` hreflang routes are a FUTURE phase — scaffold the hook but do not build now.

---

## 6\. PHASE A — Atomic refactor (safe, execute now, no visual change)

Scope: **Home, PDP, and the URL/SEO/metadata layer.** For each page:

1. Map current markup → identify repeated patterns → name the atoms/molecules/organisms.  
2. Extract them into the §3 structure, token-driven, typed props.  
3. Replace inline markup with the new components.  
4. **Verify identical render:** build passes (`pnpm build` or repo equivalent), `tsc` clean, no new console errors, and the rendered DOM/visual matches the previous build (snapshot or screenshot diff). If it differs, it's a bug — fix before reporting done.  
5. Centralize SEO metadata/JSON-LD into a single helper consumed by the page (§5), still producing the same canonical URLs and titles.

Phase A ships nothing visual — it only makes the code atomic and the SEO layer clean.

---

## 7\. PHASE B — Standards improvements (feature-flagged, default OFF)

Implement but DO NOT enable. Each behind its own `NEXT_PUBLIC_FF_*` flag:

- `FF_PDP_STICKY_BUYBAR` — sticky mobile buy bar (price \+ Add to Cart \+ WhatsApp).  
- `FF_NAV_CONSOLIDATE` — ≤2 control rows \+ bottom-sheet filters (the `/categories` pattern).  
- `FF_TRUST_BILINGUAL` — Bangla microcopy under PDP trust signals.

Owner enables a flag for themselves on staging, watches scroll-depth-to-product, add-to-cart rate, and bounce, then decides. Rollback \= flip the flag off.

---

## 8\. FOUR-SURFACE RULE (for any nav/UI/menu change in Phase B)

Any navigation, menu, or UI change must be applied to **all four surfaces in the same change**, never one in isolation:

1. Desktop mega-menu, 2\. Mobile-web hamburger drawer (accordion),  
2. Bottom tab bar, 4\. Mobile app (React Native / Expo, mirroring the same tokens/components).

---

## 9\. VERIFICATION & ROLLBACK

- Build \+ typecheck pass; no new runtime/console errors.  
- Visual parity confirmed for Phase A (before/after).  
- Lighthouse: LCP/CLS not worse than baseline.  
- Rollback path: Phase A → `git revert` the branch; Phase B → flip the flag to `false`.

---

## 10\. FINAL REPORT (only output when done)

Report concisely:

- Components created (by layer) and pages refactored.  
- Proof of visual parity for Phase A.  
- Flags added (names) and exact command/env to enable each on staging.  
- Anything that needed a deviation from this spec, and why.  
- One-line rollback instruction.

Prefer Node.js for any scripts. Do not narrate progress mid-task; finish, verify, then report.  
