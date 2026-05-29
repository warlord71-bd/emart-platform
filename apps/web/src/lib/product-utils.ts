import type { WooProduct } from '@/lib/woocommerce';
import { getCleanBreadcrumbCategory } from '@/lib/product-display';

export function getProductAttributeValue(product: WooProduct, matcher: RegExp): string {
  const attributes = product.attributes?.filter((item) => matcher.test(item.name)) || [];
  const prefersOriginTaxonomy = matcher.test('origin') || matcher.test('made in') || matcher.test('country');
  const attribute = prefersOriginTaxonomy
    ? attributes.find((item) => item.id && item.id > 0) || attributes[0]
    : attributes[0];
  return attribute?.options?.filter(Boolean).slice(0, 3).join(', ') || '';
}

export const BRAND_NAME_CORRECTIONS: Record<string, string> = {
  cosrx: 'COSRX',
  aplb: 'APLB',
  skin1004: 'SKIN1004',
  anua: 'ANUA',
  'some by mi': 'Some By Mi',
  innisfree: 'innisfree',
  cerave: 'CeraVe',
  laneige: 'LANEIGE',
  'beauty of joseon': 'Beauty of Joseon',
  heimish: 'Heimish',
  'purito seoul': 'PURITO Seoul',
  'cos de baha': 'Cos De BAHA',
  rom_and: 'rom&nd',
  'mary&may': 'Mary&May',
  tirtir: 'TIRTIR',
  isntree: 'Isntree',
  ma_c: 'M·A·C',
};

export function getProductBrandName(product: WooProduct): string {
  const raw = product.brands?.[0]?.name || '';
  if (!raw) return '';
  const key = raw.toLowerCase();
  return BRAND_NAME_CORRECTIONS[key] ?? raw;
}

export function getProductType(product: WooProduct): string {
  const name = product.name.toLowerCase();
  const categoryText = product.categories?.map((category) => category.slug).join(' ') || '';
  const source = `${name} ${categoryText}`;

  if (/sunscreen|sun-cream|sun-serum|spf|sun-stick|sun-milk/.test(source)) return 'sunscreen product';
  if (/serum|ampoule|essence/.test(source)) return 'serum product';
  if (/cleanser|face-wash|cleansing|foam-wash/.test(source)) return 'cleanser';
  if (/toner|mist/.test(source)) return 'toner';
  if (/cream|moisturi[sz]er|gel-cream|lotion/.test(source)) return 'moisturizer';
  if (/mask|sleeping-pack/.test(source)) return 'face mask';
  if (/shampoo|conditioner|hair/.test(source)) return 'hair care product';
  if (/lip/.test(source)) return 'lip care product';
  if (/body/.test(source)) return 'body care product';

  const cleanCat = getCleanBreadcrumbCategory(product);
  return cleanCat?.label.toLowerCase() || 'skincare product';
}
