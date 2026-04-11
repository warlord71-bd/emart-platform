'use client';

import { useState } from 'react';
import ProductCard from '@/components/product/ProductCard';
import type { WooProduct } from '@/lib/woocommerce';

interface ConcernWithProducts {
  name: string;
  slug: string;
  emoji: string;
  products: WooProduct[];
}

interface ShopByConcernProps {
  concerns: ConcernWithProducts[];
  title?: string;
}

export const ShopByConcern: React.FC<ShopByConcernProps> = ({
  concerns,
  title = 'Shop by Concern',
}) => {
  const [selectedConcern, setSelectedConcern] = useState(concerns[0]?.slug || '');

  const currentConcern = concerns.find(c => c.slug === selectedConcern);

  return (
    <section className="bg-white py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="hidden md:flex items-center justify-center w-12 h-12 bg-purple-400 rounded-lg text-xl font-bold text-white">
            🎯
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary">
            {title}
          </h2>
        </div>

        {/* Concern Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {concerns.map(concern => (
            <button
              key={concern.slug}
              onClick={() => setSelectedConcern(concern.slug)}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedConcern === concern.slug
                  ? 'bg-lumiere-primary text-white'
                  : 'bg-gray-100 text-lumiere-text-primary hover:bg-gray-200'
              }`}
            >
              {concern.emoji} {concern.name}
            </button>
          ))}
        </div>

        {/* Product Grid - Removed carousel, using responsive grid */}
        {currentConcern && currentConcern.products.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentConcern.products.slice(0, 8).map(product => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {currentConcern.products.length > 8 && (
              <div className="text-center mt-6">
                <a
                  href={`/search?q=${currentConcern.slug}`}
                  className="inline-block px-6 py-2 bg-lumiere-primary text-white font-semibold rounded-lg
                           hover:bg-lumiere-primary-hover transition-colors"
                >
                  View All {currentConcern.name} →
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-lumiere-text-secondary py-8">
            No products available
          </p>
        )}
      </div>
    </section>
  );
};

export default ShopByConcern;
