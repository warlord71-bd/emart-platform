'use client';

import { useEffect, useMemo, useState } from 'react';

export type CategoryLocale = 'en' | 'bn';

const dictionary = {
  en: {
    shoppers: 'Shoppers browsing right now',
    flashEnds: 'Flash deal ends in',
    left: 'left',
    sold: 'sold',
    verified: 'Verified',
    shopDeals: 'Shop the deals',
    trendingNow: 'Trending now',
    trustDelivery: 'Free delivery',
    trustAuthentic: 'Authentic imports',
    trustReturn: '7-day return',
    trustPayment: 'COD, bKash, Nagad',
    all: 'All',
    trending: 'Trending',
    popularCategories: 'Popular Categories',
    flashDeals: 'Flash Deals',
    concerns: 'Shop by Skin Concern',
    customerWall: 'Customer Wall',
    mostLoved: 'Most-loved',
    products: 'products',
    reviews: 'reviews',
    viewing: 'viewing',
    seeAll: 'See all',
  },
  bn: {
    shoppers: 'এখন কেনাকাটা করছেন',
    flashEnds: 'ফ্ল্যাশ ডিল শেষ হবে',
    left: 'বাকি',
    sold: 'বিক্রি হয়েছে',
    verified: 'যাচাইকৃত',
    shopDeals: 'ডিল দেখুন',
    trendingNow: 'এখন ট্রেন্ডিং',
    trustDelivery: 'ফ্রি ডেলিভারি',
    trustAuthentic: 'অথেনটিক ইমপোর্ট',
    trustReturn: '৭ দিনের রিটার্ন',
    trustPayment: 'COD, bKash, Nagad',
    all: 'সব',
    trending: 'ট্রেন্ডিং',
    popularCategories: 'জনপ্রিয় ক্যাটাগরি',
    flashDeals: 'ফ্ল্যাশ ডিল',
    concerns: 'স্কিন কনসার্ন',
    customerWall: 'কাস্টমার রিভিউ',
    mostLoved: 'সবচেয়ে পছন্দের',
    products: 'প্রোডাক্ট',
    reviews: 'রিভিউ',
    viewing: 'দেখছেন',
    seeAll: 'সব দেখুন',
  },
} as const;

export function useCategoryPageI18n() {
  const [locale, setLocale] = useState<CategoryLocale>('en');

  useEffect(() => {
    const read = () => {
      const value = window.localStorage.getItem('emart-language');
      setLocale(value === 'bn' ? 'bn' : 'en');
    };
    read();
    window.addEventListener('storage', read);
    const timer = window.setInterval(read, 800);
    return () => {
      window.removeEventListener('storage', read);
      window.clearInterval(timer);
    };
  }, []);

  return useMemo(() => {
    const table = dictionary[locale];
    const number = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD');
    return {
      locale,
      t: (key: keyof typeof dictionary.en) => table[key],
      n: (value: number) => number.format(value),
      currency: (value: number) => `৳${number.format(Math.round(value || 0))}`,
    };
  }, [locale]);
}
