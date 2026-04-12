import { MetadataRoute } from 'next';
import { getProducts, getCategories } from '@/lib/woocommerce';

const BASE_URL = 'https://e-mart.com.bd';

// Static pages
const staticPages = [
  '',
  '/shop',
  '/new-arrivals',
  '/sale',
  '/brands',
  '/concerns',
  '/origins',
  '/about-us',
  '/contact',
  '/faq',
  '/shipping-policy',
  '/return-policy',
  '/privacy-policy',
  '/terms-conditions',
  '/track-order',
  '/account',
  '/wishlist',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Get products and categories
    const [productsData, categories] = await Promise.all([
      getProducts({ per_page: 100 }).catch(() => ({ products: [] })),
      getCategories().catch(() => []),
    ]);

    const products = productsData.products || [];

    // Static pages
    const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
      url: `${BASE_URL}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1 : 0.8,
    }));

    // Product pages
    const productEntries: MetadataRoute.Sitemap = products.map((product: any) => ({
      url: `${BASE_URL}/product/${product.id}`,
      lastModified: new Date(product.date_modified),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    // Category pages
    const categoryEntries: MetadataRoute.Sitemap = categories.map((cat: any) => ({
      url: `${BASE_URL}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticEntries, ...productEntries, ...categoryEntries];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Return at least static pages if API fails
    return staticPages.map((page) => ({
      url: `${BASE_URL}${page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  }
}
