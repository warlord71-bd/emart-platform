import Link from 'next/link';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import { SKIN_TYPE_DEFINITIONS } from '@/lib/skin-type-definitions';

export const revalidate = 86400;

const canonical = absoluteUrl('/skin-type');

export const metadata: Metadata = {
  title: 'Skincare by Skin Type in Bangladesh | Oily, Dry, Acne & More',
  description:
    'Find the best skincare routine and products for your skin type in Bangladesh. Expert guides for oily, dry, combination, acne-prone, and sensitive skin suited to Dhaka\'s climate.',
  alternates: { canonical },
  openGraph: {
    title: 'Skincare by Skin Type in Bangladesh | Emart',
    description:
      'Expert skin-type guides tailored for Bangladesh\'s climate. AM/PM routines, key ingredients, and authentic products available with Cash on Delivery.',
    url: canonical,
    images: [{ url: absoluteUrl('/images/hero-products.png'), width: 1200, height: 630 }],
  },
};

const SKIN_TYPE_ICONS: Record<string, string> = {
  oily: '💧',
  'acne-prone': '🔬',
  dry: '🌿',
  combination: '⚖️',
  sensitive: '🌸',
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
    { '@type': 'ListItem', position: 2, name: 'Skin Types', item: canonical },
  ],
};

const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Skin Type Guides — Bangladesh',
  url: canonical,
  numberOfItems: SKIN_TYPE_DEFINITIONS.length,
  itemListElement: SKIN_TYPE_DEFINITIONS.map((st, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: `${st.name} Skincare Guide`,
    url: absoluteUrl(`/skin-type/${st.slug}`),
  })),
};

export default function SkinTypePage() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <span className="font-medium text-ink">Skin Types</span>
        </nav>

        {/* Header */}
        <div className="mb-10 border-b border-hairline pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Complete Guide</p>
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
            Skincare by Skin Type
          </h1>
          <p className="mt-3 text-lg font-medium text-muted">
            Bangladesh-specific guides: routines, ingredients, and tips for every skin type
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-2">
            Not all skincare advice works in Dhaka's climate. Our skin-type guides are built specifically for
            Bangladesh's heat, humidity, and hard water — covering AM/PM routines, ingredients to use and avoid,
            common mistakes, and authentic products available with Cash on Delivery.
          </p>
        </div>

        {/* Skin type cards */}
        <div className="space-y-4">
          {SKIN_TYPE_DEFINITIONS.map((st) => (
            <Link
              key={st.slug}
              href={`/skin-type/${st.slug}`}
              className="group flex items-start gap-5 rounded-2xl border border-hairline bg-card p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-card"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                {SKIN_TYPE_ICONS[st.slug] ?? '✨'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-bold text-ink group-hover:text-accent">{st.name}</h2>
                  <span className="text-xs text-muted">{st.nameBn}</span>
                </div>
                <p className="mt-1 text-sm text-muted-2 line-clamp-2">{st.tagline}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {st.relatedIngredients.slice(0, 3).map((ing) => (
                    <span
                      key={ing.slug}
                      className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
                    >
                      {ing.label}
                    </span>
                  ))}
                </div>
              </div>
              <span className="shrink-0 text-muted group-hover:text-accent transition-colors">→</span>
            </Link>
          ))}
        </div>

        {/* Skin quiz CTA */}
        <div className="mt-10 rounded-2xl bg-ink p-6 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">Not sure?</p>
          <h2 className="mt-2 text-xl font-extrabold">Take the Emart Skin Quiz</h2>
          <p className="mt-2 text-sm text-white/70">
            Answer 5 quick questions to discover your skin type and get personalised product recommendations.
          </p>
          <Link
            href="/skin-quiz"
            className="mt-4 inline-block rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-ink hover:bg-accent hover:text-white transition-colors"
          >
            Take the Quiz →
          </Link>
        </div>
      </div>
    </div>
  );
}
