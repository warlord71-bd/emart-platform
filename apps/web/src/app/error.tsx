'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console server-side error tracking can pick up
    console.error('[page error]', error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="text-5xl">😔</div>
      <h1 className="mt-4 text-2xl font-extrabold text-ink">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-sm leading-7 text-gray-500">
        Our store ran into a temporary issue. Your cart and wishlist are safe — please try again.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-hairline bg-white px-5 py-2.5 text-sm font-bold text-ink hover:bg-bg-alt"
        >
          Back to shop
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-gray-400">Error ID: {error.digest}</p>
      )}
    </main>
  );
}
