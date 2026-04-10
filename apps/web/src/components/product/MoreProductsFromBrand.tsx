import ProductCard from '@/components/product/ProductCard';
import Link from 'next/link';
import type { WooProduct } from '@/lib/woocommerce';

interface MoreProductsFromBrandProps {
  products: WooProduct[];
  brandName?: string;
}

export const MoreProductsFromBrand: React.FC<MoreProductsFromBrandProps> = ({
  products,
  brandName = 'This Brand',
}) => {
  if (!products || products.length === 0) return null;

  const hasMore = products.length > 4;

  return (
    <section className="py-12 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-lumiere-text-primary mb-8">
        More Products from {brandName}
      </h2>

      <div className="flex gap-8">
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

        {/* Load More Button - Right Side */}
        {hasMore && (
          <div className="flex items-center justify-center">
            <Link
              href={`/shop?brand=${brandName}`}
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

