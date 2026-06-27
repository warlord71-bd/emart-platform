// Editorial content for brand pages (USEO-6 Tier-1, USEO-9 Tier-2).
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

  // ── Tier-2 brands (USEO-9) ──────────────────────────────────────────────
  dabo: {
    about:
      'Dabo is a South Korean brand offering a wide range of affordable skincare, makeup, and body care. With over 160 products at Emart, Dabo covers sun protection, cleansing, moisturising, and colour cosmetics. It is a popular entry-level Korean beauty choice for shoppers looking for variety at accessible prices. At Emart, Dabo is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Sunscreen', href: '/concerns/sunscreen' },
      { label: 'Brightening', href: '/concerns/brightening' },
    ],
    faqs: [
      { q: 'Dabo কি ভালো brand?', a: 'Dabo সাশ্রয়ী দামে South Korean skincare দেয় — sunscreen, cleanser ও moisturiser ভালো মানের, বিশেষ করে শুরুর দিকে K-beauty ট্রাই করার জন্য।' },
      { q: 'Dabo-র কোন product জনপ্রিয়?', a: 'Waterproof sunscreen আর whitening cream range বাংলাদেশে চাহিদাসম্পন্ন।' },
    ],
  },
  aplb: {
    about:
      'APLB is a South Korean skincare brand focused on concentrated serums and ampoules with clearly labelled active ingredients. It is known for multi-ingredient formulas that address hydration, brightening, and anti-ageing in a single step. At Emart, APLB is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Retinol', href: '/ingredients/retinol' },
      { label: 'Peptide', href: '/ingredients/peptide' },
      { label: 'Anti-ageing & repair', href: '/concerns/anti-aging-repair' },
    ],
    faqs: [
      { q: 'APLB serum কাদের জন্য?', a: 'একাধিক active ingredient একসাথে চাইলে — retinol, peptide ও niacinamide combo serum সরাসরি নির্দিষ্ট skin concern target করে।' },
      { q: 'APLB কি সংবেদনশীল ত্বকে নিরাপদ?', a: 'বেশিরভাগ formula মৃদু হলেও retinol বা AHA-যুক্ত product শুরুতে কম মাত্রায় ব্যবহার করুন এবং patch test করুন।' },
    ],
  },
  'cos-de-baha': {
    about:
      'Cos De Baha is a US-based brand inspired by Korean skincare principles, offering potent single-active serums at an affordable price. It is popular for its high-concentration niacinamide, AHA, and azelaic acid treatments. At Emart, Cos De Baha is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Niacinamide', href: '/ingredients/niacinamide' },
      { label: 'AHA', href: '/ingredients/aha' },
      { label: 'Acne & blemish care', href: '/concerns/acne-blemish-care' },
    ],
    faqs: [
      { q: 'Cos De Baha Niacinamide serum কীভাবে কাজ করে?', a: 'উচ্চ মাত্রার niacinamide pores ছোট করে, oil control করে ও ত্বকের tone সমান করতে সাহায্য করে।' },
      { q: 'Cos De Baha কি K-beauty brand?', a: 'Korean skincare দ্বারা অনুপ্রাণিত হলেও এটি US-based — active ingredient concentration ও সাশ্রয়ী দামের জন্য পরিচিত।' },
    ],
  },
  heimish: {
    about:
      'Heimish is a South Korean brand best known for its All Clean Balm, a gentle sherbet-texture cleansing balm that melts away makeup and sunscreen. Its product line also includes toners, serums, and sun care for sensitive skin. At Emart, Heimish is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
    ],
    faqs: [
      { q: 'Heimish All Clean Balm কীভাবে ব্যবহার করব?', a: 'শুকনো মুখে ম্যাসাজ করুন, মেকআপ ও sunscreen গলে গেলে পানি দিয়ে ধুয়ে ফেলুন — double cleansing-এর প্রথম ধাপ।' },
      { q: 'Heimish কি সংবেদনশীল ত্বকে উপযোগী?', a: 'হ্যাঁ — বেশিরভাগ formula মৃদু ও low-irritation, সংবেদনশীল ত্বকের কথা মাথায় রেখে তৈরি।' },
    ],
  },
  'purito-seoul': {
    about:
      'Purito Seoul is a South Korean brand committed to gentle, skin-friendly formulas with an emphasis on centella and green-level ingredients. It is well-regarded for its lightweight sunscreens and calming serums. At Emart, Purito Seoul is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Centella', href: '/ingredients/centella' },
      { label: 'Sunscreen', href: '/concerns/sunscreen' },
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
    ],
    faqs: [
      { q: 'Purito Seoul sunscreen কেন জনপ্রিয়?', a: 'হালকা, comfortable texture আর broad-spectrum protection — প্রতিদিন ব্যবহারে ত্বকে ভারী মনে হয় না।' },
      { q: 'Purito Seoul কি centella-ভিত্তিক?', a: 'হ্যাঁ — অনেক formula centella asiatica-কে প্রধান active হিসেবে ব্যবহার করে, যা ত্বক শান্ত করতে ও lal bhab কমাতে সাহায্য করে।' },
    ],
  },
  'the-derma-co': {
    about:
      'The Derma Co is an Indian dermatologist-formulated brand offering clinical-grade actives at accessible prices. It is known for strong niacinamide, salicylic acid, and hyaluronic acid treatments for acne and hyperpigmentation. At Emart, The Derma Co is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Niacinamide', href: '/ingredients/niacinamide' },
      { label: 'BHA (salicylic acid)', href: '/ingredients/bha-salicylic-acid' },
      { label: 'Acne & blemish care', href: '/concerns/acne-blemish-care' },
    ],
    faqs: [
      { q: 'The Derma Co কাদের জন্য ভালো?', a: 'ব্রণ, dark spots ও uneven tone-এর জন্য clinical-grade treatment চাইলে — dermatologist-recommended active ingredient ব্যবহার করে।' },
      { q: 'The Derma Co কি Indian brand?', a: 'হ্যাঁ — ভারতীয় dermatologist-দের সাথে তৈরি, South Asian skin concerns ও climate মাথায় রেখে formula করা।' },
    ],
  },
  '3w-clinic': {
    about:
      '3W Clinic is a South Korean brand providing budget-friendly skincare essentials including cleansers, masks, hand creams, and sun care. It is one of the most affordable Korean beauty options. At Emart, 3W Clinic is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Collagen', href: '/ingredients/collagen' },
      { label: 'Sunscreen', href: '/concerns/sunscreen' },
    ],
    faqs: [
      { q: '3W Clinic কি ভালো quality?', a: 'সাশ্রয়ী দামে দৈনন্দিন skincare-এর জন্য reliable — sunscreen, cleanser ও sheet mask ভালো value।' },
      { q: '3W Clinic-এর কোন product ভালো?', a: 'Collagen range আর sunscreen বাংলাদেশে জনপ্রিয় — সব ধরনের ত্বকে প্রতিদিন ব্যবহারযোগ্য।' },
    ],
  },
  numbuzin: {
    about:
      'Numbuzin is a trending South Korean brand with a numbering system that makes it easy to find the right product for your concern. Its No. 3, 4, and 5 serums target pores, dark spots, and collagen respectively. At Emart, Numbuzin is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Pores & oil control', href: '/concerns/pores-oil-control' },
      { label: 'Brightening', href: '/concerns/brightening' },
      { label: 'Collagen', href: '/ingredients/collagen' },
    ],
    faqs: [
      { q: 'Numbuzin-এর number system কীভাবে কাজ করে?', a: 'প্রতিটি নম্বর একটি নির্দিষ্ট concern target করে — No. 3 pore tightening, No. 4 dark spot brightening, No. 5 collagen boosting।' },
      { q: 'Numbuzin কি বাংলাদেশে জনপ্রিয়?', a: 'হ্যাঁ — social media-তে viral হওয়া No. 3 Pore Serum আর No. 5 Collagen Serum সবচেয়ে বেশি চাহিদাসম্পন্ন।' },
    ],
  },
  simple: {
    about:
      'Simple is a UK-born skincare brand developed for sensitive skin, using no harsh chemicals, artificial perfumes, or dyes. Its cleansers, moisturisers, and micellar waters are gentle enough for everyday use. At Emart, Simple is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
    ],
    faqs: [
      { q: 'Simple কি সত্যিই sensitive skin-এর জন্য?', a: 'হ্যাঁ — কোনো harsh chemical, artificial perfume বা dye নেই; dermatologically tested ও sensitive skin-এর জন্য designed।' },
      { q: 'Simple Micellar Water কীভাবে ব্যবহার করব?', a: 'তুলায় নিয়ে মুখ মুছুন — হালকা মেকআপ, ধুলো ও দিনের ময়লা তোলে, ধোয়ার দরকার নেই।' },
    ],
  },
  'mary-and-may': {
    about:
      'Mary & May is a South Korean brand recognised for clean-ingredient sheet masks, wash-off packs, and serums built around single botanical or active. Its Idebenone + Blackberry complex and Lemon Niacinamide line are popular for glow and evenness. At Emart, Mary & May is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Niacinamide', href: '/ingredients/niacinamide' },
      { label: 'Brightening', href: '/concerns/brightening' },
    ],
    faqs: [
      { q: 'Mary & May-এর কোন product দিয়ে শুরু করব?', a: 'Idebenone + Blackberry wash-off pack আর Lemon Niacinamide Glow Serum — দুটিই glow ও brightening-এ জনপ্রিয়।' },
      { q: 'Mary & May mask কত ঘন ঘন ব্যবহার করা যায়?', a: 'Wash-off pack সপ্তাহে ২–3 বার, sheet mask প্রতিদিন বা একদিন পর পর — ত্বক dry মনে হলে বাড়ান।' },
    ],
  },
  'axis-y': {
    about:
      'Axis-Y is a South Korean brand that combines natural ingredients with science-backed formulas. Its Mugwort Pore Clarifying Wash Off Pack and Dark Spot Correcting Glow Serum are well-loved for calming, clarifying skin. At Emart, Axis-Y is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Mugwort', href: '/ingredients/mugwort' },
      { label: 'Pores & oil control', href: '/concerns/pores-oil-control' },
      { label: 'Brightening', href: '/concerns/brightening' },
    ],
    faqs: [
      { q: 'Axis-Y Mugwort Mask কাদের জন্য?', a: 'লালচে ভাব, বড় pores ও ব্রণপ্রবণ ত্বকের জন্য — mugwort ত্বক শান্ত করে ও pores পরিষ্কার করে।' },
      { q: 'Axis-Y কি vegan-friendly?', a: 'অনেক formula vegan ও cruelty-free — তবে নির্দিষ্ট product-এর label চেক করুন।' },
    ],
  },
  cetaphil: {
    about:
      'Cetaphil is an American dermatologist-recommended brand trusted for over 70 years for gentle, fragrance-free cleansers and moisturisers. It suits dry, sensitive, and eczema-prone skin. At Emart, Cetaphil is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
      { label: 'Ceramide', href: '/ingredients/ceramide' },
    ],
    faqs: [
      { q: 'Cetaphil আর CeraVe-র মধ্যে কোনটা ভালো?', a: 'দুটিই dermatologist-recommended — Cetaphil extra gentle cleanser-এ এগিয়ে, CeraVe ceramide-ভিত্তিক moisturiser-এ। ত্বকের ধরন বুঝে বেছে নিন।' },
      { q: 'Cetaphil কি প্রতিদিন ব্যবহারযোগ্য?', a: 'হ্যাঁ — Gentle Skin Cleanser আর Moisturising Lotion সকালে ও রাতে প্রতিদিন ব্যবহারের জন্য তৈরি।' },
    ],
  },
  'haruharu-wonder': {
    about:
      'Haruharu Wonder is a South Korean brand built around black rice and centella. Its Black Rice Hyaluronic Toner and anti-oxidant serums provide hydration and a healthy glow with minimal ingredients. At Emart, Haruharu Wonder is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Hyaluronic acid', href: '/ingredients/hyaluronic-acid' },
      { label: 'Centella', href: '/ingredients/centella' },
      { label: 'Dryness & hydration', href: '/concerns/dryness-hydration' },
    ],
    faqs: [
      { q: 'Haruharu Wonder Black Rice Toner কীভাবে কাজ করে?', a: 'Black rice extract antioxidant সুরক্ষা দেয় আর hyaluronic acid ত্বকে গভীর আর্দ্রতা যোগ করে — হালকা, layering-friendly।' },
      { q: 'এটি কি সব ধরনের ত্বকে চলবে?', a: 'হ্যাঁ — minimal-ingredient formula সব ধরনের ত্বকে উপযোগী, বিশেষ করে dehydrated ও dull ত্বকে ভালো ফলাফল দেয়।' },
    ],
  },
  benton: {
    about:
      'Benton is a South Korean brand focusing on fermented and natural ingredient formulas for sensitive, ageing skin. Its Snail Bee High Content Essence and Aloe line are known for calming redness and strengthening the skin barrier. At Emart, Benton is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Snail mucin', href: '/ingredients/snail-mucin' },
      { label: 'Propolis', href: '/ingredients/propolis' },
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
    ],
    faqs: [
      { q: 'Benton Snail Bee Essence কাদের জন্য?', a: 'ব্রণের দাগ, লালচে ভাব ও সংবেদনশীল ত্বকের জন্য — snail mucin ও bee venom combo ত্বক মেরামত ও শান্ত করতে সাহায্য করে।' },
      { q: 'Benton Aloe line কি তৈলাক্ত ত্বকে চলবে?', a: 'হ্যাঁ — হালকা aloe-based gel ও toner তৈলাক্ত ত্বকে refreshing ও non-greasy hydration দেয়।' },
    ],
  },
  'la-roche-posay': {
    about:
      'La Roche-Posay is a French dermatological skincare brand developed with thermal spring water for sensitive and reactive skin. Its Effaclar, Cicaplast, and Anthelios ranges are widely trusted by dermatologists. At Emart, La Roche-Posay is authentic and imported directly, with Cash on Delivery across Bangladesh.',
    links: [
      { label: 'Sensitivity', href: '/concerns/sensitivity' },
      { label: 'Acne & blemish care', href: '/concerns/acne-blemish-care' },
      { label: 'Sunscreen', href: '/concerns/sunscreen' },
    ],
    faqs: [
      { q: 'La Roche-Posay কি dermatologist-recommended?', a: 'হ্যাঁ — বিশ্বজুড়ে dermatologist-দের প্রথম পছন্দ, বিশেষ করে sensitive, acne-prone ও reactive ত্বকের জন্য।' },
      { q: 'Effaclar আর Cicaplast কোনটা লাগবে?', a: 'ব্রণ ও তৈলাক্ত ত্বকের জন্য Effaclar, আর শুষ্ক, ক্ষতিগ্রস্ত ও জ্বালাপোড়া ত্বক মেরামতের জন্য Cicaplast Baume B5।' },
    ],
  },
};
