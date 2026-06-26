import { getCategoryBySlug, getOriginTermBySlug, getProducts } from '@/lib/woocommerce';
import CatalogFilters from '@/components/product/CatalogFilters';
import ProductCard from '@/components/product/ProductCard';
import { ProductListGrid } from '@/components/product/ProductListGrid';
import CollectionPageHeader from '@/components/collection/CollectionPageHeader';
import { NumberedPagination } from '@/components/common/NumberedPagination';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategorySeo } from '@/lib/seo';
import { absoluteUrl } from '@/lib/siteUrl';
import { STORE_POLICIES } from '@/config/storePolicies';
import { safeJsonLd } from '@/lib/sanitizeHtml';
import { getConcernBySlug } from '@/lib/concerns';
import { getIngredientBySlug } from '@/lib/ingredients';
import { getOriginByCountry } from '@/lib/origin-navigation';
import {
  getPaginatedCanonical,
  getPaginatedTitle,
  getValidPage,
} from '@/lib/paginationSeo';
import { truncateMetaDescription } from '@/lib/seoText';

interface Props {
  params: { slug: string };
  searchParams: {
    page?: string;
    price?: string;
    sort?: string;
    in_stock?: string;
    origin?: string;
    concern?: string;
    ingredient?: string;
    skin_type?: string;
    hair_type?: string;
    finish?: string;
  };
}

const PRICE_MAP = {
  under500: { min_price: undefined, max_price: '500' },
  '500-1000': { min_price: '500', max_price: '1000' },
  '1000-2000': { min_price: '1000', max_price: '2000' },
  '2000plus': { min_price: '2000', max_price: undefined },
} satisfies Record<string, { min_price?: string; max_price?: string }>;

const SORT_MAP = {
  newest: { orderby: 'date', order: 'desc' },
  'price-asc': { orderby: 'price', order: 'asc' },
  'price-desc': { orderby: 'price', order: 'desc' },
  popularity: { orderby: 'popularity', order: 'desc' },
  rating: { orderby: 'rating', order: 'desc' },
} satisfies Record<string, {
  orderby: 'date' | 'price' | 'popularity' | 'rating' | 'title';
  order: 'asc' | 'desc';
}>;

type PriceValue = keyof typeof PRICE_MAP;
type SortValue = keyof typeof SORT_MAP;

const SKIN_TYPE_CATEGORY: Record<string, string> = {
  oily: 'pores-oil-control',
  dry: 'dryness-hydration',
};

const SKIN_TYPE_SEARCH: Record<string, string> = {
  sensitive: 'sensitive',
  combination: 'combination',
  normal: 'normal',
};

function getPriceParams(value?: string) {
  return value && value in PRICE_MAP ? PRICE_MAP[value as PriceValue] : undefined;
}

function getSortParams(value?: string) {
  return value && value in SORT_MAP ? SORT_MAP[value as SortValue] : SORT_MAP.popularity;
}

function detectContext(category: { slug: string; name: string }): 'skincare' | 'hair' | 'makeup' | undefined {
  const value = `${category.slug} ${category.name}`.toLowerCase();

  if (/hair|shampoo|conditioner/.test(value)) return 'hair';
  if (/makeup|lipstick|mascara|foundation|finish/.test(value)) return 'makeup';
  if (/skin|cleanser|toner|serum|moisturiz|sunscreen|mask|acne|face/.test(value)) return 'skincare';

  return undefined;
}

const CATEGORY_OG_IMAGE_BY_KEY: Record<string, string> = {
  'face-cleansers': '/images/hero-products.png',
  'toners-mists': '/images/hero-products.png',
  sunscreen: '/images/home-categories/cosrx-sunscreen.jpg',
  'korean-beauty': '/images/home-categories/viral-kbeauty.jpg',
  'korean-skincare': '/images/home-categories/viral-kbeauty.jpg',
  'night-cream': '/images/home-categories/cosrx-snail-92-cream.png',
  'hair-care': '/images/home-categories/hair-care.jpg',
  shampoo: '/images/home-categories/hair-care.jpg',
  'makeup-cosmetics': '/images/home-categories/makeup-illus.png',
  makeup: '/images/home-categories/makeup-illus.png',
};

type QuickPick = { label: string; params: Record<string, string> };
const CATEGORY_QUICK_PICKS: Record<string, QuickPick[]> = {
  sunscreen: [
    { label: 'For oily skin',      params: { skin_type: 'oily' } },
    { label: 'For dry skin',       params: { skin_type: 'dry' } },
    { label: 'For sensitive skin', params: { skin_type: 'sensitive' } },
    { label: 'Under ৳500',         params: { price: 'under500' } },
    { label: '৳500–1000',          params: { price: '500-1000' } },
    { label: 'Newest',             params: { sort: 'newest' } },
  ],
  'face-cleansers': [
    { label: 'For oily skin',      params: { skin_type: 'oily' } },
    { label: 'For dry skin',       params: { skin_type: 'dry' } },
    { label: 'For sensitive skin', params: { skin_type: 'sensitive' } },
    { label: 'Under ৳500',         params: { price: 'under500' } },
    { label: 'Newest',             params: { sort: 'newest' } },
  ],
  'serums-ampoules-essences': [
    { label: 'For acne',           params: { concern: 'acne-blemish-care' } },
    { label: 'For brightening',    params: { concern: 'brightening' } },
    { label: 'For dry skin',       params: { skin_type: 'dry' } },
    { label: 'Niacinamide',        params: { ingredient: 'niacinamide' } },
    { label: 'Under ৳1000',        params: { price: '500-1000' } },
  ],
  'toners-mists': [
    { label: 'For oily skin',      params: { skin_type: 'oily' } },
    { label: 'For acne',           params: { concern: 'acne-blemish-care' } },
    { label: 'For brightening',    params: { concern: 'brightening' } },
    { label: 'Under ৳500',         params: { price: 'under500' } },
    { label: 'Newest',             params: { sort: 'newest' } },
  ],
  'moisturizer': [
    { label: 'For oily skin',      params: { skin_type: 'oily' } },
    { label: 'For dry skin',       params: { skin_type: 'dry' } },
    { label: 'For sensitive skin', params: { skin_type: 'sensitive' } },
    { label: 'Under ৳500',         params: { price: 'under500' } },
    { label: 'Newest',             params: { sort: 'newest' } },
  ],
};

const CATEGORY_SEO_OVERRIDES: Record<string, { title: string; description: string }> = {
  moisturizer: {
    title: 'Moisturizer Prices in Bangladesh | Emart',
    description:
      'Buy authentic moisturizers in Bangladesh at Emart. Korean gel creams, CeraVe, La Roche-Posay, and more. COD available, fast delivery.',
  },
  serum: {
    title: 'Serum Prices in Bangladesh | Emart',
    description:
      'Shop authentic serums in Bangladesh — brightening, anti-aging, acne, hydration. COSRX, The Ordinary, Laneige. Original imports, COD available.',
  },
  sunscreen: {
    title: 'Sunscreen Prices in Bangladesh | Emart',
    description:
      'Buy authentic sunscreen in Bangladesh. Korean SPF, La Roche-Posay, CeraVe — matte and hydrating formulas for Bangladesh\'s climate. COD available.',
  },
  toner: {
    title: 'Toner Prices in Bangladesh | Emart',
    description:
      'Shop authentic toners and essences in Bangladesh. Hydrating, exfoliating, and ferment toners from Korean and global brands. COD, fast delivery.',
  },
  'toners-mists': {
    title: 'Toner & Face Mist Price in Bangladesh | Emart',
    description:
      'Shop authentic toners, face mists and essences in Bangladesh. Hydrating, exfoliating and soothing Korean toners at Emart with COD.',
  },
  cleanser: {
    title: 'Cleanser Prices in Bangladesh | Emart',
    description:
      'Buy authentic face cleansers in Bangladesh — low-pH gels, foam, oil, and cream cleansers from COSRX, Cetaphil, CeraVe. COD available.',
  },
  'eye-cream': {
    title: 'Eye Cream Prices in Bangladesh | Emart',
    description:
      'Shop authentic eye creams in Bangladesh. Treat dark circles, puffiness, and fine lines with original COSRX, Laneige, Mizon eye care. COD available.',
  },
  'sheet-mask': {
    title: 'Sheet Mask Prices in Bangladesh | Emart',
    description:
      'Buy authentic sheet masks in Bangladesh. Korean hydrogel, sheet, and sleeping masks from Innisfree, COSRX, and more. Original imports, COD available.',
  },
  'lip-care': {
    title: 'Lip Care Prices in Bangladesh | Emart',
    description:
      'Shop authentic lip balms, lip tints, and lip care in Bangladesh. ROMAND, 3CE, Vaseline, Innisfree. Original imports, COD available nationwide.',
  },
  'body-lotion': {
    title: 'Body Lotion Prices in Bangladesh | Emart',
    description:
      'Buy authentic body lotions in Bangladesh. Vaseline, Nivea, CeraVe, The Derma Co — brightening, repair, and daily moisture. COD available.',
  },
  'hair-care': {
    title: 'Hair Care Prices in Bangladesh | Emart',
    description:
      'Shop authentic hair care in Bangladesh. Shampoos, conditioners, oils, and treatments from TRESemmé, WishCare, Pantene. Original imports, COD available.',
  },
  'soothing-gel': {
    title: 'Soothing Gel Prices in Bangladesh | Emart',
    description:
      'Buy authentic soothing gels in Bangladesh. Aloe vera, centella and calming gels from Nature Republic, COSRX, PaxMoly. Original imports, COD available.',
  },
};

