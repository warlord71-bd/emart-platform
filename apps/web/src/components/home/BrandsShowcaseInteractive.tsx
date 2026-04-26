'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import HomeProductRail from '@/components/home/HomeProductRail';
import type { WooProduct } from '@/lib/woocommerce';

interface Brand {
  id: number;
  name: string;
  slug: string;
  products: WooProduct[];
}

interface BrandsShowcaseInteractiveProps {
  brands: Brand[];
  title?: string;
}

export const BrandsShowcaseInteractive: React.FC<BrandsShowcaseInteractiveProps> = ({
  brands,
  title = 'Shop by Brands',
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(brands[0]?.id || null);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  return (
    <section className="bg-canvas px-4 py-8 md:py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5 flex items-center gap-4 md:mb-6">
          <div className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink shadow-sm">
            <Building2 size={24} className="text-white" strokeWidth={1.5} />
          </div>
          <h2 className="type-section-title text-lumiere-text-primary">
            {title}
          </h2>
        </div>

        <div className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] md:mb-6 [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2 md:gap-3">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => setSelectedBrandId(brand.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  selectedBrandId === brand.id
                    ? 'bg-accent text-white'
                    : 'border border-hairline bg-card text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent'
                }`}
              >
                {brand.name}
              </button>
            ))}
          </div>
        </div>

        {selectedBrand && selectedBrand.products && selectedBrand.products.length > 0 ? (
          <HomeProductRail
            products={selectedBrand.products}
            viewAllHref={`/shop?brand=${selectedBrand.slug}`}
            viewAllLabel={selectedBrand.name}
          />
        ) : selectedBrand ? (
          <p className="py-8 text-center text-muted">
            No products available
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default BrandsShowcaseInteractive;
