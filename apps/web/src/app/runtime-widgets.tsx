'use client';

import dynamic from 'next/dynamic';
import Script from 'next/script';
import MetaPixel from '@/components/analytics/MetaPixel';
import { useDeploymentCheck } from '@/hooks/useDeploymentCheck';

const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), {
  ssr: false,
});

const Toaster = dynamic(() => import('react-hot-toast').then((mod) => mod.Toaster), {
  ssr: false,
});

function LazyGoogleAnalytics({ gaId }: { gaId: string }) {
  if (!gaId) return null;

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
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  );
}

function GoogleRatingBadge() {
  return (
    <>
      <Script
        src="https://apis.google.com/js/platform.js"
        strategy="lazyOnload"
        id="gcr-badge-platform"
      />
      {/* Google Customer Reviews badge — renders bottom-right corner */}
      <div
        dangerouslySetInnerHTML={{
          __html: `<g:ratingbadge merchant_id="436245109"></g:ratingbadge>`,
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
