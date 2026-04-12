# Phase 1: UI/UX Implementation (Session 2)

**Goal:** Implement complete UI/UX foundation from ECOMMERCE_UI_UX_TREE spec to achieve Lighthouse Performance 85+, Accessibility 95+

**Estimated time:** 4-5 hours  
**Context budget:** ~40-50% (high)

**Prerequisites:** 
- Navigation structure working
- WooCommerce API connection verified
- CLAUDE.md in project root

---

## ✅ ALREADY COMPLETED (From Previous Claude Code Session)

**Branch:** `claude-code/seo-implementation`  
**Status:** Pushed to GitHub, ready for VPS deployment

### Completed Tasks:
1. ✅ **Shop page pagination** - `/apps/web/src/app/shop/page.tsx`
   - Full pagination (Previous/Next + page numbers)
   - Sort options (Newest, Best Sellers, Top Rated, Price)
   - "Showing X–Y of Z products" count
   - Smart page display with `...` for skipped pages

2. ✅ **Category page pagination** - `/apps/web/src/app/category/[slug]/page.tsx`
   - Same pagination features as shop page
   - Sort functionality
   - Better error handling

3. ✅ **Pre-flight check script** - `docs/claude-code/pre-flight-check.sh`
   - Environment verification (Node, Next.js, TypeScript)
   - Build test
   - PM2 status check
   - Disk space check
   - WooCommerce API connectivity test

4. ✅ **Documentation**
   - `TESTING-GUIDE.md` - VPS testing checklist
   - `CHANGES-SUMMARY.md` - Detailed changelog

### Before Proceeding:
**You MUST deploy and test these changes first:**

```bash
# On VPS:
cd /var/www/emart-platform
git fetch origin
git checkout claude-code/seo-implementation
git pull
bash docs/claude-code/pre-flight-check.sh  # Run verification
cd apps/web
npm run build
pm2 restart emartweb

# Test in browser:
http://5.189.188.229/shop
http://5.189.188.229/category/skincare
```

**Only proceed to Task 1 below after pagination is verified working on VPS.**

---

## Implementation Order (Remaining Tasks)

1. **Global Shell** (Utility bar, Header, Navigation, Footer)
2. **Homepage** (Hero, Origin chips, Product showcases)
3. ~~**Shop/Category Pages**~~ ✅ DONE (see above)
4. **Product Detail Page** (Gallery, Add to cart, Trust signals)
5. **Mobile Responsiveness** (Test all breakpoints)

---

## TASK 1: Global Shell Components

### 1A — Utility Bar (Sticky Top)

**File:** `components/layout/UtilityBar.tsx`

**Spec (from UI/UX tree):**
```
Free delivery ৳1,499+ · 100% Authentic · COD Nationwide · Track Order
```

**Requirements:**
- Sticky at top (z-index: 100)
- Background: Navy `#1B1B2F`
- Text: White with gold `#D4A248` for "৳1,499+"
- Height: 32px mobile, 36px desktop
- Horizontal scroll on mobile if needed
- "Track Order" → clickable link to `/track-order`

**Code:**
```tsx
import Link from 'next/link';

export default function UtilityBar() {
  return (
    <div className="sticky top-0 z-100 bg-navy-950 text-white text-xs md:text-sm py-2 overflow-x-auto">
      <div className="container mx-auto px-4 flex items-center justify-center gap-4 md:gap-8 whitespace-nowrap">
        <span>🚚 Free delivery above <span className="text-gold-500 font-semibold">৳1,499</span></span>
        <span className="hidden md:inline">•</span>
        <span>✓ 100% Authentic</span>
        <span className="hidden md:inline">•</span>
        <span>💵 COD Nationwide</span>
        <span className="hidden md:inline">•</span>
        <Link href="/track-order" className="text-pink-400 hover:underline">📦 Track Order</Link>
      </div>
    </div>
  );
}
```

**Verify:**
```bash
# Add to app/layout.tsx inside <body> before {children}
curl http://localhost:3000/ | grep "Free delivery"
```

---

### 1B — Main Header

**File:** `components/layout/Header.tsx`

**Spec:**
```
Logo · Search bar (full-width on desktop) · Wishlist · Cart · Account
Mobile: Logo left, search icon, cart icon
Desktop: Logo left, centered search bar, right icons
```

