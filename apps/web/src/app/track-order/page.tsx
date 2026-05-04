import { Suspense } from 'react';
import type { Metadata } from 'next';
import TrackOrderClient from './TrackOrderClient';

export const metadata: Metadata = {
  title: 'Track Order',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackOrderClient />
    </Suspense>
  );
}
