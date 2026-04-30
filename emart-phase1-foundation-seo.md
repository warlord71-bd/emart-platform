# Emart.com.bd — Foundation, SEO & Performance Implementation Guide
## Phase 1: Zero-Design-Change Fixes | Rank Math + E-E-A-T + Lighthouse + AI-Content Ready
## Stack: Ubuntu + Cloudflare + Next.js + WooCommerce/WordPress + Rank Math

> **Mission:** Fix SEO, performance, security, and infrastructure WITHOUT changing a single pixel of the current design. 
> **Timeline:** 12 prompts, 1 per commit. Test after each.
> **Rank Math:** WordPress backend handles post/product SEO. Next.js frontend consumes it via REST API.
> **E-E-A-T:** Every content decision follows Experience, Expertise, Authoritativeness, Trustworthiness.
> **AI Content Standard:** Google Helpful Content System compliant — original, people-first, clearly authored.

---

## TABLE OF CONTENTS

1. [Safety Rules](#1-safety)
2. [Current State Audit](#2-audit)
3. [Rank Math Headless Integration](#3-rankmath)
4. [E-E-A-T & AI Content Standards](#4-eeat)
5. [Lighthouse Targets](#5-lighthouse)
6. [Implementation Prompts (12 Days)](#6-prompts)
7. [Infrastructure (Cloudflare + Ubuntu)](#7-infra)
8. [WooCommerce API Optimization](#8-api)
9. [Testing & Validation](#9-testing)
10. [Rollback Plan](#10-rollback)

---

## 1. SAFETY RULES <a name="1-safety"></a>

```
1. NEVER modify CSS, colors, spacing, fonts, or layout
2. NEVER change image src paths — only add alt text and loading attributes
3. NEVER remove existing components — only add wrappers or attributes
4. ALWAYS keep current classNames exactly as they are
5. Commit after EVERY prompt. Tag commits: git tag -a phase1-day1 -m "Prompt 1: layout metadata"
6. Test on real mobile device (375px) before next prompt
7. If Lighthouse score drops >5 points, stop and revert
8. Do NOT touch any design-related files (no new components, no visual sections)
```

---

## 2. CURRENT STATE AUDIT <a name="2-audit"></a>

| # | Issue | Impact | File Target | Risk |
|---|-------|--------|-------------|------|
| 1 | Broken countdown `Ends inEnds--:--:--` | Trust erosion, bounce rate ↑ | Flash sale component | Low |
| 2 | No JSON-LD schema | Zero rich snippets | `page.tsx` | Low |
| 3 | Weak heading hierarchy (multiple h1 or skipped levels) | Crawl confusion, screen reader chaos | All sections | Low |
| 4 | Missing `robots` meta | Indexing ambiguity | `layout.tsx` | Low |
| 5 | No canonical tags | Duplicate content penalty | `page.tsx` | Low |
| 6 | Missing Open Graph / Twitter Cards | Social shares look broken | `page.tsx` | Low |
| 7 | Product cards lack structured data | No price/rating in SERP | Product card | Low |
| 8 | Social embeds load heavy third-party JS | LCP/CLS penalty | Social section | Low |
| 9 | Blog section no internal linking | Orphaned content, no juice flow | Blog component | Low |
| 10 | No API error boundaries | White screen on WooCommerce hiccup | Data fetch layer | Medium |
| 11 | Images lack `sizes` attribute | Mobile downloads desktop images | All `next/image` | Low |
| 12 | No `lang="en-BD"` | Wrong locale signals to Google | `layout.tsx` | Low |
| 13 | Rank Math SEO data not consumed by frontend | All Rank Math settings ignored | API layer | High |
| 14 | No E-E-A-T signals (author, date, sources) | YMYL penalty risk for skincare | Content/Blog | Medium |
| 15 | No `manifest.json` or PWA basics | Installability miss | Root | Low |
| 16 | Missing security headers | XSS/clickjacking vulnerability | `next.config.js` | Medium |
| 17 | WooCommerce API calls unbatched | Slow TTFB | API calls | Medium |
| 18 | No Cloudflare cache rules | Origin overload, slow global | Cloudflare | Medium |

---

## 3. RANK MATH HEADLESS INTEGRATION <a name="3-rankmath"></a>

### The Problem
You have Rank Math on WordPress generating perfect SEO meta, but your Next.js frontend never reads it. You're manually duplicating titles/descriptions in Next.js while Rank Math already has them.

### The Solution
Expose Rank Math meta via WordPress REST API → Consume in Next.js `generateMetadata`.

### Step A: WordPress Functions.php (add to your theme)

```php
/**
 * Expose Rank Math SEO data to REST API for headless Next.js frontend
 * Add to your active theme's functions.php or a custom plugin
 */

// 1. Add Rank Math meta to Posts/Pages REST response
add_action('rest_api_init', function () {
    register_rest_field(
        ['post', 'page', 'product'],
        'rank_math_seo',
        [
            'get_callback' => function ($object) {
                $post_id = $object['id'];

                // Get Rank Math meta
                $title = get_post_meta($post_id, 'rank_math_title', true);
                $description = get_post_meta($post_id, 'rank_math_description', true);
                $focus_keyword = get_post_meta($post_id, 'rank_math_focus_keyword', true);
                $canonical_url = get_post_meta($post_id, 'rank_math_canonical_url', true);
                $robots = get_post_meta($post_id, 'rank_math_advanced_robots', true);

                // Get Rank Math schema
                $schema = get_post_meta($post_id, 'rank_math_schema_BlogPosting', true);
                if (empty($schema)) {
                    $schema = get_post_meta($post_id, 'rank_math_schema_Product', true);
                }
                if (empty($schema)) {
                    $schema = get_post_meta($post_id, 'rank_math_schema_Article', true);
                }

                // Get Open Graph data
                $og_title = get_post_meta($post_id, 'rank_math_facebook_title', true);
                $og_description = get_post_meta($post_id, 'rank_math_facebook_description', true);
                $og_image = get_post_meta($post_id, 'rank_math_facebook_image', true);

                // Get Twitter data
                $twitter_title = get_post_meta($post_id, 'rank_math_twitter_title', true);
                $twitter_description = get_post_meta($post_id, 'rank_math_twitter_description', true);
                $twitter_image = get_post_meta($post_id, 'rank_math_twitter_image', true);

                return [
                    'title' => $title ?: null,
                    'description' => $description ?: null,
                    'focus_keyword' => $focus_keyword ?: null,
                    'canonical_url' => $canonical_url ?: null,
                    'robots' => $robots ?: null,
                    'schema' => $schema ?: null,
                    'open_graph' => [
                        'title' => $og_title ?: null,
                        'description' => $og_description ?: null,
                        'image' => $og_image ?: null,
                    ],
                    'twitter' => [
                        'title' => $twitter_title ?: null,
                        'description' => $twitter_description ?: null,
                        'image' => $twitter_image ?: null,
                    ],
                ];
            },
            'update_callback' => null,
            'schema' => null,
        ]
    );
});

// 2. Add Rank Math meta to Product REST response (WooCommerce)
add_filter('woocommerce_rest_prepare_product_object', function ($response, $object, $request) {
    $post_id = $object->get_id();

    $response->data['rank_math_seo'] = [
        'title' => get_post_meta($post_id, 'rank_math_title', true) ?: null,
        'description' => get_post_meta($post_id, 'rank_math_description', true) ?: null,
        'focus_keyword' => get_post_meta($post_id, 'rank_math_focus_keyword', true) ?: null,
        'canonical_url' => get_post_meta($post_id, 'rank_math_canonical_url', true) ?: null,
        'schema' => get_post_meta($post_id, 'rank_math_schema_Product', true) ?: null,
        'open_graph' => [
            'title' => get_post_meta($post_id, 'rank_math_facebook_title', true) ?: null,
            'description' => get_post_meta($post_id, 'rank_math_facebook_description', true) ?: null,
            'image' => get_post_meta($post_id, 'rank_math_facebook_image', true) ?: null,
        ],
    ];

    return $response;
}, 10, 3);

// 3. Expose Rank Math sitemap info (optional, for dynamic sitemap generation)
add_action('rest_api_init', function () {
    register_rest_route('emart/v1', '/rankmath-home', [
        'methods' => 'GET',
        'callback' => function () {
            // Get Rank Math homepage settings
            $title = get_option('rank_math_title');
            $desc = get_option('rank_math_description');
            return [
                'title' => $title,
                'description' => $desc,
                'site_name' => get_bloginfo('name'),
            ];
        },
        'permission_callback' => '__return_true',
    ]);
});
```

### Step B: Next.js `generateMetadata` Pattern

```tsx
// app/blog/[slug]/page.tsx
import { Metadata } from "next";

async function getPost(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PRIVATE_WC_API_URL}/wp-json/wp/v2/posts?slug=${slug}&_embed`,
    { next: { revalidate: 60 } }
  );
  const posts = await res.json();
  return posts[0] || null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Not Found" };

  const seo = post.rank_math_seo || {};

  // Priority: Rank Math > Fallback
  const title = seo.title || post.title.rendered || "Emart Blog";
  const description = seo.description || stripHtml(post.excerpt.rendered).slice(0, 160);
  const canonical = seo.canonical_url || `https://e-mart.com.bd/blog/${params.slug}`;
  const ogImage = seo.open_graph?.image || post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: seo.open_graph?.title || title,
      description: seo.open_graph?.description || description,
      url: canonical,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      title: seo.twitter?.title || title,
      description: seo.twitter?.description || description,
      images: seo.twitter?.image || ogImage ? [seo.twitter?.image || ogImage] : undefined,
    },
    // Inject Rank Math schema if available
    other: seo.schema ? {
      'rank-math-schema': JSON.stringify(seo.schema),
    } : undefined,
  };
}
```

### Step C: Homepage Metadata (Rank Math Site Settings + Overrides)

```tsx
// app/page.tsx
export async function generateMetadata(): Promise<Metadata> {
  // Fetch Rank Math homepage settings
  const res = await fetch(
    `${process.env.NEXT_PRIVATE_WC_API_URL}/wp-json/emart/v1/rankmath-home`,
    { next: { revalidate: 3600 } }
  );
  const rankMathHome = await res.json().catch(() => ({}));

  const title = rankMathHome.title || "Authentic K-Beauty & Global Skincare in Bangladesh | Emart";
  const description = rankMathHome.description || "Buy 100% authentic Korean and global skincare in Bangladesh. COSRX, Beauty of Joseon, CeraVe, La Roche-Posay, The Ordinary & 40+ verified brands. Next-day Dhaka delivery. COD available.";

  return {
    title,
    description,
    alternates: { canonical: "https://e-mart.com.bd/" },
    openGraph: {
      title,
      description,
      url: "https://e-mart.com.bd/",
      siteName: rankMathHome.site_name || "Emart Skincare Bangladesh",
      images: [{ url: "https://e-mart.com.bd/og-home.jpg", width: 1200, height: 630 }],
      locale: "en_BD",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://e-mart.com.bd/og-home.jpg"],
    },
  };
}
```

### Step D: Schema Coordination (Rank Math + Next.js)

**Rule:** Let Rank Math handle page-level schema (Product, Article, BlogPosting). Let Next.js handle site-level schema (WebSite, Organization, Store, BreadcrumbList).

```tsx
// In your page component, inject BOTH schemas
function JsonLd({ rankMathSchema }: { rankMathSchema?: object }) {
  const siteSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Emart Skincare Bangladesh",
      url: "https://e-mart.com.bd/",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://e-mart.com.bd/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Emart Skincare Bangladesh",
      url: "https://e-mart.com.bd/",
      logo: "https://e-mart.com.bd/logo.png",
      sameAs: [
        "https://instagram.com/emart.skincare",
        "https://facebook.com/emart.skincare",
        "https://youtube.com/@emart.skincare",
        "https://tiktok.com/@emart.skincare",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+880-XXXX-XXXXXX",
        contactType: "customer service",
        areaServed: "BD",
        availableLanguage: ["English", "Bengali"],
      },
    },
  ];

  const allSchemas = rankMathSchema 
    ? [...siteSchemas, rankMathSchema] 
    : siteSchemas;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(allSchemas) }}
    />
  );
}
```

---

## 4. E-E-A-T & AI CONTENT STANDARDS <a name="4-eeat"></a>

### E-E-A-T for Skincare (YMYL — Your Money Your Life)

Skincare is a YMYL topic. Google holds it to higher E-E-A-T standards.

#### Experience (First-Hand)
```
✅ DO:
- "We tested this COSRX serum in Dhaka's 35°C humidity for 3 weeks"
- "Our team in Dhanmondi tried this on combination skin"
- "Real customer photos from Chittagong showing results after 30 days"
- "Stored and handled in our climate-controlled Dhanmondi facility"

❌ DON'T:
- "This product is good for all skin" (generic, no experience)
- "Experts say..." (without naming the expert)
- Copy-paste brand marketing claims
```

#### Expertise (Knowledge Depth)
```
✅ DO:
- Author bios: "Written by [Name], certified skincare consultant, 5 years K-Beauty sourcing"
- Cite dermatologist reviews or studies
- Explain WHY an ingredient works (niacinamide → melanin inhibition)
- Compare concentrations: "This has 5% niacinamide vs competitor's 2%"
- Bangladesh-specific context: "Humidity in Dhaka means gel moisturizers work better than heavy creams"

❌ DON'T:
- "This is amazing!!!" (no expertise demonstrated)
- List ingredients without explaining benefit
- Generic advice that ignores local climate
```

#### Authoritativeness (Recognition)
```
✅ DO:
- Link to brand official sites (COSRX official, etc.)
- Mention direct brand partnerships
- Show certificates of authenticity
- Link to credible sources (PubMed for ingredient studies, brand official channels)
- Guest posts from dermatologists (with their credentials)
- About page with team photos, real Dhanmondi address

❌ DON'T:
- No external links (looks isolated)
- Fake "as seen on" badges
- Unverifiable claims
```

#### Trustworthiness (Honesty & Safety)
```
✅ DO:
- Clear return policy (7 days, unopened)
- Authenticity guarantee with verification process explained
- Real customer reviews with photos
- Clear pricing (no hidden fees)
- Expiry dates visible on product pages
- "Not sure? Chat with us on WhatsApp" — human support
- Disclose: "Some links are affiliate" (if applicable)
- Medical disclaimer: "This is not medical advice. Consult a dermatologist for serious conditions."

❌ DON'T:
- Fake urgency ("Only 1 left!!!" when stock is healthy)
- Before/after photos that are clearly stock images
- Claims like "cures acne in 1 day"
- Hide contact information
```

### AI Content Standards (Google Helpful Content System)

```
✅ DO:
- Every blog post has a named human author with bio
- Original photography (product shots in Bangladesh context)
- First-hand testing and reviews
- Answer real customer questions from WhatsApp/support
- Update old posts with new information (show "Last updated" date)
- Create content for PEOPLE, not search engines
- "People Also Ask" coverage with genuine answers

❌ DON'T:
- Auto-generate 100 product descriptions with AI
- Publish AI content without human review
- Create thin pages ("What is [Ingredient]?" with 100 words)
- Keyword stuffing
- Duplicate content across product pages
```

### Content Audit Checklist

For every existing blog post:
- [ ] Author name + bio with photo
- [ ] Published date + "Last updated" date
- [ ] Original images (not just brand assets)
- [ ] At least 1 external link to credible source
- [ ] At least 2 internal links to related products/posts
- [ ] Bangladesh-specific context (climate, skin concerns common here)
- [ ] Medical disclaimer if giving advice
- [ ] FAQ section at bottom

For every product page:
- [ ] Real product photos (not just brand catalog)
- [ ] Expiry date visible
- [ ] Authenticity verification note
- [ ] How to use (adapted for Bangladesh climate)
- [ ] Ingredients list with plain-language explanation
- [ ] Customer reviews with photos
- [ ] "Ask a question" CTA

---

## 5. LIGHTHOUSE TARGETS <a name="5-lighthouse"></a>

### Performance (Weight: 30%)

| Metric | Target | Current Guess | Fix |
|--------|--------|---------------|-----|
| LCP (Largest Contentful Paint) | < 2.5s | ~4s | Image optimization, preload hero, font-display:swap |
| INP (Interaction to Next Paint) | < 200ms | ~500ms | Reduce JS, code split, optimize event handlers |
| CLS (Cumulative Layout Shift) | < 0.1 | ~0.3 | Size attributes on images, no layout-forcing animations |
| TTFB (Time to First Byte) | < 600ms | ~1.2s | Cloudflare caching, API batching, Redis |
| FCP (First Contentful Paint) | < 1.8s | ~3s | Preload critical CSS, inline above-fold styles |

### Accessibility (Weight: 25%)

| Check | Target |
|-------|--------|
| Color contrast | WCAG AA (4.5:1 for text) |
| Touch targets | Min 44×44px |
| Alt text | Every image has descriptive alt |
| Heading order | No skipped levels |
| Focus indicators | Visible focus rings |
| ARIA labels | Interactive elements labeled |
| Form labels | Every input has label |
| Language | `lang="en-BD"` set |

### Best Practices (Weight: 25%)

| Check | Target |
|-------|--------|
| HTTPS | Valid SSL |
| HTTP/2 or HTTP/3 | Enabled |
| No mixed content | All resources HTTPS |
| Secure cookies | HttpOnly, Secure, SameSite |
| CSP header | Implemented (gradually) |
| Deprecated APIs | None used |

### SEO (Weight: 20%)

| Check | Target |
|-------|--------|
| Mobile-friendly | Responsive |
| Canonical tags | Every page |
| Meta description | Every page, 120-158 chars |
| Structured data | Valid JSON-LD |
| Hreflang | If multi-language |
| Sitemap | `/sitemap.xml` submitted to GSC |
| Robots.txt | Valid, no blocked critical resources |

---

## 6. IMPLEMENTATION PROMPTS (12 DAYS) <a name="6-prompts"></a>

### PROMPT 1: WordPress Rank Math REST API Exposure

```
I need to expose Rank Math SEO data through the WordPress REST API so my headless Next.js frontend can consume it.

TASK:
Add code to my WordPress theme's functions.php (or a custom plugin) that:
1. Registers a 'rank_math_seo' field on post, page, and product REST responses
2. Exposes: title, description, focus_keyword, canonical_url, robots, schema, open_graph (title, description, image), twitter (title, description, image)
3. Adds a custom REST endpoint /wp-json/emart/v1/rankmath-home that returns site-wide Rank Math settings
4. Also hooks into WooCommerce REST to add rank_math_seo to product responses

CONSTRAINTS:
- Use only standard WordPress/WooCommerce hooks
- Do not break existing REST API functionality
- Return null for missing fields, don't omit keys
- No authentication required for read (data is public SEO meta)

Return the complete PHP code to add.
```

### PROMPT 2: Next.js Layout — Metadata + Font + Lang

```
Update my Next.js root layout at app/layout.tsx.

TASK:
1. Add proper viewport meta (width=device-width, initialScale=1, themeColor)
2. Add metadata export with: metadataBase, robots (index,follow), icons, manifest
3. Add Inter font with display: 'swap'
4. Set html lang="en-BD"
5. Add a JsonLd component for site-wide Organization + WebSite schema
6. The Organization schema MUST include: name, url, logo, sameAs (social links), contactPoint (Bangladesh phone, customer service, availableLanguage English + Bengali)

CONSTRAINTS:
- Do NOT change any existing component structure
- Keep all existing providers, imports, children
- Only add/modify metadata and html attributes
- Use existing font import if present

Return the complete updated layout.tsx.
```

### PROMPT 3: Homepage Metadata + Rank Math Integration

```
Update my homepage at app/page.tsx to use dynamic metadata from Rank Math.

TASK:
1. Export async generateMetadata() that:
   - Fetches from /wp-json/emart/v1/rankmath-home
   - Falls back to hardcoded defaults if API fails
   - Returns: title, description, alternates.canonical, openGraph, twitter

2. Add a JsonLd component that injects:
   - WebSite schema (with SearchAction)
   - Store schema (Dhaka address, opening hours, priceRange ৳৳)
   - If Rank Math returns schema for homepage, merge it in

3. Add the JsonLd component before <main>

CONSTRAINTS:
- Do NOT change any existing section components
- Keep all existing data fetching and component order
- Safe fetch with null fallback
- No visual changes

Return the complete metadata export + JsonLd component.
```

### PROMPT 4: Safe Fetch Wrapper + Error Boundaries

```
Create a safe API wrapper for my WooCommerce + WordPress REST API calls.

TASK:
1. Create lib/api.ts with:
   - safeFetch<T>(endpoint: string, tag: string, options?: object): Promise<T | null>
   - Uses NEXT_PRIVATE_WC_API_URL (never NEXT_PUBLIC)
   - Adds Basic Auth from NEXT_PRIVATE_WC_CONSUMER_KEY + NEXT_PRIVATE_WC_CONSUMER_SECRET
   - Sets next: { tags: [tag], revalidate: 60 }
   - Returns null on ANY error (network, 4xx, 5xx)
   - console.error server-side only

2. Create a SafeSection component that:
   - Takes children and fallback prop
   - Wraps in Error Boundary
   - If error or null data, shows fallback UI (not crash)

3. Update all existing fetch calls in page.tsx to use safeFetch

CONSTRAINTS:
- Never expose API URL or credentials to client
- Keep existing TypeScript types
- Graceful degradation: if API fails, show message not white screen

Return lib/api.ts + SafeSection component + example usage.
```

### PROMPT 5: Heading Hierarchy Fix

```
Audit and fix heading hierarchy in my homepage component.

RULES:
- Exactly ONE <h1> per page (Hero section only)
- Every major section gets <h2 id="unique-id">
- Add aria-labelledby="unique-id" to each <section>
- Product cards, review cards, blog cards use <h3>
- No heading tags inside buttons
- Keep all existing visual styling (classNames unchanged)

SECTIONS TO FIX:
1. Hero → h1 (already is)
2. Flash Sale → h2 id="flash-sale-heading"
3. Shop by Concern → h2 id="concerns-heading"
4. Trust Section → h2 id="trust-heading"
5. Reviews → h2 id="reviews-heading"
6. Social → h2 id="social-heading"
7. Quiz CTA → h2 id="quiz-heading"
8. Origin Story → h2 id="origin-heading"
9. Blog → h2 id="blog-heading"

CONSTRAINTS:
- Only change tag names (h1→h2, div→h3, etc.)
- Do NOT change CSS classes
- Do NOT change text content
- Add id attributes for aria-labelledby

Return the modified sections only.
```

### PROMPT 6: Flash Sale Countdown Fix

```
My flash sale countdown shows: "Ends inEnds--:--:--". Fix it.

TASK:
1. Create CountdownTimer component
2. Compute target: next midnight Bangladesh time (UTC+6)
3. Display: "Ends in [HH] : [MM] : [SS]" with each unit in a small rounded box
4. Add aria-live="polite" aria-atomic="true"
5. If products fail to load, show: "Flash sale items are updating. Check back in a few minutes."
6. Keep existing product grid and styling exactly as is

CONSTRAINTS:
- Keep current visual styling
- Do NOT change product card layout
- Do NOT remove existing sale badge logic
- Server-computed is fine (static per request)

Return CountdownTimer component + updated Flash Sale section wrapper.
```

### PROMPT 7: Product Card Structured Data

```
Add Schema.org Product + Offer microdata to my product cards.

TASK:
For each product card:
1. Wrap in <article itemScope itemType="https://schema.org/Product">
2. Add meta tags: itemProp="name", itemProp="brand" (first word of name), itemProp="image"
3. Wrap price in <div itemProp="offers" itemScope itemType="https://schema.org/Offer">
   - priceCurrency="BDT"
   - availability="https://schema.org/InStock"
   - itemProp="price" with ৳ symbol stripped for value
4. Add AggregateRating if review count available
5. Keep ALL existing styling and click behavior

CONSTRAINTS:
- Do NOT change visual appearance
- Do NOT break Link or onClick
- Keep current sale badge logic
- Use meta tags for hidden schema data

Return the updated ProductCard component.
```

### PROMPT 8: Image Optimization (Mobile-First)

```
Optimize all next/image components on my homepage for mobile-first loading.

TASK:
For EVERY Image component:
1. Hero image: add priority, sizes="(max-width: 768px) 100vw, 50vw"
2. Product images: add loading="lazy", sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
3. Category images: sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
4. Blog images: sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
5. All images: ensure alt text is descriptive (include product benefit, not just name)
6. Add fill + object-cover for responsive containers
7. Add placeholder="blur" if blurDataURL available

CONSTRAINTS:
- Do NOT change image src paths
- Do NOT change container dimensions
- Only add attributes
- Keep existing className values

Return a complete list of every Image with updated props.
```

### PROMPT 9: Blog Section Internal Linking + E-E-A-T

```
Improve my blog section with internal linking, schema, and E-E-A-T signals.

TASK:
1. Ensure each blog card links to /blog/{slug} with Next.js Link
2. Add semantic <article> wrapper
3. Add <time dateTime={ISO}> with published date
4. Add "Last updated" date if available
5. Add author name and link to author page (even if generic "Emart Editorial Team")
6. Add line-clamp-3 to excerpt
7. Ensure h2 "Skincare Journal" + "Read all articles →" link to /blog
8. Add null fallback: "New guides publishing soon."
9. Add internal links within excerpts if possible (link product mentions)
10. Add BlogPosting schema microdata: headline, image, datePublished, dateModified, author, publisher

CONSTRAINTS:
- Do NOT change blog card styling
- Do NOT remove existing image/title logic
- Keep current data fetching
- No visual changes

Return the updated blog section component.
```

### PROMPT 10: Social Section — Remove Heavy Embeds

```
My social section loads Instagram/YouTube/TikTok embed scripts. Replace with lightweight static cards.

TASK:
Replace embeds with 3 static cards:
1. Instagram — icon, @emart.skincare, description, link out
2. YouTube — icon, @emart.skincare, description, link out
3. TikTok — icon, @emart.skincare, description, link out

Each card:
- Platform icon (use SVG, no external font)
- Handle text
- One-line description
- External link with target="_blank" rel="noopener noreferrer"
- Keep current section heading "See routines in action"

CONSTRAINTS:
- Do NOT load any embed.js or widget scripts
- Do NOT use iframes
- Keep visual grid layout (current CSS)
- No third-party requests

Return the complete social section component.
```

### PROMPT 11: Review Microdata + E-E-A-T

```
Add Schema.org Review microdata to my customer testimonials.

TASK:
For each review card:
1. Wrap in <article itemScope itemType="https://schema.org/Review">
2. itemReviewed → Product meta with name
3. reviewRating → Rating schema with ratingValue
4. author → Person schema with name
5. reviewBody → the testimonial text
6. datePublished → if available
7. Keep star display visual (not schema-only)
8. Add "Verified Purchase" as plain text badge

E-E-A-T ENHANCEMENT:
- Add reviewer location (Dhaka, Sylhet, etc.)
- Add product name they bought (proves real purchase)
- If possible, add "Verified buyer" microdata

CONSTRAINTS:
- Do NOT change card styling
- Do NOT remove existing content
- Only add attributes and microdata

Return the updated review cards markup.
```

### PROMPT 12: next.config.js + Security Headers + Cloudflare

```
Update my next.config.js with security headers, image config, and build optimizations.

TASK:
1. Add headers() export with:
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: camera=(), microphone=(), geolocation=()

2. Images config:
   - formats: ["image/avif", "image/webp"]
   - remotePatterns for your CDN/backend domain
   - deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
   - imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]

