import { Suspense } from 'react';
import TrackOrderClient from './TrackOrderClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackOrderClient />
    </Suspense>
  );
}
