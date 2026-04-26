import { unstable_cache } from 'next/cache';
import { getCategories, getProducts, type WooCategory, type WooProduct } from '@/lib/woocommerce';
import {
  getGraphQLSitemapData,
  isWordPressGraphQLConfigured,
  type GraphQLSitemapCategory,
  type GraphQLSitemapImage,
  type GraphQLSitemapProduct,
} from '@/lib/wordpress-graphql';

const BASE_URL = 'https://e-mart.com.bd';
const PAGE_SIZE = 100;
const CACHE_SECONDS = 86400;
const GRAPHQL_SITEMAP_TIMEOUT_MS = Number(process.env.WORDPRESS_GRAPHQL_SITEMAP_TIMEOUT_MS || 11000);
const GRAPHQL_SITEMAP_ENABLED = process.env.WORDPRESS_GRAPHQL_SITEMAP_ENABLED !== 'false';

type SitemapImage = GraphQLSitemapImage | NonNullable<WooProduct['images']>[number];
type SitemapProduct = (WooProduct | GraphQLSitemapProduct) & {
  categorySlugs?: string[];
};
type SitemapCategory = (WooCategory | GraphQLSitemapCategory) & {
  date_modified?: string;
};

export const dynamic = 'force-dynamic';
export const revalidate = CACHE_SECONDS;

const staticPages = [
  '',
  '/shop',
  '/new-arrivals',
  '/sale',
  '/skin-quiz',
  '/brands',
  '/concerns',
  '/origins',
  '/about-us',
  '/our-story',
  '/authenticity',
  '/join-our-team',
  '/contact',
  '/faq',
  '/shipping-policy',
  '/return-policy',
  '/privacy-policy',
  '/terms-conditions',
];

const getCachedSitemapXml = unstable_cache(createSitemapXml, ['emart-next-image-sitemap-v4'], {
  revalidate: CACHE_SECONDS,
});

export async function GET() {
  const xml = await getCachedSitemapXml();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
    },
  });
}

async function createSitemapXml(): Promise<string> {
  const data = await getSitemapData();
  const products = dedupeBySlug(data.products);
  const categories = dedupeBySlug(data.categories);

  const entries = [
    ...staticPages.map((page) => renderUrlEntry({ loc: `${BASE_URL}${page}`, changefreq: page === '' ? 'daily' : 'weekly', priority: page === '' ? 1 : 0.8 })),
    ...products.map(renderProductEntry),
    ...categories.map(renderCategoryEntry),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries,
    '</urlset>',
  ].join('\n');
}

async function getSitemapData(): Promise<{
  products: SitemapProduct[];
  categories: SitemapCategory[];
}> {
  if (GRAPHQL_SITEMAP_ENABLED && isWordPressGraphQLConfigured()) {
    try {
      const data = await withTimeout(
        getGraphQLSitemapData(),
        GRAPHQL_SITEMAP_TIMEOUT_MS,
        'GraphQL sitemap timed out.'
      );
      if (data.products.length > 0) {
        return data;
      }

      console.warn('GraphQL sitemap returned no products. Falling back to WooCommerce REST.');
    } catch (error) {
      console.warn('GraphQL sitemap failed. Falling back to WooCommerce REST.', getErrorMessage(error));
    }
  }

  const [products, categories] = await Promise.all([
    getAllPublishedProducts(),
    getCategories().catch(() => []),
  ]);

  return {
    products,
    categories: addCategoryLastmod(categories, products),
  };
}

async function getAllPublishedProducts(): Promise<WooProduct[]> {
  const firstPage = await getProducts({ page: 1, per_page: PAGE_SIZE });
  const products = [...firstPage.products];

  const remainingPages = Array.from(
    { length: Math.max(firstPage.totalPages - 1, 0) },
    (_, index) => index + 2
  );
  const remainingData = await Promise.all(
    remainingPages.map((page) => getProducts({ page, per_page: PAGE_SIZE }))
  );

  products.push(...remainingData.flatMap((pageData) => pageData.products));
  return products;
}

function renderProductEntry(product: SitemapProduct): string {
  const images = getProductImages(product);

  return renderUrlEntry({
    loc: `${BASE_URL}/shop/${product.slug}`,
    lastmod: product.date_modified,
    changefreq: 'monthly',
    priority: 0.7,
    images,
  });
}

function renderCategoryEntry(category: SitemapCategory): string {
  return renderUrlEntry({
    loc: `${BASE_URL}/category/${category.slug}`,
    lastmod: category.date_modified,
    changefreq: 'weekly',
    priority: 0.8,
  });
}

function renderUrlEntry({
  loc,
  lastmod,
  changefreq,
  priority,
  images = [],
}: {
  loc: string;
  lastmod?: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: number;
  images?: Array<{ loc: string; title: string }>;
}): string {
  const lines = [
    '<url>',
    `<loc>${escapeXml(loc)}</loc>`,
  ];

  const formattedLastmod = formatLastmod(lastmod);
  if (formattedLastmod) {
    lines.push(`<lastmod>${formattedLastmod}</lastmod>`);
  }

  lines.push(`<changefreq>${changefreq}</changefreq>`);
  lines.push(`<priority>${priority.toFixed(1)}</priority>`);

  for (const image of images) {
    lines.push('<image:image>');
    lines.push(`<image:loc>${escapeXml(image.loc)}</image:loc>`);
    lines.push(`<image:title>${escapeXml(image.title)}</image:title>`);
    lines.push('</image:image>');
  }

  lines.push('</url>');
  return lines.join('\n');
}

function getProductImages(product: SitemapProduct): Array<{ loc: string; title: string }> {
  const seen = new Set<string>();

  return (product.images || [])
    .map((image: SitemapImage) => ({
      loc: normalizeImageUrl(image.src),
      title: image.alt || image.name || product.name,
    }))
    .filter((image) => {
      if (!image.loc || seen.has(image.loc)) return false;
      seen.add(image.loc);
      return true;
    });
}

function normalizeImageUrl(src?: string): string {
  if (!src) return '';

  try {
    const url = new URL(src);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

function formatLastmod(value?: string): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function addCategoryLastmod(categories: WooCategory[], products: WooProduct[]): SitemapCategory[] {
  const lastmodBySlug = new Map<string, string>();

  for (const product of products) {
    if (!product.date_modified) continue;

    for (const category of product.categories || []) {
      const current = lastmodBySlug.get(category.slug);
      if (!current || new Date(product.date_modified) > new Date(current)) {
        lastmodBySlug.set(category.slug, product.date_modified);
      }
    }
  }

  return categories.map((category) => ({
    ...category,
    date_modified: lastmodBySlug.get(category.slug),
  }));
}

function dedupeBySlug<T extends { slug?: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item.slug || seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
