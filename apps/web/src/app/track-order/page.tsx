import { Suspense } from 'react';
import type { Metadata } from 'next';
import TrackOrderClient from './TrackOrderClient';

export const metadata: Metadata = {
  title: 'Track Your Order',
  description: 'Track your Emart order status. Enter your order number to see delivery updates, courier tracking, and estimated delivery time.',
  alternates: { canonical: 'https://e-mart.com.bd/track-order' },
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Track Your Order</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <TrackOrderClient />
      </Suspense>
    </>
  );
}
