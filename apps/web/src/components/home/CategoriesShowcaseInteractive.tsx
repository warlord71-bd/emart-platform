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

export const CategoriesShowcaseInteractive: React.FC<CategoriesShowcaseInteractiveProps> = ({
  categories,
  title = 'Shop by Category',
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(categories[0]?.id || null);
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleCategories = isExpanded ? categories : categories.slice(0, 6);
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <section className="bg-white py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary mb-8">
          {title}
        </h2>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedCategoryId === category.id
                  ? 'bg-lumiere-primary text-white'
                  : 'bg-gray-100 text-lumiere-text-primary hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}

          {!isExpanded && categories.length > 6 && (
            <button
              onClick={() => setIsExpanded(true)}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-100 text-lumiere-text-primary hover:bg-gray-200 transition-all"
            >
              → More
            </button>
          )}

          {isExpanded && categories.length > 6 && (
            <button
              onClick={() => setIsExpanded(false)}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-100 text-lumiere-text-primary hover:bg-gray-200 transition-all"
            >
              ← Less
            </button>
          )}
        </div>

        {/* Products for Selected Category */}
        {selectedCategory && selectedCategory.products && selectedCategory.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedCategory.products.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
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
