# E-Mart BD - Complete SEO & UI Implementation Prompt for Claude Code

## Context
You are implementing a comprehensive SEO and UI improvement roadmap for **e-mart.com.bd**, a Bangladesh-based eCommerce platform selling Korean and Japanese beauty products. The site is built with Next.js 14+ (App Router), TypeScript, and WooCommerce REST API backend.

**Live Server:** 5.189.188.229  
**Domain:** e-mart.com.bd (will point to server after implementation)  
**App Directory:** /var/www/emart-platform/apps/web  
**Process Manager:** PM2 (process name: emartweb)  
**Target:** Lighthouse SEO 95+, Performance 90+, top 5 Google rankings for commercial queries

---

## Implementation Phases

Execute these 4 phases in strict order. Each phase must pass verification before moving to the next.

---

## PHASE 1: SEO FOUNDATION (Score: 72 → 82)

### 1A — Schema Markup (JSON-LD)

**Task:** Add structured data to all key templates for rich results eligibility.

**Files to modify:**
- `app/layout.tsx` — Organization + WebSite schema
- `app/page.tsx` — Home page with BreadcrumbList
- `app/shop/page.tsx` — Shop page BreadcrumbList
- `app/product/[slug]/page.tsx` — Product schema (name, image, price, availability, brand, review aggregates)
- `app/category/[slug]/page.tsx` — Category BreadcrumbList
- `app/korean-beauty/page.tsx` — Korean Beauty collection BreadcrumbList

**Schema Requirements:**
```typescript
// Organization Schema (app/layout.tsx)
{
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
    "telephone": "+880-XXXX-XXXXXX",
    "contactType": "Customer Service",
    "areaServed": "BD",
    "availableLanguage": ["en", "bn"]
  }
}

// WebSite Schema with SearchAction
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://e-mart.com.bd",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://e-mart.com.bd/shop?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}

// Product Schema (app/product/[slug]/page.tsx)
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "image": product.images[0]?.src,
  "description": product.short_description || product.description,
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
  "aggregateRating": product.average_rating > 0 ? {
    "@type": "AggregateRating",
    "ratingValue": product.average_rating,
    "reviewCount": product.rating_count
  } : undefined
}
```

**Placement:** Use Next.js `<script type="application/ld+json">` in each page component, inside dangerouslySetInnerHTML.

**Verification:**
```bash
# Test locally first
curl http://localhost:3000/ | grep -o '"@type":"Organization"'
curl http://localhost:3000/product/cosrx-snail-mucin | grep -o '"@type":"Product"'

# Rich Results Test (after deploy)
# Visit: https://search.google.com/test/rich-results
# Test URLs: homepage, 3 product pages, 2 category pages
```

---

### 1B — Sitemap Generation

**Task:** Create dynamic XML sitemap with proper priority and changefreq.

