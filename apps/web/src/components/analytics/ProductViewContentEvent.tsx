'use client';

import { useEffect } from 'react';
import type { WooProduct } from '@/lib/woocommerce';
import { getMetaPixelProductParams, trackMetaEvent } from '@/lib/metaPixel';
import { getRedditPixelProductParams, trackRedditEvent } from '@/lib/redditPixel';
import { trackGA4, getGA4ProductItem, getGA4ProductValue } from '@/lib/ga4';

interface ProductViewContentEventProps {
  product: WooProduct;
}

export default function ProductViewContentEvent({ product }: ProductViewContentEventProps) {
  useEffect(() => {
    trackMetaEvent('ViewContent', getMetaPixelProductParams(product));
    trackRedditEvent('ViewContent', getRedditPixelProductParams(product));
    trackGA4('view_item', {
      currency: 'BDT',
      value: getGA4ProductValue(product),
      items: [getGA4ProductItem(product)],
    });

    try {
      const key = 'emart-recently-viewed';
      const max = 12;
      const entry = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.src || '',
        brand: product.brands?.[0]?.name || '',
      };
      const stored: typeof entry[] = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = stored.filter((p) => p.id !== product.id);
      filtered.unshift(entry);
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, max)));
    } catch { /* localStorage unavailable */ }
  }, [product]);

  return null;
}

