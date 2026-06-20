type NextFetchInit = RequestInit & {
  next?: { revalidate?: number };
};

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function parseTimeout(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1000), 60000);
}

export const QDRANT_URL = normalizeUrl(process.env.QDRANT_URL || 'http://127.0.0.1:6333');
export const QDRANT_KEY = process.env.QDRANT_API_KEY || '';
export const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'emart_products';

export const EMBED_SERVICE_URL = normalizeUrl(
  process.env.EMART_EMBED_SERVICE_URL ||
  process.env.EMBED_SERVICE_URL ||
  'http://127.0.0.1:8077',
);
export const EMBED_URL = `${EMBED_SERVICE_URL}/embed`;
export const RERANK_URL = `${EMBED_SERVICE_URL}/rerank`;

export const AI_FETCH_TIMEOUT_MS = parseTimeout(process.env.AI_FETCH_TIMEOUT_MS, 12000);
export const AI_RERANK_TIMEOUT_MS = parseTimeout(process.env.AI_RERANK_TIMEOUT_MS, 25000);

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: NextFetchInit = {},
  timeoutMs = AI_FETCH_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: init.signal || controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
