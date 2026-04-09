import Link from 'next/link';
import { LUMIERE_COLORS } from '@/lib/design-system/colors';

interface Concern {
  name: string;
  slug: string;
  emoji?: string;
  description?: string;
  color?: 'acne' | 'dryness' | 'brightening' | 'antiaging' | 'sensitivity';
}

interface ShopByConcernProps {
  concerns: Concern[];
  title?: string;
}

/**
 * Shop by Skin Concern Component
 * Tabbed/button interface for skin concern-based browsing
 */
export const ShopByConcern: React.FC<ShopByConcernProps> = ({
  concerns,
  title = 'Shop by Skin Concern',
}) => {
  const concernColorMap = {
    acne: { bg: 'bg-lumiere-secondary/10', border: 'border-lumiere-secondary', text: 'text-lumiere-secondary' },
    dryness: { bg: 'bg-lumiere-accent/10', border: 'border-lumiere-accent', text: 'text-lumiere-accent' },
    brightening: { bg: 'bg-lumiere-text-primary/10', border: 'border-lumiere-text-primary', text: 'text-lumiere-text-primary' },
    antiaging: { bg: 'bg-lumiere-primary/10', border: 'border-lumiere-primary', text: 'text-lumiere-primary' },
    sensitivity: { bg: 'bg-lumiere-secondary/10', border: 'border-lumiere-secondary', text: 'text-lumiere-secondary' },
  };

  return (
    <section className="bg-white py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary mb-8 md:mb-10">
          {title}
        </h2>

        {/* Concerns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {concerns.map((concern) => {
            const colorStyle = concern.color ? concernColorMap[concern.color] : concernColorMap.acne;

            return (
              <Link
                key={concern.slug}
                href={`/shop?concern=${concern.slug}`}
                className={`group flex flex-col items-center justify-center gap-3 p-4 md:p-5 rounded-xl border-2 transition-all duration-300 ${colorStyle.bg} ${colorStyle.border} hover:shadow-md`}
              >
                {/* Emoji/Icon */}
                {concern.emoji && (
                  <span className="text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-300">
                    {concern.emoji}
                  </span>
                )}

                {/* Concern Name */}
                <span className={`font-semibold text-sm md:text-base ${colorStyle.text}`}>
                  {concern.name}
                </span>

                {/* Description */}
                {concern.description && (
                  <span className="text-xs text-lumiere-text-secondary text-center group-hover:text-lumiere-text-primary transition-colors">
                    {concern.description}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 md:mt-10 text-center">
          <Link
            href="/shop"
            className="inline-block bg-lumiere-primary hover:bg-lumiere-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Explore All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ShopByConcern;
