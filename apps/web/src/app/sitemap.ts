import type { MetadataRoute } from 'next';
import { getGraphQLSitemapData, isWordPressGraphQLConfigured } from '@/lib/wordpress-graphql';
import { getProducts, getCategories } from '@/lib/woocommerce';
import { getWordPressPosts } from '@/lib/wordpress-posts';

const BASE_URL = 'https://e-mart.com.bd';

export const revalidate = 3600;

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
  const [{ products }, categories] = await Promise.all([
    getProducts({ per_page: 100, orderby: 'date', order: 'desc' }),
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
