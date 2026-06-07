import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCachedProduct, getProductReviews, getProducts } from '@/lib/woocommerce';
import type { WooMetaData, WooProduct } from '@/lib/woocommerce';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductInfo } from '@/components/product/ProductInfo';
import { DetailsTabs } from '@/components/product/DetailsTabs';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import { ProductFaqSection } from '@/components/product/ProductFaqSection';
import ProductCard from '@/components/product/ProductCard';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ProductViewContentEvent from '@/components/analytics/ProductViewContentEvent';
import { absoluteUrl } from '@/lib/siteUrl';
import { safeJsonLd } from '@/lib/sanitizeHtml';
import { getCleanBreadcrumbCategory } from '@/lib/product-display';
// SEO helpers — extracted to lib/seo/product.ts
import {
  getProductJsonLd,
  getProductFaqJsonLd,
  getSeoDescription,
  syncLivePrice,
  getProductMetaString,
  buildProductSeoTitle,
  type ProductFaqItem,
} from '@/lib/seo/product';
import { getProductAttributeValue, getProductBrandName, getProductType } from '@/lib/product-utils';

interface Props {
  params: { slug: string };
}



interface HtmlSection {
  headingHtml: string;
  headingText: string;
  bodyHtml: string;
}

const FAQ_HEADING_PATTERN =
  /<h[1-6]\b[^>]*>\s*(?:সাধারণ\s+জিজ্ঞাসা(?:\s*\(FAQ\))?|FAQ:?|Frequently Asked Questions)\s*<\/h[1-6]>/i;

const USAGE_HEADING_PATTERN =
  /(how\s*to\s*use|usage|direction|instruction|application|use|ব্যবহার|ব্যবহারের\s*নিয়ম|ব্যবহারবিধি|প্রয়োগ)/i;

const NON_INGREDIENT_HEADING_PATTERN =
  /(how\s*to\s*use|usage|direction|instruction|application|use|suitable\s*for|skin\s*type|storage|store|সংরক্ষণ|কার\s*জন্য|ব্যবহার|ব্যবহারের\s*নিয়ম|ব্যবহারবিধি|প্রয়োগ)/i;

function normalizeRichHtml(value: string): string {
  return value
    .replace(/<p>\s*```(?:html)?\s*<\/p>/gi, '')
    .replace(/```\s*/g, '')
    .trim();
}

