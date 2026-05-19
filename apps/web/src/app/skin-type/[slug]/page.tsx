import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import { getSkinTypeBySlug, SKIN_TYPE_DEFINITIONS } from '@/lib/skin-type-definitions';
import { buildCollectionSchema } from '@/lib/collectionSchema';

export const revalidate = 86400;
export const dynamicParams = false;

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return SKIN_TYPE_DEFINITIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const st = getSkinTypeBySlug(params.slug);
  if (!st) return { title: 'Skin Type Not Found' };

  const canonical = absoluteUrl(`/skin-type/${st.slug}`);
  return {
    title: { absolute: `Best Skincare for ${st.name} in Bangladesh | Emart` },
    description: `Complete ${st.name} skincare guide for Bangladesh. Routine steps, key ingredients, products, and tips for ${st.nameBn} in Dhaka's climate. Shop authentic brands with COD.`,
    alternates: { canonical },
    openGraph: {
      title: `Best Skincare for ${st.name} in Bangladesh | Emart`,
      description: `${st.description.slice(0, 155)}`,
      url: canonical,
      images: [{ url: absoluteUrl('/images/hero-products.png'), width: 1200, height: 630 }],
    },
  };
}

export default function SkinTypePage({ params }: Props) {
  const st = getSkinTypeBySlug(params.slug);
  if (!st) notFound();

  const canonical = absoluteUrl(`/skin-type/${st.slug}`);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Best Skincare for ${st.name} in Bangladesh`,
    description: st.description,
    url: canonical,
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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: st.faq.map((item) => ({
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
      { '@type': 'ListItem', position: 2, name: 'Skin Types', item: absoluteUrl('/skin-type') },
      { '@type': 'ListItem', position: 3, name: st.name, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <Link href="/skin-type" className="hover:text-accent">Skin Types</Link>
          <span>/</span>
          <span className="font-medium text-ink">{st.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 border-b border-hairline pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Skin Type Guide</p>
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
            {st.name} <span className="text-muted">({st.nameBn})</span>
          </h1>
          <p className="mt-3 text-lg font-medium text-muted">{st.tagline}</p>
          <p className="mt-4 text-sm leading-7 text-muted-2">{st.description}</p>
        </div>

        {/* Characteristics */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-ink">Signs You Have {st.name}</h2>
          <ul className="space-y-2">
            {st.characteristics.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm leading-6 text-muted-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">✓</span>
                {c}
              </li>
            ))}
          </ul>
        </section>

        {/* Key Ingredients */}
        <section className="mb-8 rounded-2xl border border-hairline bg-bg-alt p-6">
          <h2 className="mb-4 text-xl font-bold text-ink">Key Ingredients for {st.name}</h2>
          <div className="flex flex-wrap gap-2">
            {st.relatedIngredients.map((ing) => (
              <Link
                key={ing.slug}
                href={`/ingredients/${ing.slug}`}
                className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent hover:text-white transition-colors"
              >
                {ing.label}
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Avoid</p>
            <ul className="mt-2 space-y-1">
              {st.ingredientsToAvoid.map((item, i) => (
                <li key={i} className="text-sm text-muted-2">✗ {item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Routine */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-ink">Recommended Routine for {st.name}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-hairline p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-brass">Morning (AM)</p>
              <ol className="space-y-2">
                {st.routine.am.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-6 text-muted-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-hairline p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">Evening (PM)</p>
              <ol className="space-y-2">
                {st.routine.pm.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-6 text-muted-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Bangladesh Climate Tips */}
        <section className="mb-8 rounded-2xl border-l-4 border-accent bg-accent-soft/30 p-6">
          <h2 className="mb-3 text-xl font-bold text-ink">{st.name} in Bangladesh&apos;s Climate</h2>
          <p className="text-sm leading-7 text-muted-2">{st.climateTips}</p>
        </section>

        {/* Common Mistakes */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-ink">Common Mistakes to Avoid</h2>
          <ul className="space-y-3">
            {st.commonMistakes.map((m, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-hairline p-4 text-sm text-muted-2">
                <span className="mt-0.5 text-base">⚠️</span>
                {m}
              </li>
            ))}
          </ul>
        </section>

        {/* Related Concerns */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-ink">Common Concerns for {st.name}</h2>
          <div className="flex flex-wrap gap-3">
            {st.relatedConcerns.map((c) => (
              <Link
                key={c.slug}
                href={`/concerns/${c.slug}`}
                className="rounded-xl border border-hairline bg-card px-4 py-3 text-sm font-semibold text-ink shadow-sm hover:border-accent/30 hover:shadow-card transition-all"
              >
                {c.label} →
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-ink">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {st.faq.map((item, i) => (
              <details key={i} className="group rounded-xl border border-hairline bg-card p-5 shadow-sm">
                <summary className="cursor-pointer list-none text-sm font-semibold text-ink group-open:text-accent">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted-2">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Shop CTA */}
        <div className="rounded-2xl bg-ink p-6 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">Shop Emart</p>
          <h2 className="mt-2 text-xl font-extrabold">
            Authentic products for {st.name}
          </h2>
          <p className="mt-2 text-sm text-white/70">
            All products verified authentic. Cash on Delivery across Bangladesh.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-ink hover:bg-accent hover:text-white transition-colors">
              Browse All Products
            </Link>
            {st.relatedConcerns[0] && (
              <Link href={`/concerns/${st.relatedConcerns[0].slug}`} className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors">
                {st.relatedConcerns[0].label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
