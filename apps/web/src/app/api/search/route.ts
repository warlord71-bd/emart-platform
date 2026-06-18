import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/woocommerce';
import { searchByText } from '@/lib/qdrantSearch';

export const dynamic = 'force-dynamic';

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
      images: product.images.slice(0, 1).map((image) => ({
        ...image,
        alt: image.alt?.trim() || product.name,
      })),
      categories: getBestCategory(product.categories),
    }));

    if (suggestions.length >= 2) {
      return NextResponse.json(
        { products: suggestions, total },
        { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
      );
    }

    const qdrantResults = await searchByText(query, limit);
    const existingIds = new Set(suggestions.map((s) => s.id));
    const qdrantSuggestions = qdrantResults
      .filter((p) => !existingIds.has(p.product_id))
      .map((p) => ({
        id: p.product_id,
        name: p.name,
        slug: p.slug,
        price: String(p.price_bdt),
        sale_price: '',
        images: p.image_url ? [{ id: 0, src: p.image_url, alt: p.name }] : [],
        categories: [],
      }));

    const combined = [...suggestions, ...qdrantSuggestions].slice(0, limit);

    return NextResponse.json(
      { products: combined, total: Math.max(total, combined.length) },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ products: [], total: 0 }, { status: 500 });
  }
}
