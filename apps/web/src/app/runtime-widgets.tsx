'use client';

import dynamic from 'next/dynamic';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import MetaPixel from '@/components/analytics/MetaPixel';
import { useDeploymentCheck } from '@/hooks/useDeploymentCheck';

const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), {
  ssr: false,
});

const Toaster = dynamic(() => import('react-hot-toast').then((mod) => mod.Toaster), {
  ssr: false,
});

function useDeferredThirdParty(delayMs = 4000) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timerId: number | undefined;

    const markReady = () => {
      if (!cancelled) setReady(true);
    };

    const schedule = () => {
      timerId = window.setTimeout(markReady, delayMs);
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(markReady, { timeout: delayMs });
      }
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      if (timerId) window.clearTimeout(timerId);
      if (idleId && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [delayMs]);

  return ready;
}

function LazyGoogleAnalytics({ gaId }: { gaId: string }) {
  const ready = useDeferredThirdParty(3500);
  if (!gaId || !ready) return null;

  return (
    <>
      <Script
        id="ga-loader"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
      />
      <Script
        id="ga-config"
        strategy="lazyOnload"
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
    </>
  );
}

function GoogleRatingBadge() {
  const ready = useDeferredThirdParty(5000);
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
