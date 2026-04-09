import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import type { WooProduct } from '@/lib/woocommerce';

interface FeaturedProductsSectionProps {
  products: WooProduct[];
  title?: string;
  subtitle?: string;
  variant?: 'featured' | 'bestsellers' | 'sale';
}

/**
 * Featured Products Section Component
 * Shows curated products in a grid
 */
export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  products,
  title = 'Featured Products',
  subtitle,
  variant = 'featured',
}) => {
  const variantStyles = {
    featured: {
      bg: 'bg-white',
      headerColor: 'text-lumiere-text-primary',
    },
    bestsellers: {
      bg: 'bg-lumiere-background',
      headerColor: 'text-lumiere-text-primary',
    },
    sale: {
      bg: 'bg-lumiere-primary/5',
      headerColor: 'text-lumiere-primary',
    },
  };

  const style = variantStyles[variant];

  return (
    <section className={`${style.bg} py-12 md:py-16 px-4`}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <div>
            <h2 className={`text-3xl md:text-4xl font-serif font-bold ${style.headerColor}`}>
              {variant === 'sale' && '🔥 '}
              {title}
            </h2>
            {subtitle && (
              <p className="text-lumiere-text-secondary text-sm md:text-base mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <Link
            href={
              variant === 'sale'
                ? '/shop?filter=sale'
                : variant === 'bestsellers'
                  ? '/shop?sort=bestsellers'
                  : '/shop?featured=true'
            }
            className="text-lumiere-primary hover:text-lumiere-primary-hover font-semibold text-sm md:text-base transition-colors whitespace-nowrap"
          >
            View All →
          </Link>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lumiere-text-secondary">No products available</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProductsSection;
