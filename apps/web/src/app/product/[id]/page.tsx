import { getProductById, getProducts } from '@/lib/woocommerce';
import Link from 'next/link';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductInfo } from '@/components/product/ProductInfo';
import { ConcernTags } from '@/components/product/ConcernTags';
import { CollapsibleSection } from '@/components/product/CollapsibleSection';
import { RelatedProducts } from '@/components/product/RelatedProducts';

interface ProductPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getProductById(parseInt(params.id));
  if (!product) return {};

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

export const revalidate = 3600;

// Generate product-specific FAQ based on product data
function generateProductFAQ(product: any): string {
  const productName = product.name || 'product';
  const categories = product.categories?.map((c: any) => c.name.toLowerCase()) || [];
  const isSunscreen = categories.some((c: string) => c.includes('sunscreen') || c.includes('spf'));
  const isSerum = categories.some((c: string) => c.includes('serum') || c.includes('essence'));
  const isMoisturizer = categories.some((c: string) => c.includes('moisturizer'));
  const isCleanser = categories.some((c: string) => c.includes('cleanser') || c.includes('wash'));
  const hasAcneConcern = product.tags?.some((t: any) => t.name?.toLowerCase().includes('acne')) || productName.toLowerCase().includes('acne');
  const hasSensitiveConcern = product.tags?.some((t: any) => t.name?.toLowerCase().includes('sensitive')) || productName.toLowerCase().includes('sensitive');

  let faqContent = '';

  // Common question
  faqContent += `Q: Is ${productName} suitable for my skin type?\n`;
  if (hasSensitiveConcern) {
    faqContent += `A: Yes, ${productName} is specially formulated for sensitive skin and can be used by those with reactive or delicate skin types. However, always perform a patch test first.\n\n`;
  } else {
    faqContent += `A: ${productName} is designed for all skin types, but works especially well for combination and normal skin. If you have sensitive skin, we recommend testing on a small area first.\n\n`;
  }

  // Category-specific question
  if (isSunscreen) {
    faqContent += `Q: How often should I reapply ${productName}?\n`;
    faqContent += `A: We recommend reapplying every 2 hours, or more frequently if you're swimming or sweating. Reapply after water activities even if the product is water-resistant.\n\n`;
    faqContent += `Q: Can I use ${productName} under makeup?\n`;
    faqContent += `A: Yes, absolutely. Apply ${productName} as the last step of your morning skincare routine, wait 15 minutes, then apply primer and makeup as usual.\n\n`;
  } else if (isSerum) {
    faqContent += `Q: How should I use ${productName} in my routine?\n`;
    faqContent += `A: Apply ${productName} after cleansing and toning, but before moisturizer. Use 2-3 drops and gently pat into skin. Follow with your regular moisturizer.\n\n`;
  } else if (isMoisturizer) {
    faqContent += `Q: When should I use ${productName}?\n`;
    faqContent += `A: Use ${productName} twice daily - morning and night - after cleansing and applying any serums or treatments. This helps lock in moisture.\n\n`;
  } else if (isCleanser) {
    faqContent += `Q: How often should I use ${productName}?\n`;
    faqContent += `A: Use ${productName} twice daily in your morning and evening skincare routine. Adjust frequency based on your skin's needs.\n\n`;
  }

  // Concern-specific question
  if (hasAcneConcern) {
    faqContent += `Q: Will ${productName} help with acne?\n`;
    faqContent += `A: Yes, ${productName} is specifically designed to help manage acne-prone skin. Results typically appear within 2-4 weeks of consistent use. Continue regular use for best results.\n\n`;
  }

  // Compatibility question
  faqContent += `Q: Can I use ${productName} with other skincare products?\n`;
  faqContent += `A: Yes, ${productName} works well with other skincare products. For best results, use with complementary products from the same line or brand. Introduce one new product at a time to monitor results.\n\n`;

  // Results timeline
  faqContent += `Q: When will I see visible results from ${productName}?\n`;
  faqContent += `A: Most users notice improvements within 2-4 weeks of consistent daily use. Some may see results sooner, while others may need 6-8 weeks. Patience and consistency are key for skincare products.\n\n`;

  // Storage question
  faqContent += `Q: How should I store ${productName}?\n`;
  faqContent += `A: Store ${productName} in a cool, dry place away from direct sunlight. Keep the cap tightly closed. Avoid storing in the bathroom if exposed to excessive moisture and heat.`;

  return faqContent;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductById(parseInt(params.id));

  if (!product) {
    return (
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4 text-lumiere-text-primary">Product Not Found</h1>
          <Link href="/shop" className="text-lumiere-primary hover:underline font-medium">
            ← Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  // Fetch related products (same category)
  const relatedProducts = product.categories?.[0]
    ? (await getProducts({
        category: product.categories[0].id.toString(),
        per_page: 8,
        exclude: product.id.toString(),
      })).products.slice(0, 4)
    : [];

  // Generate Product Schema
  const brandName = 'Emart Skincare';
  const schemaObj: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'description': product.short_description || product.description?.replace(/<[^>]*>/g, '') || '',
    'image': product.images?.[0]?.src || '',
    'sku': `EM-${product.id}`,
    'brand': {
      '@type': 'Brand',
      'name': brandName,
    },
    'offers': {
      '@type': 'Offer',
      'url': `https://e-mart.com.bd/product/${product.id}`,
      'priceCurrency': 'BDT',
      'price': product.sale_price || product.price,
      'availability': product.stock_status === 'instock' ? 'InStock' : 'OutOfStock',
    },
  };

  // Add rating if available
  if (product.rating_count > 0) {
    schemaObj.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': parseFloat(product.average_rating),
      'ratingCount': product.rating_count,
    };
  }

  const productSchema = schemaObj;

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
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
                  title="FREQUENTLY ASKED QUESTIONS"
                  content={generateProductFAQ(product)}
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
