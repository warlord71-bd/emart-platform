'use client';

import { useState, useRef } from 'react';
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
  const carouselRef = useRef<HTMLDivElement>(null);

  const currentTab = tabs.find(t => t.id === selectedTab);

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

        {/* Product Carousel */}
        {currentTab && currentTab.products.length > 0 ? (
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
            >
              {currentTab.products.map(product => (
                <div key={product.id} className="flex-shrink-0 w-48 md:w-56 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {currentTab.products.length > 5 && (
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
