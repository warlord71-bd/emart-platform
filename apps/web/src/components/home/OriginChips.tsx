'use client';

import Link from 'next/link';

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
    <section className="py-6 px-4 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-lg md:text-xl font-bold text-navy-950 mb-2">
            Shop by Origin
          </h2>
          <p className="text-sm text-gray-600">
            Browse authentic beauty products from around the world
          </p>
        </div>

        {/* Origin Chips Grid */}
        <div className="flex flex-wrap justify-center gap-3">
          {ORIGINS.map((origin) => (
            <Link
              key={origin.slug}
              href={`/shop?origin=${encodeURIComponent(origin.slug)}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-pink-400 hover:shadow-md rounded-full transition-all duration-200 group"
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