**Requirements:**
- Sticky below utility bar (z-index: 90)
- Background: White with subtle shadow
- Logo: 40px height mobile, 48px desktop
- Search bar: Full-width on desktop (max 600px), icon on mobile
- Cart badge: Show item count if >0
- Wishlist badge: Show count if >0

**Code:**
```tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import SearchBar from '@/components/SearchBar';

export default function Header() {
  const [showSearch, setShowSearch] = useState(false);
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-[32px] md:top-[36px] z-90 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image src="/logo.png" alt="E-Mart BD" width={120} height={40} className="md:w-36 md:h-12" />
        </Link>

        {/* Search - Desktop */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
          <SearchBar />
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Search - Mobile */}
          <button onClick={() => setShowSearch(!showSearch)} className="md:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Wishlist */}
          <Link href="/wishlist" className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <Link href="/account">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mobile Search Dropdown */}
      {showSearch && (
        <div className="md:hidden px-4 pb-3">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
```

---

### 1C — Main Navigation with Mega Menu

**File:** `components/layout/Navigation.tsx`

**Spec (from UI/UX tree):**
```
Desktop: Skincare · Haircare · Body · Makeup · Origins · Brands · Sale · New
Mobile: Hamburger menu with same structure + accordion subcategories
```

**Requirements:**
- Desktop: Horizontal menu with hover mega-menu for categories
- Mobile: Hamburger drawer from left
- Fetch categories from WooCommerce API
- Show origin chips (🇰🇷 Korea, 🇯🇵 Japan, 🇬🇧 UK, 🇺🇸 USA, 🇫🇷 France, 🇮🇳 India, 🇧🇩 Bangladesh)
- Highlight "Sale" and "New" with badges

**Code:**
```tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCategories } from '@/services/woocommerce';

export default function Navigation() {
  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  useEffect(() => {
    async function loadCategories() {
      const cats = await getCategories();
      setCategories(cats?.slice(0, 8) || []);
    }
    loadCategories();
  }, []);

  const origins = [
    { code: '🇰🇷', name: 'Korea', slug: 'korean-beauty' },
    { code: '🇯🇵', name: 'Japan', slug: 'japanese-beauty' },
    { code: '🇬🇧', name: 'UK', slug: 'uk-beauty' },
    { code: '🇺🇸', name: 'USA', slug: 'usa-beauty' },
  ];

  return (
    <nav className="bg-white border-t border-b border-gray-200">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between py-3">
          <div className="flex items-center gap-6">
            {categories.map(cat => (
              <div 
                key={cat.id}
                className="relative"
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link 
                  href={`/category/${cat.slug}`}
                  className="text-sm font-medium text-gray-700 hover:text-pink-500 transition"
                >
                  {cat.name}
                </Link>

                {/* Mega Menu (if category has children) */}
                {hoveredCategory === cat.id && cat.children?.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 bg-white shadow-lg rounded-lg p-4 w-64 z-50">
                    {cat.children.map(child => (
                      <Link 
                        key={child.id}
                        href={`/category/${child.slug}`}
                        className="block py-2 px-3 text-sm text-gray-600 hover:bg-pink-50 hover:text-pink-600 rounded"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link href="/origins" className="flex items-center gap-2 text-sm font-medium">
              <span>Origins</span>
              <span className="text-xs">{origins.map(o => o.code).join(' ')}</span>
            </Link>

            <Link href="/brands" className="text-sm font-medium">Brands</Link>

            <Link href="/sale" className="text-sm font-medium text-pink-600">
              Sale <span className="bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full ml-1">Hot</span>
            </Link>

            <Link href="/new" className="text-sm font-medium text-gold-600">
              New <span className="bg-gold-100 text-gold-700 text-xs px-2 py-0.5 rounded-full ml-1">✨</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation - Hamburger */}
        <div className="md:hidden py-3">
          <button onClick={() => setMobileMenuOpen(true)} className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-sm font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-100 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
            <div className="p-4">
              <button onClick={() => setMobileMenuOpen(false)} className="mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <Link href="/shop" className="block py-3 px-4 bg-pink-500 text-white rounded-lg font-semibold mb-4">
                Shop All
              </Link>

              {categories.map(cat => (
                <Link 
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="block py-3 px-4 border-b border-gray-100"
                >
                  {cat.name}
                </Link>
              ))}

              <Link href="/sale" className="block py-3 px-4 text-pink-600 font-semibold border-b">Sale 🔥</Link>
              <Link href="/new" className="block py-3 px-4 text-gold-600 font-semibold">New ✨</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
```

