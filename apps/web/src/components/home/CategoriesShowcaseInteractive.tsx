'use client';

import { useState } from 'react';
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

  return (
    <section className="bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header - Using Site Color Scheme */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary mb-4">
            {title}
          </h2>
          <p className="text-gray-500 text-sm">Best Sellers & Top Rated Products</p>
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

        {/* Products Grid - No Carousel, Just Grid */}
        {selectedCategory && selectedCategory.products && selectedCategory.products.length > 0 ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedCategory.products.slice(0, 4).map((product) => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {selectedCategory.products.length > 4 && (
              <div className="text-center mt-6">
                <a
                  href={`/shop?category=${selectedCategory.slug}`}
                  className="inline-block px-6 py-2 bg-lumiere-primary text-white font-semibold rounded-lg
                           hover:bg-lumiere-primary-hover transition-colors"
                >
                  View All in {selectedCategory.displayName} →
                </a>
              </div>
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
