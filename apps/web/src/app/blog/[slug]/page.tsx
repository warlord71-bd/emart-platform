import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getWordPressPostBySlug, getWordPressPosts } from '@/lib/wordpress-posts';
import { getProducts } from '@/lib/woocommerce';
import { absoluteUrl } from '@/lib/siteUrl';
import { safeJsonLd, sanitizeHtml } from '@/lib/sanitizeHtml';
import { formatBDT } from '@/lib/formatters';

interface Props {
  params: { slug: string };
}

export const revalidate = 3600;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export async function generateStaticParams() {
  const posts = await getWordPressPosts({ perPage: 20 });
  return posts.map((post) => ({ slug: post.slug }));
}

function isBengali(text: string): boolean {
  return /[ঀ-৿]/.test(text);
}

function buildBlogTitle(post: { title: string; seoTitle: string | null }): string {
  if (post.seoTitle && post.seoTitle.length > 10) return post.seoTitle;
  const clean = post.title.replace(/&amp;/g, '&').replace(/&#\d+;/g, '').replace(/🌿|🧴|🚗/g, '').trim();
  const suffix = ' | Emart Skincare Bangladesh';
  return clean.length + suffix.length <= 65 ? `${clean}${suffix}` : `${clean.slice(0, 60 - suffix.length)}…${suffix}`;
}

function buildBlogDescription(post: { title: string; excerpt: string; seoDescription: string | null }): string {
  // Prefer explicit Rank Math description if meaningful
  if (post.seoDescription && post.seoDescription.length > 60 && !post.seoDescription.includes('%')) {
    return post.seoDescription.slice(0, 155);
  }
  const bengali = isBengali(post.title);
  const raw = post.excerpt
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (bengali) {
    const base = raw.slice(0, 100).replace(/\s\S+$/, '');
    return `${base}। Emart-এ অর্ডার করুন, দ্রুত ডেলিভারি, ১০০% অথেনটিক।`.slice(0, 155);
  }
  // English: trim to word boundary, leaving room for CTA
  const hasBD = /bangladesh/i.test(raw.slice(0, 130));
  const cta = hasBD ? ' Shop at Emart — COD.' : ' Shop at Emart Bangladesh — COD.';
  const maxBase = 155 - cta.length;
  // lastIndexOf finds the last space at or before maxBase — guaranteed no mid-word cut
  const cutAt = raw.lastIndexOf(' ', maxBase);
  const base = raw.slice(0, cutAt > 20 ? cutAt : maxBase).trim();
  return `${base}${cta}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getWordPressPostBySlug(params.slug);
  if (!post) return { title: 'Guide Not Found' };

  const seoTitle = buildBlogTitle(post);
  const seoDesc  = buildBlogDescription(post);
  const canonical = absoluteUrl(`/blog/${post.slug}`);
  const bengali   = isBengali(post.title);

  return {
    title: { absolute: seoTitle },
    description: seoDesc,
    alternates: {
      canonical,
      ...(bengali
        ? { languages: { bn: canonical, 'x-default': canonical } }
        : { languages: { en: canonical, 'x-default': canonical } }),
    },
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      url: canonical,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modified,
      locale: bengali ? 'bn_BD' : 'en_US',
    },
  };
}

// Map title keywords → WC category ID for related products
const KEYWORD_CATEGORY: [string[], number][] = [
  [['sunscreen', 'spf', 'sun protection'], 806],
  [['serum', 'vitamin c', 'niacinamide', 'retinol', 'aha', 'bha', 'ceramide', 'hyaluronic'], 7996],
  [['moisturizer', 'moisturize', 'cream', 'gel cream', 'hydration', 'hydrating'], 8941],
  [['cleanser', 'cleansing', 'face wash', 'foam', 'cleanse'], 7984],
  [['toner', 'essence', 'mist'], 7994],
  [['acne', 'breakout', 'pimple', 'blemish'], 7999],
  [['eye cream', 'eye care', 'dark circle'], 7989],
  [['sheet mask', 'face mask', 'sleeping mask'], 957],
  [['lip', 'lip balm', 'lip care'], 8023],
  [['hair', 'shampoo', 'conditioner', 'scalp'], 7141],
  [['body lotion', 'body care', 'body wash'], 7987],
  [['k-beauty', 'korean', 'kbeauty'], 3529],
  [['japanese', 'j-beauty'], 7976],
  [['men', "men's"], 9677],
];

function getRelatedCategoryId(titleAndSlug: string): number {
  const text = titleAndSlug.toLowerCase();
  for (const [keywords, catId] of KEYWORD_CATEGORY) {
    if (keywords.some((kw) => text.includes(kw))) return catId;
  }
  return 806; // sunscreen as default — reliable images
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getWordPressPostBySlug(params.slug);
  if (!post) notFound();

  const relatedCatId = getRelatedCategoryId(`${post.title} ${post.slug}`);
  const { products: relatedProducts } = await getProducts({
    category: String(relatedCatId),
    per_page: 4,
    orderby: 'popularity',
    order: 'desc',
  });

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': ['BlogPosting', 'NewsArticle'],
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.modified,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    image: post.imageUrl ? [{
      '@type': 'ImageObject',
      url: post.imageUrl,
      width: 1200,
      height: 630,
    }] : undefined,
    articleSection: 'Skincare',
    inLanguage: 'en',
    author: {
      '@type': 'Person',
      name: 'Hasan Tarafder',
      url: 'https://x.com/hasan_tarafder',
      jobTitle: 'Founder, Emart Skincare Bangladesh',
      knowsAbout: [
        'Skincare', 'K-beauty', 'J-beauty', 'Korean Beauty Products',
        'Bangladesh Skincare Market', 'Authentic Beauty Imports',
        'Skincare Ingredients', 'Skin Types Bangladesh',
      ],
      worksFor: {
        '@type': 'Organization',
        name: 'Emart Skincare Bangladesh',
        url: 'https://e-mart.com.bd',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Emart Skincare Bangladesh',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
  };

  return (
    <main className="bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd) }} />

      <article className="mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-accent">Home</Link>
          <span>/</span>
          <Link href="/blog" className="transition-colors hover:text-accent">Guides</Link>
        </nav>

        <header className="mb-8 rounded-[28px] bg-ink px-5 py-7 text-white shadow-card">
          <p className="text-xs font-bold uppercase tracking-widest text-brass">
            Skincare Guide
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-4 text-sm leading-6 text-white/72">{post.excerpt}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-xs text-white/60">
            <address className="not-italic">
              By{' '}
              <a
                href="https://x.com/hasan_tarafder"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white/80 hover:text-white"
              >
                Hasan Tarafder
              </a>
              <span className="text-white/40">, Founder · Emart</span>
            </address>
            <span>·</span>
            <time dateTime={post.date} className="font-semibold text-white/80">
              {formatDate(post.date)}
            </time>
            {post.modified && post.modified !== post.date && (
              <>
                <span>·</span>
                <span>Updated <time dateTime={post.modified}>{formatDate(post.modified)}</time></span>
              </>
            )}
          </div>
        </header>

        <div
          className="space-y-5 text-base leading-8 text-muted [&_a]:font-semibold [&_a]:text-accent [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:text-muted [&_strong]:text-ink"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />

        {relatedProducts.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-ink">Shop Related Products</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {relatedProducts.map((p) => {
                const img = p.images?.[0]?.src;
                const price = p.sale_price || p.regular_price || p.price;
                const inStock = p.stock_status === 'instock';
                return (
                  <Link
                    key={p.id}
                    href={`/shop/${p.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-bg-alt">
                      {img && (
                        <Image
                          src={img}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      )}
                      {!inStock && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                          Out of stock
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="line-clamp-2 text-xs font-semibold leading-snug text-ink group-hover:text-accent">
                        {p.name}
                      </p>
                      {price && (
                        <p className="mt-1 text-xs font-bold text-accent">
                          {formatBDT(parseFloat(price))}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href="/shop" className="mt-4 inline-flex text-sm font-bold text-accent">
              View all products →
            </Link>
          </section>
        )}
      </article>
    </main>
  );
}