const FACE_CLEANSERS_SEO = {
  title: 'Face Cleanser & Face Wash in Bangladesh | Emart',
  description: 'Shop authentic face cleansers and face wash in Bangladesh, including Korean low-pH gels, foam cleansers, micellar water and oil cleansers at Emart.',
  ogAlt: 'Face cleanser and face wash products available at Emart Bangladesh',
  image: {
    path: '/images/hero-products.png',
    width: 1200,
    height: 520,
  },
  keywords: [
    'face cleanser Bangladesh',
    'face wash Bangladesh',
    'Korean cleanser Bangladesh',
    'low pH cleanser Bangladesh',
    'foam cleanser Bangladesh',
    'micellar water Bangladesh',
    'oil cleanser Bangladesh',
    'authentic skincare Bangladesh',
    'Emart face cleanser',
  ],
};

const TONERS_MISTS_SEO = {
  title: 'Toner & Face Mist Price in Bangladesh | Emart',
  description: 'Shop authentic toners, face mists and essences in Bangladesh. Hydrating, exfoliating and soothing Korean toners at Emart with COD.',
  ogAlt: 'Toners, face mists and essences available at Emart Bangladesh',
  image: {
    path: '/images/hero-products.png',
    width: 1200,
    height: 520,
  },
  keywords: [
    'toner Bangladesh',
    'face mist Bangladesh',
    'Korean toner Bangladesh',
    'hydrating toner Bangladesh',
    'exfoliating toner Bangladesh',
    'essence toner Bangladesh',
    'authentic skincare Bangladesh',
    'Emart toner',
  ],
};

const SERUMS_AMPOULES_ESSENCES_SEO = {
  title: 'Serums, Ampoules & Essences Price in Bangladesh | Emart',
  description: 'Shop authentic serums, ampoules and essences in Bangladesh. Brightening, acne, anti-aging and hydration skincare at Emart with COD.',
  ogAlt: 'Serums, ampoules and essences available at Emart Bangladesh',
  image: {
    path: '/images/hero-products.png',
    width: 1200,
    height: 520,
  },
  keywords: [
    'serum Bangladesh',
    'ampoule Bangladesh',
    'essence Bangladesh',
    'Korean serum Bangladesh',
    'brightening serum Bangladesh',
    'niacinamide serum Bangladesh',
    'snail essence Bangladesh',
    'authentic skincare Bangladesh',
    'Emart serum',
  ],
};