**File:** `app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://e-mart.com.bd';
  
  // Fetch products from WooCommerce API
  const productsRes = await fetch(`${process.env.NEXT_PUBLIC_WC_API_URL}/products?per_page=100&status=publish`, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64')}`
    }
  });
  const products = await productsRes.json();
  
  // Fetch categories
  const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_WC_API_URL}/products/categories?per_page=100`, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64')}`
    }
  });
  const categories = await categoriesRes.json();

  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'daily' },
    { url: `${baseUrl}/shop`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${baseUrl}/korean-beauty`, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${baseUrl}/about`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${baseUrl}/shipping`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${baseUrl}/returns`, priority: 0.5, changeFrequency: 'monthly' },
    { url: `${baseUrl}/authenticity`, priority: 0.5, changeFrequency: 'monthly' },
  ];

  const productPages = products.map((p: any) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: new Date(p.date_modified),
    priority: 0.8,
    changeFrequency: 'weekly' as const
  }));

  const categoryPages = categories.map((c: any) => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date(),
    priority: 0.7,
    changeFrequency: 'weekly' as const
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}
```

**Verification:**
```bash
curl https://e-mart.com.bd/sitemap.xml | head -50
# Should show XML with <url> entries, proper priorities, lastmod dates
```

---

### 1C — Robots.txt

**Task:** Create permissive robots.txt with sitemap reference.

**File:** `app/robots.ts`

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

**Verification:**
```bash
curl https://e-mart.com.bd/robots.txt
# Should show User-agent, Allow, Disallow, Sitemap
```

---

### 1D — Meta Tags (SEO Metadata)

**Task:** Add complete SEO metadata to all pages using Next.js metadata API.

**Files to modify:**
- `app/layout.tsx` — Root metadata
- `app/page.tsx` — Home page metadata
- `app/shop/page.tsx` — Shop metadata
- `app/product/[slug]/page.tsx` — Dynamic product metadata with Open Graph
- `app/category/[slug]/page.tsx` — Dynamic category metadata
- `app/korean-beauty/page.tsx` — Collection metadata

**Example (app/product/[slug]/page.tsx):**
```typescript
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await fetchProduct(params.slug);
  
  return {
    title: `${product.name} - Buy Online in Bangladesh | E-Mart BD`,
    description: product.short_description || `Buy ${product.name} from E-Mart BD. Authentic Korean & Japanese beauty products. Free delivery above ৳1000. Cash on delivery available.`,
    keywords: `${product.name}, buy ${product.name} bangladesh, korean beauty, japanese skincare, e-mart bd`,
    openGraph: {
      title: product.name,
      description: product.short_description,
      images: [{ url: product.images[0]?.src || '' }],
      url: `https://e-mart.com.bd/product/${product.slug}`,
      type: 'product.item',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.short_description,
      images: [product.images[0]?.src || ''],
    },
    alternates: {
      canonical: `https://e-mart.com.bd/product/${product.slug}`
    }
  };
}
```

**Verification:**
```bash
curl -s https://e-mart.com.bd/product/cosrx-snail-mucin | grep -o '<meta name="description".*>'
curl -s https://e-mart.com.bd/ | grep -o '<meta property="og:title".*>'
```

---

### 1E — Verification Checklist (Phase 1)

Run these tests **before** moving to Phase 2:

```bash
# 1. Build succeeds
npm run build
# Must show: ✓ Compiled successfully

# 2. Schema present
curl http://localhost:3000/ | grep '"@type":"Organization"'
curl http://localhost:3000/product/cosrx-snail-mucin | grep '"@type":"Product"'

# 3. Sitemap accessible
curl http://localhost:3000/sitemap.xml | head -30

# 4. Robots.txt accessible
curl http://localhost:3000/robots.txt

# 5. Meta tags present
curl -s http://localhost:3000/ | grep '<meta name="description"'

# 6. Lighthouse SEO check (local)
npx lighthouse http://localhost:3000 --only-categories=seo --view
# Target: SEO score 80+
```

**If all pass → commit and proceed to Phase 2.**

---

## PHASE 2: UI FIXES (Score: 82 → 88)

### 2A — Header Navigation Enhancement

**Task:** Add clear category navigation with visual hierarchy.

**File:** `components/Header.tsx`

**Requirements:**
- Main nav with: Shop | Korean Beauty | Categories | Brands | Sale | New Arrivals
- Category mega-menu on hover (Skincare, Makeup, Hair Care, Body Care)
- Mobile: hamburger menu with same structure
- Sticky header on scroll
- Search bar with autosuggest

**Code snippet (desktop nav):**
```tsx
<nav className="hidden md:flex items-center space-x-6">
  <Link href="/shop">Shop</Link>
  <Link href="/korean-beauty">Korean Beauty</Link>
  
  <div className="relative group">
    <button className="flex items-center">
      Categories <ChevronDown className="ml-1 w-4 h-4" />
    </button>
    <div className="absolute hidden group-hover:block bg-white shadow-lg rounded-lg p-4 top-full left-0 mt-2 w-64 z-50">
      <Link href="/category/skincare">Skincare</Link>
      <Link href="/category/makeup">Makeup</Link>
      <Link href="/category/hair-care">Hair Care</Link>
      <Link href="/category/body-care">Body Care</Link>
    </div>
  </div>
  
  <Link href="/brands">Brands</Link>
  <Link href="/sale">Sale</Link>
  <Link href="/new-arrivals">New Arrivals</Link>
