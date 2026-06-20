import { NextRequest, NextResponse } from 'next/server';
import {
  QDRANT_COLLECTION,
  QDRANT_KEY,
  QDRANT_URL,
  fetchWithTimeout,
} from '@/lib/aiServiceConfig';

export const dynamic = 'force-dynamic';

interface QdrantPoint {
  id: string;
  score: number;
  payload: {
    product_id: number;
    name: string;
    slug: string;
    brand: string;
    origin: string;
    category: string;
    price_bdt: number;
    regular_price_bdt: number;
    stock_status: string;
    image_url: string;
    permalink: string;
  };
}

async function qdrantSearch(vector: number[], limit: number, filters?: Record<string, string>) {
  const body: Record<string, unknown> = {
    vector,
    limit,
    with_payload: true,
    score_threshold: 0.3,
  };
  if (filters && Object.keys(filters).length > 0) {
    body.filter = {
      must: Object.entries(filters).map(([key, value]) => ({
        key,
        match: { value },
      })),
    };
  }
  const res = await fetchWithTimeout(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/search`, {
    method: 'POST',
    headers: { 'api-key': QDRANT_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Qdrant ${res.status}`);
  const data = await res.json();
  return (data.result || []) as QdrantPoint[];
}

export async function POST(request: NextRequest) {
  if (!QDRANT_KEY) {
    return NextResponse.json({ error: 'Vector search not configured' }, { status: 503 });
  }

  try {
    const { vector, query_text, limit = 10, brand, category } = await request.json();

    if (!vector || !Array.isArray(vector)) {
      return NextResponse.json(
        { error: 'Request body must include a "vector" array (768-dim)' },
        { status: 400 }
      );
    }

    const filters: Record<string, string> = {};
    if (brand) filters.brand = brand;
    if (category) filters.category = category;

    const results = await qdrantSearch(vector, Math.min(limit, 50), filters);

    const products = results.map((r) => ({
      id: r.payload.product_id,
      name: r.payload.name,
      slug: r.payload.slug,
      brand: r.payload.brand,
      origin: r.payload.origin,
      category: r.payload.category,
      price: r.payload.price_bdt,
      regular_price: r.payload.regular_price_bdt,
      stock_status: r.payload.stock_status,
      image_url: r.payload.image_url,
      score: Math.round(r.score * 1000) / 1000,
    }));

    return NextResponse.json(
      { products, total: products.length, query_text: query_text || null },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
