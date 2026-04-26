'use client';

import { useState } from 'react';
import HomeProductRail from '@/components/home/HomeProductRail';
import type { WooProduct, WooCategory } from '@/lib/woocommerce';

// Helper to decode HTML entities
function decodeHtmlEntities(text: string): string {
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  // Fallback for server-side
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

interface CategoryWithProducts extends WooCategory {
  products: WooProduct[];
  displayName?: string;
}

interface CategoriesShowcaseInteractiveProps {
  categories: CategoryWithProducts[];
  title?: string;
}

function CategoryMark() {
  return (
    <div className="hidden h-12 w-12 shrink-0 grid-cols-2 gap-1.5 rounded-lg bg-accent/90 p-2 shadow-sm md:grid">
      <span className="rounded-[3px] bg-white/95" />
      <span className="rounded-[3px] bg-white/75" />
      <span className="rounded-[3px] bg-white/75" />
      <span className="rounded-[3px] bg-white/95" />
    </div>
  );
}

export const CategoriesShowcaseInteractive: React.FC<CategoriesShowcaseInteractiveProps> = ({
  categories,
  title = 'Shop By Category',
}) => {
  const normalizedCategories = categories.map((cat) => {
    const decodedName = decodeHtmlEntities(cat.displayName || cat.name);
    return { ...cat, displayName: decodedName };
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(normalizedCategories[0]?.id || null);
  const selectedCategory = normalizedCategories.find(c => c.id === selectedCategoryId) || normalizedCategories[0];

  return (
    <section className="bg-canvas px-4 py-8 md:py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5 flex items-center gap-4 md:mb-6">
          <CategoryMark />
          <h2 className="type-section-title text-lumiere-text-primary">
            {title}
          </h2>
        </div>

        <div className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] md:mb-6 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 md:gap-3">
            {normalizedCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                selectedCategoryId === category.id
                  ? 'bg-accent text-white'
                  : 'border border-hairline bg-card text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent'
              }`}
            >
              {category.displayName}
            </button>
            ))}
          </div>
        </div>

        {selectedCategory && selectedCategory.products && selectedCategory.products.length > 0 ? (
          <HomeProductRail
            products={selectedCategory.products}
            viewAllHref={`/category/${selectedCategory.slug}`}
            viewAllLabel={selectedCategory.displayName || selectedCategory.name}
          />
        ) : selectedCategory ? (
          <p className="py-8 text-center text-muted">
            No products available
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default CategoriesShowcaseInteractive;
