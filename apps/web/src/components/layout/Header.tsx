'use client';
// src/components/layout/Header.tsx

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, User, Menu, X, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

const NAV_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Face Care', href: '/category/face-care' },
  { label: 'Sunscreen', href: '/category/sunscreen' },
  { label: 'Serum & Toner', href: '/category/serum-toner' },
  { label: 'Sale 🔥', href: '/sale', className: 'text-[#e8197a]' },
  { label: 'New ✨', href: '/new-arrivals', className: 'text-[#e8197a]' },
];

export default function Header() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <>
      {/* ── Announcement Bar ── */}
      <div className="bg-[#1a1a2e] text-gray-300 text-xs py-2 px-4 text-center">
        🚚 Free Delivery above <strong className="text-white">৳3,000</strong>
        &nbsp;|&nbsp;
        <span className="bg-[#e8197a] text-white px-2 py-0.5 rounded-full text-xs">✓ 100% Authentic</span>
        &nbsp;|&nbsp;
        COD Nationwide
        &nbsp;|&nbsp;
        <Link href="/track-order" className="hover:text-[#e8197a]">📦 Track Order</Link>
      </div>

      {/* ── Main Header ── */}
      <header
        className={`sticky top-0 z-50 bg-white border-b border-gray-100
          ${scrolled ? 'shadow-md' : 'shadow-sm'} transition-shadow duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="Emart Skincare Bangladesh"
                width={44}
                height={44}
                className="rounded-xl"
                priority
              />
              <div className="hidden sm:block">
                <div className="font-extrabold text-[#1a1a2e] text-base leading-tight">
                  Emart Skincare
                </div>
                <div className="text-[#e8197a] text-[10px] font-bold tracking-widest uppercase">
                  Bangladesh
                </div>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products... e.g COSRX, Sunscreen"
                  className="w-full border border-gray-200 rounded-full py-2.5 pl-4 pr-12
                             text-sm focus:outline-none focus:border-[#e8197a]
                             focus:ring-2 focus:ring-[#e8197a]/20 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2
                             bg-[#e8197a] text-white p-2 rounded-full
                             hover:bg-[#c01264] transition-colors"
                >
                  <Search size={16} />
                </button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="p-2 text-gray-600 hover:text-[#e8197a] transition-colors
                           hidden sm:flex items-center gap-1"
              >
                <User size={20} />
                <span className="text-xs font-medium hidden md:block">Account</span>
              </Link>

              <Link
                href="/wishlist"
                className="p-2 text-gray-600 hover:text-[#e8197a] transition-colors hidden sm:block"
              >
                <Heart size={20} />
              </Link>

              {/* Cart Button */}
              <button
                onClick={toggleCart}
                className="relative p-2 text-gray-600 hover:text-[#e8197a] transition-colors"
              >
                <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#e8197a] text-white
                                   text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 text-gray-600 lg:hidden"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* ── Desktop Nav ── */}
          <nav className="hidden lg:flex items-center gap-6 py-2 border-t border-gray-50">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium text-gray-600 hover:text-[#e8197a]
                           transition-colors ${link.className || ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`py-3 px-4 text-sm font-medium text-gray-700
                             hover:bg-[#fce7f0] hover:text-[#e8197a] rounded-lg
                             transition-colors ${link.className || ''}`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="py-3 px-4 text-sm font-medium text-gray-700
                           hover:bg-[#fce7f0] hover:text-[#e8197a] rounded-lg"
              >
                👤 My Account
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
                      flex items-center justify-around py-2 z-50 lg:hidden">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-[#e8197a]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="text-[10px]">Home</span>
        </Link>
        <Link href="/shop" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-[#e8197a]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span className="text-[10px]">Shop</span>
        </Link>
        <button
          onClick={toggleCart}
          className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-[#e8197a] relative"
        >
          <ShoppingCart size={22} />
          {totalItems > 0 && (
            <span className="absolute -top-1 right-0 bg-[#e8197a] text-white
                             text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
          <span className="text-[10px]">Cart</span>
        </button>
        <Link href="/wishlist" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-[#e8197a]">
          <Heart size={22} />
          <span className="text-[10px]">Wishlist</span>
        </Link>
        <Link href="/account" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-[#e8197a]">
          <User size={22} />
          <span className="text-[10px]">Account</span>
        </Link>
      </nav>
    </>
  );
}
