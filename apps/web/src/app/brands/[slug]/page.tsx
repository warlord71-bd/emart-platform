// src/app/brands/[slug]/page.tsx
import Link from 'next/link';
import { getBrands, getProductsByBrand } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brandName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${brandName} — Emart Skincare Bangladesh`,
    description: `Shop authentic ${brandName} skincare products at Emart. 100% genuine, fast delivery, COD available.`,
  };
}

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((brand) => ({
    slug: brand.slug,
  }));
}

export const revalidate = 3600;

function BrandLogoPlaceholder({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    '#FF6B9D', '#C44569', '#FFA07A', '#FFB6C1',
    '#DDA0DD', '#EE82EE', '#BA55D3', '#9370DB',
    '#8A2BE2', '#4169E1', '#1E90FF', '#00BFFF',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className="w-32 h-32 rounded-lg flex items-center justify-center text-white font-bold text-5xl"
      style={{ backgroundColor: bgColor }}
    >
      {initial}
    </div>
  );
}

export default async function BrandPage({ params }: PageProps) {
  const { slug } = await params;
  const brandName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const { products } = await getProductsByBrand(brandName);

  return (
    <div className="min-h-screen pb-20">
      {/* ── BREADCRUMB ── */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-[#e8197a]">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/brands" className="text-gray-600 hover:text-[#e8197a]">Brands</Link>
            <span className="text-gray-400">/</span>
            <span className="text-[#e8197a] font-medium">{brandName}</span>
          </div>
        </div>
      </div>

      {/* ── BRAND HEADER ── */}
      <section className="py-12 px-4 bg-gradient-to-br from-[#fce7f0] to-[#fff0f6]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <BrandLogoPlaceholder name={brandName} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a1a2e] mb-2">
                {brandName}
              </h1>
              <p className="text-gray-600 mb-4">
                {products.length} authentic {brandName} skincare {products.length === 1 ? 'product' : 'products'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-600">
                  ✅ 100% Authentic
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-600">
                  🚚 Fast Delivery
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-xs font-medium text-gray-600">
                  💵 COD Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {products.length > 0 ? (
            <>
              <h2 className="section-title mb-8">Products from {brandName}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">No Products Yet</h2>
              <p className="text-gray-600 mb-6">We don't have any products from {brandName} in stock yet.</p>
              <Link href="/shop" className="btn-primary inline-block">
                Continue Shopping →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      {products.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-[#1a1a2e] mb-4">Can't Find What You're Looking For?</h2>
            <p className="text-gray-600 mb-6">Browse all our skincare products or explore other brands</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/shop" className="btn-primary">
                Shop All Products →
              </Link>
              <Link href="/brands" className="btn-outline">
                Browse All Brands
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
