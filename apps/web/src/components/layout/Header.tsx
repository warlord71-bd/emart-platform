'use client';
// src/components/layout/Header.tsx

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Camera,
  ChevronDown,
  Flame,
  Heart,
  Menu,
  Mic,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tags,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { DRAWER_NAV_GROUPS, UNIFIED_BROWSE_TREE } from '@/lib/category-navigation';
import type { WooCategory, WooImage } from '@/lib/woocommerce';

interface SearchSuggestion {
  id: number;
  name: string;
  slug: string;
  price: string;
  sale_price: string;
  images: WooImage[];
  categories: WooCategory[];
}

interface SearchScope {
  value: string;
  label: string;
  href: string;
  queryPrefix?: string;
}

interface MenuItem {
  label: string;
  href: string;
}

const SEARCH_SCOPES: SearchScope[] = [
  { value: 'all', label: 'All', href: '/shop' },
  { value: 'skincare', label: 'Skincare', href: '/categories', queryPrefix: 'skincare' },
  { value: 'makeup', label: 'Makeup', href: '/category/makeup-cosmetics', queryPrefix: 'makeup' },
  { value: 'hair-scalp', label: 'Hair & Scalp', href: '/category/hair-care', queryPrefix: 'hair care' },
  { value: 'body-bath', label: 'Body & Bath', href: '/category/body-wash', queryPrefix: 'body care' },
];

const POPULAR_SEARCHES = [
  'COSRX sunscreen',
  'Anua toner',
  'Snail mucin',
  'Japanese sunscreen',
  'Cerave cleanser',
];

const DRAWER_LINKS: MenuItem[] = [
  { label: 'Brands', href: '/brands' },
  { label: 'Sale', href: '/sale' },
  { label: 'New', href: '/new-arrivals' },
];

const formatPrice = (value: string | number) => {
  const amount = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(amount) ? `৳${Math.round(amount).toLocaleString('en-BD')}` : '৳0';
};

const getScopedSearchTerm = (query: string, scope: SearchScope) => {
  if (!scope.queryPrefix) return query;
  return `${scope.queryPrefix} ${query}`;
};

function CountBadge({ value }: { value: number }) {
  if (value <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
      {value > 99 ? '99+' : value}
    </span>
  );
}

function UtilityIcon({
  href,
  label,
  icon: Icon,
  count = 0,
  children,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-accent"
      aria-label={label}
    >
      <Icon size={20} />
      <span className="hidden xl:inline">{children || label}</span>
      <CountBadge value={count} />
    </Link>
  );
}

