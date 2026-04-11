'use client';

import { useState } from 'react';
import ProductCard from '@/components/product/ProductCard';
import type { WooProduct } from '@/lib/woocommerce';

interface Tab {
  id: string;
  label: string;
  products: WooProduct[];
}

interface FlashSaleSectionProps {
  bestSelling: WooProduct[];
  newArrivals: WooProduct[];
  onSale: WooProduct[];
  title?: string;
}

export const FlashSaleSection: React.FC<FlashSaleSectionProps> = ({
  bestSelling,
  newArrivals,
  onSale,
  title = 'Top Picks',
}) => {
  const tabs: Tab[] = [
    { id: 'best-selling', label: 'Best Selling', products: bestSelling },
    { id: 'new-arrivals', label: 'New Arrivals', products: newArrivals },
    { id: 'offer', label: 'Offer', products: onSale },
  ];

  const [selectedTab, setSelectedTab] = useState('best-selling');

  const currentTab = tabs.find(t => t.id === selectedTab);

  return (
    <section className="bg-white py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="hidden md:flex items-center justify-center w-12 h-12 bg-red-400 rounded-lg text-xl font-bold text-white">
            🔥
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary">
            {title}
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-lumiere-primary text-white'
                  : 'bg-gray-100 text-lumiere-text-primary hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product Grid - Removed carousel, using responsive grid */}
        {currentTab && currentTab.products.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentTab.products.slice(0, 8).map(product => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {currentTab.products.length > 8 && (
              <div className="text-center mt-6">
                <a
                  href={`/sale`}
                  className="inline-block px-6 py-2 bg-lumiere-primary text-white font-semibold rounded-lg
                           hover:bg-lumiere-primary-hover transition-colors"
                >
                  View All {currentTab && currentTab.label} →
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

export default FlashSaleSection;