3. Experimental (if Next.js 14+):
   - optimizePackageImports: ['lucide-react']

4. Add trailingSlash: false (or keep current)
5. Add poweredByHeader: false

CONSTRAINTS:
- Do NOT remove existing config
- Merge carefully with existing headers() if present
- Keep existing redirects/rewrites

Return the complete next.config.js.
```

---

## 7. INFRASTRUCTURE (Cloudflare + Ubuntu) <a name="7-infra"></a>

### Cloudflare Page Rules

```
Rule 1: e-mart.com.bd/wp-json/*
- Cache Level: Bypass
- Security Level: High
- Always Online: Off

Rule 2: e-mart.com.bd/_next/static/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 month
- Always Online: On

Rule 3: e-mart.com.bd/images/*
- Cache Level: Cache Everything
- Edge Cache TTL: 7 days
- Browser Cache TTL: 7 days

Rule 4: e-mart.com.bd/*.webp OR *.avif OR *.png OR *.jpg
- Cache Level: Cache Everything
- Edge Cache TTL: 30 days
```

### Cloudflare Settings

| Setting | Value |
|---------|-------|
| SSL/TLS | Full (strict) |
| Always Use HTTPS | ON |
| Automatic HTTPS Rewrites | ON |
| Brotli | ON |
| Early Hints | ON |
| HTTP/2 | ON |
| HTTP/3 (QUIC) | ON |
| 0-RTT Connection Resumption | ON |
| Polish | Lossless WebP |
| Auto Minify | JS: OFF (Next.js handles), CSS: OFF, HTML: OFF |
| Rocket Loader | OFF (breaks Next.js hydration) |

### Nginx Config (Ubuntu)

```nginx
# /etc/nginx/sites-available/e-mart.com.bd
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name e-mart.com.bd www.e-mart.com.bd;

    root /var/www/e-mart/.next;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Brotli
    brotli on;
    brotli_comp_level 6;
    brotli_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Next.js static (immutable)
    location /_next/static {
        alias /var/www/e-mart/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Public images
    location /images {
        alias /var/www/e-mart/public/images;
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
    }

    # API proxy to WordPress (keep backend private)
    location /wp-json {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        limit_req zone=api burst=20 nodelay;
    }

    # Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # SSL
    ssl_certificate /etc/letsencrypt/live/e-mart.com.bd/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/e-mart.com.bd/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
}

# HTTP redirect
server {
    listen 80;
    listen [::]:80;
    server_name e-mart.com.bd www.e-mart.com.bd;
    return 301 https://$server_name$request_uri;
}
```

### Rate Limiting (nginx.conf)

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=50r/s;

    # Apply to API
    server {
        location /wp-json {
            limit_req zone=api burst=20 nodelay;
        }
    }
}
```

### PM2 Config

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "emart-frontend",
    cwd: "/var/www/e-mart",
    script: "node_modules/next/dist/bin/next",
    args: "start",
    instances: "max",
    exec_mode: "cluster",
    env: { NODE_ENV: "production", PORT: 3000 },
    error_file: "/var/log/pm2/emart-error.log",
    out_file: "/var/log/pm2/emart-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    max_memory_restart: "1G",
    restart_delay: 3000,
    max_restarts: 5,
    min_uptime: "10s",
  }],
};
```

### Deployment Script

```bash
#!/bin/bash
# deploy.sh — save to /var/www/e-mart/deploy.sh
set -e

echo "🚀 Deploying Emart..."
cd /var/www/e-mart
git pull origin main
npm ci --production
npm run build
pm2 reload ecosystem.config.js --update-env
# Optional: Purge Cloudflare cache
# curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" #   -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" #   --data '{"purge_everything":true}'
echo "✅ Deployed!"
```

---

## 8. WOOCOMMERCE API OPTIMIZATION <a name="8-api"></a>

### Batch Requests

```tsx
// Always fetch in parallel
const [products, categories, featured] = await Promise.all([
  safeFetch<Product[]>("/wp-json/wc/v3/products?per_page=12&status=publish&stock_status=instock", "products"),
  safeFetch<Category[]>("/wp-json/wc/v3/products/categories?per_page=20&hide_empty=true", "categories"),
  safeFetch<Product[]>("/wp-json/wc/v3/products?featured=true&per_page=4&status=publish", "featured"),
]);
```

### Field Filtering (Reduce Payload)

```
/wp-json/wc/v3/products?per_page=8&status=publish&stock_status=instock&_fields=id,name,slug,price,regular_price,sale_price,images,short_description,stock_status
```

### WordPress Caching (functions.php)

```php
// Enable object cache
add_filter('enable_loading_object_cache_dropin', '__return_true');

// Extend REST API cache
add_filter('rest_cache_headers', function($headers) {
    $headers['Cache-Control'] = 'public, max-age=60';
    return $headers;
});
```

### Redis Object Cache

```bash
# Ubuntu
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# In WordPress: Install "Redis Object Cache" plugin, then enable
```

### Database Indexing

```sql
-- WooCommerce performance indexes
ALTER TABLE wp_posts ADD INDEX idx_post_type_status_date (post_type, post_status, post_date);
ALTER TABLE wp_postmeta ADD INDEX idx_meta_key_value (meta_key(100), meta_value(100));
ALTER TABLE wp_wc_product_meta_lookup ADD INDEX idx_stock_status (stock_status);
```

---

## 9. TESTING & VALIDATION <a name="9-testing"></a>

### After Each Prompt

```bash
# 1. Build check
npm run build

# 2. Lighthouse (local)
npx lighthouse http://localhost:3000 --output=json --chrome-flags="--headless"

# 3. Mobile check
# Open DevTools → Device: iPhone SE (375×667)
# Check: no horizontal scroll, touch targets ≥44px, text readable

# 4. Schema validation
# https://validator.schema.org/
# Paste your page URL

# 5. Rank Math check
# View page source → search for "rank_math" or your meta tags
# Ensure title/description match Rank Math settings
```

### Final Validation Checklist

- [ ] Exactly one `<h1>` per page
- [ ] `<title>` and `<meta name="description">` present
- [ ] `<link rel="canonical">` present
- [ ] JSON-LD valid in schema.org validator
- [ ] Rank Math meta consumed (check page source)
- [ ] `lang="en-BD"` on `<html>`
- [ ] All images have `alt` text
- [ ] All images have `sizes` attribute
- [ ] No `NEXT_PUBLIC_` WooCommerce vars in client bundle
- [ ] API errors show graceful fallback (not white screen)
- [ ] Lighthouse Performance ≥ 75
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Lighthouse Best Practices ≥ 90
- [ ] Lighthouse SEO ≥ 90
- [ ] Mobile-friendly (Google Search Console)
- [ ] Core Web Vitals passing (GSC)

---

## 10. ROLLBACK PLAN <a name="10-rollback"></a>

```bash
# Revert last commit
git revert HEAD --no-edit

# Or revert specific commit
git revert <commit-hash> --no-edit

# Hard reset to last known good (DANGER: loses uncommitted work)
git reset --hard <stable-commit-hash>

# After revert, rebuild and restart
npm run build
pm2 reload ecosystem.config.js

# Clear Cloudflare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache"   -H "Authorization: Bearer $CF_TOKEN"   -H "Content-Type: application/json"   --data '{"purge_everything":true}'
```

**Emergency contacts:** Keep your hosting provider + Cloudflare support links bookmarked.

---

## APPENDIX: Environment Variables

```bash
# .env.local — NEVER commit to git

# WooCommerce API (SERVER-ONLY)
NEXT_PRIVATE_WC_API_URL=https://your-backend-domain.com
NEXT_PRIVATE_WC_CONSUMER_KEY=ck_xxxxxxxx
NEXT_PRIVATE_WC_CONSUMER_SECRET=cs_xxxxxxxx

# Cloudflare (for cache purge in deploy script)
CF_ZONE_ID=your_zone_id
CF_API_TOKEN=your_api_token

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

*Phase 1 Complete. Do NOT proceed to design changes until ALL 12 prompts pass validation.*
