// src/app/page.tsx
import Link from 'next/link';
import { getFeaturedProducts, getSaleProducts, getNewArrivals, getProducts } from '@/lib/woocommerce';
import BrandImage from '@/components/brand/BrandImage';
import ShopByCategoryTabs from '@/components/home/ShopByCategoryTabs';
import ProductCard from '@/components/product/ProductCard';
import FlashDealsTimer from '@/components/home/FlashDealsTimer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emart Skincare Bangladesh — Korean & Japanese Beauty',
  description: "Bangladesh's #1 Korean & Japanese skincare destination. 100% authentic, COD available, fast delivery.",
};

export const revalidate = 3600;

const CATEGORIES = [
  { name: 'Face Care', slug: 'face-care', emoji: '✨', color: '#fce7f0' },
  { name: 'Sunscreen', slug: 'sunscreen', emoji: '☀️', color: '#fff7ed' },
  { name: 'Serum & Toner', slug: 'serum-toner', emoji: '💧', color: '#eff6ff' },
  { name: 'Moisturizer', slug: 'moisturizer', emoji: '🧴', color: '#f0fdf4' },
  { name: 'Cleanser', slug: 'cleanser', emoji: '🫧', color: '#f5f3ff' },
  { name: 'Hair Care', slug: 'hair-care', emoji: '💆', color: '#fff1f2' },
  { name: 'Body Care', slug: 'body-care', emoji: '🌸', color: '#fefce8' },
  { name: 'Makeup', slug: 'makeup', emoji: '💄', color: '#fdf4ff' },
];

const BRANDS = [
  { name: 'COSRX', slug: 'cosrx', abbr: 'CX', color: '#eff6ff', textColor: '#1e40af' },
  { name: 'Laneige', slug: 'laneige', abbr: 'LG', color: '#eff6ff', textColor: '#0369a1' },
  { name: 'Innisfree', slug: 'innisfree', abbr: 'IF', color: '#f0fdf4', textColor: '#166534' },
  { name: 'Some By Mi', slug: 'some-by-mi', abbr: 'SBM', color: '#fefce8', textColor: '#92400e' },
  { name: 'Missha', slug: 'missha', abbr: 'MS', color: '#f5f3ff', textColor: '#6d28d9' },
  { name: 'Isntree', slug: 'isntree', abbr: 'IT', color: '#f0fdf4', textColor: '#065f46' },
  { name: 'Bioderma', slug: 'bioderma', abbr: 'BD', color: '#eff6ff', textColor: '#1e40af' },
  { name: 'Garnier', slug: 'garnier', abbr: 'GN', color: '#f0fdf4', textColor: '#166534' },
  { name: 'Jumiso', slug: 'jumiso', abbr: 'JU', color: '#fefce8', textColor: '#b45309' },
  { name: 'Banila Co', slug: 'banila-co', abbr: 'BC', color: '#fdf4ff', textColor: '#7c3aed' },
  { name: 'The Ordinary', slug: 'the-ordinary', abbr: 'TO', color: '#f9fafb', textColor: '#111827' },
  { name: 'Cetaphil', slug: 'cetaphil', abbr: 'CF', color: '#eff6ff', textColor: '#1d4ed8' },
  { name: 'CeraVe', slug: 'cerave', abbr: 'CV', color: '#f0fdf4', textColor: '#065f46' },
  { name: 'Hada Labo', slug: 'hada-labo', abbr: 'HL', color: '#fff7ed', textColor: '#c2410c' },
  { name: 'Maybelline', slug: 'maybelline', abbr: 'MB', color: '#fff1f2', textColor: '#be123c' },
  { name: 'Skinfood', slug: 'skinfood', abbr: 'SF', color: '#fefce8', textColor: '#92400e' },
  { name: 'JNH', slug: 'jnh', abbr: 'JN', color: '#fee2e2', textColor: '#991b1b' },
  { name: 'Simple', slug: 'simple', abbr: 'SM', color: '#f0fdf4', textColor: '#166534' },
  { name: 'Vanicream', slug: 'vanicream', abbr: 'VC', color: '#eff6ff', textColor: '#1d4ed8' },
  { name: 'Revolution', slug: 'revolution-skincare', abbr: 'RV', color: '#f5f3ff', textColor: '#6d28d9' },
];

const CONCERNS = [
  { name: 'Acne & Breakouts', slug: 'acne', emoji: '🔴', color: '#fee2e2' },
  { name: 'Dark Spots', slug: 'dark-spots', emoji: '🌑', color: '#f3e8ff' },
  { name: 'Dry Skin', slug: 'dry-skin', emoji: '💧', color: '#dbeafe' },
  { name: 'Oily Skin', slug: 'oily-skin', emoji: '✨', color: '#fef9c3' },
  { name: 'Anti-Aging', slug: 'anti-aging', emoji: '⏳', color: '#fce7f0' },
  { name: 'Sun Protection', slug: 'sun-protection', emoji: '☀️', color: '#fff7ed' },
  { name: 'Sensitive Skin', slug: 'sensitive-skin', emoji: '🌸', color: '#fce7f3' },
  { name: 'Pore Care', slug: 'pore-care', emoji: '🔍', color: '#ecfdf5' },
];

