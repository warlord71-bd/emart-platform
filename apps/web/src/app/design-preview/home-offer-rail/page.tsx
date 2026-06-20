import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import OfferRailDesignPreview, {
  type OfferRailPreviewVariant,
} from '@/components/design/OfferRailDesignPreview';

export const metadata: Metadata = {
  title: 'Offer Rail Design Preview',
  robots: { index: false, follow: false },
};

const variants: OfferRailPreviewVariant[] = ['a', 'b', 'c'];

export default function OfferRailPreviewPage({
  searchParams,
}: {
  searchParams?: { variant?: string };
}) {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DESIGN_PREVIEWS !== '1') {
    notFound();
  }

  const requestedVariant = searchParams?.variant?.toLowerCase();
  const activeVariant = variants.includes(requestedVariant as OfferRailPreviewVariant)
    ? (requestedVariant as OfferRailPreviewVariant)
    : null;
  const visibleVariants = activeVariant ? [activeVariant] : variants;

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-hairline pb-6">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-accent">Emart design change</div>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">HP-OFFER-001</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            Homepage offer-collection rail · three preview-only directions using live project tokens and offer configuration.
          </p>
          <nav aria-label="Preview variants" className="mt-5 flex flex-wrap gap-2">
            <Link href="/design-preview/home-offer-rail" className={`rounded-full px-4 py-2 text-sm font-bold transition ${!activeVariant ? 'bg-ink text-white' : 'bg-bg-alt text-ink hover:bg-accent-soft'}`}>
              All
            </Link>
            {variants.map((variant) => (
              <Link
                key={variant}
                href={`/design-preview/home-offer-rail?variant=${variant}`}
                className={`rounded-full px-4 py-2 text-sm font-bold uppercase transition ${activeVariant === variant ? 'bg-accent text-white' : 'bg-bg-alt text-ink hover:bg-accent-soft'}`}
              >
                Variant {variant}
              </Link>
            ))}
          </nav>
        </header>

        <div className="space-y-10">
          {visibleVariants.map((variant) => (
            <OfferRailDesignPreview key={variant} variant={variant} />
          ))}
        </div>
      </div>
    </main>
  );
}