---

### 1D — Footer with Trust Signals

**File:** `components/layout/Footer.tsx`

**Spec:**
```
Payment methods: bKash, Nagad, COD
Trust signals: 100% Authentic, Free Delivery ৳1000+
Quick links: About, Shipping, Returns, Authenticity, Contact
Social: Facebook, Instagram
```

**Code:**
```tsx
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-white mt-16">
      {/* Trust Strip */}
      <div className="border-b border-gray-700">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mb-3">
                ✓
              </div>
              <h3 className="font-semibold text-sm">100% Authentic</h3>
              <p className="text-xs text-gray-400 mt-1">Direct import guarantee</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center mb-3">
                🚚
              </div>
              <h3 className="font-semibold text-sm">Free Delivery</h3>
              <p className="text-xs text-gray-400 mt-1">Above ৳1,499</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                💵
              </div>
              <h3 className="font-semibold text-sm">Cash on Delivery</h3>
              <p className="text-xs text-gray-400 mt-1">Nationwide available</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                ↩️
              </div>
              <h3 className="font-semibold text-sm">7-Day Returns</h3>
              <p className="text-xs text-gray-400 mt-1">Unopened items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-sm mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/shop" className="hover:text-pink-400">All Products</Link></li>
              <li><Link href="/korean-beauty" className="hover:text-pink-400">Korean Beauty</Link></li>
              <li><Link href="/sale" className="hover:text-pink-400">Sale</Link></li>
              <li><Link href="/new" className="hover:text-pink-400">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-4">Help</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-pink-400">About Us</Link></li>
              <li><Link href="/shipping" className="hover:text-pink-400">Shipping Policy</Link></li>
              <li><Link href="/returns" className="hover:text-pink-400">Returns & Refund</Link></li>
              <li><Link href="/authenticity" className="hover:text-pink-400">Authenticity</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📧 support@e-mart.com.bd</li>
              <li>📱 +880-XXXX-XXXXXX</li>
              <li>📍 Dhaka, Bangladesh</li>
              <li><Link href="/contact" className="hover:text-pink-400">Contact Form</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-4">We Accept</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="bg-white px-3 py-1 rounded text-xs font-semibold text-pink-600">bKash</div>
              <div className="bg-white px-3 py-1 rounded text-xs font-semibold text-orange-600">Nagad</div>
              <div className="bg-white px-3 py-1 rounded text-xs font-semibold text-gray-600">COD</div>
            </div>

            <h3 className="font-bold text-sm mb-2">Follow Us</h3>
            <div className="flex gap-3">
              <a href="https://facebook.com/emartbd" className="text-gray-400 hover:text-pink-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://instagram.com/emartbd" className="text-gray-400 hover:text-pink-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} E-Mart BD. Direct-import beauty store | 100% Authentic | COD Nationwide Bangladesh
        </div>
      </div>
    </footer>
  );
}
```

---

## TASK 1 Verification Checklist

```bash
# 1. Build succeeds
npm run build

# 2. Utility bar visible
curl http://localhost:3000/ | grep "Free delivery"

# 3. Header has search and cart
curl -s http://localhost:3000/ | grep -o '<header'

# 4. Navigation loads categories
curl -s http://localhost:3000/ | grep -o 'Skincare\|Haircare\|Makeup'

# 5. Footer has payment methods
curl -s http://localhost:3000/ | grep -o 'bKash\|Nagad\|COD'

# 6. Mobile test
# Chrome DevTools → Mobile view → Test hamburger menu, search dropdown

# 7. Create checkpoint
/checkpoint "Task 1 complete: Global shell (utility bar, header, nav, footer)"
```

**If ALL pass → Proceed to Task 2 (Homepage)**

---

## TASK 2: Homepage Implementation

### 2A — Hero Section

**File:** `app/page.tsx` (update existing or create section)

**Spec:**
```
Hero: "Authentic Beauty, Directly Imported" — true for all 7 origins
CTA: Shop Now (primary pink), View Sale (outline)
Background: Subtle gradient, NO large image (performance)
```

