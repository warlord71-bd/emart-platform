import { Suspense } from 'react';
import type { Metadata } from 'next';
import OrderSuccessClient from './OrderSuccessClient';

export const metadata: Metadata = {
  title: 'Order Success',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderSuccessClient />
    </Suspense>
  );
}
