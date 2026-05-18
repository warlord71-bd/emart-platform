import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';

// Old/redirect categories that should not appear as product labels
const SKIP_CATEGORY_SLUGS = new Set([
  'k-beauty-j-beauty',
  'skincare-essentials',
  'uncategorized',
  'korean-beauty',
  'concern-cats',
  'all-products',
]);

function getBestCategory(categories: { id: number; name: string; slug: string }[]) {
  const good = categories.find((c) => !SKIP_CATEGORY_SLUGS.has(c.slug));
  return good ? [good] : [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 6), 1), 10);

  if (query.length < 2) {
    return NextResponse.json({ products: [], total: 0 });
  }

  try {
    const { products, total } = await searchProducts(query, 1, limit);
    const suggestions = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: product.sale_price,
      images: product.images.slice(0, 1),
      categories: getBestCategory(product.categories),
    }));

    return NextResponse.json(
      { products: suggestions, total },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ products: [], total: 0 }, { status: 500 });
  }
}
