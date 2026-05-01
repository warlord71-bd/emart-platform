import {
  getCategories,
  getProductById,
  getProducts,
  getRecentOrders,
  getRecentProductReviews,
  type WooCategory,
  type WooOrder,
  type WooProduct,
  type WooProductReview,
} from '@/lib/woocommerce';
import { HOME_TOP_CATEGORY_ORDER, type TopCategoryConfig } from '@/lib/category-navigation';

const FIVE_MINUTES = 5 * 60 * 1000;
const FLASH_DURATION_MS = 6 * 60 * 60 * 1000;
const BACKEND_ONLY_CATEGORY_SLUGS = new Set([
  'k-beauty-j-beauty',
  'shop-by-concern',
  'moms-corner',
]);

export interface CategoryPulse {
  id: number;
  name: string;
  slug: string;
  href?: string;
  product_count: number;
  trend_pct: number;
  active_viewers: number;
  is_hot: boolean;
  display_order: number;
  is_trending: boolean;
  icon_url?: string;
}

export interface FlashPromotion {
  id: string;
  name: string;
  type: string;
  starts_at: string;
  ends_at: string;
}

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  brand: string;
  image: string;
  price: number;
  sale_price: number;
  original_price: number;
  growth_rate: number;
  stock_remaining: number;
  stock_sold: number;
  stock_total: number;
}

export interface ConcernSummary {
  id: number;
  name: string;
  slug: string;
  product_count: number;
  review_count: number;
  avg_rating: number;
  top_product?: { name: string; slug: string };
}

export interface FeaturedReview {
  id: number;
  quote: string;
  rating: number;
  verified: boolean;
  customer_first_name: string;
  customer_city: string;
  product?: { name: string; slug: string };
}

export interface RecentPurchase {
  id: number;
  customer_first_name: string;
  city: string;
  product_name: string;
  timestamp: string;
}

function stableNumber(seed: string | number, min: number, max: number) {
  const source = String(seed);
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 100000;
  }
  return min + (hash % (max - min + 1));
}

function parsePrice(value: string | number | undefined) {
  const price = typeof value === 'number' ? value : Number.parseFloat(String(value || '0'));
  return Number.isFinite(price) ? price : 0;
}

function getBrand(product: WooProduct) {
  const brand = product.attributes?.find((attribute) => attribute.name.toLowerCase().includes('brand'));
  return brand?.options?.[0] || product.categories?.[0]?.name || 'Emart';
}

export function mapProductSummary(product: WooProduct): ProductSummary {
  const original = parsePrice(product.regular_price || product.price);
  const sale = parsePrice(product.sale_price || product.price || product.regular_price);
  const stockRemaining = Math.max(0, product.stock_quantity ?? stableNumber(product.id, 7, 46));
  const stockTotal = Math.max(stockRemaining + stableNumber(product.slug, 12, 70), stockRemaining || 1);
  const stockSold = Math.max(0, stockTotal - stockRemaining);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: getBrand(product),
    image: product.images?.[0]?.src || '/logo.png',
    price: parsePrice(product.price || product.sale_price || product.regular_price),
    sale_price: sale,
    original_price: original || sale,
    growth_rate: stableNumber(product.slug, 18, 96),
    stock_remaining: stockRemaining,
    stock_sold: stockSold,
    stock_total: stockTotal,
  };
}

export function getActiveFlashPromotion(): FlashPromotion {
  const now = Date.now();
  const windowStart = Math.floor(now / FLASH_DURATION_MS) * FLASH_DURATION_MS;
  return {
    id: `flash-week-${windowStart}`,
    name: 'Flash Week',
    type: 'flash_week',
    starts_at: new Date(windowStart).toISOString(),
    ends_at: new Date(windowStart + FLASH_DURATION_MS).toISOString(),
  };
}

export async function getCategoryPulses(limit = 8): Promise<CategoryPulse[]> {
  const categories = await getCategories({ per_page: 100, hide_empty: true });
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const curated = HOME_TOP_CATEGORY_ORDER
    .map((item) => {
      const slug = item.slug
        || item.slugCandidates?.find((candidate) => bySlug.has(candidate))
        || item.fallbackSlug;
      const category = slug ? bySlug.get(slug) : undefined;
      if (!category?.slug || !category.count) return null;
      return { item, category };
    })
    .filter((entry): entry is { item: typeof HOME_TOP_CATEGORY_ORDER[number]; category: WooCategory } => Boolean(entry));

  const seen = new Set(curated.map(({ category }) => category.slug));
  const fallback: Array<{ item: TopCategoryConfig; category: WooCategory }> = categories
    .filter((category) => (
      category.slug
      && category.count
      && !seen.has(category.slug)
      && !BACKEND_ONLY_CATEGORY_SLUGS.has(category.slug)
    ))
    .map((category) => ({ item: { name: category.name }, category }));

  return [...curated, ...fallback]
    .slice(0, limit)
    .map(({ item, category }, index) => {
      const trend = stableNumber(category.slug, 16, 92);
      return {
        id: category.id,
        name: item.name || category.name,
        slug: category.slug,
        href: item.href || `/category/${category.slug}`,
        product_count: category.count || 0,
        trend_pct: trend,
        active_viewers: stableNumber(`${category.slug}-viewers`, 8, 68),
        is_hot: trend > 60 || index < 2,
        display_order: index + 1,
        is_trending: trend > 55,
        icon_url: category.image?.src,
      };
    });
}

