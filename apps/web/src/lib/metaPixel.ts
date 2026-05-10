'use client';

import type { WooProduct } from '@/lib/woocommerce';

declare global {
  interface Window {
    fbq?: (
      action: 'init' | 'track',
      eventName: MetaPixelEventName,
      parameters?: MetaPixelEventParameters,
      options?: MetaPixelEventOptions
    ) => void;
    _fbq?: Window['fbq'];
  }
}

export const META_PIXEL_PURCHASE_STORAGE_KEY = 'emart-meta-purchase';

type MetaPixelEventName = 'PageView' | 'ViewContent' | 'AddToCart' | 'Purchase';

type MetaPixelEventOptions = {
  eventID?: string;
};

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

export function trackMetaEvent(
  eventName: MetaPixelEventName,
  parameters?: MetaPixelEventParameters,
  options?: MetaPixelEventOptions,
) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', eventName, parameters, options);
}

export function parseMetaPixelValue(value: unknown): number | undefined {
  const parsed = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value || '').replace(/[^\d.-]/g, ''));

  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : undefined;
}
