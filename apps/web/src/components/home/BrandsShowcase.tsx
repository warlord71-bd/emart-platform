'use client';

import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import type { WooProduct } from '@/lib/woocommerce';

interface Brand {
  id: number;
  name: string;
  logo?: string;
  slug: string;
}

interface BrandShowcaseItem extends Brand {
  products: WooProduct[];
}

interface BrandsShowcaseProps {
  brands: BrandShowcaseItem[];
  title?: string;
}

/**
 * Brands Showcase Component
 * Displays 5 popular brands with 2-3 products each in a single box
 */
export const BrandsShowcase: React.FC<BrandsShowcaseProps> = ({
  brands,
  title = 'Explore Top Brands',
}) => {
  return (
    <section className="bg-lumiere-background py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary">
            {title}
          </h2>
          <Link
            href="/brands"
            className="text-lumiere-primary hover:text-lumiere-primary-hover font-semibold text-sm md:text-base transition-colors"
          >
            See More Brands →
          </Link>
        </div>

        {/* Single Box Container */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow p-6 md:p-8">
          {/* 5 Brands Vertically */}
          <div className="space-y-8">
            {brands.slice(0, 5).map((brand) => (
              <div key={brand.id}>
                {/* Brand Name */}
                <h3 className="text-lg md:text-xl font-bold text-lumiere-text-primary mb-4">
                  {brand.name}
                </h3>

                {/* 2-3 Products Horizontally */}
                {brand.products && brand.products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {brand.products.slice(0, 3).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <p className="text-lumiere-text-secondary text-center py-4">
                    No products available
                  </p>
                )}
              </div>
            ))}

            {/* See More Brands CTA */}
            <div className="text-center pt-4 border-t border-gray-100">
              <Link
                href="/brands"
                className="inline-block text-lumiere-primary hover:text-lumiere-primary-hover font-semibold transition-colors"
              >
                See More Brands →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandsShowcase;
