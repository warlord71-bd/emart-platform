'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import type { WooProduct } from '@/lib/woocommerce';

interface Origin {
  name: string;
  emoji: string;
  slug: string;
  products: WooProduct[];
}

interface OriginShowcaseInteractiveProps {
  origins: Origin[];
  title?: string;
}

export const OriginShowcaseInteractive: React.FC<OriginShowcaseInteractiveProps> = ({
  origins,
  title = 'Shop by Origin',
}) => {
  const [selectedOriginSlug, setSelectedOriginSlug] = useState<string | null>(origins[0]?.slug || null);

  const selectedOrigin = origins.find(o => o.slug === selectedOriginSlug);

  return (
    <section className="bg-white py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="hidden md:flex items-center justify-center w-12 h-12 bg-blue-500 rounded-lg">
            <Globe size={24} className="text-white fill-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary">
            {title}
          </h2>
        </div>

        {/* Origin Chips - Horizontal scrollable, smaller buttons */}
        <div className="flex flex-nowrap gap-2 mb-8 overflow-x-auto pb-4 snap-x snap-mandatory">
          {origins.map((origin) => (
            <button
              key={origin.slug}
              onClick={() => setSelectedOriginSlug(origin.slug)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all snap-start flex items-center gap-2 ${
                selectedOriginSlug === origin.slug
                  ? 'bg-lumiere-primary text-white'
                  : 'bg-gray-100 text-lumiere-text-primary hover:bg-gray-200'
              }`}
            >
              <span className="text-lg">{origin.emoji}</span>
              {origin.name}
            </button>
          ))}
        </div>

        {/* Product Grid - Show 4 items per origin */}
        {selectedOrigin && selectedOrigin.products && selectedOrigin.products.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedOrigin.products.slice(0, 4).map((product) => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {selectedOrigin.products.length > 4 && (
              <div className="text-center mt-6">
                <a
                  href={`/shop?origin=${selectedOrigin.slug}`}
                  className="inline-block px-6 py-2 bg-lumiere-primary text-white font-semibold rounded-lg
                           hover:bg-lumiere-primary-hover transition-colors"
                >
                  View All {selectedOrigin.name} Products →
                </a>
              </div>
            )}
          </div>
        ) : selectedOrigin ? (
          <p className="text-center text-lumiere-text-secondary py-8">
            No products available for {selectedOrigin.name}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default OriginShowcaseInteractive;
