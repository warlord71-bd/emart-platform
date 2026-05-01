/**
 * Rank Math SEO utility — fetches per-page SEO metadata via WPGraphQL + Rank Math.
 * Uses WOO_INTERNAL_URL (loopback) with explicit Host header so Nginx routes
 * correctly without triggering the IP-redirect rule.
 */

const GRAPHQL_URL = process.env.WOO_INTERNAL_URL
  ? `${process.env.WOO_INTERNAL_URL}/graphql`
  : 'https://e-mart.com.bd/graphql';

const BASE_URL = 'https://e-mart.com.bd';

interface RankMathSeo {
  title: string | null;
  description: string | null;
  openGraph: {
    image: { url: string } | null;
  } | null;
}

interface ProductSeoResponse {
  product: { seo: RankMathSeo } | null;
}

interface CategorySeoResponse {
  productCategory: {
    name: string;
    seo: RankMathSeo;
  } | null;
}

const PRODUCT_SEO_QUERY = `
  query ProductSeo($slug: String!) {
    product(id: $slug, idType: SLUG) {
      seo {
        title
        description
        openGraph { image { url } }
      }
    }
  }
`;

const CATEGORY_SEO_QUERY = `
  query CategorySeo($slug: String!) {
    productCategory(id: $slug, idType: SLUG) {
      name
      seo {
        title
        description
        openGraph { image { url } }
      }
    }
  }
`;

async function rankMathFetch<T>(
  query: string,
  variables: Record<string, string>,
): Promise<T | null> {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'e-mart.com.bd',
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json() as { data?: T; errors?: unknown[] };
    if (json.errors?.length) return null;
    return json.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Reformat Rank Math title to Emart brand standard.
 * Input:  "Product Name 150ml - Emart Skincare Bangladesh"
 * Output: "Product Name 150ml | Emart"
 */
function reformatTitle(raw: string | null, fallback: string): string {
  if (!raw?.trim()) return fallback;

  const stripped = raw
    .replace(/\s*[-–—|]\s*Emart Skincare Bangladesh\s*$/i, '')
    .replace(/\s*[-–—|]\s*Emart\s*$/i, '')
    .trim();

  if (stripped.length < 3) return fallback;
  return `${stripped} | Emart`;
}

export async function getProductSeo(
  slug: string,
  fallbacks: { name: string; description?: string; imageUrl?: string },
): Promise<{ title: string; description: string; canonical: string; ogImage: string }> {
  const canonical = `${BASE_URL}/shop/${slug}`;
  const titleFallback = `${fallbacks.name} Price in Bangladesh | Emart`;
  const descFallback = fallbacks.description
    ? fallbacks.description.replace(/<[^>]*>/g, '').trim().slice(0, 160)
    : `Buy ${fallbacks.name} in Bangladesh from Emart. 100% authentic import. COD available.`;

  const data = await rankMathFetch<ProductSeoResponse>(PRODUCT_SEO_QUERY, { slug });
  const seo = data?.product?.seo;

  return {
    title: reformatTitle(seo?.title ?? null, titleFallback),
    description: seo?.description || descFallback,
    canonical,
    ogImage: seo?.openGraph?.image?.url || fallbacks.imageUrl || '',
  };
}

export async function getCategorySeo(
  slug: string,
  categoryName?: string,
): Promise<{ title: string; description: string; canonical: string; ogImage: string }> {
  const canonical = `${BASE_URL}/category/${slug}`;

  const data = await rankMathFetch<CategorySeoResponse>(CATEGORY_SEO_QUERY, { slug });
  const seo = data?.productCategory?.seo;
  const name = data?.productCategory?.name || categoryName || slug;

  const titleFallback = `${name} — Shop Online | Emart Skincare Bangladesh`;
  const descFallback = `Shop authentic ${name} products in Bangladesh from Emart. 100% verified imports, COD available, fast delivery.`;

  const rawTitle = seo?.title ?? null;
  const isBroken =
    !rawTitle ||
    rawTitle.trim().startsWith('-') ||
    rawTitle.trim().startsWith('–') ||
    rawTitle.trim().length < 4;

  return {
    title: isBroken ? titleFallback : reformatTitle(rawTitle, titleFallback),
    description: seo?.description || descFallback,
    canonical,
    ogImage: seo?.openGraph?.image?.url || '',
  };
}
