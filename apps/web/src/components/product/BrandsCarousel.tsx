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
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroll1 = scrollRef1.current;
    const scroll2 = scrollRef2.current;

    if (!scroll1 || !scroll2) return;

    // Line 1: scroll left to right
    let scrollPos1 = 0;
    const scrollSpeed1 = 1;
    const maxScroll1 = scroll1.scrollWidth - scroll1.clientWidth;

    // Line 2: scroll right to left
    let scrollPos2 = maxScroll1;
    const scrollSpeed2 = 1;

    const interval = setInterval(() => {
      // Line 1: left to right
      scrollPos1 += scrollSpeed1;
      if (scrollPos1 >= maxScroll1) scrollPos1 = 0;
      scroll1.scrollLeft = scrollPos1;

      // Line 2: right to left
      scrollPos2 -= scrollSpeed2;
      if (scrollPos2 <= 0) scrollPos2 = maxScroll1;
      scroll2.scrollLeft = scrollPos2;
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const brandsArray = Array.from({ length: 2 }, () => brands).flat(); // Duplicate for infinite scroll

  return (
    <div className="py-12 bg-gray-50">
      {/* Line 1: Left to Right */}
      <div
        ref={scrollRef1}
        className="flex gap-8 overflow-x-hidden mb-6 scroll-smooth px-4"
      >
        {brandsArray.map((brand, idx) => (
          <div
            key={`line1-${idx}`}
            className="flex-shrink-0 h-16 w-32 flex items-center justify-center bg-white rounded-lg p-2"
          >
            <div className="relative w-full h-full">
              <Image
                src={brand.logo || 'https://via.placeholder.com/128x64?text=' + brand.name}
                alt={brand.name}
                fill
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Line 2: Right to Left */}
      <div
        ref={scrollRef2}
        className="flex gap-8 overflow-x-hidden scroll-smooth px-4"
      >
        {brandsArray.map((brand, idx) => (
          <div
            key={`line2-${idx}`}
            className="flex-shrink-0 h-16 w-32 flex items-center justify-center bg-white rounded-lg p-2"
          >
            <div className="relative w-full h-full">
              <Image
                src={brand.logo || 'https://via.placeholder.com/128x64?text=' + brand.name}
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