**Code:**
```tsx
<section className="bg-gradient-to-br from-navy-950 via-navy-900 to-pink-950 text-white py-16 md:py-24">
  <div className="container mx-auto px-4 text-center">
    <h1 className="text-3xl md:text-5xl font-bold mb-4">
      Authentic Beauty, Directly Imported
    </h1>
    <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
      100% authentic Korean, Japanese, UK, USA, France, India & Bangladesh beauty products. 
      Free delivery above ৳1,499. Cash on delivery available.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link href="/shop" className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition">
        Shop Now
      </Link>
      <Link href="/sale" className="border-2 border-white hover:bg-white hover:text-navy-950 text-white px-8 py-3 rounded-lg font-semibold transition">
        View Sale 🔥
      </Link>
    </div>
  </div>
</section>
```

---

### 2B — Origin Chips

**Code:**
```tsx
<section className="py-8 bg-gray-50">
  <div className="container mx-auto px-4">
    <h2 className="text-center text-sm font-semibold text-gray-600 mb-4">Shop by Origin</h2>
    <div className="flex flex-wrap justify-center gap-3">
      {[
        { code: '🇰🇷', name: 'Korea', slug: 'korean-beauty' },
        { code: '🇯🇵', name: 'Japan', slug: 'japanese-beauty' },
        { code: '🇬🇧', name: 'UK', slug: 'uk-beauty' },
        { code: '🇺🇸', name: 'USA', slug: 'usa-beauty' },
        { code: '🇫🇷', name: 'France', slug: 'france-beauty' },
        { code: '🇮🇳', name: 'India', slug: 'india-beauty' },
        { code: '🇧🇩', name: 'Bangladesh', slug: 'bangladesh-beauty' },
      ].map(origin => (
        <Link 
          key={origin.slug}
          href={`/origin/${origin.slug}`}
          className="bg-white hover:bg-pink-50 border border-gray-200 rounded-full px-4 py-2 flex items-center gap-2 transition"
        >
          <span className="text-2xl">{origin.code}</span>
          <span className="text-sm font-medium">{origin.name}</span>
        </Link>
      ))}
    </div>
  </div>
</section>
```

---

### 2C — Product Showcases

**Requirements:**
- Flash Deals (limited time offers)
- Best Sellers (top rated products)
- New Arrivals (recent additions)
- Each section: 4-8 products in horizontal scroll on mobile, grid on desktop

**Code snippet (reusable component):**
```tsx
import ProductCard from '@/components/ProductCard';

export default function ProductShowcase({ title, products, link }) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <Link href={link} className="text-pink-500 hover:text-pink-600 font-medium text-sm">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## TASK 2 Verification

```bash
# 1. Hero visible
curl http://localhost:3000/ | grep "Authentic Beauty"

# 2. Origin chips present
curl -s http://localhost:3000/ | grep "🇰🇷\|🇯🇵\|🇬🇧"

# 3. Product showcases load
curl -s http://localhost:3000/ | grep "Best Sellers\|New Arrivals"

# 4. Lighthouse Performance
npx lighthouse http://localhost:3000 --only-categories=performance --view
# Target: Performance 85+

# 5. Create checkpoint
/checkpoint "Task 2 complete: Homepage (hero, origins, showcases)"
```

---

## ~~TASK 3: Shop & Category Pages with Pagination~~ ✅ COMPLETED

**Already done in previous Claude Code session** - See "ALREADY COMPLETED" section at top of file.

**Verification on VPS:**
```bash
# After deploying the branch, test:
curl http://5.189.188.229/shop | grep "Showing.*of.*products"
curl http://5.189.188.229/category/skincare | grep "Previous\|Next"

# Or test in browser:
# http://5.189.188.229/shop - Should show pagination controls
# http://5.189.188.229/category/skincare - Should show pagination
```

---

## TASK 4: Product Detail Page Enhancements

**File:** `app/product/[slug]/page.tsx`

**Add:**
1. **Breadcrumbs** (Home > Category > Product)
2. **Image gallery** (thumbnail + main image)
3. **Trust badges** (✓ Authentic, 🚚 Free delivery if >৳1,499, 💵 COD)
4. **Add to cart button** (pink, prominent)
5. **Stock status** (In stock / Out of stock)

**Code snippets:**

**Breadcrumbs:**
```tsx
import Breadcrumbs from '@/components/Breadcrumbs';