function AccountDropdown() {
  const accountLinks: MenuItem[] = [
    { label: 'Profile', href: '/account' },
    { label: 'Orders', href: '/account/orders' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'Track order', href: '/track-order' },
  ];

  return (
    <div className="group relative">
      <Link
        href="/account"
        className="relative inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-accent focus:bg-accent-soft focus:text-accent"
        aria-haspopup="menu"
      >
        <User size={20} />
        <span className="hidden xl:inline">Account</span>
        <ChevronDown size={14} className="hidden transition-transform group-hover:rotate-180 xl:block" />
      </Link>

      <div
        className="invisible absolute right-0 top-full z-[80] mt-2 w-52 translate-y-1 rounded-lg border border-hairline bg-white p-2 opacity-0 shadow-card transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
        role="menu"
      >
        {accountLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-accent focus:bg-accent-soft focus:text-accent"
            role="menuitem"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [searchScope, setSearchScope] = useState(SEARCH_SCOPES[0].value);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchSuggestion[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDrawerGroups, setOpenDrawerGroups] = useState<string[]>(['SHOP BY CATEGORY']);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const cartItems = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems());
  const cartSubtotal = useCartStore((s) => s.totalPrice());
  const toggleCart = useCartStore((s) => s.toggleCart);

  const selectedScope = SEARCH_SCOPES.find((scope) => scope.value === searchScope) || SEARCH_SCOPES[0];
  const trimmedSearch = search.trim();
  const showSearchPanel = searchFocused && (trimmedSearch.length < 2 || searchLoading || searchResults.length > 0);
  const cartPreviewItems = cartItems.slice(-3).reverse();
  const isCategoriesRoute = pathname === '/categories';
  const toggleDrawerGroup = (label: string) => {
    setOpenDrawerGroups((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    );
  };

  useEffect(() => {
    const readWishlist = () => {
      try {
        const items = JSON.parse(window.localStorage.getItem('wishlist') || '[]');
        setWishlistCount(Array.isArray(items) ? items.length : 0);
      } catch {
        setWishlistCount(0);
      }
    };

    const readRecentSearches = () => {
      try {
        const items = JSON.parse(window.localStorage.getItem('emart-recent-searches') || '[]');
        setRecentSearches(Array.isArray(items) ? items.slice(0, 5) : []);
      } catch {
        setRecentSearches([]);
      }
    };

    readWishlist();
    readRecentSearches();
    const savedLanguage = window.localStorage.getItem('emart-language');
    if (savedLanguage === 'bn' || savedLanguage === 'en') {
      setLanguage(savedLanguage);
    }
    window.addEventListener('storage', readWishlist);
    return () => window.removeEventListener('storage', readWishlist);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'bn' ? 'bn-BD' : 'en';
    window.localStorage.setItem('emart-language', language);
  }, [language]);

  useEffect(() => {
    if (trimmedSearch.length < 2) {
      setSearchResults([]);
      setSearchTotal(0);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedSearch)}&limit=6`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        setSearchResults(Array.isArray(data.products) ? data.products : []);
        setSearchTotal(Number(data.total || 0));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Search suggestions failed:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmedSearch]);

  const rememberSearch = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;

    const next = [cleaned, ...recentSearches.filter((item) => item.toLowerCase() !== cleaned.toLowerCase())].slice(0, 5);
    setRecentSearches(next);
    window.localStorage.setItem('emart-recent-searches', JSON.stringify(next));
  };

  const closeSearchPanel = () => {
    setSearchFocused(false);
    setSearchResults([]);
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!trimmedSearch) {
      router.push(selectedScope.href);
      closeSearchPanel();
      return;
    }

    const scopedTerm = getScopedSearchTerm(trimmedSearch, selectedScope);
    rememberSearch(scopedTerm);
    const params = new URLSearchParams({ q: scopedTerm });
    router.push(`/search?${params.toString()}`);
    setSearch('');
    closeSearchPanel();
  };

  const selectQuickSearch = (term: string) => {
    setSearch(term);
    rememberSearch(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
    closeSearchPanel();
  };

  const startVoiceSearch = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSearchFocused(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setSearch(transcript);
        setSearchFocused(true);
      }
    };
    recognition.start();
  };

  const openVisualSearch = () => {
    imageInputRef.current?.click();
  };

  const handleVisualImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSearchFocused(true);
    }
    event.target.value = '';
  };

  const renderSearchForm = (variant: 'desktop' | 'mobile') => (
    <form
      onSubmit={handleSearch}
      className={variant === 'desktop' ? 'relative min-w-0 flex-1' : 'relative w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)]'}
      style={variant === 'mobile' ? { width: 'calc(100vw - 24px)', maxWidth: 'calc(100vw - 24px)' } : undefined}
    >
      <div className={`flex h-11 min-w-0 items-center overflow-hidden rounded-lg border border-hairline bg-white shadow-card transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 ${
        variant === 'desktop' ? 'h-12' : ''
      }`}>
        {variant === 'desktop' && (
          <select
            value={searchScope}
            onChange={(event) => setSearchScope(event.target.value)}
            className="h-full w-[118px] shrink-0 border-r border-hairline bg-bg-alt px-3 text-sm font-semibold text-ink outline-none"
            aria-label="Search category"
          >
            {SEARCH_SCOPES.map((scope) => (
              <option key={scope.value} value={scope.value}>
                {scope.label}
              </option>
            ))}
          </select>
        )}
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
          placeholder={variant === 'desktop' ? 'Search 3,500+ authentic products...' : 'Search products, brands...'}
          className="h-full w-0 min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted-2 sm:px-4"
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={startVoiceSearch}
          className={`flex h-full w-10 shrink-0 items-center justify-center text-muted transition-colors hover:text-accent ${
            isListening ? 'text-accent' : ''
          }`}
          aria-label="Voice search"
          title="Voice search"
        >
          <Mic size={18} />
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={openVisualSearch}
          className="flex h-full w-10 shrink-0 items-center justify-center text-muted transition-colors hover:text-accent"
          aria-label="Visual search"
          title="Visual search"
        >
          <Camera size={18} />
        </button>
        <button
          type="submit"
          className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-white transition-colors hover:bg-black"
          aria-label="Search"
        >
          <Search size={17} />
        </button>
      </div>

      {showSearchPanel && (
        <div className="absolute left-0 right-0 top-full z-[90] mt-2 overflow-hidden rounded-lg border border-hairline bg-white text-left shadow-card">
          {trimmedSearch.length < 2 ? (
            <div className="p-4">
              <div className="text-xs font-bold uppercase tracking-normal text-gray-400">Popular searches</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectQuickSearch(term)}
                    className="rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
                  >
                    {term}
                  </button>
                ))}
              </div>
              {recentSearches.length > 0 && (
                <>
                  <div className="mt-4 text-xs font-bold uppercase tracking-normal text-gray-400">Recent</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectQuickSearch(term)}
                        className="rounded-full bg-bg-alt px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : searchLoading ? (
            <div className="px-4 py-4 text-sm text-gray-500">Searching...</div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="max-h-[360px] overflow-y-auto py-1">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.slug}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      rememberSearch(trimmedSearch);
                      setSearch('');
                      closeSearchPanel();
                    }}
                    className="flex min-w-0 items-center gap-3 px-3 py-2.5 hover:bg-accent-soft"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-bg-alt">
                      <Image
                        src={product.images[0]?.src || '/logo.png'}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                        {product.name}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="font-bold text-accent">
                          {formatPrice(product.sale_price || product.price)}
                        </span>
                        {product.categories[0] && (
                          <span className="min-w-0 truncate text-gray-400">
                            {product.categories[0].name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <button
                type="submit"
                onMouseDown={(event) => event.preventDefault()}
                className="flex w-full items-center justify-center gap-2 border-t border-hairline bg-accent-soft px-4 py-3 text-sm font-bold text-accent"
              >
                See all {searchTotal || ''} results
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            </>
          ) : (
            <div className="px-4 py-4 text-sm text-gray-500">
              No quick matches. Press search to view all results.
            </div>
          )}
        </div>
      )}
    </form>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-screen max-w-[100vw] overflow-x-clip border-b border-hairline bg-white shadow-card lg:w-full lg:max-w-full">
        <div className="h-7 overflow-hidden bg-ink text-[11px] font-semibold text-white lg:h-8">
          <div className="lg:hidden">
            <div className="announcement-marquee h-7" aria-label="Store announcements">
              <div className="announcement-marquee__track h-7">
                {[0, 1].map((item) => (
                  <div key={item} className="announcement-marquee__group h-7">
                    <span className="font-bengali">ফ্রি ডেলিভারি ৳3,000+</span>
                    <span className="text-white/35">·</span>
                    <span>COD</span>
                    <span className="text-white/35">·</span>
                    <span className="font-bengali">ঢাকায় পরের দিন</span>
                    <span className="text-white/35">·</span>
                    <span className="font-bengali">১০০% অথেনটিক</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto hidden h-8 max-w-7xl grid-cols-[minmax(0,1fr)_minmax(260px,1.15fr)_minmax(0,1fr)] items-center gap-4 px-4 lg:grid">
            <div className="truncate">
              {isCategoriesRoute ? 'Free delivery ৳1,500+' : 'Free delivery ৳3,000+'} · <span className="font-bengali">ফ্রি ডেলিভারি</span>
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="announcement-marquee" aria-label="Store announcements">
                <div className="announcement-marquee__track">
                  {[0, 1].map((item) => (
                    <div key={item} className="announcement-marquee__group">
                      <span className="font-bengali">১০০% অথেনটিক · ৪০+ গ্লোবাল ব্র্যান্ড · COD</span>
                      <span className="text-white/35">·</span>
                      <span>Dhaka next-day delivery · 1-2 days</span>
                      <span className="text-white/35">·</span>
                      <span>COD accepted · 64 districts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 text-right">
              <Link href="/track-order" className="transition-colors hover:text-accent-soft">Track order</Link>
              <span className="text-white/35">·</span>
              {isCategoriesRoute ? (
                <Link href="/faq" className="transition-colors hover:text-accent-soft">Help</Link>
              ) : (
                <a href="tel:+8809696682135" className="transition-colors hover:text-accent-soft">+88 09696682135</a>
              )}
              <span className="text-white/35">·</span>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={language === 'en' ? 'text-white' : 'text-white/60 hover:text-white'}
                >
                  EN
                </button>
                <span className="text-white/35">|</span>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={language === 'bn' ? 'text-white' : 'text-white/60 hover:text-white'}
                >
                  বাং
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="grid h-14 grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 px-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-accent-soft hover:text-accent"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>

            <Link href="/" className="mx-auto flex min-w-0 items-center justify-center gap-2">
              <Image src="/logo.png" alt="Emart" width={34} height={34} className="h-8 w-8 rounded-lg" priority />
              <span className="truncate text-base font-extrabold leading-none text-ink">Emart</span>
            </Link>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={toggleCart}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-accent-soft hover:text-accent"
                aria-label="Open cart"
              >
                <ShoppingCart size={22} />
                <CountBadge value={totalItems} />
              </button>
            </div>
          </div>

          <div className="overflow-visible px-3 pb-2">
            {renderSearchForm('mobile')}
          </div>

        </div>

        <div className="mx-auto hidden max-w-7xl px-4 lg:block">
          <div className="flex h-[72px] min-w-0 items-center gap-5">
            <Link href="/" className="flex w-[245px] shrink-0 items-center gap-3">
              <Image
                src="/logo.png"
                alt="Emart Skincare Bangladesh"
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl"
                priority
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-lg font-extrabold leading-tight text-ink">Emart</span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                    <BadgeCheck size={12} />
                    Authentic Only
                  </span>
                </div>
                <div className="truncate text-[11px] font-bold uppercase tracking-normal text-accent">
                  Emart Skincare Bangladesh
                </div>
              </div>
            </Link>

            {renderSearchForm('desktop')}

            <div className="flex shrink-0 items-center justify-end gap-1">
              <AccountDropdown />
              <UtilityIcon href="/wishlist" label="Wishlist" icon={Heart} count={wishlistCount}>Wishlist</UtilityIcon>

              <div className="group relative">
                <button
                  type="button"
                  onClick={toggleCart}
                  className="relative inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                  aria-label="Open cart"
                >
                  <ShoppingCart size={20} />
                  <span className="hidden xl:inline">Cart</span>
                  <CountBadge value={totalItems} />
                </button>

                <div className="invisible absolute right-0 top-full z-[80] mt-2 w-80 translate-y-1 rounded-lg border border-hairline bg-white p-4 text-left opacity-0 shadow-card transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-extrabold text-ink">Cart preview</div>
                    <div className="text-xs font-semibold text-gray-400">{totalItems} items</div>
                  </div>
                  {cartPreviewItems.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {cartPreviewItems.map((item) => (
                          <Link key={item.id} href={`/shop/${item.slug}`} className="flex min-w-0 gap-3 rounded-lg p-1.5 hover:bg-accent-soft">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-bg-alt">
                              <Image src={item.image || '/logo.png'} alt={item.name} fill sizes="48px" className="object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="line-clamp-2 text-xs font-bold leading-snug text-ink">{item.name}</div>
                              <div className="mt-1 text-xs text-gray-500">
                                {item.quantity} × {formatPrice(item.price)}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-sm">
                        <span className="font-semibold text-gray-500">Subtotal</span>
                        <span className="font-extrabold text-accent">{formatPrice(cartSubtotal)}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={toggleCart}
                          className="rounded-lg border border-hairline px-3 py-2 text-xs font-bold text-ink hover:border-accent/40 hover:bg-bg-alt"
                        >
                          View cart
                        </button>
                        <Link href="/checkout" className="rounded-lg bg-ink px-3 py-2 text-center text-xs font-bold text-white hover:bg-black">
                          Checkout
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg bg-bg-alt px-4 py-5 text-center text-sm text-muted">
                      Your cart is empty.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          <nav className="flex h-12 items-center gap-1 border-t border-hairline bg-bg-alt" aria-label="Primary navigation">
              {UNIFIED_BROWSE_TREE.map((group) => (
                <div key={group.label} className="group relative h-full">
                  <button
                    type="button"
                    className="flex h-full items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-extrabold text-ink transition-colors hover:bg-white hover:text-accent"
                  >
                    <span className={group.tone}>●</span>
                    {group.label}
                    <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
                  </button>
                  <div className={`invisible absolute left-0 top-full z-[70] max-w-[calc(100vw-2rem)] translate-y-1 rounded-lg border border-hairline bg-white p-4 opacity-0 shadow-card transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 ${group.panelClassName}`}>
                    <div
                      className="grid gap-4"
                      style={{ gridTemplateColumns: `repeat(${group.sections.length}, minmax(0, 1fr))` }}
                    >
                      {group.sections.map((section) => (
                        <div key={section.title} className="min-w-0">
                          <div className="mb-2 text-[11px] font-bold uppercase tracking-normal text-gray-400">
                            {section.title}
                          </div>
                          <div className="space-y-1">
                            {section.items.map((item) => (
                              <Link
                                key={item.href || item.slug}
                                href={item.href || `/category/${item.slug}`}
                                className="block rounded-lg px-3 py-2 text-[13px] font-semibold leading-snug text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <Link href="/brands" className="flex h-full items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-extrabold text-ink hover:bg-white hover:text-accent">
                <Tags size={15} className="text-brass" />
                BRANDS
              </Link>

              <Link href="/sale" className="ml-auto flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-accent-soft px-3 text-sm font-extrabold text-accent hover:bg-accent-soft/80">
                <Flame size={15} />
                SALE
              </Link>
              <Link href="/new-arrivals" className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-brass-soft px-3 text-sm font-extrabold text-ink hover:bg-bg-alt">
                <Sparkles size={15} />
                NEW ARRIVALS
              </Link>
          </nav>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-[84vw] max-w-[320px] bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-hairline pb-2">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="Emart" width={24} height={24} className="rounded-md" />
                <div className="font-extrabold text-ink">Emart</div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pb-28">
              {DRAWER_NAV_GROUPS.map((group) => {
                const isOpen = openDrawerGroups.includes(group.label);
                return (
                  <div key={group.label} className="rounded-lg border border-hairline bg-white">
                    <button
                      type="button"
                      onClick={() => toggleDrawerGroup(group.label)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-extrabold text-ink"
                      aria-expanded={isOpen}
                    >
                      <span>{group.label}</span>
                      <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="border-t border-hairline px-3 py-3">
                        {group.sections.map((section) => (
                          <div key={section.title} className="mb-3 last:mb-0">
                            <div className="mb-1 px-1 text-[11px] font-bold uppercase tracking-normal text-gray-400">
                              {section.title}
                            </div>
                            <div className="grid gap-1">
                              {section.items.map((item) => (
                                <Link
                                  key={item.href || item.slug}
                                  href={item.href || `/category/${item.slug}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-accent-soft hover:text-accent"
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="grid gap-2 border-t border-hairline pt-3">
                {DRAWER_LINKS.filter((item) => ['Brands', 'Sale', 'New'].includes(item.label)).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-hairline px-4 py-3 text-sm font-bold text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/track-order"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-bg-alt px-3 py-3 text-center text-xs font-bold text-ink"
              >
                Track order
              </Link>
              <a
                href="https://wa.me/8801717082135"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[#25D366] px-3 py-3 text-center text-xs font-extrabold text-white"
              >
                WhatsApp
              </a>
            </div>
          </aside>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid h-16 w-full max-w-full grid-cols-[repeat(5,minmax(0,1fr))] items-stretch border-t border-hairline bg-white/95 shadow-[0_-8px_24px_rgba(17,17,17,0.08)] backdrop-blur lg:hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'max(0.25rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.25rem, env(safe-area-inset-right))',
        }}
      >
        <Link href="/" className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-muted hover:text-accent">
          <span className="text-lg leading-none">⌂</span>
          <span className="max-w-full truncate text-[10px] font-medium leading-4">Home</span>
        </Link>
        <Link href="/shop" className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-muted hover:text-accent">
          <ShoppingBag size={20} />
          <span className="max-w-full truncate text-[10px] font-medium leading-4">Shop</span>
        </Link>
        <Link href="/categories" className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-muted hover:text-accent">
          <Sparkles size={20} />
          <span className="max-w-full truncate text-[10px] font-medium leading-4">Browse</span>
        </Link>
        <Link
          href="/wishlist"
          className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-muted hover:text-accent"
          aria-label="Wishlist"
        >
          <Heart size={20} />
          <span className="max-w-full truncate text-[10px] font-medium leading-4">Wishlist</span>
        </Link>
        <button
          type="button"
          onClick={toggleCart}
          className="relative flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-muted hover:text-accent"
          aria-label="Open cart"
        >
          <ShoppingCart size={20} />
          <CountBadge value={totalItems} />
          <span className="max-w-full truncate text-[10px] font-medium leading-4">Cart</span>
        </button>
        <Link href="/account" className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-muted hover:text-accent">
          <User size={20} />
          <span className="max-w-full truncate text-[10px] font-medium leading-4">Account</span>
        </Link>
      </nav>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleVisualImage}
        aria-hidden="true"
      />
    </>
  );
}
