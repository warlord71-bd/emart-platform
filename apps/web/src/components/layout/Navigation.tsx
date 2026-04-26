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

  const desktopLinkClass =
    'flex-shrink-0 py-2 text-xs font-medium text-ink transition-colors hover:text-accent';
  const mobileLinkClass =
    'block rounded-xl px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent-soft hover:text-accent';

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
      <nav className="sticky top-[52px] z-[90] hidden border-b border-hairline bg-white/95 backdrop-blur md:block">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="flex flex-wrap items-center gap-4">
            {/* SHOP ALL Button */}
            <Link
              href="/shop"
              className="flex-shrink-0 whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-black"
            >
              🛍️ SHOP ALL
            </Link>

            {/* SKINCARE ESSENTIALS */}
            <Link
              href="/shop"
              className={desktopLinkClass}
            >
              💧 SKINCARE ESSENTIALS
            </Link>

            {/* SHOP BY CONCERN */}
            <Link
              href="/concerns"
              className={desktopLinkClass}
            >
              🎯 CONCERN
            </Link>

            {/* ORIGINS */}
            <Link
              href="/origins"
              className={`${desktopLinkClass} flex items-center gap-1`}
            >
              <span>🌍 ORIGINS</span>
            </Link>

            {/* BRANDS */}
            <Link
              href="/brands"
              className={desktopLinkClass}
            >
              🏷️ BRANDS
            </Link>

            {/* SALE - with badge */}
            <Link
              href="/sale"
              className="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-deep"
            >
              <span>🔥 SALE</span>
              <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
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
      <nav className="sticky top-[52px] z-[90] border-b border-hairline bg-white/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-2 font-medium text-ink"
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
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Drawer */}
            <div className="fixed bottom-0 left-0 top-0 z-50 w-80 overflow-y-auto border-r border-hairline bg-bg shadow-pop pt-20">
              <div className="space-y-2 p-4">
                {/* SHOP ALL - Button */}
                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-4 block w-full rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-black"
                >
                  🛍️ SHOP ALL
                </Link>

                {/* SKINCARE ESSENTIALS */}
                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass}
                >
                  💧 SKINCARE ESSENTIALS
                </Link>

                {/* Divider */}
                <div className="my-2 border-t border-hairline" />

                {/* SHOP BY CONCERN */}
                <Link
                  href="/concerns"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass}
                >
                  🎯 SHOP BY CONCERN
                </Link>

                {/* ORIGINS */}
                <Link
                  href="/origins"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass}
                >
                  🌍 ORIGINS
                </Link>

                {/* BRANDS */}
                <Link
                  href="/brands"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass}
                >
                  🏷️ BRANDS
                </Link>

                {/* SALE */}
                <Link
                  href="/sale"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft hover:text-accent-deep"
                >
                  🔥 SALE (Hot Deals)
                </Link>

                {/* NEW */}
                <Link
                  href="/new-arrivals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-brass transition-colors hover:bg-brass-soft"
                >
                  ✨ NEW ARRIVALS
                </Link>

                {/* Divider */}
                <div className="my-2 border-t border-hairline" />

                {/* ACCOUNT */}
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass}
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
