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

// Clean description to remove FAQ-like content
function cleanDescription(description: string): string {
  if (!description) return '';

  // Remove lines that look like FAQ format
  return description
    .split('\n')
    .filter(line => {
      const trimmed = line.toLowerCase().trim();
      // Remove FAQ-like lines
      if (trimmed.startsWith('q:') || trimmed.startsWith('question:')) return false;
      if (trimmed.startsWith('a:') || trimmed.startsWith('answer:')) return false;
      if (trimmed.match(/^\s*\d+\.\s+[A-Za-z]/)) return false; // Numbered lists
      if (trimmed.includes('✓') || trimmed.includes('✅')) return false; // Checkmarks
      if (trimmed.match(/^\s*[-•*]\s+/)) return false; // Bullet points
      return true;
    })
    .join('\n')
    .trim();
}

// Generate product-specific FAQ items
function generateProductFAQItems(product: any): Array<{ question: string; answer: string }> {
  const productName = product.name || 'product';
  const categories = product.categories?.map((c: any) => c.name.toLowerCase()) || [];
  const isSunscreen = categories.some((c: string) => c.includes('sunscreen') || c.includes('spf'));
  const isSerum = categories.some((c: string) => c.includes('serum') || c.includes('essence'));
  const isMoisturizer = categories.some((c: string) => c.includes('moisturizer'));
  const isCleanser = categories.some((c: string) => c.includes('cleanser') || c.includes('wash'));
  const hasAcneConcern = product.tags?.some((t: any) => t.name?.toLowerCase().includes('acne')) || productName.toLowerCase().includes('acne');
  const hasSensitiveConcern = product.tags?.some((t: any) => t.name?.toLowerCase().includes('sensitive')) || productName.toLowerCase().includes('sensitive');

  const items: Array<{ question: string; answer: string }> = [];

  // Common question
  items.push({
    question: `Is ${productName} suitable for my skin type?`,
    answer: hasSensitiveConcern
      ? `Yes, ${productName} is specially formulated for sensitive skin and can be used by those with reactive or delicate skin types. However, always perform a patch test first.`
      : `${productName} is designed for all skin types, but works especially well for combination and normal skin. If you have sensitive skin, we recommend testing on a small area first.`,
  });

  // Category-specific questions
  if (isSunscreen) {
    items.push({
      question: `How often should I reapply ${productName}?`,
      answer: `We recommend reapplying every 2 hours, or more frequently if you're swimming or sweating. Reapply after water activities even if the product is water-resistant.`,
    });
    items.push({
      question: `Can I use ${productName} under makeup?`,
      answer: `Yes, absolutely. Apply ${productName} as the last step of your morning skincare routine, wait 15 minutes, then apply primer and makeup as usual.`,
    });
  } else if (isSerum) {
    items.push({
      question: `How should I use ${productName} in my routine?`,
      answer: `Apply ${productName} after cleansing and toning, but before moisturizer. Use 2-3 drops and gently pat into skin. Follow with your regular moisturizer.`,
    });
  } else if (isMoisturizer) {
    items.push({
      question: `When should I use ${productName}?`,
      answer: `Use ${productName} twice daily - morning and night - after cleansing and applying any serums or treatments. This helps lock in moisture.`,
    });
  } else if (isCleanser) {
    items.push({
      question: `How often should I use ${productName}?`,
      answer: `Use ${productName} twice daily in your morning and evening skincare routine. Adjust frequency based on your skin's needs.`,
    });
  }

  // Concern-specific question
  if (hasAcneConcern) {
    items.push({
      question: `Will ${productName} help with acne?`,
      answer: `Yes, ${productName} is specifically designed to help manage acne-prone skin. Results typically appear within 2-4 weeks of consistent use. Continue regular use for best results.`,
    });
  }

  // Compatibility question
  items.push({
    question: `Can I use ${productName} with other skincare products?`,
    answer: `Yes, ${productName} works well with other skincare products. For best results, use with complementary products from the same line or brand. Introduce one new product at a time to monitor results.`,
  });

  // Results timeline
  items.push({
    question: `When will I see visible results from ${productName}?`,
    answer: `Most users notice improvements within 2-4 weeks of consistent daily use. Some may see results sooner, while others may need 6-8 weeks. Patience and consistency are key for skincare products.`,
  });

  // Storage question
  items.push({
    question: `How should I store ${productName}?`,
    answer: `Store ${productName} in a cool, dry place away from direct sunlight. Keep the cap tightly closed. Avoid storing in the bathroom if exposed to excessive moisture and heat.`,
  });

  return items;
}

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


          {/* REVIEWS SECTION */}
          <div className="py-8 border-t border-gray-200">
            <div className="max-w-4xl">
              <ReviewsSection product={product} />
            </div>
          </div>

          {/* FAQ SECTION - Product-Specific */}
          <div className="py-8 border-t border-gray-200">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-lumiere-text-primary mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-0">
                {generateProductFAQItems(product).map((item, index) => (
                  <CollapsibleSection
                    key={index}
                    title={item.question}
                    content={item.answer}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* MORE PRODUCTS FROM BRAND */}
          {brandProducts.length > 0 && (
            <div className="py-8 border-t border-gray-200">
              <MoreProductsFromBrand products={brandProducts} brandName={brandName} />
            </div>
          )}

          {/* RECOMMENDED FOR YOU / RELATED PRODUCTS */}
          {relatedProducts.length > 0 && (
            <div className="py-8 border-t border-gray-200">
              <RelatedProducts products={relatedProducts} title="Recommended for You" />
            </div>
          )}

          {/* TRUST BADGES - FOOTER */}
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
