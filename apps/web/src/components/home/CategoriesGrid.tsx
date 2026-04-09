import Link from 'next/link';
import { LUMIERE_COLORS } from '@/lib/design-system/colors';

interface Category {
  name: string;
  slug: string;
  emoji: string;
  description?: string;
}

interface CategoriesGridProps {
  categories: Category[];
  title?: string;
}

/**
 * Lumière Categories Grid Component
 * Shows product categories with emojis for easy browsing
 */
export const CategoriesGrid: React.FC<CategoriesGridProps> = ({
  categories,
  title = 'Shop by Category',
}) => {
  return (
    <section className="bg-lumiere-background py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary">
            {title}
          </h2>
          <Link
            href="/shop"
            className="text-lumiere-primary hover:text-lumiere-primary-hover font-semibold text-sm md:text-base transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group flex flex-col items-center justify-center gap-3 p-4 md:p-6 rounded-xl bg-white border-2 border-transparent hover:border-lumiere-primary hover:shadow-lg transition-all duration-300 text-center"
            >
              {/* Emoji Icon */}
              <span className="text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-300">
                {category.emoji}
              </span>

              {/* Category Name */}
              <span className="font-semibold text-lumiere-text-primary text-sm md:text-base group-hover:text-lumiere-primary transition-colors">
                {category.name}
              </span>

              {/* Description (optional) */}
              {category.description && (
                <span className="text-xs text-lumiere-text-secondary group-hover:text-lumiere-text-primary">
                  {category.description}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesGrid;
