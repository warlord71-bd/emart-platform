'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface Origins {
  code: string;
  name: string;
  slug: string;
}

/**
 * Main Navigation Component
 * Desktop: Horizontal menu with mega-menu for categories
 * Mobile: Hamburger drawer with accordion subcategories
 */
export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Origin countries
  const origins: Origins[] = [
    { code: '🇰🇷', name: 'Korea', slug: 'korean-beauty' },
    { code: '🇯🇵', name: 'Japan', slug: 'japanese-beauty' },
    { code: '🇬🇧', name: 'UK', slug: 'uk-beauty' },
    { code: '🇺🇸', name: 'USA', slug: 'usa-beauty' },
    { code: '🇫🇷', name: 'France', slug: 'france-beauty' },
    { code: '🇮🇳', name: 'India', slug: 'india-beauty' },
    { code: '🇧🇩', name: 'Bangladesh', slug: 'bangladesh-beauty' },
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

            {/* SKINCARE ESSENTIALS */}
            <Link
              href="/shop"
              className="text-xs font-medium text-gray-700 hover:text-pink-500 transition-colors py-2 flex-shrink-0"
            >
              💧 SKINCARE ESSENTIALS
            </Link>

            {/* SHOP BY CONCERN */}
            <Link
              href="/concerns"
              className="text-xs font-medium text-gray-700 hover:text-pink-500 transition-colors flex-shrink-0"
            >
              🎯 CONCERN
            </Link>

            {/* ORIGINS */}
            <Link
              href="/origins"
              className="text-xs font-medium text-gray-700 hover:text-pink-500 transition-colors flex items-center gap-1 flex-shrink-0"
            >
              <span>🌍 ORIGINS</span>
            </Link>

            {/* BRANDS */}
            <Link
              href="/brands"
              className="text-xs font-medium text-gray-700 hover:text-pink-500 transition-colors flex-shrink-0"
            >
              🏷️ BRANDS
            </Link>

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
                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded transition-colors"
                >
                  💧 SKINCARE ESSENTIALS
                </Link>

                {/* Divider */}
                <div className="border-t border-gray-200 my-2" />

                {/* SHOP BY CONCERN */}
                <Link
                  href="/concerns"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded transition-colors"
                >
                  🎯 SHOP BY CONCERN
                </Link>

                {/* ORIGINS */}
                <Link
                  href="/origins"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded transition-colors"
                >
                  🌍 ORIGINS
                </Link>

                {/* BRANDS */}
                <Link
                  href="/brands"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded transition-colors"
                >
                  🏷️ BRANDS
                </Link>

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
