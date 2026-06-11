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

function useDeferredThirdParty(delayMs = 30000) {
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

// Eager but network-free: defines window.gtag/dataLayer and queues the
// initial config immediately, so trackGA4() calls from early page
// interactions (e.g. view_item on PDP mount) are captured even though the
// actual gtag.js fetch below stays deferred for 30s/first interaction.
function GA4Stub({ gaId }: { gaId: string }) {
  return (
    <Script
      id="ga-config"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `,
      }}
    />
  );
}

function LazyGoogleAnalytics({ gaId }: { gaId: string }) {
  const ready = useDeferredThirdParty(30000);
  if (!gaId || !ready) return null;

  return (
    <Script
      id="ga-loader"
      strategy="lazyOnload"
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
      {googleTagId ? <GA4Stub gaId={googleTagId} /> : null}
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
