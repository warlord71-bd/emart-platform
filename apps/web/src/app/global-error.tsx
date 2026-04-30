'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '4rem 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Emart — Something went wrong</h1>
        <p style={{ color: '#666', marginTop: '0.75rem' }}>
          A critical error occurred. Please refresh the page.
        </p>
        <button
          onClick={reset}
          style={{ marginTop: '1.5rem', padding: '0.6rem 1.5rem', background: '#c76882', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
        >
          Refresh
        </button>
      </body>
    </html>
  );
}
