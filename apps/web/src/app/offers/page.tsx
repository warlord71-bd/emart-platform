import type { Metadata } from 'next';
import Link from 'next/link';
import { absoluteUrl } from '@/lib/siteUrl';
import OffersHub from '@/components/offers/OffersHub';

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

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-ink">Offers & Deals</h1>
        <p className="mt-2 text-sm leading-6 text-muted max-w-2xl">
          Authentic skincare deals curated for Bangladesh — BOGO picks, clearance markdowns, combo sets, seasonal offers and more. All products ship with COD nationwide.
        </p>
      </div>

      <OffersHub />
    </main>
  );
}
