'use client';

import type { WooProduct } from '@/lib/woocommerce';

declare global {
  interface Window {
    rdt?: (
      action: 'init' | 'track',
      eventNameOrPixelId: string,
      parameters?: RedditPixelEventParameters
    ) => void;
  }
}

type RedditPixelEventName = 'PageVisit' | 'ViewContent' | 'AddToCart' | 'Purchase';

type RedditPixelProduct = {
  id: string;
  name?: string;
};

export type RedditPixelEventParameters = {
  currency?: 'BDT';
  value?: number;
  itemCount?: number;
  products?: RedditPixelProduct[];
  conversionId?: string;
};

function getProductValue(product: WooProduct): number | undefined {
  const value = Number.parseFloat(product.sale_price || product.price || product.regular_price || '0');
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export function getRedditPixelProductParams(product: WooProduct, quantity = 1): RedditPixelEventParameters {
  const value = getProductValue(product);

  return {
    currency: 'BDT',
    ...(value ? { value: Number((value * quantity).toFixed(2)) } : {}),
    itemCount: quantity,
    products: [{ id: String(product.id), name: product.name }],
  };
}

export function trackRedditEvent(eventName: RedditPixelEventName, parameters?: RedditPixelEventParameters) {
  if (typeof window === 'undefined' || typeof window.rdt !== 'function') return;
  window.rdt('track', eventName, parameters);
}
