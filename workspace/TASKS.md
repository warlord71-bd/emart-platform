# Emart Task Board — Single Priority List

Last updated: 2026-05-23 — **6-WEEK STABILITY FREEZE ACTIVE (2026-05-22 → 2026-07-03)**
Detail → `workspace/SEO_MASTER.md` · `workspace/DEV_MASTER.md`
Only mark `[x]` when fully deployed + verified on live VPS.

**Freeze rule:** Before any code change ask: "does this change a URL, redirect, sitemap, or navigation?" If yes — frozen until 2026-07-03. Content, data, images, and copy edits are always safe.

**Emergency override:** Site down / checkout broken / security vuln / 500 on revenue pages → fix immediately, minimal scope, stop.

---

## PRIORITY LIST

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 1 | **Security: Rotate WooCommerce API keys** | Codex | 🟡 Follow-up | Targeted exposed/stale keys revoked 2026-05-23; BFF smoke OK; review unexpected survivors key_ids 26, 2, 3 · `workspace/audit/active/wc-key-rotation-20260523.md` |
| 2 | **Commit workspace doc changes** | Claude | ✅ Done | `07983f4` |
| 3 | **INCI data — fetch + apply top 100** | Claude | ✅ Done | 73 products updated via INCIDecoder + WP-CLI; 3 mismatches skipped; 24 not found · `inci_apply_log.json` |
| 4 | **M8: Homepage "Korean" phrase** | Claude | ✅ Done | Homepage already has 29× "Korean" from product data — gap was JS-render artifact in scan; no edit needed |
| 5 | **M7: Sunscreen category copy** | Claude | ✅ Done | 4 editorial H2 blocks live · `8a62b09` · UV terms + broad-spectrum + reapply coverage |
| 6 | **M7: Internal links audit** | Claude | ✅ Done | `/concerns/sunscreen` → `/category/sunscreen` CTA added (`eace623`); blog post 93374 links added via WP-CLI; nav already passing |
| 7 | **pa_concern apply** | Owner → Codex | 🔴 Blocked | Owner reviews `workspace/audit/active/pa-concern-manual-review-20260521-174247.csv` → marks APPROVE/SKIP → Codex applies · 1,161 products missing concern |
| 8 | **pa_origin 17-gap** | Owner → Codex | 🔴 Blocked | Owner decides origin for combo/tool products → Codex applies · `workspace/audit/active/pa-origin-gap-review-20260521-175120.csv` |
| 9 | **Price normalize** | Codex | 🟡 Open | Fix 0.00 / 1.00 placeholder prices across catalog |
| 10 | **Healthy Place brand correction** | Owner → Codex | 🟡 Blocked | Owner confirms correct brand → Codex applies |
| 11 | **Product images — 16 missing** | Owner → Codex | 🟡 Blocked | Owner uploads 16 images → Codex assigns · `workspace/audit/active/products-need-real-image.csv` |
| 12 | **M9: Image count audit** | Claude | ✅ Done | 60 imgs homepage / 29 sunscreen — rendering artifact confirmed, no gap |
| 13 | **W3: ProductCard LCP priority** | Claude | ✅ Done | `prioritizeFirst` prop; Best sellers first card `priority={true}` · `a558af1` |
| 14 | **W4: ReviewsSection refetch** | Claude | ✅ Done | `cache:'no-store'` removed · `a558af1` |
| 15 | **U1: Tailwind token fix** | Claude | ✅ Done | `card` + `canvas` added to Tailwind colors · `a558af1` |
| 16 | **Blog auto-revalidation** | Claude | ✅ Done | `/api/revalidate?path=/blog` added to `blog_generator.py` |
| 17 | **W2: aria-hidden focusability** | Claude | ✅ Done | Already compliant — no duplicate aria-hidden rails in current code |
| 18 | **U6: ARIA tab semantics** | Claude | ✅ Done | `role=tablist/tab/tabpanel` + `aria-selected` + `aria-controls` · `a558af1` |
| 19 | **GSC — stale URL cleanup + indexing** | Owner | 🟡 Blocked | Remove stale/junk URLs, request indexing for canonical URLs |
| 20 | **Merchant Center — reprocess gla_2611** | Owner | 🟡 Blocked | GMC dashboard action |
| 21 | **GA4 DebugView — 404 event check** | Owner | 🟡 Blocked | Visit a 404 URL → confirm `headless_migration_404` fires |
| 22 | **M2: Audit mobile API calls** | Codex | 🟡 Open | Verify no remaining direct `wp-json` calls in mobile app |
| 23 | **M3: Mobile checkout smoke test** | Codex | 🟡 Open | COD + bKash/Nagad end-to-end |
| 24 | **M4: Push notifications** | Codex | 🟡 Open | Confirm FCM/APNs live |

