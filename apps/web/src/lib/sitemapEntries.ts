import type { MetadataRoute } from 'next';
import { getGraphQLSitemapData, isWordPressGraphQLConfigured } from '@/lib/wordpress-graphql';
import { getProducts, getCategories, getBrands } from '@/lib/woocommerce';
import { getWordPressPosts } from '@/lib/wordpress-posts';

// Throttled Promise.all — runs tasks in chunks of `concurrency` to avoid
// overwhelming the WooCommerce API with 37 simultaneous requests on sitemap generation.
async function chunkedAll<T>(
  tasks: (() => Promise<T>)[],
  concurrency = 5,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const chunk = tasks.slice(i, i + concurrency).map((fn) => fn());
    const chunkResults = await Promise.all(chunk);
    results.push(...chunkResults);
  }
  return results;
}
import { SITE_URL, absoluteUrl } from '@/lib/siteUrl';
import { CONCERN_DEFINITIONS } from '@/lib/concerns';
import { INGREDIENT_DEFINITIONS } from '@/lib/ingredients';
import { ROUTINE_STEPS } from '@/lib/routine';
import { ORIGIN_DEFINITIONS } from '@/lib/origin-navigation';
import { getOriginTermCounts } from '@/lib/woocommerce';
import { SKIN_TYPE_DEFINITIONS } from '@/lib/skin-type-definitions';
import { COMPARE_DEFINITIONS } from '@/lib/compare-definitions';
import { BEST_DEFINITIONS } from '@/lib/best-definitions';

const CONCERN_SLUG_PAGES: MetadataRoute.Sitemap = CONCERN_DEFINITIONS.map((c) => ({
  url: absoluteUrl(`/concerns/${c.slug}`),
  changeFrequency: 'weekly' as const,
  priority: 0.75,
}));

const INGREDIENT_SLUG_PAGES: MetadataRoute.Sitemap = INGREDIENT_DEFINITIONS.map((i) => ({
  url: absoluteUrl(`/ingredients/${i.slug}`),
  changeFrequency: 'weekly' as const,
  priority: 0.7,
}));

const ROUTINE_SLUG_PAGES: MetadataRoute.Sitemap = ROUTINE_STEPS.map((s) => ({
  url: absoluteUrl(`/routine/${s.slug}`),
  changeFrequency: 'weekly' as const,
  priority: 0.75,
}));

const MIN_ORIGIN_PRODUCTS = 5;

