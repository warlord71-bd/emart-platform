import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';

interface Brand {
  id: number;
  name: string;
  logo?: string;
  slug: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  regularPrice?: number;
  image?: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
}

interface BrandShowcaseItem extends Brand {
  products: Product[];
}

interface BrandsShowcaseProps {
  brands: BrandShowcaseItem[];
  title?: string;
}

/**
 * Brands Showcase Component
 * Displays popular brands with their top products
 */
export const BrandsShowcase: React.FC<BrandsShowcaseProps> = ({
  brands,
  title = 'Explore Brands',
}) => {
  return (
    <section className="bg-lumiere-background py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-lumiere-text-primary">
            {title}
          </h2>
          <Link
            href="/brands"
            className="text-lumiere-primary hover:text-lumiere-primary-hover font-semibold text-sm md:text-base transition-colors"
          >
            See All Brands →
          </Link>
        </div>

        {/* Brands */}
        <div className="space-y-10 md:space-y-12">
          {brands.slice(0, 5).map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Brand Header */}
              <div className="p-4 md:p-6 border-b border-lumiere-border-light">
                <div className="flex items-center gap-4">
                  {/* Brand Logo */}
                  {brand.logo && (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-12 md:h-14 object-contain"
                    />
                  )}
                  {/* Brand Name */}
                  <div>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-lumiere-text-primary">
                      {brand.name}
                    </h3>
                    <p className="text-sm text-lumiere-text-secondary">
                      {brand.products?.length || 0} Products
                    </p>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="p-4 md:p-6">
                {brand.products && brand.products.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                    {brand.products.slice(0, 10).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <p className="text-lumiere-text-secondary text-center py-8">
                    No products available
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 md:mt-12 text-center">
          <Link
            href="/brands"
            className="inline-block bg-lumiere-primary hover:bg-lumiere-primary-hover text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Discover More Brands
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BrandsShowcase;
