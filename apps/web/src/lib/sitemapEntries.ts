import type { MetadataRoute } from 'next';
import { getGraphQLSitemapData, isWordPressGraphQLConfigured } from '@/lib/wordpress-graphql';
import { getProducts, getCategories, getBrands } from '@/lib/woocommerce';
import { getWordPressPosts } from '@/lib/wordpress-posts';
import { SITE_URL, absoluteUrl } from '@/lib/siteUrl';
import { OFFER_COLLECTIONS } from '@/lib/offerCollectionConfig';

const BASE_URL = SITE_URL;
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

export type SitemapEntry = MetadataRoute.Sitemap[number];

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  { url: absoluteUrl('/shop'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: absoluteUrl('/categories'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: absoluteUrl('/new-arrivals'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: absoluteUrl('/sale'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  { url: absoluteUrl('/skin-quiz'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/brands'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/origins'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/concerns'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: absoluteUrl('/blog'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  { url: absoluteUrl('/social'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/about-us'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/our-story'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/authenticity'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: absoluteUrl('/join-our-team'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  { url: absoluteUrl('/contact'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  { url: absoluteUrl('/faq'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  { url: absoluteUrl('/shipping-policy'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: absoluteUrl('/return-policy'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: absoluteUrl('/privacy-policy'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  { url: absoluteUrl('/terms-conditions'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  { url: absoluteUrl('/sitemap'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ...OFFER_COLLECTIONS.map((offer) => ({
    url: absoluteUrl(offer.href),
    lastModified: new Date(),
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
    lastModified: p.date_modified ? new Date(p.date_modified) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug !== 'uncategorized')
    .map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      lastModified: c.date_modified ? new Date(c.date_modified) : new Date(),
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
    lastModified: p.date_modified ? new Date(p.date_modified) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories
    .filter((c) => c.slug !== 'uncategorized')
    .map((c) => ({
      url: absoluteUrl(`/category/${c.slug}`),
      lastModified: new Date(),
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
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [...STATIC_PAGES, ...categoryEntries, ...brandEntries, ...productEntries, ...blogEntries];
}

async function getBrandSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const brands = await getBrands({ orderby: 'name', order: 'asc' }).catch(() => []);

  return brands.filter((brand) => brand.count > 0).map((brand) => ({
    url: absoluteUrl(`/brands/${brand.slug}`),
    lastModified: new Date(),
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

export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
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
