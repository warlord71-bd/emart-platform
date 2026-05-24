import type { Metadata } from 'next';
import Link from 'next/link';
import { OFFER_COLLECTIONS } from '@/lib/offerCollectionConfig';
import { absoluteUrl } from '@/lib/siteUrl';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: 'Offers & Deals on Skincare in Bangladesh | Emart' },
  description: 'Browse all skincare offers at Emart Skincare Bangladesh — BOGO deals, clearance sale, combo sets, coupon picks, Eid offers and more. Authentic products with COD nationwide.',
  alternates: { canonical: absoluteUrl('/offers') },
  openGraph: {
    title: 'Offers & Deals on Skincare in Bangladesh | Emart',
    description: 'Browse all skincare offers at Emart Skincare Bangladesh — BOGO deals, clearance sale, combo sets, coupon picks, Eid offers and more.',
    url: absoluteUrl('/offers'),
  },
};

const ICON_MAP: Record<string, string> = {
  gift: '🎁',
  moon: '🌙',
  tag: '🏷️',
  boxes: '📦',
  truck: '🚚',
  ticket: '🎟️',
};

export default function OffersIndexPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Offers', item: absoluteUrl('/offers') },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <span className="text-muted-2">/</span>
        <span className="font-medium text-ink">Offers</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-ink">Offers & Deals</h1>
        <p className="mt-2 text-sm leading-6 text-muted max-w-2xl">
          Authentic skincare deals curated for Bangladesh — BOGO picks, clearance markdowns, combo sets, seasonal offers and more. All products ship with COD nationwide.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Sale items — all discounted products */}
        <Link
          href="/sale"
          className="group flex flex-col overflow-hidden rounded-[24px] border border-hairline bg-gradient-to-br from-[#fff0f0] via-[#fff5f5] to-[#ffeaea] p-5 shadow-card transition-shadow hover:shadow-md"
        >
          <span className="text-2xl">🔥</span>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">All discounts</p>
          <h2 className="mt-1 text-lg font-extrabold text-ink leading-snug group-hover:text-accent transition-colors">
            Sale Items
          </h2>
          <p className="mt-2 text-xs leading-5 text-muted flex-1">All products currently on sale with reduced prices</p>
          <span className="mt-4 inline-flex items-center text-xs font-semibold text-accent">
            Browse picks →
          </span>
        </Link>

        {OFFER_COLLECTIONS.map((offer) => (
          <Link
            key={offer.slug}
            href={offer.href}
            className={`group flex flex-col overflow-hidden rounded-[24px] border border-hairline bg-gradient-to-br ${offer.accent} p-5 shadow-card transition-shadow hover:shadow-md`}
          >
            <span className="text-2xl">{ICON_MAP[offer.icon] ?? '🛍️'}</span>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{offer.eyebrow}</p>
            <h2 className="mt-1 text-lg font-extrabold text-ink leading-snug group-hover:text-accent transition-colors">
              {offer.label}
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted flex-1">{offer.hint}</p>
            <span className="mt-4 inline-flex items-center text-xs font-semibold text-accent">
              Browse picks →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
