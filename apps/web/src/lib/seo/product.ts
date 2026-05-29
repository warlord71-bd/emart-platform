import type { WooProduct } from '@/lib/woocommerce';
import { absoluteUrl } from '@/lib/siteUrl';
import { STORE_POLICIES } from '@/config/storePolicies';
import { getCleanBreadcrumbCategory } from '@/lib/product-display';
import { getProductBrandName, getProductType } from '@/lib/product-utils';

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

export function getProductJsonLd(product: WooProduct) {
  const imageUrls = product.images?.map((image) => image.src).filter(Boolean) || [];
  const price = getNumericPrice(product);
  const sku = product.sku?.trim() || '';
  const gtinFields = getGtinFields(sku);
  const hasGtin = Object.keys(gtinFields).length > 0;
  const brandName = getProductBrandName(product);

  const offer = price ? {
    '@type': 'Offer',
    url: absoluteUrl(`/shop/${product.slug}`),
    priceCurrency: 'BDT',
    price,
    priceValidUntil: getPriceValidUntil(),
    availability: product.stock_status === 'instock'
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
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
      restockingFee: { '@type': 'MonetaryAmount', currency: 'BDT', value: 0 },
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

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/shop/${product.slug}`)}#product`,
    name: product.name,
    description: getSeoDescription(product),
    image: imageUrls,
    ...(sku ? { sku } : {}),
    ...gtinFields,
    ...(sku && !hasGtin ? { mpn: sku } : {}),
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
  return rankMathTitle
    ? syncLivePrice(rankMathTitle, product)
    : `${product.name} Price in Bangladesh | Emart`;
}
