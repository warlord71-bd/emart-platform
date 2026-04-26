import Link from 'next/link';
import type { Metadata } from 'next';
import { NotFoundTracker } from './not-found-tracker';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <NotFoundTracker />
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="font-display text-6xl font-bold text-accent">404</p>
        <h1 className="text-2xl font-semibold text-ink">Page Not Found</h1>
        <p className="max-w-sm text-ink-2">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Go Home
          </Link>
          <Link
            href="/shop"
            className="rounded-full border border-hairline px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-bg-2"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </>
  );
}
