const QDRANT_URL = 'http://127.0.0.1:6333';
const QDRANT_KEY = process.env.QDRANT_API_KEY || '';
const COLLECTION = 'emart_products';

interface QdrantPayload {
  product_id: number;
  name: string;
  slug: string;
  brand: string;
  origin: string;
  category: string;
  price_bdt: number;
  stock_status: string;
  image_url: string;
}

interface QdrantPoint {
  id: string;
  vector?: number[];
  score?: number;
  payload: QdrantPayload;
}

async function qdrantFetch(method: string, path: string, body?: unknown) {
  const res = await fetch(`${QDRANT_URL}${path}`, {
    method,
    headers: { 'api-key': QDRANT_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result ?? null;
}

export async function getSimilarProducts(
  productId: number,
  limit = 4,
): Promise<QdrantPayload[]> {
  if (!QDRANT_KEY) return [];

  try {
    const scrollResult = await qdrantFetch('POST', `/collections/${COLLECTION}/points/scroll`, {
      filter: { must: [{ key: 'product_id', match: { value: productId } }] },
      limit: 1,
      with_vector: true,
      with_payload: false,
    });

    const points = scrollResult?.points as QdrantPoint[] | undefined;
    if (!points?.length || !points[0].vector) return [];

    const vector = points[0].vector;
    const sourceId = points[0].id;

    const searchResult = await qdrantFetch('POST', `/collections/${COLLECTION}/points/search`, {
      vector,
      limit: limit + 1,
      with_payload: true,
      score_threshold: 0.4,
      filter: {
        must_not: [{ has_id: [sourceId] }],
        must: [{ key: 'stock_status', match: { value: 'instock' } }],
      },
    });

    if (!searchResult || !Array.isArray(searchResult)) return [];

    return (searchResult as QdrantPoint[])
      .slice(0, limit)
      .map((p) => p.payload);
  } catch {
    return [];
  }
}
