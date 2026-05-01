// src/lib/woocommerce.ts
// WooCommerce REST API v3 Client for E-Mart BD

import axios from 'axios';
import { CANONICAL_BRANDS } from '@/lib/brandWhitelist';

const WOO_URL = process.env.WOO_INTERNAL_URL || process.env.NEXT_PUBLIC_WOO_URL || 'https://e-mart.com.bd';
const PUBLIC_SITE_URL = 'https://e-mart.com.bd';
const LEGACY_IP_HOST = ['5', '189', '188', '229'].join('.');
const LOCAL_WORDPRESS_HOSTS = new Set(['127.0.0.1', 'localhost']);
const CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || '';
const WOO_READ_TIMEOUT_MS = 5000;
const IS_NEXT_BUILD = process.env.NEXT_PHASE === 'phase-production-build';
const isHTTPS = WOO_URL.startsWith('https');
const WOO_WRITE_URL = isHTTPS ? WOO_URL : PUBLIC_SITE_URL;

// ── API Clients ──
// Both read and write use the internal URL (WOO_INTERNAL_URL=http://127.0.0.1).
// When HTTP, credentials are sent as query params and a Host header ensures Nginx
// routes to the correct WordPress server block.
// Sending writes through the public domain (https://e-mart.com.bd) is not safe
// because that domain resolves to Cloudflare IPs — our Nginx geo block would 403
// any WC API request not originating from the VPS itself.
const wooApiConfig = isHTTPS
  ? { auth: { username: CONSUMER_KEY, password: CONSUMER_SECRET } }
  : {
      params: { consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET },
      headers: { Host: 'e-mart.com.bd' },
    };

const wooClient = axios.create({
  baseURL: `${WOO_URL}/wp-json/wc/v3`,
  ...wooApiConfig,
  timeout: WOO_READ_TIMEOUT_MS,
});

const wooWriteClient = axios.create({
  baseURL: `${WOO_URL}/wp-json/wc/v3`,
  ...wooApiConfig,
  timeout: 20000,
});

// ══════════════════════════════
// TYPES
// ══════════════════════════════
export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_modified?: string;
  sku?: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  description: string;
  short_description: string;
  images: WooImage[];
  categories: WooCategory[];
  attributes: WooAttribute[];
  meta_data?: WooMetaData[];
  average_rating: string;
  rating_count: number;
  featured: boolean;
}

export interface WooImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
  image?: WooImage;
  count?: number;
}

export interface WooAttribute {
  id: number;
  name: string;
  options: string[];
}

export interface WooMetaData {
  id?: number;
  key: string;
  value: unknown;
}

export interface WooBrand {
  id: number;
  name: string;
  slug: string;
  count: number;
  link?: string;
}

export interface WooOrder {
  id: number;
  customer_id?: number;
  status: string;
  total: string;
  currency?: string;
  line_items: WooLineItem[];
  shipping: WooShipping;
  billing: WooBilling;
  date_created: string;
  date_modified?: string;
  meta_data?: WooMetaData[];
}

export interface WooOrderNote {
  id: number;
  author: string;
  date_created: string;
  note: string;
  customer_note?: boolean;
}

export interface WooLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  total: string;
  image?: WooImage;
}

export interface WooShipping {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
}

export interface WooBilling extends WooShipping {
  email: string;
}

export interface WooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string;
  meta_data?: WooMetaData[];
}

export interface WooProductReview {
  id: number;
  product_id: number;
  reviewer: string;
  reviewer_email?: string;
  review: string;
  rating: number;
  date_created: string;
  verified: boolean;
  status?: string;
}

export interface ProductsParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  tag?: string;
  attribute?: string;
  attribute_term?: string;
  orderby?: 'date' | 'price' | 'popularity' | 'rating' | 'title';
  order?: 'asc' | 'desc';
  on_sale?: boolean;
  featured?: boolean;
  min_price?: string;
  max_price?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  exclude?: string;
  status?: string;
  after?: string;
  before?: string;
}

// ══════════════════════════════
// PRODUCTS API
// ══════════════════════════════

