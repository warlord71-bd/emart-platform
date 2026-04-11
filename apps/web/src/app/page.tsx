// src/app/page.tsx
import Link from 'next/link';
import { getFeaturedProducts, getSaleProducts, getProductsByBrand, getProductsByCategory, getCategories, getBestSellingProducts, getNewArrivals, getProducts } from '@/lib/woocommerce';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoriesShowcaseInteractive } from '@/components/home/CategoriesShowcaseInteractive';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { FlashSaleSection } from '@/components/home/FlashSaleSection';
import { ShopByConcern } from '@/components/home/ShopByConcern';
import { BrandsShowcaseInteractive } from '@/components/home/BrandsShowcaseInteractive';
import { BrandsCarousel } from '@/components/product/BrandsCarousel';
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
  { name: 'Acne & Breakouts', slug: 'acne', emoji: '🔴' },
  { name: 'Dry & Sensitive', slug: 'dry', emoji: '💧' },
  { name: 'Anti-Aging', slug: 'anti-aging', emoji: '✨' },
  { name: 'Dark Spots & Brightening', slug: 'dark-spots', emoji: '🌙' },
  { name: 'Sensitivity', slug: 'sensitivity', emoji: '🌿' },
];

const FEATURED_BRANDS = [
  { id: 1, name: 'Dabo', slug: 'dabo' },
  { id: 2, name: 'CosRx', slug: 'cosrx' },
  { id: 3, name: 'Cerave', slug: 'cerave' },
  { id: 4, name: 'Some By Mi', slug: 'some-by-mi' },
  { id: 5, name: 'Skin1004', slug: 'skin1004' },
  { id: 6, name: 'Purito', slug: 'purito' },
  { id: 7, name: 'Dear Klairs', slug: 'dear-klairs' },
  { id: 8, name: 'Dr.Althea', slug: 'dr-althea' },
  { id: 9, name: 'ANUA', slug: 'anua' },
  { id: 10, name: 'APLB', slug: 'aplb' },
];

const CAROUSEL_BRANDS = [
  { id: 1, name: 'COSRX', logo: 'https://via.placeholder.com/128x64?text=COSRX' },
  { id: 2, name: 'ISNTREE', logo: 'https://via.placeholder.com/128x64?text=ISNTREE' },
  { id: 3, name: 'PURITO', logo: 'https://via.placeholder.com/128x64?text=PURITO' },
  { id: 4, name: 'SOME BY MI', logo: 'https://via.placeholder.com/128x64?text=SOME+BY+MI' },
  { id: 5, name: 'LANEIGE', logo: 'https://via.placeholder.com/128x64?text=LANEIGE' },
  { id: 6, name: 'ANUA', logo: 'https://via.placeholder.com/128x64?text=ANUA' },
  { id: 7, name: 'DABO', logo: 'https://via.placeholder.com/128x64?text=DABO' },
  { id: 8, name: 'DR.G', logo: 'https://via.placeholder.com/128x64?text=DR.G' },
];

export default async function HomePage() {
  const categories = await getCategories({ per_page: 8, hide_empty: true });

  const [featured, onSale, bestSelling, newArrivals, ...allProducts] = await Promise.all([
    getFeaturedProducts(8),
    getSaleProducts(8),
    getBestSellingProducts(8),
    getNewArrivals(8),
    ...FEATURED_BRANDS.map(brand => getProductsByBrand(brand.name, 5)),
    ...categories.map(cat => getProductsByCategory(cat.id, 5)),
    ...SKIN_CONCERNS.map(concern => getProducts({ search: concern.slug, per_page: 8 }).then(r => r.products)),
  ]);

  const brandProducts = allProducts.slice(0, FEATURED_BRANDS.length);
  const categoryProducts = allProducts.slice(FEATURED_BRANDS.length, FEATURED_BRANDS.length + categories.length);
  const concernProducts = allProducts.slice(FEATURED_BRANDS.length + categories.length);

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

      {/* ── TOP PICKS (FLASH SALE) ── */}
      <FlashSaleSection
        bestSelling={bestSelling}
        newArrivals={newArrivals}
        onSale={onSale}
        title="Top Picks"
      />

      {/* ── SHOP BY SKIN CONCERN ── */}
      <ShopByConcern
        concerns={SKIN_CONCERNS.map((concern, index) => ({
          ...concern,
          products: concernProducts[index] || [],
        }))}
        title="Shop by Concern"
      />

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

      {/* ── PREFOOTER SECTION ── */}

      {/* BRANDS CAROUSEL */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <BrandsCarousel brands={CAROUSEL_BRANDS} />
        </div>
      </section>

      {/* CUSTOMER TESTIMONIALS */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="hidden md:flex items-center justify-center w-12 h-12 bg-amber-400 rounded-lg text-xl font-bold text-white">
              💬
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-center text-lumiere-text-primary">
              What Our Customers Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                text: "Amazing Product! This product has completely changed my skincare routine. Highly recommended!",
                author: "Fatima R.",
                rating: 5,
              },
              {
                text: "Fast delivery and authentic products. The quality is excellent and price is competitive. Will order again!",
                author: "Rahman K.",
                rating: 5,
              },
              {
                text: "Best K-Beauty products in Bangladesh. Customer service was helpful and delivery was on time. 10/10!",
                author: "Asha T.",
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-3">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4">"{testimonial.text}"</p>
                <p className="font-semibold text-lumiere-text-primary">{testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE EMART ── */}
      <section className="py-8 px-4 bg-lumiere-text-primary text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="hidden md:flex items-center justify-center w-12 h-12 bg-green-400 rounded-lg text-xl font-bold text-white">
              ✨
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold">
              Why Choose Emart?
            </h2>
          </div>
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
