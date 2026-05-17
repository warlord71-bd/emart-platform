'use client';
import { useEffect, useRef } from 'react';
import { useCartStore } from '@/store/cartStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      useCartStore.persist.rehydrate();
      hydrated.current = true;
    }
  }, []);

  return (
    <>
      {children}
    </>
  );
}
