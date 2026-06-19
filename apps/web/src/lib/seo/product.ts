import type { WooProduct } from '@/lib/woocommerce';
import type { WooProductReview } from '@/lib/woo/types';
import { absoluteUrl } from '@/lib/siteUrl';
import { STORE_POLICIES } from '@/config/storePolicies';
import { getCleanBreadcrumbCategory } from '@/lib/product-display';
import { getProductBrandName, getProductType } from '@/lib/product-utils';
import { normalizeStockAvailability } from '@/lib/stock';
import { truncateTitle } from '@/lib/seoText';

// ── Primitive helpers ─────────────────────────────────────────────────────────

export function getProductMetaString(product: WooProduct, key: string): string | null {
  const v = product.meta_data?.find((m) => m.key === key)?.value;
  return v && typeof v === 'string' && v.trim().length > 5 ? v.trim() : null;
}

export function syncLivePrice(text: string, product: WooProduct): string {
  const live = Math.round(Number.parseFloat(product.price || product.regular_price || '0'));
  if (live <= 0) return text;
  return text.replace(/৳\s*[\d,]+/g, `৳${live.toLocaleString('en-BD')}`);
}

function getNumericPrice(product: WooProduct): string | null {
  const price = Number.parseFloat(product.price || product.sale_price || product.regular_price || '0');
  return Number.isFinite(price) && price > 0 ? price.toFixed(2) : null;
}

function getGtinFields(sku: string): Record<string, string> {
  const s = sku?.trim() || '';
  if (/^\d{13}$/.test(s)) return { gtin13: s };
  if (/^\d{12}$/.test(s)) return { gtin12: s };
  if (/^\d{8}$/.test(s)) return { gtin8: s };
  return {};
}

