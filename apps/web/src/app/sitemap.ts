import type { MetadataRoute } from 'next';
import { getGraphQLSitemapData, isWordPressGraphQLConfigured } from '@/lib/wordpress-graphql';
import { getProducts, getCategories } from '@/lib/woocommerce';
import { getWordPressPosts } from '@/lib/wordpress-posts';

const BASE_URL = 'https://e-mart.com.bd';
const PAGE_SIZE = 100;
const WORDPRESS_URL = (process.env.WOO_INTERNAL_URL || process.env.NEXT_PUBLIC_WOO_URL || BASE_URL).replace(/\/$/, '');

type SitemapProduct = {
  slug: string;
  date_modified?: string;
};

type WordPressProductPost = {
  slug?: string;
  modified_gmt?: string;
  modified?: string;
};

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  { url: `${BASE_URL}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE_URL}/new-arrivals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE_URL}/sale`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: `${BASE_URL}/brands`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  { url: `${BASE_URL}/about-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/authenticity`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
];

async function getBlogSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const posts = await getWordPressPosts({ perPage: 50 });

  return posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
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
    url: `${BASE_URL}/shop/${p.slug}`,
    lastModified: p.date_modified ? new Date(p.date_modified) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug !== 'uncategorized')
    .map((c) => ({
      url: `${BASE_URL}/category/${c.slug}`,
      lastModified: c.date_modified ? new Date(c.date_modified) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const blogEntries = await getBlogSitemapEntries();

  return [...STATIC_PAGES, ...categoryEntries, ...productEntries, ...blogEntries];
}

async function getSitemapViaREST(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getAllPublishedProductPosts(),
    getCategories({ per_page: 100, hide_empty: true }),
  ]);

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/shop/${p.slug}`,
    lastModified: p.date_modified ? new Date(p.date_modified) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug !== 'uncategorized')
    .map((c) => ({
      url: `${BASE_URL}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const blogEntries = await getBlogSitemapEntries();

  return [...STATIC_PAGES, ...categoryEntries, ...productEntries, ...blogEntries];
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    if (isWordPressGraphQLConfigured()) {
      return await getSitemapViaGraphQL();
    }
  } catch {
    // fall through to REST
  }

  try {
    return await getSitemapViaREST();
  } catch {
    return STATIC_PAGES;
  }
}
