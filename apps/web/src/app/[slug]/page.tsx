// src/app/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getProduct, getProducts } from '@/lib/woocommerce';
import { AppDownloadBanner } from '@/components/product/AppDownloadBanner';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductInfo } from '@/components/product/ProductInfo';
import { ConcernTags } from '@/components/product/ConcernTags';
import { CollapsibleSection } from '@/components/product/CollapsibleSection';
import { RelatedProducts } from '@/components/product/RelatedProducts';

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

  // Fetch related products (same category)
  const relatedProducts = product.categories?.[0]
    ? (await getProducts({
        category: product.categories[0].id.toString(),
        per_page: 8,
        exclude: product.id.toString(),
      })).products.slice(0, 4)
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* MAIN CONTENT */}
      <div className="px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* BREADCRUMB */}
          <div className="text-sm text-lumiere-text-secondary mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-lumiere-primary">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-lumiere-primary">Shop</Link>
            <span>/</span>
            <span className="text-lumiere-text-primary">{product.name}</span>
          </div>

          {/* APP DOWNLOAD BANNER - AS STRIP BELOW BREADCRUMB */}
          <div className="mb-8">
            <AppDownloadBanner />
          </div>

          {/* PRODUCT SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12">
            {/* LEFT: PRODUCT IMAGE WITH GALLERY */}
            <div>
              <ProductImage images={product.images || []} productName={product.name} />
            </div>

            {/* RIGHT: PRODUCT INFO */}
            <div>
              <ProductInfo product={product} />
            </div>
          </div>

          {/* CONCERN TAGS */}
          {product.tags && product.tags.length > 0 && (
            <ConcernTags tags={product.tags} />
          )}

          {/* DESCRIPTION & COLLAPSIBLE SECTIONS */}
          <div className="py-12 border-t border-gray-200">
            <div className="max-w-3xl">
              {/* Main Description */}
              {product.description && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h2 className="text-2xl font-serif font-bold text-lumiere-text-primary mb-4">
                    Description
                  </h2>
                  <div
                    className="text-lumiere-text-secondary prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: product.description,
                    }}
                  />
                </div>
              )}

              {/* Collapsible Sections */}
              <div className="space-y-0">
                <CollapsibleSection
                  title="INGREDIENTS"
                  content={
                    product.attributes?.[0]?.options?.join(', ') ||
                    'Water, Salicylic Acid, Natural Extracts, Glycerin, and more.'
                  }
                />
                <CollapsibleSection
                  title="HOW TO USE"
                  content={
                    product.short_description ||
                    '1. Wet face with lukewarm water\n2. Apply product to face\n3. Massage gently for 30 seconds\n4. Rinse thoroughly with water'
                  }
                />
                <CollapsibleSection
                  title="FAQ"
                  content={
                    'Q: Is this product suitable for sensitive skin?\nA: Yes, this product is formulated for all skin types.\n\nQ: When will I see results?\nA: Results typically visible within 2-4 weeks of regular use.\n\nQ: Can I use this with other products?\nA: Yes, it works well in your skincare routine.'
                  }
                />
              </div>
            </div>
          </div>

          {/* RELATED PRODUCTS */}
          {relatedProducts.length > 0 && (
            <div className="py-12">
              <RelatedProducts products={relatedProducts} />
            </div>
          )}

          {/* TRUST BADGES - FOOTER */}
          <div className="bg-lumiere-text-primary text-white rounded-lg p-8 text-center">
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
