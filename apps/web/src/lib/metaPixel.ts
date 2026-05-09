'use client';

import type { WooProduct } from '@/lib/woocommerce';

declare global {
  interface Window {
    fbq?: (
      action: 'init' | 'track',
      eventName: string,
      parameters?: MetaPixelEventParameters
    ) => void;
    _fbq?: Window['fbq'];
  }
}

type MetaPixelEventParameters = {
  content_ids?: string[];
  content_name?: string;
  content_type?: 'product' | 'product_group';
  value?: number;
  currency?: 'BDT';
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  num_items?: number;
};

function getProductValue(product: WooProduct): number | undefined {
  const value = Number.parseFloat(product.sale_price || product.price || product.regular_price || '0');
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export function getMetaPixelProductParams(product: WooProduct, quantity = 1): MetaPixelEventParameters {
  const id = String(product.id);
  const value = getProductValue(product);

  return {
    content_ids: [id],
    content_name: product.name,
    content_type: 'product',
    currency: 'BDT',
    ...(value ? { value: Number((value * quantity).toFixed(2)) } : {}),
    contents: [
      {
        id,
        quantity,
        ...(value ? { item_price: value } : {}),
      },
    ],
    num_items: quantity,
  };
}

export function trackMetaEvent(eventName: 'PageView' | 'ViewContent' | 'AddToCart', parameters?: MetaPixelEventParameters) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', eventName, parameters);
}

