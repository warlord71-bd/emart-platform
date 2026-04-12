# Phase 1: SEO Foundation Implementation

**Goal:** Add schema markup, sitemap, robots.txt, and meta tags to achieve Lighthouse SEO 80+

**Estimated time:** 2-3 hours  
**Context budget:** ~30-40% (moderate)

---

## Pre-Phase Checklist

Before starting, verify:
```bash
cd /var/www/emart-platform/apps/web
npm run build  # Must succeed
git status     # Should be clean
pm2 list       # emartweb should be online
```

---

## Task 1: Add Organization & WebSite Schema (app/layout.tsx)

**Current state:** View the file first
```bash
cat app/layout.tsx
```

**What to add:** Inside the `<body>` tag, before `{children}`, add two schema blocks:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "E-Mart BD",
      "url": "https://e-mart.com.bd",
      "logo": "https://e-mart.com.bd/logo.png",
      "sameAs": [
        "https://www.facebook.com/emartbd",
        "https://www.instagram.com/emartbd"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+880-1XXX-XXXXXX",
        "contactType": "Customer Service",
        "areaServed": "BD",
        "availableLanguage": ["en", "bn"]
      }
    })
  }}
/>

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": "https://e-mart.com.bd",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://e-mart.com.bd/shop?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    })
  }}
/>
```

**Verify:**
```bash
npm run build
curl http://localhost:3000/ | grep '"@type":"Organization"'
```

---

## Task 2: Add Product Schema (app/product/[slug]/page.tsx)

**Current state:** View the file first
```bash
cat app/product/[slug]/page.tsx | head -50
```

**What to add:** Create a helper function and add schema script in the component:

```tsx
// Helper function (add near top of file)
function generateProductSchema(product: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.[0]?.src || "",
    "description": product.short_description || product.description?.replace(/<[^>]*>/g, ''),
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": product.brands?.[0] || "E-Mart BD"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://e-mart.com.bd/product/${product.slug}`,
      "priceCurrency": "BDT",
      "price": product.price,
      "availability": product.stock_status === 'instock' 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "priceValidUntil": new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
    },
    ...(product.average_rating > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.average_rating,
        "reviewCount": product.rating_count
      }
    })
  };
}

// In the component JSX, before main content:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(generateProductSchema(product))
  }}
/>
```

**Verify:**
```bash
npm run build
curl http://localhost:3000/product/cosrx-snail-mucin | grep '"@type":"Product"'
```

---

## Task 3: Create Sitemap (app/sitemap.ts)

**Create new file:** `app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://e-mart.com.bd';
  
  // Fetch products from WooCommerce
  const productsRes = await fetch(
    `${process.env.NEXT_PUBLIC_WC_API_URL}/products?per_page=100&status=publish`,
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
        ).toString('base64')}`
      }
    }
  );
  const products = await productsRes.json();
  
  // Fetch categories
  const categoriesRes = await fetch(
    `${process.env.NEXT_PUBLIC_WC_API_URL}/products/categories?per_page=100`,
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
        ).toString('base64')}`
      }
    }
  );
  const categories = await categoriesRes.json();

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/korean-beauty`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
  ];

  // Product pages
  const productPages = products.map((p: any) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: new Date(p.date_modified),
    changeFrequency: 'weekly' as const,
    priority: 0.8
  }));

  // Category pages
  const categoryPages = categories.map((c: any) => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}
```

**Verify:**
```bash
npm run build
curl http://localhost:3000/sitemap.xml | head -40
# Should show XML with <url> entries
```

---

## Task 4: Create Robots.txt (app/robots.ts)

**Create new file:** `app/robots.ts`

```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/checkout/', '/account/'],
    },
    sitemap: 'https://e-mart.com.bd/sitemap.xml',
  };
}
```

**Verify:**
```bash
npm run build
curl http://localhost:3000/robots.txt
# Should show User-agent, Allow, Disallow, Sitemap
```

---

## Task 5: Add Meta Tags (Multiple Files)

### 5a. Home Page (app/page.tsx)

```typescript
export const metadata = {
  title: 'E-Mart BD - Authentic Korean & Japanese Beauty Products in Bangladesh',
  description: 'Buy authentic Korean skincare and Japanese cosmetics online in Bangladesh. COSRX, Maybelline, Missha. Free delivery above ৳1000. Cash on delivery available.',
  keywords: 'korean beauty bangladesh, k-beauty dhaka, cosrx bangladesh, japanese skincare, authentic beauty products',
  openGraph: {
    title: 'E-Mart BD - Korean Beauty Products',
    description: 'Authentic K-beauty and J-beauty in Bangladesh',
    url: 'https://e-mart.com.bd',
    type: 'website',
    images: [{ url: 'https://e-mart.com.bd/og-image.jpg' }],
  },
};
```

### 5b. Product Page (app/product/[slug]/page.tsx)

```typescript
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await fetchProduct(params.slug);
  
  return {
    title: `${product.name} - Buy Online in Bangladesh | E-Mart BD`,
    description: product.short_description || `Buy ${product.name} from E-Mart BD. Authentic Korean & Japanese beauty products. Free delivery above ৳1000.`,
    keywords: `${product.name}, buy ${product.name} bangladesh, korean beauty, e-mart bd`,
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: [{ url: product.images[0]?.src || '' }],
      url: `https://e-mart.com.bd/product/${product.slug}`,
      type: 'product.item',
    },
    alternates: {
      canonical: `https://e-mart.com.bd/product/${product.slug}`
    }
  };
}
```

**Verify:**
```bash
npm run build
curl -s http://localhost:3000/ | grep '<meta name="description"'
curl -s http://localhost:3000/product/cosrx-snail-mucin | grep '<meta property="og:title"'
```

---

## Phase 1 Verification Checklist

Run ALL these commands. ALL must pass before proceeding.

```bash
# 1. Build succeeds
npm run build
# ✓ Must show: Compiled successfully

# 2. Schema present
curl http://localhost:3000/ | grep '"@type":"Organization"' && echo "✓ Organization schema OK"
curl http://localhost:3000/product/cosrx-snail-mucin | grep '"@type":"Product"' && echo "✓ Product schema OK"

# 3. Sitemap accessible
curl http://localhost:3000/sitemap.xml | head -30 && echo "✓ Sitemap OK"

# 4. Robots.txt accessible
curl http://localhost:3000/robots.txt | grep "Sitemap" && echo "✓ Robots.txt OK"

# 5. Meta tags present
curl -s http://localhost:3000/ | grep '<meta name="description"' && echo "✓ Meta tags OK"

# 6. Lighthouse SEO (local)
npx lighthouse http://localhost:3000 --only-categories=seo --quiet
# Target: SEO score 80+
```

**If ANY fail:**
1. Review the error message
2. Fix the issue
3. Run `npm run build` again
4. Re-run verification

**If ALL pass:**
```bash
git add .
git commit -m "feat: Phase 1 complete - SEO foundation (schema, sitemap, robots, meta)"
git push
```

---

## Success Criteria

✅ Organization schema visible in page source  
✅ Product schema with price, availability, rating  
✅ Sitemap contains 220+ URLs (products + categories + static pages)  
✅ Robots.txt references sitemap  
✅ All pages have meta description and title  
✅ Build completes without errors  
✅ Lighthouse SEO score 80+  

**Expected outcome:** SEO score improvement from baseline ~72 to **80-82**

---

## Next Steps

After Phase 1 passes:
1. Test on live server: `pm2 restart emartweb`
2. Verify via IP: `curl http://5.189.188.229/sitemap.xml`
3. Proceed to Phase 2 (UI Enhancement) with a fresh Claude Code session
