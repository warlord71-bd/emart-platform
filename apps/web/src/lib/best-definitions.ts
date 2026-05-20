export interface BestProduct {
  rank: number;
  name: string;
  slug: string;
  brand: string;
  price: string;
  image?: string;
  imageAlt?: string;
  why: string;
  bestFor: string;
  keyIngredients?: string[];
}

export interface BestDefinition {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  updatedDate: string;
  products: BestProduct[];
  buyingGuide: string;
  bangladeshNote: string;
  faq: Array<{ q: string; a: string }>;
}

export const BEST_DEFINITIONS: BestDefinition[] = [
  {
    slug: 'sunscreen-oily-skin-bangladesh',
    title: 'Best Sunscreen for Oily Skin in Bangladesh (2026)',
    metaTitle: 'Best Sunscreen for Oily Skin in Bangladesh 2026 | No White Cast',
    description:
      'The best sunscreens for oily skin in Bangladesh: lightweight, no white cast, and tested in Dhaka\'s humid climate. SPF50 PA++++ picks with BDT prices and Cash on Delivery.',
    intro:
      'Finding a good sunscreen for oily skin in Bangladesh is a challenge. Dhaka\'s heat and 70–85% humidity means any heavy, greasy sunscreen will break down your skin within hours. After reviewing dozens of products and filtering by what Bangladeshi customers actually repurchase, here are the top picks that stay matte, feel lightweight, and protect against Bangladesh\'s intense UV index (regularly above 8).',
    updatedDate: '2026-05-19',
    products: [
      {
        rank: 1,
        name: 'Beauty of Joseon Relief Sun: Rice + Probiotics SPF50 PA++++',
        slug: 'beauty-of-joseon-sunscreen-rice-probiotics-spf-50-50ml',
        brand: 'Beauty of Joseon',
        price: '৳1,390',
        image: 'https://e-mart.com.bd/wp-content/uploads/2026/05/365.jpg',
        imageAlt: 'Beauty of Joseon Relief Sun Rice Probiotics SPF50 sunscreen in Bangladesh',
        why: 'Our #1 best-selling sunscreen overall. Ultra-lightweight watery texture, zero white cast, and a subtle brightening effect from rice bran. Absorbs in seconds and doesn\'t look greasy in Dhaka\'s humidity. PA++++ rating gives maximum UVA protection.',
        bestFor: 'Oily, combination, and normal skin',
        keyIngredients: ['Rice Bran Water', 'Probiotics', 'Niacinamide'],
      },
      {
        rank: 2,
        name: 'Beauty of Joseon Matte Sun Stick: Mugwort + Camellia SPF50 PA++++',
        slug: 'beauty-of-joseon-matte-sun-stick-mugwortcamelia18g-0-63fl-oz',
        brand: 'Beauty of Joseon',
        price: '৳1,290',
        image: 'https://e-mart.com.bd/wp-content/uploads/2023/04/4178-5P0TqL-1.jpg',
        imageAlt: 'Beauty of Joseon Matte Sun Stick Mugwort Camellia SPF50 sunscreen stick',
        why: 'The best reapplication sunscreen in Bangladesh. Stick format means you can top up SPF over makeup without disturbing it. Mugwort extract calms oily, acne-prone skin. Zero mess, zero white cast.',
        bestFor: 'On-the-go reapplication, oily skin, acne-prone skin',
        keyIngredients: ['Mugwort Extract', 'Camellia Oil', 'UV Filters'],
      },
      {
        rank: 3,
        name: 'ANUA Airy Sun Cream 50ml',
        slug: 'anua-airy-sun-cream-50ml',
        brand: 'Anua',
        price: '৳1,700',
        image: 'https://e-mart.com.bd/wp-content/uploads/2026/02/ANSM01-SCA.jpeg',
        imageAlt: 'ANUA Airy Sun Cream 50ml sunscreen for oily skin in Bangladesh',
        why: 'Heartleaf (houttuynia cordata) soothes oily, acne-prone skin while the lightweight formula delivers SPF50 PA++++. Excellent for sensitive-oily combination, and the clean finish holds well in Bangladesh\'s monsoon.',
        bestFor: 'Sensitive-oily skin, acne-prone skin',
        keyIngredients: ['Heartleaf Extract (77%)', 'Centella', 'UV Filters'],
      },
      {
        rank: 4,
        name: 'COSRX Aloe Soothing SPF50 PA+++ Sun Cream 50ml',
        slug: 'cosrx-aloe-soothing-spf50-pa-sun-cream-50ml',
        brand: 'COSRX',
        price: '৳1,000',
        image: 'https://e-mart.com.bd/wp-content/uploads/2022/04/41JGrbwwqDL._SL1000_.jpg',
        imageAlt: 'COSRX Aloe Soothing SPF50 PA+++ Sun Cream 50ml in Bangladesh',
        why: 'High aloe vera content (73%) makes this the most soothing sunscreen for reactive oily skin. Slightly less matte than BOJ Relief Sun but more calming for skin that breaks out easily. PA+++ (triple plus) is still strong UVA protection.',
        bestFor: 'Sensitive-oily skin, acne-prone skin with redness',
        keyIngredients: ['Aloe Vera (73%)', 'Glycerin', 'UV Filters'],
      },
      {
        rank: 5,
        name: 'Purito Daily Go-To Sunscreen SPF50 PA++++',
        slug: 'purito-daily-go-to-sunscreen-spf-50-pa-60-ml',
        brand: 'Purito',
        price: '৳1,700',
        image: 'https://e-mart.com.bd/wp-content/uploads/2026/02/emart-purito-daily-go-to-sunscreen-spf-50-pa-60-ml.jpg',
        imageAlt: 'Purito Daily Go-To Sunscreen SPF50 PA++++ 60ml in Bangladesh',
        why: 'Clean formula with minimal ingredients — great if you\'re sensitive to fragrances or heavy actives. The "go-to" name is earned: comfortable enough for daily use, and the 60ml size gives you more product than most Korean sunscreens.',
        bestFor: 'Minimalist routines, sensitive oily skin',
        keyIngredients: ['Zinc Oxide (partial)', 'Squalane', 'UV Filters'],
      },
    ],
    buyingGuide:
      'When choosing a sunscreen for oily skin in Bangladesh, prioritise: (1) PA++++ rating — crucial for UVA protection against Bangladesh\'s year-round intense sun; (2) Non-comedogenic formula — look for "oil-free" or "non-comedogenic" on the label; (3) Chemical sunscreen — these tend to be lighter than mineral-only formulas; (4) Lightweight texture — gel or watery formulas absorb faster and feel less heavy in high humidity. Avoid thick white sunscreens marketed for "outdoor" use — they block pores and look cakey in Bangladesh\'s heat.',
    bangladeshNote:
      'All sunscreens listed are available at Emart with authenticity verification. Cash on Delivery is available across Bangladesh. We recommend applying sunscreen as the final step in your morning routine, every day — including during monsoon, when UV rays still penetrate cloud cover.',
    faq: [
      {
        q: 'Which sunscreen has no white cast for dark skin in Bangladesh?',
        a: 'Beauty of Joseon Relief Sun and Anua Heartleaf Daily Sun Cream both have minimal to zero white cast and are designed for Asian skin tones. They\'re the most popular choices among Bangladeshi shoppers with medium-to-dark complexions.',
      },
      {
        q: 'How often should I reapply sunscreen in Bangladesh?',
        a: 'Every 2–3 hours when outdoors, or after sweating heavily. The Beauty of Joseon Matte Sun Stick is ideal for reapplication — it goes over makeup without smudging and takes seconds.',
      },
      {
        q: 'Is SPF30 enough in Bangladesh?',
        a: 'No. Bangladesh\'s UV index regularly exceeds 8 (Very High to Extreme). Dermatologists recommend SPF50+ with PA+++ or PA++++ for daily use in Bangladesh. SPF30 blocks roughly 97% of UVB; SPF50 blocks 98% — but in intense UV conditions, that 1% matters.',
      },
      {
        q: 'Do I need sunscreen on cloudy days in Bangladesh?',
        a: 'Yes. Up to 80% of UV rays penetrate through cloud cover. During Bangladesh\'s monsoon season, UV damage continues even on overcast days. Apply sunscreen daily regardless of weather.',
      },
    ],
  },
  {
    slug: 'cleanser-oily-skin-bangladesh',
    title: 'Best Face Wash for Oily Skin in Bangladesh (2026)',
    metaTitle: 'Best Face Wash for Oily Skin in Bangladesh 2026 | Gel Cleanser Picks',
    description:
      'The best face washes for oily skin in Bangladesh — low-pH gel cleansers that control shine without stripping. Picks tested for Dhaka\'s humidity with BDT prices and COD.',
    intro:
      'Over-cleansing and harsh face washes are the #1 mistake oily skin types in Bangladesh make. Stripping the skin of oil causes rebound oiliness, breakouts, and a damaged barrier. The best face washes for oily skin are gentle enough to use twice daily — balancing oil without drying out your skin in Bangladesh\'s variable climate.',
    updatedDate: '2026-05-19',
    products: [
      {
        rank: 1,
        name: 'COSRX Low pH Good Morning Gel Cleanser',
        slug: 'cosrx-low-ph-good-morning-gel-cleanser-150ml',
        brand: 'COSRX',
        price: '৳890',
        why: 'Bangladesh\'s best-selling gel cleanser for oily skin. Low pH (around 5.0) preserves the skin\'s acid mantle, while betaine salicylate gently unclogs pores. Minimal foam, rinses clean, no tight feeling. 150ml lasts 2–3 months.',
        bestFor: 'Oily skin, acne-prone skin, morning cleansing',
        keyIngredients: ['Tea Tree Oil', 'Betaine Salicylate (BHA)', 'Low pH formulation'],
      },
      {
        rank: 2,
        name: 'Some By Mi AHA BHA PHA 30 Days Miracle Toning Cleanser',
        slug: 'some-by-mi-aha-bha-pha-30-days-miracle-toning-cleanser-150ml',
        brand: 'Some By Mi',
        price: '৳990',
        why: 'Triple acid exfoliating cleanser — AHA, BHA, and PHA work together to clear pores, remove dead skin cells, and improve skin texture. Best used in the evening. Particularly effective if you have acne + oiliness.',
        bestFor: 'Oily-acne skin needing exfoliation, evening cleanse',
        keyIngredients: ['AHA (Glycolic)', 'BHA (Salicylic)', 'PHA', 'Centella'],
      },
      {
        rank: 3,
        name: 'CeraVe Foaming Facial Cleanser',
        slug: 'cerave-foaming-facial-cleanser-473ml',
        brand: 'CeraVe',
        price: '৳1,990',
        why: 'The most gentle foaming cleanser for oily skin. Removes excess oil without stripping the barrier, thanks to ceramides and niacinamide. Suitable for oily skin that also needs barrier support. Large 473ml bottle makes it economical.',
        bestFor: 'Oily-sensitive combination, barrier-compromised oily skin',
        keyIngredients: ['Ceramides (1, 3, 6-II)', 'Niacinamide', 'Hyaluronic Acid'],
      },
      {
        rank: 4,
        name: 'Torriden Dive-In Low Molecular Hyaluronic Acid Cleansing Foam',
        slug: 'torriden-dive-in-low-molecular-hyaluronic-acid-cleansing-foam-150ml',
        brand: 'Torriden',
        price: '৳1,090',
        why: 'Unique positioning: a cleansing foam that adds hydration while cleaning. Low molecular hyaluronic acid penetrates while cleansing, ideal for oily-dehydrated skin — common in air-conditioned Dhaka offices where the skin dries out despite being oily.',
        bestFor: 'Oily-dehydrated skin, office workers in AC environments',
        keyIngredients: ['5-Type Hyaluronic Acid', 'Panthenol'],
      },
      {
        rank: 5,
        name: 'Isntree Hyaluronic Acid Watery Sun Gel SPF50',
        slug: 'isntree-hyaluronic-acid-watery-sun-gel-spf50-pa-50ml',
        brand: 'Isntree',
        price: '৳1,390',
        why: 'A hybrid sun-gel for oily skin — SPF50 protection in a watery gel that doubles as your moisturiser step. Reduces routine length which matters in Bangladesh\'s rushed morning routines.',
        bestFor: 'Minimal routine oily skin, sun + moisture in one',
        keyIngredients: ['Hyaluronic Acid', 'Centella', 'UV Filters'],
      },
    ],
    buyingGuide:
      'For oily skin in Bangladesh: use a gel cleanser (not cream, not soap) twice daily. Your cleanser should leave skin feeling clean — not tight, not squeaky. Tight = stripped barrier = more oil. Look for low pH (pH 5.0–6.0), sulfate-free formulas. Avoid foam cleansers with sodium lauryl sulfate (SLS) as the first surfactant — they\'re too stripping. If you exercise outdoors, double cleanse: micellar water first, then gel cleanser.',
    bangladeshNote:
      'Face wash is the highest-repurchase skincare category in Bangladesh. All products listed are authentic and available at Emart with Cash on Delivery. The COSRX Low pH Cleanser is our top seller for oily skin. Buy in pairs to save on delivery cost.',
    faq: [
      {
        q: 'How many times a day should I wash my face if I have oily skin in Bangladesh?',
        a: 'Twice — morning and evening. More than twice strips the skin barrier and triggers rebound oil production. If you exercise and sweat heavily, a third gentle rinse is fine, but use water or micellar water rather than a foaming cleanser.',
      },
      {
        q: 'Is the COSRX Low pH Cleanser good for acne?',
        a: 'Yes. Betaine salicylate (a BHA derivative) in the COSRX cleanser gently exfoliates inside the pore and helps prevent blackheads and whiteheads. It\'s not a treatment-level acne product but is excellent as a preventive daily cleanser for acne-prone skin.',
      },
      {
        q: 'Can I use a gel cleanser if I wear makeup in Bangladesh?',
        a: 'Yes — but double cleanse. Use micellar water or cleansing oil first to dissolve sunscreen and makeup, then follow with your gel cleanser. This two-step method ensures all residue is removed without over-stripping.',
      },
      {
        q: 'Is CeraVe or COSRX better for oily skin?',
        a: 'COSRX Low pH Gel Cleanser is generally preferred for oily skin in Bangladesh. The low pH and BHA content are more aligned with oily-acne skin needs. CeraVe Foaming Cleanser is a good alternative if you need ceramide-based barrier support alongside oil control.',
      },
    ],
  },
  {
    slug: 'moisturiser-oily-skin-bangladesh',
    title: 'Best Moisturiser for Oily Skin in Bangladesh (2026)',
    metaTitle: 'Best Moisturiser for Oily Skin in Bangladesh 2026 | Lightweight Gel Picks',
    description:
      'Best moisturisers for oily skin in Bangladesh — lightweight gel formulas that hydrate without greasiness. Tested in Dhaka\'s humidity with BDT prices and Cash on Delivery.',
    intro:
      'Skipping moisturiser when you have oily skin is the biggest skincare mistake. Without hydration, your skin overproduces oil to compensate — making you shinier and more breakout-prone. The best moisturisers for oily skin in Bangladesh are lightweight gel or gel-cream formulas that add water without adding oil, absorb quickly in humidity, and don\'t break up under sunscreen.',
    updatedDate: '2026-05-19',
    products: [
      {
        rank: 1,
        name: 'COSRX Advanced Snail 96 Mucin Power Essence',
        slug: 'cosrx-advanced-snail-96-mucin-power-essence-100ml',
        brand: 'COSRX',
        price: '৳1,750',
        why: 'Often used as a lightweight moisturiser step for oily skin — 96% snail mucin is intensely hydrating but non-comedogenic and non-greasy. Also repairs the skin barrier and fades post-acne marks. Doubles as a serum. Perfect for Bangladesh\'s hot months.',
        bestFor: 'Oily skin with post-acne marks, barrier-damaged skin',
        keyIngredients: ['Snail Secretion Filtrate (96%)', 'Sodium Hyaluronate'],
      },
      {
        rank: 2,
        name: 'Skin1004 Madagascar Centella Hyalu-Cica Water-Gel',
        slug: 'skin1004-madagascar-centella-hyalu-cica-water-gel-100ml',
        brand: 'Skin1004',
        price: '৳1,390',
        why: 'A true water-gel formula — 75% centella asiatica and hyaluronic acid without heavy emollients. Melts into skin instantly, leaves no film, and is the ideal hot-weather moisturiser for Dhaka summers. Non-comedogenic and fragrance-free.',
        bestFor: 'Oily skin in summer/monsoon, acne-prone skin',
        keyIngredients: ['Centella Asiatica (75%)', 'Hyaluronic Acid', 'Panthenol'],
      },
      {
        rank: 3,
        name: 'Anua Heartleaf 77% Soothing Toner',
        slug: 'anua-heartleaf-77-soothing-toner-250ml',
        brand: 'Anua',
        price: '৳1,290',
        why: 'Used as a hydrating toner + lightweight moisturiser step. 77% heartleaf content calms oily-acne skin, reduces redness, and keeps skin hydrated without heaviness. Bangladesh\'s most popular toner for oily skin.',
        bestFor: 'Oily-sensitive skin, simplified routine, hot months',
        keyIngredients: ['Heartleaf Extract (77%)', 'Niacinamide', 'Hyaluronic Acid'],
      },
      {
        rank: 4,
        name: 'COSRX Centella Blemish Ampule',
        slug: 'cosrx-centella-blemish-ampule-20ml',
        brand: 'COSRX',
        price: '৳990',
        why: 'Concentrated centella ampule that works as a targeted spot treatment and lightweight hydrator for acne-oily skin. Anti-inflammatory and antibacterial. Use as a pre-moisturiser step or as standalone light hydration in peak summer.',
        bestFor: 'Acne-oily skin, targeted blemish treatment',
        keyIngredients: ['Centella Asiatica Extract', 'Panthenol', 'Niacinamide'],
      },
      {
        rank: 5,
        name: 'The Ordinary Natural Moisturizing Factors + HA',
        slug: 'the-ordinary-natural-moisturizing-factors-ha-100ml',
        brand: 'The Ordinary',
        price: '৳990',
        why: 'The most affordable lightweight moisturiser on this list. Amino acids, fatty acids, and hyaluronic acid in a minimal formula. No fragrance, no unnecessary actives. Great for budget-conscious shoppers who want basic effective hydration.',
        bestFor: 'Budget-conscious oily skin, minimal ingredient preference',
        keyIngredients: ['Amino Acids', 'Fatty Acids', 'Hyaluronic Acid (HA)'],
      },
    ],
    buyingGuide:
      'For oily skin in Bangladesh, choose moisturisers described as: gel, water-gel, gel-cream, or essence. Avoid: cream, rich cream, butter, balm, or oil. Key ingredients to look for: hyaluronic acid, centella asiatica, niacinamide, snail mucin, ceramides. Avoid: coconut oil, mineral oil, petrolatum as top ingredients, and fragrance. Apply moisturiser to slightly damp skin for better absorption. In Bangladesh\'s peak summer (March–June), you may prefer to skip a dedicated moisturiser and rely on snail mucin essence alone.',
    bangladeshNote:
      'All products are available at Emart with Cash on Delivery. Many oily skin customers in Bangladesh skip moisturiser in summer — this is a common mistake. Even in Dhaka\'s humid monsoon, your skin needs humectants (like hyaluronic acid) to stay healthy and avoid barrier damage from environmental pollution.',
    faq: [
      {
        q: 'Do I really need moisturiser if my skin is already oily in Bangladesh?',
        a: 'Yes. Oily skin and dehydrated skin are different things. Your skin can be oily on the surface but still lack water in the deeper layers. Without a lightweight moisturiser, your skin overproduces oil to compensate. Use a gel-type moisturiser — it hydrates without adding oiliness.',
      },
      {
        q: 'Can I use snail mucin as a moisturiser for oily skin?',
        a: 'Yes — COSRX Snail 96 Mucin is lightweight enough to serve as a moisturiser step for oily skin in Bangladesh\'s climate, especially in summer. It hydrates, repairs, and fades marks without clogging pores.',
      },
      {
        q: 'Should I apply moisturiser before or after sunscreen?',
        a: 'Moisturiser goes before sunscreen. Final morning routine order: cleanser → toner → serum/essence → moisturiser → sunscreen. Sunscreen is always last in the morning.',
      },
      {
        q: 'Which centella moisturiser is best for oily-acne skin in Bangladesh?',
        a: 'Skin1004 Madagascar Centella Hyalu-Cica Water-Gel is our top pick — it\'s 75% centella, non-comedogenic, and has a near-invisible water-gel texture perfect for Bangladesh\'s humid climate.',
      },
    ],
  },
];

export function getBestBySlug(slug: string): BestDefinition | undefined {
  return BEST_DEFINITIONS.find((b) => b.slug === slug);
}
