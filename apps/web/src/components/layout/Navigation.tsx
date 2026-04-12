'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';

interface Origins {
  code: string;
  name: string;
  slug: string;
}

const SKINCARE_ESSENTIALS = [
  { name: 'Face Cleanser', slug: 'cleanser' },
  { name: 'Serum & Toner', slug: 'serum-toner' },
  { name: 'Moisturizer', slug: 'moisturizer' },
  { name: 'Sunscreen & SPF', slug: 'sunscreen' },
  { name: 'Face Care', slug: 'face-care' },
];

const SKIN_CONCERNS = [
  { name: 'Acne & Breakouts', slug: 'acne' },
  { name: 'Dry & Sensitive', slug: 'dry' },
  { name: 'Anti-Aging', slug: 'anti-aging' },
  { name: 'Dark Spots & Brightening', slug: 'dark-spots' },
  { name: 'Sensitivity', slug: 'sensitivity' },
];

const FEATURED_BRANDS = [
  { name: 'COSRX', slug: 'cosrx' },
  { name: 'ANUA', slug: 'anua' },
  { name: 'PURITO', slug: 'purito' },
  { name: 'SOME BY MI', slug: 'some-by-mi' },
];

/**
 * Main Navigation Component
 * Desktop: Horizontal menu with mega-menu for categories
 * Mobile: Hamburger drawer with accordion subcategories
 */
