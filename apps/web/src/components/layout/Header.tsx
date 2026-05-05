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
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { DRAWER_NAV_GROUPS, UNIFIED_BROWSE_TREE, type NavigationGroup, type NavigationSection } from '@/lib/category-navigation';
import { formatBDT } from '@/lib/formatters';
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

const formatPrice = (value: string | number) => {
  return formatBDT(value);
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

function getMegaPanelClass(label: string) {
  if (label === 'Categories') {
    return 'w-[960px] max-w-[calc(100vw-7rem)]';
  }
  if (label === 'Concerns') {
    return 'w-[560px] max-w-[calc(100vw-7rem)]';
  }
  if (label === 'Origins') {
    return 'w-[780px] max-w-[calc(100vw-7rem)]';
  }
  if (label === 'Brands') {
    return 'w-[560px] max-w-[calc(100vw-7rem)]';
  }
  return 'w-[520px] max-w-[calc(100vw-7rem)]';
}

function getMegaGridClass(label: string) {
  if (label === 'Categories') {
    return 'grid grid-cols-3 gap-x-8 gap-y-6';
  }
  if (label === 'Origins') {
    return 'grid grid-cols-4 gap-x-6 gap-y-5';
  }
  if (label === 'Brands') {
    return 'grid grid-cols-2 gap-x-6 gap-y-5';
  }
  return 'grid grid-cols-2 gap-x-6 gap-y-5';
}

const DRAWER_VISIBLE_LIMIT: Record<string, number> = {
  Categories: 8,
  Concerns: 8,
  Origins: 8,
  Brands: 8,
};

function getGroupItemCount(group: NavigationGroup) {
  return group.sections.reduce((sum, section) => sum + section.items.length, 0);
}

function getVisibleDrawerSections(group: NavigationGroup, expanded: boolean): NavigationSection[] {
  if (expanded) return group.sections;
  let remaining = DRAWER_VISIBLE_LIMIT[group.label] || 8;
  const visible: NavigationSection[] = [];

  group.sections.forEach((section) => {
    if (remaining <= 0) return;
    const items = section.items.slice(0, remaining);
    remaining -= items.length;
    if (items.length) visible.push({ ...section, items });
  });

  return visible;
}

function isGroupActive(pathname: string, group: NavigationGroup) {
  return pathname === group.href || pathname.startsWith(`${group.href}/`);
}

const TONE_BORDER_COLOR: Record<string, string> = {
  'text-accent': '#e8197a',
  'text-warning': '#d97706',
  'text-brass': '#b8860b',
  'text-cyan-600': '#0891b2',
};

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
  const [openDrawerGroups, setOpenDrawerGroups] = useState<string[]>(['Categories']);
  const [expandedDrawerGroups, setExpandedDrawerGroups] = useState<string[]>([]);
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
  const toggleDrawerExpanded = (label: string) => {
    setExpandedDrawerGroups((current) =>
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
          id="header-search"
          name="q"
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
                  <div key={item} aria-hidden={item === 1 ? true : undefined} className="announcement-marquee__group h-7">
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
                    <div key={item} aria-hidden={item === 1 ? true : undefined} className="announcement-marquee__group">
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
              <Link href="/shop" className="flex h-full items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-extrabold text-ink hover:bg-white hover:text-accent">
                <ShoppingBag size={15} className="text-accent" />
                Shop
              </Link>

              {UNIFIED_BROWSE_TREE.map((group) => {
                const active = isGroupActive(pathname, group);
                return (
                <div key={group.label} className="group relative h-full">
                  <Link
                    href={group.href}
                    className={`flex h-full items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-extrabold transition-colors hover:bg-white hover:text-accent focus:bg-white focus:text-accent ${active ? 'bg-white text-accent shadow-sm' : 'text-ink'}`}
                  >
                    <span className={group.tone}>●</span>
                    {group.label}
                    <ChevronDown size={14} className="transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
                  </Link>
                  <div className={`invisible absolute left-0 top-full z-[70] translate-y-1 rounded-lg border border-hairline bg-white p-4 opacity-0 shadow-card transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 ${getMegaPanelClass(group.label)}`}>
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-hairline pb-3">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-extrabold uppercase tracking-normal text-ink">{group.label}</div>
                        {group.summary ? <div className="mt-0.5 truncate text-xs text-muted">{group.summary}</div> : null}
                      </div>
                      <Link href={group.href} className="shrink-0 rounded-lg bg-ink px-3 py-2 text-xs font-extrabold text-white transition-colors hover:bg-black">
                        {group.ctaLabel || 'View All →'}
                      </Link>
                    </div>
                    <div className={getMegaGridClass(group.label)}>
                      {group.sections.map((section) => (
                        <div key={`${group.label}-${section.title || section.items[0]?.slug}`} className="min-w-0">
                          {section.title ? (
                            <div className="mb-2 text-[11px] font-bold uppercase tracking-normal text-gray-400">
                              {section.title}
                            </div>
                          ) : null}
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
                );
              })}
              <Link href="/search?q=mens+care" className="flex h-full items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-extrabold text-ink hover:bg-white hover:text-accent">
                <span className="text-cyan-600">●</span>
                MEN&apos;S
              </Link>

              <Link href="/sale" className="ml-auto flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-accent-soft px-3 text-sm font-extrabold text-accent hover:bg-accent-soft/80">
                <Flame size={15} />
                Sale
              </Link>
              <Link href="/new-arrivals" className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-brass-soft px-3 text-sm font-extrabold text-ink hover:bg-bg-alt">
                <Sparkles size={15} />
                New Arrivals
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
          <aside className="relative flex h-dvh w-[92vw] max-w-[360px] flex-col bg-white shadow-2xl">
            <div className="shrink-0 px-4 pt-4">
              <div className="flex items-center justify-between border-b border-hairline pb-2">
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
            </div>

            <div className="shrink-0 px-4 pt-3">
              <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Quick shopping links">
                <Link
                  href="/sale"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hairline bg-accent-soft px-3 py-1.5 text-xs font-extrabold text-accent transition-colors hover:bg-accent hover:text-white active:scale-95"
                >
                  <Flame size={13} />
                  Sale
                </Link>
                <Link
                  href="/new-arrivals"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hairline bg-brass-soft px-3 py-1.5 text-xs font-extrabold text-ink transition-colors hover:bg-brass hover:text-white active:scale-95"
                >
                  <Sparkles size={13} />
                  New Arrivals
                </Link>
                <Link
                  href="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hairline bg-ink px-3 py-1.5 text-xs font-extrabold text-white transition-colors hover:bg-black active:scale-95"
                >
                  <ShoppingBag size={13} />
                  Shop
                </Link>
                <Link
                  href="/search?q=mens+care"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-hairline bg-cyan-50 px-3 py-1.5 text-xs font-extrabold text-cyan-700 transition-colors hover:bg-cyan-600 hover:text-white active:scale-95"
                >
                  MEN'S
                </Link>
              </div>
              <div className="border-t border-hairline" />
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 overscroll-contain">
              {DRAWER_NAV_GROUPS.map((group) => {
                const isOpen = openDrawerGroups.includes(group.label);
                const isExpanded = expandedDrawerGroups.includes(group.label);
                const visibleSections = getVisibleDrawerSections(group, isExpanded);
                const visibleCount = visibleSections.reduce((sum, section) => sum + section.items.length, 0);
                const hiddenCount = Math.max(0, getGroupItemCount(group) - visibleCount);
                return (
                  <div
                    key={group.label}
                    className={`overflow-hidden rounded-lg border shadow-sm transition-colors ${
                      isOpen
                        ? 'border-hairline bg-white'
                        : 'border-hairline bg-white'
                    }`}
                    style={isOpen ? { borderLeftWidth: '3px', borderLeftColor: TONE_BORDER_COLOR[group.tone] || '#64748b' } : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDrawerGroup(group.label)}
                      className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-extrabold text-ink"
                      aria-expanded={isOpen}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className={`${group.tone} ${isOpen ? 'scale-110' : ''} transition-transform`}>●</span>
                          <span className="truncate">{group.label}</span>
                        </span>
                        {group.summary ? <span className="mt-0.5 block truncate text-xs font-semibold text-muted">{group.summary}</span> : null}
                      </span>
                      <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="border-t border-hairline px-3 py-3">
                        {visibleSections.map((section) => (
                          <div key={`${group.label}-${section.title || section.items[0]?.slug}`} className="mb-3 last:mb-0">
                            {section.title ? (
                              <div className="mb-1 px-1 text-[11px] font-bold uppercase tracking-normal text-gray-400">
                                {section.title}
                              </div>
                            ) : null}
                            <div className="grid gap-1">
                              {section.items.map((item) => (
                                <Link
                                  key={item.href || item.slug}
                                  href={item.href || `/category/${item.slug}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-accent active:bg-accent-soft/70 active:scale-[0.98]"
                                >
                                  {item.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-hairline pt-3">
                          <Link
                            href={group.href}
                            onClick={() => setMobileOpen(false)}
                            className="rounded-lg bg-ink px-3 py-2 text-center text-xs font-extrabold text-white"
                          >
                            {group.ctaLabel || 'View All →'}
                          </Link>
                          {hiddenCount > 0 || isExpanded ? (
                            <button
                              type="button"
                              onClick={() => toggleDrawerExpanded(group.label)}
                              className="rounded-lg border border-hairline px-3 py-2 text-xs font-extrabold text-accent"
                            >
                              {isExpanded ? 'Show less' : `Show more (${hiddenCount})`}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>

            <div className="shrink-0 border-t border-hairline bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-ink px-3 py-3 text-center text-xs font-extrabold text-white"
                >
                  Account
                </Link>
                <Link
                  href="/track-order"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-bg-alt px-3 py-3 text-center text-xs font-bold text-ink"
                >
                  Track order
                </Link>
                <Link
                  href="/privacy-policy"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-bg-alt px-3 py-3 text-center text-xs font-bold text-ink"
                >
                  Privacy Policy
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
            </div>
          </aside>
        </div>
      )}

      <nav
        aria-label="Mobile bottom navigation"
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
          <span className="max-w-full truncate text-[10px] font-medium leading-4">Categories</span>
        </Link>
        <Link
          href="/account"
          className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-muted hover:text-accent"
          aria-label="Account"
        >
          <User size={20} />
          <span className="max-w-full truncate text-[10px] font-medium leading-4">Account</span>
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
