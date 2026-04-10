// src/app/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getProduct, getProducts } from '@/lib/woocommerce';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductInfo } from '@/components/product/ProductInfo';
import { DetailsTabs } from '@/components/product/DetailsTabs';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { CollapsibleSection } from '@/components/product/CollapsibleSection';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { MoreProductsFromBrand } from '@/components/product/MoreProductsFromBrand';
import { SectionHeader } from '@/components/product/SectionHeader';
import { BrandsCarousel } from '@/components/product/BrandsCarousel';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.name} | Emart — Premium K-Beauty`,
    description: product.description?.substring(0, 160) || product.short_description || 'Premium Korean & Japanese skincare product',
    openGraph: {
      title: product.name,
      description: product.short_description || 'Premium skincare product',
      images: product.images?.[0]?.src ? [{ url: product.images[0].src }] : [],
    },
  };
}

export async function generateStaticParams() {
  const { products } = await getProducts({ per_page: 100 });
  return products.map((p) => ({ slug: p.slug }));
}

export const revalidate = 3600;

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  // Fetch more products from same brand/category
  const brandProducts = product.categories?.[0]
    ? (await getProducts({
        category: product.categories[0].id.toString(),
        per_page: 8,
        exclude: product.id.toString(),
      })).products.slice(0, 4)
    : [];

  // Fetch recommended/related products (same category)
  const relatedProducts = product.categories?.[0]
    ? (await getProducts({
        category: product.categories[0].id.toString(),
        per_page: 8,
        exclude: product.id.toString(),
      })).products.slice(4, 8)
    : [];

  const brandName = product.categories?.[0]?.name || 'Emart';
  const ingredients = product.attributes?.[0]?.options?.join(', ') || 'Water, Salicylic Acid, Natural Extracts, Glycerin, and more.';
  const howToUse = product.short_description || '1. Wet face with lukewarm water\n2. Apply product to face\n3. Massage gently for 30 seconds\n4. Rinse thoroughly with water';

  return (
    <div className="min-h-screen bg-white">
      {/* MAIN CONTENT */}
      <div className="px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* BREADCRUMB */}
          <div className="text-sm text-lumiere-text-secondary mb-8 flex items-center gap-2">
            <Link href="/" className="hover:text-lumiere-primary">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-lumiere-primary">Shop</Link>
            <span>/</span>
            <span className="text-lumiere-text-primary">{product.name}</span>
          </div>

          {/* PRODUCT SECTION - 2 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
            {/* LEFT: PRODUCT IMAGE WITH GALLERY */}
            <div>
              <ProductImage images={product.images || []} productName={product.name} />
            </div>

            {/* RIGHT: PRODUCT INFO (includes Brand/Made In/Size, Title, Price, Description, Quantity, Buttons, Concern Tags, InfoBox, App Banner) */}
            <div>
              <ProductInfo product={product} />
            </div>
          </div>

          {/* DETAILS SECTION - Tabs (Description | Ingredients | How to use) */}
          <div className="py-8 border-t border-gray-200">
            <div className="max-w-4xl">
              <DetailsTabs
                description={product.description || ''}
                ingredients={ingredients}
                howToUse={howToUse}
              />
            </div>
          </div>

          {/* REVIEWS SECTION */}
          <div className="py-8 border-t border-gray-200">
            <div className="max-w-4xl">
              <ReviewsSection product={product} />
            </div>
          </div>

          {/* FAQ SECTION - Collapsible */}
          <div className="py-8 border-t border-gray-200">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-lumiere-text-primary mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-0">
                <CollapsibleSection
                  title="Is this product suitable for sensitive skin?"
                  content="Yes, this product is formulated for all skin types, including sensitive skin. It has been dermatologically tested."
                />
                <CollapsibleSection
                  title="When will I see results?"
                  content="Results typically become visible within 2-4 weeks of regular use. For best results, use consistently as directed."
                />
                <CollapsibleSection
                  title="Can I use this with other products?"
                  content="Yes, this product works well in your skincare routine and can be combined with complementary products."
                />
              </div>
            </div>
          </div>

          {/* MORE PRODUCTS FROM BRAND */}
          {brandProducts.length > 0 && (
            <div className="py-8 border-t border-gray-200">
              <SectionHeader title={`More Products from ${brandName}`} icon="🏢" seeAllLink={`/shop?brand=${brandName}`} />
              <MoreProductsFromBrand products={brandProducts} brandName={brandName} />
            </div>
          )}

          {/* RECOMMENDED FOR YOU / RELATED PRODUCTS */}
          {relatedProducts.length > 0 && (
            <div className="py-8 border-t border-gray-200">
              <SectionHeader title="Recommended for You" icon="⭐" seeAllLink="/shop" />
              <RelatedProducts products={relatedProducts} title="" />
            </div>
          )}

          {/* BRANDS CAROUSEL - PREFOOTER */}
          <div className="mt-8 border-t border-gray-200">
            <BrandsCarousel brands={[
              { id: 1, name: 'COSRX', logo: 'https://via.placeholder.com/128x64?text=COSRX' },
              { id: 2, name: 'ISNTREE', logo: 'https://via.placeholder.com/128x64?text=ISNTREE' },
              { id: 3, name: 'PURITO', logo: 'https://via.placeholder.com/128x64?text=PURITO' },
              { id: 4, name: 'SOME BY MI', logo: 'https://via.placeholder.com/128x64?text=SOMEBYMI' },
              { id: 5, name: 'LANEIGE', logo: 'https://via.placeholder.com/128x64?text=LANEIGE' },
            ]} />
          </div>

          {/* CUSTOMER TESTIMONIAL SECTION */}
          <div className="py-8 border-t border-gray-200">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-lumiere-text-primary mb-6">
                Customer Reviews
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-lumiere-text-secondary mb-2">⭐⭐⭐⭐⭐</p>
                  <p className="font-semibold text-lumiere-text-primary">Amazing Product!</p>
                  <p className="text-sm text-lumiere-text-secondary mt-2">This product has completely changed my skincare routine. Highly recommended!</p>
                </div>
              </div>
            </div>
          </div>

          {/* TRUST BADGES - AFTER TESTIMONIAL */}
          <div className="mt-8 bg-lumiere-text-primary text-white rounded-lg p-8 text-center border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm font-medium">100% Authentic</p>
              </div>
              <div>
                <p className="text-2xl mb-2">🚚</p>
                <p className="text-sm font-medium">Fast Delivery</p>
              </div>
              <div>
                <p className="text-2xl mb-2">💵</p>
                <p className="text-sm font-medium">COD Available</p>
              </div>
              <div>
                <p className="text-2xl mb-2">↩️</p>
                <p className="text-sm font-medium">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
