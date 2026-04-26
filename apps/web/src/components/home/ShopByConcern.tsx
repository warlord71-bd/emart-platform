'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';
import HomeProductRail from '@/components/home/HomeProductRail';
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
    <section className="bg-canvas px-4 py-8 md:py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5 flex items-center gap-4 md:mb-6">
          <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink shadow-sm">
            <Target size={24} className="text-white" strokeWidth={1.5} />
          </div>
          <h2 className="type-section-title text-lumiere-text-primary">
            {title}
          </h2>
        </div>

        <div className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] md:mb-6 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 md:gap-3">
            {concerns.map(concern => (
              <button
                key={concern.slug}
                onClick={() => setSelectedConcern(concern.slug)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  selectedConcern === concern.slug
                    ? 'bg-accent text-white'
                    : 'border border-hairline bg-card text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent'
                }`}
              >
                <span className="text-base leading-none">{concern.emoji}</span>
                <span>{concern.name}</span>
              </button>
            ))}
          </div>
        </div>

        {currentConcern && currentConcern.products.length > 0 ? (
          <HomeProductRail
            products={currentConcern.products}
            viewAllHref={`/search?q=${currentConcern.slug}`}
            viewAllLabel={currentConcern.name}
          />
        ) : (
          <p className="py-8 text-center text-muted">
            No products available
          </p>
        )}
      </div>
    </section>
  );
};

export default ShopByConcern;
