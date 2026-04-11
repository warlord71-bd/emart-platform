'use client';

import { useState } from 'react';
import ProductCard from '@/components/product/ProductCard';
import type { WooProduct } from '@/lib/woocommerce';

interface Category {
  id: number;
  name: string;
  slug: string;
  emoji?: string;
}

interface BestSellersByCategoryProps {
  categories: Array<Category & { products: WooProduct[] }>;
}

export const BestSellersByCategory: React.FC<BestSellersByCategoryProps> = ({ categories }) => {
  const [selectedCategory, setSelectedCategory] = useState(0);

  if (!categories || categories.length === 0) return null;

  const activeCategory = categories[selectedCategory];
  const products = activeCategory.products.slice(0, 4);

  return (
    <section className="py-8 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header - Curved Yellow Banner Style */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-yellow-300 to-yellow-200 rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              Best Sellers by Category
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

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(index)}
              className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all
                ${
                  selectedCategory === index
                    ? 'bg-lumiere-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {category.emoji} {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid - 4 Items Max */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No products available in this category</p>
          </div>
        )}

        {/* View All Link for Category */}
        <div className="text-center mt-6">
          <a
            href={`/shop?category=${activeCategory.slug}`}
            className="inline-block px-6 py-2 bg-lumiere-primary text-white font-semibold rounded-lg
                     hover:bg-lumiere-primary-hover transition-colors"
          >
            View All {activeCategory.name} →
          </a>
        </div>
      </div>
    </section>
  );
};
