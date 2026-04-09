// src/app/page.tsx
import Link from 'next/link';
import { getFeaturedProducts, getSaleProducts, getProductsByBrand, getProductsByCategory, getCategories } from '@/lib/woocommerce';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoriesShowcaseInteractive } from '@/components/home/CategoriesShowcaseInteractive';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { ShopByConcern } from '@/components/home/ShopByConcern';
import { BrandsShowcaseInteractive } from '@/components/home/BrandsShowcaseInteractive';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emart — Premium Korean & Japanese Skincare in Bangladesh',
  description: 'Discover premium Korean and Japanese skincare at Emart. 100% authentic, fast delivery, COD available. Shop K-Beauty brands like COSRX, ISNTREE, and more.',
};

// Revalidate every hour
export const revalidate = 3600;

const CATEGORIES = [
  { name: 'Face Care', slug: 'face-care', emoji: '✨' },
  { name: 'Sunscreen', slug: 'sunscreen', emoji: '☀️' },
  { name: 'Serum & Toner', slug: 'serum-toner', emoji: '💧' },
  { name: 'Moisturizer', slug: 'moisturizer', emoji: '🧴' },
  { name: 'Cleanser', slug: 'cleanser', emoji: '🫧' },
  { name: 'Hair Care', slug: 'hair-care', emoji: '💆' },
  { name: 'Body Care', slug: 'body-care', emoji: '🌸' },
  { name: 'Makeup', slug: 'makeup', emoji: '💄' },
];

const SKIN_CONCERNS = [
  { name: 'Acne & Breakouts', slug: 'acne', emoji: '🔴', color: 'acne' as const },
  { name: 'Dry & Sensitive', slug: 'dry', emoji: '💧', color: 'dryness' as const },
  { name: 'Anti-Aging', slug: 'anti-aging', emoji: '✨', color: 'antiaging' as const },
  { name: 'Dark Spots', slug: 'dark-spots', emoji: '🌙', color: 'brightening' as const },
  { name: 'Sensitivity', slug: 'sensitivity', emoji: '🌿', color: 'sensitivity' as const },
];

const FEATURED_BRANDS = [
  { id: 1, name: 'CosRx', slug: 'cosrx' },
  { id: 2, name: 'Innisfree', slug: 'innisfree' },
  { id: 3, name: 'Jumiso', slug: 'jumiso' },
  { id: 4, name: 'ISNTREE', slug: 'isntree' },
  { id: 5, name: 'Cerave', slug: 'cerave' },
];

export default async function HomePage() {
  const categories = await getCategories({ per_page: 8, hide_empty: true });

  const [featured, onSale, ...allProducts] = await Promise.all([
    getFeaturedProducts(8),
    getSaleProducts(8),
    ...FEATURED_BRANDS.map(brand => getProductsByBrand(brand.slug, 5)),
    ...categories.map(cat => getProductsByCategory(cat.slug, 5)),
  ]);

  const brandProducts = allProducts.slice(0, FEATURED_BRANDS.length);
  const categoryProducts = allProducts.slice(FEATURED_BRANDS.length);

  return (
    <div className="bg-white">
      {/* ── HERO BANNER ── */}
      <HeroBanner
        title="Your Skin Deserves"
        subtitle="100% Authentic Korean & Japanese Skincare"
        description="Discover premium skincare from Korea and Japan. Fast delivery across Bangladesh, COD available, 100% authentic products."
        primaryCTA={{ text: 'Shop Now', href: '/shop' }}
        secondaryCTA={{ text: '🔥 View Sale', href: '/sale' }}
        trustBadges={['100% Authentic', 'COD Available', 'Fast Delivery', 'Easy Returns']}
      />

      {/* ── SHOP BY CATEGORY ── */}
      <CategoriesShowcaseInteractive
        categories={categories.map((cat, index) => ({
          ...cat,
          products: categoryProducts[index] || [],
        }))}
        title="Shop by Category"
      />

      {/* ── FEATURED PRODUCTS ── */}
      {featured.length > 0 && (
        <FeaturedProductsSection
          products={featured}
          title="Featured Products"
          subtitle="Curated selection of bestsellers"
          variant="featured"
        />
      )}

      {/* ── SHOP BY SKIN CONCERN ── */}
      <ShopByConcern concerns={SKIN_CONCERNS} title="Shop by Skin Concern" />

      {/* ── ON SALE ── */}
      {onSale.length > 0 && (
        <FeaturedProductsSection
          products={onSale}
          title="Flash Sale"
          subtitle="Limited time offers on premium brands"
          variant="sale"
        />
      )}

      {/* ── BRANDS SHOWCASE ── */}
      <BrandsShowcaseInteractive
        brands={FEATURED_BRANDS.map((brand, index) => ({
          ...brand,
          products: brandProducts[index] || [],
        }))}
        title="Shop by Brands"
      />

      {/* ── BANNER — B2B ── */}
      <section className="py-8 px-4 bg-lumiere-primary-light">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="text-xl font-semibold text-lumiere-text-primary">
              🏪 Wholesale / B2B?
            </h3>
            <p className="text-lumiere-text-secondary mt-1">
              Korean & Japanese cosmetics for retailers across Bangladesh
            </p>
          </div>
          <a
            href="https://kcoswbd.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-lumiere-primary hover:bg-lumiere-primary-hover text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 whitespace-nowrap"
          >
            Visit kcoswbd.com →
          </a>
        </div>
      </section>

      {/* ── WHY CHOOSE LUMIÈRE ── */}
      <section className="py-12 px-4 bg-lumiere-text-primary text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-10">
            Why Choose Emart?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: '✅',
                title: '100% Authentic',
                desc: 'Directly sourced from Korea & Japan',
              },
              {
                icon: '🚚',
                title: 'Fast Delivery',
                desc: 'Dhaka next day, nationwide 2-5 days',
              },
              {
                icon: '💵',
                title: 'COD Available',
                desc: 'Pay when you receive your order',
              },
              {
                icon: '↩️',
                title: 'Easy Returns',
                desc: 'Hassle-free return policy',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="text-4xl md:text-5xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
