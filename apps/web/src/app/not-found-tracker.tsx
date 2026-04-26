'use client';

import { useEffect } from 'react';

export function NotFoundTracker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'headless_migration_404', {
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search,
      });
    }
  }, []);

  return null;
}
