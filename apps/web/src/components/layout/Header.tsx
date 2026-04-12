'use client';
// src/components/layout/Header.tsx
// Main header with logo, search, and action icons
// Navigation menu is handled separately in Navigation.tsx
// Announcement bar is handled separately in UtilityBar.tsx

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, User, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function Header() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-[52px] z-[90]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="http://5.189.188.229/wp-content/uploads/2026/03/logo.png"
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
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden sm:block">
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
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/account"
            className="p-2 text-gray-600 hover:text-[#e8197a] transition-colors flex items-center gap-1"
          >
            <User size={20} />
            <span className="text-xs font-medium hidden md:block">Account</span>
          </Link>

          <Link
            href="/wishlist"
            className="p-2 text-gray-600 hover:text-[#e8197a] transition-colors"
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
              <span className="absolute -top-1 -right-1 bg-[#e8197a] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
