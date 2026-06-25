'use client';

import { useEffect, useMemo, useState } from 'react';

export type CategoryLocale = 'en' | 'bn';

const dictionary = {
  en: {
    shoppers: 'Browsing trend',
    shoppingNow: 'browsing trend',
    flashEnds: 'Flash deal ends in',
    heroBadge: '✦ Flash Week · Day 3 of 7',
    heroTitlePrefix: 'Shop beauty',
    heroTitleHighlight: 'categories',
    heroTitleSuffix: 'by need, trend, and concern.',
    heroLead: 'Popular picks refreshed through the day, with availability hints from current catalog data.',
    popularEyebrow: '— Popular now',
    popularTitle: 'Shop beauty by category.',
    flashEyebrow: '— Flash deals',
    flashTitle: 'Going fast. Like, really fast.',
    concernEyebrow: '— Shop by skin concern',
    concernTitle: 'Shop by concern and customer feedback.',
    customerEyebrow: '— Customer feedback',
    customerTitle: 'Recent reviews from Emart customers.',
    left: 'available',
    sold: 'popular',
    verified: 'Verified',
    shopDeals: 'Shop the deals',
    trendingNow: 'Trending now',
    trustDelivery: 'Fast delivery',
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
    viewing: 'interest',
    seeAll: 'See all',
  },
  bn: {
    shoppers: 'ব্রাউজিং ট্রেন্ড',
    shoppingNow: 'ব্রাউজিং ট্রেন্ড',
    flashEnds: 'ফ্ল্যাশ ডিল শেষ হবে',
    heroBadge: '✦ ফ্ল্যাশ উইক · ৭ দিনের ৩য় দিন',
    heroTitlePrefix: 'প্রয়োজন, ট্রেন্ড ও কনসার্ন অনুযায়ী',
    heroTitleHighlight: 'বিউটি ক্যাটাগরি',
    heroTitleSuffix: 'শপ করুন।',
    heroLead: 'দিনজুড়ে রিফ্রেশ হওয়া জনপ্রিয় পিক, বর্তমান ক্যাটালগ ডেটা থেকে অ্যাভেইলেবিলিটি হিন্টসহ।',
    popularEyebrow: '— এখন জনপ্রিয়',
    popularTitle: 'ক্যাটাগরি অনুযায়ী বিউটি শপ করুন।',
    flashEyebrow: '— ফ্ল্যাশ ডিল',
    flashTitle: 'দ্রুত শেষ হচ্ছে। সত্যিই দ্রুত।',
    concernEyebrow: '— স্কিন কনসার্ন অনুযায়ী কিনুন',
    concernTitle: 'কনসার্ন ও কাস্টমার ফিডব্যাক অনুযায়ী শপ করুন।',
    customerEyebrow: '— কাস্টমার ফিডব্যাক',
    customerTitle: 'Emart কাস্টমারদের সাম্প্রতিক রিভিউ।',
    left: 'অ্যাভেইলেবল',
    sold: 'জনপ্রিয়',
    verified: 'যাচাইকৃত',
    shopDeals: 'ডিল দেখুন',
    trendingNow: 'এখন ট্রেন্ডিং',
    trustDelivery: 'দ্রুত ডেলিভারি',
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
    viewing: 'ইন্টারেস্ট',
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
