import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { searchProducts } from '@/lib/woocommerce';
import { searchByText } from '@/lib/qdrantSearch';
import { enhanceSearchQuery, getTrendingSearchTerms } from '@/lib/search/queryEnhance';

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

async function getDynamicTrending(limit: number): Promise<string[]> {
  const fallback = getTrendingSearchTerms(limit);
  try {
    const file = path.resolve(process.cwd(), '../../workspace/seo-review/search-trends.json');
    const { readFile } = await import('fs/promises');
    const parsed = JSON.parse(await readFile(file, 'utf8')) as {
      hot_queries?: Array<{ query?: string }>;
      all_trends?: Array<{ query?: string }>;
    };
    const terms = [...(parsed.hot_queries || []), ...(parsed.all_trends || [])]
      .map((item) => item.query?.trim())
      .filter((item): item is string => Boolean(item));
    return Array.from(new Set([...terms, ...fallback])).slice(0, limit);
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').trim();
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 6), 1), 10);
  const enhanced = enhanceSearchQuery(query);
  const trending = await getDynamicTrending(limit);

  if (query.length < 2) {
    return NextResponse.json({ products: [], total: 0, trending });
  }

  try {
    let { products, total } = await searchProducts(enhanced.searchQuery, 1, limit);
    if (products.length < 2 && enhanced.expandedQuery !== enhanced.searchQuery) {
      const expanded = await searchProducts(enhanced.expandedQuery, 1, limit);
      products = expanded.products;
      total = expanded.total;
    }
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
        {
          products: suggestions,
          total,
          correctedQuery: enhanced.correctedQuery,
          searchQuery: enhanced.searchQuery,
          language: enhanced.language,
          trending,
        },
        { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
      );
    }

    const qdrantResults = await searchByText(enhanced.expandedQuery, limit);
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
      {
        products: combined,
        total: Math.max(total, combined.length),
        correctedQuery: enhanced.correctedQuery,
        searchQuery: enhanced.searchQuery,
        language: enhanced.language,
        trending,
      },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ products: [], total: 0 }, { status: 500 });
  }
}