async function getOriginSlugPages(): Promise<MetadataRoute.Sitemap> {
  const counts = await getOriginTermCounts();
  return ORIGIN_DEFINITIONS
    .filter((o) => (counts[o.country] || 0) >= MIN_ORIGIN_PRODUCTS)
    .map((o) => ({
      url: absoluteUrl(`/origins/${o.country}`),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
}

const SKIN_TYPE_SLUG_PAGES: MetadataRoute.Sitemap = SKIN_TYPE_DEFINITIONS.map((st) => ({
  url: absoluteUrl(`/skin-type/${st.slug}`),
  changeFrequency: 'weekly' as const,
  priority: 0.75,
}));

const COMPARE_SLUG_PAGES: MetadataRoute.Sitemap = COMPARE_DEFINITIONS.map((c) => ({
  url: absoluteUrl(`/compare/${c.pair}`),
  changeFrequency: 'monthly' as const,
  priority: 0.7,
}));

const BEST_SLUG_PAGES: MetadataRoute.Sitemap = BEST_DEFINITIONS.map((b) => ({
  url: absoluteUrl(`/best/${b.slug}`),
  changeFrequency: 'monthly' as const,
  priority: 0.75,
}));
import { OFFER_COLLECTIONS } from '@/lib/offerCollectionConfig';

const BASE_URL = SITE_URL;
const PAGE_SIZE = 100;
const WORDPRESS_URL = (process.env.WOO_INTERNAL_URL || process.env.NEXT_PUBLIC_WOO_URL || BASE_URL).replace(/\/$/, '');

// Brand slugs that permanently redirect to /shop — must not appear in sitemap.
// These are discontinued/empty brands redirected in next.config.js.
const REDIRECTED_BRAND_SLUGS = new Set([
  'beaute-moringa-melasma', 'japanese', 'green', 'valencia', 'sensitive',
  'absolute', 'cellpod', 'ruthair', 'kao', 'nizoral', 'ottogi', 'labelyoung',
  'syoss', 'radiant', 'tresemm', 'karite', 'the', 'daily',
  'bath', 'house', 'lucido', 'beauty',
  'a-pieu', 'wskin', 'purito', 'aztec', 'paula-s',
]);

// Categories that 301-redirect to /concerns/* or /shop — must not appear in sitemap.
// Sitemap should only list canonical URLs that return 200 with index,follow.
// Full reference: workspace/content-orchestrator/docs/category-taxonomy-status.md
const REDIRECTED_CATEGORY_SLUGS = new Set([
  'shop-by-concern',
  'acne-blemish-care',
  'anti-aging-repair',
  'dryness-hydration',
  'pores-oil-control',
  'melasma',
  'brightening',
  'wrinkle',
  'sensitivity',
  'skincare-essentials',
  'k-beauty-j-beauty',
  'shooting-gel',
  // near-empty / duplicate categories — exclude from sitemap until populated
  'general-health',
  'shampoo',
  'hair-essence-serum',
]);

type SitemapProduct = {
  slug: string;
  date_modified?: string;
};

type WordPressProductPost = {
  slug?: string;
  modified_gmt?: string;
  modified?: string;
};

export type SitemapEntry = MetadataRoute.Sitemap[number];

// Informational/policy pages — content rarely changes and there is no
// reliable per-page "last modified" signal, so omit lastModified rather than
// publish a frozen/stale date.
const STATIC_PAGES_NO_DATE: MetadataRoute.Sitemap = [
  { url: absoluteUrl('/skin-quiz'), changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/blog'), changeFrequency: 'weekly', priority: 0.6 },
  { url: absoluteUrl('/social'), changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/about-us'), changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/our-story'), changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/authenticity'), changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/join-our-team'), changeFrequency: 'monthly', priority: 0.4 },
  { url: absoluteUrl('/contact'), changeFrequency: 'monthly', priority: 0.4 },
  { url: absoluteUrl('/faq'), changeFrequency: 'monthly', priority: 0.4 },
  { url: absoluteUrl('/shipping-policy'), changeFrequency: 'monthly', priority: 0.3 },
  { url: absoluteUrl('/return-policy'), changeFrequency: 'monthly', priority: 0.3 },
  { url: absoluteUrl('/privacy-policy'), changeFrequency: 'yearly', priority: 0.2 },
  { url: absoluteUrl('/terms-conditions'), changeFrequency: 'yearly', priority: 0.2 },
  { url: absoluteUrl('/sitemap'), changeFrequency: 'monthly', priority: 0.4 },
];

// Catalog-reflecting hub/listing pages — their content (product and category
// listings) changes as the catalog changes, so lastModified is set to the
// sitemap's generation time (refreshed hourly via the route's revalidate cache)
// instead of a frozen date.
async function getCatalogStaticPages(now: Date): Promise<MetadataRoute.Sitemap> {
  const originPages = await getOriginSlugPages();
  return [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/shop'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/categories'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/new-arrivals'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/sale'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/offers'), lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
    { url: absoluteUrl('/skin-type'), lastModified: now, changeFrequency: 'weekly', priority: 0.75 },
    ...SKIN_TYPE_SLUG_PAGES.map((p) => ({ ...p, lastModified: now })),
    { url: absoluteUrl('/compare'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    ...COMPARE_SLUG_PAGES.map((p) => ({ ...p, lastModified: now })),
    { url: absoluteUrl('/best'), lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    ...BEST_SLUG_PAGES.map((p) => ({ ...p, lastModified: now })),
    { url: absoluteUrl('/brands'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/origins'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ...originPages.map((p) => ({ ...p, lastModified: now })),
    { url: absoluteUrl('/concerns'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/ingredients'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/routine'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ...CONCERN_SLUG_PAGES.map((p) => ({ ...p, lastModified: now })),
    ...INGREDIENT_SLUG_PAGES.map((p) => ({ ...p, lastModified: now })),
    ...ROUTINE_SLUG_PAGES.map((p) => ({ ...p, lastModified: now })),
    ...OFFER_COLLECTIONS.map((offer) => ({
      url: absoluteUrl(offer.href),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}

async function getStaticPages(): Promise<MetadataRoute.Sitemap> {
  return [...await getCatalogStaticPages(new Date()), ...STATIC_PAGES_NO_DATE];
}

async function getBlogSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const posts = await getWordPressPosts({ perPage: 50 });

  return posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.modified ? new Date(post.modified) : new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
}

async function getSitemapViaGraphQL(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getGraphQLSitemapData();
  if (products.length <= PAGE_SIZE) {
    throw new Error('GraphQL sitemap returned an empty or capped product set.');
  }

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/shop/${p.slug}`),
    ...(p.date_modified ? { lastModified: new Date(p.date_modified) } : {}),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug !== 'uncategorized' && !REDIRECTED_CATEGORY_SLUGS.has(c.slug))
    .map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      ...(c.date_modified ? { lastModified: new Date(c.date_modified) } : {}),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const blogEntries = await getBlogSitemapEntries();
  const brandEntries = await getBrandSitemapEntries();

  return [...await getStaticPages(), ...categoryEntries, ...brandEntries, ...productEntries, ...blogEntries];
}

async function getSitemapViaREST(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands] = await Promise.all([
    getAllPublishedProductPosts(),
    getCategories({ per_page: 100, hide_empty: true }),
    getBrands({ orderby: 'name', order: 'asc' }).catch(() => []),
  ]);

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/shop/${p.slug}`),
    ...(p.date_modified ? { lastModified: new Date(p.date_modified) } : {}),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug !== 'uncategorized' && !REDIRECTED_CATEGORY_SLUGS.has(c.slug))
    .map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const blogEntries = await getBlogSitemapEntries();
  if (productEntries.length === 0) {
    throw new Error('Sitemap product source returned zero published products.');
  }

  const brandEntries: MetadataRoute.Sitemap = brands
    .filter((brand) => brand.count > 0 && !REDIRECTED_BRAND_SLUGS.has(brand.slug))
    .map((brand) => ({
      url: absoluteUrl(`/brands/${brand.slug}`),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [...await getStaticPages(), ...categoryEntries, ...brandEntries, ...productEntries, ...blogEntries];
}

async function getBrandSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const brands = await getBrands({ orderby: 'name', order: 'asc' }).catch(() => []);

  return brands
    .filter((brand) => brand.count > 0 && !REDIRECTED_BRAND_SLUGS.has(brand.slug))
    .map((brand) => ({
      url: absoluteUrl(`/brands/${brand.slug}`),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
}

async function getAllPublishedProductPosts(): Promise<SitemapProduct[]> {
  const products = await getAllPublishedProductsViaWordPressRest();
  if (products.length > 0) return products;

  return getAllPublishedProductsViaWooRest();
}

async function getAllPublishedProductsViaWordPressRest(): Promise<SitemapProduct[]> {
  try {
    const firstPage = await fetchWordPressProductPostPage(1);
    const products = [...firstPage.products];
    const remainingPages = Array.from(
      { length: Math.max(firstPage.totalPages - 1, 0) },
      (_, index) => index + 2
    );
    const remainingData = await chunkedAll(
      remainingPages.map((page) => () => fetchWordPressProductPostPage(page)),
    );

    products.push(...remainingData.flatMap((pageData) => pageData.products));
    return products;
  } catch {
    return [];
  }
}

async function fetchWordPressProductPostPage(page: number): Promise<{
  products: SitemapProduct[];
  totalPages: number;
}> {
  const url = new URL(`${WORDPRESS_URL}/wp-json/wp/v2/product`);
  url.searchParams.set('status', 'publish');
  url.searchParams.set('per_page', String(PAGE_SIZE));
  url.searchParams.set('page', String(page));
  url.searchParams.set('_fields', 'slug,modified,modified_gmt');

  const response = await fetch(url, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`WordPress product sitemap fetch failed with HTTP ${response.status}.`);
  }

  const data = await response.json() as WordPressProductPost[];
  const totalPages = Number(response.headers.get('x-wp-totalpages') || 0);

  return {
    products: Array.isArray(data)
      ? data
        .map((product) => ({
          slug: product.slug || '',
          date_modified: product.modified_gmt || product.modified,
        }))
        .filter((product) => product.slug)
      : [],
    totalPages,
  };
}

async function getAllPublishedProductsViaWooRest(): Promise<SitemapProduct[]> {
  const firstPage = await getProducts({ page: 1, per_page: PAGE_SIZE, orderby: 'date', order: 'desc' });
  const products = [...firstPage.products];

  const remainingPages = Array.from(
    { length: Math.max(firstPage.totalPages - 1, 0) },
    (_, index) => index + 2
  );
  const remainingData = await chunkedAll(
    remainingPages.map((page) => () => getProducts({ page, per_page: PAGE_SIZE, orderby: 'date', order: 'desc' })),
  );

  products.push(...remainingData.flatMap((pageData) => pageData.products));
  return products;
}

function deduplicateSitemap(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = getSitemapUrlKey(entry.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSitemapUrlKey(value: string): string {
  try {
    const url = new URL(value);
    const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
    const searchParams = new URLSearchParams(url.search);
    searchParams.sort();

    return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  } catch {
    return value.trim().replace(/\/+$/, '');
  }
}

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    if (isWordPressGraphQLConfigured()) {
      return deduplicateSitemap(await getSitemapViaGraphQL());
    }
  } catch {
    // fall through to REST
  }

  try {
    return deduplicateSitemap(await getSitemapViaREST());
  } catch {
    return deduplicateSitemap(await getStaticPages());
  }
}
