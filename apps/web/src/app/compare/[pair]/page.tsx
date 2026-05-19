import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import { getCompareByPair, COMPARE_DEFINITIONS } from '@/lib/compare-definitions';

export const revalidate = 86400;
export const dynamicParams = false;

interface Props {
  params: { pair: string };
}

export function generateStaticParams() {
  return COMPARE_DEFINITIONS.map((c) => ({ pair: c.pair }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const comp = getCompareByPair(params.pair);
  if (!comp) return { title: 'Comparison Not Found' };

  const canonical = absoluteUrl(`/compare/${comp.pair}`);
  return {
    title: { absolute: `${comp.metaTitle} | Emart` },
    description: comp.description.slice(0, 155),
    alternates: { canonical },
    openGraph: {
      title: comp.metaTitle,
      description: comp.description.slice(0, 155),
      url: canonical,
      images: [{ url: absoluteUrl('/images/hero-products.png'), width: 1200, height: 630 }],
    },
  };
}

export default function ComparePage({ params }: Props) {
  const comp = getCompareByPair(params.pair);
  if (!comp) notFound();

  const canonical = absoluteUrl(`/compare/${comp.pair}`);
  const [p1, p2] = comp.products;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: comp.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: comp.title,
    description: comp.description,
    url: canonical,
    publisher: {
      '@type': 'Organization',
      name: 'Emart Skincare Bangladesh',
      url: absoluteUrl('/'),
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: absoluteUrl('/compare') },
      { '@type': 'ListItem', position: 3, name: comp.title, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <Link href="/compare" className="hover:text-accent">Compare</Link>
          <span>/</span>
          <span className="font-medium text-ink line-clamp-1">{comp.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 border-b border-hairline pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">{comp.category} Comparison</p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{comp.title}</h1>
          <p className="mt-2 text-sm text-muted">{comp.concern}</p>
          <p className="mt-4 text-sm leading-7 text-muted-2">{comp.description}</p>
        </div>

        {/* Quick comparison table — mobile stacked, desktop side-by-side */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-ink">Quick Comparison</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[p1, p2].map((p) => (
              <div key={p.slug} className="rounded-2xl border border-hairline bg-card p-5 shadow-sm">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted">{p.brand} · {p.origin}</p>
                <h3 className="text-base font-bold text-ink">{p.name}</h3>
                <p className="mt-1 text-lg font-extrabold text-accent">{p.price}</p>
                <p className="mt-2 text-xs text-muted">{p.type}</p>
                {p.spf && (
                  <span className="mt-2 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">
                    {p.spf}
                  </span>
                )}

                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Key Ingredients</p>
                  <ul className="space-y-0.5">
                    {p.keyIngredients.map((ing, i) => (
                      <li key={i} className="text-xs text-muted-2">• {ing}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Best For</p>
                  <div className="flex flex-wrap gap-1">
                    {p.bestFor.map((b, i) => (
                      <span key={i} className="rounded-full bg-bg-alt px-2 py-0.5 text-xs text-muted-2">{b}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Texture</p>
                  <p className="text-xs text-muted-2">{p.texture}</p>
                </div>

                <p className="mt-3 text-xs font-bold text-brass">Rating: {p.rating}</p>

                <div className="mt-4 rounded-xl bg-accent-soft/40 p-3">
                  <p className="text-xs leading-5 text-muted-2">{p.verdict}</p>
                </div>

                <Link
                  href={`/shop/${p.slug}`}
                  className="mt-4 block rounded-xl bg-accent px-4 py-2 text-center text-sm font-bold text-white hover:bg-accent/90 transition-colors"
                >
                  View Product →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Our verdict */}
        <section className="mb-8 rounded-2xl border-l-4 border-accent bg-accent-soft/30 p-6">
          <h2 className="mb-3 text-xl font-bold text-ink">Our Verdict</h2>
          <p className="text-sm leading-7 text-muted-2">{comp.summary}</p>
        </section>

        {/* Bangladesh note */}
        <section className="mb-8 rounded-2xl border border-hairline bg-bg-alt p-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brass">Bangladesh Note</p>
          <p className="text-sm leading-7 text-muted-2">{comp.bangladeshNote}</p>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-ink">Common Questions</h2>
          <div className="space-y-4">
            {comp.faq.map((item, i) => (
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
          <h2 className="mt-2 text-xl font-extrabold">Both products. Authentic. COD.</h2>
          <p className="mt-2 text-sm text-white/70">
            All products verified authentic. Cash on Delivery across Bangladesh.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href={`/shop/${p1.slug}`} className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-ink hover:bg-accent hover:text-white transition-colors">
              {p1.brand} →
            </Link>
            <Link href={`/shop/${p2.slug}`} className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors">
              {p2.brand} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
