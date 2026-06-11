// GA4 / gtag utility — thin wrapper so call sites don't need window.gtag casts.

import type { WooProduct } from '@/lib/woocommerce';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// sessionStorage key used to carry the sticky-bar variant across the checkout funnel
export const GA4_STICKY_VARIANT_KEY = 'emart_sticky_bar_variant';

export interface GA4Item {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
}

export function trackGA4(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

function getProductPrice(product: WooProduct): number | undefined {
  const value = Number.parseFloat(product.sale_price || product.price || product.regular_price || '0');
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

// GA4 standard ecommerce `items[]` entry for a single product.
export function getGA4ProductItem(product: WooProduct, quantity = 1): GA4Item {
  const price = getProductPrice(product);

  return {
    item_id: String(product.id),
    item_name: product.name,
    ...(price ? { price } : {}),
    quantity,
  };
}

// GA4 standard ecommerce `value` for a single product line (price * quantity).
export function getGA4ProductValue(product: WooProduct, quantity = 1): number | undefined {
  const price = getProductPrice(product);
  return price ? Number((price * quantity).toFixed(2)) : undefined;
}
