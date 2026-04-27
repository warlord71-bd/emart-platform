import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, getProductReviews, getProducts } from '@/lib/woocommerce';
import type { WooMetaData, WooProduct } from '@/lib/woocommerce';
import { getWordPressPostBySlug } from '@/lib/wordpress-posts';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductInfo } from '@/components/product/ProductInfo';
import { DetailsTabs } from '@/components/product/DetailsTabs';
import { ReviewsSection } from '@/components/product/ReviewsSection';
import ProductCard from '@/components/product/ProductCard';

interface Props {
  params: { slug: string };
}

interface ProductFaqItem {
  question: string;
  answer: string;
}

function getSeoDescription(product: WooProduct): string {
  const rm = product.meta_data?.find((m) => m.key === '_rank_math_description')?.value;
  if (rm && typeof rm === 'string' && rm.trim().length > 20) return rm.trim();
  return (
    product.short_description?.replace(/<[^>]+>/g, '').trim().substring(0, 160) ||
    product.name
  );
}

function getNumericPrice(product: WooProduct): string {
  const price = Number.parseFloat(product.price || product.sale_price || product.regular_price || '0');
  return Number.isFinite(price) && price > 0 ? price.toFixed(2) : '0.00';
}

function getProductJsonLd(product: WooProduct) {
  const imageUrls = product.images?.map((image) => image.src).filter(Boolean) || [];
  const price = getNumericPrice(product);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `https://e-mart.com.bd/shop/${product.slug}#product`,
    name: product.name,
    description: getSeoDescription(product),
    image: imageUrls,
    sku: product.sku || String(product.id),
    category: product.categories?.[0]?.name,
    brand: {
      '@type': 'Brand',
      name: getProductAttributeValue(product, /brand/i) || 'Emart',
    },
    offers: {
      '@type': 'Offer',
      url: `https://e-mart.com.bd/shop/${product.slug}`,
      priceCurrency: 'BDT',
      price,
      availability: product.stock_status === 'instock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'OnlineStore',
        name: 'Emart Skincare Bangladesh',
        url: 'https://e-mart.com.bd',
        areaServed: { '@type': 'Country', name: 'BD' },
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
          minValue: 0,
          maxValue: 100,
          description: 'Dhaka ৳70 · Outside Dhaka ৳100 · Free delivery on orders over ৳3,000.',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 5,
            unitCode: 'DAY',
          },
        },
      },
    },
  };
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

function extractFaqItems(value: string): ProductFaqItem[] {
  const faqSection = getFaqSection(value);
  if (!faqSection) return [];

  return extractFaqItemsFromText(faqSection);
}

function extractFaqItemsFromText(value: string): ProductFaqItem[] {
  const lines = htmlToTextLines(value);
  const items: ProductFaqItem[] = [];
  let currentQuestion = '';
  let currentAnswer: string[] = [];

  const flush = () => {
    if (!currentQuestion) return;

    items.push({
      question: currentQuestion,
      answer: currentAnswer.join(' ').trim(),
    });

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

function getProductAttributeValue(product: WooProduct, matcher: RegExp): string {
  const attribute = product.attributes?.find((item) => matcher.test(item.name));
  return attribute?.options?.filter(Boolean).slice(0, 3).join(', ') || '';
}

function getProductType(product: WooProduct): string {
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

  const category = product.categories?.find(
    (item) =>
      !['k-beauty-j-beauty', 'korean-beauty', 'japanese-beauty', 'skincare-essentials'].includes(item.slug)
  );
  return category?.name.toLowerCase() || 'skincare product';
}

function getGeneratedProductFaqItems(product: WooProduct): ProductFaqItem[] {
  const brand = getProductAttributeValue(product, /brand/i);
  const origin = getProductAttributeValue(product, /(origin|made in|country)/i);
  const skinType = getProductAttributeValue(product, /skin type/i) || 'most skin types';
  const concern = getProductAttributeValue(product, /concern/i);
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

function ProductFaqSection({ items }: { items: ProductFaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-ink">Frequently Asked Questions</h2>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <details
            key={`${item.question}-${index}`}
            className="rounded-xl border border-hairline bg-[#faf8f5] px-4 py-3"
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
              {item.question}
            </summary>
            <p className="mt-3 text-sm leading-7 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    const post = await getWordPressPostBySlug(params.slug);
    if (post) {
      return {
        title: `${post.title} | Emart`,
        description: post.excerpt || 'Helpful skincare guide from Emart.',
        alternates: { canonical: `/blog/${post.slug}` },
        openGraph: {
          title: post.title,
          description: post.excerpt,
          url: `/blog/${post.slug}`,
          type: 'article',
        },
      };
    }

    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.name} — Price in Bangladesh`,
    description: getSeoDescription(product),
    alternates: {
      canonical: `/shop/${product.slug}`,
    },
    openGraph: {
      images: [{ url: product.images[0]?.src || '' }],
    },
  };
}

export async function generateStaticParams() {
  return [];
}

export const revalidate = 3600;
export const dynamicParams = true;

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);

  if (!product) {
    const post = await getWordPressPostBySlug(params.slug);
    if (post) {
      permanentRedirect(`/blog/${post.slug}`);
    }

    notFound();
  }

  const { products: related } = await getProducts({
    category: product.categories[0]?.id?.toString(),
    per_page: 4,
    exclude: [product.id].join(','),
  });
  const reviews = await getProductReviews(product.id);

  const descriptionHtml =
    removeFaqFromHtml(product.description || '') ||
    normalizeRichHtml(product.short_description || '') ||
    '<p>No description available.</p>';
  const ingredientsHtml = getIngredientsHtml(product);
  const howToUseHtml = getHowToUseHtml(product);
  const faqItems = getProductFaqItems(product);
  const productJsonLd = getProductJsonLd(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
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
