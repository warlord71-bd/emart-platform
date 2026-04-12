---
name: E-Mart BD - Korean Beauty eCommerce Platform
tech_stack: Next.js 14+, TypeScript, WooCommerce REST API, Tailwind CSS
---

# E-Mart BD Project Context

## What This Project Is

Bangladesh-based eCommerce platform selling authentic Korean & Japanese beauty products (COSRX, Maybelline, Missha). Next.js 14+ frontend with WooCommerce backend. Target audience: Bangladeshi women, 18-35, mobile-first.

## Critical Constraints

1. **Never commit API credentials** - WooCommerce keys stay in .env.local only
2. **Mobile-first** - 70% of traffic is mobile, test responsive layouts always
3. **BDT currency** - Always use ৳ symbol, not $ or USD
4. **Bilingual support** - English primary, Bangla secondary (UI labels, product descriptions)
5. **Payment methods** - bKash, Nagad (merchant), Cash on Delivery only
6. **Build must pass** - Run `npm run build` after every file change batch

## Code Style Rules

### Next.js Patterns
- **Metadata API** - Use `generateMetadata()` for dynamic pages, export `metadata` for static
- **Server Components** - Default to Server Components, use `"use client"` only when needed (forms, interactivity)
- **Image Optimization** - Always use `next/image`, never `<img>` tag
- **API Routes** - Keep WooCommerce logic in `/app/api/wc/` for reusability

### TypeScript
- Prefer `interface` over `type` for object shapes
- Use `unknown` instead of `any` when type is truly unknown
- Export types from `types/woocommerce.ts` for WooCommerce entities

### Tailwind CSS
- Use design system tokens from `tailwind.config.ts`
- Primary colors: `navy-950` (#1B1B2F), `pink-400` (#E8739E), `gold-500` (#D4A248)
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

### Component Organization
```
components/
├── ui/           # Reusable primitives (Button, Card, Input)
├── layout/       # Header, Footer, Breadcrumbs
├── product/      # ProductCard, ProductGallery, AddToCart
└── checkout/     # CartItem, PaymentMethod, OrderSummary
```

## WooCommerce API Patterns

### Fetching Products
```typescript
// Always include authorization header
const response = await fetch(`${process.env.NEXT_PUBLIC_WC_API_URL}/products`, {
  headers: {
    'Authorization': `Basic ${Buffer.from(
      `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
    ).toString('base64')}`
  },
  next: { revalidate: 3600 } // Cache for 1 hour
});
```

### Error Handling
```typescript
try {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`WC API error: ${data.message || response.statusText}`);
  }
  return data;
} catch (error) {
  console.error('WooCommerce fetch failed:', error);
  return null; // Return null, show fallback UI
}
```

## File Modification Workflow

1. **Read before edit** - Always view the file first with `cat` or `view`
2. **Show changes** - Explain what you're changing and why
3. **Incremental edits** - One logical change per file edit
4. **Test immediately** - After editing, run relevant test command
5. **Commit atomically** - Commit each feature/fix separately with clear message

## Git Commit Messages

```
feat: add JSON-LD schema for product pages
fix: breadcrumb navigation on mobile
perf: optimize product image loading
seo: add sitemap generation for categories
refactor: extract WooCommerce API helper
```

## Testing Commands

```bash
# Build check (ALWAYS run after changes)
npm run build

# Lint check
npm run lint

# Type check
npm run type-check

# Local dev server
npm run dev

# Production build + start
npm run build && npm run start
```

## Checkpoint Strategy

Create checkpoints before:
- Schema markup additions (Phase 1)
- Navigation changes (Phase 2)
- New page creation (Phase 3)
- Deployment (Phase 4)

Use: `/checkpoint "Phase 1 complete: Schema added"`

## Common Pitfalls to Avoid

❌ **Don't** fetch WooCommerce data on every render (use caching)  
❌ **Don't** hardcode URLs (use `process.env.NEXT_PUBLIC_SITE_URL`)  
❌ **Don't** skip mobile testing (70% of users are mobile)  
❌ **Don't** use client components for static content  
❌ **Don't** forget to handle out-of-stock products gracefully  

✅ **Do** cache WooCommerce responses with `next: { revalidate: X }`  
✅ **Do** test Lighthouse scores after major changes  
✅ **Do** handle API errors with fallback UI  
✅ **Do** use TypeScript types for all WooCommerce entities  
✅ **Do** verify schema markup with Google Rich Results Test  

## Phase Execution Rules

When implementing the SEO roadmap:
1. Complete one phase fully before starting next
2. Run verification commands after each phase
3. Commit after each phase passes
4. If verification fails, fix before proceeding
5. Use `/compact` if context exceeds 50%

## Questions to Ask Before Starting

- "Should I read the current file first?" → Always YES
- "Should I test this change?" → Always YES after file edits
- "Should I commit now?" → YES after each phase passes
- "Is context getting full?" → Check with `/context`, compact if >50%

## Emergency Rollback

If something breaks critically:
```bash
git log --oneline -10  # Find last working commit
git reset --hard <commit-hash>
npm run build
pm2 restart emartweb
```

## Success Criteria

Every change must:
1. Build successfully (`npm run build` exits 0)
2. Pass TypeScript checks (no TS errors)
3. Maintain or improve Lighthouse scores
4. Work on mobile (test with Chrome DevTools)
5. Handle WooCommerce API errors gracefully

## Bangladesh-Specific Context

- **Delivery zones**: Inside Dhaka (1-2 days, ৳60), Outside Dhaka (3-5 days, ৳120)
- **Free delivery threshold**: ৳1000
- **Target keywords**: "korean skincare bangladesh", "cosrx dhaka", "authentic kbeauty bd"
- **Competitor**: skincarebd.com, beautykhoj.com
- **Payment culture**: 60% Cash on Delivery, 30% bKash, 10% Nagad

---

**Updated:** April 2026  
**Maintainer:** E-Mart BD Dev Team
