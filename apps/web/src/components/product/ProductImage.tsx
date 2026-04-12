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
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const mainImage = images?.[selectedImageIndex];

  if (!mainImage) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center h-96 md:h-full">
        <p className="text-gray-500">No image available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image with Zoom */}
      <div
        className="bg-gray-50 rounded-lg overflow-hidden relative h-96 md:h-full flex items-center justify-center group cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        {failedImages.has(selectedImageIndex) ? (
          <div className="flex items-center justify-center w-full h-full bg-gray-200">
            <p className="text-gray-500 text-center">Image unavailable</p>
          </div>
        ) : (
          <Image
            src={mainImage.src}
            alt={mainImage.alt || productName}
            width={500}
            height={500}
            priority={true}
            quality={85}
            className={`w-full h-full object-contain transition-transform duration-300 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            onError={() => {
              setFailedImages(prev => new Set([...prev, selectedImageIndex]));
            }}
          />
        )}
        {images.length > 1 && (
          <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded text-sm text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
            🔍 Zoom
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImageIndex === index
                  ? 'border-lumiere-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={failedImages.has(index)}
            >
              {failedImages.has(index) ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                  N/A
                </div>
              ) : (
                <Image
                  src={image.src}
                  alt={`${productName} ${index + 1}`}
                  width={80}
                  height={80}
                  quality={60}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={() => {
                    setFailedImages(prev => new Set([...prev, index]));
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
