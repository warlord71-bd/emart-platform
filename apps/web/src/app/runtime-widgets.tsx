'use client';

import dynamic from 'next/dynamic';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import MetaPixel from '@/components/analytics/MetaPixel';
import RedditPixel from '@/components/analytics/RedditPixel';
import { useDeploymentCheck } from '@/hooks/useDeploymentCheck';

const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), {
  ssr: false,
});

const Toaster = dynamic(() => import('react-hot-toast').then((mod) => mod.Toaster), {
  ssr: false,
});

function useDeferredThirdParty(delayMs = 8000) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;
    const interactionEvents = ['pointerdown', 'keydown', 'touchstart'] as const;

    const markReady = () => {
      if (!cancelled) setReady(true);
    };

    const cleanupInteractionListeners = () => {
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markReady);
      });
    };

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, markReady, { once: true, passive: true });
    });
    timerId = window.setTimeout(markReady, delayMs);

    return () => {
      cancelled = true;
      cleanupInteractionListeners();
      if (timerId) window.clearTimeout(timerId);
    };
  }, [delayMs]);

  return ready;
}

function LazyGoogleAnalytics({ gaId }: { gaId: string }) {
  // 2026-06-23 (GA4+GSC audit): the prior 8s gate + lazyOnload meant gtag.js
  // fired ~9s after load, so mobile bounce visits (the majority on BD networks)
  // were never measured — undercounting real traffic by ~20% and inflating the
  // "Direct" channel from lost referrers. Load eagerly with afterInteractive
  // (Google's recommended strategy for analytics). The cosmetic merchant badge
  // below stays deferred at 30s for page-speed.
  if (!gaId) return null;

  return (
    <Script
      id="ga-loader"
      strategy="afterInteractive"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
    />
  );
}

function GoogleRatingBadge() {
  const ready = useDeferredThirdParty(30000);
  if (!ready) return null;

  return (
    <>
      {/* Google Customer Reviews merchant widget badge (bottom-right) */}
      <Script
        id="merchantWidgetScript"
        src="https://www.gstatic.com/shopping/merchant/merchantwidget.js"
        strategy="lazyOnload"
        onLoad={() => {
          (window as any).merchantwidget?.start({ merchant_id: 436245109, position: 'BOTTOM_RIGHT' });
        }}
      />
    </>
  );
}

export default function RuntimeWidgets({ googleTagId }: { googleTagId?: string }) {
  useDeploymentCheck();
  return (
    <>
      <CartDrawer />
      <MetaPixel />
      <RedditPixel />
      {googleTagId ? <LazyGoogleAnalytics gaId={googleTagId} /> : null}
      <GoogleRatingBadge />
      <Toaster
        position="top-center"
        containerStyle={{
          width: '100vw',
          maxWidth: '100vw',
          left: 0,
          right: 0,
          boxSizing: 'border-box',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, Hind Siliguri, sans-serif',
            borderRadius: '10px',
            maxWidth: 'calc(100vw - 32px)',
          },
          success: {
            iconTheme: { primary: '#c76882', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}
