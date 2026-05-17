'use client';

import dynamic from 'next/dynamic';
import Script from 'next/script';
import MetaPixel from '@/components/analytics/MetaPixel';

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

export default function RuntimeWidgets({ googleTagId }: { googleTagId?: string }) {
  return (
    <>
      <CartDrawer />
      <MetaPixel />
      {googleTagId ? <LazyGoogleAnalytics gaId={googleTagId} /> : null}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, Hind Siliguri, sans-serif',
            borderRadius: '10px',
          },
          success: {
            iconTheme: { primary: '#c76882', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}
