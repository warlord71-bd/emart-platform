'use client';

import { useState, useRef } from 'react';
import ProductCard from '@/components/product/ProductCard';
import type { WooProduct, WooCategory } from '@/lib/woocommerce';

interface CategoryWithProducts extends WooCategory {
  products: WooProduct[];
}

interface CategoriesShowcaseInteractiveProps {
  categories: CategoryWithProducts[];
  title?: string;
}

// Category name mapping for display
const CATEGORY_NAME_MAP: Record<string, string> = {
  'Serums, Ampoules & Essences': 'Serum / Ampoule',
  'Sunscreens & Sun Care': 'Sunscreen',
  'Face Cleansers': 'Cleanser',
  'Toner & Mists': 'Toner',
  'Korean Beauty': '',
  'K-Beauty & J-Beauty': '',
};

export const CategoriesShowcaseInteractive: React.FC<CategoriesShowcaseInteractiveProps> = ({
  categories,
  title = 'Shop by Category',
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(categories[0]?.id || null);
  const [isExpanded, setIsExpanded] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Filter out Korean Beauty categories and map display names
  const filteredCategories = categories
    .filter(cat => !['Korean Beauty', 'K-Beauty & J-Beauty'].includes(cat.name))
    .map(cat => ({
      ...cat,
      displayName: CATEGORY_NAME_MAP[cat.name] || cat.name,
    }))
    .filter(cat => cat.displayName); // Remove empty display names

  const visibleCategories = isExpanded ? filteredCategories : filteredCategories.slice(0, 6);
  const selectedCategory = filteredCategories.find(c => c.id === selectedCategoryId);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header - Curved Yellow Banner Style */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-300 to-yellow-200 rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-2xl">✨</span>
              {title}
            </h2>
            <a
              href="/shop"
              className="text-gray-800 hover:text-gray-900 font-semibold text-sm md:text-base flex items-center gap-1 whitespace-nowrap"
            >
              See All
              <span>→</span>
            </a>
          </div>
        </div>

        {/* Category Tabs - Smaller buttons to fit more */}
        <div className="flex flex-wrap gap-2 mb-8">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                selectedCategoryId === category.id
                  ? 'bg-lumiere-primary text-white'
                  : 'bg-gray-100 text-lumiere-text-primary hover:bg-gray-200'
              }`}
            >
              {category.displayName}
            </button>
          ))}

          {!isExpanded && filteredCategories.length > 6 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 text-lumiere-text-primary hover:bg-gray-200 transition-all"
            >
              →
            </button>
          )}

          {isExpanded && filteredCategories.length > 6 && (
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 text-lumiere-text-primary hover:bg-gray-200 transition-all"
            >
              ←
            </button>
          )}
        </div>

        {/* Product Carousel */}
        {selectedCategory && selectedCategory.products && selectedCategory.products.length > 0 ? (
          <div className="relative">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
            >
              {selectedCategory.products.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-48 md:w-56 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {selectedCategory.products.length > 5 && (
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
        ) : selectedCategory ? (
          <p className="text-center text-lumiere-text-secondary py-8">
            No products available
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default CategoriesShowcaseInteractive;