<Breadcrumbs items={[
  { label: 'Shop', href: '/shop' },
  { label: category.name, href: `/category/${category.slug}` },
  { label: product.name }
]} />
```

**Trust badges:**
```tsx
<div className="flex flex-wrap gap-3 mt-4">
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <span className="text-green-600">✓</span>
    <span>100% Authentic</span>
  </div>
  {product.price >= 1499 && (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="text-blue-600">🚚</span>
      <span>Free Delivery</span>
    </div>
  )}
  <div className="flex items-center gap-2 text-sm text-gray-600">
    <span className="text-orange-600">💵</span>
    <span>Cash on Delivery</span>
  </div>
</div>
```

---

## TASK 5: Mobile Responsiveness Audit

**Test pages (Chrome DevTools → Mobile):**
```
✓ Home: Hero text readable, chips don't overflow
✓ Shop: Grid becomes 2 columns, filters collapse to drawer
✓ Product: Image gallery stacks, add to cart button full-width
✓ Cart: Item list readable, checkout button sticky bottom
✓ Header: Hamburger works, search dropdown works
✓ Footer: Columns stack, payment badges don't break
```

**Breakpoints:**
- 375px (iPhone SE)
- 390px (iPhone 12)
- 428px (iPhone 14 Pro Max)
- 768px (iPad)
- 1024px (Desktop)

---

## Phase 1 Final Verification Checklist

```bash
# 0. FIRST: Verify pagination from previous session works
curl http://5.189.188.229/shop | grep "Showing"
curl http://5.189.188.229/category/skincare | grep "page="
# ✓ Should show pagination working

# 1. Build succeeds
npm run build
# ✓ Must show: Compiled successfully

# 2. All components render
curl http://localhost:3000/ | grep -o "Utility bar\|Header\|Navigation\|Footer\|Hero\|Origin"

# 3. Lighthouse scores
npx lighthouse http://localhost:3000 --view
# Target: Performance 85+, Accessibility 95+

# 4. Mobile friendly test
# Chrome DevTools → Device toolbar → Test all breakpoints

# 5. No console errors
# Open browser console → Should show no red errors

# 6. Cart/wishlist functional
# Add item to cart → Count badge updates
# Add to wishlist → Icon fills

# 7. Search works
# Type query → Shows results or "No results"

# 8. Navigation clickable
# Click category → Goes to category page
# Click hamburger → Opens mobile menu

# 9. Pagination still works (from previous session)
# Visit /shop → Click page 2 → Should load next 20 products
# Visit /category/skincare → Pagination should work
```

**If ALL pass:**
```bash
git add .
git commit -m "feat: Phase 1 complete - UI/UX foundation (global shell, homepage, pagination [done], mobile responsive)"
git push
/checkpoint "Phase 1 COMPLETE - Ready for Phase 2 (SEO)"
```

---

## Success Criteria

✅ **From Previous Session (Already Done):**
- ✅ Shop/category pagination working (up to 100 products per page)
- ✅ Sort functionality (Newest, Best Sellers, Top Rated, Price)
- ✅ Product count display ("Showing X-Y of Z")
- ✅ Error handling and empty states

✅ **To Be Completed in This Session:**
- ✅ Utility bar sticky and visible  
- ✅ Header with working search, cart badge, wishlist  
- ✅ Navigation with categories and mega-menu (desktop)  
- ✅ Footer with trust signals and payment methods  
- ✅ Homepage hero, origin chips, product showcases  
- ✅ Product detail page with breadcrumbs, trust badges  
- ✅ Mobile responsive (no horizontal scroll, readable text)  
- ✅ Lighthouse Performance 85+, Accessibility 95+  
- ✅ Build succeeds without errors  

**Expected outcome:** Score improvement **72 → 82** (UI foundation complete)

---

## Deployment Notes

**Current branch status:**
- `claude-code/seo-implementation` has pagination work (5 commits)
- This Phase 1 work should be added ON TOP of that branch
- Do NOT create a new branch - continue on `claude-code/seo-implementation`

**Deployment sequence:**
1. Deploy pagination work (already pushed) → Test on VPS
2. Add remaining UI work (Tasks 1, 2, 4, 5) → Test locally
3. Push to same branch → Deploy to VPS
4. Run final verification checklist
5. Proceed to Phase 2 (SEO)

---
