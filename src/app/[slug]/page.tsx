// src/app/shop/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, getProducts } from '@/lib/woocommerce';
import ProductDetail from '@/components/product/ProductDetail';
import ProductCard from '@/components/product/ProductCard';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.name} — Price in Bangladesh`,
    description: (product.short_description?.replace(/<[^>]+>/g, '').substring(0, 160)) || product.name,
    openGraph: {
      images: [{ url: product.images[0]?.src || '' }],
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

  // Related products from same category
  const { products: related } = await getProducts({
    category: product.categories[0]?.id?.toString(),
    per_page: 4,
    exclude: [product.id].join(','),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ProductDetail product={product} />

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
