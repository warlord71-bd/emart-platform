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
  }, [product]);

  return null;
}

