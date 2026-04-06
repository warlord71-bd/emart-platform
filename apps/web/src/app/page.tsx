// src/app/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { getCategories, getFeaturedProducts, getSaleProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emart Skincare Bangladesh — Korean & Japanese Beauty',
  description: "Bangladesh's #1 Korean & Japanese skincare destination. 100% authentic, COD available, fast delivery.",
};

// Revalidate every hour
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

export default async function HomePage() {
  const [featured, onSale] = await Promise.all([
    getFeaturedProducts(8),
    getSaleProducts(8),
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
              Bangladesh's #1 destination for genuine K-Beauty & J-Beauty.
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

          {/* Hero Image */}
          <div className="flex-shrink-0 relative">
            <div className="w-72 h-72 md:w-96 md:h-96 relative">
              <Image
                src="/images/hero-products.png"
                alt="Korean Skincare Products"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SHOP BY CATEGORY ── */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center justify-center gap-2
                           py-5 px-3 rounded-xl border-2 border-transparent
                           hover:border-[#e8197a] hover:shadow-md transition-all
                           group text-center"
                style={{ background: cat.color }}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {cat.emoji}
                </span>
                <span className="text-sm font-semibold text-[#1a1a2e]">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      {featured.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">Featured Products</h2>
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

      {/* ── BANNER — B2B ── */}
      <section className="py-8 px-4 bg-[#fce7f0]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center
                        justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-[#1a1a2e]">🏪 Wholesale / B2B?</h3>
            <p className="text-gray-600 mt-1">Korean & Japanese cosmetics for retailers across Bangladesh</p>
          </div>
          <a
            href="https://kcoswbd.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary whitespace-nowrap"
          >
            Visit kcoswbd.com →
          </a>
        </div>
      </section>

      {/* ── ON SALE ── */}
      {onSale.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">🔥 On Sale</h2>
              <Link href="/sale" className="text-[#e8197a] font-semibold text-sm hover:underline">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {onSale.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY EMART ── */}
      <section className="py-12 px-4 bg-[#1a1a2e] text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">Why Choose Emart?</h2>
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