export async function getActiveSessions(categoryId?: string | number) {
  const categories = await getCategoryPulses(12);
  const total = categories.reduce((sum, category) => sum + category.active_viewers, 0);
  const selected = categoryId
    ? categories.find((category) => String(category.id) === String(categoryId) || category.slug === String(categoryId))
    : undefined;

  return {
    total: selected?.active_viewers ?? Math.max(24, total),
    categories: categories.map((category) => ({
      category_id: category.id,
      slug: category.slug,
      active_viewers: category.active_viewers,
    })),
    updated_at: new Date().toISOString(),
  };
}

export async function getTrendingProducts(limit = 4): Promise<ProductSummary[]> {
  const { products } = await getProducts({
    per_page: Math.max(limit, 8),
    orderby: 'popularity',
    order: 'desc',
    stock_status: 'instock',
  });
  return products.slice(0, limit).map(mapProductSummary);
}

export async function getFlashProducts(limit = 5): Promise<ProductSummary[]> {
  const { products } = await getProducts({
    per_page: Math.max(limit, 10),
    on_sale: true,
    orderby: 'popularity',
    order: 'desc',
    stock_status: 'instock',
  });
  return products.slice(0, limit).map(mapProductSummary);
}

export async function getConcernSummaries(limit = 4): Promise<ConcernSummary[]> {
  const categories = await getCategories({ per_page: 50, hide_empty: true });
  const concernCandidates = categories
    .filter((category) => /acne|blemish|dry|sensitive|sensitivity|bright|aging|pores|melasma|hydration|sunscreen/i.test(`${category.name} ${category.slug}`))
    .slice(0, limit);

  const result = await Promise.all(concernCandidates.map(async (category) => {
    const { products } = await getProducts({
      category: String(category.id),
      per_page: 1,
      orderby: 'rating',
      order: 'desc',
      stock_status: 'instock',
    });
    const topProduct = products[0];
    const rating = topProduct ? Number.parseFloat(topProduct.average_rating || '0') : 0;
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      product_count: category.count || 0,
      review_count: topProduct?.rating_count || stableNumber(category.slug, 18, 180),
      avg_rating: rating > 0 ? rating : 4.8,
      top_product: topProduct ? { name: topProduct.name, slug: topProduct.slug } : undefined,
    };
  }));

  return result;
}

function anonymiseName(value: string) {
  const first = (value || 'Emart customer').trim().split(/\s+/)[0] || 'Emart';
  return `${first} M.`;
}

function mapRecentOrder(order: WooOrder): RecentPurchase | null {
  const created = new Date(order.date_created);
  if (Number.isNaN(created.getTime()) || Date.now() - created.getTime() > FIVE_MINUTES) return null;
  const item = order.line_items?.[0];
  if (!item) return null;

  return {
    id: order.id,
    customer_first_name: anonymiseName(order.billing?.first_name || order.shipping?.first_name || 'Customer'),
    city: order.billing?.city || order.shipping?.city || 'Bangladesh',
    product_name: item.name,
    timestamp: order.date_created,
  };
}

export async function getRecentPurchases(limit = 10): Promise<RecentPurchase[]> {
  const orders = await getRecentOrders(limit);
  return orders.map(mapRecentOrder).filter(Boolean) as RecentPurchase[];
}

function mapFeaturedReview(review: WooProductReview, product?: WooProduct | null): FeaturedReview {
  return {
    id: review.id,
    quote: review.review,
    rating: review.rating,
    verified: review.verified,
    customer_first_name: anonymiseName(review.reviewer),
    customer_city: 'Bangladesh',
    product: product ? { name: product.name, slug: product.slug } : undefined,
  };
}

export async function getFeaturedReviews(limit = 3): Promise<FeaturedReview[]> {
  const all = await getRecentProductReviews(50);
  // Prefer 5-star; fall back to 4+ star if pool is thin. Skip verified filter —
  // WooCommerce marks purchased-then-reviewed as verified; unverified are still real reviews.
  const strict = all.filter((r) => r.rating >= 5);
  const reviews = (strict.length >= limit ? strict : all.filter((r) => r.rating >= 4))
    .slice(0, limit);

  const productsById = new Map<number, WooProduct | null>();
  const result: FeaturedReview[] = [];
  for (const review of reviews) {
    let product = productsById.get(review.product_id);
    if (product === undefined) {
      product = await getProductById(review.product_id);
      productsById.set(review.product_id, product);
    }
    result.push(mapFeaturedReview(review, product));
  }

  return result;
}
