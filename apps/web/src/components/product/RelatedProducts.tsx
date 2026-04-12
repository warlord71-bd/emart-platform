import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import type { WooProduct } from '@/lib/woocommerce';

interface RelatedProductsProps {
  products: WooProduct[];
  title?: string;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  products,
  title = 'YOU MIGHT ALSO LIKE',
}) => {
  if (!products || products.length === 0) return null;

  const hasMore = products.length > 4;

  return (
    <section className="py-12 border-t border-gray-200">
      <h2 className="text-2xl font-serif font-bold text-lumiere-text-primary mb-8">
        {title}
      </h2>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Products Grid - 4 items max */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, 4).map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Load More Button - Right Side (Desktop) or Bottom Right (Mobile) */}
        {hasMore && (
          <div className="flex md:items-center md:justify-center justify-end">
            <Link
              href="/shop"
              className="flex flex-col items-center gap-2 px-4 py-6 hover:opacity-80 transition-opacity"
            >
              <span className="text-3xl">→</span>
              <span className="text-xs font-semibold text-lumiere-text-secondary whitespace-nowrap">
                Load More
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