export default async function HomePage() {
  const [featured, onSale, newArrivals, firstCatProducts] = await Promise.all([
    getFeaturedProducts(8),
    getSaleProducts(8),
    getNewArrivals(8),
    getProducts({ category: 'face-care', per_page: 10 }).then(r => r.products).catch(() => []),
  ]);

  return (
    <div>
      {/* ── HERO BANNER ── */}
      <section className="bg-gradient-to-br from-[#1a1a2e] via-[#2d1b40] to-[#1a1a2e]
                          text-white py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[#e8197a]/20 border border-[#e8197a]/30
                            px-4 py-1.5 rounded-full text-sm font-medium text-[#e8197a] mb-4">
              🇰🇷 100% Authentic Korean & Japanese Skincare
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 text-white">
              Your Skin Deserves
              <span className="text-[#e8197a]"> The Best</span>
            </h1>
            <p className="text-gray-300 text-base md:text-lg mb-8 max-w-lg">
              Bangladesh&apos;s #1 destination for genuine K-Beauty & J-Beauty.
              Fast delivery, COD available, 100% authentic.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/shop" className="btn-primary text-center">
                Shop Now →
              </Link>
              <Link href="/sale" className="btn-outline text-center bg-transparent text-white border-white hover:bg-white hover:text-[#1a1a2e]">
                🔥 View Sale
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3 mt-8 justify-center md:justify-start">
              {['100% Authentic', 'COD Available', 'Fast Delivery', 'Easy Returns'].map((b) => (
                <span key={b} className="flex items-center gap-1.5 text-xs font-medium
                                         bg-white/10 px-3 py-1.5 rounded-full text-gray-300">
                  <span className="w-1.5 h-1.5 bg-[#e8197a] rounded-full"></span>
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Hero Visual */}
          <div className="flex-shrink-0">
            <div className="w-72 h-72 md:w-80 md:h-80 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6">
              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  { emoji: '🧴', name: 'COSRX', color: '#fce7f0' },
                  { emoji: '💧', name: 'Laneige', color: '#eff6ff' },
                  { emoji: '✨', name: 'Innisfree', color: '#f0fdf4' },
                  { emoji: '🌿', name: 'Some By Mi', color: '#fefce8' },
                ].map((b) => (
                  <div key={b.name} className="rounded-xl p-3 flex flex-col items-center gap-1" style={{ background: b.color + '33' }}>
                    <span className="text-3xl">{b.emoji}</span>
                    <span className="text-white text-xs font-semibold text-center">{b.name}</span>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <div className="text-white/80 text-xs">🇰🇷 K-Beauty · 🇯🇵 J-Beauty</div>
                <div className="text-[#e8197a] font-bold text-sm mt-1">100% Authentic</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 1. NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">🆕 New Arrivals</h2>
              <Link href="/new-arrivals" className="text-[#e8197a] font-semibold text-sm hover:underline">
                See All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {newArrivals.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 2. FLASH DEALS ── */}
      {onSale.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
              <div className="flex items-center gap-3">
                <h2 className="section-title">⚡ Flash Deals</h2>
                <FlashDealsTimer />
              </div>
              <Link href="/sale" className="text-[#e8197a] font-semibold text-sm hover:underline">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {onSale.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 3. SHOP BY CATEGORY (tabbed) ── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title mb-6">🛍️ Shop by Category</h2>
          <ShopByCategoryTabs
            categories={CATEGORIES}
            initialProducts={firstCatProducts}
          />
        </div>
      </section>

      {/* ── 4. SHOP BY CONCERN ── */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title mb-2">Shop by Concern</h2>
          <p className="text-gray-500 text-sm mb-8">Find products for your skin type</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {CONCERNS.map((concern) => (
              <Link
                key={concern.slug}
                href={`/shop?search=${encodeURIComponent(concern.name.split(' & ')[0])}`}
                className="flex items-center gap-3 py-4 px-4 rounded-xl border-2 border-transparent
                           hover:border-[#e8197a] hover:shadow-md transition-all group"
                style={{ background: concern.color }}
              >
                <span className="text-2xl">{concern.emoji}</span>
                <span className="text-sm font-semibold text-[#1a1a2e] group-hover:text-[#e8197a] transition-colors">
                  {concern.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. SHOP BY BRAND ── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">Shop by Brand</h2>
            <Link href="/brands" className="text-[#e8197a] font-semibold text-sm hover:underline">
              All Brands →
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {BRANDS.map((brand) => (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="flex flex-col items-center rounded-xl border border-gray-200
                           hover:border-[#e8197a] hover:shadow-md transition-all group overflow-hidden bg-white"
              >
                <BrandImage
                  slug={brand.slug}
                  name={brand.name}
                  bgColor={brand.color}
                  textColor={brand.textColor}
                  abbr={brand.abbr}
                />
                <span className="text-xs font-bold text-[#1a1a2e] group-hover:text-[#e8197a] transition-colors py-2 px-2 text-center">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FEATURED PRODUCTS ── */}
      {featured.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">⭐ Featured Products</h2>
              <Link href="/shop?featured=true" className="text-[#e8197a] font-semibold text-sm hover:underline">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY EMART ── */}
      <section className="py-12 px-4 bg-[#1a1a2e] text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-white">Why Choose Emart?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '✅', title: '100% Authentic', desc: 'Directly sourced from Korea & Japan' },
              { icon: '🚚', title: 'Fast Delivery', desc: 'Dhaka next day, nationwide 2-5 days' },
              { icon: '💵', title: 'COD Available', desc: 'Pay when you receive your order' },
              { icon: '↩️', title: 'Easy Returns', desc: 'Hassle-free return policy' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-white mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
