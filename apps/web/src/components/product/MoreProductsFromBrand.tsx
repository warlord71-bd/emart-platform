import ProductCard from '@/components/product/ProductCard';
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

  return (
    <section className="py-12 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-lumiere-text-primary mb-8">
        More Products from {brandName}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, 4).map((product) => (
          <div key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};
