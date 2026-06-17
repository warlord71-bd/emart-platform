import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronRight } from 'lucide-react';
import { absoluteUrl } from '@/lib/siteUrl';
import { COMPARE_DEFINITIONS } from '@/lib/compare-definitions';

export const revalidate = 86400;

const canonical = absoluteUrl('/compare');

export const metadata: Metadata = {
  title: 'Skincare Product Comparisons Bangladesh | CeraVe vs COSRX & More',
  description:
    'Side-by-side skincare comparisons for Bangladesh shoppers. CeraVe vs COSRX, BOJ vs Purito sunscreen, and more — with Bangladesh-specific advice, prices, and honest verdicts.',
  alternates: { canonical },
  openGraph: {
    title: 'Skincare Comparisons for Bangladesh | Emart',
    description:
      'Honest product comparisons for oily, dry, and acne-prone skin in Dhaka\'s climate. Prices in BDT, Cash on Delivery available.',
    url: canonical,
    images: [{ url: absoluteUrl('/images/hero-products.png'), width: 1200, height: 630 }],
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  Cleanser: '🧴',
  Sunscreen: '☀️',
  'Serum / Essence': '💧',
  Toner: '🌿',
  Moisturiser: '✨',
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <span className="font-medium text-ink">Compare</span>
        </nav>

        <div className="mb-10 border-b border-hairline pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Honest Reviews</p>
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
            Product Comparisons
          </h1>
          <p className="mt-3 text-lg font-medium text-muted">
            Bangladesh-specific — real prices, real climate, real skin
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-2">
            Which products actually work in Dhaka's humidity? We compare popular skincare duos with Bangladesh-specific
            advice — covering skin type fit, ingredient breakdowns, BDT prices, and which to buy first.
          </p>
        </div>

        <div className="space-y-4">
          {COMPARE_DEFINITIONS.map((comp) => {
            const [p1, p2] = comp.products;
            return (
              <Link
                key={comp.pair}
                href={`/compare/${comp.pair}`}
                className="group flex gap-4 rounded-2xl border border-hairline bg-card p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-card"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xl">
                  {CATEGORY_ICONS[comp.category] ?? '⚖️'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">{comp.category}</p>
                  <h2 className="mt-0.5 text-sm font-bold text-ink group-hover:text-accent line-clamp-2">
                    {p1.name} <span className="text-muted font-normal">vs</span> {p2.name}
                  </h2>
                  <p className="mt-1 text-xs text-muted-2 line-clamp-1">{comp.concern}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                    <span>{p1.price}</span>
                    <span>·</span>
                    <span>{p2.price}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 self-center text-muted transition-colors group-hover:text-accent" />
              </Link>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-hairline bg-bg-alt p-6 text-center">
          <p className="text-sm font-medium text-ink">Can&apos;t find a comparison you need?</p>
          <p className="mt-1 text-sm text-muted-2">
            WhatsApp us — our team helps you choose between any two products before you buy.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <a
              href="https://wa.me/8801919797399"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Ask on WhatsApp →
            </a>
            <Link href="/shop" className="inline-block rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black">
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
