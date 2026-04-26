'use client';

import Link from 'next/link';

const ORIGINS = [
  { name: 'Korea', emoji: '🇰🇷', slug: 'korea' },
  { name: 'Japan', emoji: '🇯🇵', slug: 'japan' },
  { name: 'UK', emoji: '🇬🇧', slug: 'uk' },
  { name: 'USA', emoji: '🇺🇸', slug: 'usa' },
  { name: 'France', emoji: '🇫🇷', slug: 'france' },
  { name: 'India', emoji: '🇮🇳', slug: 'india' },
  { name: 'Thailand', emoji: '🇹🇭', slug: 'thailand' },
  { name: 'Other', emoji: '🌍', slug: 'other' },
];

export const OriginChips = () => {
  return (
    <section className="bg-gradient-to-r from-accent-soft via-white to-[#f5efe7] px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="mb-2 text-lg font-bold text-ink md:text-xl">
            Shop by Origin
          </h2>
          <p className="text-sm text-muted">
            Browse authentic beauty products from around the world
          </p>
        </div>

        {/* Origin Chips Grid */}
        <div className="flex flex-wrap justify-center gap-3">
          {ORIGINS.map((origin) => (
            <Link
              key={origin.slug}
              href={`/origins?country=${encodeURIComponent(origin.slug)}`}
              className="group inline-flex items-center gap-2 rounded-full border border-hairline bg-card px-4 py-2.5 transition-all duration-200 hover:border-accent/30 hover:bg-accent-soft hover:shadow-card"
            >
              <span className="text-lg md:text-xl">{origin.emoji}</span>
              <span className="text-sm font-semibold text-ink transition-colors group-hover:text-accent md:text-base">
                {origin.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
