'use client';

import { useState } from 'react';
import { Flame } from 'lucide-react';
import HomeProductRail from '@/components/home/HomeProductRail';
import type { WooProduct } from '@/lib/woocommerce';

interface Tab {
  id: string;
  label: string;
  href: string;
  products: WooProduct[];
}

interface FlashSaleSectionProps {
  editorsChoice?: WooProduct[];
  bestSelling: WooProduct[];
  topRated: WooProduct[];
  onSale: WooProduct[];
  title?: string;
}

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({
  editorsChoice = [],
  bestSelling,
  topRated,
  onSale,
  title = 'Top Picks',
}) => {
  const tabs: Tab[] = [
    { id: 'editors-choice', label: 'Editors Choice', href: '/shop', products: editorsChoice },
    { id: 'best-selling', label: 'Best Selling', href: '/shop?sort=bestsellers', products: bestSelling },
    { id: 'top-rated', label: 'Top Rated', href: '/shop?sort=rating', products: topRated },
    { id: 'offer', label: 'Offer', href: '/offers/eid-offer', products: onSale },
  ];

  const [selectedTab, setSelectedTab] = useState(tabs[0]?.id || 'editors-choice');

  const currentTab = tabs.find(t => t.id === selectedTab);

  return (
    <section className="bg-canvas px-4 py-8 md:py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5 flex items-center gap-4 md:mb-6">
          <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink shadow-sm">
            <Flame size={24} className="text-white fill-white" />
          </div>
          <h2 className="type-section-title text-lumiere-text-primary">
            {title}
          </h2>
        </div>

        <div className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] md:mb-6 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 md:gap-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  selectedTab === tab.id
                    ? 'bg-accent text-white'
                    : 'border border-hairline bg-card text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {currentTab && currentTab.products.length > 0 ? (
          <HomeProductRail
            products={currentTab.products}
            viewAllHref={currentTab.href}
            viewAllLabel={currentTab.label}
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

export default FlashSaleSection;