// Genuine, category-specific FAQs. Single source for both the visible guide FAQ
// and FAQPage JSON-LD. Answers are plain text (no markup) so they are schema-safe.
const CATEGORY_GUIDE_FAQS: Record<string, { q: string; a: string }[]> = {
  'face-cleansers': [
    { q: 'অয়েলি ও ব্রণপ্রবণ ত্বকের জন্য কোন ফেসওয়াশ ভালো?', a: 'লো-পিএইচ জেল ক্লিনজার বা মৃদু BHA ক্লিনজার ভালো শুরু। COSRX Low pH Good Morning বা COSRX Salicylic Acid Daily Gentle Cleanser ব্যবহার করতে পারেন। দিনে দুইবারের বেশি ক্লিনজিং সাধারণত দরকার হয় না।' },
    { q: 'শুষ্ক ত্বকে কি ফোমিং ক্লিনজার ব্যবহার করা যায়?', a: 'যায়, তবে fragrance-free ও hydrating formula বেছে নিন। ধোয়ার পর ত্বক টানটান লাগলে সেটি আপনার জন্য বেশি stripping হতে পারে।' },
    { q: 'ডাবল ক্লিনজিং কখন দরকার?', a: 'sunscreen, makeup, বা heavy outdoor exposure থাকলে রাতে আগে oil/balm cleanser, এরপর gentle foam বা gel cleanser ব্যবহার করলেই যথেষ্ট।' },
  ],
  sunscreen: [
    { q: 'How often should I reapply sunscreen in Bangladesh’s heat?', a: 'Reapply every 2 hours when outdoors. For indoor or office use, one morning application is usually enough. After swimming or heavy sweating, reapply immediately regardless of time.' },
    { q: 'Can I use sunscreen on acne-prone skin without breakouts?', a: 'Yes — choose a lightweight gel or fluid formula labelled non-comedogenic. Korean sunscreens from COSRX, Beauty of Joseon, and ISNTREE offer non-greasy options designed for oily skin.' },
    { q: 'What does PA++++ mean on Korean sunscreen?', a: 'PA measures protection against UVA rays, which cause skin ageing and penetrate clouds. PA++++ is the highest rating. For Bangladesh’s high UV index, choose PA+++ or higher.' },
  ],
  'toners-mists': [
    { q: 'টোনার আসলে কী কাজ করে?', a: 'ক্লিনজিংয়ের পর টোনার ত্বকের pH ভারসাম্য ফেরায় এবং পরের ধাপের serum বা moisturiser আরও ভালোভাবে শোষণে সাহায্য করে। Hydrating toner আর্দ্রতা যোগ করে, exfoliating toner মৃত কোষ তোলে।' },
    { q: 'Hydrating আর exfoliating toner-এর মধ্যে পার্থক্য কী?', a: 'Hydrating toner (hyaluronic acid, heartleaf, rice) প্রতিদিন ব্যবহারযোগ্য এবং আর্দ্রতা দেয়। Exfoliating toner (AHA/BHA) সপ্তাহে ২–3 দিন ব্যবহার করুন, কারণ এটি ত্বক exfoliate করে।' },
    { q: 'রুটিনে টোনার কখন ব্যবহার করব?', a: 'ক্লিনজিংয়ের ঠিক পরে, serum-এর আগে। হাতে নিয়ে আলতো করে চেপে নিন বা cotton pad ব্যবহার করুন। Exfoliating toner রাতে ব্যবহার করাই ভালো।' },
  ],
  'serums-ampoules-essences': [
    { q: 'Serum, ampoule আর essence-এর পার্থক্য কী?', a: 'Essence সবচেয়ে পাতলা ও hydration-কেন্দ্রিক, toner-এর পরে ব্যবহার হয়। Serum বেশি ঘন ও targeted active (niacinamide, vitamin C) যুক্ত। Ampoule সবচেয়ে concentrated, অল্প সময়ের intensive care-এর জন্য।' },
    { q: 'একসাথে কয়টি serum ব্যবহার করা যায়?', a: 'এক রুটিনে ২–3টির বেশি নয়। পাতলা texture আগে দিন। Retinol আর vitamin C একই রুটিনে মেশাবেন না — vitamin C সকালে, retinol রাতে রাখুন।' },
    { q: 'সিরাম সকালে না রাতে ব্যবহার করব?', a: 'বেশিরভাগ serum সকাল-রাত দুই সময়েই চলে। ব্যতিক্রম: retinol শুধু রাতে, আর vitamin C সকালে sunscreen-এর আগে সবচেয়ে ভালো কাজ করে।' },
  ],
  'korean-beauty': [
    { q: 'বাংলাদেশে অরিজিনাল কোরিয়ান স্কিনকেয়ার কোথায় পাব?', a: 'Emart-এ ২,০০০+ authentic Korean beauty product সরাসরি import করা, COD সহ সারা বাংলাদেশে ডেলিভারি। COSRX, Beauty of Joseon, SKIN1004, Anua, Round Lab-সহ জনপ্রিয় ব্র্যান্ড পাওয়া যায়।' },
    { q: 'কোরিয়ান স্কিনকেয়ার কি সব স্কিন টাইপে কাজ করে?', a: 'হ্যাঁ। K-beauty-তে প্রতিটি স্কিন টাইপের জন্য product আছে। ব্র্যান্ড নয়, concern অনুযায়ী বেছে নেওয়াই আসল কৌশল — acne, hydration, না anti-aging।' },
    { q: '10-step routine কি বাংলাদেশে দরকার?', a: 'দরকার নেই। cleanser, toner, moisturiser আর sunscreen দিয়ে শুরু করুন। ত্বকের প্রয়োজন অনুযায়ী পরে serum বা treatment যোগ করুন।' },
  ],
  'bath-body': [
    { q: 'বাংলাদেশের আবহাওয়ায় body care কেমন হওয়া উচিত?', a: 'গরম ও আর্দ্র আবহাওয়ায় গোসলের পর হালকা ময়েশ্চারাইজিং body lotion ব্যবহার করুন। ঘাম ও রোদ থেকে ত্বক রক্ষায় মৃদু body wash আর পর্যাপ্ত hydration গুরুত্বপূর্ণ।' },
    { q: 'Body wash না সাবান — কোনটা ভালো?', a: 'Body wash সাধারণত ত্বকের pH-এর কাছাকাছি ও বেশি ময়েশ্চারাইজিং, তাই শুষ্ক বা সংবেদনশীল ত্বকের জন্য সাবানের চেয়ে ভালো। তৈলাক্ত ত্বকে clarifying body wash উপযোগী।' },
    { q: 'Body lotion কখন লাগাব?', a: 'গোসলের পরপরই, ত্বক হালকা ভেজা থাকতে লাগালে আর্দ্রতা ভালোভাবে আটকে থাকে। শুষ্ক ত্বকে দিনে দুইবারও ব্যবহার করা যায়।' },
  ],
  lips: [
    { q: 'Lip care না lip color — কোনটা দিয়ে শুরু করব?', a: 'শুরুটা lip care দিয়েই — একটি ভালো lip balm ঠোঁট নরম ও আর্দ্র রাখে। এরপর lipstick বা tint ব্যবহার করলে রঙ সুন্দরভাবে বসে ও ঠোঁট ফাটে না।' },
    { q: 'ঠোঁট বারবার ফাটে কেন, কী করব?', a: 'পানি কম খাওয়া, ঠোঁট চাটা ও শুষ্ক আবহাওয়া মূল কারণ। নিয়মিত hydrating lip balm লাগান, রাতে lip mask ব্যবহার করুন এবং পর্যাপ্ত পানি পান করুন।' },
  ],
  shampoos: [
    { q: 'বাংলাদেশের আবহাওয়ায় কোন ধরনের শ্যাম্পু ভালো?', a: 'গরম ও আর্দ্র আবহাওয়ায় মাথার তালু ঘামে ও তেল বেশি হয়, তাই clarifying বা oil-control শ্যাম্পু সপ্তাহে ১–২ বার ব্যবহার করতে পারেন। বাকি দিন মৃদু ও hydrating শ্যাম্পু ব্যবহার করুন।' },
    { q: 'Sulfate-free শ্যাম্পু কি সত্যিই ভালো?', a: 'রঙ করা, কেমিক্যাল ট্রিটমেন্ট করা বা শুষ্ক চুলে sulfate-free ভালো — ফেনা কম হয় কিন্তু চুলের moisture ও রঙ বেশিদিন টেকে। তৈলাক্ত মাথার তালুতে মাঝে মাঝে sulfate শ্যাম্পু ব্যবহারে সমস্যা নেই।' },
    { q: 'শ্যাম্পু কতদিন পর পর পাল্টানো দরকার?', a: 'দরকার নেই — চুলের ধরন ও সমস্যা অনুযায়ী একটি ভালো শ্যাম্পু দীর্ঘদিন ব্যবহার করা যায়। তবে মাথার তালু বা চুলের অবস্থা বদলালে শ্যাম্পু বদলানো যুক্তিসঙ্গত।' },
  ],
  'face-masks': [
    { q: 'Sheet mask আর wash-off mask-এর পার্থক্য কী?', a: 'Sheet mask হলো সিরাম-ভেজানো কাপড় যা ১৫–২০ মিনিট রেখে সরিয়ে ফেলতে হয় — ধোয়ার দরকার নেই। Wash-off mask ক্রিম বা clay যা লাগিয়ে শুকালে পানি দিয়ে ধুয়ে ফেলতে হয়। Sheet mask বেশি hydrating, wash-off mask বেশি deep-cleansing।' },
    { q: 'সপ্তাহে কতবার ফেস মাস্ক ব্যবহার করব?', a: 'Hydrating sheet mask প্রতিদিন বা ১ দিন পর পর ব্যবহার করা যায়। Clay বা exfoliating wash-off mask সপ্তাহে ১–২ বার যথেষ্ট — বেশি ব্যবহারে ত্বক শুষ্ক হতে পারে।' },
    { q: 'ফেস মাস্কের পর কি ময়েশ্চারাইজার লাগাতে হয়?', a: 'হ্যাঁ। Sheet mask সরানোর পর অবশিষ্ট সিরাম থাপ দিয়ে মাখিয়ে নিন, তারপর ময়েশ্চারাইজার দিয়ে সিল করুন। Wash-off mask ধোয়ার পর toner ও moisturiser দিন।' },
  ],
  'eye-care': [
    { q: 'চোখের নিচে কালো দাগ কমাতে কী ব্যবহার করব?', a: 'Vitamin C, niacinamide, বা caffeine যুক্ত eye cream বা serum কালো দাগ হালকা করতে সাহায্য করে। নিয়মিত ব্যবহার ও পর্যাপ্ত ঘুম দুটোই গুরুত্বপূর্ণ।' },
    { q: 'Eye cream আর সাধারণ moisturiser-এর মধ্যে পার্থক্য কী?', a: 'চোখের চারপাশের ত্বক অনেক পাতলা ও সংবেদনশীল। Eye cream-এ কম fragrance ও হালকা formula থাকে যাতে জ্বালাপোড়া না হয়। সাধারণ moisturiser-এর heavy ingredients চোখে milia বা ফোলাভাব তৈরি করতে পারে।' },
    { q: 'Eye cream কখন লাগাব?', a: 'সকালে sunscreen-এর আগে এবং রাতে moisturiser-এর আগে। আঙুলের ডগা দিয়ে অল্প পরিমাণ নিয়ে আলতোভাবে চোখের চারপাশে থাপ দিয়ে লাগান — টানবেন না।' },
  ],
  'cream-moisturizer': [
    { q: 'ময়েশ্চারাইজার কি তৈলাক্ত ত্বকেও দরকার?', a: 'হ্যাঁ, অবশ্যই। তৈলাক্ত ত্বকে হালকা gel বা water-based moisturiser ব্যবহার করুন। ময়েশ্চারাইজার না দিলে ত্বক আরও বেশি তেল তৈরি করে ভারসাম্য রাখার চেষ্টা করে।' },
    { q: 'Day cream আর night cream-এর পার্থক্য কী?', a: 'Day cream সাধারণত হালকা, দ্রুত absorb হয় এবং কখনো কখনো SPF থাকে। Night cream ভারী, বেশি nourishing — রাতে ত্বকের repair cycle-এ সাহায্য করে। দুটো আলাদা রাখলে ত্বক দিন-রাত দুই সময়েই সঠিক যত্ন পায়।' },
    { q: 'ময়েশ্চারাইজার কতটুকু লাগাব?', a: 'মুখের জন্য মটরশুটি পরিমাণ যথেষ্ট। বেশি লাগালে ত্বক চটচটে লাগে এবং pore বন্ধ হতে পারে। ঘাড়েও অল্প মাখিয়ে নিন।' },
  ],
  'makeup-remover': [
    { q: 'Micellar water না cleansing oil — কোনটা ভালো?', a: 'হালকা মেকআপ ও sunscreen-এর জন্য micellar water যথেষ্ট এবং সহজ। ভারী মেকআপ, waterproof mascara বা heavy sunscreen-এর জন্য cleansing oil বা balm বেশি কার্যকর। দুটোই ত্বকের জন্য নিরাপদ।' },
    { q: 'মেকআপ না করলেও কি রিমুভার দরকার?', a: 'Sunscreen ব্যবহার করলে অবশ্যই দরকার — sunscreen সাধারণ face wash-এ পুরোপুরি ওঠে না। Micellar water বা oil cleanser দিয়ে আগে sunscreen তুলুন, তারপর regular cleanser দিন।' },
    { q: 'চোখের মেকআপ তোলার আলাদা রিমুভার কেন দরকার?', a: 'চোখের চারপাশের ত্বক খুব পাতলা ও সংবেদনশীল। আলাদা eye makeup remover জেন্টলি waterproof mascara ও eyeliner তোলে যাতে ঘষাঘষির দরকার না হয় এবং চোখ জ্বালা না করে।' },
  ],
  'body-wash': [
    { q: 'Body wash না সাবান — কোনটা ত্বকের জন্য ভালো?', a: 'Body wash সাধারণত ত্বকের pH-এর কাছাকাছি এবং বেশি moisturising। সাবান ত্বক বেশি শুষ্ক করতে পারে, বিশেষত বাংলাদেশের গরমে। সংবেদনশীল বা শুষ্ক ত্বকে body wash নিরাপদ পছন্দ।' },
    { q: 'Body wash কি shower gel থেকে আলাদা?', a: 'Body wash সাধারণত ক্রিমি ও বেশি moisturising। Shower gel বেশি জেলি-ঘন ও ফেনাদায়ক। শুষ্ক ত্বকে body wash, তৈলাক্ত ত্বকে shower gel ভালো কাজ করে। দুটোই সাবানের চেয়ে মৃদু।' },
    { q: 'বাচ্চাদের জন্য কি আলাদা body wash দরকার?', a: 'হ্যাঁ — বাচ্চাদের ত্বক পাতলা ও সংবেদনশীল, তাই fragrance-free ও hypoallergenic baby wash ব্যবহার করুন। বড়দের body wash-এ থাকা fragrance ও harsh surfactant বাচ্চাদের ত্বকে জ্বালা করতে পারে।' },
  ],
  foundation: [
    { q: 'বাংলাদেশের আবহাওয়ায় ফাউন্ডেশন কীভাবে টেকে?', a: 'গরম ও আর্দ্র আবহাওয়ায় oil-free, matte বা semi-matte foundation ভালো টেকে। আগে primer লাগান এবং setting spray দিয়ে সেট করুন। ঘাম হলে blotting paper ব্যবহার করুন।' },
    { q: 'ফাউন্ডেশনের সঠিক shade কীভাবে বাছব?', a: 'চোয়ালের (jawline) কাছে ২–৩টি shade পরীক্ষা করুন — যেটি ত্বকের সাথে মিশে যায় সেটি সঠিক। অনলাইনে কেনার সময় ব্র্যান্ডের shade guide দেখুন এবং আপনার undertone (warm/cool/neutral) জানুন।' },
    { q: 'BB cream, CC cream আর foundation-এর মধ্যে পার্থক্য কী?', a: 'BB cream হালকা coverage + moisturiser + SPF একসাথে — দৈনিক হালকা মেকআপে ভালো। CC cream colour correction-এ বেশি কার্যকর। Foundation সবচেয়ে বেশি coverage দেয় এবং বিভিন্ন finish-এ (matte, dewy, satin) পাওয়া যায়।' },
  ],
};

