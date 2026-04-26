'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

interface Brand {
  id: number;
  name: string;
  logo: string;
}

interface BrandsCarouselProps {
  brands: Brand[];
}

export const BrandsCarousel: React.FC<BrandsCarouselProps> = ({ brands }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroll = scrollRef.current;

    if (!scroll) return;

    let scrollPos = 0;
    const scrollSpeed = 1;
    const maxScroll = scroll.scrollWidth - scroll.clientWidth;
    if (maxScroll <= 0) return;

    const interval = setInterval(() => {
      scrollPos += scrollSpeed;
      if (scrollPos >= maxScroll) scrollPos = 0;
      scroll.scrollLeft = scrollPos;
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-12 bg-gray-50">
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-hidden scroll-smooth px-4"
      >
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="flex-shrink-0 h-16 w-32 flex items-center justify-center bg-white rounded-lg p-2"
          >
            <div className="relative w-full h-full">
              <Image
                src={brand.logo || '/logo.png'}
                alt={brand.name}
                fill
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