</nav>
```

---

### 2B — Breadcrumbs

**Task:** Add breadcrumbs to all product and category pages.

**Component:** `components/Breadcrumbs.tsx`

```tsx
export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link href="/" className="hover:text-pink-500">Home</Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="w-4 h-4" />
          {item.href ? (
            <Link href={item.href} className="hover:text-pink-500">{item.label}</Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
```

**Usage in product page:**
```tsx
<Breadcrumbs items={[
  { label: 'Shop', href: '/shop' },
  { label: category.name, href: `/category/${category.slug}` },
  { label: product.name }
]} />
```

---

### 2C — Footer Trust Signals

**Task:** Add payment methods, delivery info, authenticity guarantee.

**File:** `components/Footer.tsx`

**Required sections:**
- Payment methods (bKash, Nagad, Cash on Delivery icons)
- "100% Authentic Products" badge
- "Free Delivery above ৳1000" badge
- Quick links (About, Shipping, Returns, Authenticity, Contact)
- Social media icons

---

### 2D — Mobile Responsiveness Audit

**Task:** Test and fix mobile layout issues.

**Pages to test:**
- Home (hero, featured products grid)
- Shop (filters sidebar → drawer on mobile)
- Product detail (image gallery, add to cart)
- Cart (item list, checkout button)
- Checkout (form fields, payment method selection)

**Tools:**
```bash
# Chrome DevTools mobile emulation
# Test breakpoints: 375px (iPhone SE), 390px (iPhone 12), 428px (iPhone 14 Pro Max)

# Lighthouse mobile audit
npx lighthouse http://localhost:3000 --preset=mobile --view
```

---

### 2E — Verification Checklist (Phase 2)

```bash
# 1. Navigation visible and functional
# Manual test: hover categories, click links

# 2. Breadcrumbs present
curl -s http://localhost:3000/product/cosrx-snail-mucin | grep -o 'breadcrumb'

# 3. Footer trust signals visible
curl -s http://localhost:3000/ | grep -o 'bKash\|Nagad\|100% Authentic'

# 4. Mobile layout no horizontal scroll
# Chrome DevTools → mobile view → no overflow

# 5. Lighthouse Performance + Accessibility
npx lighthouse http://localhost:3000 --only-categories=performance,accessibility --view
# Target: Performance 85+, Accessibility 95+
```

**If all pass → commit and proceed to Phase 3.**

---

## PHASE 3: NEW ORIGIN PAGES (Score: 88 → 91)

### 3A — About Page

**File:** `app/about/page.tsx`

**Content Requirements:**
- Company story (E-Mart BD founded to bring authentic K-beauty to Bangladesh)
- Mission statement (democratize access to premium Korean/Japanese skincare)
- Trust signals (authorized distributor, direct import)
- Team photo (optional)
- Metadata with keywords "about e-mart bd, korean beauty bangladesh, authentic skincare"

---

### 3B — Shipping Policy Page

**File:** `app/shipping/page.tsx`

**Content:**
- Inside Dhaka: 1-2 days, ৳60
- Outside Dhaka: 3-5 days, ৳120
- Free delivery above ৳1000
- Cash on Delivery available
- Order tracking link

---

### 3C — Returns & Refund Policy

**File:** `app/returns/page.tsx`

**Content:**
- 7-day return for unopened items
- Full refund or exchange
- Process: contact support, return shipping
- Damaged/defective items: replacement at no cost

---

### 3D — Authenticity Guarantee

**File:** `app/authenticity/page.tsx`

**Content:**
- 100% authentic products guarantee
- Direct import from Korea/Japan
- Authorized distributor certificates
- How to verify authenticity (batch codes, packaging)
- Anti-counterfeit commitment

---

### 3E — Contact Page

**File:** `app/contact/page.tsx`

**Content:**
- Contact form (name, email, phone, message)
- WhatsApp link (wa.me/880...)
- Email: support@e-mart.com.bd
- Phone: +880-XXXX-XXXXXX
- Address: [Your Dhaka address]
- Google Maps embed (optional)

---

### 3F — Verification Checklist (Phase 3)

```bash
# 1. All pages accessible
curl -I http://localhost:3000/about | grep "200 OK"
curl -I http://localhost:3000/shipping | grep "200 OK"
curl -I http://localhost:3000/returns | grep "200 OK"
curl -I http://localhost:3000/authenticity | grep "200 OK"
curl -I http://localhost:3000/contact | grep "200 OK"

# 2. Pages in sitemap
curl http://localhost:3000/sitemap.xml | grep -o '/about\|/shipping\|/returns\|/authenticity\|/contact'

# 3. Footer links updated
curl -s http://localhost:3000/ | grep -o 'href="/about"\|href="/shipping"'

# 4. Lighthouse SEO final check
npx lighthouse http://localhost:3000 --only-categories=seo --view
# Target: SEO 95+
```

**If all pass → commit and proceed to Phase 4.**

---

## PHASE 4: GO LIVE (Score: 91+ with Google Authority Preserved)

### 4A — Pre-Deploy Checklist

```bash
# 1. Environment variables set on server
ssh root@5.189.188.229
cd /var/www/emart-platform/apps/web
cat .env.local
# Must have: NEXT_PUBLIC_WC_API_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm install

# 4. Build production
npm run build
# Must show: ✓ Compiled successfully, 220+ pages

# 5. Test locally on server
npm run start
curl http://localhost:3000/sitemap.xml | head -30
```

---

### 4B — Deploy to PM2

```bash
# Restart PM2 process
pm2 restart emartweb

# Check logs
pm2 logs emartweb --lines 50
# Should show: "Ready in Xms", no errors

# Verify via IP
curl http://5.189.188.229/ | grep -o '<title>.*</title>'
curl http://5.189.188.229/sitemap.xml | head -20
curl http://5.189.188.229/robots.txt
```

---

### 4C — DNS Configuration

**Task:** Point e-mart.com.bd to server IP.

**Steps:**
1. Log in to domain registrar (e.g., NameCheap, GoDaddy)
2. Go to DNS settings for e-mart.com.bd
3. Add/update A record:
   - Host: `@` (root)
   - Type: `A`
   - Value: `5.189.188.229`
   - TTL: 300 (5 minutes)
4. Add/update A record for www:
   - Host: `www`
   - Type: `A`
   - Value: `5.189.188.229`
   - TTL: 300

**Wait 15-30 minutes for DNS propagation.**

**Verify:**
```bash
nslookup e-mart.com.bd
# Should return: 5.189.188.229

ping e-mart.com.bd
# Should ping 5.189.188.229
```

---

### 4D — SSL Certificate (Let's Encrypt)

**Task:** Install SSL certificate via Certbot.

**Prerequisite:** Nginx must be configured to serve the Next.js app.

**Nginx config file:** `/etc/nginx/sites-available/emart`

```nginx
server {
    listen 80;
    server_name e-mart.com.bd www.e-mart.com.bd;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable config:**
```bash
ln -s /etc/nginx/sites-available/emart /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

**Install Certbot and get SSL:**
```bash
apt update
apt install certbot python3-certbot-nginx -y

certbot --nginx -d e-mart.com.bd -d www.e-mart.com.bd
# Follow prompts, select "Redirect HTTP to HTTPS"

# Verify auto-renewal
certbot renew --dry-run
```

**Test HTTPS:**
```bash
curl -I https://e-mart.com.bd/ | grep "200 OK"
curl https://e-mart.com.bd/sitemap.xml | head -20
```

---

### 4E — Google Search Console Submission

**Task:** Submit sitemap and request indexing.

**Steps:**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://e-mart.com.bd`
3. Verify ownership via DNS TXT record or HTML file upload
4. Submit sitemap: `https://e-mart.com.bd/sitemap.xml`
5. Request indexing for priority URLs:
   - `https://e-mart.com.bd/`
   - `https://e-mart.com.bd/shop`
   - `https://e-mart.com.bd/korean-beauty`
   - `https://e-mart.com.bd/category/sunscreen`
   - Top 5 best-selling product pages

---

### 4F — Bing Webmaster Tools (Bonus)

**Task:** Import from Google Search Console.

**Steps:**
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Click "Import from Google Search Console"
3. Authorize and import site data
4. Sitemap is automatically imported

---

### 4G — Final Verification Checklist

```bash
# 1. HTTPS working
curl -I https://e-mart.com.bd/ | grep "200 OK"

# 2. Sitemap accessible
curl https://e-mart.com.bd/sitemap.xml | head -30

# 3. Robots.txt accessible
curl https://e-mart.com.bd/robots.txt

# 4. Schema present
curl -s https://e-mart.com.bd/ | grep '"@type":"Organization"'
curl -s https://e-mart.com.bd/product/cosrx-snail-mucin | grep '"@type":"Product"'

# 5. Rich Results Test
# Visit: https://search.google.com/test/rich-results
# Test: https://e-mart.com.bd/, product page, category page

# 6. Lighthouse Production Audit
npx lighthouse https://e-mart.com.bd --view
# Target: Performance 90+, SEO 95+, Accessibility 95+

# 7. Mobile-Friendly Test
# Visit: https://search.google.com/test/mobile-friendly
# Test: https://e-mart.com.bd/

# 8. PageSpeed Insights
# Visit: https://pagespeed.web.dev/
# Test: https://e-mart.com.bd/
# Target: Green scores on mobile and desktop
```

---

## Success Criteria

### Technical Metrics
- ✅ Lighthouse SEO: 95+
- ✅ Lighthouse Performance: 90+
- ✅ Lighthouse Accessibility: 95+
- ✅ Core Web Vitals: Green (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1)
- ✅ Rich Results: Eligible for Product, Organization, BreadcrumbList
- ✅ Sitemap: 220+ URLs indexed
- ✅ Mobile-Friendly: Pass
- ✅ HTTPS: A+ SSL Labs rating

### Business Metrics (Track 30-90 days post-launch)
- 📈 Google Search Console impressions +50% MoM
- 📈 Organic CTR +20%
- 📈 Non-brand clicks +30%
- 📈 Product pages indexed: 200+
- 📈 Average position for target keywords: <20

---

## Post-Launch Monitoring

### Week 1
- [ ] Monitor Search Console for crawl errors
- [ ] Check indexing status daily (site:e-mart.com.bd)
- [ ] Review Page Experience report
- [ ] Monitor Core Web Vitals in field data

### Week 2-4
- [ ] Track rankings for target keywords (Ahrefs/SEMrush)
- [ ] Analyze organic traffic growth (Google Analytics)
- [ ] Review top landing pages and bounce rates
- [ ] A/B test product page layouts for conversion

### Month 2-3
- [ ] Build backlinks (directory submissions, guest posts)
- [ ] Create SEO blog content (20 posts from previous plan)
- [ ] Optimize underperforming pages
- [ ] Launch Google Shopping feed

---

## Emergency Rollback Plan

If critical issues occur post-deploy:

```bash
# Rollback code
cd /var/www/emart-platform/apps/web
git log --oneline -10  # Find last working commit
git reset --hard <commit-hash>
npm run build
pm2 restart emartweb

# Rollback DNS (if needed)
# Point A record back to old server IP

# Monitor
pm2 logs emartweb --lines 100
```

---

## Notes for Claude Code Execution

1. **Incremental commits:** Commit after each phase passes verification
2. **Test locally first:** Always run `npm run build` and test on localhost before deploying
3. **Preserve existing code:** Don't delete working components; enhance them
4. **API keys:** Never commit WooCommerce API keys; use .env.local
5. **Error handling:** Add try/catch to all API calls with fallback UI
6. **Performance:** Use Next.js Image component, lazy load below fold, minimize client-side JS
7. **Accessibility:** Add ARIA labels, keyboard navigation, color contrast 4.5:1+
8. **Bangladesh context:** Use BDT currency, Bangla/English bilingual support where needed

---

## Expected Timeline

- **Phase 1 (SEO Foundation):** 3-4 hours
- **Phase 2 (UI Fixes):** 4-5 hours
- **Phase 3 (New Pages):** 2-3 hours
- **Phase 4 (Go Live):** 1-2 hours
- **Total:** 10-14 hours (can be done in 2-3 coding sessions)

---

## Questions to Ask Before Starting

1. Do you have SSH access to 5.189.188.229? (Need to verify server access)
2. Are WooCommerce API credentials in .env.local on the server?
3. Which Next.js version is currently running? (`cat package.json | grep next`)
4. Is PM2 process 'emartweb' running? (`pm2 list`)
5. Do you have access to domain registrar DNS settings?
6. Any existing pages/components that must not be modified?

---

**End of Implementation Prompt**

Claude Code: Execute phases 1-4 in order, verify after each phase, commit incrementally, and report completion status with Lighthouse scores and deployment URL.
