'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import HomeProductRail from '@/components/home/HomeProductRail';
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
    <section className="bg-canvas px-4 py-8 md:py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5 flex items-center gap-4 md:mb-6">
          <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink shadow-sm">
            <Globe size={24} className="text-white fill-white" />
          </div>
          <h2 className="type-section-title text-lumiere-text-primary">
            {title}
          </h2>
        </div>

        <div className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] md:mb-6 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 md:gap-3">
            {origins.map((origin) => (
              <button
                key={origin.slug}
                onClick={() => setSelectedOriginSlug(origin.slug)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  selectedOriginSlug === origin.slug
                    ? 'bg-accent text-white'
                    : 'border border-hairline bg-card text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent'
                }`}
              >
                <span className="text-lg leading-none">{origin.emoji}</span>
                <span>{origin.name}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedOrigin && selectedOrigin.products && selectedOrigin.products.length > 0 ? (
          <HomeProductRail
            products={selectedOrigin.products}
            viewAllHref={`/origins?country=${selectedOrigin.slug}`}
            viewAllLabel={`${selectedOrigin.name} products`}
          />
        ) : selectedOrigin ? (
          <p className="py-8 text-center text-muted">
            No products available for {selectedOrigin.name}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default OriginShowcaseInteractive;