function decodeText(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlToTextLines(value: string): string[] {
  return normalizeRichHtml(value)
    .replace(/<\/(p|li|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .split('\n')
    .map((line) => decodeText(line))
    .filter(Boolean);
}

function stripHtmlTags(value: string): string {
  return decodeText(value.replace(/<[^>]*>/g, ''));
}

function splitHtmlSections(value: string): HtmlSection[] {
  const normalized = normalizeRichHtml(value);
  if (!normalized) return [];

  const headingPattern = /<h([1-6])\b[^>]*>[\s\S]*?<\/h\1>/gi;
  const matches = Array.from(normalized.matchAll(headingPattern));

  if (matches.length === 0) {
    return [{ headingHtml: '', headingText: '', bodyHtml: normalized }];
  }

  const sections: HtmlSection[] = [];
  const firstIndex = matches[0]?.index ?? 0;
  const preamble = normalized.slice(0, firstIndex).trim();
  if (preamble) {
    sections.push({ headingHtml: '', headingText: '', bodyHtml: preamble });
  }

  matches.forEach((match, index) => {
    const headingHtml = match[0];
    const start = (match.index ?? 0) + headingHtml.length;
    const end = matches[index + 1]?.index ?? normalized.length;

    sections.push({
      headingHtml,
      headingText: stripHtmlTags(headingHtml),
      bodyHtml: normalized.slice(start, end).trim(),
    });
  });

  return sections;
}

function renderHtmlSections(sections: HtmlSection[]): string {
  return sections
    .map((section) => `${section.headingHtml}${section.bodyHtml}`.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

function getUsageSectionHtml(value: string): string {
  return renderHtmlSections(
    splitHtmlSections(value).filter((section) => USAGE_HEADING_PATTERN.test(section.headingText))
  );
}

function cleanIngredientsHtml(value: string): string {
  const sections = splitHtmlSections(value);
  if (sections.length === 0) return '';

  const cleaned = sections.filter(
    (section) => !section.headingText || !NON_INGREDIENT_HEADING_PATTERN.test(section.headingText)
  );

  return renderHtmlSections(cleaned) || normalizeRichHtml(value);
}

function removeFaqFromHtml(value: string): string {
  return normalizeRichHtml(value)
    .replace(/<div\b[^>]*class=["'][^"']*\bemart-faq\b[^"']*["'][^>]*>[\s\S]*?<\/div>\s*/gi, '')
    .replace(new RegExp(`${FAQ_HEADING_PATTERN.source}[\\s\\S]*$`, 'i'), '')
    .trim();
}

function getFaqSection(value: string): string {
  const normalized = normalizeRichHtml(value);
  const blockMatch = normalized.match(
    /<div\b[^>]*class=["'][^"']*\bemart-faq\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  );

  if (blockMatch?.[1]) {
    return blockMatch[1];
  }

  const headingMatch = normalized.match(
    /<h[1-6]\b[^>]*>\s*(?:সাধারণ\s+জিজ্ঞাসা(?:\s*\(FAQ\))?|FAQ:?|Frequently Asked Questions)\s*<\/h[1-6]>([\s\S]*)$/i
  );

  return headingMatch?.[1] || '';
}

function extractFaqItemsFromText(value: string): ProductFaqItem[] {
  const lines = htmlToTextLines(value);
  const items: ProductFaqItem[] = [];
  let currentQuestion = '';
  let currentAnswer: string[] = [];

  const flush = () => {
    if (!currentQuestion) return;
    items.push({ question: currentQuestion, answer: currentAnswer.join(' ').trim() });
    currentQuestion = '';
    currentAnswer = [];
  };

  for (const line of lines) {
    const questionMatch = line.match(/^(?:Q|Question|প্রশ্ন)\s*[:>：-]\s*(.+)$/i);
    if (questionMatch) {
      flush();
      currentQuestion = questionMatch[1].trim();
      continue;
    }

    const answerMatch = line.match(/^(?:A|Answer|উত্তর)\s*[:>：-]\s*(.+)$/i);
    if (answerMatch) {
      currentAnswer.push(answerMatch[1].trim());
      continue;
    }

    if (currentQuestion) {
      currentAnswer.push(line);
    }
  }

  flush();
  return items.filter((item) => item.question && item.answer);
}

function getMetaString(product: WooProduct, keys: string[]): string {
  const keySet = new Set(keys.map((key) => key.toLowerCase()));

  for (const meta of product.meta_data || []) {
    const metaKey = String(meta.key || '').toLowerCase();
    if (keySet.has(metaKey) && typeof meta.value === 'string' && meta.value.trim()) {
      return normalizeRichHtml(meta.value);
    }
  }

  return '';
}

function getCustomTabContent(product: WooProduct, matcher: RegExp): string {
  const metaMap = new Map<string, WooMetaData>();
  for (const meta of product.meta_data || []) {
    metaMap.set(String(meta.key || '').toLowerCase(), meta);
  }

  const tabPairs = [
    {
      title: metaMap.get('_woodmart_product_custom_tab_title')?.value,
      content:
        metaMap.get('_woodmart_product_custom_tab_content')?.value ||
        metaMap.get('custom_tab_content1')?.value,
    },
    {
      title: metaMap.get('_woodmart_product_custom_tab_title_2')?.value,
      content:
        metaMap.get('_woodmart_product_custom_tab_content_2')?.value ||
        metaMap.get('custom_tab_content2')?.value,
    },
  ];

  for (const tab of tabPairs) {
    if (
      typeof tab.title === 'string' &&
      matcher.test(tab.title) &&
      typeof tab.content === 'string' &&
      tab.content.trim()
    ) {
      return normalizeRichHtml(tab.content);
    }
  }

  return '';
}

function getIngredientsHtml(product: WooProduct): string {
  const ingredients =
    getMetaString(product, ['_emart_ingredients']) ||
    getMetaString(product, ['_wc_facebook_enhanced_catalog_attributes_ingredients']) ||
    getCustomTabContent(product, /ingredient/i);

  return cleanIngredientsHtml(ingredients);
}

function getHowToUseHtml(product: WooProduct): string {
  const explicitUsage =
    getMetaString(product, ['_emart_how_to_use']) ||
    getMetaString(product, [
      '_wc_facebook_enhanced_catalog_attributes_instructions',
      '_wc_facebook_enhanced_catalog_attributes_care_instructions',
    ]) ||
    getCustomTabContent(product, USAGE_HEADING_PATTERN);

  if (explicitUsage) {
    return explicitUsage;
  }

  const legacyIngredientsTab = getCustomTabContent(product, /ingredient/i);
  return getUsageSectionHtml(legacyIngredientsTab);
}

function getEmartFaqItems(product: WooProduct): ProductFaqItem[] {
  const faqHtml = getMetaString(product, ['_emart_product_faq']);
  if (!faqHtml) return [];
  return extractFaqItemsFromText(faqHtml);
}

function getProductBreadcrumbParent(product: WooProduct) {
  return getCleanBreadcrumbCategory(product);
}

function getGeneratedProductFaqItems(product: WooProduct): ProductFaqItem[] {
  const brand = getProductBrandName(product);
  const origin = getProductAttributeValue(product, /(origin|made in|country)/i);
  const skinType = getProductAttributeValue(product, /skin type/i) || 'most skin types';
  const concern = getProductConcernLabel(product);
  const productType = getProductType(product);
  const howToUse = htmlToTextLines(getHowToUseHtml(product))[0];
  const purposeParts = [`${product.name} is a ${productType}`];
  if (concern) purposeParts.push(`for ${concern}`);
  if (skinType) purposeParts.push(`suited to ${skinType} routines`);

  return [
    {
      question: `Is ${product.name} authentic?`,
      answer:
        `Yes. Emart lists ${product.name} as an authentic ${origin ? `${origin} ` : ''}${brand ? `${brand} ` : ''}product and checks sourcing and product condition before dispatch.`,
    },
    {
      question: `What is ${product.name} used for?`,
      answer: `${purposeParts.join(', ')}.`,
    },
    {
      question: `How should I use ${product.name}?`,
      answer:
        howToUse ||
        'Apply as directed for this product type, starting with a small amount and adjusting based on your skin comfort.',
    },
    {
      question: `${product.name} কোন skin type এর জন্য ভালো?`,
      answer: `${product.name} সাধারণত ${skinType} এর জন্য উপযোগী।${
        concern ? ` আপনার concern যদি ${concern} হয়, তাহলে এটি routine-এ যোগ করার আগে ধীরে শুরু করুন।` : ''
      }`,
    },
    {
      question: `${product.name} ব্যবহারের আগে কী সতর্কতা রাখা উচিত?`,
      answer:
        'প্রথমবার ব্যবহারের আগে patch test করুন, চোখের খুব কাছে ব্যবহার এড়িয়ে চলুন, irritation হলে ব্যবহার বন্ধ করুন। active ingredient বা brightening/exfoliating product হলে দিনের বেলা sunscreen ব্যবহার করুন।',
    },
  ];
}

function getProductConcernLabel(product: WooProduct): string {
  return product.concern_terms?.map((term) => term.name).filter(Boolean).slice(0, 2).join(', ') || '';
}

function getProductFaqItems(product: WooProduct): ProductFaqItem[] {
  const seen = new Set<string>();
  const items = [...getEmartFaqItems(product), ...getGeneratedProductFaqItems(product)];

  return items
    .filter((item) => {
      const key = item.question.toLowerCase();
      if (!item.question || !item.answer || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getCachedProduct(params.slug);

  if (!product) notFound();

  const seoDescription = getSeoDescription(product);
  const seoTitle = buildProductSeoTitle(product);
  const seoCanonical = absoluteUrl(`/shop/${params.slug}`);
  const seoOgImage = product.images?.[0]?.src || '';
  const skinType = getProductAttributeValue(product, /skin type/i);
  const skinConcern = getProductAttributeValue(product, /concern/i);
  const brandName = getProductBrandName(product);

  const keywords: string[] = [
    product.name,
    brandName,
    skinType && `${skinType} skin`,
    skinConcern,
    'Bangladesh',
    'authentic skincare',
  ].filter(Boolean) as string[];

  return {
    title: { absolute: seoTitle },
    description: seoDescription,
    keywords,
    alternates: { canonical: seoCanonical },
    openGraph: {
      title: product.name,
      description: seoDescription,
      url: seoCanonical,
      images: seoOgImage ? [{ url: seoOgImage, width: 800, height: 800 }] : undefined,
    },
    other: {
      'og:type': 'product',
      ...(skinType ? { 'product:skin_type': skinType } : {}),
      ...(skinConcern ? { 'product:skin_concern': skinConcern } : {}),
    },
  };
}

export async function generateStaticParams() {
  return [];
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600;
export const dynamicParams = true;

export default async function ProductPage({ params }: Props) {
  let product;
  try {
    product = await getCachedProduct(params.slug);
  } catch {
    notFound();
  }

  if (!product) notFound();

  const _relatedCatSlug = getCleanBreadcrumbCategory(product)?.href?.split('/').pop();
  const _relatedCat = _relatedCatSlug
    ? product.categories.find(c => c.slug === _relatedCatSlug)
    : product.categories[0];

  const [relatedResult, reviews] = await Promise.all([
    getProducts({ category: _relatedCat?.id?.toString(), per_page: 4, exclude: [product.id].join(',') }).catch(() => ({ products: [] })),
    getProductReviews(product.id).catch(() => []),
  ]);
  const { products: related } = relatedResult;

  const descriptionHtml =
    removeFaqFromHtml(product.description || '') ||
    normalizeRichHtml(product.short_description || '');
  const ingredientsHtml = getIngredientsHtml(product);
  const howToUseHtml = getHowToUseHtml(product);
  const faqItems = getProductFaqItems(product);
  const faqJsonLd = getProductFaqJsonLd(product, faqItems);
  const productJsonLd = getProductJsonLd(product);
  const breadcrumbParent = getProductBreadcrumbParent(product);

  const breadcrumbItems = [
    { name: 'Home', item: absoluteUrl('/') },
    { name: 'Shop', item: absoluteUrl('/shop') },
    ...(breadcrumbParent ? [{ name: breadcrumbParent.label, item: absoluteUrl(breadcrumbParent.href) }] : []),
    { name: product.name, item: absoluteUrl(`/shop/${product.slug}`) },
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ProductViewContentEvent product={product} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          ...(breadcrumbParent ? [breadcrumbParent] : []),
          { label: product.name },
        ]}
      />
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductImage images={product.images} productName={product.name} />
        <ProductInfo product={product} />
      </section>

      <section className="mt-10 space-y-10">
        <DetailsTabs
          description={descriptionHtml}
          ingredients={ingredientsHtml}
          howToUse={howToUseHtml}
        />
        <ReviewsSection product={product} initialReviews={reviews} />
        <ProductFaqSection items={faqItems} />
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-6">Related Products</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
