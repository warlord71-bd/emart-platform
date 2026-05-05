'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { WooImage } from '@/lib/woocommerce';

interface ProductImageProps {
  images: WooImage[];
  productName: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  images,
  productName,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const mainImage = images?.[selectedImageIndex];

  if (!mainImage) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center h-96 md:h-full">
        <p className="text-gray-500">No image available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:sticky lg:top-32 lg:self-start">
      {/* Main Image with Zoom */}
      <div
        className="group relative flex h-[360px] cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl bg-gray-50 sm:h-[460px] lg:h-[560px]"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <Image
          src={mainImage.src}
          alt={mainImage.alt || productName}
          width={500}
          height={500}
          priority={selectedImageIndex === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
          quality={85}
          className={`h-full w-full object-contain transition-transform duration-300 ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
        />
        {images.length > 1 && (
          <div className="absolute right-4 top-4 rounded bg-white px-3 py-1 text-sm text-gray-600 opacity-0 transition-opacity group-hover:opacity-100">
            Zoom
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((image, index) => (
            <button
              key={image.id || image.src || index}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              aria-label={`Show image ${index + 1} for ${productName}`}
              aria-current={selectedImageIndex === index ? 'true' : undefined}
              className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all ${
                selectedImageIndex === index
                  ? 'border-lumiere-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image.src}
                alt={`${productName} ${index + 1}`}
                width={80}
                height={80}
                quality={60}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
