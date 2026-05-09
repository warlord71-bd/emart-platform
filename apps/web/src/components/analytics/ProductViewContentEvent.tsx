'use client';

import { useEffect } from 'react';
import type { WooProduct } from '@/lib/woocommerce';
import { getMetaPixelProductParams, trackMetaEvent } from '@/lib/metaPixel';

interface ProductViewContentEventProps {
  product: WooProduct;
}

export default function ProductViewContentEvent({ product }: ProductViewContentEventProps) {
  useEffect(() => {
    trackMetaEvent('ViewContent', getMetaPixelProductParams(product));
  }, [product]);

  return null;
}

