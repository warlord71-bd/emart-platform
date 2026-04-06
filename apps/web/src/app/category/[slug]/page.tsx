import { getCategoryBySlug, getProducts } from '@/lib/woocommerce';
import ProductCard from '@/components/product/ProductCard';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) return { title: 'Category Not Found' };
  return {
    title: `${cat.name} — Korean & Japanese Skincare Bangladesh`,
    description: `Shop ${cat.name} products. Authentic Korean & Japanese skincare. COD available.`,
  };
}

export const revalidate = 3600;

export default async function CategoryPage({ params }: Props) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const { products, total } = await getProducts({
    category: category.id.toString(),
    per_page: 20,
    orderby: 'popularity',
    order: 'desc',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">{category.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{total} products</p>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p>No products in this category yet.</p>
          <a href="/shop" className="text-[#e8197a] hover:underline mt-2 block">Browse All</a>
        </div>
      )}
    </div>
  );
}
