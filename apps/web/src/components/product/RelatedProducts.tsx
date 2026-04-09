import ProductCard from '@/components/product/ProductCard';
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

  return (
    <section className="py-12 border-t border-gray-200">
      <h2 className="text-2xl font-serif font-bold text-lumiere-text-primary mb-8">
        {title}
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
