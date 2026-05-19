import Link from 'next/link';
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/siteUrl';
import { BEST_DEFINITIONS } from '@/lib/best-definitions';

export const revalidate = 86400;

const canonical = absoluteUrl('/best');

export const metadata: Metadata = {
  title: 'Best Skincare Products in Bangladesh 2026 | Expert Picks by Emart',
  description:
    'Emart\'s curated best-of skincare lists for Bangladesh: best sunscreen, face wash, moisturiser, and more — tested for Dhaka\'s climate with BDT prices and Cash on Delivery.',
  alternates: { canonical },
  openGraph: {
    title: 'Best Skincare in Bangladesh | Emart Picks',
    description:
      'Expert-curated skincare lists for Bangladesh shoppers. Honest picks for oily, dry, acne-prone skin — with BDT prices and COD available.',
    url: canonical,
    images: [{ url: absoluteUrl('/images/hero-products.png'), width: 1200, height: 630 }],
  },
};

export default function BestListPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span>/</span>
          <span className="font-medium text-ink">Best Lists</span>
        </nav>

        <div className="mb-10 border-b border-hairline pb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Emart Picks 2026</p>
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
            Best Skincare Products in Bangladesh
          </h1>
          <p className="mt-3 text-lg font-medium text-muted">
            Honest lists — tested for Dhaka&apos;s climate, priced in BDT, with COD
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-2">
            Every product on these lists is chosen based on real Bangladesh customer reviews, ingredient analysis,
            and what Emart customers actually repurchase. Prices are in BDT. All products are authentic and
            available with Cash on Delivery across Bangladesh.
          </p>
        </div>

        <div className="space-y-4">
          {BEST_DEFINITIONS.map((best) => (
            <Link
              key={best.slug}
              href={`/best/${best.slug}`}
              className="group flex gap-4 rounded-2xl border border-hairline bg-card p-5 shadow-sm transition-all hover:border-accent/30 hover:shadow-card"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xl">
                🏆
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-ink group-hover:text-accent line-clamp-2">{best.title}</h2>
                <p className="mt-1 text-xs text-muted-2 line-clamp-2">{best.description.slice(0, 100)}…</p>
                <p className="mt-2 text-xs text-muted">
                  {best.products.length} picks · Updated {new Date(best.updatedDate).toLocaleDateString('en-BD', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className="shrink-0 self-center text-muted group-hover:text-accent transition-colors">→</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-hairline bg-bg-alt p-6 text-center">
          <p className="text-sm font-medium text-ink">Not sure what skin type you have?</p>
          <p className="mt-1 text-sm text-muted-2">Take our free skin quiz — 5 questions, personalised picks.</p>
          <Link
            href="/skin-quiz"
            className="mt-3 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-white hover:bg-accent/90 transition-colors"
          >
            Take the Skin Quiz →
          </Link>
        </div>
      </div>
    </div>
  );
}
