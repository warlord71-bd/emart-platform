import { getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';

export const metadata = {
  title: 'Shop Korean & Japanese Skincare | Emart',
  description: 'Browse our collection of authentic Korean and Japanese skincare products.',
};

export const revalidate = 3600;

interface ShopPageProps {
  searchParams: {
    page?: string;
    category?: string;
    sort?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const page = parseInt(searchParams.page || '1');

  const { products = [] } = await getProducts({
    page,
    per_page: 20,
    category: searchParams.category || '',
    orderby: (searchParams.sort || 'date') as 'date' | 'price' | 'popularity' | 'rating',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-lumiere-text-primary mb-2">All Products</h1>
      <p className="text-gray-500 text-sm mb-8">{products.length} products found</p>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
  );
}
