import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getWordPressPosts } from '@/lib/wordpress-posts';
import { absoluteUrl } from '@/lib/siteUrl';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Skincare Guides',
  description: 'Read skincare guides, ingredient explainers, and product comparisons from Emart Skincare Bangladesh.',
  alternates: { canonical: absoluteUrl('/blog') },
  openGraph: {
    title: 'Skincare Guides',
    description: 'Helpful skincare guides from Emart Skincare Bangladesh.',
    url: absoluteUrl('/blog'),
    images: [{ url: 'https://e-mart.com.bd/images/hero-products.png', width: 1200, height: 630, alt: 'Skincare guides from Emart Bangladesh' }],
  },
};

const FALLBACK_IMAGE = '/images/hero-products.png';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = await getWordPressPosts({ perPage: 12 });

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Skincare Guides by Emart',
    description: 'Skincare guides, ingredient explainers, and product comparisons from Emart Skincare Bangladesh.',
    url: absoluteUrl('/blog'),
    publisher: {
      '@type': 'Organization',
      name: 'Emart Skincare Bangladesh',
      url: absoluteUrl('/'),
    },
    blogPost: posts.slice(0, 10).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: absoluteUrl(p.href),
      datePublished: p.date,
      description: p.excerpt,
      ...(p.imageUrl ? { image: p.imageUrl } : {}),
    })),
  };

  return (
    <main className="bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Beauty Guides</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Skincare advice from Emart</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Learn routines, ingredients, and product comparisons before you shop authentic Korean and global beauty in Bangladesh.
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Link
                key={post.id}
                href={post.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg-alt">
                  <Image
                    src={post.imageUrl || FALLBACK_IMAGE}
                    alt={post.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={i < 3}
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brass">
                    {formatDate(post.date)}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-ink group-hover:text-accent">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted">{post.excerpt}</p>
                  <span className="mt-4 inline-flex text-sm font-bold text-accent">Read guide →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-hairline bg-card p-8 text-center text-muted shadow-card">
            Guides are loading. Please check back shortly.
          </div>
        )}
      </section>
    </main>
  );
}
