'use client';

import { Star } from 'lucide-react';
import HomeProductRail from '@/components/home/HomeProductRail';
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
  const viewAllHref =
    variant === 'sale'
      ? '/shop?filter=sale'
      : variant === 'bestsellers'
        ? '/shop?sort=bestsellers'
        : '/shop?featured=true';

  return (
    <section className={`${style.bg} px-4 py-8 md:py-10`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-5 flex items-center gap-4 md:mb-6">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rose-500 shadow-sm">
              <Star size={24} className="text-white fill-white" />
            </div>
            <div>
              <h2 className={`type-section-title ${style.headerColor}`}>
                {title}
              </h2>
              {subtitle && (
                <p className="type-section-subtitle text-lumiere-text-secondary mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {products.length > 0 ? (
          <HomeProductRail
            products={products}
            viewAllHref={viewAllHref}
            viewAllLabel={title}
          />
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