function decodeHtmlEntities(value: unknown): string {
  if (value === null || value === undefined) return '';

  let text = String(value);
  const entities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    ndash: '-',
    mdash: '-',
    hellip: '...',
    rsquo: "'",
    lsquo: "'",
    rdquo: '"',
    ldquo: '"',
  };

  for (let i = 0; i < 3; i += 1) {
    const next = text
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
        const normalized = entity.toLowerCase();
        if (normalized.startsWith('#x')) {
          const code = parseInt(normalized.slice(2), 16);
          return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        if (normalized.startsWith('#')) {
          const code = parseInt(normalized.slice(1), 10);
          return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        return entities[normalized] ?? match;
      })
      .replace(/\s*;amp\s*/gi, ' & ')
      .replace(/\s+/g, ' ')
      .trim();

    if (next === text) break;
    text = next;
  }

  return text;
}

function transformImage(image: any): WooImage {
  if (!image) return image;

  return {
    id: Number(image.id || 0),
    src: image.src ? normalizePublicAssetUrl(String(image.src)) : '',
    name: decodeHtmlEntities(image.name),
    alt: decodeHtmlEntities(image.alt),
  };
}

function transformCategory(category: any): WooCategory {
  if (!category) return category;

  return {
    id: Number(category.id || 0),
    name: decodeHtmlEntities(category.name),
    slug: String(category.slug || ''),
    image: category.image ? transformImage(category.image) : category.image,
    count: typeof category.count === 'number' ? category.count : undefined,
  };
}

const PUBLIC_PRODUCT_META_KEYS = new Set([
  '_woodmart_product_custom_tab_title',
  '_woodmart_product_custom_tab_content',
  '_woodmart_product_custom_tab_title_2',
  '_woodmart_product_custom_tab_content_2',
  'custom_tab_content1',
  'custom_tab_content2',
  '_emart_ingredients',
  '_emart_how_to_use',
  '_emart_product_faq',
  '_wc_facebook_enhanced_catalog_attributes_ingredients',
  '_wc_facebook_enhanced_catalog_attributes_instructions',
  '_wc_facebook_enhanced_catalog_attributes_care_instructions',
  '_structured_description',
  '_rank_math_title',
  '_rank_math_description',
  '_rank_math_focus_keyword',
  '_brand_name',
  'fb_product_description',
  'fb_rich_text_description',
  'meta description',
  'rank_math_description',
]);

function transformMetaValue(value: unknown): unknown {
  return typeof value === 'string' ? decodeHtmlEntities(value) : value;
}

function transformProductMetaData(metaData: any): WooMetaData[] {
  if (!Array.isArray(metaData)) return [];

  return metaData
    .filter((meta) => PUBLIC_PRODUCT_META_KEYS.has(String(meta?.key || '')))
    .map((meta) => ({
      id: typeof meta.id === 'number' ? meta.id : undefined,
      key: String(meta.key || ''),
      value: transformMetaValue(meta.value),
    }));
}

function transformProduct(product: any): WooProduct {
  if (!product) return product;

  return {
    id: Number(product.id || 0),
    name: decodeHtmlEntities(product.name),
    slug: String(product.slug || ''),
    permalink: product.permalink ? normalizePublicAssetUrl(String(product.permalink)) : '',
    date_modified: product.date_modified,
    sku: product.sku ? decodeHtmlEntities(product.sku) : '',
    price: String(product.price || ''),
    regular_price: String(product.regular_price || ''),
    sale_price: String(product.sale_price || ''),
    on_sale: Boolean(product.on_sale),
    purchasable: product.purchasable !== false,
    stock_status: product.stock_status || 'instock',
    stock_quantity: product.stock_quantity ?? null,
    description: decodeHtmlEntities(product.description),
    short_description: decodeHtmlEntities(product.short_description),
    images: Array.isArray(product.images) ? product.images.map(transformImage) : [],
    categories: Array.isArray(product.categories) ? product.categories.map(transformCategory) : [],
    attributes: Array.isArray(product.attributes)
      ? product.attributes.map((attribute: any) => ({
        id: Number(attribute.id || 0),
        name: decodeHtmlEntities(attribute.name),
        options: Array.isArray(attribute.options)
          ? attribute.options.map((option: unknown) => decodeHtmlEntities(option))
          : [],
      }))
      : [],
    meta_data: transformProductMetaData(product.meta_data),
    average_rating: String(product.average_rating || '0'),
    rating_count: Number(product.rating_count || 0),
    featured: Boolean(product.featured),
  };
}

