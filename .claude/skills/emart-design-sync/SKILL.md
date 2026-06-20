---
name: emart-design-sync
description: Build standalone HTML previews of Emart UI components and sync them to a claude.ai Design System project via DesignSync.
---

This skill generates self-contained HTML preview files for Emart's React/Tailwind components and pushes them to a claude.ai Design System project.

## Workflow

### 1. Build preview HTMLs
For each component group, generate a standalone HTML file in `apps/web/design-system/` that:
- Includes Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com"></script>`)
- Renders the component in all its visual states/variants using static HTML + Tailwind classes
- Matches the actual Tailwind config (colors, fonts, spacing) from the project
- Includes a first-line comment: `<!-- @dsCard group="GroupName" -->`
- Shows mobile (390px) and desktop (1280px) variants side by side where relevant

### 2. Component groups to sync

| Group | Components | Preview file |
|---|---|---|
| **Layout** | Header, Footer, Navigation, WhatsAppFloat | `layout.html` |
| **Home** | HeroCarousel, CategoriesGrid, BrandsShowcase, FlashSaleSection, ShopByConcern, SocialChannelGrid, WhatsappSignup | `home.html` |
| **Product** | ProductCard, ProductImage, ProductInfo, StickyATC, DetailsTabs, ReviewsSection, RelatedProducts, ProductFaq | `product.html` |
| **Catalog** | ProductListGrid, CatalogFilters, SortControl, NumberedPagination, BrandsCarousel | `catalog.html` |
| **Shared** | Button, Badge, StockBar, Breadcrumbs, CategoryChips, TrustStrip | `shared.html` |
| **Chat** | ChatWidget, ChatInput, ChatMessages, ChatProductCard | `chat.html` |
| **Cart** | CartDrawer | `cart.html` |

### 3. Push to claude.ai
Use the DesignSync tool:
1. `list_projects` — find or create the "Emart Design System" project
2. `list_files` — check what's already there
3. `finalize_plan` — declare writes for changed preview files only
4. `write_files` — push the HTML files using `localPath`

### 4. Incremental updates
When the user changes a specific component, only rebuild and push the affected group's preview HTML — don't regenerate everything.

## Design tokens (from tailwind.config.ts — source of truth)
- Accent (primary action): #9f1239 (rose) — `accent`, `primary-500`, `emart-pink`
- Accent deep (hover): #83122f — `accent-deep`
- Accent soft (bg tint): #FCE7F0 — `accent-soft`
- Ink (text/primary button bg): #111111 — `ink`
- Ink secondary: #2A2A2A — `ink-2`
- Muted (secondary text): #6B6B6B — `muted`
- Brass (brand eyebrow / stars): #d4a248 — `brass`
- Success: #2E7D5B / Warning: #C88A2E / Danger: #B23B3B
- Background: #FAFAF8 `bg` / #F3F1EC `bg-alt` / #EDEAE3 `bg-stone`
- Hairline (borders): rgba(17,17,17,0.10)
- Fonts: DM Sans (body), Playfair Display (display/headings), Hind Siliguri (Bengali), JetBrains Mono (prices/code)
- Border radius: rounded-xl (cards), rounded-[999px] / `pill` (buttons/chips), rounded-[4px] (badges)
- Shadows: `card` (subtle), `pop` (modals)
- Mobile-first breakpoints: sm:640 md:768 lg:1024 xl:1280

## Tailwind CDN note
Preview HTMLs use `cdn.tailwindcss.com` with a `tailwind.config` script block that mirrors the project's `apps/web/tailwind.config.ts` custom colors, fonts, radii, and shadows. This is intentional — DesignSync previews are standalone HTML, not part of the Next.js build. Always copy token values from `tailwind.config.ts`, never invent them. If `tailwind.config.ts` changes, regenerate affected previews.
