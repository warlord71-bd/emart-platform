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

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <section className="bg-white py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary mb-8">
          {title}
        </h2>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
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
        </div>

        {/* Products for Selected Category */}
        {selectedCategory && (
          <div className="bg-gray-50 rounded-xl p-6 md:p-8">
            <h3 className="text-2xl font-bold text-lumiere-text-primary mb-6">
              {selectedCategory.name}
            </h3>

            {selectedCategory.products && selectedCategory.products.length > 0 ? (
              <div className="space-y-4">
                {selectedCategory.products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg p-4">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-lumiere-text-secondary py-8">
                No products available in {selectedCategory.name}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesShowcaseInteractive;
