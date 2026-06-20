import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PdpInteractionPreview from '@/components/design/PdpInteractionPreview';

export const metadata: Metadata = {
  title: 'Interactive PDP Design Preview',
  robots: { index: false, follow: false },
};

export default function PdpInteractionPreviewPage() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DESIGN_PREVIEWS !== '1') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-accent">Emart design change · preview only</div>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">PDP-INTERACTION-001</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            A richer product-detail interaction sample using real Emart product identity and pricing. All purchase actions are safely simulated.
          </p>
        </header>
        <PdpInteractionPreview />
      </div>
    </main>
  );
}