---

## AFTER FREEZE — from 2026-07-03 (read GSC data first, then prioritise)

| # | Task | Notes |
|---|---|---|
| 25 | **M6: Ingredient/concern education refinement** | Add FAQPage JSON-LD; improve internal links; start with niacinamide, hyaluronic-acid, acne-blemish-care, dryness-hydration · SEO_MASTER M6 |
| 26 | **M4: Product FAQ regeneration** | Re-generate for top 200 SKUs; top-10 review gate before bulk · SEO_MASTER M4 |
| 27 | **L1: Cloudflare cache rules** | Dashboard-only — /shop and /category/* CDN rule |
| 28 | **L3: /brands page size** | 785KB — lazy-load logos or paginate |
| 29 | **L4: H2s on /brands, /sale, /new-arrivals** | Minor structure gap |
| 30 | **O1: Origins editorial content** | High-value countries beyond South Korea/Japan/USA — owner picks list first |
| 31 | **O2: Product comparison pages** | Owner provides 20–30 curated pairs first |
| 32 | **O3: "Best [X] in Bangladesh" listicles** | Owner approves topic list first |
| 33 | **O4: Skin-type pages** | Owner confirms whether to build — 4 pages max |
| 34 | **L5: Google-Extended bot policy** | Business decision |
| 35 | **L6: Blog content volume** | Content calendar decision — sustained effort |
| 36 | **Contabo migration** | Highest-risk — needs dedicated window |

---

## FUTURE / MONTH 2+

- Ingredient glossary (50 entries)
- MediMart launch
- HG Corp hub site
- iOS Apple Developer account
- Telegram bot (second instance decision)

---

## FROZEN — do not touch until 2026-07-03

| Item | Why |
|---|---|
| New redirects in `next.config.js` | 72 rules already in — let Google process |
| URL / slug changes | Resets crawl signals |
| Sitemap structure changes | 4,221 URLs indexed — let Googlebot settle |
| Category slug renaming | Creates new 301s |
| Navigation restructuring | Consistency is a ranking signal |
| New page types (O2 compare, O3 listicles, O4 skin-type) | New URL patterns restart indexing cycle |
| U3–U5, U7: Component splits | Medium risk, zero SEO value right now |
| W6/L2: Critical CSS inlining | Build complexity risk |
| W7: Category OG image fallback | Category page deploy — defer |

---

## PERMANENT DO NOT TOUCH

- Checkout / cart / payment / order logic
- `_sku`, `_price`, `_stock_quantity` WooCommerce meta
- `apps/web/src/app/api/checkout`
- Customer data / order history

---

## AGENT RULES

- **Claude Code** → `apps/web` (Next.js, TypeScript, SEO, content) — no direct WP DB writes
- **Codex** → `apps/mobile`, PHP mu-plugins, WP DB mutations — no Next.js UI files
- **Both** → Read `/root/CLAUDE.md` + `/root/emart-platform/CLAUDE.md` at session start
- **Dry-run rule** → Never bulk-mutate WooCommerce data without a dry-run CSV reviewed by owner first
- **SEO detail** → `workspace/SEO_MASTER.md`
- **Dev detail** → `workspace/DEV_MASTER.md`
