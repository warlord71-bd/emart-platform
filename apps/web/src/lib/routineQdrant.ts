import type { QdrantPayload } from './qdrant';
import type { SkinQuizAnswers, SkinQuizProduct, SkinQuizProductPools, SkinConcern } from './skinQuiz';

const QDRANT_URL = 'http://127.0.0.1:6333';
const QDRANT_KEY = process.env.QDRANT_API_KEY || '';
const EMBED_URL = 'http://127.0.0.1:8077/embed';
const RERANK_URL = 'http://127.0.0.1:8077/rerank';
const COLLECTION = 'emart_products';

async function embed(text: string): Promise<number[] | null> {
  try {
    const res = await fetch(EMBED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    return (await res.json() as { vector: number[] }).vector;
  } catch { return null; }
}

async function qdrantSearch(vector: number[], categoryFilter: string[], limit: number): Promise<QdrantPayload[]> {
  const filter: Record<string, unknown> = {
    must: [{ key: 'stock_status', match: { value: 'instock' } }],
  };
  if (categoryFilter.length) {
    (filter.must as unknown[]).push({
      should: categoryFilter.map((cat) => ({ key: 'category', match: { text: cat } })),
    });
  }

  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION}/points/search`, {
      method: 'POST',
      headers: { 'api-key': QDRANT_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ vector, limit, with_payload: true, score_threshold: 0.25, filter }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.result || []).map((r: { payload: QdrantPayload }) => r.payload);
  } catch { return []; }
}

async function rerank(query: string, items: QdrantPayload[], topK: number): Promise<QdrantPayload[]> {
  if (items.length <= 1) return items;
  try {
    const documents = items.map((p) => `${p.name} — ${p.brand} ${p.category}`);
    const res = await fetch(RERANK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, documents, top_k: topK }),
    });
    if (!res.ok) return items.slice(0, topK);
    const data = await res.json() as { results: { index: number }[] };
    return data.results.map((r) => items[r.index]).filter(Boolean);
  } catch { return items.slice(0, topK); }
}

function toQuizProduct(p: QdrantPayload): SkinQuizProduct {
  return {
    id: p.product_id,
    name: p.name,
    slug: p.slug,
    price: String(p.price_bdt),
    regular_price: String(p.price_bdt),
    sale_price: '',
    on_sale: false,
    purchasable: p.stock_status === 'instock',
    stock_status: p.stock_status as SkinQuizProduct['stock_status'],
    featured: false,
    average_rating: '0',
    rating_count: 0,
    short_description: '',
    images: p.image_url ? [{ src: p.image_url, alt: p.name, name: p.name }] : [],
    categories: p.category ? p.category.split(', ').map((c, i) => ({ id: i, name: c, slug: c.toLowerCase().replace(/\s+/g, '-') })) : [],
  };
}

const CONCERN_QUERIES: Record<SkinConcern, string> = {
  'acne-blemish-care': 'acne blemish salicylic BHA tea tree niacinamide spot treatment',
  'pores-oil-control': 'pore minimizing oil control sebum clay niacinamide BHA',
  'dryness-hydration': 'hydrating moisturizing hyaluronic acid ceramide barrier repair',
  'melasma': 'dark spot melasma tranexamic acid alpha arbutin vitamin C brightening',
  'brightening': 'brightening glow vitamin C niacinamide rice extract propolis',
  'sensitivity': 'sensitive skin centella cica soothing calming panthenol barrier',
  'anti-aging-repair': 'anti-aging retinol peptide collagen firming repair wrinkle',
};

interface StepQuery {
  description: string;
  categories: string[];
}

function buildStepQueries(answers: SkinQuizAnswers): Record<string, StepQuery> {
  const concern = answers.concerns[0] || 'dryness-hydration';
  const concernText = CONCERN_QUERIES[concern] || '';
  const skinText = answers.skinType === 'oily' ? 'oily skin lightweight' :
    answers.skinType === 'dry' ? 'dry skin rich moisture' :
    answers.skinType === 'sensitive' ? 'sensitive skin gentle soothing' :
    answers.skinType === 'combination' ? 'combination skin balanced' : 'normal skin';

  return {
    cleansers: {
      description: `${skinText} face cleanser wash ${answers.skinType === 'oily' ? 'gel foam low pH' : 'cream gentle hydrating'}`,
      categories: ['cleanser', 'face wash', 'face cleansers'],
    },
    toners: {
      description: `${skinText} toner essence prep ${concernText}`,
      categories: ['toner', 'essence', 'mist'],
    },
    serums: {
      description: `${skinText} serum treatment ampoule ${concernText}`,
      categories: ['serum', 'ampoule', 'essence'],
    },
    moisturizers: {
      description: `${skinText} moisturizer cream ${answers.skinType === 'oily' ? 'gel cream lightweight' : 'barrier cream rich'}`,
      categories: ['moisturizer', 'cream', 'night cream'],
    },
    sunscreens: {
      description: `${skinText} sunscreen SPF sun protection ${answers.skinType === 'oily' ? 'fluid gel matte' : 'cream essence moisture'}`,
      categories: ['sunscreen', 'sun care', 'SPF'],
    },
    masks: {
      description: `${skinText} face mask sheet mask ${concernText}`,
      categories: ['mask', 'peel', 'sheet mask'],
    },
  };
}

export async function getQuizProductPoolsFromQdrant(answers?: SkinQuizAnswers): Promise<SkinQuizProductPools> {
  const defaultAnswers: SkinQuizAnswers = answers || {
    skinType: 'combination',
    concerns: ['dryness-hydration'],
    environment: 'dhaka-heat',
    routinePace: 'balanced',
    budget: 'steady',
  };

  const stepQueries = buildStepQueries(defaultAnswers);
  const concernSlugs: SkinConcern[] = [
    'acne-blemish-care', 'pores-oil-control', 'dryness-hydration',
    'melasma', 'brightening', 'sensitivity', 'anti-aging-repair',
  ];

  const stepNames = Object.keys(stepQueries) as (keyof typeof stepQueries)[];
  const allQueries = [
    ...stepNames.map((s) => stepQueries[s].description),
    ...concernSlugs.map((c) => CONCERN_QUERIES[c]),
  ];

  const vectors = await Promise.all(allQueries.map((q) => embed(q)));

  const searchResults = await Promise.all(
    vectors.map((vec, i) => {
      if (!vec) return Promise.resolve([]);
      const cats = i < stepNames.length ? stepQueries[stepNames[i]].categories : [];
      return qdrantSearch(vec, cats, 15);
    }),
  );

  const rerankResults = await Promise.all(
    searchResults.map((results, i) =>
      results.length > 0 ? rerank(allQueries[i], results, 10) : Promise.resolve([]),
    ),
  );

  const pools: Record<string, SkinQuizProduct[]> = {};
  for (let i = 0; i < stepNames.length; i++) {
    pools[stepNames[i]] = rerankResults[i].map(toQuizProduct);
  }

  const concerns: Record<string, SkinQuizProduct[]> = {};
  for (let i = 0; i < concernSlugs.length; i++) {
    concerns[concernSlugs[i]] = rerankResults[stepNames.length + i].map(toQuizProduct);
  }

  return {
    cleansers: pools.cleansers || [],
    toners: pools.toners || [],
    serums: pools.serums || [],
    moisturizers: pools.moisturizers || [],
    sunscreens: pools.sunscreens || [],
    masks: pools.masks || [],
    concerns: concerns as SkinQuizProductPools['concerns'],
  };
}
