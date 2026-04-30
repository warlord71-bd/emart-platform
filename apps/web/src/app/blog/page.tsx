import Link from 'next/link';
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
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = await getWordPressPosts({ perPage: 12 });

  return (
    <main className="bg-bg">
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Beauty Guides</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">Skincare advice from Emart</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Learn routines, ingredients, and product comparisons before you shop authentic Korean and global beauty in Bangladesh.
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={post.href}
                className="group rounded-2xl border border-hairline bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-brass">
                  {formatDate(post.date)}
                </p>
                <h2 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-ink group-hover:text-accent">
                  {post.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{post.excerpt}</p>
                <span className="mt-4 inline-flex text-sm font-bold text-accent">Read guide →</span>
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
