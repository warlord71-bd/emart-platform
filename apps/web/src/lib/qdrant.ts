import {
  QDRANT_COLLECTION,
  QDRANT_KEY,
  QDRANT_URL,
  fetchWithTimeout,
} from './aiServiceConfig';

export interface QdrantPayload {
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
  const res = await fetchWithTimeout(`${QDRANT_URL}${path}`, {
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
    const source = await getProductVector(productId);
    if (!source) return [];
    return vectorSearch(source.vector, [source.id], limit);
  } catch {
    return [];
  }
}

export async function getSimilarAndCrossSell(
  productId: number,
  similarCount = 4,
  crossSellCount = 4,
): Promise<{ similar: QdrantPayload[]; crossSell: QdrantPayload[] }> {
  if (!QDRANT_KEY) return { similar: [], crossSell: [] };

  try {
    const source = await getProductVector(productId);
    if (!source) return { similar: [], crossSell: [] };

    const similar = await vectorSearch(source.vector, [source.id], similarCount);
    const similarProductIds = similar.map((p) => p.product_id);

    const PRODUCT_TYPE_CATS = new Set([
      'face cleansers', 'serums, ampoules & essences', 'toners & mists',
      'moisturizers', 'sunscreen', 'sunscreens & sun care', 'masks & peels',
      'eye care', 'lip care', 'makeup', 'makeup cosmetics', 'fragrances',
      'hair care', 'bath & body', 'mother & baby care', 'health & wellbeing',
      'night cream',
    ]);

    const sourceTypeCats = new Set(
      source.payload.category
        .toLowerCase()
        .replace(/&amp;/g, '&')
        .split(',')
        .map((c) => c.trim())
        .filter((c) => PRODUCT_TYPE_CATS.has(c)),
    );

    const crossCandidates = await vectorSearch(
      source.vector,
      [source.id],
      crossSellCount + 12,
    );

    const sourceNameWords = new Set(
      source.payload.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
    );

    const crossSell = crossCandidates
      .filter((p) => {
        if (similarProductIds.includes(p.product_id)) return false;
        const pCats = p.category
          .toLowerCase()
          .replace(/&amp;/g, '&')
          .split(',')
          .map((c) => c.trim());
        const sharesTypeCat = sourceTypeCats.size > 0 && pCats.some((c) => sourceTypeCats.has(c));
        if (sharesTypeCat) return false;
        const pNameWords = p.name.toLowerCase().split(/\s+/);
        const nameOverlap = pNameWords.filter((w) => w.length > 3 && sourceNameWords.has(w)).length;
        if (nameOverlap >= 3) return false;
        return true;
      })
      .slice(0, crossSellCount);

    return { similar, crossSell };
  } catch {
    return { similar: [], crossSell: [] };
  }
}

async function getProductVector(productId: number) {
  const scrollResult = await qdrantFetch('POST', `/collections/${QDRANT_COLLECTION}/points/scroll`, {
    filter: { must: [{ key: 'product_id', match: { value: productId } }] },
    limit: 1,
    with_vector: true,
    with_payload: true,
  });
  const points = scrollResult?.points as QdrantPoint[] | undefined;
  if (!points?.length || !points[0].vector) return null;
  return { id: points[0].id, vector: points[0].vector, payload: points[0].payload };
}

async function vectorSearch(
  vector: number[],
  excludeIds: string[],
  limit: number,
) {
  const searchResult = await qdrantFetch('POST', `/collections/${QDRANT_COLLECTION}/points/search`, {
    vector,
    limit: limit + 1,
    with_payload: true,
    score_threshold: 0.35,
    filter: {
      must_not: [{ has_id: excludeIds }],
      must: [{ key: 'stock_status', match: { value: 'instock' } }],
    },
  });
  if (!searchResult || !Array.isArray(searchResult)) return [];
  return (searchResult as QdrantPoint[]).slice(0, limit).map((p) => p.payload);
}
