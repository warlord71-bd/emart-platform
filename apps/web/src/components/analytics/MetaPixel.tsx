'use client';

import { useEffect, useRef } from 'react';
import { useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { trackMetaEvent } from '@/lib/metaPixel';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '763041131179021';

export default function MetaPixel() {
  const pathname = usePathname();
  const firstPathname = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | undefined;
    const interactionEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

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
    timerId = window.setTimeout(markReady, 12000);

    return () => {
      cancelled = true;
      cleanupInteractionListeners();
      if (timerId) window.clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;

    if (firstPathname.current === null) {
      firstPathname.current = pathname;
      return;
    }

    trackMetaEvent('PageView');
  }, [pathname]);

  if (!META_PIXEL_ID || !ready) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript dangerouslySetInnerHTML={{ __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" alt="" />` }} />
    </>
  );
}