function stripReviewHtml(value: unknown): string {
  return decodeHtmlEntities(String(value || ''))
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function transformProductReview(review: any): WooProductReview {
  return {
    id: Number(review?.id || 0),
    product_id: Number(review?.product_id || review?.product || 0),
    reviewer: decodeHtmlEntities(review?.reviewer || 'Verified customer'),
    reviewer_email: review?.reviewer_email ? String(review.reviewer_email) : undefined,
    review: stripReviewHtml(review?.review),
    rating: Number(review?.rating || 0),
    date_created: String(review?.date_created || ''),
    verified: Boolean(review?.verified),
    status: typeof review?.status === 'string' ? review.status : undefined,
  };
}

// Keep product images and text on the public storefront shape before rendering.
function transformImageUrls(products: any[]): WooProduct[] {
  if (!Array.isArray(products)) return [];

  return products.map(transformProduct);
}

function normalizePublicAssetUrl(src: string): string {
  try {
    const url = new URL(src);
    if (url.hostname === 'e-mart.com.bd' || url.hostname === LEGACY_IP_HOST || LOCAL_WORDPRESS_HOSTS.has(url.hostname)) {
      return `${PUBLIC_SITE_URL}${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return src;
  }

  return src;
}

function getSafeWooError(error: unknown): Record<string, unknown> {
  if (axios.isAxiosError(error)) {
    const responseMessage = typeof error.response?.data?.message === 'string'
      ? error.response.data.message
      : undefined;

    return {
      message: responseMessage || error.message,
      code: error.code,
      status: error.response?.status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'Unknown error' };
}

function logWooError(context: string, error: unknown, details?: Record<string, unknown>) {
  console.error(`${context} error:`, {
    ...getSafeWooError(error),
    ...details,
  });
}

export async function getProducts(params: ProductsParams = {}): Promise<{
  products: WooProduct[];
  total: number;
  totalPages: number;
}> {
  try {
    const response = await wooClient.get('/products', {
      params: {
        per_page: 20,
        status: 'publish',
        ...params,
      },
    });
    return {
      products: transformImageUrls(response.data || []),
      total: parseInt(response.headers['x-wp-total'] || '0'),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
    };
  } catch (error) {
    logWooError('getProducts', error);
    return { products: [], total: 0, totalPages: 0 };
  }
}

export async function getProduct(slug: string): Promise<WooProduct | null> {
  try {
    const response = await wooClient.get('/products', {
      params: { slug, status: 'publish' },
    });
    const products = transformImageUrls(response.data || []);
    return products[0] || null;
  } catch (error) {
    logWooError('getProduct', error, { slug });
    return null;
  }
}

export async function getProductById(id: number): Promise<WooProduct | null> {
  try {
    if (!id || isNaN(id)) { console.error('getProductById called with invalid id:', id); return null; }
    const response = await wooClient.get(`/products/${id}`);
    const products = transformImageUrls(response.data ? [response.data] : []);
    return products[0] || null;
  } catch (error) {
    logWooError('getProductById', error, { id });
    return null;
  }
}

export async function getFeaturedProducts(limit = 8): Promise<WooProduct[]> {
  const { products } = await getProducts({ featured: true, per_page: limit });
  return products;
}

export async function getSaleProducts(limit = 8): Promise<WooProduct[]> {
  const { products } = await getProducts({ on_sale: true, per_page: limit });
  return products;
}

export async function getBestSellingProducts(limit = 8): Promise<WooProduct[]> {
  const { products } = await getProducts({ orderby: 'popularity', per_page: limit });
  return products;
}

export async function getTopRatedProducts(limit = 8): Promise<WooProduct[]> {
  const { products } = await getProducts({ orderby: 'rating', per_page: limit });
  return products;
}

export async function getNewArrivals(limit = 8): Promise<WooProduct[]> {
  const { products } = await getProducts({ orderby: 'date', order: 'desc', per_page: limit });
  return products;
}

export async function searchProducts(query: string, page = 1, perPage = 20): Promise<{
  products: WooProduct[];
  total: number;
  totalPages: number;
}> {
  return getProducts({ search: query, page, per_page: perPage });
}

export async function getProductsByBrand(brandName: string, limit = 5): Promise<WooProduct[]> {
  try {
    const { products } = await getProducts({
      search: brandName,
      per_page: limit
    });
    return products;
  } catch (error) {
    logWooError('getProductsByBrand', error, { brandName });
    return [];
  }
}

export async function getBrands(params: {
  per_page?: number;
  hide_empty?: boolean;
  orderby?: 'count' | 'name' | 'slug' | 'id';
  order?: 'asc' | 'desc';
} = {}): Promise<WooBrand[]> {
  const fallbackBrands = () => CANONICAL_BRANDS.map((brand, index) => ({
    id: -1 - index,
    name: brand.name,
    slug: brand.slugs[0],
    count: 0,
  }));

  const baseParams = {
    per_page: 100,
    hide_empty: true,
    orderby: 'count',
    order: 'desc',
    ...params,
  };

  const parseBrands = (data: unknown) => {
    if (!Array.isArray(data)) return [];
    return data
      .map((brand: any) => ({
        id: Number(brand.id),
        name: decodeHtmlEntities(brand.name).trim(),
        slug: String(brand.slug || '').trim(),
        count: Number(brand.count || 0),
        link: typeof brand.link === 'string' ? brand.link : undefined,
      }))
      .filter((brand: WooBrand) => brand.id && brand.name && brand.slug)
      .map((brand: WooBrand) => {
        const canonical = CANONICAL_BRANDS.find((item) => item.slugs.includes(brand.slug));
        return canonical ? { ...brand, name: canonical.name } : brand;
      })
      .filter((brand: WooBrand) => CANONICAL_BRANDS.some((item) => item.slugs.includes(brand.slug)));
  };

  const whitelistSlugs = new Set(CANONICAL_BRANDS.flatMap((b) => b.slugs));

  // Try internal URL first, fall back to public URL on socket errors
  for (const attempt of ['internal', 'public'] as const) {
    try {
      const allBrands: WooBrand[] = [];
      // Paginate until all whitelist brands are found or no more pages
      for (let page = 1; page <= 10; page++) {
        const queryParams = { ...baseParams, page };
        let response;
        if (attempt === 'public') {
          response = await axios.get(`${PUBLIC_SITE_URL}/wp-json/wc/v3/products/attributes/1/terms`, {
            params: { ...queryParams, consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET },
            timeout: WOO_READ_TIMEOUT_MS,
          });
        } else {
          response = await wooClient.get('/products/attributes/1/terms', {
            params: queryParams,
            timeout: WOO_READ_TIMEOUT_MS,
          });
        }
        const pageData: any[] = Array.isArray(response.data) ? response.data : [];
        allBrands.push(...parseBrands(pageData));
        // Stop if last page (fewer than per_page results) or no whitelist hits remain
        if (pageData.length < 100) break;
        const foundSlugs = new Set(allBrands.map((b) => b.slug));
        const stillMissing = [...whitelistSlugs].some((s) => !foundSlugs.has(s));
        if (!stillMissing) break;
      }
      // Deduplicate by id, keep highest count
      const seen = new Map<number, WooBrand>();
      for (const b of allBrands) {
        const existing = seen.get(b.id);
        if (!existing || b.count > existing.count) seen.set(b.id, b);
      }
      const brands = [...seen.values()];
      if (brands.length > 0) return brands;
    } catch (error: any) {
      const isSocketError = error?.cause?.code === 'ECONNRESET' || error?.message?.includes('socket hang up');
      if (IS_NEXT_BUILD) return fallbackBrands();
      if (attempt === 'internal' && isSocketError) continue;
      logWooError('getBrands', error);
      if (attempt === 'public') return fallbackBrands();
    }
  }
  return fallbackBrands();
}

export async function getBrandBySlug(slug: string): Promise<WooBrand | null> {
  const safeSlug = String(slug || '').trim();
  if (!safeSlug) return null;

  const queryParams = {
    slug: safeSlug,
    hide_empty: true,
    per_page: 10,
  };

  const parseBrands = (data: unknown): WooBrand[] => {
    if (!Array.isArray(data)) return [];
    return data
      .map((brand: any) => ({
      id: Number(brand.id),
      name: decodeHtmlEntities(brand.name).trim(),
      slug: String(brand.slug || '').trim(),
      count: Number(brand.count || 0),
      link: typeof brand.link === 'string' ? brand.link : undefined,
      }))
      .filter((brand: WooBrand) => brand.id && brand.name && brand.slug);
  };

  const findExactBrand = (data: unknown): WooBrand | null => {
    return parseBrands(data).find((brand) => brand.slug === safeSlug) || null;
  };

  const fetchBrandTerms = async (
    attempt: 'internal' | 'public',
    params: Record<string, string | number | boolean>,
  ) => {
    return attempt === 'public'
      ? axios.get(`${PUBLIC_SITE_URL}/wp-json/wc/v3/products/attributes/1/terms`, {
        params: { ...params, consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET },
        timeout: WOO_READ_TIMEOUT_MS,
      })
      : wooClient.get('/products/attributes/1/terms', {
        params,
        timeout: WOO_READ_TIMEOUT_MS,
      });
  };

  const findByPagedScan = async (attempt: 'internal' | 'public'): Promise<WooBrand | null> => {
    for (let page = 1; page <= 20; page += 1) {
      const response = await fetchBrandTerms(attempt, {
        hide_empty: true,
        per_page: 100,
        page,
      });
      const brand = findExactBrand(response.data);
      if (brand) return brand;

      const totalPages = Number(response.headers?.['x-wp-totalpages'] || 0);
      const terms = Array.isArray(response.data) ? response.data : [];
      if ((totalPages && page >= totalPages) || terms.length < 100) break;
    }

    return null;
  };

  for (const attempt of ['internal', 'public'] as const) {
    try {
      const response = await fetchBrandTerms(attempt, queryParams);

      const brand = findExactBrand(response.data) || await findByPagedScan(attempt);
      if (brand) return brand;
    } catch (error: any) {
      const isSocketError = error?.cause?.code === 'ECONNRESET' || error?.message?.includes('socket hang up');
      if (attempt === 'internal' && isSocketError) continue;
      logWooError('getBrandBySlug', error, { slug: safeSlug });
      if (attempt === 'public') return null;
    }
  }

  return null;
}

export async function getProductsByCategory(categoryId: number, limit = 5): Promise<WooProduct[]> {
  try {
    const { products } = await getProducts({
      category: categoryId.toString(),
      per_page: limit
    });
    return products;
  } catch (error) {
    logWooError('getProductsByCategory', error, { categoryId });
    return [];
  }
}

// Map origins to their associated brands for product fetching
const ORIGIN_BRAND_MAP: Record<string, string[]> = {
  'korea': ['CosRx', 'Some By Mi', 'Purito', 'ANUA', 'Dr.Althea', 'ISNTREE', 'Skin1004'],
  'japan': ['Rohto', 'Hada Labo', 'Kose', 'Shiseido', 'Tatcha'],
  'uk': ['CeraVe', 'The Ordinary', 'Paula\'s Choice'],
  'usa': ['CeraVe', 'Cetaphil', 'Neutrogena'],
  'france': ['Bioderma', 'Eucerin', 'La Roche-Posay'],
  'india': ['Minimalist', 'Dot & Key', 'Blessed Botanicals'],
  'bangladesh': ['Dabo', 'Ponds', 'Himalaya']
};

export async function getProductsByOrigin(originSlug: string, limit = 4): Promise<WooProduct[]> {
  try {
    // First, try searching by origin name directly
    const { products: searchResults } = await getProducts({
      search: originSlug,
      per_page: limit
    });

    if (searchResults.length > 0) {
      return searchResults;
    }

    // If no results from search, try fetching from brands associated with this origin
    const brands = ORIGIN_BRAND_MAP[originSlug.toLowerCase()] || [];
    const allProducts: WooProduct[] = [];

    for (const brand of brands) {
      if (allProducts.length >= limit) break;
      const { products: brandProducts } = await getProducts({
        search: brand,
        per_page: limit - allProducts.length
      });
      allProducts.push(...brandProducts);
    }

    return allProducts.slice(0, limit);
  } catch (error) {
    logWooError('getProductsByOrigin', error, { originSlug });
    return [];
  }
}

// ══════════════════════════════
// CATEGORIES API
// ══════════════════════════════

export async function getCategories(params: {
  per_page?: number;
  parent?: number;
  hide_empty?: boolean;
} = {}): Promise<WooCategory[]> {
  try {
    const response = await wooClient.get('/products/categories', {
      params: {
        per_page: 100,
        hide_empty: true,
        orderby: 'count',
        order: 'desc',
        ...params,
      },
    });
    if (!Array.isArray(response.data)) return [];
    return response.data.map(transformCategory);
  } catch (error) {
    logWooError('getCategories', error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<WooCategory | null> {
  try {
    const response = await wooClient.get('/products/categories', {
      params: { slug },
    });
    const categories = Array.isArray(response.data) ? response.data.map(transformCategory) : [];
    return categories[0] || null;
  } catch (error) {
    logWooError('getCategoryBySlug', error, { slug });
    return null;
  }
}

// ══════════════════════════════
// ORDERS API
// ══════════════════════════════

export async function createOrder(orderData: {
  payment_method: string;
  billing: WooBilling;
  shipping: WooShipping;
  line_items: { product_id: number; quantity: number }[];
  customer_id?: number;
  customer_note?: string;
}): Promise<WooOrder | null> {
  try {
    // Validate credentials are configured
    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      console.error('WooCommerce credentials not configured');
      throw new Error('Payment system not configured. Contact support.');
    }

    const orderStatus = orderData.payment_method === 'cod' ? 'processing' : 'pending';

    const response = await wooWriteClient.post('/orders', {
      ...orderData,
      currency: 'BDT',
      status: orderStatus,
    });
    return response.data;
  } catch (error: any) {
    logWooError('createOrder', error);
    throw error; // Re-throw for better error handling at caller
  }
}

export async function getCustomerOrders(customerId: number): Promise<WooOrder[]> {
  try {
    const response = await wooClient.get('/orders', {
      params: { customer: customerId, per_page: 20 },
    });
    return response.data;
  } catch (error) {
    logWooError('getCustomerOrders', error, { customerId });
    return [];
  }
}

export async function getOrder(orderId: number): Promise<WooOrder | null> {
  try {
    const response = await wooClient.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    logWooError('getOrder', error, { orderId });
    return null;
  }
}

export async function getOrderNotes(orderId: number): Promise<WooOrderNote[]> {
  try {
    const response = await wooClient.get(`/orders/${orderId}/notes`, {
      params: { per_page: 50 },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    logWooError('getOrderNotes', error, { orderId });
    return [];
  }
}

// ══════════════════════════════
// PRODUCT REVIEWS API
// ══════════════════════════════

export async function getProductReviews(productId: number): Promise<WooProductReview[]> {
  try {
    const response = await wooClient.get('/products/reviews', {
      params: {
        product: productId,
        per_page: 50,
        status: 'approved',
      },
    });

    return Array.isArray(response.data)
      ? response.data.map(transformProductReview).filter((review) => review.id && review.rating > 0)
      : [];
  } catch (error) {
    logWooError('getProductReviews', error, { productId });
    return [];
  }
}

export async function createProductReview(data: {
  product_id: number;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
}): Promise<WooProductReview | null> {
  try {
    const response = await wooWriteClient.post('/products/reviews', data);
    return transformProductReview(response.data);
  } catch (error) {
    logWooError('createProductReview', error, { productId: data.product_id });
    return null;
  }
}

// ══════════════════════════════
// CUSTOMERS API
// ══════════════════════════════

export async function getCustomer(id: number): Promise<WooCustomer | null> {
  try {
    const response = await wooClient.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function getCustomerByEmail(email: string): Promise<WooCustomer | null> {
  try {
    const response = await wooClient.get('/customers', {
      params: { email, per_page: 1 },
    });
    const [customer] = Array.isArray(response.data) ? response.data : [];
    return customer ?? null;
  } catch (error) {
    return null;
  }
}

export async function createCustomer(data: {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<WooCustomer | null> {
  try {
    const response = await wooWriteClient.post('/customers', data);
    return response.data;
  } catch (error) {
    logWooError('createCustomer', error);
    return null;
  }
}

export async function updateCustomer(id: number, data: Record<string, unknown>): Promise<WooCustomer | null> {
  try {
    const response = await wooWriteClient.put(`/customers/${id}`, data);
    return response.data;
  } catch (error) {
    logWooError('updateCustomer', error, { customerId: id });
    return null;
  }
}

// ══════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════

export function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return '৳0';
  return `৳${Math.round(num).toLocaleString('en-BD')}`;
}

export function getDiscountPercent(regular: string, sale: string): number {
  const reg = parseFloat(regular);
  const sal = parseFloat(sale);
  if (!reg || !sal) return 0;
  return Math.round(((reg - sal) / reg) * 100);
}

export function isInStock(product: WooProduct): boolean {
  return product.stock_status === 'instock' && product.purchasable;
}
