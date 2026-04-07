// src/app/brands/page.tsx
import Link from 'next/link';
import { getBrands } from '@/lib/woocommerce';
import BrandImage from '@/components/brand/BrandImage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop by Brand — Emart Skincare Bangladesh',
  description: 'Explore authentic Korean & Japanese skincare brands. Lion Pair, I\'m From, COSRX, and more. Shop by your favorite brand.',
};

export const revalidate = 3600;


export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="min-h-screen pb-20">
      {/* ── HERO SECTION ── */}
      <section className="bg-gradient-to-br from-[#1a1a2e] via-[#2d1b40] to-[#1a1a2e] text-white py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
            🏢 Shop by <span className="text-[#e8197a]">Brand</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto">
            Discover your favorite Korean & Japanese beauty brands. All products are 100% authentic and directly sourced.
          </p>
        </div>
      </section>

      {/* ── BRANDS GRID ── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title mb-8">All Brands ({brands.length})</h2>

          {brands.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg overflow-hidden border-2 border-transparent
                                hover:border-[#e8197a] transition-all shadow-sm hover:shadow-lg
                                p-4 h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="mb-4 flex-shrink-0">
                      <BrandImage slug={brand.slug} name={brand.name} />
                    </div>

                    {/* Brand Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <h3 className="font-bold text-sm md:text-base text-[#1a1a2e]
                                   group-hover:text-[#e8197a] transition-colors line-clamp-2">
                        {brand.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500 mt-2">
                        {brand.productCount} {brand.productCount === 1 ? 'product' : 'products'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No brands found yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── INFO SECTION ── */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-6">Why Choose Our Brands?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-bold text-[#1a1a2e] mb-2">100% Authentic</h3>
              <p className="text-gray-600 text-sm">Directly sourced from official Korean & Japanese distributors</p>
            </div>
            <div>
              <div className="text-4xl mb-3">🔬</div>
              <h3 className="font-bold text-[#1a1a2e] mb-2">Verified Products</h3>
              <p className="text-gray-600 text-sm">Every product verified for authenticity and quality</p>
            </div>
            <div>
              <div className="text-4xl mb-3">💯</div>
              <h3 className="font-bold text-[#1a1a2e] mb-2">Expert Selection</h3>
              <p className="text-gray-600 text-sm">Carefully selected brands trusted by skincare enthusiasts</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
