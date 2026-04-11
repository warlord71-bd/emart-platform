'use client';

import { useState } from 'react';
import ProductCard from '@/components/product/ProductCard';
import type { WooProduct } from '@/lib/woocommerce';

interface Brand {
  id: number;
  name: string;
  slug: string;
  products: WooProduct[];
}

interface BrandsShowcaseInteractiveProps {
  brands: Brand[];
  title?: string;
}

export const BrandsShowcaseInteractive: React.FC<BrandsShowcaseInteractiveProps> = ({
  brands,
  title = 'Shop by Brands',
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(brands[0]?.id || null);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  return (
    <section className="bg-white py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="hidden md:flex items-center justify-center w-12 h-12 bg-blue-400 rounded-lg text-xl font-bold text-white">
            🏢
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary">
            {title}
          </h2>
        </div>

        {/* Brand Tabs - Horizontal scrollable, smaller buttons */}
        <div className="flex flex-nowrap gap-2 mb-8 overflow-x-auto pb-4 snap-x snap-mandatory">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setSelectedBrandId(brand.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all snap-start ${
                selectedBrandId === brand.id
                  ? 'bg-lumiere-primary text-white'
                  : 'bg-gray-100 text-lumiere-text-primary hover:bg-gray-200'
              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>

        {/* Product Grid - Changed from carousel to grid layout */}
        {selectedBrand && selectedBrand.products && selectedBrand.products.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedBrand.products.slice(0, 10).map((product) => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {selectedBrand.products.length > 10 && (
              <div className="text-center mt-6">
                <a
                  href={`/shop?brand=${selectedBrand.slug}`}
                  className="inline-block px-6 py-2 bg-lumiere-primary text-white font-semibold rounded-lg
                           hover:bg-lumiere-primary-hover transition-colors"
                >
                  View All {selectedBrand.name} →
                </a>
              </div>
            )}
          </div>
        ) : selectedBrand ? (
          <p className="text-center text-lumiere-text-secondary py-8">
            No products available
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default BrandsShowcaseInteractive;