function getPriceValidUntil(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// Maps real purchasability (same authority used by checkout) to schema.org
// availability — backorder-eligible items get BackOrder rather than InStock/OutOfStock.
function getSchemaAvailability(product: WooProduct): string {
  const availability = normalizeStockAvailability(product);
  if (!availability.available) return 'https://schema.org/OutOfStock';
  if (availability.stock_status === 'onbackorder' || availability.reason === 'managed_backorders_allowed') {
    return 'https://schema.org/BackOrder';
  }
  return 'https://schema.org/InStock';
}

// ── SEO description ───────────────────────────────────────────────────────────

export function getSeoDescription(product: WooProduct): string {
  const emartMeta = getProductMetaString(product, '_emart_meta_description');
  if (emartMeta) return syncLivePrice(emartMeta, product);

  const rankMathMeta = getProductMetaString(product, '_rank_math_description');
  if (rankMathMeta) return syncLivePrice(rankMathMeta, product);

  const shortDesc = product.short_description?.replace(/<[^>]+>/g, '').trim();
  if (shortDesc && shortDesc.length > 20) return shortDesc.substring(0, 160);

  const brand = getProductBrandName(product);
  const category = getCleanBreadcrumbCategory(product)?.label;
  const price = parseFloat(product.price || product.regular_price || '0');
  const priceStr = price > 0 ? ` ৳${Math.round(price).toLocaleString('en-BD')} price.` : '';

  const parts: string[] = [`Buy ${product.name} in Bangladesh from Emart.`];
  if (brand) parts.push(`Authentic ${brand}${category ? ` ${category}` : ''} product.`);
  parts.push(`Fast delivery & COD available.${priceStr}`);

  return parts.join(' ').substring(0, 160);
}

// ── JSON-LD generators ────────────────────────────────────────────────────────

export function getProductJsonLd(product: WooProduct, reviews: WooProductReview[] = []) {
  const imageUrls = product.images?.map((image) => image.src).filter(Boolean) || [];
  const price = getNumericPrice(product);
  const sku = product.sku?.trim() || '';
  const gtinFields = getGtinFields(sku);
  const hasGtin = Object.keys(gtinFields).length > 0;
  const brandName = getProductBrandName(product);

  // Human-readable price string for schema description — targets "price in Bangladesh" queries
  const priceFormatted = price
    ? `৳${Math.round(parseFloat(price)).toLocaleString('en-BD')}`
    : null;

  const offer = price ? {
    '@type': 'Offer',
    url: absoluteUrl(`/shop/${product.slug}`),
    priceCurrency: 'BDT',
    price,
    priceValidUntil: getPriceValidUntil(),
    description: priceFormatted
      ? `${product.name} price in Bangladesh: ${priceFormatted} — buy at Emart Skincare Bangladesh with Cash on Delivery (COD) nationwide.`
      : undefined,
    availability: getSchemaAvailability(product),
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'OnlineStore',
      name: 'Emart Skincare Bangladesh',
      url: absoluteUrl('/'),
      areaServed: { '@type': 'Country', name: 'BD' },
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'BD',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 7,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/ReturnShippingFees',
      restockingFee: { '@type': 'MonetaryAmount', currency: 'BDT', value: STORE_POLICIES.returns.restockingFeeAmount },
      url: absoluteUrl('/return-policy'),
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: {
        '@type': 'DefinedRegion',
        addressCountry: 'BD',
        name: 'Bangladesh',
      },
      shippingRate: {
        '@type': 'MonetaryAmount',
        currency: 'BDT',
        value: STORE_POLICIES.shipping.merchantCenterFlatShippingFee,
      },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
        transitTime:  { '@type': 'QuantitativeValue', minValue: 1, maxValue: 6, unitCode: 'DAY' },
      },
    },
  } : null;

  // ISO 8601 dates for schema freshness signals (Google + AI crawlers)
  const datePublished = product.date_created
    ? new Date(product.date_created).toISOString()
    : undefined;
  const dateModified = product.date_modified
    ? new Date(product.date_modified).toISOString()
    : datePublished;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/shop/${product.slug}`)}#product`,
    name: product.name,
    description: (() => {
      const full = (product.description || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return full.length >= 200 ? full.substring(0, 500) : getSeoDescription(product);
    })(),
    image: imageUrls,
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(sku ? { sku } : {}),
    ...gtinFields,
    ...(!sku && !hasGtin && !brandName ? { identifier_exists: 'false' } : {}),
    category: getCleanBreadcrumbCategory(product)?.label ?? getProductType(product),
    ...(brandName ? { brand: { '@type': 'Brand', name: brandName } } : {}),
    ...(parseFloat(product.average_rating) > 0 && product.rating_count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: parseFloat(product.average_rating).toFixed(1),
        reviewCount: product.rating_count,
        bestRating: '5',
        worstRating: '1',
      },
    } : {}),
    ...(offer ? { offers: offer } : {}),
    ...(reviews.length > 0 ? {
      review: reviews.slice(0, 10).map((r) => {
        const reviewBody = (r.review || '')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return {
          '@type': 'Review',
          author: { '@type': 'Person', name: r.reviewer || 'Emart Customer' },
          datePublished: r.date_created ? new Date(r.date_created).toISOString().split('T')[0] : undefined,
          reviewBody: reviewBody || undefined,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: r.rating,
            bestRating: 5,
            worstRating: 1,
          },
        };
      }),
    } : {}),
    speakable: {
      '@type': 'SpeakableSpecification',
      xpath: ['/html/head/title', '//h1', '//meta[@name="description"]/@content'],
    },
  };
}

export interface ProductFaqItem {
  question: string;
  answer: string;
}

export function getProductFaqJsonLd(product: WooProduct, items: ProductFaqItem[]) {
  if (items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(`/shop/${product.slug}`)}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

// ── Metadata builder ──────────────────────────────────────────────────────────

export function buildProductSeoTitle(product: WooProduct): string {
  const rankMathTitle = getProductMetaString(product, '_rank_math_title');
  if (rankMathTitle) return syncLivePrice(rankMathTitle, product);

  const suffix = ' Price in Bangladesh | Emart';
  const full = `${product.name}${suffix}`;
  if (full.length <= 70) return full;

  return `${truncateTitle(product.name, 70 - suffix.length)}${suffix}`;
}
