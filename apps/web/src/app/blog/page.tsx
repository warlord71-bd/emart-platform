import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getWordPressPosts } from '@/lib/wordpress-posts';
import { absoluteUrl } from '@/lib/siteUrl';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: 'Skincare Guides & Tips | Emart Skincare Bangladesh' },
  description: 'Read skincare guides, ingredient explainers, and product comparisons from Emart Skincare Bangladesh.',
  keywords: [
    'skincare guides Bangladesh',
    'Korean skincare tips Bangladesh',
    'skincare routine Bangladesh',
    'K-Beauty guide Bangladesh',
    'skincare ingredients guide',
    'Emart skincare blog',
  ],
  alternates: { canonical: absoluteUrl('/blog') },
  openGraph: {
    title: 'Skincare Guides & Tips | Emart Skincare Bangladesh',
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
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <span className="font-medium text-ink">Guides</span>
        </nav>

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

        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-card p-6 text-center shadow-card sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-semibold text-ink">Ready to shop?</p>
            <p className="mt-1 text-sm text-muted">Browse authentic Korean and global skincare products.</p>
          </div>
          <Link href="/shop" className="shrink-0 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black">
            Shop All Products
          </Link>
        </div>
      </section>
    </main>
  );
}
