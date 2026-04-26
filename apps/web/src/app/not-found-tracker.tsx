'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sendGAEvent } from '@next/third-parties/google';

export function NotFoundTracker() {
  const pathname = usePathname();

  useEffect(() => {
    sendGAEvent('event', 'headless_migration_404', {
      page_path: pathname,
    });
  }, [pathname]);

  return null;
}
