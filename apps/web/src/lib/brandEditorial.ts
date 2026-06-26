// Editorial content for Tier-1 brand pages (USEO-6).
// Additive: brand pages without an entry fall back to the existing generic copy.
// Keep claims factual and measured. Concern/ingredient links must be canonical 200 pages.
// FAQ answers are plain text (schema-safe). Mixed Bangla/English matches buyer search patterns.

export interface BrandEditorial {
  /** 70-120 words: origin, what the brand is known for, Emart authenticity. */
  about: string;
  /** Contextual links to concern/ingredient pages this brand is relevant to. */
  links?: { label: string; href: string }[];
  /** 2-3 genuine, brand-specific Q&A. Drives FAQPage schema + visible FAQ. */
  faqs?: { q: string; a: string }[];
}

export const BRAND_EDITORIAL: Record<string, BrandEditorial> = {
  cosrx: {
    about:
      'COSRX is a South Korean skincare brand known for effective, no-frills formulas built around a single hero ingredient. The name combines "Cosmetics" with "RX", reflecting a treatment-led approach at an accessible price. COSRX became one of the most recognised K-beauty names worldwide through its snail mucin essence and low-pH gel cleanser. At Emart we carry authentic COSRX imported directly from South Korea, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Snail mucin', href: '/ingredients/snail-mucin' },
      { label: 'Acne & blemish care', href: '/concerns/acne-blemish-care' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
    ],
    faqs: [
      { q: 'COSRX কি Emart-এ অরিজিনাল?', a: 'হ্যাঁ — COSRX সরাসরি South Korea থেকে import করা, ১০০% authentic। কোনো নকল বা grey-market product নয়, সারা বাংলাদেশে COD সহ ডেলিভারি।' },
      { q: 'COSRX দিয়ে কোথা থেকে শুরু করব?', a: 'Low pH Good Morning Gel Cleanser আর Advanced Snail 96 Mucin Power Essence — এই দুটি সবচেয়ে জনপ্রিয় starter combo, প্রায় সব স্কিন টাইপে চলে।' },
    ],
  },
  'beauty-of-joseon': {
    about:
      'Beauty of Joseon is a South Korean brand that blends traditional hanbang (Korean herbal) ingredients like rice, ginseng, and propolis with modern, lightweight textures. It is especially loved for its Relief Sun rice + probiotics sunscreen and glow-giving serums. At Emart, every Beauty of Joseon product is authentic and imported directly, with Cash on Delivery nationwide.',
    links: [
      { label: 'Ginseng', href: '/ingredients/ginseng' },
      { label: 'Brightening', href: '/concerns/brightening' },
      { label: 'Sunscreen', href: '/concerns/sunscreen' },
    ],
    faqs: [
      { q: 'Beauty of Joseon-এর কোন product সবচেয়ে জনপ্রিয়?', a: 'Relief Sun: Rice + Probiotics sunscreen আর Glow Serum: Propolis + Niacinamide — দুটিই বাংলাদেশে খুব চাহিদাসম্পন্ন।' },
      { q: 'এটি কি সংবেদনশীল ত্বকে ব্যবহার করা যায়?', a: 'বেশিরভাগ formula মৃদু ও hanbang-ভিত্তিক, তবে নতুন product হলে আগে patch test করে নিন।' },
    ],
  },
  cerave: {
    about:
      'CeraVe is an American dermatologist-developed brand built around three essential ceramides and hyaluronic acid to restore and protect the skin barrier. Its fragrance-free cleansers and moisturisers are widely recommended for dry, sensitive, and acne-prone skin. At Emart, CeraVe is 100% authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Ceramides', href: '/ingredients/ceramide' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
    ],
    faqs: [
      { q: 'CeraVe কি বাংলাদেশের আবহাওয়ার জন্য ভালো?', a: 'হ্যাঁ — Foaming Cleanser তৈলাক্ত ত্বকে আর Hydrating Cleanser/Moisturising Cream শুষ্ক ত্বকে আর্দ্রতা ধরে রাখে। সারা বছরই ব্যবহারযোগ্য।' },
      { q: 'CeraVe কি ব্রণপ্রবণ ত্বকে নিরাপদ?', a: 'বেশিরভাগ formula non-comedogenic ও fragrance-free, তাই sensitive ও acne-prone ত্বকের জন্য উপযোগী।' },
    ],
  },
  skin1004: {
    about:
      'SKIN1004 is a South Korean brand best known for its Madagascar Centella line — single-origin centella asiatica sourced for calming, barrier-soothing care. Its Centella Ampoule and Light Cleansing Oil are staples for sensitive and blemish-prone skin. At Emart, SKIN1004 is authentic and imported directly, with Cash on Delivery nationwide.',
    links: [
      { label: 'Centella', href: '/ingredients/centella' },
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
      { label: 'Acne & blemish care', href: '/concerns/acne-blemish-care' },
    ],
    faqs: [
      { q: 'SKIN1004 কোন ত্বকের জন্য সবচেয়ে ভালো?', a: 'সংবেদনশীল, লালচে ভাব ও ব্রণপ্রবণ ত্বকের জন্য — Madagascar Centella line ত্বক শান্ত করতে সাহায্য করে।' },
      { q: 'Centella Ampoule কীভাবে ব্যবহার করব?', a: 'টোনারের পর কয়েক ফোঁটা মুখে লাগিয়ে আলতো করে চেপে নিন, এরপর moisturiser ও দিনের বেলা sunscreen দিন।' },
    ],
  },
  'the-ordinary': {
    about:
      'The Ordinary is a Canadian brand from DECIEM that made clinical, single-ingredient skincare affordable and transparent. It is known for clearly named actives like Niacinamide 10% + Zinc, Hyaluronic Acid, and Retinol, letting you target one concern at a time. At Emart, The Ordinary is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Niacinamide', href: '/ingredients/niacinamide' },
      { label: 'Hyaluronic acid', href: '/ingredients/hyaluronic-acid' },
      { label: 'Brightening', href: '/concerns/brightening' },
    ],
    faqs: [
      { q: 'The Ordinary দিয়ে কোথা থেকে শুরু করব?', a: 'একটি concern বেছে নিন — যেমন pores ও oil control-এর জন্য Niacinamide 10% + Zinc, hydration-এর জন্য Hyaluronic Acid 2% + B5। একসাথে অনেক active মেশাবেন না।' },
      { q: 'একসাথে কয়টি The Ordinary product ব্যবহার করা যায়?', a: 'শুরুতে ১–2টি যথেষ্ট। Retinol রাতে, Vitamin C সকালে রাখুন এবং একসাথে strong active মেশানো এড়িয়ে চলুন।' },
    ],
  },
  'round-lab': {
    about:
      'Round Lab is a South Korean brand focused on mild, minimal-ingredient formulas, most famous for its Dokdo line made with deep-sea water from Korea. Its 1025 Dokdo Toner and Birch Juice moisturisers suit sensitive and dehydrated skin. At Emart, Round Lab is authentic and imported directly, with Cash on Delivery nationwide.',
    links: [
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
      { label: 'Hyaluronic acid', href: '/ingredients/hyaluronic-acid' },
    ],
    faqs: [
      { q: 'Round Lab Dokdo Toner কেন এত জনপ্রিয়?', a: 'মৃদু, কম উপাদানের formula যা ত্বকে আর্দ্রতা যোগ করে জ্বালা না করে — সংবেদনশীল ত্বকেও প্রতিদিন ব্যবহারযোগ্য।' },
      { q: 'Round Lab কি তৈলাক্ত ত্বকে চলবে?', a: 'হ্যাঁ — হালকা টেক্সচারের কারণে তৈলাক্ত ও কম্বিনেশন ত্বকেও আরামদায়ক।' },
    ],
  },
  innisfree: {
    about:
      'Innisfree is an established South Korean brand built on naturally derived ingredients from Jeju Island, such as green tea and volcanic clay. It offers a broad range from cleansers and toners to the well-loved Green Tea Seed Serum. At Emart, Innisfree is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Pores & oil control', href: '/concerns/pores-oil-control' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
    ],
    faqs: [
      { q: 'Innisfree Green Tea line কাদের জন্য?', a: 'হাইড্রেশন ও antioxidant যত্নের জন্য — বেশিরভাগ স্কিন টাইপে, বিশেষ করে স্বাভাবিক থেকে কম্বিনেশন ত্বকে ভালো।' },
      { q: 'Volcanic clay product কি তৈলাক্ত ত্বকের জন্য?', a: 'হ্যাঁ — Jeju volcanic clay অতিরিক্ত তেল ও clogged pores নিয়ন্ত্রণে সাহায্য করে।' },
    ],
  },
  'some-by-mi': {
    about:
      'Some By Mi is a South Korean brand popular for targeted problem-skin care, led by its AHA-BHA-PHA 30 Days Miracle range. Its toners, serums, and cleansers focus on gentle exfoliation and blemish control. At Emart, Some By Mi is authentic and imported directly, with Cash on Delivery nationwide.',
    links: [
      { label: 'AHA', href: '/ingredients/aha' },
      { label: 'BHA (salicylic acid)', href: '/ingredients/bha-salicylic-acid' },
      { label: 'Acne & blemish care', href: '/concerns/acne-blemish-care' },
    ],
    faqs: [
      { q: 'AHA-BHA-PHA 30 Days Miracle Toner কীভাবে ব্যবহার করব?', a: 'শুরুতে সপ্তাহে ৩–4 রাত ব্যবহার করুন, ত্বক মানিয়ে নিলে বাড়ান। দিনে অবশ্যই sunscreen দিন, কারণ exfoliating product ত্বককে রোদে সংবেদনশীল করে।' },
      { q: 'এটি কি সংবেদনশীল ত্বকে নিরাপদ?', a: 'মৃদু exfoliation হলেও সংবেদনশীল ত্বকে কম মাত্রায় শুরু করুন এবং patch test করুন।' },
    ],
  },
  anua: {
    about:
      'Anua is a fast-growing South Korean brand known for heartleaf (Houttuynia cordata) based calming care and its popular PDRN and Niacinamide serums. Formulas focus on soothing redness and supporting a clear, balanced complexion. At Emart, Anua is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Niacinamide', href: '/ingredients/niacinamide' },
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
      { label: 'Brightening', href: '/concerns/brightening' },
    ],
    faqs: [
      { q: 'Anua Heartleaf line কাদের জন্য?', a: 'লালচে ভাব, জ্বালা ও ব্রণপ্রবণ সংবেদনশীল ত্বকের জন্য — heartleaf ত্বক শান্ত করতে সাহায্য করে।' },
      { q: 'Anua-এর কোন serum দিয়ে শুরু করব?', a: 'Brightening-এর জন্য Niacinamide serum, আর হাইড্রেশন ও glow-এর জন্য PDRN serum জনপ্রিয় পছন্দ।' },
    ],
  },
  neutrogena: {
    about:
      'Neutrogena is an American brand recommended by dermatologists for over decades, offering trusted cleansers, hydrating gels, and sunscreens. It is a dependable mass-market choice for everyday skincare. At Emart, Neutrogena is authentic and imported directly, with Cash on Delivery nationwide.',
    links: [
      { label: 'Hyaluronic acid', href: '/ingredients/hyaluronic-acid' },
      { label: 'Sunscreen', href: '/concerns/sunscreen' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
    ],
    faqs: [
      { q: 'Neutrogena Hydro Boost কাদের জন্য?', a: 'হালকা, water-gel টেক্সচারের কারণে স্বাভাবিক থেকে তৈলাক্ত ত্বকে দ্রুত হাইড্রেশনের জন্য ভালো।' },
      { q: 'Neutrogena sunscreen কি প্রতিদিন ব্যবহার করা যায়?', a: 'হ্যাঁ — broad-spectrum SPF প্রতিদিন সকালের শেষ ধাপে ব্যবহার করুন, বাইরে থাকলে প্রতি ২ ঘণ্টায় পুনরায় দিন।' },
    ],
  },
  laneige: {
    about:
      'Laneige is a South Korean brand from Amorepacific built around water science and hydration, famous worldwide for its Lip Sleeping Mask and Water Bank line. It suits those wanting dewy, well-hydrated skin. At Emart, Laneige is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
      { label: 'Hyaluronic acid', href: '/ingredients/hyaluronic-acid' },
    ],
    faqs: [
      { q: 'Laneige Lip Sleeping Mask কীভাবে ব্যবহার করব?', a: 'রাতে ঘুমানোর আগে ঠোঁটে একটি পাতলা স্তর লাগিয়ে রাখুন; সকালে ঠোঁট নরম ও আর্দ্র থাকবে।' },
      { q: 'Water Bank line কাদের জন্য?', a: 'শুষ্ক ও ডিহাইড্রেটেড ত্বকের জন্য — তবে হালকা formula তৈলাক্ত ত্বকেও ব্যবহারযোগ্য।' },
    ],
  },
  medicube: {
    about:
      'Medicube is a South Korean brand pairing dermatology-inspired skincare with at-home beauty devices. It is known for its Zero pore and PDRN ranges aimed at clearer texture and firmer-looking skin. At Emart, Medicube is authentic and imported directly, with Cash on Delivery nationwide.',
    links: [
      { label: 'Pores & oil control', href: '/concerns/pores-oil-control' },
      { label: 'Anti-ageing & repair', href: '/concerns/anti-aging-repair' },
    ],
    faqs: [
      { q: 'Medicube Zero line কাদের জন্য?', a: 'বড় pores, অতিরিক্ত তেল ও অমসৃণ texture নিয়ন্ত্রণে আগ্রহীদের জন্য উপযোগী।' },
      { q: 'Medicube কি authentic?', a: 'হ্যাঁ — সরাসরি import করা ১০০% original Medicube, সারা বাংলাদেশে COD সহ ডেলিভারি।' },
    ],
  },
  'dr-althea': {
    about:
      'Dr. Althea is a South Korean brand offering derma-focused, value-driven skincare. It is known for its 345 Relief Cream and barrier-supporting moisturisers for stressed, sensitive skin. At Emart, Dr. Althea is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
    ],
    faqs: [
      { q: 'Dr. Althea 345 Relief Cream কাদের জন্য?', a: 'শুষ্ক, সংবেদনশীল ও barrier-দুর্বল ত্বকের জন্য — গভীর আর্দ্রতা ও আরাম দেয়।' },
      { q: 'এটি কি প্রতিদিন ব্যবহার করা যায়?', a: 'হ্যাঁ — সকালে ও রাতে moisturiser হিসেবে ব্যবহারযোগ্য, দিনের বেলা উপরে sunscreen দিন।' },
    ],
  },
  isntree: {
    about:
      'ISNTREE is a South Korean brand with an ingredient-first philosophy, best known for its Hyaluronic Acid Toner and lightweight, hydrating sun and serum formulas. It suits those who want simple, effective hydration. At Emart, ISNTREE is authentic and imported directly, with Cash on Delivery nationwide.',
    links: [
      { label: 'Hyaluronic acid', href: '/ingredients/hyaluronic-acid' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
      { label: 'Sunscreen', href: '/concerns/sunscreen' },
    ],
    faqs: [
      { q: 'ISNTREE Hyaluronic Acid Toner কীভাবে কাজ করে?', a: 'একাধিক আণবিক ওজনের hyaluronic acid ত্বকের বিভিন্ন স্তরে আর্দ্রতা যোগায়, ত্বক plump ও dewy রাখে।' },
      { q: 'ISNTREE sunscreen কি তৈলাক্ত ত্বকে চলবে?', a: 'হ্যাঁ — হালকা, non-greasy formula তৈলাক্ত ও কম্বিনেশন ত্বকের জন্য আরামদায়ক।' },
    ],
  },
  missha: {
    about:
      'Missha is one of the established South Korean K-beauty brands, popular for accessible essences, BB creams, and its Time Revolution range. It offers dependable everyday skincare at fair prices. At Emart, Missha is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Anti-ageing & repair', href: '/concerns/anti-aging-repair' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
    ],
    faqs: [
      { q: 'Missha Time Revolution Essence কাদের জন্য?', a: 'নিস্তেজ, অসমান ও পরিণত ত্বকের জন্য — নিয়মিত ব্যবহারে ত্বক মসৃণ ও আর্দ্র দেখায়।' },
      { q: 'Missha কি authentic?', a: 'হ্যাঁ — সরাসরি import করা ১০০% original Missha, সারা বাংলাদেশে COD সহ ডেলিভারি।' },
    ],
  },
};
