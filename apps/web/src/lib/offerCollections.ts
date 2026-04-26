import {
  getBestSellingProducts,
  getFeaturedProducts,
  getNewArrivals,
  getProducts,
  searchProducts,
  type WooProduct,
} from '@/lib/woocommerce';
import { OFFER_COLLECTIONS, type OfferCollectionSlug } from '@/lib/offerCollectionConfig';

const OFFER_CONFIG_MAP = new Map(OFFER_COLLECTIONS.map((item) => [item.slug, item]));
const BAD_OFFER_IMAGE_SLUGS = new Set([
  'clean-clear-cleanser-buy-1-get-1-free',
  'pookie-combo-offer-6-buy-2-trendy-beauties-liquid-matte-waterproof-lipstick-and-get-1-free',
  'pookie-combo-offer-5-buy-2-trendy-beauties-liquid-matte-waterproof-lipstick-and-get-1-free',
  'pookie-combo-offer-4-beauty-glazed-phantom-concealer-beauty-glazed-soft-focus-powder-beauty-glazed-2in1-bushy-big-eyeliner-mascara-beauty-glazed-tint-blush-beauty-glazed-velvet-soft-mist-li',
  'pookie-combo-offer-2-beauty-glazed-lively-waterproof-long-lasting-lip-liner-beauty-glazed-matte-lipstick',
  'pookie-combo-offer-1-beauty-glazed-lively-waterproof-long-lasting-lip-liner-beauty-glazed-lip-glow-oil-beauty-glazed-matte-lipstick',
  'pookie-combo-offer-5-buy-2-trendy-beauties-liquid-matte-waterproof-lipstick-and-get-1-free-2',
]);

const EMARTWAY_IMAGE_OVERRIDES: Record<string, string> = {
  'buy-1-get-1-buy-christian-dean-secret-tone-up-sun-cream-spf50-pa-70ml-the-dermalix-niacinamide-4-alpha-arbutin-2-brightening-serum-30ml':
    'https://d1puc9h291tp0h.cloudfront.net/uploads/all/AiHRHOfX8LMeMgevbnBE8cdAkP8K6V3Tqrx1xA8m.webp',
  'combo-dabo-all-in-one-snail-96-mucin-essence-100ml-dabo-all-in-one-black-snail-repair-cream-50ml':
    'https://d1puc9h291tp0h.cloudfront.net/uploads/all/ZmDG7dIuXKQpwadtIilsuu4akUdGui0CiLm8Ljk1.webp',
};

function sanitizeOfferProducts(products: WooProduct[]) {
  return products
    .filter((product) => product?.slug && !BAD_OFFER_IMAGE_SLUGS.has(product.slug))
    .map((product) => {
      const override = EMARTWAY_IMAGE_OVERRIDES[product.slug];
      if (!override || !product.images?.length) return product;

      return {
        ...product,
        images: [
          {
            ...product.images[0],
            src: override,
          },
          ...product.images.slice(1),
        ],
      };
    });
}

function dedupeProducts(products: WooProduct[]) {
  const seen = new Set<number>();
  return products.filter((product) => {
    if (!product?.id || seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function numericPrice(product: WooProduct) {
  return parseFloat(product.sale_price || product.price || product.regular_price || '0') || 0;
}

function discountPercent(product: WooProduct) {
  const regular = parseFloat(product.regular_price || '0') || 0;
  const sale = parseFloat(product.sale_price || product.price || '0') || 0;
  if (!regular || !sale || sale >= regular) return 0;
  return Math.round(((regular - sale) / regular) * 100);
}

async function fetchSearchTerms(terms: string[], perPage = 24) {
  const results = await Promise.all(terms.map((term) => searchProducts(term, 1, perPage)));
  return dedupeProducts(results.flatMap((entry) => entry.products));
}

function limitProducts(primary: WooProduct[], fallback: WooProduct[], limit = 24) {
  return sanitizeOfferProducts(dedupeProducts([...primary, ...fallback])).slice(0, limit);
}

export function getOfferCollectionConfig(slug: string) {
  return OFFER_CONFIG_MAP.get(slug as OfferCollectionSlug) || null;
}

export async function getOfferCollectionProducts(slug: OfferCollectionSlug, limit = 24) {
  const [
    comboSearch,
    bogoSearch,
    saleResult,
    popularResult,
    featuredProducts,
    newArrivals,
    bestSellers,
  ] = await Promise.all([
    fetchSearchTerms(['combo', 'offer'], 40),
    fetchSearchTerms(['1+1', 'buy 1 get 1', 'bogo'], 20),
    getProducts({ on_sale: true, per_page: 80, orderby: 'popularity', order: 'desc' }),
    getProducts({ per_page: 80, orderby: 'popularity', order: 'desc' }),
    getFeaturedProducts(24),
    getNewArrivals(24),
    getBestSellingProducts(24),
  ]);

  const saleProducts = dedupeProducts(saleResult.products);
  const popularProducts = dedupeProducts(popularResult.products);
  const comboProducts = comboSearch.filter((product) => /combo|offer|bundle|1\+1|buy 1 get 1/i.test(product.name));
  const bogoProducts = bogoSearch.filter((product) => /1\+1|buy 1 get 1|bogo/i.test(product.name));

  switch (slug) {
    case 'combo':
      return limitProducts(comboProducts, [...saleProducts, ...popularProducts], limit);

    case 'bogo':
      return limitProducts(bogoProducts, comboProducts, limit);

    case 'clearance-sale': {
      const sorted = [...saleProducts].sort((a, b) => discountPercent(b) - discountPercent(a) || numericPrice(a) - numericPrice(b));
      return limitProducts(sorted, comboProducts, limit);
    }

    case 'free-delivery': {
      const premiumCombos = comboProducts.filter((product) => numericPrice(product) >= 3000);
      const premiumProducts = popularProducts.filter((product) => numericPrice(product) >= 3000);
      return limitProducts(premiumCombos, premiumProducts, limit);
    }

    case 'coupon': {
      const couponReady = [...saleProducts].sort((a, b) => discountPercent(b) - discountPercent(a));
      return limitProducts(couponReady, [...featuredProducts, ...bestSellers], limit);
    }

    case 'eid-offer':
    default:
      return limitProducts(
        dedupeProducts([...featuredProducts, ...saleProducts, ...newArrivals]),
        [...bestSellers, ...comboProducts],
        limit,
      );
  }
}
