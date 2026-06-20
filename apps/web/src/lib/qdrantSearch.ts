import type { QdrantPayload } from './qdrant';
import {
  QDRANT_COLLECTION,
  QDRANT_KEY,
  QDRANT_URL,
  fetchWithTimeout,
} from './aiServiceConfig';

async function qdrantPost(path: string, body: unknown) {
  const res = await fetchWithTimeout(`${QDRANT_URL}${path}`, {
    method: 'POST',
    headers: { 'api-key': QDRANT_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return (await res.json()).result ?? null;
}

export async function searchByText(
  query: string,
  limit = 6,
): Promise<QdrantPayload[]> {
  if (!QDRANT_KEY || !query) return [];

  try {
    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    if (words.length === 0) return [];

    const conditions = words.map((word) => ({
      should: [
        { key: 'name', match: { text: word } },
        { key: 'brand', match: { text: word } },
        { key: 'category', match: { text: word } },
        { key: 'origin', match: { text: word } },
      ],
    }));

    const result = await qdrantPost(`/collections/${QDRANT_COLLECTION}/points/scroll`, {
      filter: {
        must: [
          { key: 'stock_status', match: { value: 'instock' } },
          ...conditions,
        ],
      },
      limit,
      with_payload: true,
      with_vector: false,
    });

    return (result?.points ?? []).map((p: { payload: QdrantPayload }) => p.payload);
  } catch {
    return [];
  }
}

export async function getProductsForBlogContent(
  title: string,
  content: string,
  limit = 4,
): Promise<QdrantPayload[]> {
  if (!QDRANT_KEY) return [];

  const text = `${title} ${content}`
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .toLowerCase();

  const SKINCARE_TERMS = [
    'sunscreen', 'spf', 'moisturizer', 'moisturiser', 'serum', 'cleanser',
    'toner', 'essence', 'retinol', 'niacinamide', 'vitamin c', 'hyaluronic',
    'salicylic', 'glycolic', 'aha', 'bha', 'ceramide', 'peptide', 'collagen',
    'acne', 'blemish', 'dark spot', 'hyperpigmentation', 'wrinkle', 'anti-aging',
    'oily skin', 'dry skin', 'sensitive skin', 'dark circle',
    'face wash', 'face mask', 'sheet mask', 'eye cream', 'lip balm',
    'shampoo', 'conditioner', 'hair care', 'body lotion',
    'cosrx', 'cerave', 'innisfree', 'some by mi', 'the ordinary',
    'neutrogena', 'garnier', 'nivea', 'laneige', 'heimish',
  ];

  const found = SKINCARE_TERMS.filter((term) => text.includes(term));
  if (found.length === 0) return [];

  const searchTerms = found.slice(0, 4);

  const conditions = searchTerms.map((term) => ({
    should: [
      { key: 'name', match: { text: term } },
      { key: 'brand', match: { text: term } },
      { key: 'category', match: { text: term } },
    ],
  }));

  try {
    const result = await qdrantPost(`/collections/${QDRANT_COLLECTION}/points/scroll`, {
      filter: {
        must: [{ key: 'stock_status', match: { value: 'instock' } }],
        should: conditions,
      },
      limit,
      with_payload: true,
      with_vector: false,
    });

    return (result?.points ?? []).map((p: { payload: QdrantPayload }) => p.payload);
  } catch {
    return [];
  }
}
