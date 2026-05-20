import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import { getBestBySlug, BEST_DEFINITIONS } from '@/lib/best-definitions';

export const revalidate = 86400;
export const dynamicParams = false;

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return BEST_DEFINITIONS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const best = getBestBySlug(params.slug);
  if (!best) return { title: 'Not Found' };

  const canonical = absoluteUrl(`/best/${best.slug}`);
  return {
    title: { absolute: `${best.metaTitle} | Emart` },
    description: best.description.slice(0, 155),
    alternates: { canonical },
    openGraph: {
      title: best.metaTitle,
      description: best.description.slice(0, 155),
      url: canonical,
      images: [{ url: absoluteUrl('/images/hero-products.png'), width: 1200, height: 630 }],
    },
  };
}

export default function BestPage({ params }: Props) {
  const best = getBestBySlug(params.slug);
  if (!best) notFound();

  const canonical = absoluteUrl(`/best/${best.slug}`);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: best.title,
    description: best.description,
    url: canonical,
    dateModified: best.updatedDate,
    publisher: {
      '@type': 'Organization',
      name: 'Emart Skincare Bangladesh',
      url: absoluteUrl('/'),
    },
    author: {
      '@type': 'Organization',
      name: 'Emart Skincare Bangladesh',
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: best.title,
    url: canonical,
    numberOfItems: best.products.length,
    itemListElement: best.products.map((p) => ({
      '@type': 'ListItem',
      position: p.rank,
      name: p.name,
      url: absoluteUrl(`/shop/${p.slug}`),
      image: p.image,
    })),
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: best.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Best Lists', item: absoluteUrl('/best') },
      { '@type': 'ListItem', position: 3, name: best.title, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <Link href="/best" className="hover:text-accent">Best Lists</Link>
          <span>/</span>
          <span className="font-medium text-ink line-clamp-1">{best.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 border-b border-hairline pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">
            Emart Picks · Updated {new Date(best.updatedDate).toLocaleDateString('en-BD', { year: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{best.title}</h1>
          <p className="mt-4 text-sm leading-7 text-muted-2">{best.intro}</p>
        </div>

        {/* Product list */}
        <section className="mb-8 space-y-5">
          {best.products.map((p) => (
            <div key={p.slug} className="rounded-2xl border border-hairline bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-hairline bg-bg-alt px-5 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-extrabold text-white">
                  {p.rank}
                </span>
                <h2 className="text-sm font-bold text-ink line-clamp-2">{p.name}</h2>
              </div>
              <div className="p-5">
                <div className="grid gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
                  {p.image && (
                    <Link
                      href={`/shop/${p.slug}`}
                      className="relative mx-auto block aspect-square w-full max-w-[180px] overflow-hidden rounded-xl border border-hairline bg-white sm:mx-0"
                    >
                      <Image
                        src={p.image}
                        alt={p.imageAlt || `${p.name} price in Bangladesh at Emart`}
                        fill
                        sizes="(max-width: 640px) 180px, 150px"
                        className="object-contain p-3"
                      />
                    </Link>
                  )}

                  <div>
                    <div className="mb-3 flex items-baseline gap-3">
                      <span className="text-xl font-extrabold text-accent">{p.price}</span>
                      <span className="text-xs text-muted">{p.brand}</span>
                    </div>

                    <p className="text-sm leading-6 text-muted-2">{p.why}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-hairline px-3 py-1 text-xs text-muted-2">
                        Best for: {p.bestFor}
                      </span>
                    </div>

                    {p.keyIngredients && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.keyIngredients.map((ing, i) => (
                          <span key={i} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/shop/${p.slug}`}
                      className="mt-4 inline-block rounded-xl bg-accent px-5 py-2 text-sm font-bold text-white hover:bg-accent/90 transition-colors"
                    >
                      View & Buy →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Buying guide */}
        <section className="mb-8 rounded-2xl border-l-4 border-accent bg-accent-soft/30 p-6">
          <h2 className="mb-3 text-xl font-bold text-ink">How to Choose</h2>
          <p className="text-sm leading-7 text-muted-2">{best.buyingGuide}</p>
        </section>

        {/* Bangladesh note */}
        <section className="mb-8 rounded-2xl border border-hairline bg-bg-alt p-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brass">Bangladesh Note</p>
          <p className="text-sm leading-7 text-muted-2">{best.bangladeshNote}</p>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-ink">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {best.faq.map((item, i) => (
              <details key={i} className="group rounded-xl border border-hairline bg-card p-5 shadow-sm">
                <summary className="cursor-pointer list-none text-sm font-semibold text-ink group-open:text-accent">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted-2">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl bg-ink p-6 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">Shop Emart</p>
          <h2 className="mt-2 text-xl font-extrabold">All products. Authentic. COD available.</h2>
          <p className="mt-2 text-sm text-white/70">
            Every product verified authentic. Cash on Delivery across Bangladesh.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-ink hover:bg-accent hover:text-white transition-colors">
              Browse All Products →
            </Link>
            <Link href="/skin-quiz" className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors">
              Find Your Skin Type →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
