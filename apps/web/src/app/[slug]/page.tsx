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

const FAQ_HEADING_PATTERN =
  /<h[1-6]\b[^>]*>\s*(?:সাধারণ\s+জিজ্ঞাসা(?:\s*\(FAQ\))?|FAQ:?|Frequently Asked Questions)\s*<\/h[1-6]>/i;

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
  return (
    getMetaString(product, ['_emart_ingredients']) ||
    getMetaString(product, ['_wc_facebook_enhanced_catalog_attributes_ingredients']) ||
    getCustomTabContent(product, /ingredient/i)
  );
}

function getHowToUseHtml(product: WooProduct): string {
  return (
    getMetaString(product, ['_emart_how_to_use']) ||
    getMetaString(product, [
      '_wc_facebook_enhanced_catalog_attributes_instructions',
      '_wc_facebook_enhanced_catalog_attributes_care_instructions',
    ]) ||
    getCustomTabContent(product, /(how\s*to\s*use|usage|direction|instruction|application|use)/i)
  );
}

function getEmartFaqItems(product: WooProduct): ProductFaqItem[] {
  const faqHtml = getMetaString(product, ['_emart_product_faq']);
  if (!faqHtml) return [];

  return extractFaqItemsFromText(faqHtml);
}

function getEnglishFaqItems(product: WooProduct): ProductFaqItem[] {
  const deliveryAnswer = product.short_description
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return [
    {
      question: `Is ${product.name} authentic?`,
      answer:
        'Yes. Emart checks sourcing before dispatch and this product is sold as an authentic imported item.',
    },
    {
      question: 'How long does delivery take?',
      answer:
        deliveryAnswer ||
        'Dhaka delivery usually takes 1-2 days. Outside Dhaka, delivery typically takes 2-5 business days depending on location.',
    },
    {
      question: 'Can I order with Cash on Delivery?',
      answer:
        'Yes. Cash on Delivery is available for supported orders, and you can contact support if you need help before placing the order.',
    },
  ];
}

function ProductFaqSection({ items }: { items: ProductFaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-ink">Frequently Asked Questions</h2>
        <p className="mt-1 text-sm text-muted">English and Bangla product questions, kept at the end of the page.</p>
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
    description:
      product.short_description?.replace(/<[^>]+>/g, '').substring(0, 160) || product.name,
    alternates: {
      canonical: `/shop/${product.slug}`,
    },
    openGraph: {
      images: [{ url: product.images[0]?.src || '' }],
    },
  };
}

export async function generateStaticParams() {
  const { products } = await getProducts({ per_page: 100 });
  return products.map((product) => ({ slug: product.slug }));
}

export const revalidate = 3600;

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
  const faqItems = [
    ...getEnglishFaqItems(product),
    ...getEmartFaqItems(product).slice(0, 3),
    ...extractFaqItems(product.description || '').slice(0, 3),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
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