function getCategoryOgImage(slug: string, name: string) {
  const value = `${slug} ${name}`.toLowerCase();
  const key = Object.keys(CATEGORY_OG_IMAGE_BY_KEY).find((candidate) => value.includes(candidate));
  return absoluteUrl(key ? CATEGORY_OG_IMAGE_BY_KEY[key] : '/images/hero-products.png');
}

function getCategoryOgImageMeta(slug: string, name: string, alt: string) {
  if (slug === 'face-cleansers') {
    return {
      url: absoluteUrl(FACE_CLEANSERS_SEO.image.path),
      width: FACE_CLEANSERS_SEO.image.width,
      height: FACE_CLEANSERS_SEO.image.height,
      alt,
    };
  }

  if (slug === 'toners-mists') {
    return {
      url: absoluteUrl(TONERS_MISTS_SEO.image.path),
      width: TONERS_MISTS_SEO.image.width,
      height: TONERS_MISTS_SEO.image.height,
      alt,
    };
  }

  if (slug === 'serums-ampoules-essences') {
    return {
      url: absoluteUrl(SERUMS_AMPOULES_ESSENCES_SEO.image.path),
      width: SERUMS_AMPOULES_ESSENCES_SEO.image.width,
      height: SERUMS_AMPOULES_ESSENCES_SEO.image.height,
      alt,
    };
  }

  return {
    url: getCategoryOgImage(slug, name),
    width: 1200,
    height: 630,
    alt,
  };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) notFound();

  const seo = await getCategorySeo(params.slug, cat.name);
  const rawDescription = 'description' in cat ? ((cat as any).description as string || '') : '';

  // getCategoryIntro returns specific copy for known categories, or a generic template.
  // Prefer specific intro over both Rank Math and the generic Rank Math fallback.
  const introText = getCategoryIntro(cat.name, params.slug, rawDescription)
    .replace(/<[^>]+>/g, '').trim();
  const hasSpecificIntro = !introText.startsWith('Shop authentic');
  const description = (hasSpecificIntro
    ? truncateMetaDescription(introText)
    : seo.description) || truncateMetaDescription(introText);
  const isFaceCleansers = params.slug === 'face-cleansers';
  const isTonersMists = params.slug === 'toners-mists';
  const isSerumsAmpoulesEssences = params.slug === 'serums-ampoules-essences';
  const isSunscreen = params.slug === 'sunscreen';
  const slugOverride = CATEGORY_SEO_OVERRIDES[params.slug];
  const title = isFaceCleansers
      ? FACE_CLEANSERS_SEO.title
      : isTonersMists
        ? TONERS_MISTS_SEO.title
      : isSerumsAmpoulesEssences
        ? SERUMS_AMPOULES_ESSENCES_SEO.title
        : slugOverride?.title ?? seo.title;
  const metaDescription = isFaceCleansers
      ? FACE_CLEANSERS_SEO.description
      : isTonersMists
        ? TONERS_MISTS_SEO.description
      : isSerumsAmpoulesEssences
        ? SERUMS_AMPOULES_ESSENCES_SEO.description
        : slugOverride?.description ?? description;
  const imageAlt = isFaceCleansers
    ? FACE_CLEANSERS_SEO.ogAlt
    : isTonersMists
      ? TONERS_MISTS_SEO.ogAlt
      : isSerumsAmpoulesEssences
        ? SERUMS_AMPOULES_ESSENCES_SEO.ogAlt
      : `${cat.name} products at Emart`;
  const image = getCategoryOgImageMeta(params.slug, cat.name, imageAlt);
  const page = getValidPage(searchParams.page);
  const canonical = getPaginatedCanonical(`/category/${params.slug}`, page);
  const seoTitle = getPaginatedTitle(title, page);

  return {
    title: { absolute: seoTitle },
    description: metaDescription,
    ...(isFaceCleansers ? { keywords: FACE_CLEANSERS_SEO.keywords } : {}),
    ...(isTonersMists ? { keywords: TONERS_MISTS_SEO.keywords } : {}),
    ...(isSerumsAmpoulesEssences ? { keywords: SERUMS_AMPOULES_ESSENCES_SEO.keywords } : {}),
    robots: Number(cat.count || 0) <= 0
      ? { index: false, follow: true }
      : { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title: seoTitle,
      description: metaDescription,
      url: canonical,
      siteName: 'Emart Skincare Bangladesh',
      locale: 'en_BD',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription,
      images: [image],
    },
  };
}

export const dynamicParams = true;
export const revalidate = 3600;

