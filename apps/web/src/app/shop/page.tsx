import { getProducts } from '@/lib/woocommerce';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';

export const metadata = {
  title: 'Shop Korean & Japanese Skincare | Emart',
  description: 'Browse our collection of authentic Korean and Japanese skincare products.',
};

export const revalidate = 3600;

const SKIN_CONCERNS = [
  { name: 'All Products', slug: '' },
  { name: 'Acne & Breakouts', slug: 'acne' },
  { name: 'Dry & Sensitive', slug: 'dry' },
  { name: 'Anti-Aging', slug: 'anti-aging' },
  { name: 'Dark Spots & Brightening', slug: 'dark-spots' },
  { name: 'Sensitivity', slug: 'sensitivity' },
];

interface ShopPageProps {
  searchParams: {
    page?: string;
    category?: string;
    concern?: string;
    sort?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const page = parseInt(searchParams.page || '1');
  const concern = searchParams.concern || '';

  const { products = [] } = await getProducts({
    page,
    per_page: 20,
    category: searchParams.category || '',
    search: concern || '',
    orderby: (searchParams.sort || 'date') as 'date' | 'price' | 'popularity' | 'rating',
  });

  const activeConcern = SKIN_CONCERNS.find(c => c.slug === concern);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg sticky top-20">
            <h3 className="font-bold text-lg mb-4 text-lumiere-text-primary">SKIN CONCERNS</h3>
            <div className="space-y-2">
              {SKIN_CONCERNS.map((c) => (
                <Link
                  key={c.slug || 'all'}
                  href={c.slug ? `/shop?concern=${c.slug}` : '/shop'}
                  className={`block py-2 px-3 rounded-lg transition-all ${
                    concern === c.slug || (!concern && c.slug === '')
                      ? 'bg-pink-500 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="md:col-span-3">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-lumiere-text-primary mb-2">
              {activeConcern ? activeConcern.name : 'All Products'}
            </h1>
            <p className="text-gray-500 text-sm">{products.length} products found</p>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
