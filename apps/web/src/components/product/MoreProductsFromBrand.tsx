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
    <section>
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