function getCategoryIntro(name: string, slug: string, description: string): string {
  if (description) return description.replace(/<[^>]+>/g, '').substring(0, 500);

  const intros: Record<string, string> = {
    'face-cleansers': `Shop authentic face cleansers and face wash in Bangladesh at Emart. This collection includes low-pH gel cleansers, gentle foam cleansers, micellar water, oil cleansers, and daily face wash options for oily, dry, sensitive, acne-prone, and combination skin. Choose Korean cleanser favourites and trusted global derma brands with verified product images, real prices in BDT, Cash on Delivery, and fast delivery across Bangladesh.`,
    'toners-mists': `Shop authentic toners, face mists, and essences in Bangladesh at Emart. This collection includes hydrating toners, exfoliating AHA/BHA toners, calming heartleaf toners, rice toners, milky toners, and refreshing facial mists from Korean and global skincare brands. Choose formulas for oily, dry, sensitive, acne-prone, and combination skin with checked product images, real BDT prices, Cash on Delivery, and delivery across Bangladesh.`,
    'serums-ampoules-essences': `Shop authentic serums, ampoules, and essences in Bangladesh at Emart. This best-selling skincare collection includes brightening serums, niacinamide serum, vitamin C serum, retinol serum, snail essence, centella ampoules, peptide serum, and hydrating essence options from Korean and global brands. Choose targeted formulas for acne marks, dark spots, pores, anti-aging, sensitivity, and dehydration with checked product images, real BDT prices, Cash on Delivery, and delivery across Bangladesh.`,
    sunscreen: `Protect your skin from UV rays every day with our full range of authentic sunscreens in Bangladesh. Broad-spectrum SPF blocks both UVA and UVB rays — the two types responsible for sunburn, premature wrinkles, dark spots, and long-term skin damage. For Bangladesh's hot and humid outdoor climate, dermatologists recommend SPF 30–50+ applied every morning and reapplied every two hours when spending time outdoors. Our collection covers every skin type: lightweight matte-finish SPF for oily skin, hydrating sunscreen that doubles as a moisturizer for dry skin, and mineral formulas for sensitive skin. We carry Korean SPF favourites — Beauty of Joseon Relief Sun, Anua, AXIS-Y, Round Lab — alongside dermatologist brands like La Roche-Posay Anthelios, CeraVe, and Neutrogena. Water-resistant options are available for active use. All products are 100% authentic, imported directly — no fakes, no copies. Cash on Delivery available across all 64 districts of Bangladesh.`,
    'korean-skincare': `Discover authentic Korean skincare in Bangladesh at Emart — your home for original K-Beauty products. From COSRX snail mucin to Some By Mi AHA BHA toner, we carry the Korean skincare brands customers ask for most. Our collection covers cleansers, toners, serums, moisturizers, and sunscreens with fast delivery across Bangladesh and Cash on Delivery available.`,
    serum: `Targeted serums to address your biggest skin concerns — from brightening and anti-aging to acne control and deep hydration. Explore authentic serums from COSRX, The Ordinary, Laneige, and more, all available in Bangladesh with fast delivery. Whether you're dealing with dark spots, fine lines, or dehydration, our serum collection has the right solution for your skin.`,
    moisturizer: `Lock in hydration and strengthen your skin barrier with our curated range of authentic moisturizers. From lightweight Korean gel creams to rich derma moisturizers like CeraVe and La Roche-Posay, find the perfect moisturizer for your skin type. All products are 100% original, available in Bangladesh with fast delivery and COD.`,
    cleanser: `Start your skincare routine right with authentic cleansers from Korea, Japan, and global derma brands. From low-pH gel cleansers to creamy foam washes, our cleanser collection suits all skin types — oily, dry, sensitive, and combination. Shop original COSRX, Cetaphil, CeraVe, and more with fast Bangladesh delivery.`,
    toner: `Hydrate, balance, and prep your skin with authentic toners and essences from the best Korean and global skincare brands. Our toner collection includes hydrating toners, exfoliating toners, and ferment essences — all 100% original and available in Bangladesh with COD.`,
    'face-mask': `Treat your skin to a weekly boost with authentic sheet masks, wash-off masks, and sleeping masks. From Korean sheet mask favourites like Innisfree to clay masks and hydrogel options, our face mask collection covers every skin need. All original products, fast Bangladesh delivery.`,
    acne: `Combat breakouts with clinically tested, authentic acne skincare products. Shop COSRX, Some By Mi, La Roche-Posay Effaclar, and other proven acne solutions available in Bangladesh. From spot treatments and BHA exfoliants to oil-control moisturizers, find your complete acne routine at Emart.`,
    'eye-care': `Brighten, depuff, and firm the delicate eye area with authentic eye creams, serums, and patches available in Bangladesh. From COSRX and Laneige to Mizon and Neogen, our eye care collection targets dark circles, puffiness, fine lines, and crow's feet. All 100% original, with fast Bangladesh delivery and COD.`,
    'hair-care': `Find authentic hair care in Bangladesh at Emart — shampoos, conditioners, hair oils, treatments, and serums from global and Korean brands. From WishCare and TRESemmé to Pantene and OGX, find the right hair product for your hair type. Original imports, COD available.`,
    'body-lotion': `Nourish, hydrate, and soften your skin with authentic body lotions from leading global and Korean brands. From Vaseline and Nivea to CeraVe and The Derma Co, our body lotion range covers every skin need — brightening, deep moisture, repair, and daily care. Original imports, available in Bangladesh with COD.`,
    shampoo: `Find the right shampoo for your hair in Bangladesh — from anti-dandruff and hair fall control to moisturising and scalp care formulas. Shop authentic shampoos from TRESemmé, Dove, Head & Shoulders, WishCare, and more. Original products, fast delivery, COD available across Bangladesh.`,
    'japanese-beauty': `Explore authentic Japanese beauty and skincare in Bangladesh at Emart. From Hada Labo and Shiseido to Rohto and Fancl, our J-Beauty collection brings Japan's best skincare innovations — minimalist formulas, deep hydration, and time-tested ingredients — straight to your door with fast delivery and COD.`,
    'korean-beauty': `Discover authentic Korean skincare and beauty in Bangladesh at Emart. Shop K-Beauty essentials from COSRX, Some By Mi, Beauty of Joseon, ANUA, SKIN1004, and 100+ more Korean brands. From glass skin serums to cushion compacts and SPF sticks, find genuine Korean beauty products with fast Bangladesh delivery and COD.`,
    'lip-balm-care': `Shop authentic lip balm and lip care in Bangladesh at Emart. Hydrating lip balms, tinted lip treatments, and overnight lip masks from Vaseline, Innisfree, ROMAND, Laneige, and more. Original imports, fast delivery, COD available.`,
    'lip-care': `Shop authentic lip care in Bangladesh at Emart — lip balms, lip tints, lip sleeping masks, and lip scrubs from trusted Korean and global brands. ROMAND, 3CE, Laneige, Vaseline, Innisfree, and more. Original imports, fast delivery, COD available nationwide.`,
    lip: `Shop authentic lip care, lip balms, lip tints, and lipsticks in Bangladesh. From ROMAND and 3CE to Vaseline and Innisfree, our lip collection covers colour, moisture, and care. Original Korean, Japanese, and global lip products available with fast delivery and COD across Bangladesh.`,
    'body-wash': `Cleanse and refresh with authentic body washes and shower gels in Bangladesh. From The Ordinary and CeraVe to Dove and Cetaphil, our body wash range includes hydrating, exfoliating, brightening, and sensitive skin formulas. Original imports, fast delivery, COD available.`,
    'makeup-cosmetics': `Shop authentic makeup and cosmetics in Bangladesh at Emart. From Korean cushion compacts and lip tints to global brands like M.A.C, Essence, and NYX, our makeup collection covers foundation, eyes, lips, and face products. 100% original imports with fast Bangladesh delivery and Cash on Delivery available.`,
    'bath-body': `Discover authentic bath and body care products in Bangladesh at Emart. Shop body lotions, body washes, scrubs, hand creams, and personal care essentials from global and Korean brands — Vaseline, Dove, Nivea, CeraVe, and more. Original imports, fast nationwide delivery, COD available.`,
    'soothing-gel': `Shop authentic soothing gels in Bangladesh at Emart — aloe vera gels, centella asiatica gels, and calming formulas from Korean and global brands. From Nature Republic and PaxMoly to COSRX and Weleda, our soothing gel collection suits sensitive, acne-prone, and sun-exposed skin. Original imports, fast delivery, COD available.`,
    'eye-cream': `Brighten, depuff, and firm the delicate eye area with authentic eye creams in Bangladesh. Our eye cream range covers dark circles, puffiness, fine lines, and crow's feet — with original products from COSRX, Laneige, Mizon, Neogen, and more. All 100% authentic imports, fast Bangladesh delivery, COD available.`,
    'sheet-mask': `Treat your skin to a weekly boost with authentic sheet masks in Bangladesh. From Korean hydrogel and essence sheet masks to sleeping masks and overnight packs — Innisfree, COSRX, Leaders, and more. All original imports, fast Bangladesh delivery, Cash on Delivery available.`,
  };

  const key = Object.keys(intros).find(k => slug.includes(k) || name.toLowerCase().includes(k));
  if (key) return intros[key];

  return `Shop authentic ${name} products at Emart Skincare Bangladesh. We carry original ${name} products from Korea, Japan, and other global beauty brands, delivered across Bangladesh with careful support and Cash on Delivery available.`;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const page = getValidPage(searchParams.page);
  const priceParams = getPriceParams(searchParams.price);
  const sortParams = getSortParams(searchParams.sort);
  const categoryIds = [String(category.id)];

  const activeOrigin = getOriginByCountry(searchParams.origin);
  const activeOriginTerm = activeOrigin ? await getOriginTermBySlug(activeOrigin.country) : null;

  const activeConcern = searchParams.concern ? getConcernBySlug(searchParams.concern) : null;
  let concernSearch: string | undefined;
  if (activeConcern) {
    if (activeConcern.categorySlug) {
      const concernCategory = await getCategoryBySlug(activeConcern.categorySlug);
      if (concernCategory?.id) {
        categoryIds.push(String(concernCategory.id));
      } else {
        concernSearch = activeConcern.searchQuery;
      }
    } else {
      concernSearch = activeConcern.searchQuery;
    }
  }

  const activeIngredient = searchParams.ingredient ? getIngredientBySlug(searchParams.ingredient) : null;
  const ingredientSearch = activeIngredient?.searchKeywords[0];

  const skinTypeCategorySlug = searchParams.skin_type ? SKIN_TYPE_CATEGORY[searchParams.skin_type] : undefined;
  const skinTypeSearch = searchParams.skin_type && !skinTypeCategorySlug
    ? SKIN_TYPE_SEARCH[searchParams.skin_type]
    : undefined;
  if (skinTypeCategorySlug) {
    const skinTypeCategory = await getCategoryBySlug(skinTypeCategorySlug);
    if (skinTypeCategory?.id) categoryIds.push(String(skinTypeCategory.id));
  }

  const effectiveSearch = concernSearch ?? ingredientSearch ?? skinTypeSearch;
  const uniqueCategoryIds = Array.from(new Set(categoryIds));
  const isFilterActive = Boolean(activeConcern || activeIngredient || activeOriginTerm || skinTypeSearch || skinTypeCategorySlug);
  const effectiveSortParams = isFilterActive && !searchParams.sort
    ? { orderby: 'popularity' as const, order: 'desc' as const }
    : sortParams;

  const { products, total, totalPages } = await getProducts({
    category: uniqueCategoryIds.join(','),
    category_operator: uniqueCategoryIds.length > 1 ? 'and' : undefined,
    per_page: 24,
    page,
    search: effectiveSearch || undefined,
    ...effectiveSortParams,
    ...priceParams,
    stock_status: searchParams.in_stock === '1' ? 'instock' : undefined,
    attribute: activeOriginTerm ? 'pa_origin' : undefined,
    attribute_term: activeOriginTerm ? String(activeOriginTerm.id) : undefined,
  });

  if (page > 1 && page > totalPages) notFound();

  const rawDescription = 'description' in category ? (category as any).description || '' : '';
  const introText = getCategoryIntro(category.name, params.slug, rawDescription);
  const isSunscreen = params.slug === 'sunscreen';
  const quickPicks = CATEGORY_QUICK_PICKS[params.slug] ?? [];
  const showSkinType = quickPicks.some((p) => 'skin_type' in p.params);
  const showConcern  = quickPicks.some((p) => 'concern' in p.params);
  const showIngredient = quickPicks.some((p) => 'ingredient' in p.params);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://e-mart.com.bd' },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://e-mart.com.bd/shop' },
      { '@type': 'ListItem', position: 3, name: category.name, item: absoluteUrl(`/category/${category.slug}`) },
    ],
  };

  const canonicalUrl = getPaginatedCanonical(`/category/${category.slug}`, page);

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} — Emart`,
    description: introText.substring(0, 200),
    url: canonicalUrl,
    primaryImageOfPage: category.slug === 'face-cleansers'
      ? {
        '@type': 'ImageObject',
        url: absoluteUrl(FACE_CLEANSERS_SEO.image.path),
        width: FACE_CLEANSERS_SEO.image.width,
        height: FACE_CLEANSERS_SEO.image.height,
        caption: FACE_CLEANSERS_SEO.ogAlt,
      }
      : category.slug === 'toners-mists'
        ? {
          '@type': 'ImageObject',
          url: absoluteUrl(TONERS_MISTS_SEO.image.path),
          width: TONERS_MISTS_SEO.image.width,
          height: TONERS_MISTS_SEO.image.height,
          caption: TONERS_MISTS_SEO.ogAlt,
        }
        : category.slug === 'serums-ampoules-essences'
          ? {
            '@type': 'ImageObject',
            url: absoluteUrl(SERUMS_AMPOULES_ESSENCES_SEO.image.path),
            width: SERUMS_AMPOULES_ESSENCES_SEO.image.width,
            height: SERUMS_AMPOULES_ESSENCES_SEO.image.height,
            caption: SERUMS_AMPOULES_ESSENCES_SEO.ogAlt,
          }
          : undefined,
    breadcrumb: breadcrumbJsonLd,
  };

  const itemListJsonLd = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    url: canonicalUrl,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: (page - 1) * 24 + i + 1,
      name: p.name,
      url: `https://e-mart.com.bd/shop/${p.slug}`,
      image: p.images?.[0]?.src || undefined,
    })),
  } : null;

  const guideFaqs = page === 1 ? CATEGORY_GUIDE_FAQS[params.slug] : undefined;
  const faqJsonLd = guideFaqs ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guideFaqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionPageJsonLd) }} />
      {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }} />}
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />}

      <div className="mx-auto max-w-7xl px-4 py-8">

        <CollectionPageHeader
          type="category"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: category.name },
          ]}
          title={category.name}
          description={introText}
          productCount={total}
        />

        <CatalogFilters
          basePath={`/category/${params.slug}`}
          searchParams={searchParams}
          resultCount={products.length}
          totalCount={total}
          defaultSort="popularity"
          variant={process.env.NEXT_PUBLIC_FF_NAV_CONSOLIDATE === 'true' ? 'mobile-consolidated' : 'mobile'}
          showSkinType={showSkinType}
          showConcern={showConcern}
          showIngredient={showIngredient}
        />

        <div className="flex gap-6">
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <CatalogFilters
              basePath={`/category/${params.slug}`}
              searchParams={searchParams}
              resultCount={products.length}
              totalCount={total}
              defaultSort="popularity"
              variant="desktop"
              showSkinType={showSkinType}
              showConcern={showConcern}
              showIngredient={showIngredient}
            />
          </aside>

          <div className="flex-1">
            {/* PRODUCT GRID */}
            {products.length > 0 ? (
              <>
                <ProductListGrid>
                  {products.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      priority={i === 0 && page === 1}
                      imageAlt={params.slug === 'face-cleansers'
                        ? `${p.name} face cleanser or face wash price in Bangladesh at Emart`
                        : params.slug === 'toners-mists'
                          ? `${p.name} toner, face mist or essence price in Bangladesh at Emart`
                          : params.slug === 'serums-ampoules-essences'
                            ? `${p.name} serum, ampoule or essence price in Bangladesh at Emart`
                          : undefined}
                    />
                  ))}
                </ProductListGrid>

                <NumberedPagination
                  basePath={`/category/${params.slug}`}
                  currentPage={page}
                  totalPages={totalPages}
                  searchParams={searchParams}
                />

                {/* CATEGORY BUYING GUIDE */}
                <details className="mt-14 rounded-2xl border border-hairline bg-card p-5 shadow-card">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-ink marker:hidden">
                    Buying guide for {category.name}
                    <span className="ml-2 text-accent">Read more</span>
                  </summary>
                  {params.slug === 'face-cleansers' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">How to choose a face cleanser in Bangladesh</h2>
                        <p>
                          The right cleanser depends on your skin type and the season. In Dhaka&apos;s humid months,
                          oily skin usually needs a low-pH gel that removes sweat and sunscreen without leaving the
                          face tight. In cooler months, dry or sensitive skin often feels better with a cream, oil,
                          or low-foam wash. Choose by skin comfort first; brand and price come after.
                        </p>
                      </section>

                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">By skin type</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li>
                            <strong className="text-ink">Oily / acne-prone:</strong> choose a low-pH gel or gentle
                            BHA cleanser. COSRX Low pH Good Morning Gel Cleanser and COSRX Salicylic Acid Daily Gentle
                            Cleanser are reliable daily options.
                          </li>
                          <li>
                            <strong className="text-ink">Dry / sensitive:</strong> look for a low-foam, fragrance-free
                            cleanser that leaves skin comfortable, not squeaky. CeraVe Hydrating Foaming Oil Cleanser
                            and CeraVe Foaming Facial Cleanser are safer starting points.
                          </li>
                          <li>
                            <strong className="text-ink">Combination:</strong> use a balanced gel cleanser that can
                            handle an oily T-zone without drying the cheeks. Axis-Y Quinoa One Step Balanced Gel
                            Cleanser fits this kind of routine.
                          </li>
                          <li>
                            <strong className="text-ink">Sunscreen or makeup users:</strong> double cleanse at night:
                            oil or balm first, then a gentle foam or gel. Some By Mi Propolis B5 Oil-to-Foam Cleanser
                            works when you want one cleanser that can handle a heavier evening routine.
                          </li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">What to look for</h3>
                        <p>
                          A pH around 5-6 is usually kinder to the skin barrier. If your face feels tight after
                          washing, the cleanser is probably too stripping. For clogged pores,{' '}
                          <Link href="/ingredients/bha-salicylic-acid" className="text-accent hover:underline">salicylic acid (BHA)</Link>{' '}
                          can help. For easily irritated skin,{' '}
                          <Link href="/ingredients/centella" className="text-accent hover:underline">centella</Link>{' '}
                          and panthenol are calmer choices. Texture is personal: gel feels lighter in humidity, foam
                          feels fresh, and an{' '}
                          <Link href="/routine/oil-cleanser" className="text-accent hover:underline">oil or balm cleanser</Link>{' '}
                          is better for removing sunscreen and makeup.
                        </p>
                      </section>

                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          <div>
                            <h3 className="mb-1 text-sm font-semibold text-ink">অয়েলি ও ব্রণপ্রবণ ত্বকের জন্য কোন ফেসওয়াশ ভালো?</h3>
                            <p>
                              লো-পিএইচ জেল ক্লিনজার বা মৃদু BHA ক্লিনজার ভালো শুরু। COSRX Low pH Good Morning
                              বা COSRX Salicylic Acid Daily Gentle Cleanser ব্যবহার করতে পারেন। দিনে দুইবারের বেশি
                              ক্লিনজিং সাধারণত দরকার হয় না।
                            </p>
                          </div>
                          <div>
                            <h3 className="mb-1 text-sm font-semibold text-ink">শুষ্ক ত্বকে কি ফোমিং ক্লিনজার ব্যবহার করা যায়?</h3>
                            <p>
                              যায়, তবে fragrance-free ও hydrating formula বেছে নিন। ধোয়ার পর ত্বক টানটান লাগলে
                              সেটি আপনার জন্য বেশি stripping হতে পারে।
                            </p>
                          </div>
                          <div>
                            <h3 className="mb-1 text-sm font-semibold text-ink">ডাবল ক্লিনজিং কখন দরকার?</h3>
                            <p>
                              sunscreen, makeup, বা heavy outdoor exposure থাকলে রাতে আগে oil/balm cleanser, এরপর
                              gentle foam বা gel cleanser ব্যবহার করলেই যথেষ্ট।
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                  ) : isSunscreen ? (
                    <div className="mt-4 space-y-5">
                    <div className="grid gap-5 text-sm leading-relaxed text-muted sm:grid-cols-2">
                      <div>
                        <h2 className="mb-1 text-sm font-semibold text-ink">Why You Need Sunscreen Every Day in Bangladesh</h2>
                        <p>Bangladesh sits close to the equator, meaning UV rays are strong year-round — not just in summer. Daily sun exposure without a broad-spectrum SPF 50+ sunscreen accelerates skin ageing, causes dark spots, and raises the risk of sunburn even on cloudy days. Applying sunscreen as the last step of your morning routine takes 30 seconds and is the single most effective anti-ageing step you can take.</p>
                      </div>
                      <div>
                        <h2 className="mb-1 text-sm font-semibold text-ink">SPF, PA Rating &amp; Broad-Spectrum — What They Mean</h2>
                        <p>SPF measures protection against UVB rays (the ones that cause sunburn). PA++++ indicates very strong protection against UVA rays (the ones that cause ageing and penetrate clouds). Look for &quot;broad-spectrum&quot; on the label — it means both UVA and UVB are covered. For Bangladesh&apos;s high UV index, choose minimum SPF 50 PA+++ or higher outdoors.</p>
                      </div>
                      <div>
                        <h2 className="mb-1 text-sm font-semibold text-ink">How to Apply Sunscreen for Full Protection</h2>
                        <p>Apply sunscreen generously 15 minutes before going outdoors — most people use too little and get only 20–40% of the stated SPF. Reapply every 2 hours when outdoors, and after swimming or sweating. Even water-resistant formulas need reapplication. For daily indoor use one morning application is usually enough, but always reapply if you spend time in direct sunlight or near windows.</p>
                      </div>
                      <div>
                        <h2 className="mb-1 text-sm font-semibold text-ink">Choosing the Right Sunscreen for Your Skin Type</h2>
                        <p>Oily and acne-prone skin does best with lightweight gel or fluid formulas — Korean sunscreens like <Link href="/brands/cosrx" className="text-accent hover:underline">COSRX</Link>, <Link href="/brands/beauty-of-joseon" className="text-accent hover:underline">Beauty of Joseon</Link>, and <Link href="/brands/isntree" className="text-accent hover:underline">ISNTREE</Link> offer non-greasy options that don&apos;t clog pores. Dry skin benefits from hydrating cream sunscreens. Sensitive skin can rely on mineral or hybrid formulas with zinc oxide. All sunscreens at Emart are 100% authentic imports — no fakes, no expired stock.</p>
                      </div>
                    </div>
                    <section className="text-sm leading-relaxed text-muted">
                      <h2 className="mb-2 text-base font-semibold text-ink">Sunscreen FAQ</h2>
                      <div className="space-y-3">
                        {(CATEGORY_GUIDE_FAQS['sunscreen'] ?? []).map((f) => (
                          <div key={f.q}>
                            <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                            <p>{f.a}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                    </div>
                  ) : params.slug === 'toners-mists' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">How to choose a toner in Bangladesh</h2>
                        <p>
                          A <Link href="/routine/toner" className="text-accent hover:underline">toner</Link> comes
                          right after cleansing. It rebalances skin pH and preps the next steps so your serum and
                          moisturiser absorb better. In Dhaka&apos;s humidity, a lightweight hydrating toner is enough
                          for most days; oily and clog-prone skin can use an exfoliating toner a few nights a week.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">Hydrating vs exfoliating</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li>
                            <strong className="text-ink">Hydrating:</strong> look for{' '}
                            <Link href="/ingredients/hyaluronic-acid" className="text-accent hover:underline">hyaluronic acid</Link>,
                            heartleaf, or rice — safe for daily use on dry and sensitive skin.
                          </li>
                          <li>
                            <strong className="text-ink">Exfoliating:</strong>{' '}
                            <Link href="/ingredients/aha" className="text-accent hover:underline">AHA</Link> for dullness and{' '}
                            <Link href="/ingredients/bha-salicylic-acid" className="text-accent hover:underline">BHA (salicylic acid)</Link>{' '}
                            for clogged pores — use 2–3 nights a week, not daily.
                          </li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">When to use it</h3>
                        <p>
                          Apply straight after your{' '}
                          <Link href="/routine/cleanser" className="text-accent hover:underline">cleanser</Link>, before serum.
                          Press into the skin with your hands or a cotton pad. Keep exfoliating toners for the evening.
                        </p>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['toners-mists'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'serums-ampoules-essences' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">Serum, ampoule or essence — which to pick</h2>
                        <p>
                          Essences are the lightest and most hydration-focused; serums are more concentrated and target
                          a concern; ampoules are the strongest, for short intensive boosts. A{' '}
                          <Link href="/routine/treatment" className="text-accent hover:underline">treatment step</Link>{' '}
                          sits after toner and before moisturiser.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">Choose by skin concern</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li>
                            <strong className="text-ink">Brightening / dark spots:</strong>{' '}
                            <Link href="/ingredients/vitamin-c" className="text-accent hover:underline">vitamin C</Link> or{' '}
                            <Link href="/ingredients/niacinamide" className="text-accent hover:underline">niacinamide</Link> — see{' '}
                            <Link href="/concerns/brightening" className="text-accent hover:underline">brightening</Link>.
                          </li>
                          <li>
                            <strong className="text-ink">Hydration:</strong>{' '}
                            <Link href="/ingredients/hyaluronic-acid" className="text-accent hover:underline">hyaluronic acid</Link> for
                            plump, dewy skin in any season.
                          </li>
                          <li>
                            <strong className="text-ink">Anti-ageing:</strong>{' '}
                            <Link href="/ingredients/retinol" className="text-accent hover:underline">retinol</Link> at night — see{' '}
                            <Link href="/concerns/anti-aging-repair" className="text-accent hover:underline">anti-ageing &amp; repair</Link>.
                          </li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">Applying in Bangladesh&apos;s climate</h3>
                        <p>
                          In humidity, thinner textures sit better — apply lightest first and wait a moment between
                          layers. Limit actives to 2–3 per routine and avoid pairing retinol with vitamin C in the same
                          session.
                        </p>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['serums-ampoules-essences'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'korean-beauty' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">What makes Korean skincare different</h2>
                        <p>
                          K-beauty focuses on gentle, layered hydration and ingredient innovation rather than harsh
                          quick fixes. You don&apos;t need ten steps — build around a few well-chosen products and adapt
                          them to Bangladesh&apos;s heat and humidity.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">How to start a routine</h3>
                        <p>
                          Begin with four steps:{' '}
                          <Link href="/routine/cleanser" className="text-accent hover:underline">cleanser</Link>,{' '}
                          <Link href="/routine/toner" className="text-accent hover:underline">toner</Link>,{' '}
                          <Link href="/routine/moisturiser" className="text-accent hover:underline">moisturiser</Link>, and{' '}
                          <Link href="/routine/sunscreen" className="text-accent hover:underline">sunscreen</Link>. Add a{' '}
                          <Link href="/routine/treatment" className="text-accent hover:underline">serum</Link> once your skin needs it.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">Popular Korean brands at Emart</h3>
                        <p>
                          <Link href="/brands/cosrx" className="text-accent hover:underline">COSRX</Link>,{' '}
                          <Link href="/brands/beauty-of-joseon" className="text-accent hover:underline">Beauty of Joseon</Link>,{' '}
                          <Link href="/brands/skin1004" className="text-accent hover:underline">SKIN1004</Link>, and{' '}
                          <Link href="/brands/anua" className="text-accent hover:underline">Anua</Link> are among the most
                          asked-for K-beauty names — all imported authentic.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">K-beauty by concern</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li>
                            <strong className="text-ink">Acne:</strong> gentle{' '}
                            <Link href="/ingredients/centella" className="text-accent hover:underline">centella</Link> formulas — see{' '}
                            <Link href="/concerns/acne-blemish-care" className="text-accent hover:underline">acne &amp; blemish care</Link>.
                          </li>
                          <li>
                            <strong className="text-ink">Hydration:</strong>{' '}
                            <Link href="/ingredients/snail-mucin" className="text-accent hover:underline">snail mucin</Link> essences — see{' '}
                            <Link href="/concerns/dryness-hydration" className="text-accent hover:underline">dryness &amp; hydration</Link>.
                          </li>
                          <li>
                            <strong className="text-ink">Anti-ageing:</strong> peptide and retinol serums — see{' '}
                            <Link href="/concerns/anti-aging-repair" className="text-accent hover:underline">anti-ageing &amp; repair</Link>.
                          </li>
                        </ul>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['korean-beauty'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'bath-body' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">Body care basics for Bangladesh&apos;s climate</h2>
                        <p>
                          Heat, humidity, and sun exposure are hard on skin below the neck too. A gentle wash plus
                          regular hydration keeps the body&apos;s skin barrier comfortable through monsoon and dry season
                          alike.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">Body wash vs body lotion</h3>
                        <p>
                          A mild{' '}
                          <Link href="/category/body-wash" className="text-accent hover:underline">body wash</Link>{' '}
                          cleans without stripping; a{' '}
                          <Link href="/category/body-lotion" className="text-accent hover:underline">body lotion</Link>{' '}
                          locks in moisture afterwards. Dry skin benefits from both — wash gently, then moisturise while
                          skin is still slightly damp. See{' '}
                          <Link href="/concerns/dryness-hydration" className="text-accent hover:underline">dryness &amp; hydration</Link>.
                        </p>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['bath-body'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'lips' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">Choosing lip products</h2>
                        <p>
                          Start with care, then colour. A nourishing{' '}
                          <Link href="/category/lip-balm-care" className="text-accent hover:underline">lip balm</Link>{' '}
                          keeps lips soft so a{' '}
                          <Link href="/category/lipstick-tint" className="text-accent hover:underline">lipstick or tint</Link>{' '}
                          applies smoothly without flaking. Build a simple{' '}
                          <Link href="/routine/lip-care" className="text-accent hover:underline">lip care routine</Link>{' '}
                          first.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">Lips in Bangladesh&apos;s climate</h3>
                        <p>
                          Dry air, dehydration, and lip-licking are the usual causes of chapped lips. Use a hydrating
                          balm through the day and a richer mask at night.
                        </p>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['lips'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'shampoos' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">How to choose a shampoo in Bangladesh</h2>
                        <p>
                          In Dhaka&apos;s heat and humidity, the scalp sweats more and produces extra oil. A shampoo that
                          cleans well without over-stripping is the goal. Match the shampoo to your scalp condition, not
                          just your hair type — oily scalp with dry ends is common and needs a balanced formula.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">By hair concern</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li><strong className="text-ink">Oily scalp:</strong> clarifying or tea-tree shampoo 1–2 times a week, gentle shampoo on other days.</li>
                          <li><strong className="text-ink">Dry / damaged:</strong> sulfate-free, keratin, or argan-oil shampoo to retain moisture and reduce breakage.</li>
                          <li><strong className="text-ink">Dandruff:</strong> look for zinc pyrithione, salicylic acid, or ketoconazole. Use consistently for 4–6 weeks before judging results.</li>
                          <li><strong className="text-ink">Colour-treated:</strong> sulfate-free shampoo preserves colour vibrancy. Wash less frequently — every other day is enough.</li>
                          <li><strong className="text-ink">Hair fall:</strong> a gentle shampoo with biotin, caffeine, or{' '}
                            <Link href="/ingredients/centella" className="text-accent hover:underline">centella</Link>{' '}
                            can help support scalp health. Pair with a{' '}
                            <Link href="/category/hair-treatments" className="text-accent hover:underline">scalp treatment</Link>.
                          </li>
                        </ul>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['shampoos'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'face-masks' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">Face mask guide for Bangladesh</h2>
                        <p>
                          Face masks give your skin an extra boost that daily cleanser and moisturiser alone cannot.
                          Korean{' '}
                          <Link href="/category/korean-beauty" className="text-accent hover:underline">K-beauty</Link>{' '}
                          popularised sheet masks, but wash-off and overnight masks are equally useful. The key is
                          choosing the right type for your concern and not over-using.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">By type</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li><strong className="text-ink">Sheet mask:</strong> serum-soaked fabric for 15–20 minutes. Hydration, brightening, or calming — choose by ingredient. No rinsing needed.</li>
                          <li><strong className="text-ink">Clay / mud mask:</strong> deep-cleanses pores and absorbs excess oil. Best for oily and combination skin, 1–2 times a week.</li>
                          <li><strong className="text-ink">Wash-off cream mask:</strong> gentler than clay, often nourishing. Good for dry or sensitive skin.</li>
                          <li><strong className="text-ink">Sleeping mask:</strong> a richer overnight treatment — apply as the last step of your PM routine and wash off in the morning.</li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">When to mask</h3>
                        <p>
                          After cleansing and{' '}
                          <Link href="/category/toners-mists" className="text-accent hover:underline">toner</Link>,
                          before moisturiser. In Bangladesh&apos;s humid months, a cooling sheet mask or lightweight gel
                          mask feels comfortable. In drier months, try a cream or sleeping mask for extra moisture.
                        </p>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['face-masks'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'eye-care' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">Eye care guide</h2>
                        <p>
                          The skin around the eyes is thinner than the rest of the face and shows fatigue, ageing, and
                          dehydration first. Dark circles, puffiness, and fine lines are the most common concerns. A
                          dedicated eye product addresses these without irritating the delicate area.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">By concern</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li><strong className="text-ink">Dark circles:</strong> vitamin C, niacinamide, or caffeine-based eye creams help brighten gradually. Consistency matters more than intensity.</li>
                          <li><strong className="text-ink">Puffiness:</strong> caffeine-infused eye serums reduce morning puffiness. Keep your eye cream in the fridge for an extra de-puffing effect.</li>
                          <li><strong className="text-ink">Fine lines:</strong> retinol eye creams (low strength) or peptide-rich formulas improve texture over weeks. Always use{' '}
                            <Link href="/category/sunscreen" className="text-accent hover:underline">sunscreen</Link>{' '}
                            during the day.</li>
                          <li><strong className="text-ink">General hydration:</strong>{' '}
                            <Link href="/ingredients/hyaluronic-acid" className="text-accent hover:underline">hyaluronic acid</Link>{' '}
                            or ceramide eye creams keep the area plump without heaviness.</li>
                        </ul>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['eye-care'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'cream-moisturizer' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">How to choose a moisturiser in Bangladesh</h2>
                        <p>
                          Moisturiser is the step that locks in everything before it — toner,{' '}
                          <Link href="/category/serums-ampoules-essences" className="text-accent hover:underline">serum</Link>,
                          and treatments. In Dhaka&apos;s humid weather, many people skip it, but even oily skin needs
                          hydration. The trick is matching the texture to your skin and the season.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">By skin type</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li><strong className="text-ink">Oily:</strong> lightweight gel or water-based moisturiser that absorbs fast without shine. Oil-free and non-comedogenic on the label.</li>
                          <li><strong className="text-ink">Dry:</strong> richer cream with ceramides, shea butter, or squalane. Night creams are typically heavier and repair the skin barrier overnight.</li>
                          <li><strong className="text-ink">Combination:</strong> a medium-weight lotion or gel-cream that hydrates cheeks without making the T-zone oily.</li>
                          <li><strong className="text-ink">Sensitive:</strong> fragrance-free, minimal-ingredient formula with ceramides or{' '}
                            <Link href="/ingredients/centella" className="text-accent hover:underline">centella</Link>.
                            CeraVe and COSRX are reliable starting points.</li>
                        </ul>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['cream-moisturizer'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'makeup-remover' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">Makeup remover guide</h2>
                        <p>
                          Removing makeup properly is the foundation of healthy skin. Leaving makeup, sunscreen, or
                          dirt overnight clogs pores, causes breakouts, and dulls the complexion. A good makeup
                          remover lifts everything gently so your{' '}
                          <Link href="/category/face-cleansers" className="text-accent hover:underline">face cleanser</Link>{' '}
                          can do its job effectively — this is the first step of double cleansing.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">By type</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li><strong className="text-ink">Micellar water:</strong> gentle, no-rinse option for light makeup and sunscreen. Swipe with a cotton pad.</li>
                          <li><strong className="text-ink">Cleansing oil:</strong> dissolves heavy makeup, waterproof mascara, and stubborn sunscreen. Emulsifies with water and rinses clean.</li>
                          <li><strong className="text-ink">Cleansing balm:</strong> solid-to-oil texture, same power as cleansing oil but less messy. Good for travel.</li>
                          <li><strong className="text-ink">Cleansing water / toner pads:</strong> pre-soaked pads for quick cleansing on busy nights or while travelling.</li>
                        </ul>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['makeup-remover'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'body-wash' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">Body wash guide for Bangladesh</h2>
                        <p>
                          In Bangladesh&apos;s hot and humid climate, you shower at least once a day. A good body wash
                          cleans sweat, dirt, and sunscreen without stripping the skin&apos;s natural moisture. It should
                          leave the body clean but not tight or itchy.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">Choosing the right body wash</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li><strong className="text-ink">Normal / oily skin:</strong> a refreshing gel body wash with a clean finish.</li>
                          <li><strong className="text-ink">Dry skin:</strong> cream-based body wash with moisturising ingredients like shea butter, ceramides, or glycerin. Follow with{' '}
                            <Link href="/category/body-lotion" className="text-accent hover:underline">body lotion</Link>{' '}
                            while skin is still damp.</li>
                          <li><strong className="text-ink">Sensitive / eczema-prone:</strong> fragrance-free, soap-free formula. CeraVe and Cetaphil body washes are dermatologist-recommended.</li>
                          <li><strong className="text-ink">Acne on body:</strong> salicylic acid or benzoyl peroxide body wash on affected areas (back, chest), then rinse off. Use only on those zones.</li>
                        </ul>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['body-wash'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : params.slug === 'foundation' ? (
                    <div className="mt-4 space-y-5 text-sm leading-relaxed text-muted">
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">Foundation guide for Bangladesh</h2>
                        <p>
                          Foundation evens out skin tone and gives a polished base for the rest of your makeup. In
                          Bangladesh&apos;s heat, the right foundation stays put without melting or caking. The two
                          decisions that matter most: the correct shade and the right finish for your skin type.
                        </p>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">By finish</h3>
                        <ul className="list-disc space-y-2 pl-5">
                          <li><strong className="text-ink">Matte:</strong> oil-free, controls shine — best for oily skin and hot weather. Set with{' '}
                            <Link href="/category/setting-spray" className="text-accent hover:underline">setting spray</Link>{' '}
                            for all-day wear.</li>
                          <li><strong className="text-ink">Dewy / radiant:</strong> adds a glow — best for dry or mature skin. Can look too shiny on oily skin in humidity.</li>
                          <li><strong className="text-ink">Satin / natural:</strong> a balanced middle ground that works for most skin types and looks skin-like.</li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">Coverage levels</h3>
                        <p>
                          Sheer coverage lets skin show through and feels lightest — good for everyday wear. Medium
                          coverage hides redness and uneven tone. Full coverage conceals acne scars and
                          hyperpigmentation but needs careful blending to look natural. Start lighter and build up.
                        </p>
                      </section>
                      <section>
                        <h2 className="mb-2 text-base font-semibold text-ink">সচরাচর জিজ্ঞাসা</h2>
                        <div className="space-y-3">
                          {(CATEGORY_GUIDE_FAQS['foundation'] ?? []).map((f) => (
                            <div key={f.q}>
                              <h3 className="mb-1 text-sm font-semibold text-ink">{f.q}</h3>
                              <p>{f.a}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : (
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
                      Emart is Bangladesh&apos;s trusted source for authentic {category.name} products. Every product is imported directly from the brand or authorised distributors — no counterfeits, no grey market. We offer Cash on Delivery (COD) across Bangladesh. {STORE_POLICIES.shipping.pdpDeliveryText}. {STORE_POLICIES.shipping.checkoutFeeText}
                    </p>
                  )}
                </details>
              </>
            ) : (
              <div className="py-20 text-center text-muted-2">
                <p className="text-ink">No products in this category yet.</p>
                <Link href="/shop" className="mt-2 block text-accent hover:underline">Browse All Products</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
