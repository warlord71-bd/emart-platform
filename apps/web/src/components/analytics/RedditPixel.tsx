'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { trackRedditEvent } from '@/lib/redditPixel';

const REDDIT_PIXEL_ID = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID;

export default function RedditPixel() {
  const pathname = usePathname();
  const firstPathname = useRef<string | null>(null);
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
    timerId = window.setTimeout(markReady, 30000);

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

    trackRedditEvent('PageVisit');
  }, [pathname]);

  if (!REDDIT_PIXEL_ID || !ready) return null;

  return (
    <Script
      id="reddit-pixel"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js";t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
          rdt('init','${REDDIT_PIXEL_ID}');
          rdt('track', 'PageVisit');
        `,
      }}
    />
  );
}
