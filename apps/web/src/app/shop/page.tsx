import { Suspense } from 'react';
import Link from 'next/link';
import { searchProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';

interface ShopPageProps {
  searchParams: { q?: string; category?: string; brand?: string; minPrice?: string; maxPrice?: string; sort?: string; page?: string };
}

export const metadata = {
  title: 'Shop K-Beauty & J-Beauty | Emart',
  description: 'Shop premium Korean and Japanese skincare. 100% authentic, COD available.',
};

export const revalidate = 3600;

async function ShopContent({ searchParams }: ShopPageProps) {
  const { q = '', category = '', minPrice = '0', maxPrice = '10000', sort = 'popularity', page = '1' } = searchParams;
  const products = await searchProducts({ search: q, category, minPrice: parseInt(minPrice), maxPrice: parseInt(maxPrice), orderBy: sort, page: parseInt(page), perPage: 20 });

  return (
    <div className="flex gap-4 md:gap-6">
      <aside className="w-64 flex-shrink-0 hidden md:block"><ProductFilters /></aside>
      <main className="flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-lumiere-text-primary mb-2">{q ? `Search: "${q}"` : 'Shop All'}</h1>
          <p className="text-lumiere-text-secondary">{products?.length || 0} products</p>
        </div>
        {products?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-12"><p className="text-lumiere-text-secondary">No products found</p></div>
        )}
      </main>
    </div>
  );
}

export default function ShopPage({ searchParams }: ShopPageProps) {
  return (
    <div className="min-h-screen bg-lumiere-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
          <ShopContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
