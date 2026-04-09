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
        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary mb-8">
          {title}
        </h2>

        {/* Brand Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => setSelectedBrandId(brand.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedBrandId === brand.id
                  ? 'bg-lumiere-primary text-white'
                  : 'bg-gray-100 text-lumiere-text-primary hover:bg-gray-200'
              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>

        {/* Products for Selected Brand */}
        {selectedBrand && (
          <div className="bg-gray-50 rounded-xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-lumiere-text-primary mb-6">
              {selectedBrand.name}
            </h3>

            {selectedBrand.products && selectedBrand.products.length > 0 ? (
              <div className="space-y-4">
                {selectedBrand.products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg p-4">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-lumiere-text-secondary py-8">
                No products available for {selectedBrand.name}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default BrandsShowcaseInteractive;
