'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

const WP_BASE = 'https://e-mart.com.bd';
const PLACEHOLDER = `${WP_BASE}/wp-content/uploads/woocommerce-placeholder.png`;

/**
 * Wrapper around next/image for WordPress-hosted images.
 *
 * - Normalises relative `/wp-content/uploads/…` paths to absolute URLs
 * - Falls back to the WooCommerce placeholder on load error
 * - Passes unoptimized={false} so Next.js /_next/image optimises these
 *   images even while the global `unoptimized: true` default is in place
 *   (the per-component prop takes precedence)
 *
 * Usage:
 *   <WpImage src={product.images[0].src} alt={product.name} width={500} height={500} />
 */

type WpImageProps = Omit<ImageProps, 'src'> & {
  src?: string | null;
  fallback?: string;
};

export function WpImage({ src, alt, fallback = PLACEHOLDER, ...props }: WpImageProps) {
  const resolved = resolveWpUrl(src);
  const [imgSrc, setImgSrc] = useState(resolved || fallback);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt ?? ''}
      unoptimized={false}
      onError={() => setImgSrc(fallback)}
    />
  );
}

function resolveWpUrl(src?: string | null): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/')) return `${WP_BASE}${src}`;
  return src;
}