export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Origin countries
  const origins: Origins[] = [
    { code: '🇰🇷', name: 'Korea', slug: 'korea' },
    { code: '🇯🇵', name: 'Japan', slug: 'japan' },
    { code: '🇬🇧', name: 'UK', slug: 'uk' },
    { code: '🇺🇸', name: 'USA', slug: 'usa' },
    { code: '🇫🇷', name: 'France', slug: 'france' },
    { code: '🇮🇳', name: 'India', slug: 'india' },
    { code: '🇧🇩', name: 'Bangladesh', slug: 'bangladesh' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white border-b border-gray-100 sticky top-[52px] z-[90]">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-4 flex-wrap">
            {/* SHOP ALL Button */}
            <Link
              href="/shop"
              className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex-shrink-0"
            >
              🛍️ SHOP ALL
            </Link>

            {/* SKINCARE ESSENTIALS - Dropdown */}
            <div className="relative group">
              <button className="text-xs font-medium text-gray-700 hover:text-pink-500 transition-colors py-2 flex items-center gap-1 flex-shrink-0">
                💧 SKINCARE ESSENTIALS
                <ChevronDown size={14} />
              </button>
              <div className="absolute left-0 mt-0 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] z-50">
                {SKINCARE_ESSENTIALS.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/shop?category=${item.slug}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* SHOP BY CONCERN - Dropdown */}
            <div className="relative group">
              <button className="text-xs font-medium text-gray-700 hover:text-pink-500 transition-colors flex items-center gap-1 flex-shrink-0">
                🎯 CONCERN
                <ChevronDown size={14} />
              </button>
              <div className="absolute left-0 mt-0 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] z-50">
                {SKIN_CONCERNS.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/shop?concern=${item.slug}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* ORIGINS - Dropdown */}
            <div className="relative group">
              <button className="text-xs font-medium text-gray-700 hover:text-pink-500 transition-colors flex items-center gap-1 flex-shrink-0">
                🌍 ORIGINS
                <ChevronDown size={14} />
              </button>
              <div className="absolute left-0 mt-0 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] z-50">
                {origins.map((origin) => (
                  <Link
                    key={origin.slug}
                    href={`/shop?origin=${origin.slug}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    <span className="mr-2">{origin.code}</span>
                    {origin.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* BRANDS - Dropdown */}
            <div className="relative group">
              <button className="text-xs font-medium text-gray-700 hover:text-pink-500 transition-colors flex items-center gap-1 flex-shrink-0">
                🏷️ BRANDS
                <ChevronDown size={14} />
              </button>
              <div className="absolute left-0 mt-0 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] z-50">
                {FEATURED_BRANDS.map((brand) => (
                  <Link
                    key={brand.slug}
                    href={`/shop?brand=${brand.slug}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  >
                    {brand.name}
                  </Link>
                ))}
                <div className="border-t border-gray-200 my-2" />
                <Link
                  href="/brands"
                  className="block px-4 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50 transition-colors"
                >
                  View All Brands →
                </Link>
              </div>
            </div>

            {/* SALE - with badge */}
            <Link
              href="/sale"
              className="flex items-center gap-1 text-xs font-medium text-pink-600 hover:text-pink-700 transition-colors flex-shrink-0"
            >
              <span>🔥 SALE</span>
              <span className="bg-pink-100 text-pink-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                HOT
              </span>
            </Link>

            {/* NEW - with badge */}
            <Link
              href="/new-arrivals"
              className="flex items-center gap-1 text-xs font-medium text-gold-600 hover:text-gold-700 transition-colors flex-shrink-0"
            >
              <span>✨ NEW</span>
              <span className="bg-gold-100 text-gold-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                NEW
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Hamburger Menu Button */}
      <nav className="md:hidden bg-white border-b border-gray-100 sticky top-[52px] z-[90]">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-2 text-gray-700 font-medium"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            <span className="text-sm">Menu</span>
          </button>
        </div>

        {/* Mobile Drawer - slides in from left */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Drawer */}
            <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-lg overflow-y-auto z-50 pt-20">
              <div className="p-4 space-y-2">
                {/* SHOP ALL - Button */}
                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full bg-pink-500 hover:bg-pink-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors text-center mb-4"
                >
                  🛍️ SHOP ALL
                </Link>

                {/* SKINCARE ESSENTIALS */}
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'essentials' ? null : 'essentials')}
                  className="w-full text-left py-3 px-4 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded transition-colors flex items-center justify-between"
                >
                  💧 SKINCARE ESSENTIALS
                  <ChevronDown size={14} className={openDropdown === 'essentials' ? 'rotate-180' : ''} />
                </button>
                {openDropdown === 'essentials' && (
                  <div className="bg-gray-50 rounded py-2 pl-4">
                    {SKINCARE_ESSENTIALS.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/shop?category=${item.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 px-3 text-xs text-gray-600 hover:text-pink-600"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-gray-200 my-2" />

                {/* SHOP BY CONCERN */}
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'concern' ? null : 'concern')}
                  className="w-full text-left py-3 px-4 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded transition-colors flex items-center justify-between"
                >
                  🎯 SHOP BY CONCERN
                  <ChevronDown size={14} className={openDropdown === 'concern' ? 'rotate-180' : ''} />
                </button>
                {openDropdown === 'concern' && (
                  <div className="bg-gray-50 rounded py-2 pl-4">
                    {SKIN_CONCERNS.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/shop?concern=${item.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 px-3 text-xs text-gray-600 hover:text-pink-600"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* ORIGINS */}
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'origins' ? null : 'origins')}
                  className="w-full text-left py-3 px-4 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded transition-colors flex items-center justify-between"
                >
                  🌍 ORIGINS
                  <ChevronDown size={14} className={openDropdown === 'origins' ? 'rotate-180' : ''} />
                </button>
                {openDropdown === 'origins' && (
                  <div className="bg-gray-50 rounded py-2 pl-4">
                    {origins.map((origin) => (
                      <Link
                        key={origin.slug}
                        href={`/shop?origin=${origin.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 px-3 text-xs text-gray-600 hover:text-pink-600"
                      >
                        <span className="mr-2">{origin.code}</span>
                        {origin.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* BRANDS */}
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'brands' ? null : 'brands')}
                  className="w-full text-left py-3 px-4 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded transition-colors flex items-center justify-between"
                >
                  🏷️ BRANDS
                  <ChevronDown size={14} className={openDropdown === 'brands' ? 'rotate-180' : ''} />
                </button>
                {openDropdown === 'brands' && (
                  <div className="bg-gray-50 rounded py-2 pl-4">
                    {FEATURED_BRANDS.map((brand) => (
                      <Link
                        key={brand.slug}
                        href={`/shop?brand=${brand.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 px-3 text-xs text-gray-600 hover:text-pink-600"
                      >
                        {brand.name}
                      </Link>
                    ))}
                    <Link
                      href="/brands"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 text-xs font-semibold text-pink-600 hover:text-pink-700"
                    >
                      View All Brands →
                    </Link>
                  </div>
                )}

                {/* SALE */}
                <Link
                  href="/sale"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-sm font-medium text-pink-600 hover:bg-pink-50 rounded transition-colors font-semibold"
                >
                  🔥 SALE (Hot Deals)
                </Link>

                {/* NEW */}
                <Link
                  href="/new-arrivals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-sm font-medium text-gold-600 hover:bg-gold-50 rounded transition-colors font-semibold"
                >
                  ✨ NEW ARRIVALS
                </Link>

                {/* Divider */}
                <div className="border-t border-gray-200 my-2" />

                {/* ACCOUNT */}
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded transition-colors"
                >
                  👤 MY ACCOUNT
                </Link>
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  );
}
