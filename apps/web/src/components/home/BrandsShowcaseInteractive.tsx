'use client';

import { useState, useRef } from 'react';
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
  const carouselRef = useRef<HTMLDivElement>(null);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="bg-white py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary mb-8">
          {title}
        </h2>

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

        {/* Product Carousel */}
        {selectedBrand && selectedBrand.products && selectedBrand.products.length > 0 ? (
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
            >
              {selectedBrand.products.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-48 md:w-56 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {selectedBrand.products.length > 5 && (
              <>
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/3 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
                >
                  ←
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/3 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
                >
                  →
                </button>
              </>
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
