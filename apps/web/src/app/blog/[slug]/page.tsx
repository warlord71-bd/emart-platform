import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getWordPressPostBySlug, getWordPressPosts } from '@/lib/wordpress-posts';
import { absoluteUrl } from '@/lib/siteUrl';
import { safeJsonLd, sanitizeHtml } from '@/lib/sanitizeHtml';

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getWordPressPostBySlug(params.slug);
  if (!post) return { title: 'Guide Not Found' };

  const seoTitle = post.seoTitle || `${post.title} | Emart`;
  const seoDesc  = post.seoDescription || post.excerpt || 'Helpful skincare guide from Emart.';

  return {
    title: seoTitle,
    description: seoDesc,
    alternates: { canonical: absoluteUrl(`/blog/${post.slug}`) },
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      url: absoluteUrl(`/blog/${post.slug}`),
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modified,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getWordPressPostBySlug(params.slug);
  if (!post) notFound();

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.modified,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    author: { '@type': 'Person', name: 'Emart Editorial Team', url: absoluteUrl('/about-us') },
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
              By <span className="font-semibold text-white/80">Emart Editorial Team</span>
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

        <div className="mt-10 rounded-2xl border border-hairline bg-card p-5 shadow-card">
          <p className="text-sm font-semibold text-ink">Need the products from this guide?</p>
          <Link href="/shop" className="mt-2 inline-flex text-sm font-bold text-accent">
            Shop authentic skincare →
          </Link>
        </div>
      </article>
    </main>
  );
}
