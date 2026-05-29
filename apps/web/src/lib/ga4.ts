// GA4 / gtag utility — thin wrapper so call sites don't need window.gtag casts.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// sessionStorage key used to carry the sticky-bar variant across the checkout funnel
export const GA4_STICKY_VARIANT_KEY = 'emart_sticky_bar_variant';

export function trackGA4(
  eventName: string,
  params: Record<string, string | number | boolean | undefined> = {},
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}
