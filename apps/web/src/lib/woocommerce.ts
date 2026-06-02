// src/lib/woocommerce.ts
// WooCommerce REST API v3 Client for Emart Skincare Bangladesh

import axios from 'axios';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { formatBDT } from '@/lib/formatters';
import { STORE_POLICIES } from '@/config/storePolicies';

const PUBLIC_SITE_URL = 'https://e-mart.com.bd';
const DEFAULT_INTERNAL_WOO_URL = process.env.NODE_ENV === 'production' ? 'http://127.0.0.1' : '';
const WOO_URL = process.env.WOO_INTERNAL_URL || DEFAULT_INTERNAL_WOO_URL || process.env.NEXT_PUBLIC_WOO_URL || PUBLIC_SITE_URL;
const LEGACY_IP_HOST = ['5', '189', '188', '229'].join('.');
const LOCAL_WORDPRESS_HOSTS = new Set(['127.0.0.1', 'localhost']);
const CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || '';
const WOO_READ_TIMEOUT_MS = 8000;
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

const wordpressRestClient = axios.create({
  baseURL: `${WOO_URL}/wp-json/wp/v2`,
  headers: isHTTPS ? undefined : { Host: 'e-mart.com.bd' },
  timeout: WOO_READ_TIMEOUT_MS,
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
  brands?: WooProductBrand[];
  attributes: WooAttribute[];
  meta_data?: WooMetaData[];
  average_rating: string;
  rating_count: number;
  featured: boolean;
  emart_version?: 'us' | 'uk' | 'eu' | 'fr';
  concern_terms?: { name: string; slug: string }[];
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

export interface WooProductBrand {
  id: number;
  name: string;
  slug: string;
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
  payment_method?: string;
  payment_method_title?: string;
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

export interface WooCoupon {
  id: number;
  code: string;
  amount: string;
  discount_type: string;
  date_expires?: string | null;
  minimum_amount?: string;
  maximum_amount?: string;
}

export interface WooShippingQuote {
  city: string;
  zoneName: string;
  methodId: string;
  methodTitle: string;
  total: number;
  isFree: boolean;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number | null;
}

export interface ProductsParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  tag?: string;
  include?: string;
  attribute?: string;
  attribute_term?: string;
  orderby?: 'date' | 'price' | 'popularity' | 'rating' | 'title' | 'include';
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

function alignPolicyCopy(value: string): string {
  if (!value) return '';

  const deliveryText = STORE_POLICIES.shipping.pdpDeliveryText;

  return value
    .replace(/Dhaka\s+1[-–]\s*2\s+days?\s+delivery/gi, deliveryText)
    .replace(/delivered\s+to\s+Dhaka\s+in\s+1[-–]\s*2\s+days/gi, `delivered with ${deliveryText}`)
    .replace(/1[-–]\s*2\s+days?\s+nationwide/gi, STORE_POLICIES.shipping.overallDeliveryEstimate)
    .replace(/Within\s+1[-–]\s*3\s+Days/gi, STORE_POLICIES.shipping.overallDeliveryEstimate)
    .replace(/COD accepted\s+·\s+64 districts/gi, 'COD available')
    .replace(/Dhaka Next Day Nationwide/gi, 'Dhaka next-day · Nationwide 3–5 days')
    .replace(/free shipping when an active promotion is enabled/gi, `free shipping over ${formatBDT(STORE_POLICIES.shipping.freeShippingThreshold)}`);
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

function transformProductBrand(brand: any): WooProductBrand {
  return {
    id: Number(brand?.id || 0),
    name: decodeHtmlEntities(brand?.name),
    slug: String(brand?.slug || ''),
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
  '_emart_meta_description',
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
  return typeof value === 'string' ? alignPolicyCopy(decodeHtmlEntities(value)) : value;
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
    description: alignPolicyCopy(decodeHtmlEntities(product.description)),
    short_description: alignPolicyCopy(decodeHtmlEntities(product.short_description)),
    images: Array.isArray(product.images) ? product.images.map(transformImage) : [],
    categories: Array.isArray(product.categories) ? product.categories.map(transformCategory) : [],
    brands: Array.isArray(product.brands)
      ? product.brands.map(transformProductBrand).filter((brand: WooProductBrand) => brand.id && brand.name && brand.slug)
      : [],
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
    ...(product.emart_version ? { emart_version: product.emart_version as WooProduct['emart_version'] } : {}),
    ...(Array.isArray(product.concern_terms) && product.concern_terms.length > 0
      ? {
          concern_terms: product.concern_terms.map((t: any) => ({
            name: String(t.name || ''),
            slug: String(t.slug || ''),
          })),
        }
      : {}),
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

function transformCoupon(coupon: any): WooCoupon {
  return {
    id: Number(coupon?.id || 0),
    code: String(coupon?.code || '').trim(),
    amount: String(coupon?.amount || ''),
    discount_type: String(coupon?.discount_type || ''),
    date_expires: coupon?.date_expires ? String(coupon.date_expires) : null,
    minimum_amount: coupon?.minimum_amount ? String(coupon.minimum_amount) : '',
    maximum_amount: coupon?.maximum_amount ? String(coupon.maximum_amount) : '',
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

function getWooSafeMessage(context: string, error: unknown): string {
  const safe = getSafeWooError(error);
  return `${context} failed: ${String(safe.message || 'Unknown error')}`;
}

function isWooNetworkError(error: any): boolean {
  return (
    error?.cause?.code === 'ECONNRESET' ||
    error?.message?.includes('socket hang up') ||
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ECONNABORTED'
  );
}

function isBlockedFallbackStatus(error: any): boolean {
  const status = error?.response?.status;
  return status === 401 || status === 403 || status === 404;
}

const _getProductsCached = unstable_cache(
  async (params: ProductsParams): Promise<{ products: WooProduct[]; total: number; totalPages: number }> => {
    const response = await wooClient.get('/products', {
      params: { per_page: 20, status: 'publish', ...params },
    }).catch((error) => {
      throw new Error(getWooSafeMessage('getProducts', error));
    });
    return {
      products: transformImageUrls(response.data || []),
      total: parseInt(response.headers['x-wp-total'] || '0'),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
    };
  },
  ['woo-products'],
  {
    revalidate: 3600,
    // 'products' = global tag (flush all lists); param-scoped tags allow targeted revalidation.
    // revalidateTag('category-face-cleansers') only flushes that category's cached pages.
    // revalidateTag('brand-cosrx') only flushes COSRX product list pages.
    tags: ['products'],
  },
);

export async function getProducts(params: ProductsParams = {}): Promise<{
  products: WooProduct[];
  total: number;
  totalPages: number;
}> {
  try {
    return await _getProductsCached(params);
  } catch (error) {
    logWooError('getProducts', error);
    return { products: [], total: 0, totalPages: 0 };
  }
}

export async function getCatalogProductCount(): Promise<number> {
  const { total } = await getProducts({ per_page: 1 });
  return total;
}

export function formatCatalogProductCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '';
  return count.toLocaleString('en-BD');
}

export const getProduct = cache(async (slug: string): Promise<WooProduct | null> => {
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
});

export const getCachedProduct = (slug: string) =>
  unstable_cache(
    () => getProduct(slug),
    [`product-${slug}`],
    { tags: [`product-${slug}`, 'products'], revalidate: 86400 }
  )();

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

export async function calculateLineItemsSubtotal(
  lineItems: { product_id: number; quantity: number }[],
): Promise<number> {
  let subtotal = 0;

  for (const item of lineItems) {
    const productId = Number(item?.product_id || 0);
    const quantity = Math.max(1, Math.floor(Number(item?.quantity || 1)));
    if (!productId) continue;

    const product = await getProductById(productId);
    const price = Number(product?.sale_price || product?.price || product?.regular_price || 0);
    if (Number.isFinite(price) && price > 0) {
      subtotal += price * quantity;
    }
  }

  return Math.round(subtotal);
}

function methodSettingValue(method: any, key: string): string {
  const setting = method?.settings?.[key];
  if (setting && typeof setting === 'object' && 'value' in setting) {
    return String(setting.value || '');
  }
  return '';
}

function methodCost(method: any): number {
  const value = methodSettingValue(method, 'cost') || String(method?.cost || '');
  const numeric = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function methodMinAmount(method: any): number | null {
  const value = methodSettingValue(method, 'min_amount') || String(method?.min_amount || '');
  const numeric = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function isShippingMethodEnabled(method: any): boolean {
  return method?.enabled === true || method?.enabled === 'yes' || method?.enabled === '1';
}

function shippingMethodId(method: any): string {
  return String(method?.method_id || method?.id || '');
}

export async function getShippingQuote(city: string, subtotal: number): Promise<WooShippingQuote> {
  const normalizedCity = String(city || '').trim().toLowerCase();
  const wantsDhaka = normalizedCity === 'dhaka' || normalizedCity.includes('dhaka');
  const fallback = wantsDhaka
    ? { zoneName: 'Dhaka City', methodId: 'flat_rate', methodTitle: 'Delivery inside Dhaka', total: STORE_POLICIES.shipping.dhakaShippingFee }
    : { zoneName: 'All Bangladesh', methodId: 'flat_rate', methodTitle: 'Delivery outside Dhaka', total: STORE_POLICIES.shipping.outsideDhakaShippingFee };

  try {
    const zonesResponse = await wooClient.get('/shipping/zones');
    const zones = Array.isArray(zonesResponse.data) ? zonesResponse.data : [];
    const zone = zones.find((item: any) => {
      const name = String(item?.name || '').toLowerCase();
      return wantsDhaka ? name.includes('dhaka') : name.includes('bangladesh');
    });

    if (!zone?.id) {
      return { city, ...fallback, isFree: false, freeShippingEnabled: false, freeShippingThreshold: null };
    }

    const methodsResponse = await wooClient.get(`/shipping/zones/${zone.id}/methods`);
    const methods = Array.isArray(methodsResponse.data) ? methodsResponse.data : [];
    const flatRate = methods.find((method: any) => shippingMethodId(method) === 'flat_rate' && isShippingMethodEnabled(method));
    const freeShipping = methods.find((method: any) => shippingMethodId(method) === 'free_shipping' && isShippingMethodEnabled(method));
    const threshold = freeShipping ? methodMinAmount(freeShipping) : null;
    const freeApplies = Boolean(freeShipping && (!threshold || subtotal >= threshold));

    if (freeApplies) {
      return {
        city,
        zoneName: String(zone.name || fallback.zoneName),
        methodId: 'free_shipping',
        methodTitle: String(freeShipping.title || 'Free Delivery'),
        total: 0,
        isFree: true,
        freeShippingEnabled: true,
        freeShippingThreshold: threshold,
      };
    }

    const cost = flatRate ? methodCost(flatRate) : fallback.total;
    return {
      city,
      zoneName: String(zone.name || fallback.zoneName),
      methodId: flatRate ? 'flat_rate' : fallback.methodId,
      methodTitle: String(flatRate?.title || fallback.methodTitle),
      total: Math.round(cost),
      isFree: false,
      freeShippingEnabled: Boolean(freeShipping),
      freeShippingThreshold: threshold,
    };
  } catch (error) {
    logWooError('getShippingQuote', error, { city, subtotal });
    return { city, ...fallback, isFree: false, freeShippingEnabled: false, freeShippingThreshold: null };
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
      .filter((brand: WooBrand) => brand.id && brand.name && brand.slug);
  };

  for (const attempt of ['internal', 'public'] as const) {
    try {
      const allBrands: WooBrand[] = [];
      for (let page = 1; page <= 10; page++) {
        const queryParams = { ...baseParams, page };
        let response;
        if (attempt === 'public') {
          response = await axios.get(`${PUBLIC_SITE_URL}/wp-json/wp/v2/product_brand`, {
            params: queryParams,
            timeout: WOO_READ_TIMEOUT_MS,
          });
        } else {
          response = await wordpressRestClient.get('/product_brand', {
            params: queryParams,
            timeout: WOO_READ_TIMEOUT_MS,
          });
        }
        const pageData: any[] = Array.isArray(response.data) ? response.data : [];
        allBrands.push(...parseBrands(pageData));
        if (pageData.length < 100) break;
      }
      const seen = new Map<number, WooBrand>();
      for (const b of allBrands) {
        const existing = seen.get(b.id);
        if (!existing || b.count > existing.count) seen.set(b.id, b);
      }
      const brands = [...seen.values()];
      if (brands.length > 0) return brands;
    } catch (error: any) {
      const isSocketError = error?.cause?.code === 'ECONNRESET' || error?.message?.includes('socket hang up');
      if (IS_NEXT_BUILD) return [];
      if (attempt === 'internal' && isSocketError) continue;
      logWooError('getBrands', error);
      if (attempt === 'public') return [];
    }
  }
  return [];
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
      ? axios.get(`${PUBLIC_SITE_URL}/wp-json/wp/v2/product_brand`, {
        params,
        timeout: WOO_READ_TIMEOUT_MS,
      })
      : wordpressRestClient.get('/product_brand', {
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

  let shouldTryPublicFallback = false;

  for (const attempt of ['internal', 'public'] as const) {
    if (attempt === 'public' && !shouldTryPublicFallback) return null;

    try {
      const response = await fetchBrandTerms(attempt, queryParams);

      const brand = findExactBrand(response.data) || await findByPagedScan(attempt);
      if (brand) return brand;
      if (attempt === 'internal') return null;
    } catch (error: any) {
      if (attempt === 'internal' && isWooNetworkError(error)) {
        shouldTryPublicFallback = true;
        continue;
      }
      if (attempt === 'public' && isBlockedFallbackStatus(error)) return null;
      logWooError('getBrandBySlug', error, { slug: safeSlug });
      if (attempt === 'public') return null;
    }
  }

  return null;
}

export async function getProductIdsByBrand(brandId: number, page = 1, perPage = 24): Promise<{
  ids: number[];
  total: number;
  totalPages: number;
}> {
  try {
    const response = await wordpressRestClient.get('/product', {
      params: {
        product_brand: brandId,
        status: 'publish',
        per_page: perPage,
        page,
        _fields: 'id',
      },
      timeout: WOO_READ_TIMEOUT_MS,
    });
    return {
      ids: Array.isArray(response.data) ? response.data.map((item: any) => Number(item.id)).filter(Boolean) : [],
      total: parseInt(response.headers['x-wp-total'] || '0'),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
    };
  } catch (error) {
    logWooError('getProductIdsByBrand', error, { brandId });
    return { ids: [], total: 0, totalPages: 0 };
  }
}

export async function getAllProductIdsByBrand(brandId: number): Promise<number[]> {
  const ids: number[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const result = await getProductIdsByBrand(brandId, page, 100);
    ids.push(...result.ids);
    if (!result.ids.length || page >= result.totalPages) break;
  }
  return [...new Set(ids)];
}

export async function getProductsByProductBrand(brandId: number, page = 1, perPage = 24): Promise<{
  products: WooProduct[];
  total: number;
  totalPages: number;
}> {
  const { ids, total, totalPages } = await getProductIdsByBrand(brandId, page, perPage);
  if (!ids.length) return { products: [], total, totalPages };

    const { products } = await getProducts({
    include: ids.join(','),
    per_page: perPage,
    orderby: 'include',
  });
  const order = new Map(ids.map((id, index) => [id, index]));
  products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return { products, total, totalPages };
}

const ORIGIN_ATTRIBUTE_ID = 9;

export interface WooOriginTerm {
  id: number;
  name: string;
  slug: string;
  count: number;
}

const _getOriginTermsCached = unstable_cache(
  async (): Promise<WooOriginTerm[]> => {
    const response = await wooClient.get(`/products/attributes/${ORIGIN_ATTRIBUTE_ID}/terms`, {
      params: {
        per_page: 100,
        orderby: 'count',
        order: 'desc',
      },
      timeout: WOO_READ_TIMEOUT_MS,
    });
    return Array.isArray(response.data)
      ? response.data.map((term: any) => ({
          id: Number(term.id),
          name: term.name,
          slug: term.slug,
          count: Number(term.count || 0),
        }))
      : [];
  },
  ['woo-origin-terms'],
  { revalidate: 3600, tags: ['products'] },
);

export async function getOriginTermCounts(): Promise<Record<string, number>> {
  try {
    const terms = await _getOriginTermsCached();
    return Object.fromEntries(terms.map((term) => [term.slug, term.count]));
  } catch (error) {
    logWooError('getOriginTermCounts', error);
    return {};
  }
}

export async function getOriginTermBySlug(slug: string): Promise<{ id: number; name: string; slug: string } | null> {
  try {
    const response = await wooClient.get(`/products/attributes/${ORIGIN_ATTRIBUTE_ID}/terms`, {
      params: {
        slug,
        per_page: 1,
      },
      timeout: WOO_READ_TIMEOUT_MS,
    });
    const term = Array.isArray(response.data) ? response.data[0] : null;
    return term ? { id: Number(term.id), name: term.name, slug: term.slug } : null;
  } catch (error) {
    logWooError('getOriginTermBySlug', error, { slug });
    return null;
  }
}

export async function getProductsByOriginTermSlug(
  slug: string,
  page = 1,
  perPage = 24,
  extras?: { orderby?: 'date'|'price'|'popularity'|'rating'|'title'; order?: 'asc'|'desc'; min_price?: string; max_price?: string; stock_status?: 'instock'|'outofstock'|'onbackorder' },
): Promise<{
  products: WooProduct[];
  total: number;
  totalPages: number;
}> {
  const term = await getOriginTermBySlug(slug);
  if (!term) return { products: [], total: 0, totalPages: 0 };

  return getProducts({
    page,
    per_page: perPage,
    orderby: 'date',
    order: 'desc',
    attribute: 'pa_origin',
    attribute_term: String(term.id),
    ...extras,
  });
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
  'india': ['Minimalist', 'Dot & Key', 'The Derma Co', 'Mamaearth', 'Wishcare', 'Aqualogica', 'Blessed Botanicals'],
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

const _getCategoriesCached = unstable_cache(
  async (perPage: number, parent: number | undefined, hideEmpty: boolean): Promise<WooCategory[]> => {
    const response = await wooClient.get('/products/categories', {
      params: {
        per_page: perPage,
        hide_empty: hideEmpty,
        orderby: 'count',
        order: 'desc',
        ...(parent !== undefined ? { parent } : {}),
      },
    });
    if (!Array.isArray(response.data)) return [];
    return response.data.map(transformCategory);
  },
  ['woo-categories'],
  { revalidate: 3600, tags: ['categories'] },
);

export async function getCategories(params: {
  per_page?: number;
  parent?: number;
  hide_empty?: boolean;
} = {}): Promise<WooCategory[]> {
  try {
    return await _getCategoriesCached(
      params.per_page ?? 100,
      params.parent,
      params.hide_empty ?? true,
    );
  } catch (error) {
    logWooError('getCategories', error);
    return [];
  }
}

const _getCategoryBySlugCached = unstable_cache(
  async (slug: string): Promise<WooCategory | null> => {
    const response = await wooClient.get('/products/categories', { params: { slug } });
    const categories = Array.isArray(response.data) ? response.data.map(transformCategory) : [];
    return categories[0] || null;
  },
  ['woo-category-by-slug'],
  { revalidate: 600, tags: ['categories'] },
);

export async function getCategoryBySlug(slug: string): Promise<WooCategory | null> {
  try {
    return await _getCategoryBySlugCached(slug);
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
  payment_method_title?: string;
  billing: WooBilling;
  shipping: WooShipping;
  line_items: { product_id: number; quantity: number }[];
  shipping_lines?: { method_id: string; method_title: string; total: string }[];
  customer_id?: number;
  customer_note?: string;
  coupon_lines?: { code: string }[];
  meta_data?: { key: string; value: string }[];
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

export async function getRecentOrders(limit = 10): Promise<WooOrder[]> {
  try {
    const response = await wooClient.get('/orders', {
      params: {
        per_page: limit,
        orderby: 'date',
        order: 'desc',
        status: 'processing,completed',
      },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    logWooError('getRecentOrders', error, { limit });
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

export async function getOrders(params: {
  status?: string;
  per_page?: number;
  page?: number;
}): Promise<WooOrder[]> {
  try {
    const response = await wooClient.get('/orders', { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    logWooError('getOrders', error, params);
    return [];
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

export async function updateOrder(
  orderId: number,
  data: { status?: string; meta_data?: { key: string; value: string }[] },
): Promise<WooOrder | null> {
  try {
    const response = await wooClient.put(`/orders/${orderId}`, data);
    return response.data;
  } catch (error) {
    logWooError('updateOrder', error, { orderId });
    return null;
  }
}

export async function addOrderNote(orderId: number, note: string, customerNote = false): Promise<void> {
  try {
    await wooClient.post(`/orders/${orderId}/notes`, { note, customer_note: customerNote });
  } catch (error) {
    logWooError('addOrderNote', error, { orderId });
  }
}

// ══════════════════════════════
// PRODUCT REVIEWS API
// ══════════════════════════════

const _getProductReviewsCached = unstable_cache(
  async (productId: number): Promise<WooProductReview[]> => {
    const response = await wooClient.get('/products/reviews', {
      params: { product: productId, per_page: 50, status: 'approved' },
    });
    return Array.isArray(response.data)
      ? response.data.map(transformProductReview).filter((r) => r.id && r.rating > 0)
      : [];
  },
  ['product-reviews'],
  { revalidate: 3600 },
);

export async function getProductReviews(productId: number): Promise<WooProductReview[]> {
  try {
    return await _getProductReviewsCached(productId);
  } catch (error) {
    logWooError('getProductReviews', error, { productId });
    return [];
  }
}

export async function getRecentProductReviews(limit = 12): Promise<WooProductReview[]> {
  try {
    const response = await wooClient.get('/products/reviews', {
      params: {
        per_page: limit,
        status: 'approved',
        orderby: 'date_gmt',
        order: 'desc',
      },
    });

    return Array.isArray(response.data)
      ? response.data.map(transformProductReview).filter((review) => review.id && review.rating > 0)
      : [];
  } catch (error) {
    logWooError('getRecentProductReviews', error, { limit });
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
// COUPONS API
// ══════════════════════════════

export async function getCouponsByCode(code: string): Promise<WooCoupon[]> {
  const normalizedCode = code.trim();
  if (!normalizedCode) return [];

  try {
    const response = await wooClient.get('/coupons', {
      params: { code: normalizedCode, per_page: 5 },
    });

    return Array.isArray(response.data)
      ? response.data.map(transformCoupon).filter((coupon) => coupon.id && coupon.code)
      : [];
  } catch (error) {
    logWooError('getCouponsByCode', error);
    return [];
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

export function formatPrice(price: string | number | null | undefined): string {
  return formatBDT(price);
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
