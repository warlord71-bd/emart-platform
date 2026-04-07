// src/app/brands/page.tsx
import Link from 'next/link';
import { getBrands } from '@/lib/woocommerce';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop by Brand — Emart Skincare Bangladesh',
  description: 'Explore authentic Korean & Japanese skincare brands. Lion Pair, I\'m From, COSRX, and more. Shop by your favorite brand.',
};

export const revalidate = 3600;

// Brand logo: use SVG file if exists, else colored letter fallback
function BrandLogo({ name, slug }: { name: string; slug: string }) {
  const colors = [
    '#FF6B9D', '#C44569', '#FFA07A', '#FFB6C1',
    '#DDA0DD', '#EE82EE', '#BA55D3', '#9370DB',
    '#8A2BE2', '#4169E1', '#1E90FF', '#00BFFF',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  const svgPath = `/images/brands/${slug}.svg`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={svgPath}
      alt={name}
      className="w-full h-28 object-contain rounded-lg"
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = 'none';
        const fallback = target.nextElementSibling as HTMLElement;
        if (fallback) fallback.style.display = 'flex';
      }}
    />
  );
}

function BrandLogoFallback({ name, bgColor }: { name: string; bgColor: string }) {
  return (
    <div
      className="w-full h-28 rounded-lg items-center justify-center text-white font-bold text-3xl hidden"
      style={{ backgroundColor: bgColor, display: 'none' }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

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
                    <div className="mb-4 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                      <BrandLogo name={brand.name} slug={brand.slug} />
                      <BrandLogoFallback name={brand.name} bgColor={['#FF6B9D','#C44569','#FFA07A','#DDA0DD','#9370DB','#4169E1'][brand.name.charCodeAt(0) % 6]} />
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
