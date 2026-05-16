import type { MetadataRoute } from 'next';
import { getGraphQLSitemapData, isWordPressGraphQLConfigured } from '@/lib/wordpress-graphql';
import { getProducts, getCategories, getBrands } from '@/lib/woocommerce';
import { getWordPressPosts } from '@/lib/wordpress-posts';
import { SITE_URL, absoluteUrl } from '@/lib/siteUrl';
import { CONCERN_DEFINITIONS } from '@/lib/concerns';
import { INGREDIENT_DEFINITIONS } from '@/lib/ingredients';
import { ROUTINE_STEPS } from '@/lib/routine';

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
import { OFFER_COLLECTIONS } from '@/lib/offerCollectionConfig';

const BASE_URL = SITE_URL;
const PAGE_SIZE = 100;
const WORDPRESS_URL = (process.env.WOO_INTERNAL_URL || process.env.NEXT_PUBLIC_WOO_URL || BASE_URL).replace(/\/$/, '');
const STATIC_LASTMOD = new Date('2026-05-16T00:00:00.000Z');

// Categories that 301-redirect to /concerns/* or /shop — must not appear in sitemap.
// Sitemap should only list canonical URLs that return 200 with index,follow.
// Full reference: workspace/docs/category-taxonomy-status.md
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

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL, lastModified: STATIC_LASTMOD, changeFrequency: 'daily', priority: 1 },
  { url: absoluteUrl('/shop'), lastModified: STATIC_LASTMOD, changeFrequency: 'daily', priority: 0.9 },
  { url: absoluteUrl('/categories'), lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.8 },
  { url: absoluteUrl('/new-arrivals'), lastModified: STATIC_LASTMOD, changeFrequency: 'daily', priority: 0.8 },
  { url: absoluteUrl('/sale'), lastModified: STATIC_LASTMOD, changeFrequency: 'daily', priority: 0.8 },
  { url: absoluteUrl('/skin-quiz'), lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/brands'), lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/origins'), lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/concerns'), lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/ingredients'), lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/routine'), lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.7 },
  ...CONCERN_SLUG_PAGES,
  ...INGREDIENT_SLUG_PAGES,
  ...ROUTINE_SLUG_PAGES,
  { url: absoluteUrl('/blog'), lastModified: STATIC_LASTMOD, changeFrequency: 'weekly', priority: 0.6 },
  { url: absoluteUrl('/social'), lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/our-story'), lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/authenticity'), lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/join-our-team'), lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.4 },
  { url: absoluteUrl('/contact'), lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.4 },
  { url: absoluteUrl('/faq'), lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.4 },
  { url: absoluteUrl('/shipping-policy'), lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.3 },
  { url: absoluteUrl('/return-policy'), lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.3 },
  { url: absoluteUrl('/privacy-policy'), lastModified: STATIC_LASTMOD, changeFrequency: 'yearly', priority: 0.2 },
  { url: absoluteUrl('/terms-conditions'), lastModified: STATIC_LASTMOD, changeFrequency: 'yearly', priority: 0.2 },
  { url: absoluteUrl('/sitemap'), lastModified: STATIC_LASTMOD, changeFrequency: 'monthly', priority: 0.4 },
  ...OFFER_COLLECTIONS.map((offer) => ({
    url: absoluteUrl(offer.href),
    lastModified: STATIC_LASTMOD,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  })),
];

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

  return [...STATIC_PAGES, ...categoryEntries, ...brandEntries, ...productEntries, ...blogEntries];
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
    .filter((brand) => brand.count > 0)
    .map((brand) => ({
      url: absoluteUrl(`/brands/${brand.slug}`),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [...STATIC_PAGES, ...categoryEntries, ...brandEntries, ...productEntries, ...blogEntries];
}

async function getBrandSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const brands = await getBrands({ orderby: 'name', order: 'asc' }).catch(() => []);

  return brands.filter((brand) => brand.count > 0).map((brand) => ({
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
    const remainingData = await Promise.all(
      remainingPages.map((page) => fetchWordPressProductPostPage(page))
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
  const remainingData = await Promise.all(
    remainingPages.map((page) => getProducts({ page, per_page: PAGE_SIZE, orderby: 'date', order: 'desc' }))
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
    return deduplicateSitemap(STATIC_PAGES);
  }
}
