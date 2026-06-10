'use client';

import { useEffect } from 'react';
import type { WooProduct } from '@/lib/woocommerce';
import { getMetaPixelProductParams, trackMetaEvent } from '@/lib/metaPixel';
import { getRedditPixelProductParams, trackRedditEvent } from '@/lib/redditPixel';

interface ProductViewContentEventProps {
  product: WooProduct;
}

export default function ProductViewContentEvent({ product }: ProductViewContentEventProps) {
  useEffect(() => {
    trackMetaEvent('ViewContent', getMetaPixelProductParams(product));
    trackRedditEvent('ViewContent', getRedditPixelProductParams(product));
  }, [product]);

  return null;
}

