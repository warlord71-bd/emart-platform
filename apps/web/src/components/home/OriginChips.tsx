'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';

const ORIGINS = [
  { name: 'Korea', emoji: '🇰🇷', slug: 'korea' },
  { name: 'Japan', emoji: '🇯🇵', slug: 'japan' },
  { name: 'UK', emoji: '🇬🇧', slug: 'uk' },
  { name: 'USA', emoji: '🇺🇸', slug: 'usa' },
  { name: 'France', emoji: '🇫🇷', slug: 'france' },
  { name: 'India', emoji: '🇮🇳', slug: 'india' },
  { name: 'Bangladesh', emoji: '🇧🇩', slug: 'bangladesh' },
];

export const OriginChips = () => {
  return (
    <section className="bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header - Left-aligned with icon (matching CategoriesShowcaseInteractive) */}
        <div className="mb-8 flex items-center gap-4">
          <div className="hidden md:flex items-center justify-center w-12 h-12 bg-blue-500 rounded-lg">
            <Globe size={24} className="text-white fill-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy-950">
            Shop by Origin
          </h2>
        </div>

        {/* Origin Chips Grid - Centered flex layout */}
        <div className="flex flex-wrap justify-start gap-3">
          {ORIGINS.map((origin) => (
            <Link
              key={origin.slug}
              href={`/shop?origin=${encodeURIComponent(origin.slug)}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 hover:border-pink-400 hover:shadow-md rounded-full transition-all duration-200 group"
            >
              <span className="text-lg md:text-xl">{origin.emoji}</span>
              <span className="text-sm md:text-base font-semibold text-navy-950 group-hover:text-pink-500 transition-colors">
                {origin.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
